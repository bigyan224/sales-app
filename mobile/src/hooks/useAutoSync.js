import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as Network from 'expo-network';
import { SYNC_INTERVAL_MS } from '../config';
import { syncService } from '../services/syncService';
import { useSalesStore } from '../state/salesStore';
import { useSyncStore } from '../state/syncStore';

const isOnline = (state) =>
  state.isConnected === true && state.isInternetReachable !== false;

/**
 * Wires up all automatic sync triggers:
 * - on mount (app launch)
 * - when internet reconnects
 * - when the app comes to the foreground
 * - on a background timer every few hours
 */
export function useAutoSync() {
  useEffect(() => {
    const refreshAndSync = () => {
      void useSalesStore.getState().refresh();
      void syncService.syncNow();
    };

    refreshAndSync();

    // Seed connection state before the first sync.
    Network.getNetworkStateAsync()
      .then((state) => {
        const online = isOnline(state);
        useSyncStore.getState().setOnline(online);
        if (online) void syncService.syncNow();
      })
      .catch(() => useSyncStore.getState().setOnline(true));

    const subscription = Network.addNetworkStateListener((state) => {
      const online = isOnline(state);
      useSyncStore.getState().setOnline(online);
      if (online) void syncService.syncNow();
    });

    const appStateSubscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        refreshAndSync();
      }
    });

    const interval = setInterval(() => {
      void syncService.syncNow();
    }, SYNC_INTERVAL_MS);

    return () => {
      subscription.remove();
      appStateSubscription.remove();
      clearInterval(interval);
    };
  }, []);
}
