import { create } from 'zustand';
import { productRepository } from '../db/productRepository';
import { syncService } from '../services/syncService';
import { newUuid } from '../utils/id';
import { useSyncStore } from './syncStore';

function triggerSync() {
  void syncService.syncNow();
}

export const useProductsStore = create((set, get) => ({
  products: [],
  loading: true,

  refresh: async () => {
    const products = await productRepository.getAllActiveProducts();
    set({ products, loading: false });
  },

  addProduct: async (input) => {
    const now = new Date().toISOString();
    const product = {
      id: newUuid(),
      name: input.name.trim(),
      category: input.category ?? null,
      unit: input.unit ?? null,
      price: input.price,
      notes: input.notes ?? null,
      imageUrl: null,
      localImageUri: input.localImageUri ?? null,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      deletedAt: null,
    };
    await productRepository.insertProduct(product);
    await get().refresh();
    triggerSync();
    return product;
  },

  updateProduct: async (id, input) => {
    const existing = await productRepository.getProductById(id);
    if (!existing) return;
    const now = new Date().toISOString();
    const updated = {
      ...existing,
      name: input.name.trim(),
      category: input.category ?? null,
      unit: input.unit ?? null,
      price: input.price,
      notes: input.notes ?? null,
      // Image fields are only changed through the form's explicit image state.
      localImageUri:
        input.localImageUri !== undefined ? input.localImageUri : existing.localImageUri,
      imageUrl: input.imageUrl !== undefined ? input.imageUrl : existing.imageUrl,
      updatedAt: now,
      syncStatus: 'pending',
      deletedAt: null,
    };
    await productRepository.updateProduct(updated);
    await get().refresh();
    triggerSync();
  },

  removeProduct: async (id) => {
    await productRepository.softDeleteProduct(id);
    await get().refresh();
    triggerSync();
  },
}));

// Refresh the UI after any successful sync so products added on the other
// device appear without a local edit first.
useSyncStore.subscribe((state, prev) => {
  if (state.status === 'synced' && prev.status !== 'synced') {
    void useProductsStore.getState().refresh();
  }
});
