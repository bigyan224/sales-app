import { SaleModel } from '../models/Sale.js';

function escapeRegExp(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function docToSale(doc) {
  return {
    id: String(doc._id),
    bsDate: doc.bsDate,
    adDate: doc.adDate,
    title: doc.title ?? null,
    salesAmount: doc.salesAmount,
    profit: doc.profit ?? null,
    paymentStatus: doc.paymentStatus ?? 'paid',
    productIds: Array.isArray(doc.productIds) ? doc.productIds : [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    syncStatus: doc.syncStatus,
    deletedAt: doc.deletedAt ?? null,
  };
}

export async function getSales(options = {}) {
  const query = {};

  // Pull syncs (since) filter on the SERVER receipt clock, not the client
  // updatedAt — otherwise records created offline and pushed late (backdated
  // updatedAt) fall behind other devices' cursors and are missed forever.
  // The since branch must include tombstones so clients can delete locally;
  // plain listings hide deleted records.
  if (options.since) {
    query.syncedAt = { $gt: options.since };
  } else {
    query.deletedAt = null;
  }

  if (options.bsDate) {
    query.bsDate = options.bsDate;
  } else if (options.bsMonth) {
    query.bsDate = new RegExp(`^${escapeRegExp(options.bsMonth)}`);
  }

  if (options.q) {
    query.title = { $regex: escapeRegExp(options.q.trim()), $options: 'i' };
  }

  const limit = Math.min(Math.max(options.limit ?? 500, 1), 10000);
  const offset = Math.max(options.offset ?? 0, 0);

  const [docs, total] = await Promise.all([
    SaleModel.find(query).sort({ syncedAt: -1 }).skip(offset).limit(limit).lean(),
    SaleModel.countDocuments(query),
  ]);

  return { sales: docs.map(docToSale), total, limit, offset };
}

export async function getSaleById(id) {
  const doc = await SaleModel.findOne({ _id: id, deletedAt: null }).lean();
  return doc ? docToSale(doc) : null;
}

/** One-time backfill: docs written before syncedAt existed inherit updatedAt. */
export async function migrateSalesSyncedAt() {
  const result = await SaleModel.updateMany(
    { $or: [{ syncedAt: { $exists: false } }, { syncedAt: null }] },
    [{ $set: { syncedAt: '$updatedAt' } }],
  );
  return result.modifiedCount ?? 0;
}

/**
 * Last-write-wins batch sync (conflicts still resolve on the CLIENT
 * `updatedAt`). Every write is stamped with the SERVER receipt time
 * (`syncedAt`), which is what pull syncs filter on — so late-pushed
 * offline records can never fall behind another device's `since` cursor.
 * Deleted tombstones are retained (not hard-deleted) so late-pushed deletes
 * also propagate to other devices on their next pull.
 */
export async function batchSync(items) {
  const results = [];
  const now = new Date().toISOString();

  const active = items.filter((item) => item.syncStatus !== 'deleted');
  const tombstones = items.filter((item) => item.syncStatus === 'deleted');

  if (active.length > 0) {
    const ids = active.map((item) => item.id);
    const existing = await SaleModel.find({ _id: { $in: ids } }).lean();
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
              bsDate: item.bsDate,
              adDate: item.adDate,
              title: item.title,
              salesAmount: item.salesAmount,
              profit: item.profit,
              paymentStatus: item.paymentStatus ?? 'paid',
              productIds: item.productIds ?? [],
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              syncedAt: now,
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
      await SaleModel.bulkWrite(operations, { ordered: false });
    }
  }

  if (tombstones.length > 0) {
    await SaleModel.bulkWrite(
      tombstones.map((t) => ({
        updateOne: {
          filter: { _id: t.id },
          update: {
            $set: {
              deletedAt: t.deletedAt ?? now,
              syncedAt: now,
              syncStatus: 'deleted',
            },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    );
    for (const tombstone of tombstones) {
      results.push({ id: tombstone.id, status: 'deleted' });
    }
  }

  return results;
}

export async function deleteSaleById(id) {
  const result = await SaleModel.deleteOne({ _id: id });
  return result.deletedCount > 0;
}

export async function getSummary(options = {}) {
  const match = { deletedAt: null };
  if (options.bsDate) {
    match.bsDate = options.bsDate;
  } else if (options.bsMonth) {
    match.bsDate = new RegExp(`^${escapeRegExp(options.bsMonth)}`);
  }

  const grouped = await SaleModel.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$salesAmount' },
        totalProfit: { $sum: { $ifNull: ['$profit', 0] } },
        count: { $sum: 1 },
      },
    },
  ]);

  const row = grouped[0];
  return {
    totalSales: row?.totalSales ?? 0,
    totalProfit: row?.totalProfit ?? 0,
    count: row?.count ?? 0,
  };
}
