/**
 * Wastage Routes
 * Routes for glass cutting wastage tracking and reporting
 */

import express from 'express';
import {
  getMonthlyWastageReport,
  getWastageTrends,
  getTopWastageProducts,
  updateInvoiceItemWastage,
  getInvoiceWastageDetails,
  getWastageDashboard
} from '../controllers/wastageController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { body, param, query } from 'express-validator';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Validation rules
const monthlyReportValidation = [
  query('year')
    .optional()
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be between 2020 and 2030'),
  
  query('month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  
  query('category')
    .optional()
    .isIn(['cutting', 'breakage', 'measurement_error', 'quality_issue', 'other'])
    .withMessage('Invalid wastage category'),
  
  query('productId')
    .optional()
    .isMongoId()
    .withMessage('Invalid product ID'),
  
  query('includeZeroWastage')
    .optional()
    .isBoolean()
    .withMessage('includeZeroWastage must be true or false')
];

const trendsValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in ISO format (YYYY-MM-DD)'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be in ISO format (YYYY-MM-DD)'),
  
  query('groupBy')
    .optional()
    .isIn(['month', 'day'])
    .withMessage('Group by must be month or day')
];

const topProductsValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in ISO format (YYYY-MM-DD)'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be in ISO format (YYYY-MM-DD)'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

const updateWastageValidation = [
  param('invoiceId')
    .isMongoId()
    .withMessage('Invalid invoice ID'),
  
  param('itemIndex')
    .isInt({ min: 0 })
    .withMessage('Item index must be a non-negative integer'),
  
  body('inputMethod')
    .isIn(['percentage', 'manual', 'none'])
    .withMessage('Input method must be percentage, manual, or none'),
  
  body('percentage')
    .if(body('inputMethod').equals('percentage'))
    .isFloat({ min: 0, max: 100 })
    .withMessage('Percentage must be between 0 and 100'),
  
  body('manualAmount')
    .if(body('inputMethod').equals('manual'))
    .isFloat({ min: 0 })
    .withMessage('Manual amount must be 0 or greater'),
  
  body('category')
    .optional()
    .isIn(['cutting', 'breakage', 'measurement_error', 'quality_issue', 'other'])
    .withMessage('Invalid wastage category'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

// @route   GET /api/wastage/monthly-report
// @desc    Get monthly wastage report
// @access  Private (All authenticated users)
router.get('/monthly-report', monthlyReportValidation, validateRequest, getMonthlyWastageReport);

// @route   GET /api/wastage/trends
// @desc    Get wastage trends over time
// @access  Private (All authenticated users)
router.get('/trends', trendsValidation, validateRequest, getWastageTrends);

// @route   GET /api/wastage/top-products
// @desc    Get top wastage products
// @access  Private (All authenticated users)
router.get('/top-products', topProductsValidation, validateRequest, getTopWastageProducts);

// @route   GET /api/wastage/dashboard
// @desc    Get wastage dashboard summary
// @access  Private (All authenticated users)
router.get('/dashboard', getWastageDashboard);

// @route   GET /api/wastage/invoice/:invoiceId
// @desc    Get invoice wastage details
// @access  Private (All authenticated users)
router.get('/invoice/:invoiceId', [
  param('invoiceId')
    .isMongoId()
    .withMessage('Invalid invoice ID')
], validateRequest, getInvoiceWastageDetails);

// @route   PUT /api/wastage/invoice/:invoiceId/item/:itemIndex
// @desc    Update invoice item wastage
// @access  Private (All authenticated users)
router.put('/invoice/:invoiceId/item/:itemIndex', updateWastageValidation, validateRequest, updateInvoiceItemWastage);

export default router;