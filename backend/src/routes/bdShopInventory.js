import express from 'express';
import {
  getStockFormData,
  searchCompanies,
  addNewCompany,
  addStock,
  getStockSummary
} from '../controllers/bdShopInventoryController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { 
  validateProductCreationRules,
  validateBrandUsageRules 
} from '../middleware/businessRulesMiddleware.js';
import { body, query } from 'express-validator';

const router = express.Router();

// Form data route
router.get('/form-data', protect, authorize('manager', 'owner'), getStockFormData);

// Company search and management
router.get('/search-companies', protect, authorize('manager', 'owner'), searchCompanies);

// Stock management
router.post('/add-stock', protect, authorize('manager', 'owner'), addStock);

router.get('/summary', protect, authorize('manager', 'owner'), getStockSummary);

export default router;