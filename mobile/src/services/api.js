import axios from 'axios';
import { API_FALLBACK_URL, API_PRIMARY_URL, PULL_LIMIT } from '../config';

/**
 * Failover clients: try laptop (Funnel, fast, no sleep) first, then Render
 * free (cold starts 30-50s). Both share the same MongoDB Atlas, and all
 * writes are idempotent (client UUID + last-write-wins), so retrying a timed
 * out POST on the fallback can never create duplicates.
 */

const primary = axios.create({
  baseURL: API_PRIMARY_URL,
  // Short: laptop is either reachable in seconds or offline.
  timeout: 7000,
  headers: { 'Content-Type': 'application/json' },
});

const fallback = axios.create({
  baseURL: API_FALLBACK_URL,
  // Generous enough to survive a cold-starting free-tier server (~30-50 s);
  // anything slower is handled by the sync engine's retry backoff.
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

/** Only fail over on network/timeout/5xx — never on 4xx (client error). */
function shouldFailOver(err) {
  if (!err) return true;
  // No response = offline, DNS, timeout.
  if (!err.response) return true;
  const status = err.response.status;
  return status >= 500;
}

/**
 * Manual server choice. 'auto' (default) keeps previous behavior: primary
 * first, fallback on network/5xx. 'primary'/'fallback' pin to one backend.
 * Set via `setServerMode` from the server store / UI. No Switch component.
 */
let serverMode = 'auto';
let lastActive = null;

export function setServerMode(mode) {
  if (mode === 'primary' || mode === 'fallback' || mode === 'auto') {
    serverMode = mode;
  }
}

export function getServerMode() {
  return serverMode;
}

export function getLastActiveServer() {
  return lastActive;
}

async function withFailover(fn) {
  const run = async (client, name) => {
    const result = await fn(client);
    lastActive = name;
    return result;
  };
  if (serverMode === 'primary') {
    return run(primary, 'primary');
  }
  if (serverMode === 'fallback') {
    return run(fallback, 'fallback');
  }
  try {
    return await run(primary, 'primary');
  } catch (err) {
    if (!shouldFailOver(err)) throw err;
    return run(fallback, 'fallback');
  }
}

/** Probe each backend individually for the server status UI. */
export async function checkServers() {
  const probe = async (client) => {
    try {
      await client.get('/health', { timeout: 6000 });
      return true;
    } catch {
      return false;
    }
  };
  const [primaryOnline, fallbackOnline] = await Promise.all([
    probe(primary),
    probe(fallback),
  ]);
  return { primaryOnline, fallbackOnline };
}

export const api = {
  /** Pushes local changes (edits + delete tombstones) to the server. */
  async pushBatch(sales) {
    const { data } = await withFailover((c) =>
      c.post('/sales/batch-sync', { sales }),
    );
    return data.results;
  },

  /** Pulls records updated after `since` (null = everything). */
  async fetchRemote(since) {
    const { data } = await withFailover((c) =>
      c.get('/sales', {
        params: { since: since ?? undefined, limit: PULL_LIMIT },
      }),
    );
    return data;
  },

  /** Pushes local product changes (edits + delete tombstones) to the server. */
  async pushProductBatch(products) {
    const { data } = await withFailover((c) =>
      c.post('/products/batch-sync', { products }),
    );
    return data.results;
  },

  /** Pulls products updated after `since` (null = everything). */
  async fetchRemoteProducts(since) {
    const { data } = await withFailover((c) =>
      c.get('/products', {
        params: { since: since ?? undefined, limit: PULL_LIMIT },
      }),
    );
    return data;
  },

  /** Pushes local bill changes (edits + delete tombstones) to the server. */
  async pushBillBatch(bills) {
    const { data } = await withFailover((c) =>
      c.post('/bills/batch-sync', { bills }),
    );
    return data.results;
  },

  /** Pulls bills updated after `since` (null = everything). */
  async fetchRemoteBills(since) {
    const { data } = await withFailover((c) =>
      c.get('/bills', {
        params: { since: since ?? undefined, limit: PULL_LIMIT },
      }),
    );
    return data;
  },

  /** Reports whether any backend is reachable (primary first). */
  async ping() {
    try {
      await primary.get('/health', { timeout: 5000 });
      return true;
    } catch {
      try {
        await fallback.get('/health', { timeout: 8000 });
        return true;
      } catch {
        return false;
      }
    }
  },
};
