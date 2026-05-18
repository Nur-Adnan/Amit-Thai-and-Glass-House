import asyncHandler from '../utils/asyncHandler.js';
import MaterialSpec from '../models/MaterialSpec.js';
import AuditService from '../services/auditService.js';
import SoftDeleteService from '../services/softDeleteService.js';
import CurrencyService from '../services/currencyService.js';
import DateService from '../services/dateService.js';

// @desc    Get all material specifications
// @route   GET /api/material-specs
// @access  Private (All authenticated users)
export const getMaterialSpecs = asyncHandler(async (req, res) => {
  const {
    materialType,
    thicknessMM,
    quality,
    defaultUnit,
    isActive,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 50
  } = req.query;

  // Build query - exclude soft deleted items by default
  const query = { isDeleted: { $ne: true } };

  // Apply filters
  if (materialType) {
    query.materialType = materialType;
  }

  if (thicknessMM) {
    query.thicknessMM = parseFloat(thicknessMM);
  }

  if (quality) {
    query.quality = quality;
  }

  if (defaultUnit) {
    query.defaultUnit = defaultUnit;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  if (search) {
    query.$or = [
      { materialType: { $regex: search, $options: 'i' } },
      { quality: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } }
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const specs = await MaterialSpec.find(query)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await MaterialSpec.countDocuments(query);

  // Format specifications
  const formattedSpecs = specs.map(spec => ({
    ...spec.toObject(),
    formattedCreatedAt: DateService.format(spec.createdAt, 'medium'),
    formattedUpdatedAt: DateService.format(spec.updatedAt, 'medium')
  }));

  res.status(200).json({
    success: true,
    count: specs.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: formattedSpecs
  });
});

// @desc    Get single material specification
// @route   GET /api/material-specs/:id
// @access  Private (All authenticated users)
export const getMaterialSpec = asyncHandler(async (req, res) => {
  const spec = await MaterialSpec.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!spec) {
    return res.status(404).json({
      success: false,
      message: 'Material specification not found',
      suggestion: 'Please check the specification ID and try again.'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      ...spec.toObject(),
      formattedCreatedAt: DateService.format(spec.createdAt, 'datetime'),
      formattedUpdatedAt: DateService.format(spec.updatedAt, 'datetime')
    }
  });
});

// @desc    Create new material specification
// @route   POST /api/material-specs
// @access  Private (Manager and above)
export const createMaterialSpec = asyncHandler(async (req, res) => {
  const specData = {
    ...req.body,
    createdBy: req.user.id
  };

  const spec = await MaterialSpec.create(specData);

  // Populate the created specification
  await spec.populate('createdBy', 'name email');

  // Log audit trail
  await AuditService.logMaterialSpecCreate(spec, req.user, req);

  res.status(201).json({
    success: true,
    message: 'Material specification created successfully',
    data: {
      ...spec.toObject(),
      formattedCreatedAt: DateService.format(spec.createdAt, 'datetime')
    }
  });
});

// @desc    Update material specification
// @route   PUT /api/material-specs/:id
// @access  Private (Manager and above)
export const updateMaterialSpec = asyncHandler(async (req, res) => {
  let spec = await MaterialSpec.findById(req.params.id);

  if (!spec) {
    return res.status(404).json({
      success: false,
      message: 'Material specification not found',
      suggestion: 'Please check the specification ID and try again.'
    });
  }

  // Store original values for audit
  const originalSpec = { ...spec.toObject() };

  // Update with new data
  Object.assign(spec, req.body);
  spec.updatedBy = req.user.id;

  await spec.save();

  // Populate the updated specification
  await spec.populate('createdBy', 'name email');
  await spec.populate('updatedBy', 'name email');

  // Log audit trail
  await AuditService.logMaterialSpecUpdate(originalSpec, spec, req.user, req);

  res.status(200).json({
    success: true,
    message: 'Material specification updated successfully',
    data: {
      ...spec.toObject(),
      formattedUpdatedAt: DateService.format(spec.updatedAt, 'datetime')
    }
  });
});

// @desc    Soft delete material specification
// @route   DELETE /api/material-specs/:id
// @access  Private (Manager and above)
export const deleteMaterialSpec = asyncHandler(async (req, res) => {
  const spec = await MaterialSpec.findById(req.params.id);

  if (!spec) {
    return res.status(404).json({
      success: false,
      message: 'Material specification not found'
    });
  }

  if (spec.isDeleted) {
    return res.status(400).json({
      success: false,
      message: 'Material specification is already deleted'
    });
  }

  // Use soft delete method
  await spec.softDelete(req.user.id, req.body.reason);

  // Log audit trail
  await AuditService.logMaterialSpecDelete(spec, req.user, req);

  res.status(200).json({
    success: true,
    message: 'Material specification deleted successfully',
    data: spec
  });
});

// @desc    Restore soft deleted material specification
// @route   PUT /api/material-specs/:id/restore
// @access  Private (Manager and above)
export const restoreMaterialSpec = asyncHandler(async (req, res) => {
  const spec = await MaterialSpec.findById(req.params.id);

  if (!spec) {
    return res.status(404).json({
      success: false,
      message: 'Material specification not found'
    });
  }

  if (!spec.isDeleted) {
    return res.status(400).json({
      success: false,
      message: 'Material specification is not deleted'
    });
  }

  // Use restore method
  await spec.restore(req.user.id);

  // Log audit trail
  await AuditService.logMaterialSpecRestore(spec, req.user, req);

  res.status(200).json({
    success: true,
    message: 'Material specification restored successfully',
    data: spec
  });
});

// @desc    Activate material specification
// @route   PUT /api/material-specs/:id/activate
// @access  Private (Manager and above)
export const activateMaterialSpec = asyncHandler(async (req, res) => {
  const spec = await MaterialSpec.findById(req.params.id);

  if (!spec) {
    return res.status(404).json({
      success: false,
      message: 'Material specification not found'
    });
  }

  if (spec.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Material specification is already active'
    });
  }

  // Use activate method
  await spec.activate(req.user.id);

  // Log audit trail
  await AuditService.logMaterialSpecActivate(spec, req.user, req);

  res.status(200).json({
    success: true,
    message: 'Material specification activated successfully',
    data: spec
  });
});

