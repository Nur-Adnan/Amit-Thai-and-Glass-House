import mongoose from 'mongoose';
import { MoneyValidator } from '../utils/validation.js';
import CurrencyService from '../services/currencyService.js';

const calculatorConfigSchema = new mongoose.Schema({
  materialType: {
    type: String,
    required: [true, 'Please specify material type'],
    enum: {
      values: ['Thai', 'Glass'],
      message: 'Material type must be either Thai or Glass'
    },
    unique: true
  },
  // Pricing for different measurement types
  pricing: {
    SFT: {
      pricePerSqFt: {
        type: Number,
        min: [0, 'SFT price per square foot cannot be negative'],
        validate: {
          validator: function(value) {
            if (value === undefined) return true; // Optional
            const validation = MoneyValidator.validateAmount(value, 'SFT Price per SqFt', {
              allowZero: false,
              maxAmount: 100000
            });
            return validation.isValid;
          },
          message: 'Invalid SFT price per square foot'
        }
      },
      isActive: {
        type: Boolean,
        default: true
      }
    },
    RFT: {
      pricePerRunningFt: {
        type: Number,
        min: [0, 'RFT price per running foot cannot be negative'],
        validate: {
          validator: function(value) {
            if (value === undefined) return true; // Optional
            const validation = MoneyValidator.validateAmount(value, 'RFT Price per Running Ft', {
              allowZero: false,
              maxAmount: 100000
            });
            return validation.isValid;
          },
          message: 'Invalid RFT price per running foot'
        }
      },
      isActive: {
        type: Boolean,
        default: false
      }
    },
    PANEL: {
      pricePerPanel: {
        type: Number,
        min: [0, 'Panel price cannot be negative'],
        validate: {
          validator: function(value) {
            if (value === undefined) return true; // Optional
            const validation = MoneyValidator.validateAmount(value, 'Panel Price', {
              allowZero: false,
              maxAmount: 100000
            });
            return validation.isValid;
          },
          message: 'Invalid panel price'
        }
      },
      standardSize: {
        length: {
          type: Number,
          min: [0.1, 'Panel length must be greater than 0']
        },
        width: {
          type: Number,
          min: [0.1, 'Panel width must be greater than 0']
        }
      },
      isActive: {
        type: Boolean,
        default: false
      }
    },
    SHEET: {
      pricePerSheet: {
        type: Number,
        min: [0, 'Sheet price cannot be negative'],
        validate: {
          validator: function(value) {
            if (value === undefined) return true; // Optional
            const validation = MoneyValidator.validateAmount(value, 'Sheet Price', {
              allowZero: false,
              maxAmount: 100000
            });
            return validation.isValid;
          },
          message: 'Invalid sheet price'
        }
      },
      standardSize: {
        length: {
          type: Number,
          min: [0.1, 'Sheet length must be greater than 0']
        },
        width: {
          type: Number,
          min: [0.1, 'Sheet width must be greater than 0']
        }
      },
      isActive: {
        type: Boolean,
        default: false
      }
    },
    CUSTOM: {
      allowCustomPricing: {
        type: Boolean,
        default: true
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }
  },
  // Legacy field for backward compatibility
  pricePerSqFt: {
    type: Number,
    min: [0, 'Price per square foot cannot be negative']
  },
  // Supported measurement types for this material
  supportedMeasurementTypes: [{
    type: String,
    enum: {
      values: ['SFT', 'RFT', 'PANEL', 'SHEET', 'CUSTOM'],
      message: 'Measurement type must be SFT, RFT, PANEL, SHEET, or CUSTOM'
    }
  }],
  // Default measurement type
  defaultMeasurementType: {
    type: String,
    enum: {
      values: ['SFT', 'RFT', 'PANEL', 'SHEET', 'CUSTOM'],
      message: 'Default measurement type must be SFT, RFT, PANEL, SHEET, or CUSTOM'
    },
    default: 'SFT'
  },
  isActive: {
    type: Boolean,
    default: true
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

// Virtual fields for formatted pricing
calculatorConfigSchema.virtual('formattedPricing').get(function() {
  const formatted = {};
  
  if (this.pricing.SFT.pricePerSqFt) {
    formatted.SFT = {
      pricePerSqFt: CurrencyService.formatBDT(this.pricing.SFT.pricePerSqFt),
      isActive: this.pricing.SFT.isActive
    };
  }
  
  if (this.pricing.RFT.pricePerRunningFt) {
    formatted.RFT = {
      pricePerRunningFt: CurrencyService.formatBDT(this.pricing.RFT.pricePerRunningFt),
      isActive: this.pricing.RFT.isActive
    };
  }
  
  if (this.pricing.PANEL.pricePerPanel) {
    formatted.PANEL = {
      pricePerPanel: CurrencyService.formatBDT(this.pricing.PANEL.pricePerPanel),
      standardSize: this.pricing.PANEL.standardSize,
      isActive: this.pricing.PANEL.isActive
    };
  }
  
  if (this.pricing.SHEET.pricePerSheet) {
    formatted.SHEET = {
      pricePerSheet: CurrencyService.formatBDT(this.pricing.SHEET.pricePerSheet),
      standardSize: this.pricing.SHEET.standardSize,
      isActive: this.pricing.SHEET.isActive
    };
  }
  
  return formatted;
});

// Method to get active measurement types
calculatorConfigSchema.methods.getActiveMeasurementTypes = function() {
  const activeTypes = [];
  
  if (this.pricing.SFT.isActive && this.pricing.SFT.pricePerSqFt) {
    activeTypes.push('SFT');
  }
  if (this.pricing.RFT.isActive && this.pricing.RFT.pricePerRunningFt) {
    activeTypes.push('RFT');
  }
  if (this.pricing.PANEL.isActive && this.pricing.PANEL.pricePerPanel) {
    activeTypes.push('PANEL');
  }
  if (this.pricing.SHEET.isActive && this.pricing.SHEET.pricePerSheet) {
    activeTypes.push('SHEET');
  }
  if (this.pricing.CUSTOM.isActive) {
    activeTypes.push('CUSTOM');
  }
  
  return activeTypes;
};

// Method to get price for specific measurement type
calculatorConfigSchema.methods.getPriceForMeasurementType = function(measurementType) {
  switch (measurementType) {
    case 'SFT':
      return this.pricing.SFT.pricePerSqFt;
    case 'RFT':
      return this.pricing.RFT.pricePerRunningFt;
    case 'PANEL':
      return this.pricing.PANEL.pricePerPanel;
    case 'SHEET':
      return this.pricing.SHEET.pricePerSheet;
    default:
      return null;
  }
};

// Pre-save middleware to ensure backward compatibility
calculatorConfigSchema.pre('save', function() {
  // If legacy pricePerSqFt is set and SFT pricing is not set, use legacy value
  if (this.pricePerSqFt && !this.pricing.SFT.pricePerSqFt) {
    this.pricing.SFT.pricePerSqFt = this.pricePerSqFt;
    this.pricing.SFT.isActive = true;
  }
  
  // Ensure supportedMeasurementTypes includes active types
  const activeTypes = [];
  if (this.pricing.SFT.isActive && this.pricing.SFT.pricePerSqFt) activeTypes.push('SFT');
  if (this.pricing.RFT.isActive && this.pricing.RFT.pricePerRunningFt) activeTypes.push('RFT');
  if (this.pricing.PANEL.isActive && this.pricing.PANEL.pricePerPanel) activeTypes.push('PANEL');
  if (this.pricing.SHEET.isActive && this.pricing.SHEET.pricePerSheet) activeTypes.push('SHEET');
  if (this.pricing.CUSTOM.isActive) activeTypes.push('CUSTOM');
  
  this.supportedMeasurementTypes = activeTypes;
});

// Include virtuals when converting to JSON
calculatorConfigSchema.set('toJSON', { virtuals: true });
calculatorConfigSchema.set('toObject', { virtuals: true });

// Index for better query performance
calculatorConfigSchema.index({ materialType: 1 });
calculatorConfigSchema.index({ isActive: 1 });
calculatorConfigSchema.index({ supportedMeasurementTypes: 1 });

export default mongoose.model('CalculatorConfig', calculatorConfigSchema);