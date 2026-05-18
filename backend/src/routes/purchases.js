/**
 * Purchase Routes
 * Routes for managing product purchases from suppliers
 */

import express from 'express';
import {
  getPurchases,
  getPurchase,
  createPurchase,
  updatePurchase,
  makePurchasePayment,
  getPurchaseStats,
  getSupplierPurchases,
  deletePurchase
} from '../controllers/purchaseController.js';
import { protect, managerAndAbove } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Public routes (all authenticated users)
router.get('/', getPurchases);
router.get('/stats', getPurchaseStats);
router.get('/supplier/:supplierId', getSupplierPurchases);
router.get('/:id', getPurchase);

// Manager and above routes
router.post('/', managerAndAbove, createPurchase);
router.put('/:id', managerAndAbove, updatePurchase);
router.post('/:id/payment', managerAndAbove, makePurchasePayment);
router.delete('/:id', managerAndAbove, deletePurchase);

export default router;