// @desc    Deactivate material specification
// @route   PUT /api/material-specs/:id/deactivate
// @access  Private (Manager and above)
export const deactivateMaterialSpec = asyncHandler(async (req, res) => {
  const spec = await MaterialSpec.findById(req.params.id);

  if (!spec) {
    return res.status(404).json({
      success: false,
      message: 'Material specification not found'
    });
  }

  if (!spec.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Material specification is already inactive'
    });
  }

  // Use deactivate method
  await spec.deactivate(req.user.id, req.body.reason);

  // Log audit trail
  await AuditService.logMaterialSpecDeactivate(spec, req.user, req);

  res.status(200).json({
    success: true,
    message: 'Material specification deactivated successfully',
    data: spec
  });
});

// @desc    Get material specifications by material type
// @route   GET /api/material-specs/by-material/:materialType
// @access  Private (All authenticated users)
export const getSpecsByMaterialType = asyncHandler(async (req, res) => {
  const { materialType } = req.params;
  const { activeOnly = 'true' } = req.query;

  if (!['Glass', 'Thai'].includes(materialType)) {
    return res.status(400).json({
      success: false,
      message: 'Material type must be either Glass or Thai'
    });
  }

  const specs = await MaterialSpec.getByMaterialType(materialType, activeOnly === 'true');

  res.status(200).json({
    success: true,
    materialType,
    count: specs.length,
    data: specs
  });
});

// @desc    Get thickness options for a material type
// @route   GET /api/material-specs/thickness-options/:materialType
// @access  Private (All authenticated users)
export const getThicknessOptions = asyncHandler(async (req, res) => {
  const { materialType } = req.params;
  const { activeOnly = 'true' } = req.query;

  if (!['Glass', 'Thai'].includes(materialType)) {
    return res.status(400).json({
      success: false,
      message: 'Material type must be either Glass or Thai'
    });
  }

  const thicknesses = await MaterialSpec.getThicknessOptions(materialType, activeOnly === 'true');

  res.status(200).json({
    success: true,
    materialType,
    count: thicknesses.length,
    data: thicknesses
  });
});

