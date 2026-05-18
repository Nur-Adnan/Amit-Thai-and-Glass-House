import mongoose from 'mongoose';

const materialSpecSchema = new mongoose.Schema({
  materialType: {
    type: String,
    required: [true, 'Material type is required'],
    enum: {
      values: ['Glass', 'Thai'],
      message: 'Material type must be either Glass or Thai'
    },
    index: true
  },
  thicknessMM: {
    type: Number,
    required: function() {
      // Thickness is required for Glass, optional for Thai
      return this.materialType === 'Glass';
    },
    min: [1, 'Thickness must be at least 1mm'],
    max: [50, 'Thickness cannot exceed 50mm'],
    validate: {
      validator: function(value) {
        // For Glass, thickness is required and must be valid
        if (this.materialType === 'Glass') {
          if (!value) return false;
          // Standard glass thicknesses in Bangladesh market
          const validGlassThicknesses = [3, 4, 5, 6, 8, 10, 12, 15, 19, 25];
          return validGlassThicknesses.includes(value);
        }
        
        // For Thai, thickness is optional but if provided, must be valid
        if (this.materialType === 'Thai' && value) {
          const validThaiThicknesses = [3, 4, 5, 6, 8, 10, 12, 15, 19, 25];
          return validThaiThicknesses.includes(value);
        }
        
        return true;
      },
      message: function(props) {
        if (props.instance.materialType === 'Glass') {
          return 'Glass thickness must be one of: 3, 4, 5, 6, 8, 10, 12, 15, 19, 25 mm';
        }
        return 'Thai thickness must be one of: 3, 4, 5, 6, 8, 10, 12, 15, 19, 25 mm (if specified)';
      }
    }
  },
  quality: {
    type: String,
    required: [true, 'Quality is required'],
    enum: {
      values: ['Local', 'Imported', 'Premium'],
      message: 'Quality must be Local, Imported, or Premium'
    },
    index: true
  },
  defaultUnit: {
    type: String,
    required: [true, 'Default unit is required'],
    enum: {
      values: ['SFT', 'RFT', 'PANEL', 'SHEET', 'PIECE'],
      message: 'Default unit must be SFT, RFT, PANEL, SHEET, or PIECE'
    },
    default: 'SFT'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
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

// Compound unique index to prevent duplicate specifications
materialSpecSchema.index({ 
  materialType: 1, 
  thicknessMM: 1, 
  quality: 1 
}, { 
  unique: true,
  partialFilterExpression: { 
    isDeleted: { $ne: true }
  }
});

// Additional indexes for performance
materialSpecSchema.index({ materialType: 1, isActive: 1 });
materialSpecSchema.index({ quality: 1, isActive: 1 });
materialSpecSchema.index({ defaultUnit: 1 });
materialSpecSchema.index({ createdAt: -1 });

// Virtual for display name
materialSpecSchema.virtual('displayName').get(function() {
  if (this.thicknessMM) {
    return `${this.materialType} - ${this.thicknessMM}mm ${this.quality}`;
  }
  return `${this.materialType} - ${this.quality}`;
});

// Virtual for specification key
materialSpecSchema.virtual('specKey').get(function() {
  const thickness = this.thicknessMM ? `${this.thicknessMM}mm` : 'any';
  return `${this.materialType}_${thickness}_${this.quality}`.toLowerCase().replace(/\s+/g, '_');
});

// Virtual for full specification
materialSpecSchema.virtual('specification').get(function() {
  const spec = {
    materialType: this.materialType,
    quality: this.quality,
    defaultUnit: this.defaultUnit,
    isActive: this.isActive
  };
  
  if (this.thicknessMM) {
    spec.thicknessMM = this.thicknessMM;
    spec.thickness = `${this.thicknessMM}mm`;
  }
  
  if (this.description) {
    spec.description = this.description;
  }
  
  return spec;
});

// Include virtuals when converting to JSON
materialSpecSchema.set('toJSON', { virtuals: true });
materialSpecSchema.set('toObject', { virtuals: true });

// Static method to get specifications by material type
materialSpecSchema.statics.getByMaterialType = function(materialType, activeOnly = true) {
  const query = { 
    materialType,
    isDeleted: { $ne: true }
  };
  
  if (activeOnly) {
    query.isActive = true;
  }
  
  return this.find(query).sort({ thicknessMM: 1, quality: 1 });
};

// Static method to get thickness options for a material type
materialSpecSchema.statics.getThicknessOptions = function(materialType, activeOnly = true) {
  const query = { 
    materialType,
    isDeleted: { $ne: true },
    thicknessMM: { $exists: true, $ne: null }
  };
  
  if (activeOnly) {
    query.isActive = true;
  }
  
  return this.distinct('thicknessMM', query).then(thicknesses => 
    thicknesses.sort((a, b) => a - b)
  );
};

// Static method to get quality options for a material type
materialSpecSchema.statics.getQualityOptions = function(materialType, activeOnly = true) {
  const query = { 
    materialType,
    isDeleted: { $ne: true }
  };
  
  if (activeOnly) {
    query.isActive = true;
  }
  
  return this.distinct('quality', query);
};

// Static method to get default unit for a specification
materialSpecSchema.statics.getDefaultUnit = function(materialType, thicknessMM = null, quality = null) {
  const query = { 
    materialType,
    isDeleted: { $ne: true },
    isActive: true
  };
  
  if (thicknessMM) {
    query.thicknessMM = thicknessMM;
  }
  
  if (quality) {
    query.quality = quality;
  }
  
  return this.findOne(query).then(spec => spec ? spec.defaultUnit : 'SFT');
};

// Static method to validate a material specification
materialSpecSchema.statics.validateSpec = function(materialType, thicknessMM, quality) {
  const query = { 
    materialType,
    quality,
    isDeleted: { $ne: true },
    isActive: true
  };
  
  if (thicknessMM) {
    query.thicknessMM = thicknessMM;
  }
  
  return this.findOne(query);
};

// Static method to get dropdown options for frontend
materialSpecSchema.statics.getDropdownOptions = async function(materialType = null) {
  const query = { 
    isDeleted: { $ne: true },
    isActive: true
  };
  
  if (materialType) {
    query.materialType = materialType;
  }
  
  const specs = await this.find(query).sort({ 
    materialType: 1, 
    thicknessMM: 1, 
    quality: 1 
  });
  
  const options = {
    materialTypes: [...new Set(specs.map(s => s.materialType))],
    thicknesses: {},
    qualities: {},
    units: [...new Set(specs.map(s => s.defaultUnit))]
  };
  
  // Group by material type
  specs.forEach(spec => {
    const mt = spec.materialType;
    
    if (!options.thicknesses[mt]) {
      options.thicknesses[mt] = [];
    }
    if (!options.qualities[mt]) {
      options.qualities[mt] = [];
    }
    
    if (spec.thicknessMM && !options.thicknesses[mt].includes(spec.thicknessMM)) {
      options.thicknesses[mt].push(spec.thicknessMM);
    }
    
    if (!options.qualities[mt].includes(spec.quality)) {
      options.qualities[mt].push(spec.quality);
    }
  });
  
  // Sort arrays
  Object.keys(options.thicknesses).forEach(mt => {
    options.thicknesses[mt].sort((a, b) => a - b);
  });
  
  Object.keys(options.qualities).forEach(mt => {
    options.qualities[mt].sort();
  });
  
  return options;
};

// Instance method for soft delete
materialSpecSchema.methods.softDelete = function(userId, reason = null) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.isActive = false;
  
  if (reason) {
    this.notes = this.notes ? `${this.notes}\n\nDeleted: ${reason}` : `Deleted: ${reason}`;
  }
  
  return this.save();
};

// Instance method for restore
materialSpecSchema.methods.restore = function(userId) {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  this.isActive = true;
  this.updatedBy = userId;
  
  return this.save();
};

// Instance method to activate
materialSpecSchema.methods.activate = function(userId) {
  this.isActive = true;
  this.updatedBy = userId;
  
  return this.save();
};

// Instance method to deactivate
materialSpecSchema.methods.deactivate = function(userId, reason = null) {
  this.isActive = false;
  this.updatedBy = userId;
  
  if (reason) {
    this.notes = this.notes ? `${this.notes}\n\nDeactivated: ${reason}` : `Deactivated: ${reason}`;
  }
  
  return this.save();
};

// Pre-save middleware for validation
materialSpecSchema.pre('save', function(next) {
  // Normalize quality
  if (this.quality) {
    this.quality = this.quality.trim();
  }
  
  // Set default unit based on material type if not specified
  if (!this.defaultUnit) {
    switch(this.materialType) {
      case 'Glass':
        this.defaultUnit = 'SFT';
        break;
      case 'Thai':
        this.defaultUnit = 'SFT';
        break;
      default:
        this.defaultUnit = 'SFT';
    }
  }
  
  next();
});

// Post-save middleware for logging
materialSpecSchema.post('save', function(doc) {
  console.log(`[MATERIAL_SPEC] ${doc.isNew ? 'Created' : 'Updated'} specification: ${doc.displayName}`);
});

export default mongoose.model('MaterialSpec', materialSpecSchema);