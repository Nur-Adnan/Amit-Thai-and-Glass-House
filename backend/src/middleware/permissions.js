import asyncHandler from '../utils/asyncHandler.js';
import PermissionService from '../services/permissionService.js';

/**
 * Middleware to check if user has specific permission
 * @param {string} permissionName - The permission to check
 * @returns {Function} Express middleware function
 */
export const requirePermission = (permissionName) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No user found.'
      });
    }

    const hasPermission = await PermissionService.checkPermission(req.user.id, permissionName);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required permission: ${permissionName}`,
        requiredPermission: permissionName,
        userRole: req.user.role
      });
    }

    next();
  });
};

/**
 * Middleware to check if user has any of the specified permissions
 * @param {string[]} permissionNames - Array of permissions to check
 * @returns {Function} Express middleware function
 */
export const requireAnyPermission = (permissionNames) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No user found.'
      });
    }

    let hasAnyPermission = false;
    
    for (const permissionName of permissionNames) {
      const hasPermission = await PermissionService.checkPermission(req.user.id, permissionName);
      if (hasPermission) {
        hasAnyPermission = true;
        break;
      }
    }

    if (!hasAnyPermission) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required any of: ${permissionNames.join(', ')}`,
        requiredPermissions: permissionNames,
        userRole: req.user.role
      });
    }

    next();
  });
};

/**
 * Middleware to check if user has all specified permissions
 * @param {string[]} permissionNames - Array of permissions to check
 * @returns {Function} Express middleware function
 */
export const requireAllPermissions = (permissionNames) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No user found.'
      });
    }

    const missingPermissions = [];
    
    for (const permissionName of permissionNames) {
      const hasPermission = await PermissionService.checkPermission(req.user.id, permissionName);
      if (!hasPermission) {
        missingPermissions.push(permissionName);
      }
    }

    if (missingPermissions.length > 0) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Missing permissions: ${missingPermissions.join(', ')}`,
        missingPermissions,
        userRole: req.user.role
      });
    }

    next();
  });
};

/**
 * Middleware to add user permissions to request object
 */
export const attachUserPermissions = asyncHandler(async (req, res, next) => {
  if (req.user) {
    req.userPermissions = await PermissionService.getUserPermissions(req.user.id);
    req.userPermissionNames = req.userPermissions.map(p => p.name);
  }
  next();
});

/**
 * Helper function to check permission in route handlers
 * @param {Object} req - Express request object
 * @param {string} permissionName - Permission to check
 * @returns {boolean} Whether user has permission
 */
export const hasPermission = async (req, permissionName) => {
  if (!req.user) return false;
  return await PermissionService.checkPermission(req.user.id, permissionName);
};

/**
 * Middleware for owner-only actions (backwards compatibility)
 */
export const ownerOnly = requirePermission('CAN_MANAGE_PERMISSIONS');

/**
 * Middleware for manager and above (backwards compatibility)
 */
export const managerAndAbove = requireAnyPermission(['CAN_MANAGE_PERMISSIONS', 'CAN_EDIT_PRODUCT']);

// Export commonly used permission checks
export const canCreateInvoice = requirePermission('CAN_CREATE_INVOICE');
export const canEditInvoice = requirePermission('CAN_EDIT_INVOICE');
export const canDeleteInvoice = requirePermission('CAN_DELETE_INVOICE');
export const canViewInvoice = requirePermission('CAN_VIEW_INVOICE');

export const canCreateProduct = requirePermission('CAN_CREATE_PRODUCT');
export const canEditProduct = requirePermission('CAN_EDIT_PRODUCT');
export const canEditPrice = requirePermission('CAN_EDIT_PRICE');
export const canDeleteProduct = requirePermission('CAN_DELETE_PRODUCT');
export const canManageStock = requirePermission('CAN_MANAGE_STOCK');

export const canViewProfit = requirePermission('CAN_VIEW_PROFIT');
export const canViewExpenses = requirePermission('CAN_VIEW_EXPENSES');
export const canCreateExpense = requirePermission('CAN_CREATE_EXPENSE');

export const canCreateEmployee = requirePermission('CAN_CREATE_EMPLOYEE');
export const canEditEmployee = requirePermission('CAN_EDIT_EMPLOYEE');
export const canDeleteEmployee = requirePermission('CAN_DELETE_EMPLOYEE');
export const canPaySalary = requirePermission('CAN_PAY_SALARY');
export const canViewPayroll = requirePermission('CAN_VIEW_PAYROLL');

export const canManageUsers = requirePermission('CAN_MANAGE_USERS');
export const canViewAuditLogs = requirePermission('CAN_VIEW_AUDIT_LOGS');
export const canBackupData = requirePermission('CAN_BACKUP_DATA');