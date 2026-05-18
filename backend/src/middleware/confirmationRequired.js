import AuditService from '../services/auditService.js';

// Actions that require confirmation
const CONFIRMATION_REQUIRED_ACTIONS = {
  // Invoice actions
  'invoice_edit': {
    requiresConfirmation: true,
    requiresReason: false,
    message: 'Editing invoices can affect financial records and customer balances.'
  },
  'invoice_return': {
    requiresConfirmation: true,
    requiresReason: true,
    message: 'Invoice returns will restore stock quantities and affect financial records.'
  },
  'invoice_cancel': {
    requiresConfirmation: true,
    requiresReason: true,
    message: 'Cancelling invoices will restore stock and void the transaction.'
  },
  
  // Stock actions
  'stock_manual_adjustment': {
    requiresConfirmation: true,
    requiresReason: true,
    message: 'Manual stock adjustments directly affect inventory levels and valuations.'
  },
  'stock_bulk_update': {
    requiresConfirmation: true,
    requiresReason: true,
    message: 'Bulk stock updates can significantly impact inventory records.'
  },
  
  // Salary actions
  'salary_edit': {
    requiresConfirmation: true,
    requiresReason: false,
    message: 'Editing salary records affects payroll calculations and employee payments.'
  },
  'salary_delete': {
    requiresConfirmation: true,
    requiresReason: true,
    message: 'Deleting salary records will affect payroll history and expense calculations.'
  },
  
  // Financial actions
  'payment_reverse': {
    requiresConfirmation: true,
    requiresReason: true,
    message: 'Reversing payments will affect customer balances and financial records.'
  },
  'expense_delete': {
    requiresConfirmation: true,
    requiresReason: true,
    message: 'Deleting expenses will affect profit calculations and financial reports.'
  }
};

// Middleware to check if action requires confirmation
export const requiresConfirmation = (action) => {
  return (req, res, next) => {
    const actionConfig = CONFIRMATION_REQUIRED_ACTIONS[action];
    
    if (!actionConfig) {
      return next();
    }

    // Check if confirmation header is present
    const confirmed = req.headers['x-confirm-action'] === 'true';
    const reason = req.headers['x-action-reason'];

    if (!confirmed) {
      return res.status(400).json({
        success: false,
        message: 'Confirmation required for this action',
        confirmationRequired: true,
        actionConfig: {
          action,
          requiresConfirmation: actionConfig.requiresConfirmation,
          requiresReason: actionConfig.requiresReason,
          message: actionConfig.message
        }
      });
    }

    // Check if reason is required but not provided
    if (actionConfig.requiresReason && !reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required for this action',
        confirmationRequired: true,
        actionConfig: {
          action,
          requiresConfirmation: actionConfig.requiresConfirmation,
          requiresReason: actionConfig.requiresReason,
          message: actionConfig.message
        }
      });
    }

    // Store confirmation details in request for audit logging
    req.confirmationDetails = {
      action,
      confirmed: true,
      reason: reason || null,
      timestamp: new Date()
    };

    next();
  };
};

// Middleware to check if invoice is locked (paid invoices are read-only)
export const checkInvoiceLock = async (req, res, next) => {
  try {
    const { Invoice } = await import('../models/Invoice.js');
    const invoiceId = req.params.id || req.body.invoiceId;
    
    if (!invoiceId) {
      return next();
    }

    const invoice = await Invoice.findById(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check if invoice is locked (paid invoices are read-only)
    if (invoice.status === 'paid' && req.method !== 'GET') {
      // Log attempt to modify locked invoice
      await AuditService.log({
        action: 'invoice_locked_access_attempt',
        entityType: 'Invoice',
        entityId: invoice._id,
        entityName: invoice.invoiceNo,
        performedBy: req.user.id,
        description: `Attempted to modify locked invoice ${invoice.invoiceNo} (status: ${invoice.status})`,
        changes: {
          attemptedAction: req.method,
          invoiceStatus: invoice.status,
          blocked: true
        },
        severity: 'high'
      }, req);

      return res.status(403).json({
        success: false,
        message: 'Cannot modify paid invoices. Paid invoices are locked for data integrity.',
        locked: true,
        invoiceStatus: invoice.status,
        invoiceNo: invoice.invoiceNo
      });
    }

    // Store invoice in request for further processing
    req.invoice = invoice;
    next();
  } catch (error) {
    console.error('Error checking invoice lock:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking invoice status'
    });
  }
};

// Helper function to log confirmed actions
export const logConfirmedAction = async (req, actionType, entityType, entityId, entityName, changes) => {
  if (!req.confirmationDetails) return;

  await AuditService.log({
    action: actionType,
    entityType,
    entityId,
    entityName,
    performedBy: req.user.id,
    description: `${actionType.replace('_', ' ').toUpperCase()} - ${req.confirmationDetails.reason || 'No reason provided'}`,
    changes: {
      ...changes,
      confirmationDetails: {
        confirmed: req.confirmationDetails.confirmed,
        reason: req.confirmationDetails.reason,
        timestamp: req.confirmationDetails.timestamp
      }
    },
    severity: 'high'
  }, req);
};

export default {
  requiresConfirmation,
  checkInvoiceLock,
  logConfirmedAction,
  CONFIRMATION_REQUIRED_ACTIONS
};