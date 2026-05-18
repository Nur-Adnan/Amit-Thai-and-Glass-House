import express from 'express';
import {
  calculateDailyProfitAnalysis,
  calculateMonthlyProfitAnalysis,
  calculateProductWiseProfitAnalysis,
  getProfitAnalyses,
  getProfitAnalysis,
  getProfitTrendsAnalysis,
  getTopPerformingProductsAnalysis,
  getProfitDashboard,
  deleteProfitAnalysis
} from '../controllers/profitController.js';
import { protect } from '../middleware/auth.js';
import { 
  canViewProfit,
  requirePermission
} from '../middleware/permissions.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Calculation routes (Can view profit)
router.post('/daily', canViewProfit, calculateDailyProfitAnalysis);
router.post('/monthly', canViewProfit, calculateMonthlyProfitAnalysis);
router.post('/product-wise', canViewProfit, calculateProductWiseProfitAnalysis);

// Analysis retrieval routes (Can view profit)
router.get('/analyses', canViewProfit, getProfitAnalyses);
router.get('/analyses/:id', canViewProfit, getProfitAnalysis);

// Analytics routes (Can view profit)
router.get('/trends', canViewProfit, getProfitTrendsAnalysis);
router.get('/top-products', canViewProfit, getTopPerformingProductsAnalysis);
router.get('/dashboard', canViewProfit, getProfitDashboard);

// Management routes (Owner only)
router.delete('/analyses/:id', requirePermission('CAN_MANAGE_PERMISSIONS'), deleteProfitAnalysis);

export default router;