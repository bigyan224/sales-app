import { Router } from 'express';
import {
  batchSync,
  createSale,
  deleteSale,
  getSale,
  getSummary,
  listSales,
  updateSale,
} from '../controllers/saleController.js';

const router = Router();

// Note: static routes must be registered before the `/:id` route.
router.get('/sales/summary', getSummary);
router.post('/sales/batch-sync', batchSync);
router.get('/sales', listSales);
router.get('/sales/:id', getSale);
router.post('/sales', createSale);
router.put('/sales/:id', updateSale);
router.delete('/sales/:id', deleteSale);

export default router;
