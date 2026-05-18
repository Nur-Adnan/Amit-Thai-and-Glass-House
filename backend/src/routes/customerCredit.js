/**
 * Customer Credit Routes
 * Routes for customer credit management, due aging, and credit control
 */

import express from 'express';
import {
  getDueAgingReport,
  calculateDueAging,
  getCustomersAtRisk,
  updateCreditLimit,
  updateCreditStatus,
  checkCreditEligibility,
  getCreditControlDashboard
} from '../controllers/customerCreditController.js';
import { protect, managerAndAbove } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Public routes (all authenticated users)
router.get('/due-aging', getDueAgingReport);
router.get('/at-risk', getCustomersAtRisk);
router.get('/dashboard', getCreditControlDashboard);
router.get('/:id/eligibility', checkCreditEligibility);

// Manager and above routes
router.post('/calculate-aging', managerAndAbove, calculateDueAging);
router.put('/:id/credit-limit', managerAndAbove, updateCreditLimit);
router.put('/:id/status', managerAndAbove, updateCreditStatus);

export default router;