import mongoose from 'mongoose';
import { GeneralValidator } from '../utils/validation.js';

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Brand name is required'],
    trim: true,
    minlength: [2, 'Brand name must be at least 2 characters long'],
    maxlength: [100, 'Brand name cannot exceed 100 characters'],
    validate: {
      validator: function(value) {
        const validation = GeneralValidator.validateString(value, 'Brand name', {
          minLength: 2,
          maxLength: 100
        });
        return validation.isValid;
      },
      message: 'Brand name must be between 2 and 100 characters'
    }
  },
  materialType: {
    type: String,
    required: [true, 'Material type is required'],
    enum: {
      values: ['Thai', 'Glass'],
      message: 'Material type must be either Thai or Glass'
    },
    index: true
  },
  country: {
    type: String,
    trim: true,
    maxlength: [50, 'Country name cannot exceed 50 characters'],
    validate: {
      validator: function(value) {
        if (!value) return true; // Optional field
        const validation = GeneralValidator.validateString(value, 'Country', {
          minLength: 2,
          maxLength: 50
        });
        return validation.isValid;
      },
      message: 'Country must be between 2 and 50 characters'
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound unique index to prevent duplicate brand names within same material type
brandSchema.index({ 
  name: 1, 
  materialType: 1 
}, { 
  unique: true,
  partialFilterExpression: { 
    isDeleted: { $ne: true }
  }
});

// Additional indexes for performance
brandSchema.index({ materialType: 1, isActive: 1 });
brandSchema.index({ country: 1 });
brandSchema.index({ createdAt: -1 });

// Virtual for display name with material type
brandSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.materialType})`;
});

// Virtual for full specification
brandSchema.virtual('specification').get(function() {
  const spec = {
    name: this.name,
    materialType: this.materialType,
    isActive: this.isActive
  };
  
  if (this.country) {
    spec.country = this.country;
  }
  
  return spec;
});

// Include virtuals when converting to JSON
brandSchema.set('toJSON', { virtuals: true });
brandSchema.set('toObject', { virtuals: true });

// Static method to find brands by material type
brandSchema.statics.findByMaterialType = function(materialType, activeOnly = true) {
  const query = { 
    materialType,
    isDeleted: { $ne: true }
  };
  
  if (activeOnly) {
    query.isActive = true;
  }
  
  return this.find(query).sort({ name: 1 });
};

// Static method to check if brand exists
brandSchema.statics.brandExists = function(name, materialType) {
  return this.findOne({
    name: { $regex: new RegExp(`^${name}$`, 'i') }, // Case-insensitive
    materialType,
    isDeleted: { $ne: true }
  });
};

// Static method to get brand suggestions (for autocomplete)
brandSchema.statics.getBrandSuggestions = function(query, materialType = null, limit = 10) {
  const searchQuery = {
    name: { $regex: query, $options: 'i' },
    isActive: true,
    isDeleted: { $ne: true }
  };
  
  if (materialType) {
    searchQuery.materialType = materialType;
  }
  
  return this.find(searchQuery)
    .select('name materialType country')
    .sort({ name: 1 })
    .limit(limit);
};

// Instance method for soft delete
brandSchema.methods.softDelete = function(userId, reason = null) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.isActive = false; // Also deactivate when deleted
  
  if (reason) {
    this.notes = this.notes ? `${this.notes}\n\nDeleted: ${reason}` : `Deleted: ${reason}`;
  }
  
  return this.save();
};

// Instance method for restore
brandSchema.methods.restore = function(userId) {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  this.isActive = true; // Reactivate when restored
  this.updatedBy = userId;
  
  return this.save();
};

// Instance method to deactivate
brandSchema.methods.deactivate = function(userId, reason = null) {
  this.isActive = false;
  this.updatedBy = userId;
  
  if (reason) {
    this.notes = this.notes ? `${this.notes}\n\nDeactivated: ${reason}` : `Deactivated: ${reason}`;
  }
  
  return this.save();
};

// Instance method to activate
brandSchema.methods.activate = function(userId) {
  this.isActive = true;
  this.updatedBy = userId;
  
  return this.save();
};

// Pre-save middleware for validation
brandSchema.pre('save', function(next) {
  // Normalize brand name (trim and proper case)
  if (this.name) {
    this.name = this.name.trim();
  }
  
  // Normalize country name
  if (this.country) {
    this.country = this.country.trim();
  }
  
  next();
});

// Post-save middleware for logging
brandSchema.post('save', function(doc) {
  console.log(`[BRAND] ${doc.isNew ? 'Created' : 'Updated'} brand: ${doc.displayName}`);
});

export default mongoose.model('Brand', brandSchema);