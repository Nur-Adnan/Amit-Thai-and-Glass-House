import express from 'express';
import {
  runBusinessValidation,
  validateInvoiceCalculations,
  validateSalaryCalculations,
  fixNegativeStock,
  fixNegativeDue,
  createMissingSalaryExpenses
} from '../controllers/validationController.js';
import { protect, managerAndAbove, ownerOnly } from '../middleware/auth.js';

const router = express.Router();

// All validation routes require authentication
router.use(protect);

// Business validation checks
router.get('/business-rules', managerAndAbove, runBusinessValidation);

// Calculation validation
router.post('/invoice-calculations', managerAndAbove, validateInvoiceCalculations);
router.post('/salary-calculations', managerAndAbove, validateSalaryCalculations);

// Fix operations (Owner only)
router.post('/fix-negative-stock', ownerOnly, fixNegativeStock);
router.post('/fix-negative-due', ownerOnly, fixNegativeDue);
router.post('/create-missing-salary-expenses', ownerOnly, createMissingSalaryExpenses);

export default router;