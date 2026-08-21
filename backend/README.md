# Sales Tracker API

REST API powering the offline-first sales tracker mobile app and the future
admin web dashboard. Express + MongoDB (Mongoose). No authentication — single
shop deployment.

## Setup

Plain JavaScript (ESM), no build step. You need a MongoDB instance — put the
connection string in `.env`.

```bash
npm install
cp .env.example .env   # set MONGODB_URI (your MongoDB URL), PORT, CORS_ORIGIN
npm run dev            # node --watch, http://localhost:4000
```

Production:

```bash
npm start
```

## Keeping a free host (Render) awake

Render's free tier pauses a web service after ~15 min without inbound traffic.
This repo ships a keep-alive cron that pings its own `/api/health` on a timer,
which counts as traffic and prevents the pause:

- Set `KEEP_ALIVE_URL` to the app's public URL, e.g. `https://yourapp.onrender.com`
- `KEEP_ALIVE_INTERVAL_MIN` controls the ping interval (default `5`).

Note: the timer only runs while the instance is awake, so the very first request
still cold-starts the app. An external monitor (UptimeRobot etc.) is a
belt-and-suspenders option if you need zero cold starts.

## Endpoints

All under `/api`.

| Method | Path                     | Description                                              |
| ------ | ------------------------ | -------------------------------------------------------- |
| GET    | `/health`                | Liveness check                                           |
| GET    | `/sales`                 | List sales. Query: `since`, `bsDate`, `bsMonth`, `q`, `limit`, `offset` |
| GET    | `/sales/:id`             | Get one sale by UUID                                     |
| POST   | `/sales`                 | Create a sale (idempotent upsert by UUID)                |
| PUT    | `/sales/:id`             | Update a sale (last-write-wins by `updatedAt`)           |
| DELETE | `/sales/:id`             | Delete a sale                                            |
| POST   | `/sales/batch-sync`      | Batch push for offline sync (see below)                  |
| GET    | `/sales/summary`         | Totals for `bsDate` or `bsMonth` (`totalSales`, `totalProfit`, `count`) |
| GET    | `/products`              | List products. Query: `since`, `limit`, `offset`         |
| GET    | `/products/:id`          | Get one product by UUID                                  |
| POST   | `/products`              | Create a product (idempotent upsert by UUID)             |
| PUT    | `/products/:id`          | Update a product (last-write-wins by `updatedAt`)        |
| DELETE | `/products/:id`          | Delete a product                                         |
| POST   | `/products/batch-sync`   | Batch push for offline sync (same contract as sales)     |

## Product photos (Cloudinary)

Product images are optional and upload **directly from the phone** to
Cloudinary using an unsigned upload preset — this server is not involved at
all. Configure the preset in the mobile app (`mobile/src/config.js`):

1. Cloudinary dashboard -> Settings -> Upload -> Upload presets -> New preset
2. Signing mode: **Unsigned**; asset folder e.g. `items`
3. Copy the cloud name + preset name into `CLOUDINARY_CLOUD_NAME` /
   `CLOUDINARY_UPLOAD_PRESET` in `mobile/src/config.js`

Without that config the app still works — product photos just stay stored on
whichever phone took them.

## Batch sync contract

`POST /sales/batch-sync` with `{ "sales": [ ...Sale ] }`.

Each `Sale` uses a client-generated UUID in `id`. Deleted records arrive as
tombstones with `syncStatus: "deleted"` and are hard-deleted on the server.
Live records are upserted last-write-wins using the client `updatedAt`
timestamp; if the stored copy is newer the record is reported
`"up-to-date"` and the client pulls the server version on the next pull sync.

Response:

```json
{ "results": [{ "id": "uuid", "status": "synced" | "deleted" | "up-to-date" }] }
```

Pull sync uses `GET /sales?since=<ISO>` and includes deleted tombstones so
clients can mirror server-side deletions.
