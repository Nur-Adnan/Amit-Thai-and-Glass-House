import mongoose from 'mongoose';
import { MoneyValidator, GeneralValidator } from '../utils/validation.js';
import CurrencyService from '../services/currencyService.js';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [2, 'Product name must be at least 2 characters long'],
    maxlength: [100, 'Product name cannot exceed 100 characters'],
    validate: {
      validator: function(value) {
        const validation = GeneralValidator.validateString(value, 'Product name', {
          minLength: 2,
          maxLength: 100
        });
        return validation.isValid;
      },
      message: 'Product name must be between 2 and 100 characters'
    }
  },
  materialType: {
    type: String,
    required: [true, 'Material type is required'],
    enum: {
      values: ['Thai', 'Glass'],
      message: 'Material type must be either Thai or Glass'
    }
  },
  // Legacy field for backward compatibility
  category: {
    type: String,
    enum: {
      values: ['Thai', 'Glass'],
      message: 'Category must be either Thai or Glass'
    }
  },
  // New variant fields for Thai & Glass items
  company: {
    type: String,
    required: function() {
      return ['Thai', 'Glass'].includes(this.materialType);
    },
    trim: true,
    minlength: [2, 'Company name must be at least 2 characters long'],
    maxlength: [50, 'Company name cannot exceed 50 characters'],
    validate: {
      validator: function(value) {
        // Only validate if materialType requires company
        if (!['Thai', 'Glass'].includes(this.materialType)) return true;
        if (!value) return false;
        
        const validation = GeneralValidator.validateString(value, 'Company name', {
          minLength: 2,
          maxLength: 50
        });
        return validation.isValid;
      },
      message: 'Company name must be between 2 and 50 characters'
    }
  },
  thicknessMM: {
    type: Number,
    required: function() {
      return ['Thai', 'Glass'].includes(this.materialType);
    },
    min: [1, 'Thickness must be at least 1mm'],
    max: [50, 'Thickness cannot exceed 50mm'],
    validate: {
      validator: function(value) {
        // Only validate if materialType requires thickness
        if (!['Thai', 'Glass'].includes(this.materialType)) return true;
        if (value === undefined || value === null) return false;
        
        // Common glass thicknesses in Bangladesh market
        const validThicknesses = [3, 4, 5, 6, 8, 10, 12, 15, 19, 25];
        return validThicknesses.includes(value);
      },
      message: 'Thickness must be one of: 3, 4, 5, 6, 8, 10, 12, 15, 19, 25 mm'
    }
  },
  quality: {
    type: String,
    required: function() {
      return ['Thai', 'Glass'].includes(this.materialType);
    },
    enum: {
      values: ['Local', 'Imported'],
      message: 'Quality must be either Local or Imported'
    }
  },
  measurementType: {
    type: String,
    required: [true, 'Measurement type is required'],
    enum: {
      values: ['SFT', 'RFT', 'PANEL', 'SHEET', 'PIECE'],
      message: 'Measurement type must be SFT, RFT, PANEL, SHEET, or PIECE'
    },
    default: 'SFT'
  },
  purchasePrice: {
    type: Number,
    required: [true, 'Purchase price is required'],
    min: [0.01, 'Purchase price must be greater than zero'],
    max: [1000000, 'Purchase price cannot exceed ৳10,00,000'],
    validate: {
      validator: function(value) {
        const validation = MoneyValidator.validateAmount(value, 'Purchase price', {
          allowZero: false,
          maxAmount: 1000000,
          maxDecimals: 2
        });
        return validation.isValid;
      },
      message: function(props) {
        const validation = MoneyValidator.validateAmount(props.value, 'Purchase price', {
          allowZero: false,
          maxAmount: 1000000,
          maxDecimals: 2
        });
        return validation.errors[0] || 'Invalid purchase price';
      }
    }
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0.01, 'Selling price must be greater than zero'],
    max: [1000000, 'Selling price cannot exceed ৳10,00,000'],
    validate: [
      {
        validator: function(value) {
          const validation = MoneyValidator.validateAmount(value, 'Selling price', {
            allowZero: false,
            maxAmount: 1000000,
            maxDecimals: 2
          });
          return validation.isValid;
        },
        message: function(props) {
          const validation = MoneyValidator.validateAmount(props.value, 'Selling price', {
            allowZero: false,
            maxAmount: 1000000,
            maxDecimals: 2
          });
          return validation.errors[0] || 'Invalid selling price';
        }
      },
      {
        validator: function(value) {
          // Validate that selling price is not less than purchase price
          if (this.purchasePrice && value < this.purchasePrice) {
            return false;
          }
          return true;
        },
        message: 'Selling price cannot be less than purchase price'
      }
    ]
  },
  stockQuantity: {
    type: Number,
    required: [true, 'Please add stock quantity'],
    min: [0, 'Stock quantity cannot be negative'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value) && value >= 0;
      },
      message: 'Stock quantity must be a non-negative integer'
    }
  },
  unit: {
    type: String,
    required: [true, 'Please specify unit'],
    default: function() {
      // Auto-set unit based on measurement type
      switch(this.measurementType) {
        case 'SFT': return 'sqft';
        case 'RFT': return 'rft';
        case 'PANEL': return 'panel';
        case 'SHEET': return 'sheet';
        case 'PIECE': return 'piece';
        default: return 'sqft';
      }
    },
    enum: {
      values: ['sqft', 'rft', 'panel', 'sheet', 'piece', 'kg', 'meter'],
      message: 'Unit must be sqft, rft, panel, sheet, piece, kg, or meter'
    }
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
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

// Calculate profit margin with proper formatting
productSchema.virtual('profitMargin').get(function() {
  if (this.purchasePrice === 0) return '0.00%';
  const margin = ((this.sellingPrice - this.purchasePrice) / this.purchasePrice * 100);
  return `${margin.toFixed(2)}%`;
});

// Calculate profit amount with currency formatting
productSchema.virtual('profitAmount').get(function() {
  const profit = this.sellingPrice - this.purchasePrice;
  return CurrencyService.formatBDT(profit);
});

// Format purchase price for display
productSchema.virtual('formattedPurchasePrice').get(function() {
  return CurrencyService.formatBDT(this.purchasePrice);
});

// Format selling price for display
productSchema.virtual('formattedSellingPrice').get(function() {
  return CurrencyService.formatBDT(this.sellingPrice);
});

// Get stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.stockQuantity === 0) return 'Out of Stock';
  if (this.stockQuantity <= 10) return 'Low Stock';
  return 'In Stock';
});

