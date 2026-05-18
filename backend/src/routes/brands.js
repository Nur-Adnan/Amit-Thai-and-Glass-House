import express from 'express';
import {
  getBrands,
  getBrandsByMaterialType,
  getBrand,
  createBrand,
  updateBrand,
  deactivateBrand,
  activateBrand,
  deleteBrand,
  restoreBrand,
  getDeletedBrands,
  getBrandSuggestions,
  checkBrandName,
  getBrandStats
} from '../controllers/brandController.js';
import { protect } from '../middleware/auth.js';
import { 
  canCreateProduct,
  canEditProduct,
  canDeleteProduct,
  requireAnyPermission
} from '../middleware/permissions.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Special routes (must be before /:id routes)
router.get('/suggestions', getBrandSuggestions); // All authenticated users can get suggestions
router.get('/stats', requireAnyPermission(['CAN_EDIT_PRODUCT', 'CAN_VIEW_PROFIT']), getBrandStats);
router.get('/deleted', canDeleteProduct, getDeletedBrands);
router.post('/check-name', canCreateProduct, checkBrandName);

// Material type specific route
router.get('/material/:materialType', getBrandsByMaterialType); // All authenticated users

// Basic CRUD routes
router.route('/')
  .get(getBrands) // All authenticated users can view brands
  .post(canCreateProduct, createBrand); // Managers can create brands

router.route('/:id')
  .get(getBrand) // All authenticated users can view individual brands
  .put(canEditProduct, updateBrand) // Managers can edit brands
  .delete(canDeleteProduct, deleteBrand); // Managers can delete brands

// Brand status management
router.put('/:id/activate', canEditProduct, activateBrand);
router.put('/:id/deactivate', canEditProduct, deactivateBrand);
router.put('/:id/restore', canDeleteProduct, restoreBrand);

export default router;