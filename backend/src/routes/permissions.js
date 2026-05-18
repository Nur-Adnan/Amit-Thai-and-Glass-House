import express from 'express';
import {
  initializePermissions,
  getAllPermissions,
  getPermissionMatrix,
  getRolePermissions,
  getMyPermissions,
  grantPermissionToRole,
  revokePermissionFromRole,
  bulkUpdateRolePermissions,
  checkUserPermission,
  getPermissionStats
} from '../controllers/permissionController.js';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @route   GET /api/permissions/my-permissions
// @desc    Get current user's permissions
// @access  Private (All authenticated users)
router.get('/my-permissions', getMyPermissions);

// @route   GET /api/permissions/check/:permissionName
// @desc    Check if user has specific permission
// @access  Private (All authenticated users)
router.get('/check/:permissionName', checkUserPermission);

// Owner-only routes
const ownerOnly = requirePermission('CAN_MANAGE_PERMISSIONS');

// @route   POST /api/permissions/initialize
// @desc    Initialize permission system
// @access  Private (Owner only)
router.post('/initialize', ownerOnly, initializePermissions);

// @route   GET /api/permissions
// @desc    Get all permissions
// @access  Private (Owner only)
router.get('/', ownerOnly, getAllPermissions);

// @route   GET /api/permissions/matrix
// @desc    Get permission matrix (all roles and their permissions)
// @access  Private (Owner only)
router.get('/matrix', ownerOnly, getPermissionMatrix);

// @route   GET /api/permissions/stats
// @desc    Get permission statistics
// @access  Private (Owner only)
router.get('/stats', ownerOnly, getPermissionStats);

// @route   GET /api/permissions/role/:role
// @desc    Get permissions for specific role
// @access  Private (Owner only)
router.get('/role/:role', ownerOnly, getRolePermissions);

// @route   POST /api/permissions/grant
// @desc    Grant permission to role
// @access  Private (Owner only)
router.post('/grant', ownerOnly, grantPermissionToRole);

// @route   POST /api/permissions/revoke
// @desc    Revoke permission from role
// @access  Private (Owner only)
router.post('/revoke', ownerOnly, revokePermissionFromRole);

// @route   PUT /api/permissions/role/:role/bulk
// @desc    Bulk update role permissions
// @access  Private (Owner only)
router.put('/role/:role/bulk', ownerOnly, bulkUpdateRolePermissions);

export default router;