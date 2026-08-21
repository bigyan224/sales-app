import { ProductModel } from '../models/Product.js';

function docToProduct(doc) {
  return {
    id: String(doc._id),
    name: doc.name,
    category: doc.category ?? null,
    unit: doc.unit ?? null,
    price: doc.price,
    notes: doc.notes ?? null,
    imageUrl: doc.imageUrl ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    syncStatus: doc.syncStatus,
    deletedAt: doc.deletedAt ?? null,
  };
}

export async function getProducts(options = {}) {
  const query = {};

  // Pull syncs (since) must include tombstones so clients can delete locally;
  // plain listings hide deleted records.
  if (options.since) {
    query.updatedAt = { $gt: options.since };
  } else {
    query.deletedAt = null;
  }

  const limit = Math.min(Math.max(options.limit ?? 500, 1), 10000);
  const offset = Math.max(options.offset ?? 0, 0);

  const [docs, total] = await Promise.all([
    ProductModel.find(query).sort({ updatedAt: -1 }).skip(offset).limit(limit).lean(),
    ProductModel.countDocuments(query),
  ]);

  return { products: docs.map(docToProduct), total, limit, offset };
}

export async function getProductById(id) {
  const doc = await ProductModel.findOne({ _id: id, deletedAt: null }).lean();
  return doc ? docToProduct(doc) : null;
}

/**
 * Last-write-wins batch sync. Records whose `updatedAt` is older than (or equal
 * to) the stored copy are skipped and reported as `up-to-date`. Deleted
 * tombstones are hard-deleted on the server.
 */
export async function batchSync(items) {
  const results = [];

  const active = items.filter((item) => item.syncStatus !== 'deleted');
  const tombstones = items.filter((item) => item.syncStatus === 'deleted');

  if (active.length > 0) {
    const ids = active.map((item) => item.id);
    const existing = await ProductModel.find({ _id: { $in: ids } }).lean();
    const existingById = new Map(existing.map((d) => [String(d._id), d]));

    const operations = [];

    for (const item of active) {
      const current = existingById.get(item.id);
      if (current && current.updatedAt >= item.updatedAt) {
        results.push({ id: item.id, status: 'up-to-date' });
        continue;
      }
      operations.push({
        updateOne: {
          filter: { _id: item.id },
          update: {
            $set: {
              _id: item.id,
              name: item.name,
              category: item.category,
              unit: item.unit,
              price: item.price,
              notes: item.notes,
              imageUrl: item.imageUrl,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              syncStatus: 'synced',
              deletedAt: null,
            },
          },
          upsert: true,
        },
      });
      results.push({ id: item.id, status: 'synced' });
    }

    if (operations.length > 0) {
      await ProductModel.bulkWrite(operations, { ordered: false });
    }
  }

  if (tombstones.length > 0) {
    await ProductModel.deleteMany({ _id: { $in: tombstones.map((t) => t.id) } });
    for (const tombstone of tombstones) {
      results.push({ id: tombstone.id, status: 'deleted' });
    }
  }

  return results;
}

export async function deleteProductById(id) {
  const result = await ProductModel.deleteOne({ _id: id });
  return result.deletedCount > 0;
}
