import { create } from 'zustand';
import { getDatabase } from '../db/database';
import { api, checkServers, setServerMode } from '../services/api';
import { syncService } from '../services/syncService';

const MODE_KEY = 'active_server_mode';

async function loadPersistedMode() {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync(
      'SELECT value FROM sync_meta WHERE key = ?',
      [MODE_KEY],
    );
    const v = row?.value;
    return v === 'primary' || v === 'fallback' || v === 'auto' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

async function persistMode(mode) {
  try {
    const db = await getDatabase();
    await db.runAsync('INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)', [
      MODE_KEY,
      mode,
    ]);
  } catch {
    // persistence is best-effort; in-memory mode still works
  }
}

/**
 * Which backend the app talks to. Default 'auto' keeps the previous behavior
 * (primary first, Render fallback). Manual choice pins api.js to one backend.
 * Online flags are probed, never assumed.
 */
export const useServerStore = create((set, get) => ({
  mode: 'auto',
  primaryOnline: null,
  fallbackOnline: null,
  active: null,
  checking: false,
  initialized: false,

  init: async () => {
    if (get().initialized) return;
    const mode = await loadPersistedMode();
    setServerMode(mode);
    set({ mode, initialized: true });
    void get().refresh();
  },

  refresh: async () => {
    if (get().checking) return;
    set({ checking: true });
    try {
      const { primaryOnline, fallbackOnline } = await checkServers();
      const mode = get().mode;
      let active = null;
      if (mode === 'primary') {
        active = primaryOnline ? 'primary' : null;
      } else if (mode === 'fallback') {
        active = fallbackOnline ? 'fallback' : null;
      } else {
        active = primaryOnline ? 'primary' : fallbackOnline ? 'fallback' : null;
      }
      // If a request just succeeded, prefer the server that actually served it.
      const last = api.getLastActiveServer?.();
      if ((mode === 'auto' || !active) && (last === 'primary' || last === 'fallback')) {
        if ((last === 'primary' && primaryOnline) || (last === 'fallback' && fallbackOnline)) {
          active = last;
        }
      }
      set({ primaryOnline, fallbackOnline, active, checking: false });
    } catch {
      set({ checking: false });
    }
  },

  select: async (mode) => {
    if (mode !== 'auto' && mode !== 'primary' && mode !== 'fallback') return;
    setServerMode(mode);
    set({ mode });
    await persistMode(mode);
    await get().refresh();
    void syncService.syncNow();
  },
}));
