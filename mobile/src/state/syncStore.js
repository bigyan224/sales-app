import { create } from 'zustand';
import * as Network from 'expo-network';
import { saleRepository } from '../db/saleRepository';
import { syncService } from '../services/syncService';

const isOnlineState = (state) =>
  state.isConnected === true && state.isInternetReachable !== false;

export const useSyncStore = create((set, get) => {
  const updater = {
    setStatus: (status) => set({ status }),
    setError: (error) => set({ error }),
    setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
    setPendingCount: (pendingCount) => set({ pendingCount }),
    isOnline: () => get().isOnline === true,
    /** Asks the OS for the real connectivity state and stores it. */
    probeOnline: async () => {
      try {
        const online = isOnlineState(await Network.getNetworkStateAsync());
        set({ isOnline: online });
        return online;
      } catch {
        return get().isOnline === true;
      }
    },
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
