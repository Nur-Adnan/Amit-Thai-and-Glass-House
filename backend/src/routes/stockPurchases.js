import express from 'express';
import {
  getStockPurchases,
  getStockPurchase,
  createStockPurchase,
  updatePayment,
  getStockPurchaseStats,
  getPendingPayments,
  searchStockPurchases
} from '../controllers/stockPurchaseController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { validateStockPurchaseRules } from '../middleware/businessRulesMiddleware.js';
import { body, param, query } from 'express-validator';

const router = express.Router();

// Validation rules
const createStockPurchaseValidation = [
  body('supplierId')
    .notEmpty()
    .withMessage('Supplier ID is required')
    .isMongoId()
    .withMessage('Invalid supplier ID'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one item is required'),
  body('items.*.product')
    .notEmpty()
    .withMessage('Product is required for each item')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('items.*.quantity')
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be greater than 0'),
  body('items.*.purchasePrice')
    .isFloat({ min: 0 })
    .withMessage('Purchase price must be 0 or greater'),
  body('discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount must be 0 or greater'),
  body('discountType')
    .optional()
    .isIn(['amount', 'percentage'])
    .withMessage('Discount type must be amount or percentage'),
  body('paidAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Paid amount must be 0 or greater'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'bank', 'check', 'mobile_banking', 'credit'])
    .withMessage('Invalid payment method'),
  body('purchaseDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid purchase date format'),
  body('deliveryDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid delivery date format'),
  body('transportCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Transport cost must be 0 or greater'),
  body('otherCharges')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Other charges must be 0 or greater')
];

const updatePaymentValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid stock purchase ID'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Payment amount must be greater than 0'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'bank', 'check', 'mobile_banking', 'credit'])
    .withMessage('Invalid payment method')
];

const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid stock purchase ID')
];

const searchValidation = [
  query('q')
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters')
];

// Apply authentication to all routes
router.use(protect);

// Public routes (all authenticated users)
router.get('/search', searchValidation, validateRequest, searchStockPurchases);
router.get('/:id', idValidation, validateRequest, getStockPurchase);

// Manager and above routes
router.use(authorize('manager', 'owner'));

router.route('/')
  .get(getStockPurchases)
  .post(createStockPurchaseValidation, validateRequest, validateStockPurchaseRules, createStockPurchase);

router.get('/stats/summary', getStockPurchaseStats);
router.get('/payments/pending', getPendingPayments);

router.put('/:id/payment', updatePaymentValidation, validateRequest, updatePayment);

export default router;