// Get stock value (quantity × purchase price)
productSchema.virtual('stockValue').get(function() {
  const value = this.stockQuantity * this.purchasePrice;
  return CurrencyService.formatBDT(value);
});

// Get variant display name for Thai/Glass products
productSchema.virtual('variantDisplayName').get(function() {
  if (['Thai', 'Glass'].includes(this.materialType)) {
    return `${this.name} - ${this.thicknessMM}mm ${this.quality} (${this.company})`;
  }
  return this.name;
});

// Get variant specification for Thai/Glass products
productSchema.virtual('variantSpecification').get(function() {
  if (['Thai', 'Glass'].includes(this.materialType)) {
    return {
      materialType: this.materialType,
      company: this.company,
      thickness: `${this.thicknessMM}mm`,
      quality: this.quality,
      measurementType: this.measurementType
    };
  }
  return {
    materialType: this.materialType || this.category,
    measurementType: this.measurementType
  };
});

// Get unique variant identifier
productSchema.virtual('variantKey').get(function() {
  if (['Thai', 'Glass'].includes(this.materialType)) {
    return `${this.name}_${this.materialType}_${this.company}_${this.thicknessMM}mm_${this.quality}`.toLowerCase().replace(/\s+/g, '_');
  }
  return `${this.name}_${this.materialType || this.category}`.toLowerCase().replace(/\s+/g, '_');
});

// Include virtuals when converting to JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Index for better query performance
productSchema.index({ name: 1, materialType: 1 });
productSchema.index({ materialType: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isDeleted: 1 });

// Compound index for variant uniqueness (Thai/Glass products)
productSchema.index({ 
  name: 1, 
  materialType: 1, 
  company: 1, 
  thicknessMM: 1, 
  quality: 1 
}, { 
  unique: true,
  partialFilterExpression: { 
    materialType: { $in: ['Thai', 'Glass'] },
    isDeleted: { $ne: true }
  }
});

// Index for stock queries
productSchema.index({ stockQuantity: 1, isActive: 1 });
productSchema.index({ company: 1, materialType: 1 });
productSchema.index({ thicknessMM: 1, materialType: 1 });
productSchema.index({ quality: 1, materialType: 1 });

// Pre-save middleware for validation and data consistency
productSchema.pre('save', function() {
  // Backward compatibility: if category is set but materialType is not, use category
  if (this.category && !this.materialType) {
    this.materialType = this.category;
  }
  
  // Ensure category matches materialType for backward compatibility
  if (this.materialType && !this.category) {
    this.category = this.materialType;
  }
  
  // Auto-set unit based on measurement type if not explicitly set
  if (!this.unit && this.measurementType) {
    switch(this.measurementType) {
      case 'SFT': this.unit = 'sqft'; break;
      case 'RFT': this.unit = 'rft'; break;
      case 'PANEL': this.unit = 'panel'; break;
      case 'SHEET': this.unit = 'sheet'; break;
      case 'PIECE': this.unit = 'piece'; break;
      default: this.unit = 'sqft';
    }
  }
});

// Static method to find variants of a product
productSchema.statics.findVariants = function(productName, materialType = null) {
  const query = { 
    name: productName,
    isDeleted: { $ne: true }
  };
  
  if (materialType) {
    query.materialType = materialType;
  }
  
  return this.find(query).sort({ 
    materialType: 1, 
    company: 1, 
    thicknessMM: 1, 
    quality: 1 
  });
};

// Static method to check if variant exists
productSchema.statics.variantExists = function(name, materialType, company, thicknessMM, quality) {
  return this.findOne({
    name,
    materialType,
    company,
    thicknessMM,
    quality,
    isDeleted: { $ne: true }
  });
};

// Instance method to get similar variants
productSchema.methods.getSimilarVariants = function() {
  return this.constructor.findVariants(this.name, this.materialType);
};

// Add soft delete method
productSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

// Add restore method
productSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  return this.save();
};

export default mongoose.model('Product', productSchema);