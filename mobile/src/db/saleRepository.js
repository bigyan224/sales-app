import { getDatabase } from './database';

const INSERT_COLUMNS =
  'id, bs_date, ad_date, title, sales_amount, profit, payment_status, created_at, updated_at, sync_status, deleted_at';

function rowToSale(row) {
  return {
    id: row.id,
    bsDate: row.bs_date,
    adDate: row.ad_date,
    title: row.title ?? null,
    salesAmount: Number(row.sales_amount),
    profit: row.profit == null ? null : Number(row.profit),
    paymentStatus: row.payment_status ?? 'paid',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
    deletedAt: row.deleted_at ?? null,
  };
}

function saleToParams(sale) {
  return [
    sale.id,
    sale.bsDate,
    sale.adDate,
    sale.title,
    sale.salesAmount,
    sale.profit,
    sale.paymentStatus ?? 'paid',
    sale.createdAt,
    sale.updatedAt,
    sale.syncStatus,
    sale.deletedAt,
  ];
}

export async function insertSale(sale) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO sales (${INSERT_COLUMNS}) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    saleToParams(sale),
  );
}

/** Inserts or replaces a sale row (used by pull sync and backup import). */
export async function upsertSale(sale) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO sales (${INSERT_COLUMNS}) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    saleToParams(sale),
  );
}

export async function updateSale(sale) {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE sales SET bs_date=?, ad_date=?, title=?, sales_amount=?, profit=?,
     payment_status=?, created_at=?, updated_at=?, sync_status=?, deleted_at=? WHERE id=?`,
    [
      sale.bsDate,
      sale.adDate,
      sale.title,
      sale.salesAmount,
      sale.profit,
      sale.paymentStatus ?? 'paid',
      sale.createdAt,
      sale.updatedAt,
      sale.syncStatus,
      sale.deletedAt,
      sale.id,
    ],
  );
}

export async function getSaleById(id) {
  const db = await getDatabase();
  const row = await db.getFirstAsync('SELECT * FROM sales WHERE id = ?', [id]);
  return row ? rowToSale(row) : null;
}

export async function getAllActiveSales() {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    'SELECT * FROM sales WHERE deleted_at IS NULL ORDER BY ad_date DESC, updated_at DESC',
  );
  return rows.map(rowToSale);
}

export async function getAllIncludingDeleted() {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    'SELECT * FROM sales ORDER BY created_at ASC',
  );
  return rows.map(rowToSale);
}

export async function getSalesByDate(bsDate) {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    'SELECT * FROM sales WHERE deleted_at IS NULL AND bs_date = ? ORDER BY updated_at ASC',
    [bsDate],
  );
  return rows.map(rowToSale);
}

/** Records that still need to be pushed to the server. */
export async function getPendingSales() {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    "SELECT * FROM sales WHERE sync_status = 'pending' ORDER BY updated_at ASC",
  );
  return rows.map(rowToSale);
}

/** Locally deleted records waiting to be propagated to the server. */
export async function getDeletedTombsones() {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    "SELECT * FROM sales WHERE sync_status = 'deleted' ORDER BY updated_at ASC",
  );
  return rows.map(rowToSale);
}

export async function getPendingCount() {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    "SELECT COUNT(*) AS cnt FROM sales WHERE sync_status != 'synced'",
  );
  return Number(row.cnt);
}

/** Active sales awaiting payment (credit sales not yet settled). */
export async function getPendingCreditSales() {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    "SELECT * FROM sales WHERE deleted_at IS NULL AND payment_status = 'pending' ORDER BY updated_at DESC",
  );
  return rows.map(rowToSale);
}

export async function markSynced(ids) {
  if (ids.length === 0) return;
  const db = await getDatabase();
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(
    `UPDATE sales SET sync_status = 'synced' WHERE id IN (${placeholders})`,
    ids,
  );
}

export async function softDeleteSale(id) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    "UPDATE sales SET sync_status='deleted', deleted_at=? WHERE id=? AND deleted_at IS NULL",
    [now, id],
  );
}

/** Marks a credit sale as settled and queues it for the next sync. */
export async function markPaid(id) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    "UPDATE sales SET payment_status='paid', sync_status='pending', updated_at=? WHERE id=? AND deleted_at IS NULL",
    [now, id],
  );
}

export async function hardDeleteSale(id) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM sales WHERE id = ?', [id]);
}

export async function getSummaryByDate(bsDate) {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    `SELECT COALESCE(SUM(sales_amount), 0) AS totalSales,
            COALESCE(SUM(profit), 0) AS totalProfit,
            COUNT(*) AS cnt
     FROM sales WHERE deleted_at IS NULL AND bs_date = ?`,
    [bsDate],
  );
  return {
    totalSales: Number(row.totalSales),
    totalProfit: Number(row.totalProfit),
    count: Number(row.cnt),
  };
}

export async function getSummaryByMonth(bsMonth) {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    `SELECT COALESCE(SUM(sales_amount), 0) AS totalSales,
            COALESCE(SUM(profit), 0) AS totalProfit,
            COUNT(*) AS cnt
     FROM sales WHERE deleted_at IS NULL AND bs_date LIKE ?`,
    [`${bsMonth}%`],
  );
  return {
    totalSales: Number(row.totalSales),
    totalProfit: Number(row.totalProfit),
    count: Number(row.cnt),
  };
}

export async function getLastSyncAt() {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    "SELECT value FROM sync_meta WHERE key = 'last_sync_at'",
  );
  return row ? row.value : null;
}

export async function setLastSyncAt(iso) {
  const db = await getDatabase();
  await db.runAsync(
    "INSERT OR REPLACE INTO sync_meta (key, value) VALUES ('last_sync_at', ?)",
    [iso],
  );
}

/**
 * Applies remote sales pulled from the server. Local unsynced edits are never
 * clobbered; they stay pending and win the next push.
 */
export async function applyRemoteSales(remote) {
  for (const remoteSale of remote) {
    if (remoteSale.syncStatus === 'deleted') {
      const local = await getSaleById(remoteSale.id);
      if (local && local.syncStatus !== 'synced') continue;
      await hardDeleteSale(remoteSale.id);
    } else {
      const local = await getSaleById(remoteSale.id);
      if (local && local.syncStatus !== 'synced' && local.updatedAt > remoteSale.updatedAt) {
        continue;
      }
      await upsertSale({
        ...remoteSale,
        syncStatus: 'synced',
        deletedAt: null,
      });
    }
  }
}

/** Aggregate object so stores/services can import a single `saleRepository`. */
export const saleRepository = {
  insertSale,
  upsertSale,
  updateSale,
  getSaleById,
  getAllActiveSales,
  getAllIncludingDeleted,
  getSalesByDate,
  getPendingSales,
  getDeletedTombsones,
  getPendingCount,
  getPendingCreditSales,
  markSynced,
  softDeleteSale,
  markPaid,
  hardDeleteSale,
  getSummaryByDate,
  getSummaryByMonth,
  getLastSyncAt,
  setLastSyncAt,
  applyRemoteSales,
};
