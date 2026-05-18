import express from 'express';
import {
  getInvestments,
  getInvestment,
  createInvestment,
  updateInvestment,
  getInvestmentSummary,
  getInvestmentStats,
  searchInvestments,
  approveInvestment,
  rejectInvestment
} from '../controllers/investmentController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { body, param, query } from 'express-validator';

const router = express.Router();

// Validation rules
const createInvestmentValidation = [
  body('type')
    .notEmpty()
    .withMessage('Investment type is required')
    .isIn(['stock_purchase', 'equipment', 'infrastructure', 'marketing', 'other'])
    .withMessage('Invalid investment type'),
  body('category')
    .notEmpty()
    .withMessage('Investment category is required')
    .isIn(['inventory', 'fixed_asset', 'operational', 'marketing', 'miscellaneous'])
    .withMessage('Invalid investment category'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Description must be between 5 and 200 characters'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Investment amount must be greater than 0'),
  body('investmentDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid investment date format'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'bank', 'check', 'mobile_banking', 'credit_card'])
    .withMessage('Invalid payment method'),
  body('expectedROI.percentage')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Expected ROI percentage must be between 0 and 1000'),
  body('expectedROI.timeframe')
    .optional()
    .isIn(['monthly', 'quarterly', 'yearly'])
    .withMessage('Invalid ROI timeframe'),
  body('depreciation.method')
    .optional()
    .isIn(['straight_line', 'declining_balance', 'none'])
    .withMessage('Invalid depreciation method'),
  body('depreciation.rate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Depreciation rate must be between 0 and 100'),
  body('depreciation.usefulLife')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Useful life must be at least 1 year'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isLength({ max: 30 })
    .withMessage('Each tag cannot exceed 30 characters')
];

const updateInvestmentValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid investment ID'),
  body('description')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Description must be between 5 and 200 characters'),
  body('expectedROI.percentage')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Expected ROI percentage must be between 0 and 1000'),
  body('expectedROI.timeframe')
    .optional()
    .isIn(['monthly', 'quarterly', 'yearly'])
    .withMessage('Invalid ROI timeframe'),
  body('depreciation.method')
    .optional()
    .isIn(['straight_line', 'declining_balance', 'none'])
    .withMessage('Invalid depreciation method'),
  body('depreciation.rate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Depreciation rate must be between 0 and 100'),
  body('depreciation.usefulLife')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Useful life must be at least 1 year'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isLength({ max: 30 })
    .withMessage('Each tag cannot exceed 30 characters')
];

const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid investment ID')
];

const searchValidation = [
  query('q')
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters')
];

const rejectValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid investment ID'),
  body('reason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Rejection reason cannot exceed 200 characters')
];

// Apply authentication to all routes
router.use(protect);

// Public routes (all authenticated users)
router.get('/search', searchValidation, validateRequest, searchInvestments);
router.get('/:id', idValidation, validateRequest, getInvestment);

// Manager and above routes
router.use(authorize('manager', 'owner'));

router.route('/')
  .get(getInvestments)
  .post(createInvestmentValidation, validateRequest, createInvestment);

router.get('/stats/summary', getInvestmentSummary);
router.get('/stats/analytics', getInvestmentStats);

router.put('/:id', updateInvestmentValidation, validateRequest, updateInvestment);

// Owner only routes
router.use(authorize('owner'));

router.put('/:id/approve', idValidation, validateRequest, approveInvestment);
router.put('/:id/reject', rejectValidation, validateRequest, rejectInvestment);

export default router;