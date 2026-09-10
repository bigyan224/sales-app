import { billRepository } from '../db/billRepository';
import { productRepository } from '../db/productRepository';
import { saleRepository } from '../db/saleRepository';
import { api } from './api';
import { flushPendingBillUploads, flushPendingProductUploads } from './imageService';

/**
 * Callbacks the sync store registers so the service can report progress.
 * Using a bind callback keeps `syncService` free of store imports (no cycles).
 *
 * @typedef {{
 *   setStatus: (status: 'idle'|'syncing'|'synced'|'error'|'offline') => void,
 *   setError: (message: string|null) => void,
 *   setLastSyncAt: (iso: string) => void,
 *   setPendingCount: (count: number) => void,
 *   isOnline: () => boolean,
 *   probeOnline?: () => Promise<boolean>,
 * }} SyncStoreUpdater
 */

/** Backoff schedule for automatic retries after a failed/offline sync. */
const RETRY_DELAYS_MS = [15000, 30000, 60000, 120000];

class SyncService {
  constructor() {
    this.running = false;
    this.updater = null;
    this.retryTimer = null;
    this.retryAttempt = 0;
  }

  bind(updater) {
    this.updater = updater;
  }

  isRunning() {
    return this.running;
  }

  /**
   * Failed/offline syncs retry automatically with backoff. This covers Render
   * free-tier cold-start timeouts and reconnects the OS never announced —
   * without it, records created offline could stay unsynced indefinitely.
   */
  scheduleRetry() {
    if (this.retryTimer) return;
    const delay =
      RETRY_DELAYS_MS[Math.min(this.retryAttempt, RETRY_DELAYS_MS.length - 1)];
    this.retryAttempt += 1;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      void this.syncNow();
    }, delay);
  }

  clearRetry() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.retryAttempt = 0;
  }

  /** Runs a full push-then-pull sync. Safe to call concurrently/while offline. */
  async syncNow() {
    const updater = this.updater;
    if (!updater || this.running) return;

    if (!updater.isOnline()) {
      // Never trust a stale offline flag: ask the OS for the truth. If we were
      // wrong (missed reconnect event), continue with the sync instead of
      // silently dropping it.
      const actuallyOnline =
        typeof updater.probeOnline === 'function'
          ? await updater.probeOnline()
          : false;
      if (!actuallyOnline) {
        updater.setStatus('offline');
        await this.refreshPendingCount();
        this.scheduleRetry();
        return;
      }
    }

    this.running = true;
    updater.setStatus('syncing');
    updater.setError(null);

    try {
      // 1. Push local changes.
      const pending = await saleRepository.getPendingSales();
      const tombstones = await saleRepository.getDeletedTombsones();
      const toPush = [...pending, ...tombstones];

      if (toPush.length > 0) {
        const results = await api.pushBatch(toPush);
        const syncedIds = [];
        const deletedIds = [];
        for (const result of results) {
          if (result.status === 'synced' || result.status === 'up-to-date') {
            syncedIds.push(result.id);
          } else if (result.status === 'deleted') {
            deletedIds.push(result.id);
          }
        }
        if (syncedIds.length > 0) {
          await saleRepository.markSynced(syncedIds);
        }
        for (const id of deletedIds) {
          await saleRepository.hardDeleteSale(id);
        }
      }

      // 2. Pull server changes (including tombstones).
      const since = await saleRepository.getLastSyncAt();
      const remote = await api.fetchRemote(since);
      await saleRepository.applyRemoteSales(remote.sales);

      const now = new Date().toISOString();
      await saleRepository.setLastSyncAt(now);
      updater.setLastSyncAt(now);

      // 3. Sync products in its own scope so a product problem can never
      // block or fail the sales sync above.
      try {
        await syncProducts();
        await flushPendingProductUploads();
      } catch (productErr) {
        console.error('[sync] products failed:', productErr?.message ?? productErr);
      }

      // 4. Sync bills in its own scope, same isolation as products.
      try {
        await syncBills();
        await flushPendingBillUploads();
      } catch (billErr) {
        console.error('[sync] bills failed:', billErr?.message ?? billErr);
      }

      updater.setStatus('synced');
      this.clearRetry();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      updater.setError(message);
      updater.setStatus('error');
      this.scheduleRetry();
    } finally {
      this.running = false;
      await this.refreshPendingCount();
    }
  }

  async refreshPendingCount() {
    if (!this.updater) return;
    const count = await saleRepository.getPendingCount();
    this.updater.setPendingCount(count);
  }
}

/** Push-then-pull for products, mirroring the sales flow. */
async function syncProducts() {
  const pending = await productRepository.getPendingProducts();
  const tombstones = await productRepository.getDeletedTombstones();
  const toPush = [...pending, ...tombstones];

  if (toPush.length > 0) {
    const results = await api.pushProductBatch(toPush);
    const syncedIds = [];
    const deletedIds = [];
    for (const result of results) {
      if (result.status === 'synced' || result.status === 'up-to-date') {
        syncedIds.push(result.id);
      } else if (result.status === 'deleted') {
        deletedIds.push(result.id);
      }
    }
    if (syncedIds.length > 0) {
      await productRepository.markSynced(syncedIds);
    }
    for (const id of deletedIds) {
      await productRepository.hardDeleteProduct(id);
    }
  }

  const since = await productRepository.getLastSyncAt();
  const remote = await api.fetchRemoteProducts(since);
  await productRepository.applyRemoteProducts(remote.products ?? []);
  await productRepository.setLastSyncAt(new Date().toISOString());
}

/** Push-then-pull for bills, mirroring the sales flow. */
async function syncBills() {
  const pending = await billRepository.getPendingBills();
  const tombstones = await billRepository.getDeletedTombstones();
  const toPush = [...pending, ...tombstones];

  if (toPush.length > 0) {
    const results = await api.pushBillBatch(toPush);
    const syncedIds = [];
    const deletedIds = [];
    for (const result of results) {
      if (result.status === 'synced' || result.status === 'up-to-date') {
        syncedIds.push(result.id);
      } else if (result.status === 'deleted') {
        deletedIds.push(result.id);
      }
    }
    if (syncedIds.length > 0) {
      await billRepository.markSynced(syncedIds);
    }
    for (const id of deletedIds) {
      await billRepository.hardDeleteBill(id);
    }
  }

  const since = await billRepository.getLastSyncAt();
  const remote = await api.fetchRemoteBills(since);
  await billRepository.applyRemoteBills(remote.bills ?? []);
  await billRepository.setLastSyncAt(new Date().toISOString());
}

export const syncService = new SyncService();
