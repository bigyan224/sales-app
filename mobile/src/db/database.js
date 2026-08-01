import * as SQLite from 'expo-sqlite';

const DB_NAME = 'sales_tracker.db';

let dbPromise = null;

export function getDatabase() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

/**
 * Creates the schema. Safe to call multiple times (idempotent).
 * Called once before the UI mounts.
 */
export async function initDatabase() {
  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY NOT NULL,
      bs_date TEXT NOT NULL,
      ad_date TEXT NOT NULL,
      title TEXT,
      sales_amount REAL NOT NULL,
      profit REAL,
      payment_status TEXT NOT NULL DEFAULT 'paid',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sales_bs_date ON sales (bs_date);
    CREATE INDEX IF NOT EXISTS idx_sales_updated_at ON sales (updated_at);
    CREATE INDEX IF NOT EXISTS idx_sales_sync_status ON sales (sync_status);
  `);

  // Migration for databases created before the credit feature.
  const columns = await db.getAllAsync('PRAGMA table_info(sales)');
  if (!columns.some((c) => c.name === 'payment_status')) {
    await db.execAsync(
      "ALTER TABLE sales ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'paid'",
    );
  }
}
