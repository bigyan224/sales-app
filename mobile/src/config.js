/**
 * Base URL of the Sales Tracker backend.
 *
 * For a physical phone, use the LAN IP of the machine running the server,
 * e.g. `http://192.168.1.100:4000/api` (phone must be on the same Wi-Fi).
 * Android emulator -> `http://10.0.2.2:4000/api`
 * iOS simulator    -> `http://localhost:4000/api`
 */
export const API_BASE_URL = 'https://sales-app-s0cu.onrender.com/api';

/** Background auto-sync interval (3 hours). */
export const SYNC_INTERVAL_MS = 3 * 60 * 60 * 1000;

export const PULL_LIMIT = 5000;
