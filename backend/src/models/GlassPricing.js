/**
 * Glass Pricing Model
 * Handles real Bangladesh glass pricing with thickness and quality variations
 */

import mongoose from 'mongoose';
import { MoneyValidator } from '../utils/validation.js';
import CurrencyService from '../services/currencyService.js';
import DateService from '../services/dateService.js';

const glassPricingSchema = new mongoose.Schema({
  materialType: {
    type: String,
    required: [true, 'Material type is required'],
    enum: {
      values: ['Thai', 'Glass'],
      message: 'Material type must be either Thai or Glass'
    }
  },
  thickness: {
    type: String,
    required: [true, 'Glass thickness is required'],
    enum: {
      values: ['3mm', '4mm', '5mm', '6mm'],
      message: 'Thickness must be 3mm, 4mm, 5mm, or 6mm'
    }
  },
  quality: {
    type: String,
    required: [true, 'Glass quality is required'],
    enum: {
      values: ['Local', 'Imported'],
      message: 'Quality must be Local or Imported'
    }
  },
  pricePerSqFt: {
    type: Number,
    required: [true, 'Price per square foot is required'],
    min: [1, 'Price per square foot must be at least ৳1'],
    max: [10000, 'Price per square foot cannot exceed ৳10,000'],
    validate: {
      validator: function(value) {
        const validation = MoneyValidator.validateAmount(value, 'Price per square foot', {
          allowZero: false,
          minAmount: 1,
          maxAmount: 10000,
          maxDecimals: 2
        });
        return validation.isValid;
      },
      message: function(props) {
        const validation = MoneyValidator.validateAmount(props.value, 'Price per square foot', {
          allowZero: false,
          minAmount: 1,
          maxAmount: 10000,
          maxDecimals: 2
        });
        return validation.errors[0] || 'Invalid price per square foot';
      }
    }
  },
  // Effective date for price changes
  effectiveDate: {
    type: Date,
    required: [true, 'Effective date is required'],
    default: Date.now,
    validate: {
      validator: function(value) {
        return !isNaN(new Date(value).getTime());
      },
      message: 'Effective date must be a valid date'
    }
  },
  // Price history tracking
  previousPrice: {
    type: Number,
    min: [0, 'Previous price cannot be negative']
  },
  priceChangeReason: {
    type: String,
    maxlength: [500, 'Price change reason cannot exceed 500 characters'],
    trim: true
  },
  // Status
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
  // Audit fields
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

// Virtual fields for formatted display
glassPricingSchema.virtual('formattedPrice').get(function() {
  return CurrencyService.formatBDT(this.pricePerSqFt);
});

glassPricingSchema.virtual('formattedPreviousPrice').get(function() {
  if (!this.previousPrice) return null;
  return CurrencyService.formatBDT(this.previousPrice);
});

glassPricingSchema.virtual('formattedEffectiveDate').get(function() {
  return DateService.format(this.effectiveDate, 'medium');
});

glassPricingSchema.virtual('priceChangePercentage').get(function() {
  if (!this.previousPrice || this.previousPrice === 0) return 0;
  const change = ((this.pricePerSqFt - this.previousPrice) / this.previousPrice) * 100;
  return Math.round(change * 100) / 100; // Round to 2 decimal places
});

glassPricingSchema.virtual('priceChangeDirection').get(function() {
  if (!this.previousPrice) return 'new';
  if (this.pricePerSqFt > this.previousPrice) return 'increase';
  if (this.pricePerSqFt < this.previousPrice) return 'decrease';
  return 'unchanged';
});

// Virtual for display name
glassPricingSchema.virtual('displayName').get(function() {
  return `${this.materialType} ${this.thickness} ${this.quality}`;
});

// Virtual for specification
glassPricingSchema.virtual('specification').get(function() {
  return {
    materialType: this.materialType,
    thickness: this.thickness,
    quality: this.quality,
    displayName: this.displayName,
    pricePerSqFt: this.pricePerSqFt,
    formattedPrice: this.formattedPrice
  };
});

// Static method to get current price for specific glass type
glassPricingSchema.statics.getCurrentPrice = async function(materialType, thickness, quality, asOfDate = new Date()) {
  const pricing = await this.findOne({
    materialType,
    thickness,
    quality,
    isActive: true,
    isDeleted: { $ne: true },
    effectiveDate: { $lte: asOfDate }
  }).sort({ effectiveDate: -1 });
  
  return pricing;
};

// Static method to get all current prices for a material type
glassPricingSchema.statics.getCurrentPrices = async function(materialType, asOfDate = new Date()) {
  const prices = await this.find({
    materialType,
    isActive: true,
    isDeleted: { $ne: true },
    effectiveDate: { $lte: asOfDate }
  })
  .populate('createdBy', 'name email')
  .populate('updatedBy', 'name email')
  .sort({ thickness: 1, quality: 1, effectiveDate: -1 });
  
  // Group by thickness and quality to get the latest price for each combination
  const latestPrices = new Map();
  
  prices.forEach(price => {
    const key = `${price.thickness}-${price.quality}`;
    if (!latestPrices.has(key) || price.effectiveDate > latestPrices.get(key).effectiveDate) {
      latestPrices.set(key, price);
    }
  });
  
  return Array.from(latestPrices.values());
};

// Static method to get price history for specific glass type
glassPricingSchema.statics.getPriceHistory = async function(materialType, thickness, quality, limit = 10) {
  return await this.find({
    materialType,
    thickness,
    quality,
    isDeleted: { $ne: true }
  })
  .populate('createdBy', 'name email')
  .populate('updatedBy', 'name email')
  .sort({ effectiveDate: -1 })
  .limit(limit);
};

// Method to create price change record
glassPricingSchema.methods.createPriceChange = async function(newPrice, reason, userId) {
  // Store current price as previous price
  const previousPrice = this.pricePerSqFt;
  
  // Create new pricing record
  const newPricing = new this.constructor({
    materialType: this.materialType,
    thickness: this.thickness,
    quality: this.quality,
    pricePerSqFt: newPrice,
    previousPrice: previousPrice,
    priceChangeReason: reason,
    effectiveDate: new Date(),
    createdBy: userId,
    isActive: true
  });
  
  // Deactivate current pricing
  this.isActive = false;
  this.updatedBy = userId;
  
  // Save both records
  await this.save();
  await newPricing.save();
  
  return newPricing;
};

// Method to soft delete
glassPricingSchema.methods.softDelete = function(userId, reason) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.isActive = false;
  if (reason) {
    this.priceChangeReason = reason;
  }
  return this.save();
};

// Method to restore
glassPricingSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  this.isActive = true;
  return this.save();
};

// Compound indexes for efficient queries
glassPricingSchema.index({ materialType: 1, thickness: 1, quality: 1, effectiveDate: -1 });
glassPricingSchema.index({ materialType: 1, isActive: 1, isDeleted: 1 });
glassPricingSchema.index({ effectiveDate: -1 });
glassPricingSchema.index({ createdAt: -1 });

// Unique constraint to prevent duplicate active prices for same specification
glassPricingSchema.index(
  { materialType: 1, thickness: 1, quality: 1, isActive: 1 },
  { 
    unique: true,
    partialFilterExpression: { isActive: true, isDeleted: { $ne: true } }
  }
);

// Include virtuals when converting to JSON
glassPricingSchema.set('toJSON', { virtuals: true });
glassPricingSchema.set('toObject', { virtuals: true });

export default mongoose.model('GlassPricing', glassPricingSchema);