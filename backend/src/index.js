import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { MONGODB_URI, PORT } from './config/env.js';

async function start() {
  await connectDB(MONGODB_URI);

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`[server] sales-tracker API listening on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('[server] failed to start:', err);
  process.exit(1);
});
