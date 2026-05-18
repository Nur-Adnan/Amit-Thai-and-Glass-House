import express from 'express';
import {
  getStockByCompany,
  getProfitByThickness,
  getSalesByBrand,
  getFastMovingThickness,
  getBusinessDashboard
} from '../controllers/businessAnalyticsController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { query } from 'express-validator';

const router = express.Router();

// Validation rules
const dateRangeValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate) {
        const start = new Date(req.query.startDate);
        const end = new Date(endDate);
        if (end < start) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    })
];

const materialTypeValidation = [
  query('materialType')
    .optional()
    .isIn(['Thai', 'Glass'])
    .withMessage('Material type must be Thai or Glass')
];

const qualityValidation = [
  query('quality')
    .optional()
    .isIn(['Local', 'Imported'])
    .withMessage('Quality must be Local or Imported')
];

const sortValidation = [
  query('sortBy')
    .optional()
    .isString()
    .withMessage('Sort by must be a string'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

const limitValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const stockByCompanyValidation = [
  ...materialTypeValidation,
  ...qualityValidation,
  ...sortValidation,
  query('sortBy')
    .optional()
    .isIn(['totalStock', 'totalValue', 'totalCost', 'potentialProfit', 'profitMargin', 'productCount'])
    .withMessage('Invalid sort field for stock by company report')
];

const profitByThicknessValidation = [
  ...dateRangeValidation,
  ...materialTypeValidation,
  ...sortValidation,
  query('company')
    .optional()
    .isString()
    .isLength({ min: 2, max: 50 })
    .withMessage('Company name must be between 2 and 50 characters'),
  query('sortBy')
    .optional()
    .isIn(['totalProfit', 'totalRevenue', 'totalCost', 'profitMargin', 'totalQuantitySold', 'invoiceCount'])
    .withMessage('Invalid sort field for profit by thickness report')
];

const salesByBrandValidation = [
  ...dateRangeValidation,
  ...materialTypeValidation,
  ...qualityValidation,
  ...sortValidation,
  query('sortBy')
    .optional()
    .isIn(['totalRevenue', 'totalQuantitySold', 'invoiceCount', 'customerCount', 'avgOrderValue'])
    .withMessage('Invalid sort field for sales by brand report')
];

const fastMovingThicknessValidation = [
  ...dateRangeValidation,
  ...materialTypeValidation,
  ...limitValidation,
  ...sortValidation,
  query('company')
    .optional()
    .isString()
    .isLength({ min: 2, max: 50 })
    .withMessage('Company name must be between 2 and 50 characters'),
  query('sortBy')
    .optional()
    .isIn(['velocity', 'frequency', 'totalQuantitySold', 'totalRevenue', 'turnoverRate', 'stockDays'])
    .withMessage('Invalid sort field for fast moving thickness report')
];

const dashboardValidation = [
  ...dateRangeValidation
];

// Apply authentication to all routes
router.use(protect);

// Manager and above routes
router.use(authorize('manager', 'owner'));

// Business Analytics Routes
router.get('/stock-by-company', 
  stockByCompanyValidation, 
  validateRequest, 
  getStockByCompany
);

router.get('/profit-by-thickness', 
  profitByThicknessValidation, 
  validateRequest, 
  getProfitByThickness
);

router.get('/sales-by-brand', 
  salesByBrandValidation, 
  validateRequest, 
  getSalesByBrand
);

router.get('/fast-moving-thickness', 
  fastMovingThicknessValidation, 
  validateRequest, 
  getFastMovingThickness
);

router.get('/dashboard', 
  dashboardValidation, 
  validateRequest, 
  getBusinessDashboard
);

export default router;