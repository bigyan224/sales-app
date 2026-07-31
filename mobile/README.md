# Sales Tracker — Mobile App (Expo + SQLite)

Offline-first sales tracker for a small shop owner. Plain JavaScript, no
TypeScript. Sales are saved instantly to SQLite, then synced in the background
to the backend whenever the internet is available.

## Setup

```bash
npm install
npx expo start
```

- Expo Go (QR code) works out of the box — the app uses only Expo-compatible
  modules (`expo-sqlite`, `expo-network`, `@expo/vector-icons`).
- Press `a` for the Android emulator or `i` for the iOS simulator.
- If native modules were bumped, run `npx expo install --fix` to re-align
  versions with your SDK.

## Point the app at your backend

Edit `src/config.js`:

```js
export const API_BASE_URL = 'http://192.168.1.100:4000/api';
```

- Physical phone → the LAN IP of the machine running the backend (same Wi-Fi).
- Android emulator → `http://10.0.2.2:4000/api`
- iOS simulator → `http://localhost:4000/api`

## Offline sync behaviour

- Saves always go to SQLite first and return instantly.
- Records push automatically: on launch, on internet reconnect, on foreground,
  on the **sync button** (compact icon in the Home header), and on a background
  timer (every 3 hours).
- Deletes are tombstones until the server confirms them.
- Records use client-generated UUIDs → repeated syncs never duplicate.
  Conflicts resolve last-write-wins by `updatedAt`.

## Screens

- **Home** — quick-add a sale, today's totals, sync status.
- **History** — browse sales day-by-day. Pick a month, then a day, or search.
- **Dashboard** — weekly/monthly analytics. Charts of daily sales & profit,
  with totals, transactions and average sale. All computed offline from SQLite.
- **Edit Sale** — modal opened from History.

All data is permanently stored in MongoDB. To export, query the `sales`
collection directly in MongoDB Atlas / Compass.

## Nepali date

- Today's BS date is auto-filled using the offline `nepali-date-converter`
  library (no Android calendar, no network).
- The picker in the form is a simple +/- stepper modal (Year / Month / Day).
- Both BS (`bsDate`) and AD (`adDate`) strings are stored on every sale.

## Project layout

```
App.js                 entry (DB init → navigation → auto-sync)
src/
  components/          reusable UI (buttons, fields, BS date picker, charts…)
  screens/             Home, History, Dashboard, Edit Sale
  services/            sync engine, HTTP client, Nepali dates
  db/                  SQLite connection + repository (all queries live here)
  state/               Zustand stores (sales + sync status)
  hooks/               useSales, useAutoSync
  utils/               formatting helpers
  types.js             JSDoc typedefs (documentation only)
  config.js            backend URL + sync interval
```

Adding future features (inventory, expenses) requires no refactoring of the
sync engine: new tables belong in `db/`, new modules in `services/`, and the
backend is already shared with a future web dashboard.
