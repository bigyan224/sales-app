import { Router } from 'express';
import {
  batchSync,
  createBill,
  deleteBill,
  getBill,
  listBills,
  updateBill,
} from '../controllers/billController.js';

const router = Router();

// Note: static routes must be registered before the `/:id` route.
router.post('/bills/batch-sync', batchSync);
router.get('/bills', listBills);
router.get('/bills/:id', getBill);
router.post('/bills', createBill);
router.put('/bills/:id', updateBill);
router.delete('/bills/:id', deleteBill);

export default router;
