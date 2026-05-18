import asyncHandler from '../utils/asyncHandler.js';
import Brand from '../models/Brand.js';
import mongoose from 'mongoose';
import AuditService from '../services/auditService.js';
import SoftDeleteService from '../services/softDeleteService.js';
import { GeneralValidator } from '../utils/validation.js';
import DateService from '../services/dateService.js';

// @desc    Get all brands
// @route   GET /api/brands
// @access  Private (All authenticated users)
export const getBrands = asyncHandler(async (req, res) => {
  const {
    materialType,
    country,
    isActive,
    search,
    sortBy = 'name',
    sortOrder = 'asc',
    page = 1,
    limit = 50
  } = req.query;

  // Build query - exclude soft deleted items by default
  const query = { isDeleted: { $ne: true } };

  if (materialType) {
    if (!['Thai', 'Glass'].includes(materialType)) {
      return res.status(400).json({
        success: false,
        message: 'Material type must be either Thai or Glass'
      });
    }
    query.materialType = materialType;
  }

  if (country) {
    query.country = { $regex: country, $options: 'i' };
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { country: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } }
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const brands = await Brand.find(query)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Brand.countDocuments(query);

  // Format brands with date formatting
  const formattedBrands = brands.map(brand => ({
    ...brand.toObject(),
    formattedCreatedAt: DateService.format(brand.createdAt, 'medium'),
    formattedUpdatedAt: DateService.format(brand.updatedAt, 'medium')
  }));

  res.status(200).json({
    success: true,
    count: brands.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: formattedBrands
  });
});

// @desc    Get brands by material type
// @route   GET /api/brands/material/:materialType
// @access  Private (All authenticated users)
export const getBrandsByMaterialType = asyncHandler(async (req, res) => {
  const { materialType } = req.params;
  const { activeOnly = 'true' } = req.query;

  if (!['Thai', 'Glass'].includes(materialType)) {
    return res.status(400).json({
      success: false,
      message: 'Material type must be either Thai or Glass'
    });
  }

  const brands = await Brand.findByMaterialType(materialType, activeOnly === 'true');

  res.status(200).json({
    success: true,
    materialType,
    count: brands.length,
    data: brands.map(brand => ({
      _id: brand._id,
      name: brand.name,
      country: brand.country,
      notes: brand.notes,
      isActive: brand.isActive,
      displayName: brand.displayName,
      specification: brand.specification
    }))
  });
});

// @desc    Get single brand
// @route   GET /api/brands/:id
// @access  Private (All authenticated users)
export const getBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!brand) {
    return res.status(404).json({
      success: false,
      message: 'Brand not found',
      suggestion: 'Please check the brand ID and try again.'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      ...brand.toObject(),
      formattedCreatedAt: DateService.format(brand.createdAt, 'datetime'),
      formattedUpdatedAt: DateService.format(brand.updatedAt, 'datetime')
    }
  });
});

