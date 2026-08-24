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
 *
 * Every trigger re-checks actual connectivity with the OS first — a stale
 * offline flag must never cause a sync to be skipped silently.
 */
export function useAutoSync() {
  useEffect(() => {
    const refreshAndSync = () => {
      Network.getNetworkStateAsync()
        .then((state) => {
          useSyncStore.getState().setOnline(isOnline(state));
          void syncService.syncNow();
        })
        .catch(() => {
          // Connectivity unknown — syncNow probes again before giving up.
          void syncService.syncNow();
        });
      void useSalesStore.getState().refresh();
    };

    refreshAndSync();

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
