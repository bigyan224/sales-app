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
- **Products** — price lookup for every item in the shop. Search by name or
  category; each product has an optional photo, unit (piece/kg/…) and notes.
  Adding products has a fast-seed flow: after each save the form clears and
  refocuses so a whole shelf can be entered back-to-back.
- **Pending** — all credit sales awaiting payment, with total outstanding and a
  "Mark Paid" button to settle each one.
- **Dashboard** — monthly BS calendar heatmap + search. Shows month analytics
  (daily bar chart, sales, profit, outstanding, collected) by default; tap a
  date circle to drill into that day's entries with its own stats. All computed
  offline from SQLite.
- **Edit Sale / Add Product** — modals opened from the lists.

Every sale is either **Cash** (default) or **Credit**. Credit sales show a
badge, appear in the Pending tab, and are counted as Outstanding until marked
paid. The `title` field holds the customer name + items (e.g. "Ram — Lota,
Agarbatti").

While typing a sale title, matching products appear as suggestions — tapping
one inserts its name into the text (the price is never auto-applied) and links
the product to the sale (`productIds`), enabling per-item sales analytics
later. Multiple items and free text can be mixed freely; linked items show as
removable chips under the field.

Product photos are optional: shoot with the camera or pick from the gallery,
saved on-device instantly, then uploaded straight to Cloudinary (unsigned
preset — no backend involved) during the next successful sync. Configure
`CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_UPLOAD_PRESET` in `src/config.js`.

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
  screens/             Home, Products, Pending, Dashboard, form modals
  services/            sync engine, HTTP client, Nepali dates, image uploads
  db/                  SQLite connection + repositories (all queries live here)
  state/               Zustand stores (sales + sync status)
  hooks/               useSales, useAutoSync
  utils/               formatting helpers
  types.js             JSDoc typedefs (documentation only)
  config.js            backend URL + sync interval
```

Adding future features (inventory, expenses) requires no refactoring of the
sync engine: new tables belong in `db/`, new modules in `services/`, and the
backend is already shared with a future web dashboard.
