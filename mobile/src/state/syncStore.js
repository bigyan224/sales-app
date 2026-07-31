import { create } from 'zustand';
import { saleRepository } from '../db/saleRepository';
import { syncService } from '../services/syncService';

export const useSyncStore = create((set, get) => {
  const updater = {
    setStatus: (status) => set({ status }),
    setError: (error) => set({ error }),
    setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
    setPendingCount: (pendingCount) => set({ pendingCount }),
    isOnline: () => get().isOnline === true,
  };

  syncService.bind(updater);

  return {
    status: 'idle',
    isOnline: null,
    lastSyncAt: null,
    pendingCount: 0,
    error: null,
    setOnline: (online) => set({ isOnline: online }),
    syncNow: () => syncService.syncNow(),
    refreshPendingCount: async () => {
      updater.setPendingCount(await saleRepository.getPendingCount());
    },
  };
});
