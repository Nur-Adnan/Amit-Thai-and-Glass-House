/**
 * Supplier Routes
 * Routes for supplier management including due tracking and purchase history
 */

import express from 'express';
import {
  getSuppliers,
  getSupplier,
  getSupplierBySupplierId,
  createSupplier,
  updateSupplier,
  updateSupplierDue,
  makeSupplierPayment,
  getSupplierStats,
  searchSuppliers,
  deleteSupplier,
  restoreSupplier
} from '../controllers/supplierController.js';
import { protect, managerAndAbove } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Public routes (all authenticated users)
router.get('/', getSuppliers);
router.get('/stats', getSupplierStats);
router.get('/search', searchSuppliers);
router.get('/by-supplier-id/:supplierId', getSupplierBySupplierId);
router.get('/:id', getSupplier);

// Manager and above routes
router.post('/', managerAndAbove, createSupplier);
router.put('/:id', managerAndAbove, updateSupplier);
router.put('/:id/due', managerAndAbove, updateSupplierDue);
router.post('/:id/payment', managerAndAbove, makeSupplierPayment);
router.delete('/:id', managerAndAbove, deleteSupplier);
router.put('/:id/restore', managerAndAbove, restoreSupplier);

export default router;