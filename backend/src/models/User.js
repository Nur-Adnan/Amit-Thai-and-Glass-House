import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['owner', 'manager', 'accountant'],
    default: 'accountant'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if user has specific permission
userSchema.methods.hasPermission = async function(permissionName) {
  try {
    // Import models here to avoid circular dependency
    const Permission = mongoose.model('Permission');
    const RolePermission = mongoose.model('RolePermission');
    
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
      role: this.role,
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
};

// Get all permissions for user's role
userSchema.methods.getPermissions = async function() {
  try {
    // Import models here to avoid circular dependency
    const RolePermission = mongoose.model('RolePermission');
    
    const rolePermission = await RolePermission.findOne({
      role: this.role,
      isActive: true
    }).populate('permissions.permission');
    
    if (!rolePermission) {
      return [];
    }
    
    return rolePermission.permissions
      .filter(p => p.granted && p.permission && p.permission.isActive)
      .map(p => ({
        name: p.permission.name,
        description: p.permission.description,
        category: p.permission.category,
        grantedAt: p.grantedAt
      }));
  } catch (error) {
    console.error('Error getting permissions:', error);
    return [];
  }
};

export default mongoose.model('User', userSchema);