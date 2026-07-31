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