// @desc    Create new brand
// @route   POST /api/brands
// @access  Private (Manager and above)
export const createBrand = asyncHandler(async (req, res) => {
  const { name, materialType, country, notes } = req.body;

  // Validate required fields
  if (!name || !materialType) {
    return res.status(400).json({
      success: false,
      message: 'Brand name and material type are required'
    });
  }

  // Validate material type
  if (!['Thai', 'Glass'].includes(materialType)) {
    return res.status(400).json({
      success: false,
      message: 'Material type must be either Thai or Glass'
    });
  }

  // Validate name
  const nameValidation = GeneralValidator.validateString(name, 'Brand name', {
    minLength: 2,
    maxLength: 100
  });

  if (!nameValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Brand name validation failed',
      errors: nameValidation.errors
    });
  }

  // Check if brand already exists
  const existingBrand = await Brand.brandExists(name, materialType);
  if (existingBrand) {
    return res.status(400).json({
      success: false,
      message: 'Brand already exists',
      suggestion: `A brand named "${name}" already exists for ${materialType} material type`,
      existingBrand: {
        _id: existingBrand._id,
        name: existingBrand.name,
        isActive: existingBrand.isActive
      }
    });
  }

  // Validate country if provided
  if (country) {
    const countryValidation = GeneralValidator.validateString(country, 'Country', {
      minLength: 2,
      maxLength: 50
    });

    if (!countryValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Country validation failed',
        errors: countryValidation.errors
      });
    }
  }

  // Create brand
  const brandData = {
    name: nameValidation.sanitizedString,
    materialType,
    createdBy: req.user.id
  };

  if (country) {
    brandData.country = country.trim();
  }

  if (notes) {
    brandData.notes = notes.trim();
  }

  const brand = await Brand.create(brandData);

  // Populate the created brand
  await brand.populate('createdBy', 'name email');

  // Log audit trail
  await AuditService.logBrandCreate(brand, req.user, req);

  res.status(201).json({
    success: true,
    message: 'Brand created successfully',
    data: {
      ...brand.toObject(),
      formattedCreatedAt: DateService.format(brand.createdAt, 'datetime')
    }
  });
});

// @desc    Update brand
// @route   PUT /api/brands/:id
// @access  Private (Manager and above)
export const updateBrand = asyncHandler(async (req, res) => {
  let brand = await Brand.findById(req.params.id);

  if (!brand) {
    return res.status(404).json({
      success: false,
      message: 'Brand not found',
      suggestion: 'Please check the brand ID and try again.'
    });
  }

  if (brand.isDeleted) {
    return res.status(400).json({
      success: false,
      message: 'Cannot update deleted brand',
      suggestion: 'Restore the brand first before updating.'
    });
  }

  const { name, materialType, country, notes } = req.body;

  // Store original values for audit
  const originalBrand = { ...brand.toObject() };

  // Validate and update name if provided
  if (name && name !== brand.name) {
    const nameValidation = GeneralValidator.validateString(name, 'Brand name', {
      minLength: 2,
      maxLength: 100
    });

    if (!nameValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Brand name validation failed',
        errors: nameValidation.errors
      });
    }

    // Check if new name conflicts with existing brand
    const existingBrand = await Brand.brandExists(name, materialType || brand.materialType);
    if (existingBrand && existingBrand._id.toString() !== brand._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Brand name already exists',
        suggestion: `A brand named "${name}" already exists for ${materialType || brand.materialType} material type`
      });
    }

    brand.name = nameValidation.sanitizedString;
  }

  // Validate and update material type if provided
  if (materialType && materialType !== brand.materialType) {
    if (!['Thai', 'Glass'].includes(materialType)) {
      return res.status(400).json({
        success: false,
        message: 'Material type must be either Thai or Glass'
      });
    }

    // Check if name conflicts with new material type
    const existingBrand = await Brand.brandExists(brand.name, materialType);
    if (existingBrand && existingBrand._id.toString() !== brand._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Brand name already exists for this material type',
        suggestion: `A brand named "${brand.name}" already exists for ${materialType} material type`
      });
    }

    brand.materialType = materialType;
  }

  // Update country if provided
  if (country !== undefined) {
    if (country && country.trim()) {
      const countryValidation = GeneralValidator.validateString(country, 'Country', {
        minLength: 2,
        maxLength: 50
      });

      if (!countryValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Country validation failed',
          errors: countryValidation.errors
        });
      }

      brand.country = country.trim();
    } else {
      brand.country = undefined; // Clear country if empty string provided
    }
  }

  // Update notes if provided
  if (notes !== undefined) {
    brand.notes = notes ? notes.trim() : undefined;
  }

  brand.updatedBy = req.user.id;
  await brand.save();

  // Populate the updated brand
  await brand.populate('createdBy', 'name email');
  await brand.populate('updatedBy', 'name email');

  // Log audit trail
  await AuditService.logBrandUpdate(originalBrand, brand, req.user, req);

  res.status(200).json({
    success: true,
    message: 'Brand updated successfully',
    data: {
      ...brand.toObject(),
      formattedUpdatedAt: DateService.format(brand.updatedAt, 'datetime')
    }
  });
});

