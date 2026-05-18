import Permission from '../models/Permission.js';
import RolePermission from '../models/RolePermission.js';
import User from '../models/User.js';

/**
 * Permission Service
 * Manages fine-grained permissions for the application
 */
class PermissionService {
  
  // Default permissions for the system
  static DEFAULT_PERMISSIONS = [
    // Invoice permissions
    { name: 'CAN_CREATE_INVOICE', description: 'Can create new invoices', category: 'invoice' },
    { name: 'CAN_EDIT_INVOICE', description: 'Can edit existing invoices', category: 'invoice' },
    { name: 'CAN_DELETE_INVOICE', description: 'Can delete invoices', category: 'invoice' },
    { name: 'CAN_VIEW_INVOICE', description: 'Can view invoices', category: 'invoice' },
    { name: 'CAN_CANCEL_INVOICE', description: 'Can cancel invoices', category: 'invoice' },
    
    // Product permissions
    { name: 'CAN_CREATE_PRODUCT', description: 'Can create new products', category: 'product' },
    { name: 'CAN_EDIT_PRODUCT', description: 'Can edit existing products', category: 'product' },
    { name: 'CAN_EDIT_PRICE', description: 'Can edit product prices', category: 'product' },
    { name: 'CAN_DELETE_PRODUCT', description: 'Can delete products', category: 'product' },
    { name: 'CAN_MANAGE_STOCK', description: 'Can manage product stock', category: 'product' },
    
    // Financial permissions
    { name: 'CAN_VIEW_PROFIT', description: 'Can view profit reports', category: 'financial' },
    { name: 'CAN_VIEW_EXPENSES', description: 'Can view expense reports', category: 'financial' },
    { name: 'CAN_CREATE_EXPENSE', description: 'Can create expense entries', category: 'financial' },
    { name: 'CAN_EDIT_EXPENSE', description: 'Can edit expense entries', category: 'financial' },
    { name: 'CAN_VIEW_INVESTMENTS', description: 'Can view investment reports', category: 'financial' },
    
    // Employee permissions
    { name: 'CAN_CREATE_EMPLOYEE', description: 'Can create new employees', category: 'employee' },
    { name: 'CAN_EDIT_EMPLOYEE', description: 'Can edit employee information', category: 'employee' },
    { name: 'CAN_DELETE_EMPLOYEE', description: 'Can delete employees', category: 'employee' },
    { name: 'CAN_PAY_SALARY', description: 'Can process salary payments', category: 'employee' },
    { name: 'CAN_VIEW_PAYROLL', description: 'Can view payroll information', category: 'employee' },
    
    // System permissions
    { name: 'CAN_MANAGE_USERS', description: 'Can manage user accounts', category: 'system' },
    { name: 'CAN_MANAGE_PERMISSIONS', description: 'Can manage permissions', category: 'system' },
    { name: 'CAN_VIEW_AUDIT_LOGS', description: 'Can view audit logs', category: 'system' },
    { name: 'CAN_BACKUP_DATA', description: 'Can backup system data', category: 'system' },
    { name: 'CAN_RESTORE_DATA', description: 'Can restore system data', category: 'system' }
  ];

  // Default role permissions mapping
  static DEFAULT_ROLE_PERMISSIONS = {
    owner: [
      // All permissions for owner
      'CAN_CREATE_INVOICE', 'CAN_EDIT_INVOICE', 'CAN_DELETE_INVOICE', 'CAN_VIEW_INVOICE', 'CAN_CANCEL_INVOICE',
      'CAN_CREATE_PRODUCT', 'CAN_EDIT_PRODUCT', 'CAN_EDIT_PRICE', 'CAN_DELETE_PRODUCT', 'CAN_MANAGE_STOCK',
      'CAN_VIEW_PROFIT', 'CAN_VIEW_EXPENSES', 'CAN_CREATE_EXPENSE', 'CAN_EDIT_EXPENSE', 'CAN_VIEW_INVESTMENTS',
      'CAN_CREATE_EMPLOYEE', 'CAN_EDIT_EMPLOYEE', 'CAN_DELETE_EMPLOYEE', 'CAN_PAY_SALARY', 'CAN_VIEW_PAYROLL',
      'CAN_MANAGE_USERS', 'CAN_MANAGE_PERMISSIONS', 'CAN_VIEW_AUDIT_LOGS', 'CAN_BACKUP_DATA', 'CAN_RESTORE_DATA'
    ],
    manager: [
      // Most permissions except system management
      'CAN_CREATE_INVOICE', 'CAN_EDIT_INVOICE', 'CAN_DELETE_INVOICE', 'CAN_VIEW_INVOICE', 'CAN_CANCEL_INVOICE',
      'CAN_CREATE_PRODUCT', 'CAN_EDIT_PRODUCT', 'CAN_EDIT_PRICE', 'CAN_DELETE_PRODUCT', 'CAN_MANAGE_STOCK',
      'CAN_VIEW_PROFIT', 'CAN_VIEW_EXPENSES', 'CAN_CREATE_EXPENSE', 'CAN_EDIT_EXPENSE', 'CAN_VIEW_INVESTMENTS',
      'CAN_CREATE_EMPLOYEE', 'CAN_EDIT_EMPLOYEE', 'CAN_PAY_SALARY', 'CAN_VIEW_PAYROLL',
      'CAN_VIEW_AUDIT_LOGS'
    ],
    accountant: [
      // Limited permissions for accountant
      'CAN_VIEW_INVOICE', 'CAN_VIEW_PROFIT', 'CAN_VIEW_EXPENSES', 'CAN_CREATE_EXPENSE', 'CAN_EDIT_EXPENSE',
      'CAN_VIEW_INVESTMENTS', 'CAN_VIEW_PAYROLL'
    ]
  };

