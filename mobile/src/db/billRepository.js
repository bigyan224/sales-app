import { getDatabase } from './database';

const INSERT_COLUMNS =
  'id, name, bs_date, ad_date, notes, image_url, local_image_uri, created_at, updated_at, sync_status, deleted_at';

function rowToBill(row) {
  return {
    id: row.id,
    name: row.name,
    bsDate: row.bs_date,
    adDate: row.ad_date ?? null,
    notes: row.notes ?? null,
    imageUrl: row.image_url ?? null,
    // Device-local only; never sent to the server.
    localImageUri: row.local_image_uri ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
    deletedAt: row.deleted_at ?? null,
  };
}

function billToParams(bill) {
  return [
    bill.id,
    bill.name,
    bill.bsDate,
    bill.adDate,
    bill.notes,
    bill.imageUrl,
    bill.localImageUri ?? null,
    bill.createdAt,
    bill.updatedAt,
    bill.syncStatus,
    bill.deletedAt,
  ];
}

export async function insertBill(bill) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO bills (${INSERT_COLUMNS}) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    billToParams(bill),
  );
}

/** Inserts or replaces a bill row (used by pull sync). */
export async function upsertBill(bill) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO bills (${INSERT_COLUMNS}) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    billToParams(bill),
  );
}

export async function updateBill(bill) {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE bills SET name=?, bs_date=?, ad_date=?, notes=?,
     image_url=?, local_image_uri=?, created_at=?, updated_at=?, sync_status=?, deleted_at=?
     WHERE id=?`,
    [
      bill.name,
      bill.bsDate,
      bill.adDate,
      bill.notes,
      bill.imageUrl,
      bill.localImageUri ?? null,
      bill.createdAt,
      bill.updatedAt,
      bill.syncStatus,
      bill.deletedAt,
      bill.id,
    ],
  );
}

export async function getBillById(id) {
  const db = await getDatabase();
  const row = await db.getFirstAsync('SELECT * FROM bills WHERE id = ?', [id]);
  return row ? rowToBill(row) : null;
}

/** Newest bills first. */
export async function getAllActiveBills() {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    'SELECT * FROM bills WHERE deleted_at IS NULL ORDER BY bs_date DESC, created_at DESC',
  );
  return rows.map(rowToBill);
}

/** Records that still need to be pushed to the server. */
export async function getPendingBills() {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    "SELECT * FROM bills WHERE sync_status = 'pending' ORDER BY updated_at ASC",
  );
  return rows.map(rowToBill);
}

/** Locally deleted records waiting to be propagated to the server. */
export async function getDeletedTombstones() {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    "SELECT * FROM bills WHERE sync_status = 'deleted' ORDER BY updated_at ASC",
  );
  return rows.map(rowToBill);
}

export async function markSynced(ids) {
  if (ids.length === 0) return;
  const db = await getDatabase();
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(
    `UPDATE bills SET sync_status = 'synced' WHERE id IN (${placeholders})`,
    ids,
  );
}

export async function softDeleteBill(id) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    "UPDATE bills SET sync_status='deleted', deleted_at=? WHERE id=? AND deleted_at IS NULL",
    [now, id],
  );
}

export async function hardDeleteBill(id) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM bills WHERE id = ?', [id]);
}

/** Photos picked offline wait here until a successful sync uploads them. */
export async function getBillsWithLocalImageOnly() {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    'SELECT * FROM bills WHERE deleted_at IS NULL AND local_image_uri IS NOT NULL AND image_url IS NULL',
  );
  return rows.map(rowToBill);
}

/** Stores the uploaded photo URL and queues the record for the next push. */
export async function setImageUrl(id, imageUrl) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    "UPDATE bills SET image_url=?, updated_at=?, sync_status='pending' WHERE id=?",
    [imageUrl, now, id],
  );
}

export async function getLastSyncAt() {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    "SELECT value FROM sync_meta WHERE key = 'last_bills_sync_at'",
  );
  return row ? row.value : null;
}

export async function setLastSyncAt(iso) {
  const db = await getDatabase();
  await db.runAsync(
    "INSERT OR REPLACE INTO sync_meta (key, value) VALUES ('last_bills_sync_at', ?)",
    [iso],
  );
}

/**
 * Applies remote bills pulled from the server. Local unsynced edits are never
 * clobbered; they stay pending and win the next push.
 */
export async function applyRemoteBills(remote) {
  for (const remoteBill of remote) {
    if (remoteBill.syncStatus === 'deleted') {
      const local = await getBillById(remoteBill.id);
      if (local && local.syncStatus !== 'synced') continue;
      await hardDeleteBill(remoteBill.id);
    } else {
      const local = await getBillById(remoteBill.id);
      if (local && local.syncStatus !== 'synced' && local.updatedAt > remoteBill.updatedAt) {
        continue;
      }
      // Preserve the device-local photo path across pull upserts.
      const localImageUri = local?.localImageUri ?? null;
      await upsertBill({
        ...remoteBill,
        localImageUri,
        syncStatus: 'synced',
        deletedAt: null,
      });
    }
  }
}

/** Aggregate object so stores/services can import a single `billRepository`. */
export const billRepository = {
  insertBill,
  upsertBill,
  updateBill,
  getBillById,
  getAllActiveBills,
  getPendingBills,
  getDeletedTombstones,
  markSynced,
  softDeleteBill,
  hardDeleteBill,
  getBillsWithLocalImageOnly,
  setImageUrl,
  getLastSyncAt,
  setLastSyncAt,
  applyRemoteBills,
};