// @desc    Deactivate brand
// @route   PUT /api/brands/:id/deactivate
// @access  Private (Manager and above)
export const deactivateBrand = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    return res.status(404).json({
      success: false,
      message: 'Brand not found'
    });
  }

  if (brand.isDeleted) {
    return res.status(400).json({
      success: false,
      message: 'Cannot deactivate deleted brand'
    });
  }

  if (!brand.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Brand is already deactivated'
    });
  }

  await brand.deactivate(req.user.id, reason);

  // Log audit trail
  await AuditService.logBrandDeactivate(brand, req.user, req, reason);

  res.status(200).json({
    success: true,
    message: 'Brand deactivated successfully',
    data: brand
  });
});

// @desc    Activate brand
// @route   PUT /api/brands/:id/activate
// @access  Private (Manager and above)
export const activateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    return res.status(404).json({
      success: false,
      message: 'Brand not found'
    });
  }

  if (brand.isDeleted) {
    return res.status(400).json({
      success: false,
      message: 'Cannot activate deleted brand',
      suggestion: 'Restore the brand first before activating.'
    });
  }

  if (brand.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Brand is already active'
    });
  }

  await brand.activate(req.user.id);

  // Log audit trail
  await AuditService.logBrandActivate(brand, req.user, req);

  res.status(200).json({
    success: true,
    message: 'Brand activated successfully',
    data: brand
  });
});

// @desc    Soft delete brand
// @route   DELETE /api/brands/:id
// @access  Private (Manager and above)
export const deleteBrand = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    return res.status(404).json({
      success: false,
      message: 'Brand not found'
    });
  }

  if (brand.isDeleted) {
    return res.status(400).json({
      success: false,
      message: 'Brand is already deleted'
    });
  }

  // Check if brand is being used by any products
  const Product = mongoose.model('Product');
  const productsUsingBrand = await Product.countDocuments({
    company: brand.name,
    materialType: brand.materialType,
    isDeleted: { $ne: true }
  });

  if (productsUsingBrand > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete brand that is being used by products',
      suggestion: `This brand is used by ${productsUsingBrand} product(s). Deactivate the brand instead or remove it from all products first.`,
      productsCount: productsUsingBrand
    });
  }

  await brand.softDelete(req.user.id, reason);

  // Log audit trail
  await AuditService.logBrandDelete(brand, req.user, req, reason);

  res.status(200).json({
    success: true,
    message: 'Brand deleted successfully',
    data: brand
  });
});

// @desc    Restore soft deleted brand
// @route   PUT /api/brands/:id/restore
// @access  Private (Manager and above)
export const restoreBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    return res.status(404).json({
      success: false,
      message: 'Brand not found'
    });
  }

  if (!brand.isDeleted) {
    return res.status(400).json({
      success: false,
      message: 'Brand is not deleted'
    });
  }

  // Check if restoring would create a duplicate
  const existingBrand = await Brand.brandExists(brand.name, brand.materialType);
  if (existingBrand && existingBrand._id.toString() !== brand._id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Cannot restore brand - name already exists',
      suggestion: `A brand named "${brand.name}" already exists for ${brand.materialType} material type`
    });
  }

  await brand.restore(req.user.id);

  // Log audit trail
  await AuditService.logBrandRestore(brand, req.user, req);

  res.status(200).json({
    success: true,
    message: 'Brand restored successfully',
    data: brand
  });
});

