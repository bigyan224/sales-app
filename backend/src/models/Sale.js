import mongoose from 'mongoose';

/**
 * The Mongo document mirrors the client sale shape. `_id` is the client
 * generated UUID so batch upserts are idempotent across devices.
 */
const saleSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    bsDate: { type: String, required: true, index: true },
    adDate: { type: String, required: true, index: true },
    title: { type: String, default: null },
    salesAmount: { type: Number, required: true, min: 0 },
    profit: { type: Number, default: null },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending'],
      default: 'paid',
      index: true,
    },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true, index: true },
    syncStatus: {
      type: String,
      enum: ['synced', 'pending', 'deleted'],
      default: 'synced',
    },
    deletedAt: { type: String, default: null },
  },
  {
    versionKey: false,
    collection: 'sales',
  },
);

export const SaleModel = mongoose.model('Sale', saleSchema);
