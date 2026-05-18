import express from 'express';
import { 
  updateServiceCharges,
  getServiceCostSummary,
  getTopInstallers,
  getServiceCostTrends
} from '../controllers/serviceCostController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

/**
 * @route PUT /api/service-cost/:invoiceId/charges
 * @desc Update service charges for an invoice
 * @access Private (Owner, Manager, Accountant)
 */
router.put('/:invoiceId/charges', authorize('owner', 'manager', 'accountant'), updateServiceCharges);

/**
 * @route GET /api/service-cost/summary
 * @desc Get service cost summary for a date range
 * @access Private (Owner, Manager, Accountant)
 */
router.get('/summary', authorize('owner', 'manager', 'accountant'), getServiceCostSummary);

/**
 * @route GET /api/service-cost/top-installers
 * @desc Get top installers by service volume
 * @access Private (Owner, Manager)
 */
router.get('/top-installers', authorize('owner', 'manager'), getTopInstallers);

/**
 * @route GET /api/service-cost/trends
 * @desc Get service cost trends over time
 * @access Private (Owner, Manager)
 */
router.get('/trends', authorize('owner', 'manager'), getServiceCostTrends);

export default router;