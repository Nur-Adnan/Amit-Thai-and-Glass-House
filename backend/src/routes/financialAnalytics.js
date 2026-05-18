import express from 'express';
import {
  getFinancialOverview,
  getCashFlowAnalysis,
  getCollectionRecommendations
} from '../controllers/financialAnalyticsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

/**
 * @route GET /api/financial-analytics/overview
 * @desc Get comprehensive financial analytics with warning signals
 * @access Private (Owner, Manager)
 */
router.get('/overview', authorize('owner', 'manager'), getFinancialOverview);

/**
 * @route GET /api/financial-analytics/cash-flow
 * @desc Get daily cash flow analysis
 * @access Private (Owner, Manager)
 */
router.get('/cash-flow', authorize('owner', 'manager'), getCashFlowAnalysis);

/**
 * @route GET /api/financial-analytics/collection-recommendations
 * @desc Get due collection recommendations
 * @access Private (Owner, Manager)
 */
router.get('/collection-recommendations', authorize('owner', 'manager'), getCollectionRecommendations);

export default router;