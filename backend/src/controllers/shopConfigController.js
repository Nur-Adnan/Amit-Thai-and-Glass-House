import asyncHandler from '../utils/asyncHandler.js';
import ShopConfig from '../models/ShopConfig.js';
import AuditService from '../services/auditService.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

// Configure multer for logo upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'logos');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// @desc    Get shop configuration
// @route   GET /api/shop-config
// @access  Public (for invoice display)
const getShopConfig = asyncHandler(async (req, res) => {
  const config = await ShopConfig.getActiveConfig();

  res.status(200).json({
    success: true,
    data: config
  });
});

// @desc    Get shop configuration for admin
// @route   GET /api/shop-config/admin
// @access  Private (Owner only)
const getShopConfigAdmin = asyncHandler(async (req, res) => {
  const config = await ShopConfig.findOne({ isActive: true })
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!config) {
    return res.status(200).json({
      success: true,
      data: ShopConfig.getDefaultConfig(),
      message: 'No configuration found, showing default values'
    });
  }

  res.status(200).json({
    success: true,
    data: config
  });
});

// @desc    Create or update shop configuration
// @route   POST /api/shop-config
// @access  Private (Owner only)
const createOrUpdateShopConfig = asyncHandler(async (req, res) => {
  try {
    // Check if configuration already exists
    let config = await ShopConfig.findOne({ isActive: true });
    let isUpdate = !!config;
    let oldConfig = null;

    if (isUpdate) {
      // Store old config for audit
      oldConfig = { ...config.toObject() };
      
      // Update existing configuration
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined) {
          if (typeof req.body[key] === 'object' && !Array.isArray(req.body[key])) {
            // Handle nested objects
            config[key] = { ...config[key], ...req.body[key] };
          } else {
            config[key] = req.body[key];
          }
        }
      });
      
      config.updatedBy = req.user.id;
      config.version += 1;
      
    } else {
      // Create new configuration
      req.body.createdBy = req.user.id;
      req.body.isActive = true;
      config = new ShopConfig(req.body);
    }

    // Validate and save
    await config.save();

    // Populate for response
    await config.populate('createdBy', 'name email');
    await config.populate('updatedBy', 'name email');

    // Log audit trail
    if (isUpdate) {
      await AuditService.logConfigUpdate('ShopConfig', oldConfig, config.toObject(), req.user, req);
    } else {
      await AuditService.log({
        action: 'config_create',
        entityType: 'ShopConfig',
        entityId: config._id,
        entityName: 'Shop Configuration',
        performedBy: req.user.id,
        description: `Created shop configuration for ${config.shopName}`,
        changes: {
          created: {
            shopName: config.shopName,
            currency: config.currency.code,
            invoicePrefix: config.invoicePrefix
          }
        },
        severity: 'high'
      }, req);
    }

    res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: `Shop configuration ${isUpdate ? 'updated' : 'created'} successfully`,
      data: config
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Upload shop logo
// @route   POST /api/shop-config/logo
// @access  Private (Owner only)
const uploadShopLogo = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No logo file uploaded'
    });
  }

  try {
    // Get or create shop configuration
    let config = await ShopConfig.findOne({ isActive: true });
    
    if (!config) {
      // Create default configuration if none exists
      const defaultConfig = ShopConfig.getDefaultConfig();
      config = new ShopConfig({
        ...defaultConfig,
        createdBy: req.user.id,
        isActive: true
      });
    }

    // Delete old logo file if exists
    if (config.logo && config.logo.filename) {
      const oldLogoPath = path.join(process.cwd(), 'uploads', 'logos', config.logo.filename);
      try {
        await fs.unlink(oldLogoPath);
      } catch (error) {
        console.log('Old logo file not found or already deleted');
      }
    }

    // Update logo information
    config.logo = {
      url: `/uploads/logos/${req.file.filename}`,
      filename: req.file.filename,
      size: req.file.size,
      uploadedAt: new Date()
    };
    
    config.updatedBy = req.user.id;
    if (config.version) config.version += 1;

    await config.save();

    // Log audit trail
    await AuditService.log({
      action: 'config_update',
      entityType: 'ShopConfig',
      entityId: config._id,
      entityName: 'Shop Logo Upload',
      performedBy: req.user.id,
      description: `Uploaded new shop logo: ${req.file.filename}`,
      changes: {
        logoUpdate: {
          filename: req.file.filename,
          size: req.file.size,
          uploadedAt: new Date()
        }
      },
      severity: 'medium'
    }, req);

    res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      data: {
        logo: config.logo,
        shopName: config.shopName
      }
    });

  } catch (error) {
    // Delete uploaded file if database operation fails
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to delete uploaded file:', unlinkError);
      }
    }

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Delete shop logo
// @route   DELETE /api/shop-config/logo
// @access  Private (Owner only)
const deleteShopLogo = asyncHandler(async (req, res) => {
  const config = await ShopConfig.findOne({ isActive: true });

  if (!config) {
    return res.status(404).json({
      success: false,
      message: 'Shop configuration not found'
    });
  }

  if (!config.logo || !config.logo.filename) {
    return res.status(400).json({
      success: false,
      message: 'No logo found to delete'
    });
  }

  try {
    // Delete logo file
    const logoPath = path.join(process.cwd(), 'uploads', 'logos', config.logo.filename);
    await fs.unlink(logoPath);
  } catch (error) {
    console.log('Logo file not found or already deleted');
  }

  // Remove logo from configuration
  const oldLogo = config.logo;
  config.logo = {
    url: null,
    filename: null,
    size: null,
    uploadedAt: null
  };
  
  config.updatedBy = req.user.id;
  config.version += 1;
  
  await config.save();

  // Log audit trail
  await AuditService.log({
    action: 'config_update',
    entityType: 'ShopConfig',
    entityId: config._id,
    entityName: 'Shop Logo Deletion',
    performedBy: req.user.id,
    description: `Deleted shop logo: ${oldLogo.filename}`,
    changes: {
      logoDelete: {
        deletedFilename: oldLogo.filename,
        deletedAt: new Date()
      }
    },
    severity: 'medium'
  }, req);

  res.status(200).json({
    success: true,
    message: 'Logo deleted successfully'
  });
});

