import asyncHandler from '../utils/asyncHandler.js';
import PermissionService from '../services/permissionService.js';
import Permission from '../models/Permission.js';
import RolePermission from '../models/RolePermission.js';
import AuditService from '../services/auditService.js';

// @desc    Initialize permission system
// @route   POST /api/permissions/initialize
// @access  Private (Owner only)
export const initializePermissions = asyncHandler(async (req, res) => {
  const result = await PermissionService.initializePermissions(req.user.id);

  if (result.success) {
    // Log audit trail
    await AuditService.log({
      action: 'permission_system_initialize',
      entityType: 'Permission',
      performedBy: req.user.id,
      description: 'Permission system initialized with default permissions and role mappings',
      severity: 'high'
    }, req);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } else {
    res.status(400).json({
      success: false,
      message: result.message
    });
  }
});

// @desc    Get all permissions
// @route   GET /api/permissions
// @access  Private (Owner only)
export const getAllPermissions = asyncHandler(async (req, res) => {
  const permissions = await PermissionService.getAllPermissions();

  res.status(200).json({
    success: true,
    count: permissions.length,
    data: permissions
  });
});

// @desc    Get permission matrix (all roles and their permissions)
// @route   GET /api/permissions/matrix
// @access  Private (Owner only)
export const getPermissionMatrix = asyncHandler(async (req, res) => {
  const matrix = await PermissionService.getPermissionMatrix();

  res.status(200).json({
    success: true,
    data: matrix
  });
});

// @desc    Get permissions for specific role
// @route   GET /api/permissions/role/:role
// @access  Private (Owner only)
export const getRolePermissions = asyncHandler(async (req, res) => {
  const { role } = req.params;

  if (!['owner', 'manager', 'accountant'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role. Must be owner, manager, or accountant'
    });
  }

  const permissions = await PermissionService.getRolePermissions(role);

  res.status(200).json({
    success: true,
    role,
    count: permissions.length,
    data: permissions
  });
});

// @desc    Get current user's permissions
// @route   GET /api/permissions/my-permissions
// @access  Private (All authenticated users)
export const getMyPermissions = asyncHandler(async (req, res) => {
  const permissions = await PermissionService.getUserPermissions(req.user.id);

  res.status(200).json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    },
    count: permissions.length,
    data: permissions
  });
});

// @desc    Grant permission to role
// @route   POST /api/permissions/grant
// @access  Private (Owner only)
export const grantPermissionToRole = asyncHandler(async (req, res) => {
  const { role, permissionName } = req.body;

  if (!role || !permissionName) {
    return res.status(400).json({
      success: false,
      message: 'Role and permission name are required'
    });
  }

  if (!['owner', 'manager', 'accountant'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role. Must be owner, manager, or accountant'
    });
  }

  const result = await PermissionService.grantPermissionToRole(role, permissionName, req.user.id);

  if (result.success) {
    // Log audit trail
    await AuditService.log({
      action: 'permission_grant',
      entityType: 'RolePermission',
      performedBy: req.user.id,
      description: `Granted permission ${permissionName} to role ${role}`,
      changes: {
        role,
        permissionName,
        action: 'grant'
      },
      severity: 'high'
    }, req);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } else {
    res.status(400).json({
      success: false,
      message: result.message
    });
  }
});

// @desc    Revoke permission from role
// @route   POST /api/permissions/revoke
// @access  Private (Owner only)
export const revokePermissionFromRole = asyncHandler(async (req, res) => {
  const { role, permissionName } = req.body;

  if (!role || !permissionName) {
    return res.status(400).json({
      success: false,
      message: 'Role and permission name are required'
    });
  }

  if (!['owner', 'manager', 'accountant'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role. Must be owner, manager, or accountant'
    });
  }

  const result = await PermissionService.revokePermissionFromRole(role, permissionName);

  if (result.success) {
    // Log audit trail
    await AuditService.log({
      action: 'permission_revoke',
      entityType: 'RolePermission',
      performedBy: req.user.id,
      description: `Revoked permission ${permissionName} from role ${role}`,
      changes: {
        role,
        permissionName,
        action: 'revoke'
      },
      severity: 'high'
    }, req);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } else {
    res.status(400).json({
      success: false,
      message: result.message
    });
  }
});

// @desc    Bulk update role permissions
// @route   PUT /api/permissions/role/:role/bulk
// @access  Private (Owner only)
export const bulkUpdateRolePermissions = asyncHandler(async (req, res) => {
  const { role } = req.params;
  const { permissions } = req.body; // Array of permission names to grant

  if (!['owner', 'manager', 'accountant'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role. Must be owner, manager, or accountant'
    });
  }

  if (!Array.isArray(permissions)) {
    return res.status(400).json({
      success: false,
      message: 'Permissions must be an array'
    });
  }

  try {
    // Get all available permissions
    const allPermissions = await Permission.find({ isActive: true });
    const allPermissionNames = allPermissions.map(p => p.name);

    // Find or create role permission document
    let rolePermission = await RolePermission.findOne({ role, isActive: true });
    
    if (!rolePermission) {
      rolePermission = await RolePermission.create({
        role,
        permissions: [],
        createdBy: req.user.id
      });
    }

    // Clear existing permissions
    rolePermission.permissions = [];

    // Add granted permissions
    for (const permissionName of permissions) {
      if (allPermissionNames.includes(permissionName.toUpperCase())) {
        const permission = allPermissions.find(p => p.name === permissionName.toUpperCase());
        rolePermission.permissions.push({
          permission: permission._id,
          granted: true,
          grantedBy: req.user.id,
          grantedAt: new Date()
        });
      }
    }

    rolePermission.updatedBy = req.user.id;
    await rolePermission.save();

    // Log audit trail
    await AuditService.log({
      action: 'permission_bulk_update',
      entityType: 'RolePermission',
      performedBy: req.user.id,
      description: `Bulk updated permissions for role ${role}`,
      changes: {
        role,
        grantedPermissions: permissions,
        totalPermissions: permissions.length
      },
      severity: 'high'
    }, req);

    res.status(200).json({
      success: true,
      message: `Successfully updated ${permissions.length} permissions for role ${role}`,
      data: {
        role,
        permissionsCount: permissions.length,
        permissions
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Check if user has specific permission
// @route   GET /api/permissions/check/:permissionName
// @access  Private (All authenticated users)
export const checkUserPermission = asyncHandler(async (req, res) => {
  const { permissionName } = req.params;

  const hasPermission = await PermissionService.checkPermission(req.user.id, permissionName);

  res.status(200).json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      role: req.user.role
    },
    permission: permissionName,
    hasPermission
  });
});

// @desc    Get permission statistics
// @route   GET /api/permissions/stats
// @access  Private (Owner only)
export const getPermissionStats = asyncHandler(async (req, res) => {
  try {
    // Get total permissions
    const totalPermissions = await Permission.countDocuments({ isActive: true });
    
    // Get permissions by category
    const permissionsByCategory = await Permission.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get role permission counts
    const roleStats = {};
    const roles = ['owner', 'manager', 'accountant'];
    
    for (const role of roles) {
      const rolePermissions = await PermissionService.getRolePermissions(role);
      roleStats[role] = {
        totalPermissions: rolePermissions.length,
        permissionsByCategory: {}
      };
      
      // Group by category
      rolePermissions.forEach(permission => {
        if (!roleStats[role].permissionsByCategory[permission.category]) {
          roleStats[role].permissionsByCategory[permission.category] = 0;
        }
        roleStats[role].permissionsByCategory[permission.category]++;
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalPermissions,
        permissionsByCategory: permissionsByCategory.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        roleStats
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});