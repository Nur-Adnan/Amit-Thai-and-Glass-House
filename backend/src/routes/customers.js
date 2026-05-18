import express from 'express';
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  restoreCustomer,
  getDeletedCustomers,
  deactivateCustomer,
  activateCustomer,
  recalculateCustomerTotals,
  getCustomerStats,
  searchCustomers,
  getCustomersWithDue
} from '../controllers/customerController.js';
import { protect, managerAndAbove } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Public routes (all authenticated users) - specific routes first
router.get('/search', searchCustomers);
router.get('/stats', managerAndAbove, getCustomerStats);
router.get('/due-balances', managerAndAbove, getCustomersWithDue);
router.get('/deleted', managerAndAbove, getDeletedCustomers);

// General routes
router.get('/', getCustomers);
router.get('/:id', getCustomer);

// Manager and above routes
router.post('/', managerAndAbove, createCustomer);
router.put('/:id', managerAndAbove, updateCustomer);
router.delete('/:id', managerAndAbove, deleteCustomer);
router.put('/:id/restore', managerAndAbove, restoreCustomer);
router.put('/:id/deactivate', managerAndAbove, deactivateCustomer);
router.put('/:id/activate', managerAndAbove, activateCustomer);
router.put('/:id/recalculate', managerAndAbove, recalculateCustomerTotals);

export default router;