import express from 'express';
import {
  getConfigs,
  getConfig,
  saveConfig,
  calculateMeasurement,
  getMeasurementTypes,
  getCalculationHistory,
  deleteConfig,
  bulkCalculate,
  getGlassPricing,
  updateGlassPricing,
  getGlassPricingHistory,
  getAvailableVariants,
  getVariantDetails,
  calculateWithVariant,
  checkStockAvailability
} from '../controllers/calculatorController.js';
import { protect, managerAndAbove } from '../middleware/auth.js';
import { validateCalculatorRules } from '../middleware/businessRulesMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Configuration routes
router.route('/config')
  .get(getConfigs)
  .post(managerAndAbove, saveConfig);

router.route('/config/:materialType')
  .get(getConfig)
  .delete(managerAndAbove, deleteConfig);

// Measurement types route
router.get('/measurement-types/:materialType', getMeasurementTypes);

// Calculation routes
router.post('/calculate', validateCalculatorRules, calculateMeasurement);
router.post('/bulk-calculate', validateCalculatorRules, bulkCalculate);
router.get('/history', getCalculationHistory);

// Stock-aware variant calculation routes
router.get('/variants', getAvailableVariants);
router.get('/variant/:productId', getVariantDetails);
router.post('/calculate-variant', validateCalculatorRules, calculateWithVariant);
router.post('/check-stock', checkStockAvailability);

// Glass pricing routes
router.get('/glass-pricing', getGlassPricing); // Get all glass pricing
router.get('/glass-pricing/:materialType', getGlassPricing);
router.put('/glass-pricing', managerAndAbove, updateGlassPricing);
router.get('/glass-pricing/:materialType/:thickness/:quality/history', managerAndAbove, getGlassPricingHistory);

export default router;