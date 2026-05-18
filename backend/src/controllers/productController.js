import asyncHandler from '../utils/asyncHandler.js';
import Product from '../models/Product.js';
import AuditService from '../services/auditService.js';
import BusinessRulesService from '../services/businessRulesService.js';
import DangerousEditService from '../services/dangerousEditService.js';
import { validateStockAvailability } from '../utils/businessValidation.js';
import { logConfirmedAction } from '../middleware/confirmationRequired.js';
import SoftDeleteService from '../services/softDeleteService.js';
import { BusinessValidator, MoneyValidator } from '../utils/validation.js';
import CurrencyService from '../services/currencyService.js';
import DateService from '../services/dateService.js';

// @desc    Get all products with variant support
// @route   GET /api/products
// @access  Private (All authenticated users)
export const getProducts = asyncHandler(async (req, res) => {
  const {
    materialType,
    category, // backward compatibility
    company,
    thicknessMM,
    quality,
    measurementType,
    isActive,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
    groupByVariants = false
  } = req.query;

  // Build query - exclude soft deleted items by default
  const query = { isDeleted: { $ne: true } };

  // Handle materialType/category (backward compatibility)
  const materialTypeFilter = materialType || category;
  if (materialTypeFilter) {
    query.materialType = materialTypeFilter;
  }

  // Variant-specific filters
  if (company) {
    query.company = { $regex: company, $options: 'i' };
  }

  if (thicknessMM) {
    query.thicknessMM = parseFloat(thicknessMM);
  }

  if (quality) {
    query.quality = quality;
  }

  if (measurementType) {
    query.measurementType = measurementType;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const products = await Product.find(query)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Product.countDocuments(query);

  // Format products with currency and date formatting
  const formattedProducts = products.map(product => ({
    ...product.toObject(),
    formattedPurchasePrice: CurrencyService.formatBDT(product.purchasePrice),
    formattedSellingPrice: CurrencyService.formatBDT(product.sellingPrice),
    formattedCreatedAt: DateService.format(product.createdAt, 'medium'),
    formattedUpdatedAt: DateService.format(product.updatedAt, 'medium'),
    // Include variant information
    variantDisplayName: product.variantDisplayName,
    variantSpecification: product.variantSpecification,
    variantKey: product.variantKey
  }));

  // Group by variants if requested
  let responseData = formattedProducts;
  if (groupByVariants === 'true') {
    const grouped = {};
    formattedProducts.forEach(product => {
      const baseKey = `${product.name}_${product.materialType}`;
      if (!grouped[baseKey]) {
        grouped[baseKey] = {
          name: product.name,
          materialType: product.materialType,
          variants: []
        };
      }
      grouped[baseKey].variants.push(product);
    });
    responseData = Object.values(grouped);
  }

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: responseData
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private (All authenticated users)
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
      suggestion: 'Please check the product ID and try again.'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      ...product.toObject(),
      formattedPurchasePrice: CurrencyService.formatBDT(product.purchasePrice),
      formattedSellingPrice: CurrencyService.formatBDT(product.sellingPrice),
      formattedCreatedAt: DateService.format(product.createdAt, 'datetime'),
      formattedUpdatedAt: DateService.format(product.updatedAt, 'datetime')
    }
  });
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Manager and above)
export const createProduct = asyncHandler(async (req, res) => {
  // Validate product data using BusinessValidator (now async)
  const validation = await BusinessValidator.validateProduct(req.body);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Product validation failed',
      errors: validation.errors,
      suggestion: 'Please check your input data and ensure all required fields are properly filled.'
    });
  }

  // Use sanitized data from validation
  const productData = {
    ...validation.sanitizedData,
    createdBy: req.user.id
  };

  const product = await Product.create(productData);

  // Populate the created product
  await product.populate('createdBy', 'name email');

  // Log audit trail
  await AuditService.logProductCreate(product, req.user, req);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: {
      ...product.toObject(),
      formattedPurchasePrice: CurrencyService.formatBDT(product.purchasePrice),
      formattedSellingPrice: CurrencyService.formatBDT(product.sellingPrice),
      formattedCreatedAt: DateService.format(product.createdAt, 'datetime')
    }
  });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Can edit product)
