# Sales Tracker

Offline-first sales tracker for a small shop owner.

- **Mobile app** — Expo (React Native) + SQLite. Plain JavaScript. Every sale is
  saved to the phone instantly and synced to the cloud in the background.
  Works fully offline for weeks.
- **Backend** — Node.js + Express + MongoDB (Mongoose). REST API shared by the
  app now and by a future admin web dashboard.

```
store/
  backend/   Node/Express/MongoDB API (reads MONGODB_URI from .env)
  mobile/    Expo app (run with `npx expo start`)
```

## How offline sync works

1. Saving a sale always writes to SQLite first and returns instantly — it never
   waits for the network.
2. Records are pushed to the backend automatically:
   - on app launch
   - when the internet reconnects
   - when the app returns to the foreground
   - on the manual sync button (compact icon on the Home screen)
   - on a background retry timer (every 3 hours)
3. Offline edits are marked `pending`; deleted sales become tombstones until the
   server confirms them. Everything syncs automatically once connectivity
   returns.
4. Every record carries a client-generated UUID, so repeated pushes never create
   duplicates. Conflicts resolve last-write-wins using the client `updatedAt`
   timestamp; the server reports `up-to-date` and the app pulls the server copy
   on the next sync.

## Getting started

### Backend

```bash
cd backend
npm install
cp .env.example .env      # put your MongoDB URL in MONGODB_URI
npm run dev               # http://localhost:4000 (see README.md inside backend/)
```

### Mobile

```bash
cd mobile
npm install
npx expo start            # scan the QR with Expo Go, or press 'a' for Android / 'i' for iOS
```

Before running, set your backend address in `mobile/src/config.js`
(`API_BASE_URL`). Physical phone: use the machine's LAN IP and make sure both
devices are on the same Wi-Fi.

See `mobile/README.md` for details.

## API overview

| Method | Path                      | Description                                                                     |
| ------ | ------------------------- | ------------------------------------------------------------------------------- |
| GET    | `/api/health`           | Liveness check                                                                  |
| GET    | `/api/sales`            | List (filters:`since`, `bsDate`, `bsMonth`, `q`, `limit`, `offset`) |
| POST   | `/api/sales/batch-sync` | Offline push (edits + delete tombstones)                                        |
| POST   | `/api/sales`            | Create one sale                                                                 |
| GET    | `/api/sales/:id`        | Get one sale                                                                    |
| PUT    | `/api/sales/:id`        | Update one sale                                                                 |
| DELETE | `/api/sales/:id`        | Delete one sale                                                                 |
| GET    | `/api/sales/summary`    | Totals by`bsDate` or `bsMonth`                                              |

The codebase is structured so inventory, expenses and analytics can be added
later: new domain tables go in the mobile `db/` layer and new Mongoose models +
routes in the backend, without touching the sync engine.
