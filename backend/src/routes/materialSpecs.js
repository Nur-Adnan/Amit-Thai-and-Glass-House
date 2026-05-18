import express from 'express';
import {
  getMaterialSpecs,
  getMaterialSpec,
  createMaterialSpec,
  updateMaterialSpec,
  deleteMaterialSpec,
  restoreMaterialSpec,
  activateMaterialSpec,
  deactivateMaterialSpec,
  getSpecsByMaterialType,
  getThicknessOptions,
  getQualityOptions,
  getDropdownOptions,
  validateSpec,
  getDefaultUnit,
  getMaterialSpecStats
} from '../controllers/materialSpecController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { body, param, query } from 'express-validator';

const router = express.Router();

// Validation rules
const createMaterialSpecValidation = [
  body('materialType')
    .isIn(['Glass', 'Thai'])
    .withMessage('Material type must be either Glass or Thai'),
  body('quality')
    .isIn(['Local', 'Imported', 'Premium'])
    .withMessage('Quality must be Local, Imported, or Premium'),
  body('defaultUnit')
    .isIn(['SFT', 'RFT', 'PANEL', 'SHEET', 'PIECE'])
    .withMessage('Default unit must be SFT, RFT, PANEL, SHEET, or PIECE'),
  body('thicknessMM')
    .optional()
    .isFloat({ min: 1, max: 50 })
    .withMessage('Thickness must be between 1 and 50 mm'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

const updateMaterialSpecValidation = [
  body('materialType')
    .optional()
    .isIn(['Glass', 'Thai'])
    .withMessage('Material type must be either Glass or Thai'),
  body('quality')
    .optional()
    .isIn(['Local', 'Imported', 'Premium'])
    .withMessage('Quality must be Local, Imported, or Premium'),
  body('defaultUnit')
    .optional()
    .isIn(['SFT', 'RFT', 'PANEL', 'SHEET', 'PIECE'])
    .withMessage('Default unit must be SFT, RFT, PANEL, SHEET, or PIECE'),
  body('thicknessMM')
    .optional()
    .isFloat({ min: 1, max: 50 })
    .withMessage('Thickness must be between 1 and 50 mm'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const materialTypeValidation = [
  param('materialType')
    .isIn(['Glass', 'Thai'])
    .withMessage('Material type must be either Glass or Thai')
];

const validateSpecValidation = [
  body('materialType')
    .isIn(['Glass', 'Thai'])
    .withMessage('Material type must be either Glass or Thai'),
  body('quality')
    .isIn(['Local', 'Imported', 'Premium'])
    .withMessage('Quality must be Local, Imported, or Premium'),
  body('thicknessMM')
    .optional()
    .isFloat({ min: 1, max: 50 })
    .withMessage('Thickness must be between 1 and 50 mm')
];

const defaultUnitValidation = [
  body('materialType')
    .isIn(['Glass', 'Thai'])
    .withMessage('Material type must be either Glass or Thai'),
  body('thicknessMM')
    .optional()
    .isFloat({ min: 1, max: 50 })
    .withMessage('Thickness must be between 1 and 50 mm'),
  body('quality')
    .optional()
    .isIn(['Local', 'Imported', 'Premium'])
    .withMessage('Quality must be Local, Imported, or Premium')
];

// Apply authentication to all routes
router.use(protect);

// Public routes (all authenticated users)
router.get('/', getMaterialSpecs);
router.get('/dropdown-options', getDropdownOptions);
router.get('/by-material/:materialType', materialTypeValidation, validateRequest, getSpecsByMaterialType);
router.get('/thickness-options/:materialType', materialTypeValidation, validateRequest, getThicknessOptions);
router.get('/quality-options/:materialType', materialTypeValidation, validateRequest, getQualityOptions);
router.get('/:id', getMaterialSpec);

// Validation routes
router.post('/validate', validateSpecValidation, validateRequest, validateSpec);
router.post('/default-unit', defaultUnitValidation, validateRequest, getDefaultUnit);

// Manager and above routes
router.post('/', authorize('manager', 'owner'), createMaterialSpecValidation, validateRequest, createMaterialSpec);
router.put('/:id', authorize('manager', 'owner'), updateMaterialSpecValidation, validateRequest, updateMaterialSpec);
router.delete('/:id', authorize('manager', 'owner'), deleteMaterialSpec);
router.put('/:id/restore', authorize('manager', 'owner'), restoreMaterialSpec);
router.put('/:id/activate', authorize('manager', 'owner'), activateMaterialSpec);
router.put('/:id/deactivate', authorize('manager', 'owner'), deactivateMaterialSpec);

// Statistics (Manager and above)
router.get('/stats/overview', authorize('manager', 'owner'), getMaterialSpecStats);

export default router;