export const updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
      suggestion: 'Please check the product ID and try again.'
    });
  }

  // Check if user is trying to update prices and has permission
  const isPriceUpdate = req.body.purchasePrice !== undefined || req.body.sellingPrice !== undefined;
  if (isPriceUpdate) {
    const hasPermission = await req.user.hasPermission('CAN_EDIT_PRICE');
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Required permission: CAN_EDIT_PRICE',
        requiredPermission: 'CAN_EDIT_PRICE',
        suggestion: 'Contact your administrator to get price editing permissions.'
      });
    }
  }

  // Store original values for dangerous edit validation
  const originalProduct = { ...product.toObject() };
  
  // Validate for dangerous edits BEFORE other validations
  const dangerousEditValidation = await DangerousEditService.validateProductEdit(originalProduct, req.body);
  
  // If there are restrictions, block the edit immediately
  if (!dangerousEditValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Edit contains dangerous changes that are not allowed',
      dangerousEdit: true,
      restrictions: dangerousEditValidation.restrictions,
      warnings: dangerousEditValidation.warnings,
      summary: dangerousEditValidation.summary
    });
  }
  
  // If confirmation is required but not provided, return confirmation request
  if (dangerousEditValidation.requiresConfirmation && !req.body.confirmDangerousEdit) {
    return res.status(409).json({
      success: false,
      message: 'This edit requires confirmation due to dangerous changes',
      dangerousEdit: true,
      requiresConfirmation: true,
      confirmationRequired: dangerousEditValidation.confirmationRequired,
      warnings: dangerousEditValidation.warnings,
      summary: dangerousEditValidation.summary,
      instructions: {
        message: 'To proceed with this edit, send the request again with confirmDangerousEdit: true and provide reasons for each change',
        requiredFields: dangerousEditValidation.confirmationRequired
          .filter(c => c.requiresReason)
          .map(c => ({
            field: c.field,
            reason: 'reasons.' + c.field,
            message: c.message
          }))
      }
    });
  }
  
  // If confirmation is provided, validate and process
  if (req.body.confirmDangerousEdit && dangerousEditValidation.requiresConfirmation) {
    const confirmationResult = await DangerousEditService.processConfirmedEdit(
      originalProduct, 
      req.body, 
      {
        confirmed: true,
        reasons: req.body.reasons || {},
        timestamp: new Date(),
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }, 
      req.user, 
      req
    );
    
    if (!confirmationResult.success) {
      return res.status(400).json({
        success: false,
        message: confirmationResult.message,
        missingReason: confirmationResult.missingReason
      });
    }
  }

  // Validate updated product data (now async)
  const updatedData = { ...product.toObject(), ...req.body };
  const validation = await BusinessValidator.validateProduct(updatedData);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Product validation failed',
      errors: validation.errors,
      suggestion: 'Please check your input data and ensure all fields are properly filled.'
    });
  }

  // Update with sanitized data
  Object.assign(product, validation.sanitizedData);
  product.updatedBy = req.user.id;

  await product.save();

  // Populate the updated product
  await product.populate('createdBy', 'name email');
  await product.populate('updatedBy', 'name email');

  // Log audit trail (regular update)
  await AuditService.logProductUpdate(originalProduct, product, req.user, req);

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    dangerousEditProcessed: dangerousEditValidation.requiresConfirmation && req.body.confirmDangerousEdit,
    data: {
      ...product.toObject(),
      formattedPurchasePrice: CurrencyService.formatBDT(product.purchasePrice),
      formattedSellingPrice: CurrencyService.formatBDT(product.sellingPrice),
      formattedUpdatedAt: DateService.format(product.updatedAt, 'datetime')
    }
  });
});

// @desc    Soft delete product
// @route   DELETE /api/products/:id
// @access  Private (Manager and above)
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  if (product.isDeleted) {
    return res.status(400).json({
      success: false,
      message: 'Product is already deleted'
    });
  }

  // Use soft delete service
  const result = await SoftDeleteService.softDelete(product, req.user.id, req, req.body.reason);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.message
    });
  }

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
    data: result.entity
  });
});

// @desc    Restore soft deleted product
// @route   PUT /api/products/:id/restore
// @access  Private (Manager and above)
export const restoreProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  if (!product.isDeleted) {
    return res.status(400).json({
      success: false,
      message: 'Product is not deleted'
    });
  }

  // Use soft delete service
  const result = await SoftDeleteService.restore(product, req.user.id, req, req.body.reason);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.message
    });
  }

  res.status(200).json({
    success: true,
    message: 'Product restored successfully',
    data: result.entity
  });
});

// @desc    Get soft deleted products
// @route   GET /api/products/deleted
// @access  Private (Manager and above)
export const getDeletedProducts = asyncHandler(async (req, res) => {
  const {
    category,
    search,
    sortBy = 'deletedAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10
  } = req.query;

  // Build filters
  const filters = {};
  if (category) filters.category = category;
  if (search) filters.name = { $regex: search, $options: 'i' };

  const options = {
    page,
    limit,
    sortBy,
    sortOrder,
    populate: ['createdBy', 'updatedBy', 'deletedBy']
  };

  const result = await SoftDeleteService.getDeleted(Product, filters, options);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.message
    });
  }

  res.status(200).json({
    success: true,
    count: result.data.length,
    pagination: result.pagination,
    data: result.data
  });
});

