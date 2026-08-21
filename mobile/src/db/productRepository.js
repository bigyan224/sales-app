import { getDatabase } from './database';

const INSERT_COLUMNS =
  'id, name, category, unit, price, notes, image_url, local_image_uri, created_at, updated_at, sync_status, deleted_at';

function rowToProduct(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? null,
    unit: row.unit ?? null,
    price: Number(row.price),
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

function productToParams(product) {
  return [
    product.id,
    product.name,
    product.category,
    product.unit,
    product.price,
    product.notes,
    product.imageUrl,
    product.localImageUri ?? null,
    product.createdAt,
    product.updatedAt,
    product.syncStatus,
    product.deletedAt,
  ];
}

export async function insertProduct(product) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO products (${INSERT_COLUMNS}) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    productToParams(product),
  );
}

/** Inserts or replaces a product row (used by pull sync). */
export async function upsertProduct(product) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO products (${INSERT_COLUMNS}) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    productToParams(product),
  );
}

export async function updateProduct(product) {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE products SET name=?, category=?, unit=?, price=?, notes=?,
     image_url=?, local_image_uri=?, created_at=?, updated_at=?, sync_status=?, deleted_at=?
     WHERE id=?`,
    [
      product.name,
      product.category,
      product.unit,
      product.price,
      product.notes,
      product.imageUrl,
      product.localImageUri ?? null,
      product.createdAt,
      product.updatedAt,
      product.syncStatus,
      product.deletedAt,
      product.id,
    ],
  );
}

export async function getProductById(id) {
  const db = await getDatabase();
  const row = await db.getFirstAsync('SELECT * FROM products WHERE id = ?', [id]);
  return row ? rowToProduct(row) : null;
}

export async function getAllActiveProducts() {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    'SELECT * FROM products WHERE deleted_at IS NULL ORDER BY name COLLATE NOCASE ASC',
  );
  return rows.map(rowToProduct);
}

/** Case-insensitive substring search over name and category. */
export async function searchProducts(query) {
  const db = await getDatabase();
  const like = `%${query.trim()}%`;
  const rows = await db.getAllAsync(
    `SELECT * FROM products
     WHERE deleted_at IS NULL AND (name LIKE ? COLLATE NOCASE OR category LIKE ? COLLATE NOCASE)
     ORDER BY name COLLATE NOCASE ASC`,
    [like, like],
  );
  return rows.map(rowToProduct);
}

/** Records that still need to be pushed to the server. */
export async function getPendingProducts() {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    "SELECT * FROM products WHERE sync_status = 'pending' ORDER BY updated_at ASC",
  );
  return rows.map(rowToProduct);
}

/** Locally deleted records waiting to be propagated to the server. */
export async function getDeletedTombstones() {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    "SELECT * FROM products WHERE sync_status = 'deleted' ORDER BY updated_at ASC",
  );
  return rows.map(rowToProduct);
}

export async function markSynced(ids) {
  if (ids.length === 0) return;
  const db = await getDatabase();
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(
    `UPDATE products SET sync_status = 'synced' WHERE id IN (${placeholders})`,
    ids,
  );
}

export async function softDeleteProduct(id) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    "UPDATE products SET sync_status='deleted', deleted_at=? WHERE id=? AND deleted_at IS NULL",
    [now, id],
  );
}

export async function hardDeleteProduct(id) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM products WHERE id = ?', [id]);
}

/** Photos picked offline wait here until a successful sync uploads them. */
export async function getProductsWithLocalImageOnly() {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    'SELECT * FROM products WHERE deleted_at IS NULL AND local_image_uri IS NOT NULL AND image_url IS NULL',
  );
  return rows.map(rowToProduct);
}

/** Stores the uploaded photo URL and queues the record for the next push. */
export async function setImageUrl(id, imageUrl) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    "UPDATE products SET image_url=?, updated_at=?, sync_status='pending' WHERE id=?",
    [imageUrl, now, id],
  );
}

export async function getLastSyncAt() {
  const db = await getDatabase();
  const row = await db.getFirstAsync(
    "SELECT value FROM sync_meta WHERE key = 'last_products_sync_at'",
  );
  return row ? row.value : null;
}

export async function setLastSyncAt(iso) {
  const db = await getDatabase();
  await db.runAsync(
    "INSERT OR REPLACE INTO sync_meta (key, value) VALUES ('last_products_sync_at', ?)",
    [iso],
  );
}

/**
 * Applies remote products pulled from the server. Local unsynced edits are
 * never clobbered; they stay pending and win the next push.
 */
export async function applyRemoteProducts(remote) {
  for (const remoteProduct of remote) {
    if (remoteProduct.syncStatus === 'deleted') {
      const local = await getProductById(remoteProduct.id);
      if (local && local.syncStatus !== 'synced') continue;
      await hardDeleteProduct(remoteProduct.id);
    } else {
      const local = await getProductById(remoteProduct.id);
      if (local && local.syncStatus !== 'synced' && local.updatedAt > remoteProduct.updatedAt) {
        continue;
      }
      // Preserve the device-local photo path across pull upserts.
      const localImageUri = local?.localImageUri ?? null;
      await upsertProduct({
        ...remoteProduct,
        localImageUri,
        syncStatus: 'synced',
        deletedAt: null,
      });
    }
  }
}

/** Aggregate object so stores/services can import a single `productRepository`. */
export const productRepository = {
  insertProduct,
  upsertProduct,
  updateProduct,
  getProductById,
  getAllActiveProducts,
  searchProducts,
  getPendingProducts,
  getDeletedTombstones,
  markSynced,
  softDeleteProduct,
  hardDeleteProduct,
  getProductsWithLocalImageOnly,
  setImageUrl,
  getLastSyncAt,
  setLastSyncAt,
  applyRemoteProducts,
};
