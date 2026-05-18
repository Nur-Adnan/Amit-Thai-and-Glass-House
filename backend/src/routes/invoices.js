import express from 'express';
import {
  getInvoices,
  getInvoice,
  createInvoice,
  updatePayment,
  cancelInvoice,
  deleteInvoice,
  restoreInvoice,
  getDeletedInvoices,
  getInvoiceStats,
  getPendingPayments,
  searchInvoices
} from '../controllers/invoiceController.js';
import {
  addPayment,
  getPaymentHistory
} from '../controllers/invoicePaymentController.js';
import { protect } from '../middleware/auth.js';
import { 
  canCreateInvoice,
  canEditInvoice,
  canDeleteInvoice,
  canViewInvoice,
  requireAnyPermission
} from '../middleware/permissions.js';
import { 
  validateInvoiceRules, 
  validateCalculatorResultRules 
} from '../middleware/businessRulesMiddleware.js';
import { requiresConfirmation, checkInvoiceLock } from '../middleware/confirmationRequired.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Special routes (must be before /:id routes)
router.get('/stats', requireAnyPermission(['CAN_VIEW_INVOICE', 'CAN_VIEW_PROFIT']), getInvoiceStats);
router.get('/pending', requireAnyPermission(['CAN_VIEW_INVOICE', 'CAN_VIEW_PROFIT']), getPendingPayments);
router.get('/search', canViewInvoice, searchInvoices);
router.get('/deleted', canDeleteInvoice, getDeletedInvoices);

// Basic CRUD routes
router.route('/')
  .get(canViewInvoice, getInvoices)
  .post(canCreateInvoice, validateInvoiceRules, validateCalculatorResultRules, createInvoice);

router.route('/:id')
  .get(canViewInvoice, getInvoice)
  .delete(canDeleteInvoice, deleteInvoice);

// Soft delete management
router.put('/:id/restore', canDeleteInvoice, restoreInvoice);

// Invoice management routes
router.put('/:id/payment', canEditInvoice, checkInvoiceLock, requiresConfirmation('invoice_edit'), updatePayment);
router.put('/:id/cancel', canEditInvoice, checkInvoiceLock, requiresConfirmation('invoice_cancel'), cancelInvoice);

// Payment history routes
router.route('/:invoiceId/payments')
  .get(canViewInvoice, getPaymentHistory)
  .post(canEditInvoice, checkInvoiceLock, requiresConfirmation('invoice_edit'), addPayment);

export default router;