// @desc    Update product stock
// @route   PUT /api/products/:id/stock
// @access  Private (Manager and above)
export const updateStock = asyncHandler(async (req, res) => {
  const { quantity, operation, reason } = req.body;

  // Validate input
  if (!quantity || !operation) {
    return res.status(400).json({
      success: false,
      message: 'Please provide quantity and operation (add/subtract)'
    });
  }

  // Require reason for manual stock edits
  if (!reason || reason.trim().length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Reason is required for manual stock adjustments (minimum 10 characters)',
      requiresReason: true,
      field: 'reason'
    });
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  const originalStock = product.stockQuantity;
  let newStock;

  if (operation === 'add') {
    newStock = originalStock + quantity;
  } else if (operation === 'subtract') {
    newStock = Math.max(0, originalStock - quantity);
  } else {
    return res.status(400).json({
      success: false,
      message: 'Operation must be either "add" or "subtract"'
    });
  }

  // Log the manual stock adjustment
  await AuditService.logAction({
    action: 'MANUAL_STOCK_ADJUSTMENT',
    entityType: 'Product',
    entityId: product._id,
    performedBy: req.user.id,
    details: {
      productName: product.name,
      materialType: product.materialType,
      company: product.company,
      thicknessMM: product.thicknessMM,
      quality: product.quality,
      originalStock: originalStock,
      newStock: newStock,
      operation: operation,
      quantity: quantity,
      reason: reason.trim(),
      stockValue: {
        old: CurrencyService.formatBDT(originalStock * product.purchasePrice),
        new: CurrencyService.formatBDT(newStock * product.purchasePrice)
      }
    },
    severity: 'medium',
    metadata: {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date()
    }
  });

  product.stockQuantity = newStock;
  product.updatedBy = req.user.id;
  await product.save();

  res.status(200).json({
    success: true,
    message: 'Stock updated successfully',
    data: {
      productId: product._id,
      productName: product.name,
      originalStock: originalStock,
      newStock: newStock,
      operation: operation,
      quantity: quantity,
      reason: reason,
      updatedAt: product.updatedAt
    }
  });
});

// @desc    Validate dangerous edit without updating
// @route   POST /api/products/:id/validate-edit
// @access  Private (Can edit product)
export const validateDangerousEdit = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Validate for dangerous edits
  const validation = await DangerousEditService.validateProductEdit(product.toObject(), req.body);
  
  res.status(200).json({
    success: true,
    message: 'Edit validation completed',
    validation: {
      isValid: validation.isValid,
      hasWarnings: validation.hasWarnings,
      requiresConfirmation: validation.requiresConfirmation,
      restrictions: validation.restrictions,
      warnings: validation.warnings,
      confirmationRequired: validation.confirmationRequired,
      summary: validation.summary
    }
  });
});

// @desc    Get dangerous edit history for product
// @route   GET /api/products/:id/edit-history
// @access  Private (Manager and above)
export const getDangerousEditHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  const history = await DangerousEditService.getDangerousEditHistory(req.params.id, {
    page: parseInt(page),
    limit: parseInt(limit)
  });
  
  if (!history.success) {
    return res.status(400).json({
      success: false,
      message: history.message
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Edit history retrieved successfully',
    data: history.data
  });
});

// @desc    Get low stock products
// @route   GET /api/products/low-stock
// @access  Private (Manager and above)
export const getLowStockProducts = asyncHandler(async (req, res) => {
  const { threshold = 10 } = req.query;

  const products = await Product.find({
    stockQuantity: { $lte: parseInt(threshold) },
    isActive: true
  })
    .populate('createdBy', 'name email')
    .sort({ stockQuantity: 1 });

  res.status(200).json({
    success: true,
    count: products.length,
    threshold: parseInt(threshold),
    data: products
  });
});

