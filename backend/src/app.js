import cors from 'cors';
import express from 'express';
import { CORS_ORIGIN } from './config/env.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import productRoutes from './routes/productRoutes.js';
import saleRoutes from './routes/saleRoutes.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: CORS_ORIGIN === '*' ? '*' : CORS_ORIGIN.split(',') }));
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.use('/api', saleRoutes);
  app.use('/api', productRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
