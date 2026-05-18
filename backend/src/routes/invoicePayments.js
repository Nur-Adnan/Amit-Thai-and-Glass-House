import express from 'express';
import {
  addPayment,
  getPaymentHistory,
  getPayment,
  reversePayment,
  getAllPayments,
  getPaymentStats
} from '../controllers/invoicePaymentController.js';
import { protect, managerAndAbove } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Payment statistics (must be before /:paymentId routes)
router.get('/stats', managerAndAbove, getPaymentStats);

// All payments across invoices
router.get('/', managerAndAbove, getAllPayments);

// Single payment operations
router.get('/:paymentId', getPayment);
router.put('/:paymentId/reverse', managerAndAbove, reversePayment);

export default router;