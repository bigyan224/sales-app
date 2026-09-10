import mongoose from 'mongoose';

/**
 * The Mongo document mirrors the client bill shape. `_id` is the client
 * generated UUID so batch upserts are idempotent across devices.
 */
const billSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, index: true },
    bsDate: { type: String, required: true, index: true },
    adDate: { type: String, default: null },
    notes: { type: String, default: null },
    imageUrl: { type: String, default: null },
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
    collection: 'bills',
  },
);

export const BillModel = mongoose.model('Bill', billSchema);