// @desc    Reset shop configuration to defaults
// @route   POST /api/shop-config/reset
// @access  Private (Owner only)
const resetShopConfig = asyncHandler(async (req, res) => {
  const config = await ShopConfig.findOne({ isActive: true });

  if (!config) {
    return res.status(404).json({
      success: false,
      message: 'Shop configuration not found'
    });
  }

  // Store old config for audit
  const oldConfig = { ...config.toObject() };

  // Reset to default values
  const defaultConfig = ShopConfig.getDefaultConfig();
  
  // Preserve system fields
  Object.keys(defaultConfig).forEach(key => {
    if (!['_id', 'createdBy', 'createdAt', 'isActive'].includes(key)) {
      config[key] = defaultConfig[key];
    }
  });

  config.updatedBy = req.user.id;
  config.version += 1;

  await config.save();

  // Log audit trail
  await AuditService.log({
    action: 'config_update',
    entityType: 'ShopConfig',
    entityId: config._id,
    entityName: 'Shop Configuration Reset',
    performedBy: req.user.id,
    description: 'Reset shop configuration to default values',
    changes: {
      reset: {
        resetAt: new Date(),
        previousVersion: oldConfig.version
      }
    },
    severity: 'high'
  }, req);

  await config.populate('createdBy', 'name email');
  await config.populate('updatedBy', 'name email');

  res.status(200).json({
    success: true,
    message: 'Shop configuration reset to defaults successfully',
    data: config
  });
});