// @desc    Get quality options for a material type
// @route   GET /api/material-specs/quality-options/:materialType
// @access  Private (All authenticated users)
export const getQualityOptions = asyncHandler(async (req, res) => {
  const { materialType } = req.params;
  const { activeOnly = 'true' } = req.query;

  if (!['Glass', 'Thai'].includes(materialType)) {
    return res.status(400).json({
      success: false,
      message: 'Material type must be either Glass or Thai'
    });
  }

  const qualities = await MaterialSpec.getQualityOptions(materialType, activeOnly === 'true');

  res.status(200).json({
    success: true,
    materialType,
    count: qualities.length,
    data: qualities
  });
});

// @desc    Get dropdown options for frontend
// @route   GET /api/material-specs/dropdown-options
// @access  Private (All authenticated users)
export const getDropdownOptions = asyncHandler(async (req, res) => {
  const { materialType } = req.query;

  const options = await MaterialSpec.getDropdownOptions(materialType);

  res.status(200).json({
    success: true,
    data: options
  });
});

// @desc    Validate material specification
// @route   POST /api/material-specs/validate
// @access  Private (All authenticated users)
export const validateSpec = asyncHandler(async (req, res) => {
  const { materialType, thicknessMM, quality } = req.body;

  if (!materialType || !quality) {
    return res.status(400).json({
      success: false,
      message: 'Material type and quality are required'
    });
  }

  const spec = await MaterialSpec.validateSpec(materialType, thicknessMM, quality);

  res.status(200).json({
    success: true,
    isValid: !!spec,
    specification: spec ? spec.specification : null,
    defaultUnit: spec ? spec.defaultUnit : null
  });
});

// @desc    Get default unit for specification
// @route   POST /api/material-specs/default-unit
// @access  Private (All authenticated users)
export const getDefaultUnit = asyncHandler(async (req, res) => {
  const { materialType, thicknessMM, quality } = req.body;

  if (!materialType) {
    return res.status(400).json({
      success: false,
      message: 'Material type is required'
    });
  }

  const defaultUnit = await MaterialSpec.getDefaultUnit(materialType, thicknessMM, quality);

  res.status(200).json({
    success: true,
    defaultUnit
  });
});

// @desc    Get material specification statistics
// @route   GET /api/material-specs/stats
// @access  Private (Manager and above)
export const getMaterialSpecStats = asyncHandler(async (req, res) => {
  const stats = await MaterialSpec.aggregate([
    {
      $match: { isDeleted: { $ne: true } }
    },
    {
      $group: {
        _id: '$materialType',
        totalSpecs: { $sum: 1 },
        activeSpecs: { $sum: { $cond: ['$isActive', 1, 0] } },
        qualities: { $addToSet: '$quality' },
        thicknesses: { $addToSet: '$thicknessMM' },
        units: { $addToSet: '$defaultUnit' }
      }
    },
    {
      $project: {
        materialType: '$_id',
        totalSpecs: 1,
        activeSpecs: 1,
        qualityCount: { $size: '$qualities' },
        thicknessCount: { $size: { $filter: { input: '$thicknesses', cond: { $ne: ['$$this', null] } } } },
        unitCount: { $size: '$units' },
        qualities: 1,
        thicknesses: { $filter: { input: '$thicknesses', cond: { $ne: ['$$this', null] } } },
        units: 1
      }
    }
  ]);

  // Overall stats
  const overallStats = await MaterialSpec.aggregate([
    {
      $match: { isDeleted: { $ne: true } }
    },
    {
      $group: {
        _id: null,
        totalSpecs: { $sum: 1 },
        activeSpecs: { $sum: { $cond: ['$isActive', 1, 0] } },
        materialTypes: { $addToSet: '$materialType' },
        allQualities: { $addToSet: '$quality' },
        allUnits: { $addToSet: '$defaultUnit' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      byMaterialType: stats,
      overall: overallStats[0] || {}
    }
  });
});