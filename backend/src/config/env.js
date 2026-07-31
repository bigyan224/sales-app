import 'dotenv/config';

export const NODE_ENV = process.env.NODE_ENV ?? 'development';
export const PORT = Number(process.env.PORT ?? 4000);
export const MONGODB_URI =
  process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/sales_tracker';
export const CORS_ORIGIN = process.env.CORS_ORIGIN ?? '*';