// @desc    Get invoice preview with shop config
// @route   GET /api/shop-config/invoice-preview
// @access  Private (Owner only)
const getInvoicePreview = asyncHandler(async (req, res) => {
  const config = await ShopConfig.getActiveConfig();

  // Sample invoice data for preview
  const sampleInvoice = {
    invoiceNo: config.generateInvoiceNumber ? config.generateInvoiceNumber(1) : 'INV-202601-0001',
    customerName: 'Sample Customer',
    customerPhone: '+880-XXX-XXXXXX',
    customerAddress: 'Sample Address, Dhaka, Bangladesh',
    items: [
      {
        productName: 'Premium Thai Marble - White',
        quantity: 10,
        unit: 'sqft',
        unitPrice: 200,
        totalPrice: 2000
      },
      {
        productName: 'Tempered Glass Panel - 8mm',
        quantity: 5,
        unit: 'sqft',
        unitPrice: 120,
        totalPrice: 600
      }
    ],
    subtotal: 2600,
    discount: 100,
    grandTotal: 2500,
    paidAmount: 1000,
    dueAmount: 1500,
    status: 'partial',
    createdAt: new Date()
  };

  res.status(200).json({
    success: true,
    data: {
      config,
      sampleInvoice
    }
  });
});

// @desc    Test invoice number generation
// @route   GET /api/shop-config/test-invoice-number
// @access  Private (Owner only)
const testInvoiceNumber = asyncHandler(async (req, res) => {
  const config = await ShopConfig.getActiveConfig();
  const { sequence = 1 } = req.query;

  const invoiceNumber = config.generateInvoiceNumber 
    ? config.generateInvoiceNumber(parseInt(sequence))
    : `${config.invoicePrefix || 'INV'}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(sequence).padStart(4, '0')}`;

  res.status(200).json({
    success: true,
    data: {
      invoiceNumber,
      prefix: config.invoicePrefix || 'INV',
      sequence: parseInt(sequence),
      format: 'PREFIX-YYYYMM-XXXX'
    }
  });
});

// @desc    Update trust information for BD market
// @route   PUT /api/shop-config/trust-info
// @access  Private (Owner only)
const updateTrustInfo = asyncHandler(async (req, res) => {
  const { tradeLicenseNo, shopAddress, contactNumber, displayOnInvoice, displayOnPrint } = req.body;

  // Validate Bangladesh phone number format if provided
  if (contactNumber && !/^(\+880|880|0)?[1-9]\d{8,10}$/.test(contactNumber)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid Bangladesh phone number'
    });
  }

  let config = await ShopConfig.findOne({ isActive: true });
  
  if (!config) {
    // Create default configuration if none exists
    const defaultConfig = ShopConfig.getDefaultConfig();
    config = new ShopConfig({
      ...defaultConfig,
      createdBy: req.user.id,
      isActive: true
    });
  }

  // Store old config for audit
  const oldTrustInfo = config.trustInfo ? { ...config.trustInfo } : {};

  // Update trust information
  config.trustInfo = {
    tradeLicenseNo: tradeLicenseNo || config.trustInfo?.tradeLicenseNo || '',
    shopAddress: shopAddress || config.trustInfo?.shopAddress || '',
    contactNumber: contactNumber || config.trustInfo?.contactNumber || '',
    displayOnInvoice: displayOnInvoice !== undefined ? displayOnInvoice : (config.trustInfo?.displayOnInvoice ?? true),
    displayOnPrint: displayOnPrint !== undefined ? displayOnPrint : (config.trustInfo?.displayOnPrint ?? true)
  };

  config.updatedBy = req.user.id;
  if (config.version) config.version += 1;

  await config.save();

  // Log audit trail
  await AuditService.log({
    action: 'config_update',
    entityType: 'ShopConfig',
    entityId: config._id,
    entityName: 'Trust Information Update',
    performedBy: req.user.id,
    description: 'Updated trust information for customer confidence',
    changes: {
      trustInfo: {
        old: oldTrustInfo,
        new: config.trustInfo
      }
    },
    severity: 'medium'
  }, req);

  await config.populate('createdBy', 'name email');
  await config.populate('updatedBy', 'name email');

  res.status(200).json({
    success: true,
    message: 'Trust information updated successfully',
    data: {
      trustInfo: config.trustInfo,
      shopName: config.shopName
    }
  });
});

export {
  getShopConfig,
  getShopConfigAdmin,
  createOrUpdateShopConfig,
  updateTrustInfo,
  uploadShopLogo,
  deleteShopLogo,
  resetShopConfig,
  getInvoicePreview,
  testInvoiceNumber
};