  /**
   * Initialize default permissions and role permissions
   */
  static async initializePermissions(createdBy = null) {
    try {
      console.log('🔐 Initializing permission system...');

      // Create default permissions
      const createdPermissions = [];
      for (const permissionData of this.DEFAULT_PERMISSIONS) {
        const existingPermission = await Permission.findOne({ name: permissionData.name });
        
        if (!existingPermission) {
          const permission = await Permission.create({
            ...permissionData,
            createdBy
          });
          createdPermissions.push(permission);
          console.log(`✅ Created permission: ${permission.name}`);
        }
      }

      // Create role permissions
      for (const [role, permissionNames] of Object.entries(this.DEFAULT_ROLE_PERMISSIONS)) {
        const existingRolePermission = await RolePermission.findOne({ role });
        
        if (!existingRolePermission) {
          // Get permission IDs
          const permissions = await Permission.find({ 
            name: { $in: permissionNames },
            isActive: true 
          });
          
          const rolePermissionData = {
            role,
            permissions: permissions.map(p => ({
              permission: p._id,
              granted: true,
              grantedBy: createdBy,
              grantedAt: new Date()
            })),
            createdBy
          };

          const rolePermission = await RolePermission.create(rolePermissionData);
          console.log(`✅ Created role permissions for: ${role} (${permissions.length} permissions)`);
        } else {
          console.log(`ℹ️ Role permissions already exist for: ${role}`);
        }
      }

      console.log('✅ Permission system initialized successfully');
      return { success: true, message: 'Permission system initialized' };
    } catch (error) {
      console.error('❌ Error initializing permissions:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Check if user has specific permission
   */
  static async checkPermission(userId, permissionName) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.isActive) {
        return false;
      }

      // Find the permission by name
      const permission = await Permission.findOne({ 
        name: permissionName.toUpperCase(),
        isActive: true 
      });
      
      if (!permission) {
        return false;
      }
      
      // Find role permissions
      const rolePermission = await RolePermission.findOne({
        role: user.role,
        isActive: true
      }).populate('permissions.permission');
      
      if (!rolePermission) {
        return false;
      }
      
      // Check if the role has this permission and it's granted
      const hasPermission = rolePermission.permissions.some(p => 
        p.permission && 
        p.permission._id.toString() === permission._id.toString() && 
        p.granted === true
      );
      
      return hasPermission;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Get all permissions for a user
   */
  static async getUserPermissions(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.isActive) {
        return [];
      }

      return await user.getPermissions();
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  /**
   * Grant permission to role
   */
  static async grantPermissionToRole(role, permissionName, grantedBy) {
    try {
      const permission = await Permission.findOne({ 
        name: permissionName.toUpperCase(),
        isActive: true 
      });
      
      if (!permission) {
        throw new Error('Permission not found');
      }

      let rolePermission = await RolePermission.findOne({ role, isActive: true });
      
      if (!rolePermission) {
        rolePermission = await RolePermission.create({
          role,
          permissions: [],
          createdBy: grantedBy
        });
      }

      await rolePermission.grantPermission(permission._id, grantedBy);
      
      return { success: true, message: `Permission ${permissionName} granted to ${role}` };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Revoke permission from role
   */
  static async revokePermissionFromRole(role, permissionName) {
    try {
      const permission = await Permission.findOne({ 
        name: permissionName.toUpperCase(),
        isActive: true 
      });
      
      if (!permission) {
        throw new Error('Permission not found');
      }

      const rolePermission = await RolePermission.findOne({ role, isActive: true });
      
      if (!rolePermission) {
        throw new Error('Role permissions not found');
      }

      await rolePermission.revokePermission(permission._id);
      
      return { success: true, message: `Permission ${permissionName} revoked from ${role}` };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get all permissions for a role
   */
  static async getRolePermissions(role) {
    try {
      const rolePermission = await RolePermission.findOne({
        role,
        isActive: true
      }).populate('permissions.permission');

      if (!rolePermission) {
        return [];
      }

      return rolePermission.permissions
        .filter(p => p.granted && p.permission.isActive)
        .map(p => ({
          name: p.permission.name,
          description: p.permission.description,
          category: p.permission.category,
          grantedAt: p.grantedAt
        }));
    } catch (error) {
      console.error('Error getting role permissions:', error);
      return [];
    }
  }

  /**
   * Get all available permissions
   */
  static async getAllPermissions() {
    try {
      const permissions = await Permission.find({ isActive: true })
        .sort({ category: 1, name: 1 });

      return permissions.map(p => ({
        id: p._id,
        name: p.name,
        description: p.description,
        category: p.category
      }));
    } catch (error) {
      console.error('Error getting all permissions:', error);
      return [];
    }
  }

  /**
   * Get permission matrix (all roles and their permissions)
   */
  static async getPermissionMatrix() {
    try {
      const roles = ['owner', 'manager', 'accountant'];
      const permissions = await this.getAllPermissions();
      const matrix = {};

      for (const role of roles) {
        const rolePermissions = await this.getRolePermissions(role);
        matrix[role] = {
          permissions: rolePermissions,
          permissionNames: rolePermissions.map(p => p.name)
        };
      }

      return {
        roles,
        permissions,
        matrix
      };
    } catch (error) {
      console.error('Error getting permission matrix:', error);
      return { roles: [], permissions: [], matrix: {} };
    }
  }
}

export default PermissionService;