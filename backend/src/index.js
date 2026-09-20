import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { KEEP_ALIVE_INTERVAL_MIN, KEEP_ALIVE_URL, MONGODB_URI, PORT } from './config/env.js';
import { startKeepAlive } from './services/keepAlive.js';
import { migrateSalesSyncedAt } from './services/saleService.js';

async function start() {
  await connectDB(MONGODB_URI);

  try {
    const migrated = await migrateSalesSyncedAt();
    if (migrated > 0) console.log(`[db] backfilled syncedAt on ${migrated} sale(s)`);
  } catch (err) {
    console.error('[db] sales syncedAt migration failed:', err?.message ?? err);
  }

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`[server] sales-tracker API listening on http://0.0.0.0:${PORT}`);
    startKeepAlive({ url: KEEP_ALIVE_URL, intervalMinutes: KEEP_ALIVE_INTERVAL_MIN });
  });
}

start().catch((err) => {
  console.error('[server] failed to start:', err);
  process.exit(1);
});