// @desc    Get deleted brands
// @route   GET /api/brands/deleted
// @access  Private (Manager and above)
export const getDeletedBrands = asyncHandler(async (req, res) => {
  const {
    materialType,
    search,
    sortBy = 'deletedAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10
  } = req.query;

  // Build filters
  const filters = { isDeleted: true };
  if (materialType) filters.materialType = materialType;
  if (search) {
    filters.$or = [
      { name: { $regex: search, $options: 'i' } },
      { country: { $regex: search, $options: 'i' } }
    ];
  }

  const options = {
    page,
    limit,
    sortBy,
    sortOrder,
    populate: ['createdBy', 'updatedBy', 'deletedBy']
  };

  const result = await SoftDeleteService.getDeleted(Brand, filters, options);

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

// @desc    Get brand suggestions for autocomplete
// @route   GET /api/brands/suggestions
// @access  Private (All authenticated users)
export const getBrandSuggestions = asyncHandler(async (req, res) => {
  const { q, materialType, limit = 10 } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Query must be at least 2 characters long'
    });
  }

  const suggestions = await Brand.getBrandSuggestions(q, materialType, parseInt(limit));

  res.status(200).json({
    success: true,
    query: q,
    materialType: materialType || 'All',
    count: suggestions.length,
    data: suggestions
  });
});

// @desc    Check if brand name exists
// @route   POST /api/brands/check-name
// @access  Private (Manager and above)
export const checkBrandName = asyncHandler(async (req, res) => {
  const { name, materialType } = req.body;

  if (!name || !materialType) {
    return res.status(400).json({
      success: false,
      message: 'Brand name and material type are required'
    });
  }

  if (!['Thai', 'Glass'].includes(materialType)) {
    return res.status(400).json({
      success: false,
      message: 'Material type must be either Thai or Glass'
    });
  }

  const existingBrand = await Brand.brandExists(name, materialType);

  res.status(200).json({
    success: true,
    exists: !!existingBrand,
    brand: existingBrand ? {
      _id: existingBrand._id,
      name: existingBrand.name,
      materialType: existingBrand.materialType,
      country: existingBrand.country,
      isActive: existingBrand.isActive,
      displayName: existingBrand.displayName
    } : null
  });
});

// @desc    Get brand statistics
// @route   GET /api/brands/stats
// @access  Private (Manager and above)
export const getBrandStats = asyncHandler(async (req, res) => {
  const stats = await Brand.aggregate([
    {
      $match: { isDeleted: { $ne: true } }
    },
    {
      $group: {
        _id: '$materialType',
        totalBrands: { $sum: 1 },
        activeBrands: { $sum: { $cond: ['$isActive', 1, 0] } },
        inactiveBrands: { $sum: { $cond: ['$isActive', 0, 1] } },
        countries: { $addToSet: '$country' }
      }
    }
  ]);

  // Overall stats
  const overallStats = await Brand.aggregate([
    {
      $match: { isDeleted: { $ne: true } }
    },
    {
      $group: {
        _id: null,
        totalBrands: { $sum: 1 },
        activeBrands: { $sum: { $cond: ['$isActive', 1, 0] } },
        inactiveBrands: { $sum: { $cond: ['$isActive', 0, 1] } },
        uniqueCountries: { $addToSet: '$country' }
      }
    }
  ]);

  // Top countries by brand count
  const topCountries = await Brand.aggregate([
    {
      $match: { 
        isDeleted: { $ne: true },
        country: { $exists: true, $ne: null, $ne: '' }
      }
    },
    {
      $group: {
        _id: '$country',
        brandCount: { $sum: 1 },
        materialTypes: { $addToSet: '$materialType' }
      }
    },
    {
      $sort: { brandCount: -1 }
    },
    {
      $limit: 10
    }
  ]);

  const overall = overallStats[0] || {};
  overall.uniqueCountries = overall.uniqueCountries ? overall.uniqueCountries.filter(c => c).length : 0;

  res.status(200).json({
    success: true,
    data: {
      byMaterialType: stats,
      overall,
      topCountries,
      generatedAt: new Date(),
      formattedGeneratedAt: DateService.format(new Date(), 'datetime')
    }
  });
});