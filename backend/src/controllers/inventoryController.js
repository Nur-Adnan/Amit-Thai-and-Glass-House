import asyncHandler from '../utils/asyncHandler.js';
import Product from '../models/Product.js';
import MaterialSpec from '../models/MaterialSpec.js';
import Brand from '../models/Brand.js';
import AuditService from '../services/auditService.js';
import { BusinessValidator } from '../utils/validation.js';
import CurrencyService from '../services/currencyService.js';
import DateService from '../services/dateService.js';

// @desc    Get inventory form data (dropdowns and options)
// @route   GET /api/inventory/form-data
// @access  Private (All authenticated users)
export const getInventoryFormData = asyncHandler(async (req, res) => {
  try {
    // Get material specifications for dropdowns
    const materialSpecs = await MaterialSpec.getDropdownOptions();
    
    // Get brands by material type
    const glassBrands = await Brand.find({ 
      materialType: 'Glass', 
      isActive: true, 
      isDeleted: { $ne: true } 
    }).select('name country notes').sort({ name: 1 });
    
    const thaiBrands = await Brand.find({ 
      materialType: 'Thai', 
      isActive: true, 
      isDeleted: { $ne: true } 
    }).select('name country notes').sort({ name: 1 });

    // Measurement types with descriptions
    const measurementTypes = [
      { value: 'SFT', label: 'Square Feet (SFT)', description: 'For area-based materials' },
      { value: 'RFT', label: 'Running Feet (RFT)', description: 'For length-based materials' },
      { value: 'PANEL', label: 'Panel', description: 'For pre-cut panels' },
      { value: 'SHEET', label: 'Sheet', description: 'For individual sheets' },
      { value: 'PIECE', label: 'Piece', description: 'For individual pieces' }
    ];

    // Quality options with descriptions
    const qualityOptions = [
      { value: 'Local', label: 'Local', description: 'Locally manufactured' },
      { value: 'Imported', label: 'Imported', description: 'Imported quality' },
      { value: 'Premium', label: 'Premium', description: 'Premium grade with special features' }
    ];

    res.status(200).json({
      success: true,
      data: {
        materialTypes: materialSpecs.materialTypes,
        brands: {
          Glass: glassBrands,
          Thai: thaiBrands
        },
        thicknesses: materialSpecs.thicknesses,
        qualities: qualityOptions,
        measurementTypes,
        units: materialSpecs.units
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load inventory form data',
      error: error.message
    });
  }
});

// @desc    Validate inventory item before creation
// @route   POST /api/inventory/validate
// @access  Private (All authenticated users)
export const validateInventoryItem = asyncHandler(async (req, res) => {
  const { materialType, company, thicknessMM, quality, measurementType } = req.body;

  const errors = [];
  const warnings = [];
  let defaultUnit = 'SFT';
  let isValidSpec = false;

  // Validate material type
  if (!materialType || !['Glass', 'Thai'].includes(materialType)) {
    errors.push('Material type must be Glass or Thai');
  }

  // Validate company/brand
  if (!company) {
    errors.push('Company/Brand is required');
  } else {
    // Check if brand exists and is active
    const brand = await Brand.findOne({
      name: company,
      materialType,
      isActive: true,
      isDeleted: { $ne: true }
    });
    
    if (!brand) {
      warnings.push(`Brand "${company}" not found in our database. You can still proceed, but consider adding it to the brand list.`);
    }
  }

  // Validate thickness for Glass
  if (materialType === 'Glass') {
    if (!thicknessMM) {
      errors.push('Thickness is required for Glass materials');
    } else {
      const thickness = parseFloat(thicknessMM);
      if (isNaN(thickness) || thickness <= 0) {
        errors.push('Thickness must be a valid positive number');
      }
    }
  }

  // Validate quality
  if (!quality || !['Local', 'Imported', 'Premium'].includes(quality)) {
    errors.push('Quality must be Local, Imported, or Premium');
  }

  // Validate measurement type
  if (!measurementType || !['SFT', 'RFT', 'PANEL', 'SHEET', 'PIECE'].includes(measurementType)) {
    errors.push('Measurement type must be SFT, RFT, PANEL, SHEET, or PIECE');
  }

  // Check MaterialSpec validation if all required fields are present
  if (materialType && quality && (!materialType === 'Glass' || thicknessMM)) {
    try {
      const validSpec = await MaterialSpec.validateSpec(materialType, thicknessMM, quality);
      if (validSpec) {
        isValidSpec = true;
        defaultUnit = validSpec.defaultUnit;
        
        // Check if measurement type matches recommended unit
        const recommendedMeasurementType = validSpec.defaultUnit;
        if (measurementType && measurementType !== recommendedMeasurementType) {
          warnings.push(`Recommended measurement type for ${materialType} ${quality} is ${recommendedMeasurementType}, but you selected ${measurementType}`);
        }
      } else {
        warnings.push(`This ${materialType} specification (${thicknessMM ? thicknessMM + 'mm ' : ''}${quality}) is not in our standard specifications. You can still proceed.`);
      }
    } catch (error) {
      // MaterialSpec validation failed, but we can still proceed
      warnings.push('Could not validate against material specifications, but you can still proceed');
    }
  }

  // Check for existing products with same specification
  if (errors.length === 0) {
    const existingQuery = {
      materialType,
      company,
      quality,
      isDeleted: { $ne: true }
    };
    
    if (materialType === 'Glass' && thicknessMM) {
      existingQuery.thicknessMM = parseFloat(thicknessMM);
    }

    const existingProducts = await Product.find(existingQuery).select('name stockQuantity isActive');
    
    if (existingProducts.length > 0) {
      const activeProducts = existingProducts.filter(p => p.isActive);
      if (activeProducts.length > 0) {
        warnings.push(`Found ${activeProducts.length} existing active product(s) with similar specifications. Consider updating existing stock instead of creating new products.`);
      }
    }
  }

  res.status(200).json({
    success: true,
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations: {
      defaultUnit,
      isValidSpec,
      suggestedMeasurementType: defaultUnit
    }
  });
});

// @desc    Add new inventory item (create product)
// @route   POST /api/inventory/add
// @access  Private (Manager and above)
export const addInventoryItem = asyncHandler(async (req, res) => {
  // Validate the inventory item data
  const validation = await BusinessValidator.validateProduct(req.body);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Inventory item validation failed',
      errors: validation.errors,
      suggestion: 'Please check your input data and ensure all required fields are properly filled.'
    });
  }

  // Check for duplicate products
  const duplicateQuery = {
    name: validation.sanitizedData.name,
    materialType: validation.sanitizedData.materialType,
    company: validation.sanitizedData.company,
    quality: validation.sanitizedData.quality,
    isDeleted: { $ne: true }
  };

  if (validation.sanitizedData.thicknessMM) {
    duplicateQuery.thicknessMM = validation.sanitizedData.thicknessMM;
  }

  const existingProduct = await Product.findOne(duplicateQuery);
  
  if (existingProduct) {
    return res.status(409).json({
      success: false,
      message: 'Product with similar specifications already exists',
      existingProduct: {
        id: existingProduct._id,
        name: existingProduct.name,
        variantDisplayName: existingProduct.variantDisplayName,
        stockQuantity: existingProduct.stockQuantity,
        isActive: existingProduct.isActive
      },
      suggestion: 'Consider updating the existing product stock instead of creating a new one.'
    });
  }

  // Create the product
  const productData = {
    ...validation.sanitizedData,
    createdBy: req.user.id
  };

  const product = await Product.create(productData);
  await product.populate('createdBy', 'name email');

  // Log audit trail
  await AuditService.logProductCreate(product, req.user, req);

  res.status(201).json({
    success: true,
    message: 'Inventory item added successfully',
    data: {
      ...product.toObject(),
      formattedPurchasePrice: CurrencyService.formatBDT(product.purchasePrice),
      formattedSellingPrice: CurrencyService.formatBDT(product.sellingPrice),
      formattedCreatedAt: DateService.format(product.createdAt, 'datetime'),
      stockValue: CurrencyService.formatBDT(product.stockQuantity * product.purchasePrice)
    }
  });
});

