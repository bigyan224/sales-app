import { Router } from 'express';
import {
  batchSync,
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from '../controllers/productController.js';

const router = Router();

// Note: static routes must be registered before the `/:id` route.
router.post('/products/batch-sync', batchSync);
router.get('/products', listProducts);
router.get('/products/:id', getProduct);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

export default router;
