import 'dotenv/config';

export const NODE_ENV = process.env.NODE_ENV ?? 'production';
export const PORT = Number(process.env.PORT ?? 4000);
export const MONGODB_URI =
  process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/sales_tracker';
export const CORS_ORIGIN = process.env.CORS_ORIGIN ?? '*';
export const KEEP_ALIVE_URL = process.env.KEEP_ALIVE_URL ?? null;
export const KEEP_ALIVE_INTERVAL_MIN = Number(process.env.KEEP_ALIVE_INTERVAL_MIN ?? 5);