// @desc    Update inventory item stock
// @route   PUT /api/inventory/:id/stock
// @access  Private (Manager and above)
export const updateInventoryStock = asyncHandler(async (req, res) => {
  const { quantity, operation, reason } = req.body;

  // Validate input
  if (!quantity || !operation) {
    return res.status(400).json({
      success: false,
      message: 'Please provide quantity and operation (add/subtract/set)'
    });
  }

  if (!['add', 'subtract', 'set'].includes(operation)) {
    return res.status(400).json({
      success: false,
      message: 'Operation must be add, subtract, or set'
    });
  }

  const quantityNum = parseFloat(quantity);
  if (quantityNum < 0 || !Number.isInteger(quantityNum)) {
    return res.status(400).json({
      success: false,
      message: 'Quantity must be a non-negative integer'
    });
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Inventory item not found'
    });
  }

  // Calculate new stock
  const previousStock = product.stockQuantity;
  let newStock;

  switch (operation) {
    case 'add':
      newStock = previousStock + quantityNum;
      break;
    case 'subtract':
      newStock = Math.max(0, previousStock - quantityNum);
      if (previousStock < quantityNum) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Current: ${previousStock}, Requested: ${quantityNum}`,
          currentStock: previousStock,
          shortage: quantityNum - previousStock
        });
      }
      break;
    case 'set':
      newStock = quantityNum;
      break;
  }

  // Store original product state for audit
  const originalProduct = { ...product.toObject() };

  // Update stock
  product.stockQuantity = newStock;
  product.updatedBy = req.user.id;
  await product.save();

  // Log audit trail
  await AuditService.logProductUpdate(
    originalProduct,
    product,
    req.user,
    req
  );

  await product.populate('createdBy', 'name email');
  await product.populate('updatedBy', 'name email');

  res.status(200).json({
    success: true,
    message: `Stock ${operation}${operation === 'set' ? '' : 'ed'} successfully`,
    data: {
      ...product.toObject(),
      formattedPurchasePrice: CurrencyService.formatBDT(product.purchasePrice),
      formattedSellingPrice: CurrencyService.formatBDT(product.sellingPrice),
      stockValue: CurrencyService.formatBDT(product.stockQuantity * product.purchasePrice)
    },
    stockChange: {
      operation,
      quantity: quantityNum,
      previousStock,
      newStock,
      reason: reason || null
    }
  });
});

// @desc    Get inventory overview with quick stock visibility
// @route   GET /api/inventory/overview
// @access  Private (All authenticated users)
export const getInventoryOverview = asyncHandler(async (req, res) => {
  const { 
    materialType, 
    company, 
    thicknessMM,
    quality, 
    lowStockOnly = 'false',
    lowStockThreshold = 10,
    sortBy = 'materialType',
    sortOrder = 'asc'
  } = req.query;

  // Build query
  const query = { 
    isDeleted: { $ne: true },
    isActive: true
  };
  
  if (materialType) query.materialType = materialType;
  if (company) query.company = { $regex: company, $options: 'i' };
  if (thicknessMM) query.thicknessMM = parseFloat(thicknessMM);
  if (quality) query.quality = quality;
  
  // Filter for low stock only if requested
  if (lowStockOnly === 'true') {
    query.stockQuantity = { $lte: parseInt(lowStockThreshold) };
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  // Add secondary sort for consistent ordering
  if (sortBy !== 'materialType') sort.materialType = 1;
  if (sortBy !== 'company') sort.company = 1;
  if (sortBy !== 'thicknessMM') sort.thicknessMM = 1;
  if (sortBy !== 'quality') sort.quality = 1;

  // Get products with stock information
  const products = await Product.find(query)
    .populate('createdBy', 'name email')
    .sort(sort);

  // Calculate statistics
  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.isActive).length,
    totalStockValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    byMaterialType: {},
    byCompany: {},
    byQuality: {},
    byThickness: {}
  };

  // Separate products into normal and low stock
  const normalStock = [];
  const lowStock = [];
  const outOfStock = [];

  products.forEach(product => {
    const stockValue = product.stockQuantity * product.purchasePrice;
    stats.totalStockValue += stockValue;

    // Create quick display format: Glass | Nasir | 5mm | Imported | 320 sqft
    const displayFormat = {
      id: product._id,
      materialType: product.materialType,
      company: product.company,
      thickness: product.thicknessMM ? `${product.thicknessMM}mm` : 'N/A',
      quality: product.quality,
      stockQuantity: product.stockQuantity,
      unit: product.unit,
      stockDisplay: `${product.stockQuantity} ${product.unit}`,
      quickView: `${product.materialType} | ${product.company} | ${product.thicknessMM ? product.thicknessMM + 'mm' : 'N/A'} | ${product.quality} | ${product.stockQuantity} ${product.unit}`,
      stockValue: CurrencyService.formatBDT(stockValue),
      rawStockValue: stockValue,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      formattedPurchasePrice: CurrencyService.formatBDT(product.purchasePrice),
      formattedSellingPrice: CurrencyService.formatBDT(product.sellingPrice),
      profitMargin: product.profitMargin,
      name: product.name,
      description: product.description,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      isLowStock: product.stockQuantity <= lowStockThreshold && product.stockQuantity > 0,
      isOutOfStock: product.stockQuantity === 0,
      urgency: product.stockQuantity === 0 ? 'critical' : 
               product.stockQuantity <= 5 ? 'high' : 
               product.stockQuantity <= lowStockThreshold ? 'medium' : 'normal'
    };

    // Categorize by stock level
    if (product.stockQuantity === 0) {
      stats.outOfStockItems++;
      outOfStock.push(displayFormat);
    } else if (product.stockQuantity <= lowStockThreshold) {
      stats.lowStockItems++;
      lowStock.push(displayFormat);
    } else {
      normalStock.push(displayFormat);
    }

    // Group statistics by material type
    if (!stats.byMaterialType[product.materialType]) {
      stats.byMaterialType[product.materialType] = {
        count: 0,
        totalStock: 0,
        totalValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0
      };
    }
    const mtStats = stats.byMaterialType[product.materialType];
    mtStats.count++;
    mtStats.totalStock += product.stockQuantity;
    mtStats.totalValue += stockValue;
    if (product.stockQuantity === 0) mtStats.outOfStockCount++;
    else if (product.stockQuantity <= lowStockThreshold) mtStats.lowStockCount++;

    // Group by company
    if (!stats.byCompany[product.company]) {
      stats.byCompany[product.company] = {
        count: 0,
        totalStock: 0,
        totalValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0
      };
    }
    const compStats = stats.byCompany[product.company];
    compStats.count++;
    compStats.totalStock += product.stockQuantity;
    compStats.totalValue += stockValue;
    if (product.stockQuantity === 0) compStats.outOfStockCount++;
    else if (product.stockQuantity <= lowStockThreshold) compStats.lowStockCount++;

    // Group by quality
    if (!stats.byQuality[product.quality]) {
      stats.byQuality[product.quality] = {
        count: 0,
        totalStock: 0,
        totalValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0
      };
    }
    const qualStats = stats.byQuality[product.quality];
    qualStats.count++;
    qualStats.totalStock += product.stockQuantity;
    qualStats.totalValue += stockValue;
    if (product.stockQuantity === 0) qualStats.outOfStockCount++;
    else if (product.stockQuantity <= lowStockThreshold) qualStats.lowStockCount++;

    // Group by thickness (for Glass)
    if (product.thicknessMM) {
      const thicknessKey = `${product.thicknessMM}mm`;
      if (!stats.byThickness[thicknessKey]) {
        stats.byThickness[thicknessKey] = {
          count: 0,
          totalStock: 0,
          totalValue: 0,
          materialType: product.materialType
        };
      }
      stats.byThickness[thicknessKey].count++;
      stats.byThickness[thicknessKey].totalStock += product.stockQuantity;
      stats.byThickness[thicknessKey].totalValue += stockValue;
    }
  });

  // Get filter options for frontend
  const filterOptions = {
    materialTypes: [...new Set(products.map(p => p.materialType))].sort(),
    companies: [...new Set(products.map(p => p.company))].sort(),
    thicknesses: [...new Set(products.filter(p => p.thicknessMM).map(p => p.thicknessMM))].sort((a, b) => a - b),
    qualities: [...new Set(products.map(p => p.quality))].sort()
  };

  res.status(200).json({
    success: true,
    filters: {
      materialType: materialType || 'all',
      company: company || 'all',
      thicknessMM: thicknessMM || 'all',
      quality: quality || 'all',
      lowStockOnly: lowStockOnly === 'true',
      lowStockThreshold: parseInt(lowStockThreshold)
    },
    data: {
      // Prioritize low stock and out of stock items
      inventory: {
        outOfStock: outOfStock.sort((a, b) => a.quickView.localeCompare(b.quickView)),
        lowStock: lowStock.sort((a, b) => a.quickView.localeCompare(b.quickView)),
        normalStock: normalStock.sort((a, b) => a.quickView.localeCompare(b.quickView))
      },
      // Combined list for general use
      allProducts: [...outOfStock, ...lowStock, ...normalStock],
      statistics: {
        ...stats,
        formattedTotalStockValue: CurrencyService.formatBDT(stats.totalStockValue)
      },
      filterOptions
    }
  });
});

// @desc    Get low stock items
// @route   GET /api/inventory/low-stock
// @access  Private (Manager and above)
export const getLowStockItems = asyncHandler(async (req, res) => {
  const { threshold = 10, materialType } = req.query;

  const query = {
    stockQuantity: { $lte: parseInt(threshold) },
    isActive: true,
    isDeleted: { $ne: true }
  };

  if (materialType) {
    query.materialType = materialType;
  }

  const products = await Product.find(query)
    .populate('createdBy', 'name email')
    .sort({ stockQuantity: 1, materialType: 1 });

  const formattedProducts = products.map(product => ({
    ...product.toObject(),
    formattedPurchasePrice: CurrencyService.formatBDT(product.purchasePrice),
    formattedSellingPrice: CurrencyService.formatBDT(product.sellingPrice),
    stockValue: CurrencyService.formatBDT(product.stockQuantity * product.purchasePrice),
    urgency: product.stockQuantity === 0 ? 'Critical' : 
             product.stockQuantity <= 5 ? 'High' : 'Medium'
  }));

  res.status(200).json({
    success: true,
    threshold: parseInt(threshold),
    count: formattedProducts.length,
    data: formattedProducts
  });
});

// @desc    Get quick stock visibility with filters
// @route   GET /api/inventory/quick-view
// @access  Private (All authenticated users)
export const getQuickStockView = asyncHandler(async (req, res) => {
  const { 
    materialType, 
    company, 
    thicknessMM,
    quality,
    lowStockThreshold = 10,
    sortBy = 'stockQuantity',
    sortOrder = 'asc'
  } = req.query;

  // Build query
  const query = { 
    isDeleted: { $ne: true },
    isActive: true
  };
  
  if (materialType) query.materialType = materialType;
  if (company) query.company = { $regex: company, $options: 'i' };
  if (thicknessMM) query.thicknessMM = parseFloat(thicknessMM);
  if (quality) query.quality = quality;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  // Add secondary sorts for consistent display
  sort.materialType = 1;
  sort.company = 1;
  sort.thicknessMM = 1;
  sort.quality = 1;

  // Get products
  const products = await Product.find(query).sort(sort);

  // Format products in the requested display format
  const formattedProducts = products.map(product => {
    const stockValue = product.stockQuantity * product.purchasePrice;
    const isLowStock = product.stockQuantity <= lowStockThreshold && product.stockQuantity > 0;
    const isOutOfStock = product.stockQuantity === 0;
    
    return {
      id: product._id,
      // Main display format: Glass | Nasir | 5mm | Imported | 320 sqft
      display: `${product.materialType} | ${product.company} | ${product.thicknessMM ? product.thicknessMM + 'mm' : 'N/A'} | ${product.quality} | ${product.stockQuantity} ${product.unit}`,
      
      // Individual components for filtering
      materialType: product.materialType,
      company: product.company,
      thickness: product.thicknessMM ? `${product.thicknessMM}mm` : null,
      thicknessMM: product.thicknessMM,
      quality: product.quality,
      stockQuantity: product.stockQuantity,
      unit: product.unit,
      
      // Additional useful info
      name: product.name,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      formattedPurchasePrice: CurrencyService.formatBDT(product.purchasePrice),
      formattedSellingPrice: CurrencyService.formatBDT(product.sellingPrice),
      stockValue: CurrencyService.formatBDT(stockValue),
      rawStockValue: stockValue,
      profitMargin: product.profitMargin,
      
      // Stock status indicators
      isLowStock,
      isOutOfStock,
      stockStatus: isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock',
      urgency: isOutOfStock ? 'critical' : 
               product.stockQuantity <= 5 ? 'high' : 
               isLowStock ? 'medium' : 'normal',
      
      // Timestamps
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };
  });

  // Separate by stock status for highlighting
  const outOfStock = formattedProducts.filter(p => p.isOutOfStock);
  const lowStock = formattedProducts.filter(p => p.isLowStock);
  const normalStock = formattedProducts.filter(p => !p.isLowStock && !p.isOutOfStock);

  // Get unique filter options from current results
  const filterOptions = {
    materialTypes: [...new Set(formattedProducts.map(p => p.materialType))].sort(),
    companies: [...new Set(formattedProducts.map(p => p.company))].sort(),
    thicknesses: [...new Set(formattedProducts.filter(p => p.thicknessMM).map(p => p.thicknessMM))].sort((a, b) => a - b),
    qualities: [...new Set(formattedProducts.map(p => p.quality))].sort()
  };

  // Calculate summary statistics
  const totalStockValue = formattedProducts.reduce((sum, p) => sum + p.rawStockValue, 0);
  const summary = {
    totalItems: formattedProducts.length,
    outOfStockCount: outOfStock.length,
    lowStockCount: lowStock.length,
    normalStockCount: normalStock.length,
    totalStockValue: CurrencyService.formatBDT(totalStockValue),
    lowStockThreshold: parseInt(lowStockThreshold)
  };

  res.status(200).json({
    success: true,
    filters: {
      materialType: materialType || null,
      company: company || null,
      thicknessMM: thicknessMM ? parseFloat(thicknessMM) : null,
      quality: quality || null,
      lowStockThreshold: parseInt(lowStockThreshold)
    },
    data: {
      // Highlighted sections for quick visibility
      outOfStock,
      lowStock,
      normalStock,
      
      // All products in one array
      allProducts: formattedProducts,
      
      // Filter options for frontend dropdowns
      filterOptions,
      
      // Summary statistics
      summary
    }
  });
});

// @desc    Search inventory items
// @route   GET /api/inventory/search
// @access  Private (All authenticated users)
export const searchInventory = asyncHandler(async (req, res) => {
  const { q, materialType, company, quality, minStock, maxStock } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Search query must be at least 2 characters long'
    });
  }

  // Build search query
  const query = {
    isDeleted: { $ne: true },
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { company: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } }
    ]
  };

  // Add filters
  if (materialType) query.materialType = materialType;
  if (company) query.company = { $regex: company, $options: 'i' };
  if (quality) query.quality = quality;
  if (minStock) query.stockQuantity = { $gte: parseInt(minStock) };
  if (maxStock) {
    query.stockQuantity = query.stockQuantity || {};
    query.stockQuantity.$lte = parseInt(maxStock);
  }

  const products = await Product.find(query)
    .populate('createdBy', 'name email')
    .sort({ name: 1 })
    .limit(50);

  const formattedProducts = products.map(product => ({
    ...product.toObject(),
    formattedPurchasePrice: CurrencyService.formatBDT(product.purchasePrice),
    formattedSellingPrice: CurrencyService.formatBDT(product.sellingPrice),
    stockValue: CurrencyService.formatBDT(product.stockQuantity * product.purchasePrice)
  }));

  res.status(200).json({
    success: true,
    query: q,
    count: formattedProducts.length,
    data: formattedProducts
  });
});