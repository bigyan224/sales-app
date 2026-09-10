import { create } from 'zustand';
import { billRepository } from '../db/billRepository';
import { syncService } from '../services/syncService';
import { newUuid } from '../utils/id';
import { useSyncStore } from './syncStore';

function triggerSync() {
  void syncService.syncNow();
}

export const useBillsStore = create((set, get) => ({
  bills: [],
  loading: true,

  refresh: async () => {
    const bills = await billRepository.getAllActiveBills();
    set({ bills, loading: false });
  },

  addBill: async (input) => {
    const now = new Date().toISOString();
    const bill = {
      id: newUuid(),
      name: input.name.trim(),
      bsDate: input.bsDate,
      adDate: input.adDate ?? null,
      notes: input.notes ?? null,
      imageUrl: null,
      localImageUri: input.localImageUri ?? null,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      deletedAt: null,
    };
    await billRepository.insertBill(bill);
    await get().refresh();
    triggerSync();
    return bill;
  },

  updateBill: async (id, input) => {
    const existing = await billRepository.getBillById(id);
    if (!existing) return;
    const now = new Date().toISOString();
    const updated = {
      ...existing,
      name: input.name.trim(),
      bsDate: input.bsDate,
      adDate: input.adDate ?? null,
      notes: input.notes ?? null,
      // Image fields are only changed through the form's explicit image state.
      localImageUri:
        input.localImageUri !== undefined ? input.localImageUri : existing.localImageUri,
      imageUrl: input.imageUrl !== undefined ? input.imageUrl : existing.imageUrl,
      updatedAt: now,
      syncStatus: 'pending',
      deletedAt: null,
    };
    await billRepository.updateBill(updated);
    await get().refresh();
    triggerSync();
  },

  removeBill: async (id) => {
    await billRepository.softDeleteBill(id);
    await get().refresh();
    triggerSync();
  },
}));

// Refresh the UI after any successful sync so bills added on the other
// device appear without a local edit first.
useSyncStore.subscribe((state, prev) => {
  if (state.status === 'synced' && prev.status !== 'synced') {
    void useBillsStore.getState().refresh();
  }
});
