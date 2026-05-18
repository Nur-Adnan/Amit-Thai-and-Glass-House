import mongoose from 'mongoose';

const rolePermissionSchema = new mongoose.Schema({
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: ['owner', 'manager', 'accountant'],
      message: 'Role must be owner, manager, or accountant'
    }
  },
  permissions: [{
    permission: {
      type: mongoose.Schema.ObjectId,
      ref: 'Permission',
      required: true
    },
    granted: {
      type: Boolean,
      default: true
    },
    grantedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    grantedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index for role-permission lookup
rolePermissionSchema.index({ role: 1, 'permissions.permission': 1 });
rolePermissionSchema.index({ role: 1, isActive: 1 });

// Method to check if role has specific permission
rolePermissionSchema.methods.hasPermission = function(permissionId) {
  const permission = this.permissions.find(p => 
    p.permission.toString() === permissionId.toString() && p.granted
  );
  return !!permission;
};

// Method to grant permission to role
rolePermissionSchema.methods.grantPermission = function(permissionId, grantedBy) {
  const existingPermission = this.permissions.find(p => 
    p.permission.toString() === permissionId.toString()
  );
  
  if (existingPermission) {
    existingPermission.granted = true;
    existingPermission.grantedBy = grantedBy;
    existingPermission.grantedAt = new Date();
  } else {
    this.permissions.push({
      permission: permissionId,
      granted: true,
      grantedBy: grantedBy,
      grantedAt: new Date()
    });
  }
  
  return this.save();
};

// Method to revoke permission from role
rolePermissionSchema.methods.revokePermission = function(permissionId) {
  const permission = this.permissions.find(p => 
    p.permission.toString() === permissionId.toString()
  );
  
  if (permission) {
    permission.granted = false;
  }
  
  return this.save();
};

export default mongoose.model('RolePermission', rolePermissionSchema);