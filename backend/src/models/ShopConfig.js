import mongoose from 'mongoose';

const shopConfigSchema = new mongoose.Schema({
  // Shop identification
  shopName: {
    type: String,
    required: [true, 'Shop name is required'],
    trim: true,
    maxlength: [100, 'Shop name cannot be more than 100 characters']
  },
  
  // Logo configuration
  logo: {
    url: {
      type: String,
      trim: true,
      maxlength: [500, 'Logo URL cannot be more than 500 characters']
    },
    filename: {
      type: String,
      trim: true,
      maxlength: [100, 'Logo filename cannot be more than 100 characters']
    },
    size: {
      type: Number,
      min: [0, 'Logo size cannot be negative']
    },
    uploadedAt: {
      type: Date
    }
  },
  
  // Shop address
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
      maxlength: [200, 'Street address cannot be more than 200 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [50, 'City cannot be more than 50 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [50, 'State cannot be more than 50 characters']
    },
    zipCode: {
      type: String,
      trim: true,
      maxlength: [20, 'Zip code cannot be more than 20 characters']
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      maxlength: [50, 'Country cannot be more than 50 characters'],
      default: 'Bangladesh'
    }
  },
  
  // Contact information
  phone: {
    primary: {
      type: String,
      required: [true, 'Primary phone is required'],
      trim: true,
      maxlength: [20, 'Phone number cannot be more than 20 characters']
    },
    secondary: {
      type: String,
      trim: true,
      maxlength: [20, 'Secondary phone cannot be more than 20 characters']
    },
    whatsapp: {
      type: String,
      trim: true,
      maxlength: [20, 'WhatsApp number cannot be more than 20 characters']
    }
  },
  
  // Email configuration
  email: {
    primary: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [100, 'Email cannot be more than 100 characters'],
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    support: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [100, 'Support email cannot be more than 100 characters'],
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid support email']
    }
  },
  
  // Website and social media
  website: {
    type: String,
    trim: true,
    maxlength: [200, 'Website URL cannot be more than 200 characters']
  },
  
  socialMedia: {
    facebook: {
      type: String,
      trim: true,
      maxlength: [200, 'Facebook URL cannot be more than 200 characters']
    },
    instagram: {
      type: String,
      trim: true,
      maxlength: [200, 'Instagram URL cannot be more than 200 characters']
    },
    linkedin: {
      type: String,
      trim: true,
      maxlength: [200, 'LinkedIn URL cannot be more than 200 characters']
    }
  },
  
  // Invoice configuration
  invoicePrefix: {
    type: String,
    required: [true, 'Invoice prefix is required'],
    trim: true,
    uppercase: true,
    maxlength: [10, 'Invoice prefix cannot be more than 10 characters'],
    default: 'INV'
  },
  
  // Footer note for invoices
  footerNote: {
    type: String,
    trim: true,
    maxlength: [500, 'Footer note cannot be more than 500 characters'],
    default: 'Thank you for your business!'
  },
  
  // Terms and conditions
  termsAndConditions: {
    type: String,
    trim: true,
    maxlength: [2000, 'Terms and conditions cannot be more than 2000 characters']
  },
  
  // Currency configuration
  currency: {
    code: {
      type: String,
      required: [true, 'Currency code is required'],
      trim: true,
      uppercase: true,
      maxlength: [3, 'Currency code must be 3 characters'],
      minlength: [3, 'Currency code must be 3 characters'],
      default: 'BDT'
    },
    symbol: {
      type: String,
      required: [true, 'Currency symbol is required'],
      trim: true,
      maxlength: [5, 'Currency symbol cannot be more than 5 characters'],
      default: '৳'
    },
    position: {
      type: String,
      enum: {
        values: ['before', 'after'],
        message: 'Currency position must be before or after'
      },
      default: 'before'
    }
  },
  
  // Tax configuration
  tax: {
    enabled: {
      type: Boolean,
      default: false
    },
    rate: {
      type: Number,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot be more than 100%'],
      default: 0
    },
    label: {
      type: String,
      trim: true,
      maxlength: [50, 'Tax label cannot be more than 50 characters'],
      default: 'VAT'
    },
    registrationNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'Tax registration number cannot be more than 50 characters']
    }
  },
  
  // Business registration details
  businessRegistration: {
    registrationNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'Registration number cannot be more than 50 characters']
    },
    licenseNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'License number cannot be more than 50 characters']
    },
    establishedYear: {
      type: Number,
      min: [1900, 'Established year must be after 1900'],
      max: [new Date().getFullYear(), 'Established year cannot be in the future']
    }
  },

  // Trust building information for BD market
  trustInfo: {
    tradeLicenseNo: {
      type: String,
      trim: true,
      maxlength: [100, 'Trade license number cannot be more than 100 characters'],
      index: true
    },
    shopAddress: {
      type: String,
      trim: true,
      maxlength: [300, 'Shop address cannot be more than 300 characters']
    },
    contactNumber: {
      type: String,
      trim: true,
      maxlength: [20, 'Contact number cannot be more than 20 characters'],
      match: [/^(\+880|880|0)?[1-9]\d{8,10}$/, 'Please enter a valid Bangladesh phone number']
    },
    displayOnInvoice: {
      type: Boolean,
      default: true
    },
    displayOnPrint: {
      type: Boolean,
      default: true
    }
  },
  
  // Invoice display settings
  invoiceSettings: {
    showLogo: {
      type: Boolean,
      default: true
    },
    showAddress: {
      type: Boolean,
      default: true
    },
    showPhone: {
      type: Boolean,
      default: true
    },
    showEmail: {
      type: Boolean,
      default: true
    },
    showWebsite: {
      type: Boolean,
      default: false
    },
    showFooterNote: {
      type: Boolean,
      default: true
    },
    showTerms: {
      type: Boolean,
      default: false
    },
    showTax: {
      type: Boolean,
      default: false
    },
    showTrustInfo: {
      type: Boolean,
      default: true
    },
    logoSize: {
      type: String,
      enum: {
        values: ['small', 'medium', 'large'],
        message: 'Logo size must be small, medium, or large'
      },
      default: 'medium'
    }
  },
  
  // Theme and styling
  theme: {
    primaryColor: {
      type: String,
      trim: true,
      maxlength: [7, 'Color code cannot be more than 7 characters'],
      match: [/^#[0-9A-F]{6}$/i, 'Please enter a valid hex color code'],
      default: '#2563eb'
    },
    secondaryColor: {
      type: String,
      trim: true,
      maxlength: [7, 'Color code cannot be more than 7 characters'],
      match: [/^#[0-9A-F]{6}$/i, 'Please enter a valid hex color code'],
      default: '#64748b'
    },
    fontFamily: {
      type: String,
      enum: {
        values: ['Arial', 'Helvetica', 'Times New Roman', 'Roboto', 'Open Sans'],
        message: 'Invalid font family'
      },
      default: 'Arial'
    }
  },
  
  // System fields
  isActive: {
    type: Boolean,
    default: true
  },
  
  version: {
    type: Number,
    default: 1
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

// Ensure only one active configuration exists
shopConfigSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

// Virtual for trust info summary
shopConfigSchema.virtual('trustInfoSummary').get(function() {
  const trustInfo = [];
  if (this.trustInfo?.tradeLicenseNo) trustInfo.push(`Trade License: ${this.trustInfo.tradeLicenseNo}`);
  if (this.trustInfo?.shopAddress) trustInfo.push(`Address: ${this.trustInfo.shopAddress}`);
  if (this.trustInfo?.contactNumber) trustInfo.push(`Contact: ${this.trustInfo.contactNumber}`);
  return trustInfo.join(' | ');
});

// Virtual for full address
shopConfigSchema.virtual('fullAddress').get(function() {
  const parts = [];
  if (this.address.street) parts.push(this.address.street);
  if (this.address.city) parts.push(this.address.city);
  if (this.address.state) parts.push(this.address.state);
  if (this.address.zipCode) parts.push(this.address.zipCode);
  if (this.address.country) parts.push(this.address.country);
  return parts.join(', ');
});

// Virtual for formatted currency
shopConfigSchema.virtual('formattedCurrency').get(function() {
  return {
    code: this.currency.code,
    symbol: this.currency.symbol,
    position: this.currency.position,
    format: (amount) => {
      const formattedAmount = parseFloat(amount).toLocaleString('en-BD', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      
      return this.currency.position === 'before' 
        ? `${this.currency.symbol}${formattedAmount}`
        : `${formattedAmount}${this.currency.symbol}`;
    }
  };
});

// Virtual for contact summary
shopConfigSchema.virtual('contactSummary').get(function() {
  const contacts = [];
  if (this.phone.primary) contacts.push(`Phone: ${this.phone.primary}`);
  if (this.phone.secondary) contacts.push(`Alt: ${this.phone.secondary}`);
  if (this.email.primary) contacts.push(`Email: ${this.email.primary}`);
  if (this.website) contacts.push(`Web: ${this.website}`);
  return contacts.join(' | ');
});

// Static method to get active configuration
shopConfigSchema.statics.getActiveConfig = async function() {
  const config = await this.findOne({ isActive: true })
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');
  
  if (!config) {
    // Return default configuration if none exists
    return this.getDefaultConfig();
  }
  
  return config;
};

// Static method to get default configuration
shopConfigSchema.statics.getDefaultConfig = function() {
  return {
    shopName: 'Thai & Aluminum Business',
    address: {
      street: 'Business Address',
      city: 'Dhaka',
      state: 'Dhaka Division',
      zipCode: '1000',
      country: 'Bangladesh'
    },
    phone: {
      primary: '+880-XXX-XXXXXX'
    },
    email: {
      primary: 'info@thaialuminum.com'
    },
    trustInfo: {
      tradeLicenseNo: '',
      shopAddress: '',
      contactNumber: '',
      displayOnInvoice: true,
      displayOnPrint: true
    },
    invoicePrefix: 'INV',
    footerNote: 'Thank you for your business!',
    currency: {
      code: 'BDT',
      symbol: '৳',
      position: 'before'
    },
    theme: {
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
      fontFamily: 'Arial'
    },
    invoiceSettings: {
      showLogo: true,
      showAddress: true,
      showPhone: true,
      showEmail: true,
      showWebsite: false,
      showFooterNote: true,
      showTerms: false,
      showTax: false,
      showTrustInfo: true,
      logoSize: 'medium'
    },
    isDefault: true
  };
};

// Method to create new invoice number with prefix
shopConfigSchema.methods.generateInvoiceNumber = function(sequence) {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const sequenceStr = String(sequence).padStart(4, '0');
  
  return `${this.invoicePrefix}-${year}${month}-${sequenceStr}`;
};

// Method to format currency amount
shopConfigSchema.methods.formatCurrency = function(amount) {
  const formattedAmount = parseFloat(amount).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return this.currency.position === 'before' 
    ? `${this.currency.symbol}${formattedAmount}`
    : `${formattedAmount}${this.currency.symbol}`;
};

// Include virtuals when converting to JSON
shopConfigSchema.set('toJSON', { virtuals: true });
shopConfigSchema.set('toObject', { virtuals: true });

export default mongoose.model('ShopConfig', shopConfigSchema);