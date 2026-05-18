import express from 'express';
import {
  getInventoryFormData,
  validateInventoryItem,
  addInventoryItem,
  updateInventoryStock,
  getInventoryOverview,
  getQuickStockView,
  getLowStockItems,
  searchInventory
} from '../controllers/inventoryController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { body, param, query } from 'express-validator';

const router = express.Router();

// Validation rules
const addInventoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),
  body('materialType')
    .isIn(['Glass', 'Thai'])
    .withMessage('Material type must be Glass or Thai'),
  body('company')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Company name must be between 2 and 50 characters'),
  body('thicknessMM')
    .optional()
    .isFloat({ min: 1, max: 50 })
    .withMessage('Thickness must be between 1 and 50 mm'),
  body('quality')
    .isIn(['Local', 'Imported', 'Premium'])
    .withMessage('Quality must be Local, Imported, or Premium'),
  body('measurementType')
    .isIn(['SFT', 'RFT', 'PANEL', 'SHEET', 'PIECE'])
    .withMessage('Measurement type must be SFT, RFT, PANEL, SHEET, or PIECE'),
  body('purchasePrice')
    .isFloat({ min: 0.01, max: 1000000 })
    .withMessage('Purchase price must be between ৳0.01 and ৳10,00,000'),
  body('sellingPrice')
    .isFloat({ min: 0.01, max: 1000000 })
    .withMessage('Selling price must be between ৳0.01 and ৳10,00,000'),
  body('stockQuantity')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

const validateInventoryValidation = [
  body('materialType')
    .isIn(['Glass', 'Thai'])
    .withMessage('Material type must be Glass or Thai'),
  body('company')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Company name is required and must not exceed 50 characters'),
  body('thicknessMM')
    .optional()
    .isFloat({ min: 1, max: 50 })
    .withMessage('Thickness must be between 1 and 50 mm'),
  body('quality')
    .isIn(['Local', 'Imported', 'Premium'])
    .withMessage('Quality must be Local, Imported, or Premium'),
  body('measurementType')
    .optional()
    .isIn(['SFT', 'RFT', 'PANEL', 'SHEET', 'PIECE'])
    .withMessage('Measurement type must be SFT, RFT, PANEL, SHEET, or PIECE')
];

const updateStockValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  body('operation')
    .isIn(['add', 'subtract', 'set'])
    .withMessage('Operation must be add, subtract, or set'),
  body('reason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters')
];

const searchValidation = [
  query('q')
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters long'),
  query('minStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stock must be a non-negative integer'),
  query('maxStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Maximum stock must be a non-negative integer')
];

const quickViewValidation = [
  query('materialType')
    .optional()
    .isIn(['Glass', 'Thai'])
    .withMessage('Material type must be Glass or Thai'),
  query('thicknessMM')
    .optional()
    .isFloat({ min: 1, max: 50 })
    .withMessage('Thickness must be between 1 and 50 mm'),
  query('quality')
    .optional()
    .isIn(['Local', 'Imported', 'Premium'])
    .withMessage('Quality must be Local, Imported, or Premium'),
  query('lowStockThreshold')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Low stock threshold must be between 1 and 1000'),
  query('sortBy')
    .optional()
    .isIn(['stockQuantity', 'materialType', 'company', 'thicknessMM', 'quality', 'name'])
    .withMessage('Sort by must be stockQuantity, materialType, company, thicknessMM, quality, or name'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// Apply authentication to all routes
router.use(protect);

// Public routes (all authenticated users)
router.get('/form-data', getInventoryFormData);
router.get('/overview', getInventoryOverview);
router.get('/quick-view', quickViewValidation, validateRequest, getQuickStockView);
router.get('/search', searchValidation, validateRequest, searchInventory);

// Validation route
router.post('/validate', validateInventoryValidation, validateRequest, validateInventoryItem);

// Manager and above routes
router.post('/add', authorize('manager', 'owner'), addInventoryValidation, validateRequest, addInventoryItem);
router.put('/:id/stock', authorize('manager', 'owner'), updateStockValidation, validateRequest, updateInventoryStock);
router.get('/low-stock', authorize('manager', 'owner'), getLowStockItems);

export default router;