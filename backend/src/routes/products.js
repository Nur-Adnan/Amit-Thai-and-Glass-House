import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  getDeletedProducts,
  updateStock,
  validateDangerousEdit,
  getDangerousEditHistory,
  getLowStockProducts,
  getProductStats,
  getProductVariants,
  checkVariantExists
} from '../controllers/productController.js';
import { protect } from '../middleware/auth.js';
import { 
  canCreateProduct,
  canEditProduct,
  canEditPrice,
  canDeleteProduct,
  canManageStock,
  requireAnyPermission
} from '../middleware/permissions.js';
import { 
  validateProductCreationRules,
  validateProductUpdateRules,
  validateBrandUsageRules
} from '../middleware/businessRulesMiddleware.js';
import { requiresConfirmation } from '../middleware/confirmationRequired.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Special routes (must be before /:id routes)
router.get('/low-stock', requireAnyPermission(['CAN_MANAGE_STOCK', 'CAN_VIEW_PROFIT']), getLowStockProducts);
router.get('/stats', requireAnyPermission(['CAN_EDIT_PRODUCT', 'CAN_VIEW_PROFIT']), getProductStats);
router.get('/deleted', canDeleteProduct, getDeletedProducts);

// Variant management routes
router.post('/check-variant', canCreateProduct, checkVariantExists);
router.get('/:name/variants', getProductVariants);

// Basic CRUD routes
router.route('/')
  .get(getProducts) // All authenticated users can view products
  .post(canCreateProduct, validateProductCreationRules, validateBrandUsageRules, createProduct);

router.route('/:id')
  .get(getProduct) // All authenticated users can view individual products
  .put(canEditProduct, validateProductUpdateRules, validateBrandUsageRules, updateProduct)
  .delete(canDeleteProduct, deleteProduct);

// Soft delete management
router.put('/:id/restore', canDeleteProduct, restoreProduct);

// Stock management - requires both stock permission and price permission for price changes
router.put('/:id/stock', canManageStock, requiresConfirmation('stock_manual_adjustment'), updateStock);

// Dangerous edit validation and history
router.post('/:id/validate-edit', canEditProduct, validateDangerousEdit);
router.get('/:id/edit-history', requireAnyPermission(['CAN_EDIT_PRODUCT', 'CAN_VIEW_AUDIT']), getDangerousEditHistory);

export default router;