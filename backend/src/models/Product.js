import mongoose from 'mongoose';

/**
 * The Mongo document mirrors the client product shape. `_id` is the client
 * generated UUID so batch upserts are idempotent across devices.
 */
const productSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, index: true },
    category: { type: String, default: null },
    unit: { type: String, default: null },
    price: { type: Number, required: true, min: 0 },
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
    collection: 'products',
  },
);

export const ProductModel = mongoose.model('Product', productSchema);
