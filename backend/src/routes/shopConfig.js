import express from 'express';
import {
  getShopConfig,
  getShopConfigAdmin,
  createOrUpdateShopConfig,
  updateTrustInfo,
  uploadShopLogo,
  deleteShopLogo,
  resetShopConfig,
  getInvoicePreview,
  testInvoiceNumber,
  upload
} from '../controllers/shopConfigController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes (for invoice display)
router.get('/', getShopConfig);

// Protected routes (Owner only)
router.use(protect);
router.use(authorize('owner'));

// Admin routes
router.get('/admin', getShopConfigAdmin);
router.post('/', createOrUpdateShopConfig);
router.put('/trust-info', updateTrustInfo);
router.post('/reset', resetShopConfig);

// Logo management
router.post('/logo', upload.single('logo'), uploadShopLogo);
router.delete('/logo', deleteShopLogo);

// Preview and testing
router.get('/invoice-preview', getInvoicePreview);
router.get('/test-invoice-number', testInvoiceNumber);

export default router;