// @desc    Get product statistics with variant support
// @route   GET /api/products/stats
// @access  Private (Manager and above)
export const getProductStats = asyncHandler(async (req, res) => {
  const stats = await Product.aggregate([
    {
      $match: { isDeleted: { $ne: true } }
    },
    {
      $group: {
        _id: '$materialType',
        totalProducts: { $sum: 1 },
        totalStock: { $sum: '$stockQuantity' },
        avgPurchasePrice: { $avg: '$purchasePrice' },
        avgSellingPrice: { $avg: '$sellingPrice' },
        totalPurchaseValue: { $sum: { $multiply: ['$purchasePrice', '$stockQuantity'] } },
        totalSellingValue: { $sum: { $multiply: ['$sellingPrice', '$stockQuantity'] } }
      }
    },
    {
      $project: {
        materialType: '$_id',
        totalProducts: 1,
        totalStock: 1,
        avgPurchasePrice: { $round: ['$avgPurchasePrice', 2] },
        avgSellingPrice: { $round: ['$avgSellingPrice', 2] },
        totalPurchaseValue: { $round: ['$totalPurchaseValue', 2] },
        totalSellingValue: { $round: ['$totalSellingValue', 2] },
        potentialProfit: { 
          $round: [{ $subtract: ['$totalSellingValue', '$totalPurchaseValue'] }, 2] 
        }
      }
    }
  ]);

  // Variant-specific stats for Thai/Glass products
  const variantStats = await Product.aggregate([
    {
      $match: { 
        materialType: { $in: ['Thai', 'Glass'] },
        isDeleted: { $ne: true }
      }
    },
    {
      $group: {
        _id: {
          materialType: '$materialType',
          company: '$company',
          thicknessMM: '$thicknessMM',
          quality: '$quality'
        },
        count: { $sum: 1 },
        totalStock: { $sum: '$stockQuantity' },
        avgPrice: { $avg: '$sellingPrice' }
      }
    },
    {
      $group: {
        _id: '$_id.materialType',
        companies: { $addToSet: '$_id.company' },
        thicknesses: { $addToSet: '$_id.thicknessMM' },
        qualities: { $addToSet: '$_id.quality' },
        totalVariants: { $sum: 1 },
        totalStock: { $sum: '$totalStock' }
      }
    }
  ]);

  // Overall stats
  const overallStats = await Product.aggregate([
    {
      $match: { isDeleted: { $ne: true } }
    },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        activeProducts: { $sum: { $cond: ['$isActive', 1, 0] } },
        totalStock: { $sum: '$stockQuantity' },
        totalPurchaseValue: { $sum: { $multiply: ['$purchasePrice', '$stockQuantity'] } },
        totalSellingValue: { $sum: { $multiply: ['$sellingPrice', '$stockQuantity'] } }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      byMaterialType: stats,
      variantBreakdown: variantStats,
      overall: overallStats[0] || {}
    }
  });
});

// @desc    Get product variants
// @route   GET /api/products/:name/variants
// @access  Private (All authenticated users)
export const getProductVariants = asyncHandler(async (req, res) => {
  const { name } = req.params;
  const { materialType } = req.query;

  const variants = await Product.findVariants(name, materialType);

  if (variants.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No variants found for this product',
      suggestion: 'Check the product name and try again.'
    });
  }

  const formattedVariants = variants.map(variant => ({
    ...variant.toObject(),
    formattedPurchasePrice: CurrencyService.formatBDT(variant.purchasePrice),
    formattedSellingPrice: CurrencyService.formatBDT(variant.sellingPrice),
    variantDisplayName: variant.variantDisplayName,
    variantSpecification: variant.variantSpecification,
    stockValue: CurrencyService.formatBDT(variant.stockQuantity * variant.purchasePrice)
  }));

  res.status(200).json({
    success: true,
    productName: name,
    materialType: materialType || 'All',
    count: formattedVariants.length,
    data: formattedVariants
  });
});

// @desc    Check if variant exists
// @route   POST /api/products/check-variant
// @access  Private (Manager and above)
export const checkVariantExists = asyncHandler(async (req, res) => {
  const { name, materialType, company, thicknessMM, quality } = req.body;

  if (!name || !materialType) {
    return res.status(400).json({
      success: false,
      message: 'Product name and material type are required'
    });
  }

  // For Thai/Glass products, check full variant
  if (['Thai', 'Glass'].includes(materialType)) {
    if (!company || !thicknessMM || !quality) {
      return res.status(400).json({
        success: false,
        message: 'Company, thickness, and quality are required for Thai/Glass products'
      });
    }

    const existingVariant = await Product.variantExists(name, materialType, company, thicknessMM, quality);
    
    return res.status(200).json({
      success: true,
      exists: !!existingVariant,
      variant: existingVariant ? {
        _id: existingVariant._id,
        variantDisplayName: existingVariant.variantDisplayName,
        stockQuantity: existingVariant.stockQuantity,
        isActive: existingVariant.isActive
      } : null
    });
  }

  // For other products, check by name and material type
  const existingProduct = await Product.findOne({
    name,
    materialType,
    isDeleted: { $ne: true }
  });

  res.status(200).json({
    success: true,
    exists: !!existingProduct,
    product: existingProduct ? {
      _id: existingProduct._id,
      name: existingProduct.name,
      stockQuantity: existingProduct.stockQuantity,
      isActive: existingProduct.isActive
    } : null
  });
});