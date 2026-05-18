import asyncHandler from '../utils/asyncHandler.js';
import CalculatorConfig from '../models/CalculatorConfig.js';
import GlassPricing from '../models/GlassPricing.js';
import Product from '../models/Product.js';
import { MoneyValidator, GeneralValidator } from '../utils/validation.js';
import CurrencyService from '../services/currencyService.js';
import DateService from '../services/dateService.js';

// Helper function to convert feet and inches to total feet
const convertToTotalFeet = (feet, inches = 0) => {
  return parseFloat(feet) + (parseFloat(inches) / 12);
};

// Helper function to format feet and inches display
const formatFeetInches = (totalFeet) => {
  const feet = Math.floor(totalFeet);
  const inches = Math.round((totalFeet - feet) * 12);
  return `${feet}ft ${inches}in`;
};

// Helper function to calculate based on measurement type with glass pricing support
const calculateByMeasurementType = (measurementType, dimensions, pricing, glassSpec = null) => {
  let quantity = 0;
  let unitPrice = 0;
  let formula = '';
  let calculation = '';
  let unit = '';
  let glassSpecification = null;

  switch (measurementType) {
    case 'SFT': // Square Foot - length × width
      if (!dimensions.length || !dimensions.width) {
        throw new Error('Length and width are required for SFT measurement');
      }
      quantity = dimensions.length * dimensions.width; // area in sq ft
      
      // Use glass pricing if available, otherwise use config pricing
      if (glassSpec && glassSpec.pricePerSqFt) {
        unitPrice = glassSpec.pricePerSqFt;
        glassSpecification = {
          thickness: glassSpec.thickness,
          quality: glassSpec.quality,
          displayName: glassSpec.displayName,
          formattedPrice: glassSpec.formattedPrice
        };
      } else {
        unitPrice = pricing.SFT.pricePerSqFt;
      }
      
      unit = 'sqft';
      formula = 'Area = Length × Width';
      calculation = `${dimensions.length.toFixed(2)} × ${dimensions.width.toFixed(2)} = ${quantity.toFixed(4)} sq ft`;
      break;

    case 'RFT': // Running Foot - length only
      if (!dimensions.runningLength) {
        throw new Error('Running length is required for RFT measurement');
      }
      quantity = dimensions.runningLength;
      unitPrice = pricing.RFT.pricePerRunningFt;
      unit = 'rft';
      formula = 'Running Length';
      calculation = `${dimensions.runningLength.toFixed(2)} running ft`;
      break;

    case 'PANEL': // Panel - fixed size units
      if (!dimensions.panelCount) {
        throw new Error('Panel count is required for PANEL measurement');
      }
      quantity = dimensions.panelCount;
      unitPrice = pricing.PANEL.pricePerPanel;
      unit = 'panel';
      formula = 'Panel Count';
      calculation = `${dimensions.panelCount} panels`;
      if (pricing.PANEL.standardSize) {
        calculation += ` (${pricing.PANEL.standardSize.length}ft × ${pricing.PANEL.standardSize.width}ft each)`;
      }
      break;

    case 'SHEET': // Sheet - fixed size units
      if (!dimensions.sheetCount) {
        throw new Error('Sheet count is required for SHEET measurement');
      }
      quantity = dimensions.sheetCount;
      unitPrice = pricing.SHEET.pricePerSheet;
      unit = 'sheet';
      formula = 'Sheet Count';
      calculation = `${dimensions.sheetCount} sheets`;
      if (pricing.SHEET.standardSize) {
        calculation += ` (${pricing.SHEET.standardSize.length}ft × ${pricing.SHEET.standardSize.width}ft each)`;
      }
      break;

    case 'CUSTOM': // Custom pricing
      if (!dimensions.customQuantity || !dimensions.customUnitPrice) {
        throw new Error('Custom quantity and unit price are required for CUSTOM measurement');
      }
      quantity = dimensions.customQuantity;
      unitPrice = dimensions.customUnitPrice;
      unit = dimensions.customUnit || 'unit';
      formula = 'Custom Calculation';
      calculation = `${quantity} ${unit} × ${CurrencyService.formatBDT(unitPrice)}`;
      break;

    default:
      throw new Error(`Unsupported measurement type: ${measurementType}`);
  }

  const totalPrice = quantity * unitPrice;
  const priceCalculation = `${quantity.toFixed(4)} × ${CurrencyService.formatBDT(unitPrice)} = ${CurrencyService.formatBDT(totalPrice)}`;

  return {
    quantity: Math.round(quantity * 10000) / 10000, // Round to 4 decimal places
    unitPrice: Math.round(unitPrice * 100) / 100, // Round to 2 decimal places
    totalPrice: Math.round(totalPrice * 100) / 100, // Round to 2 decimal places
    unit,
    glassSpecification, // Include glass specification if available
    breakdown: {
      formula,
      calculation,
      priceCalculation
    }
  };
};

// @desc    Get all calculator configurations with measurement type support
// @route   GET /api/calculator/config
// @access  Private (All authenticated users)
export const getConfigs = asyncHandler(async (req, res) => {
  const configs = await CalculatorConfig.find({ isActive: true })
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ materialType: 1 });

  // Format configs with measurement type information
  const formattedConfigs = configs.map(config => ({
    ...config.toObject(),
    activeMeasurementTypes: config.getActiveMeasurementTypes(),
    formattedPricing: config.formattedPricing,
    formattedCreatedAt: DateService.format(config.createdAt, 'medium'),
    formattedUpdatedAt: DateService.format(config.updatedAt, 'medium')
  }));

  res.status(200).json({
    success: true,
    count: configs.length,
    data: formattedConfigs
  });
});

// @desc    Get single calculator configuration
// @route   GET /api/calculator/config/:materialType
// @access  Private (All authenticated users)
export const getConfig = asyncHandler(async (req, res) => {
  const { materialType } = req.params;

  if (!['Thai', 'Glass'].includes(materialType)) {
    return res.status(400).json({
      success: false,
      message: 'Material type must be either Thai or Glass',
      suggestion: 'Please select either Thai or Glass as material type'
    });
  }

  const config = await CalculatorConfig.findOne({ 
    materialType, 
    isActive: true 
  })
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!config) {
    return res.status(404).json({
      success: false,
      message: `Configuration not found for ${materialType}`,
      suggestion: 'Please set up the calculator configuration first'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      ...config.toObject(),
      activeMeasurementTypes: config.getActiveMeasurementTypes(),
      formattedPricing: config.formattedPricing,
      formattedCreatedAt: DateService.format(config.createdAt, 'datetime'),
      formattedUpdatedAt: DateService.format(config.updatedAt, 'datetime')
    }
  });
});

// @desc    Create or update calculator configuration with measurement type support
// @route   POST /api/calculator/config
// @access  Private (Manager and above)
export const saveConfig = asyncHandler(async (req, res) => {
  const { 
    materialType, 
    pricing,
    defaultMeasurementType = 'SFT',
    // Legacy support
    pricePerSqFt 
  } = req.body;

  if (!materialType) {
    return res.status(400).json({
      success: false,
      message: 'Please provide materialType',
      suggestion: 'Material type is required (Thai or Glass)'
    });
  }

  if (!['Thai', 'Glass'].includes(materialType)) {
    return res.status(400).json({
      success: false,
      message: 'Material type must be either Thai or Glass',
      suggestion: 'Please select either Thai or Glass as material type'
    });
  }

  // Validate pricing structure
  if (!pricing && !pricePerSqFt) {
    return res.status(400).json({
      success: false,
      message: 'Please provide pricing configuration',
      suggestion: 'Either pricing object or legacy pricePerSqFt is required'
    });
  }

  // Check if configuration already exists
  let config = await CalculatorConfig.findOne({ materialType });

  const configData = {
    materialType,
    defaultMeasurementType,
    updatedBy: req.user.id
  };

  // Handle pricing - support both new structure and legacy
  if (pricing) {
    configData.pricing = pricing;
  } else if (pricePerSqFt) {
    // Legacy support - convert to new structure
    configData.pricing = {
      SFT: {
        pricePerSqFt: parseFloat(pricePerSqFt),
        isActive: true
      },
      RFT: { isActive: false },
      PANEL: { isActive: false },
      SHEET: { isActive: false },
      CUSTOM: { isActive: true }
    };
    configData.pricePerSqFt = parseFloat(pricePerSqFt); // For backward compatibility
  }

  if (config) {
    // Update existing configuration
    Object.assign(config, configData);
    await config.save();

    await config.populate('createdBy', 'name email');
    await config.populate('updatedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Configuration updated successfully',
      data: {
        ...config.toObject(),
        activeMeasurementTypes: config.getActiveMeasurementTypes(),
        formattedPricing: config.formattedPricing,
        formattedUpdatedAt: DateService.format(config.updatedAt, 'datetime')
      }
    });
  } else {
    // Create new configuration
    configData.createdBy = req.user.id;
    config = await CalculatorConfig.create(configData);

    await config.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Configuration created successfully',
      data: {
        ...config.toObject(),
        activeMeasurementTypes: config.getActiveMeasurementTypes(),
        formattedPricing: config.formattedPricing,
        formattedCreatedAt: DateService.format(config.createdAt, 'datetime')
      }
    });
  }
});

// @desc    Calculate measurement and price with support for different measurement types and glass pricing
// @route   POST /api/calculator/calculate
// @access  Private (All authenticated users)
export const calculateMeasurement = asyncHandler(async (req, res) => {
  const {
    materialType,
    measurementType = 'SFT', // Default to SFT for backward compatibility
    // Glass pricing selection
    glassThickness,
    glassQuality,
    // SFT dimensions
    length,
    width,
    lengthFeet = 0,
    lengthInches = 0,
    widthFeet = 0,
    widthInches = 0,
    // RFT dimensions
    runningLength,
    runningLengthFeet = 0,
    runningLengthInches = 0,
    // PANEL/SHEET dimensions
    panelCount,
    sheetCount,
    // CUSTOM dimensions
    customQuantity,
    customUnitPrice,
    customUnit,
    // Legacy support
    customPricePerSqFt
  } = req.body;

  // Validate required fields
  if (!materialType) {
    return res.status(400).json({
      success: false,
      message: 'Please specify material type',
      suggestion: 'Material type is required (Thai or Glass)'
    });
  }

  if (!['Thai', 'Glass'].includes(materialType)) {
    return res.status(400).json({
      success: false,
      message: 'Material type must be either Thai or Glass',
      suggestion: 'Please select either Thai or Glass as material type'
    });
  }

  if (!['SFT', 'RFT', 'PANEL', 'SHEET', 'CUSTOM'].includes(measurementType)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid measurement type',
      suggestion: 'Measurement type must be SFT, RFT, PANEL, SHEET, or CUSTOM'
    });
  }

  // Get configuration for the material type
  const config = await CalculatorConfig.findOne({ 
    materialType, 
    isActive: true 
  });

  if (!config) {
    return res.status(404).json({
      success: false,
      message: `Configuration not found for ${materialType}`,
      suggestion: 'Please set up the calculator configuration first'
    });
  }

  // Check if measurement type is supported
  const activeMeasurementTypes = config.getActiveMeasurementTypes();
  if (!activeMeasurementTypes.includes(measurementType)) {
    return res.status(400).json({
      success: false,
      message: `Measurement type ${measurementType} is not active for ${materialType}`,
      suggestion: `Available measurement types: ${activeMeasurementTypes.join(', ')}`
    });
  }

  // Get glass pricing if specified (for Glass material type)
  let glassSpec = null;
  if (materialType === 'Glass' && glassThickness && glassQuality) {
    // Validate glass specifications
    if (!['3mm', '4mm', '5mm', '6mm'].includes(glassThickness)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid glass thickness',
        suggestion: 'Glass thickness must be 3mm, 4mm, 5mm, or 6mm'
      });
    }

    if (!['Local', 'Imported'].includes(glassQuality)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid glass quality',
        suggestion: 'Glass quality must be Local or Imported'
      });
    }

    // Get current glass pricing
    const glassPricing = await GlassPricing.getCurrentPrice(materialType, glassThickness, glassQuality);
    
    if (!glassPricing) {
      return res.status(404).json({
        success: false,
        message: `Glass pricing not found for ${glassThickness} ${glassQuality} glass`,
        suggestion: 'Please set up glass pricing configuration first'
      });
    }

    glassSpec = {
      thickness: glassPricing.thickness,
      quality: glassPricing.quality,
      pricePerSqFt: glassPricing.pricePerSqFt,
      displayName: glassPricing.displayName,
      formattedPrice: glassPricing.formattedPrice,
      effectiveDate: glassPricing.effectiveDate
    };
  }

  let dimensions = {};
  let measurementInput = {};

  try {
    // Process dimensions based on measurement type
    switch (measurementType) {
      case 'SFT':
        // Handle SFT dimensions - support both decimal and feet/inches input
        if (length !== undefined && width !== undefined) {
          // Direct decimal input
          dimensions.length = parseFloat(length);
          dimensions.width = parseFloat(width);
        } else if (lengthFeet !== undefined && widthFeet !== undefined) {
          // Feet and inches input
          dimensions.length = convertToTotalFeet(lengthFeet, lengthInches);
          dimensions.width = convertToTotalFeet(widthFeet, widthInches);
          
          // Store input format for display
          measurementInput = {
            lengthFeet: parseFloat(lengthFeet),
            lengthInches: parseFloat(lengthInches || 0),
            widthFeet: parseFloat(widthFeet),
            widthInches: parseFloat(widthInches || 0),
            lengthDisplay: formatFeetInches(dimensions.length),
            widthDisplay: formatFeetInches(dimensions.width)
          };
        } else {
          throw new Error('Please provide either length/width or lengthFeet/widthFeet for SFT measurement');
        }

        // Validate dimensions
        if (dimensions.length <= 0 || dimensions.width <= 0) {
          throw new Error('Length and width must be greater than 0');
        }
        break;

      case 'RFT':
        // Handle RFT dimensions
        if (runningLength !== undefined) {
          dimensions.runningLength = parseFloat(runningLength);
        } else if (runningLengthFeet !== undefined) {
          dimensions.runningLength = convertToTotalFeet(runningLengthFeet, runningLengthInches);
          
          measurementInput = {
            runningLengthFeet: parseFloat(runningLengthFeet),
            runningLengthInches: parseFloat(runningLengthInches || 0),
            runningLengthDisplay: formatFeetInches(dimensions.runningLength)
          };
        } else {
          throw new Error('Please provide runningLength or runningLengthFeet for RFT measurement');
        }

        if (dimensions.runningLength <= 0) {
          throw new Error('Running length must be greater than 0');
        }
        break;

      case 'PANEL':
        if (!panelCount) {
          throw new Error('Panel count is required for PANEL measurement');
        }
        dimensions.panelCount = parseInt(panelCount);
        if (dimensions.panelCount <= 0) {
          throw new Error('Panel count must be greater than 0');
        }
        break;

      case 'SHEET':
        if (!sheetCount) {
          throw new Error('Sheet count is required for SHEET measurement');
        }
        dimensions.sheetCount = parseInt(sheetCount);
        if (dimensions.sheetCount <= 0) {
          throw new Error('Sheet count must be greater than 0');
        }
        break;

      case 'CUSTOM':
        if (!customQuantity || !customUnitPrice) {
          throw new Error('Custom quantity and unit price are required for CUSTOM measurement');
        }
        
        const quantityValidation = MoneyValidator.validateAmount(customQuantity, 'Custom quantity', {
          allowZero: false,
          maxAmount: 10000
        });
        
        const priceValidation = MoneyValidator.validateAmount(customUnitPrice, 'Custom unit price', {
          allowZero: false,
          maxAmount: 100000
        });
        
        if (!quantityValidation.isValid) {
          throw new Error(`Invalid custom quantity: ${quantityValidation.errors.join(', ')}`);
        }
        
        if (!priceValidation.isValid) {
          throw new Error(`Invalid custom unit price: ${priceValidation.errors.join(', ')}`);
        }
        
        dimensions.customQuantity = quantityValidation.sanitizedAmount;
        dimensions.customUnitPrice = priceValidation.sanitizedAmount;
        dimensions.customUnit = customUnit || 'unit';
        break;
    }

    // Handle legacy custom pricing for SFT
    if (measurementType === 'SFT' && customPricePerSqFt !== undefined) {
      const customPriceValidation = MoneyValidator.validateAmount(customPricePerSqFt, 'Custom price per sq ft', {
        allowZero: false,
        maxAmount: 100000
      });
      
      if (!customPriceValidation.isValid) {
        throw new Error(`Invalid custom price: ${customPriceValidation.errors.join(', ')}`);
      }
      
      // Override the SFT pricing temporarily
      config.pricing.SFT.pricePerSqFt = customPriceValidation.sanitizedAmount;
    }

    // Calculate based on measurement type with glass pricing support
    const calculationResult = calculateByMeasurementType(measurementType, dimensions, config.pricing, glassSpec);

    // Prepare comprehensive response
    const response = {
      input: {
        materialType,
        measurementType,
        dimensions: dimensions,
        ...(Object.keys(measurementInput).length > 0 && { measurementInput }),
        ...(glassSpec && { glassSpecification: glassSpec }),
        customPrice: customPricePerSqFt !== undefined || measurementType === 'CUSTOM'
      },
      calculation: {
        quantity: calculationResult.quantity,
        unit: calculationResult.unit,
        unitPrice: calculationResult.unitPrice,
        totalPrice: calculationResult.totalPrice,
        formattedUnitPrice: CurrencyService.formatBDT(calculationResult.unitPrice),
        formattedTotalPrice: CurrencyService.formatBDT(calculationResult.totalPrice),
        ...(calculationResult.glassSpecification && { glassSpecification: calculationResult.glassSpecification })
      },
      breakdown: calculationResult.breakdown,
      // Additional info for invoice integration
      invoiceItemData: {
        isCalculatorItem: true,
        measurementType,
        dimensions: {
          ...dimensions,
          ...(measurementType === 'SFT' && {
            area: calculationResult.quantity
          })
        },
        measurementInput,
        calculationBreakdown: calculationResult.breakdown,
        ...(calculationResult.glassSpecification && { glassSpecification: calculationResult.glassSpecification }),
        quantity: calculationResult.quantity,
        unit: calculationResult.unit,
        unitPrice: calculationResult.unitPrice,
        totalPrice: calculationResult.totalPrice
      }
    };

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      suggestion: 'Please check your input values and try again'
    });
  }
});

// @desc    Get supported measurement types for a material
// @route   GET /api/calculator/measurement-types/:materialType
// @access  Private (All authenticated users)
export const getMeasurementTypes = asyncHandler(async (req, res) => {
  const { materialType } = req.params;

  if (!['Thai', 'Glass'].includes(materialType)) {
    return res.status(400).json({
      success: false,
      message: 'Material type must be either Thai or Glass',
      suggestion: 'Please select either Thai or Glass as material type'
    });
  }

  const config = await CalculatorConfig.findOne({ 
    materialType, 
    isActive: true 
  });

  if (!config) {
    return res.status(404).json({
      success: false,
      message: `Configuration not found for ${materialType}`,
      suggestion: 'Please set up the calculator configuration first'
    });
  }

  const measurementTypes = [
    {
      type: 'SFT',
      name: 'Square Foot',
      description: 'Length × Width calculation',
      isActive: config.pricing.SFT.isActive,
      price: config.pricing.SFT.pricePerSqFt,
      formattedPrice: config.pricing.SFT.pricePerSqFt ? CurrencyService.formatBDT(config.pricing.SFT.pricePerSqFt) : null,
      unit: 'per sq ft',
      inputFields: ['length', 'width']
    },
    {
      type: 'RFT',
      name: 'Running Foot',
      description: 'Length only calculation',
      isActive: config.pricing.RFT.isActive,
      price: config.pricing.RFT.pricePerRunningFt,
      formattedPrice: config.pricing.RFT.pricePerRunningFt ? CurrencyService.formatBDT(config.pricing.RFT.pricePerRunningFt) : null,
      unit: 'per running ft',
      inputFields: ['runningLength']
    },
    {
      type: 'PANEL',
      name: 'Panel',
      description: 'Fixed size panel units',
      isActive: config.pricing.PANEL.isActive,
      price: config.pricing.PANEL.pricePerPanel,
      formattedPrice: config.pricing.PANEL.pricePerPanel ? CurrencyService.formatBDT(config.pricing.PANEL.pricePerPanel) : null,
      unit: 'per panel',
      standardSize: config.pricing.PANEL.standardSize,
      inputFields: ['panelCount']
    },
    {
      type: 'SHEET',
      name: 'Sheet',
      description: 'Fixed size sheet units',
      isActive: config.pricing.SHEET.isActive,
      price: config.pricing.SHEET.pricePerSheet,
      formattedPrice: config.pricing.SHEET.pricePerSheet ? CurrencyService.formatBDT(config.pricing.SHEET.pricePerSheet) : null,
      unit: 'per sheet',
      standardSize: config.pricing.SHEET.standardSize,
      inputFields: ['sheetCount']
    },
    {
      type: 'CUSTOM',
      name: 'Custom',
      description: 'Custom quantity and pricing',
      isActive: config.pricing.CUSTOM.isActive,
      price: null,
      formattedPrice: 'Variable',
      unit: 'custom',
      inputFields: ['customQuantity', 'customUnitPrice', 'customUnit']
    }
  ];

  const activeTypes = measurementTypes.filter(type => type.isActive);

  res.status(200).json({
    success: true,
    data: {
      materialType,
      defaultMeasurementType: config.defaultMeasurementType,
      allMeasurementTypes: measurementTypes,
      activeMeasurementTypes: activeTypes,
      count: activeTypes.length
    }
  });
});

// @desc    Get calculation history (if we want to store calculations)
// @route   GET /api/calculator/history
// @access  Private (All authenticated users)
export const getCalculationHistory = asyncHandler(async (req, res) => {
  // This could be implemented if we want to store calculation history
  // For now, return empty array
  res.status(200).json({
    success: true,
    message: 'Calculation history feature not implemented yet',
    data: []
  });
});

// @desc    Get all glass pricing options (all materials or specific material type)
// @route   GET /api/calculator/glass-pricing
// @route   GET /api/calculator/glass-pricing/:materialType
// @access  Private (All authenticated users)
export const getGlassPricing = asyncHandler(async (req, res) => {
  const { materialType } = req.params;

  // If materialType is provided, validate it
  if (materialType && !['Thai', 'Glass'].includes(materialType)) {
    return res.status(400).json({
      success: false,
      message: 'Material type must be either Thai or Glass',
      suggestion: 'Please select either Thai or Glass as material type'
    });
  }

  // Get glass prices - all materials if no materialType specified
  const glassPrices = materialType 
    ? await GlassPricing.getCurrentPrices(materialType)
    : await GlassPricing.find({ isActive: true }).sort({ thickness: 1, quality: 1 });

  if (!materialType) {
    // Return simple array for all glass pricing (used by calculator)
    const simplePrices = glassPrices.map(price => ({
      _id: price._id,
      thickness: price.thickness,
      quality: price.quality,
      pricePerSqFt: price.pricePerSqFt,
      materialType: price.materialType,
      displayName: `${price.thickness} - ${price.quality}`,
      formattedPrice: CurrencyService.formatBDT(price.pricePerSqFt)
    }));

    return res.status(200).json({
      success: true,
      data: simplePrices,
      count: simplePrices.length
    });
  }

  // Group by thickness for better organization (when materialType is specified)
  const groupedPrices = {};
  glassPrices.forEach(price => {
    if (!groupedPrices[price.thickness]) {
      groupedPrices[price.thickness] = {};
    }
    groupedPrices[price.thickness][price.quality] = {
      id: price._id,
      pricePerSqFt: price.pricePerSqFt,
      formattedPrice: price.formattedPrice,
      effectiveDate: price.effectiveDate,
      formattedEffectiveDate: price.formattedEffectiveDate,
      displayName: price.displayName,
      specification: price.specification
    };
  });

  res.status(200).json({
    success: true,
    data: {
      materialType,
      groupedPrices,
      allPrices: glassPrices.map(price => price.specification),
      count: glassPrices.length
    }
  });
});

// @desc    Update glass pricing
// @route   PUT /api/calculator/glass-pricing
// @access  Private (Manager and above)
export const updateGlassPricing = asyncHandler(async (req, res) => {
  const {
    materialType,
    thickness,
    quality,
    pricePerSqFt,
    priceChangeReason
  } = req.body;

  // Validate required fields
  if (!materialType || !thickness || !quality || !pricePerSqFt) {
    return res.status(400).json({
      success: false,
      message: 'Please provide materialType, thickness, quality, and pricePerSqFt',
      suggestion: 'All fields are required for glass pricing update'
    });
  }

  // Validate material type
  if (!['Thai', 'Glass'].includes(materialType)) {
    return res.status(400).json({
      success: false,
      message: 'Material type must be either Thai or Glass',
      suggestion: 'Please select either Thai or Glass as material type'
    });
  }

  // Validate thickness
  if (!['3mm', '4mm', '5mm', '6mm'].includes(thickness)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid glass thickness',
      suggestion: 'Glass thickness must be 3mm, 4mm, 5mm, or 6mm'
    });
  }

  // Validate quality
  if (!['Local', 'Imported'].includes(quality)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid glass quality',
      suggestion: 'Glass quality must be Local or Imported'
    });
  }

  // Validate price
  const priceValidation = MoneyValidator.validateAmount(pricePerSqFt, 'Price per square foot', {
    allowZero: false,
    minAmount: 1,
    maxAmount: 10000,
    maxDecimals: 2
  });

  if (!priceValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: `Invalid price: ${priceValidation.errors.join(', ')}`,
      suggestion: 'Please provide a valid price between ৳1 and ৳10,000'
    });
  }

  try {
    // Get current pricing
    const currentPricing = await GlassPricing.getCurrentPrice(materialType, thickness, quality);

    if (!currentPricing) {
      // Create new pricing
      const newPricing = await GlassPricing.create({
        materialType,
        thickness,
        quality,
        pricePerSqFt: priceValidation.sanitizedAmount,
        priceChangeReason: priceChangeReason || 'Initial pricing setup',
        createdBy: req.user.id,
        isActive: true
      });

      await newPricing.populate('createdBy', 'name email');

      res.status(201).json({
        success: true,
        message: 'Glass pricing created successfully',
        data: {
          ...newPricing.toObject(),
          specification: newPricing.specification
        }
      });
    } else {
      // Update existing pricing
      const updatedPricing = await currentPricing.createPriceChange(
        priceValidation.sanitizedAmount,
        priceChangeReason || 'Price update',
        req.user.id
      );

      await updatedPricing.populate('createdBy', 'name email');

      res.status(200).json({
        success: true,
        message: 'Glass pricing updated successfully',
        data: {
          ...updatedPricing.toObject(),
          specification: updatedPricing.specification,
          priceChange: {
            previousPrice: updatedPricing.previousPrice,
            formattedPreviousPrice: updatedPricing.formattedPreviousPrice,
            priceChangePercentage: updatedPricing.priceChangePercentage,
            priceChangeDirection: updatedPricing.priceChangeDirection
          }
        }
      });
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Active pricing already exists for this glass specification',
        suggestion: 'Please update the existing pricing instead of creating a new one'
      });
    }
    throw error;
  }
});

// @desc    Get glass pricing history
// @route   GET /api/calculator/glass-pricing/:materialType/:thickness/:quality/history
// @access  Private (Manager and above)
export const getGlassPricingHistory = asyncHandler(async (req, res) => {
  const { materialType, thickness, quality } = req.params;
  const { limit = 10 } = req.query;

  // Validate parameters
  if (!['Thai', 'Glass'].includes(materialType)) {
    return res.status(400).json({
      success: false,
      message: 'Material type must be either Thai or Glass'
    });
  }

  if (!['3mm', '4mm', '5mm', '6mm'].includes(thickness)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid glass thickness'
    });
  }

  if (!['Local', 'Imported'].includes(quality)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid glass quality'
    });
  }

  const history = await GlassPricing.getPriceHistory(materialType, thickness, quality, parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      materialType,
      thickness,
      quality,
      displayName: `${materialType} ${thickness} ${quality}`,
      history: history.map(price => ({
        id: price._id,
        pricePerSqFt: price.pricePerSqFt,
        formattedPrice: price.formattedPrice,
        previousPrice: price.previousPrice,
        formattedPreviousPrice: price.formattedPreviousPrice,
        priceChangePercentage: price.priceChangePercentage,
        priceChangeDirection: price.priceChangeDirection,
        priceChangeReason: price.priceChangeReason,
        effectiveDate: price.effectiveDate,
        formattedEffectiveDate: price.formattedEffectiveDate,
        isActive: price.isActive,
        createdBy: price.createdBy
      })),
      count: history.length
    }
  });
});

// @desc    Delete calculator configuration
// @route   DELETE /api/calculator/config/:materialType
// @access  Private (Manager and above)
export const deleteConfig = asyncHandler(async (req, res) => {
  const { materialType } = req.params;

  const config = await CalculatorConfig.findOne({ materialType });

  if (!config) {
    return res.status(404).json({
      success: false,
      message: `Configuration not found for ${materialType}`,
      suggestion: 'Please check the material type and try again'
    });
  }

  // Soft delete by setting isActive to false
  config.isActive = false;
  config.updatedBy = req.user.id;
  await config.save();

  res.status(200).json({
    success: true,
    message: 'Configuration deleted successfully'
  });
});

// @desc    Get available product variants for calculator
// @route   GET /api/calculator/variants
// @access  Private (All authenticated users)
export const getAvailableVariants = asyncHandler(async (req, res) => {
  const { materialType, company, thicknessMM, quality } = req.query;

  // Build query for active products
  const query = {
    isDeleted: { $ne: true },
    isActive: true,
    stockQuantity: { $gt: 0 } // Only show products with stock
  };

  if (materialType) {
    if (!['Glass', 'Thai'].includes(materialType)) {
      return res.status(400).json({
        success: false,
        message: 'Material type must be Glass or Thai'
      });
    }
    query.materialType = materialType;
  }

  if (company) {
    query.company = { $regex: company, $options: 'i' };
  }

  if (thicknessMM) {
    query.thicknessMM = parseFloat(thicknessMM);
  }

  if (quality) {
    if (!['Local', 'Imported', 'Premium'].includes(quality)) {
      return res.status(400).json({
        success: false,
        message: 'Quality must be Local, Imported, or Premium'
      });
    }
    query.quality = quality;
  }

  const products = await Product.find(query)
    .select('name materialType company thicknessMM quality sellingPrice stockQuantity unit measurementType')
    .sort({ materialType: 1, company: 1, thicknessMM: 1, quality: 1 });

  // Format for calculator use
  const variants = products.map(product => ({
    id: product._id,
    name: product.name,
    materialType: product.materialType,
    company: product.company,
    thickness: product.thicknessMM ? `${product.thicknessMM}mm` : null,
    thicknessMM: product.thicknessMM,
    quality: product.quality,
    sellingPrice: product.sellingPrice,
    formattedSellingPrice: CurrencyService.formatBDT(product.sellingPrice),
    stockQuantity: product.stockQuantity,
    unit: product.unit,
    measurementType: product.measurementType,
    displayName: `${product.materialType} | ${product.company} | ${product.thicknessMM ? product.thicknessMM + 'mm' : 'N/A'} | ${product.quality}`,
    stockStatus: product.stockQuantity <= 10 ? 'Low Stock' : 'In Stock',
    isLowStock: product.stockQuantity <= 10
  }));

  // Group variants for easier selection
  const groupedVariants = {
    materialTypes: [...new Set(variants.map(v => v.materialType))],
    companies: [...new Set(variants.map(v => v.company))].sort(),
    thicknesses: [...new Set(variants.filter(v => v.thicknessMM).map(v => v.thicknessMM))].sort((a, b) => a - b),
    qualities: [...new Set(variants.map(v => v.quality))].sort()
  };

  res.status(200).json({
    success: true,
    filters: {
      materialType: materialType || null,
      company: company || null,
      thicknessMM: thicknessMM ? parseFloat(thicknessMM) : null,
      quality: quality || null
    },
    data: {
      variants,
      groupedOptions: groupedVariants,
      summary: {
        totalVariants: variants.length,
        lowStockCount: variants.filter(v => v.isLowStock).length,
        totalStockValue: CurrencyService.formatBDT(
          variants.reduce((sum, v) => sum + (v.stockQuantity * v.sellingPrice), 0)
        )
      }
    }
  });
});

// @desc    Get specific product variant details for calculator
// @route   GET /api/calculator/variant/:productId
// @access  Private (All authenticated users)
export const getVariantDetails = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId)
    .select('name materialType company thicknessMM quality sellingPrice stockQuantity unit measurementType description isActive isDeleted');

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product variant not found'
    });
  }

  if (!product.isActive || product.isDeleted) {
    return res.status(400).json({
      success: false,
      message: 'Product variant is not available'
    });
  }

  const variantDetails = {
    id: product._id,
    name: product.name,
    description: product.description,
    materialType: product.materialType,
    company: product.company,
    thickness: product.thicknessMM ? `${product.thicknessMM}mm` : null,
    thicknessMM: product.thicknessMM,
    quality: product.quality,
    sellingPrice: product.sellingPrice,
    formattedSellingPrice: CurrencyService.formatBDT(product.sellingPrice),
    stockQuantity: product.stockQuantity,
    unit: product.unit,
    measurementType: product.measurementType,
    displayName: `${product.materialType} | ${product.company} | ${product.thicknessMM ? product.thicknessMM + 'mm' : 'N/A'} | ${product.quality}`,
    stockStatus: product.stockQuantity === 0 ? 'Out of Stock' : 
                 product.stockQuantity <= 10 ? 'Low Stock' : 'In Stock',
    isAvailable: product.stockQuantity > 0,
    isLowStock: product.stockQuantity <= 10 && product.stockQuantity > 0,
    isOutOfStock: product.stockQuantity === 0
  };

  res.status(200).json({
    success: true,
    data: variantDetails
  });
});

// @desc    Calculate with actual product variant (stock-aware calculation)
// @route   POST /api/calculator/calculate-variant
// @access  Private (All authenticated users)
export const calculateWithVariant = asyncHandler(async (req, res) => {
  const {
    productId,
    measurementType = 'SFT',
    // SFT dimensions
    length,
    width,
    lengthFeet = 0,
    lengthInches = 0,
    widthFeet = 0,
    widthInches = 0,
    // RFT dimensions
    runningLength,
    runningLengthFeet = 0,
    runningLengthInches = 0,
    // PANEL/SHEET dimensions
    panelCount,
    sheetCount,
    // CUSTOM dimensions
    customQuantity,
    customUnit
  } = req.body;

  // Validate required fields
  if (!productId) {
    return res.status(400).json({
      success: false,
      message: 'Product ID is required'
    });
  }

  if (!['SFT', 'RFT', 'PANEL', 'SHEET', 'CUSTOM'].includes(measurementType)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid measurement type',
      suggestion: 'Measurement type must be SFT, RFT, PANEL, SHEET, or CUSTOM'
    });
  }

  // Get product variant
  const product = await Product.findById(productId);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product variant not found'
    });
  }

  if (!product.isActive || product.isDeleted) {
    return res.status(400).json({
      success: false,
      message: 'Product variant is not available'
    });
  }

  if (product.stockQuantity === 0) {
    return res.status(400).json({
      success: false,
      message: 'Product is out of stock',
      stockQuantity: 0,
      suggestion: 'Please select a different variant or restock this product'
    });
  }

  let dimensions = {};
  let measurementInput = {};

  try {
    // Process dimensions based on measurement type
    switch (measurementType) {
      case 'SFT':
        // Handle SFT dimensions - support both decimal and feet/inches input
        if (length !== undefined && width !== undefined) {
          dimensions.length = parseFloat(length);
          dimensions.width = parseFloat(width);
        } else if (lengthFeet !== undefined && widthFeet !== undefined) {
          dimensions.length = convertToTotalFeet(lengthFeet, lengthInches);
          dimensions.width = convertToTotalFeet(widthFeet, widthInches);
          
          measurementInput = {
            lengthFeet: parseFloat(lengthFeet),
            lengthInches: parseFloat(lengthInches || 0),
            widthFeet: parseFloat(widthFeet),
            widthInches: parseFloat(widthInches || 0),
            lengthDisplay: formatFeetInches(dimensions.length),
            widthDisplay: formatFeetInches(dimensions.width)
          };
        } else {
          throw new Error('Please provide either length/width or lengthFeet/widthFeet for SFT measurement');
        }

        if (dimensions.length <= 0 || dimensions.width <= 0) {
          throw new Error('Length and width must be greater than 0');
        }
        break;

      case 'RFT':
        if (runningLength !== undefined) {
          dimensions.runningLength = parseFloat(runningLength);
        } else if (runningLengthFeet !== undefined) {
          dimensions.runningLength = convertToTotalFeet(runningLengthFeet, runningLengthInches);
          
          measurementInput = {
            runningLengthFeet: parseFloat(runningLengthFeet),
            runningLengthInches: parseFloat(runningLengthInches || 0),
            runningLengthDisplay: formatFeetInches(dimensions.runningLength)
          };
        } else {
          throw new Error('Please provide runningLength or runningLengthFeet for RFT measurement');
        }

        if (dimensions.runningLength <= 0) {
          throw new Error('Running length must be greater than 0');
        }
        break;

      case 'PANEL':
        if (!panelCount) {
          throw new Error('Panel count is required for PANEL measurement');
        }
        dimensions.panelCount = parseInt(panelCount);
        if (dimensions.panelCount <= 0) {
          throw new Error('Panel count must be greater than 0');
        }
        break;

      case 'SHEET':
        if (!sheetCount) {
          throw new Error('Sheet count is required for SHEET measurement');
        }
        dimensions.sheetCount = parseInt(sheetCount);
        if (dimensions.sheetCount <= 0) {
          throw new Error('Sheet count must be greater than 0');
        }
        break;

      case 'CUSTOM':
        if (!customQuantity) {
          throw new Error('Custom quantity is required for CUSTOM measurement');
        }
        
        const quantityValidation = MoneyValidator.validateAmount(customQuantity, 'Custom quantity', {
          allowZero: false,
          maxAmount: 10000
        });
        
        if (!quantityValidation.isValid) {
          throw new Error(`Invalid custom quantity: ${quantityValidation.errors.join(', ')}`);
        }
        
        dimensions.customQuantity = quantityValidation.sanitizedAmount;
        dimensions.customUnitPrice = product.sellingPrice; // Use product's selling price
        dimensions.customUnit = customUnit || product.unit;
        break;
    }

    // Calculate quantity needed based on measurement type
    let quantityNeeded = 0;
    let unitPrice = product.sellingPrice;
    let unit = product.unit;
    let formula = '';
    let calculation = '';

    switch (measurementType) {
      case 'SFT':
        quantityNeeded = dimensions.length * dimensions.width;
        unit = 'sqft';
        formula = 'Area = Length × Width';
        calculation = `${dimensions.length.toFixed(2)} × ${dimensions.width.toFixed(2)} = ${quantityNeeded.toFixed(4)} sq ft`;
        break;

      case 'RFT':
        quantityNeeded = dimensions.runningLength;
        unit = 'rft';
        formula = 'Running Length';
        calculation = `${dimensions.runningLength.toFixed(2)} running ft`;
        break;

      case 'PANEL':
        quantityNeeded = dimensions.panelCount;
        unit = 'panel';
        formula = 'Panel Count';
        calculation = `${dimensions.panelCount} panels`;
        break;

      case 'SHEET':
        quantityNeeded = dimensions.sheetCount;
        unit = 'sheet';
        formula = 'Sheet Count';
        calculation = `${dimensions.sheetCount} sheets`;
        break;

      case 'CUSTOM':
        quantityNeeded = dimensions.customQuantity;
        unit = dimensions.customUnit;
        formula = 'Custom Calculation';
        calculation = `${quantityNeeded} ${unit}`;
        break;
    }

    // Check if we have sufficient stock
    if (quantityNeeded > product.stockQuantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock for this calculation',
        required: quantityNeeded,
        available: product.stockQuantity,
        shortage: quantityNeeded - product.stockQuantity,
        suggestion: `You need ${quantityNeeded.toFixed(2)} ${unit} but only ${product.stockQuantity} ${unit} is available. Please reduce the quantity or restock.`
      });
    }

    const totalPrice = quantityNeeded * unitPrice;
    const priceCalculation = `${quantityNeeded.toFixed(4)} × ${CurrencyService.formatBDT(unitPrice)} = ${CurrencyService.formatBDT(totalPrice)}`;

    // Prepare response
    const response = {
      product: {
        id: product._id,
        name: product.name,
        materialType: product.materialType,
        company: product.company,
        thickness: product.thicknessMM ? `${product.thicknessMM}mm` : null,
        quality: product.quality,
        displayName: `${product.materialType} | ${product.company} | ${product.thicknessMM ? product.thicknessMM + 'mm' : 'N/A'} | ${product.quality}`,
        stockQuantity: product.stockQuantity,
        stockAfterUse: product.stockQuantity - quantityNeeded
      },
      input: {
        measurementType,
        dimensions,
        ...(Object.keys(measurementInput).length > 0 && { measurementInput })
      },
      calculation: {
        quantityNeeded: Math.round(quantityNeeded * 10000) / 10000,
        unit,
        unitPrice: Math.round(unitPrice * 100) / 100,
        totalPrice: Math.round(totalPrice * 100) / 100,
        formattedUnitPrice: CurrencyService.formatBDT(unitPrice),
        formattedTotalPrice: CurrencyService.formatBDT(totalPrice)
      },
      breakdown: {
        formula,
        calculation,
        priceCalculation
      },
      stockValidation: {
        isStockSufficient: true,
        quantityNeeded,
        availableStock: product.stockQuantity,
        stockAfterUse: product.stockQuantity - quantityNeeded,
        stockStatus: product.stockQuantity - quantityNeeded <= 10 ? 'Will be Low Stock' : 'Sufficient Stock'
      },
      // Invoice item data for easy integration
      invoiceItemData: {
        productId: product._id,
        productName: product.name,
        isCalculatorItem: true,
        isStockVariant: true,
        measurementType,
        dimensions: {
          ...dimensions,
          ...(measurementType === 'SFT' && { area: quantityNeeded })
        },
        measurementInput,
        calculationBreakdown: {
          formula,
          calculation,
          priceCalculation
        },
        quantity: quantityNeeded,
        unit,
        unitPrice,
        totalPrice: totalPrice,
        stockValidation: {
          quantityNeeded,
          availableStock: product.stockQuantity,
          stockAfterUse: product.stockQuantity - quantityNeeded
        }
      }
    };

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      suggestion: 'Please check your input values and try again'
    });
  }
});

// @desc    Check stock availability for calculation
// @route   POST /api/calculator/check-stock
// @access  Private (All authenticated users)
export const checkStockAvailability = asyncHandler(async (req, res) => {
  const { productId, quantityNeeded } = req.body;

  if (!productId || !quantityNeeded) {
    return res.status(400).json({
      success: false,
      message: 'Product ID and quantity needed are required'
    });
  }

  const product = await Product.findById(productId)
    .select('name materialType company thicknessMM quality stockQuantity unit');

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  const quantity = parseFloat(quantityNeeded);
  const isAvailable = product.stockQuantity >= quantity;
  const shortage = isAvailable ? 0 : quantity - product.stockQuantity;

  res.status(200).json({
    success: true,
    data: {
      product: {
        id: product._id,
        name: product.name,
        displayName: `${product.materialType} | ${product.company} | ${product.thicknessMM ? product.thicknessMM + 'mm' : 'N/A'} | ${product.quality}`
      },
      stockCheck: {
        quantityNeeded: quantity,
        availableStock: product.stockQuantity,
        isAvailable,
        shortage,
        stockAfterUse: isAvailable ? product.stockQuantity - quantity : 0,
        message: isAvailable 
          ? `Stock is sufficient. ${product.stockQuantity - quantity} ${product.unit} will remain.`
          : `Insufficient stock. Need ${shortage} ${product.unit} more.`
      }
    }
  });
});

// @desc    Bulk calculate for multiple measurements with measurement type support
// @route   POST /api/calculator/bulk-calculate
// @access  Private (All authenticated users)
export const bulkCalculate = asyncHandler(async (req, res) => {
  const { calculations } = req.body;

  if (!Array.isArray(calculations) || calculations.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an array of calculations',
      suggestion: 'Calculations array is required with at least one calculation'
    });
  }

  if (calculations.length > 50) {
    return res.status(400).json({
      success: false,
      message: 'Maximum 50 calculations allowed per request',
      suggestion: 'Please reduce the number of calculations and try again'
    });
  }

  const results = [];
  let totalAmount = 0;

  for (let i = 0; i < calculations.length; i++) {
    const calc = calculations[i];
    
    try {
      const {
        materialType,
        measurementType = 'SFT',
        glassThickness,
        glassQuality,
        ...dimensions
      } = calc;

      if (!materialType || !['Thai', 'Glass'].includes(materialType)) {
        results.push({
          index: i,
          error: 'Invalid material type',
          input: calc
        });
        continue;
      }

      if (!['SFT', 'RFT', 'PANEL', 'SHEET', 'CUSTOM'].includes(measurementType)) {
        results.push({
          index: i,
          error: 'Invalid measurement type',
          input: calc
        });
        continue;
      }

      // Get configuration
      const config = await CalculatorConfig.findOne({ 
        materialType, 
        isActive: true 
      });

      if (!config) {
        results.push({
          index: i,
          error: `Configuration not found for ${materialType}`,
          input: calc
        });
        continue;
      }

      // Check if measurement type is supported
      const activeMeasurementTypes = config.getActiveMeasurementTypes();
      if (!activeMeasurementTypes.includes(measurementType)) {
        results.push({
          index: i,
          error: `Measurement type ${measurementType} is not active for ${materialType}`,
          input: calc
        });
        continue;
      }

      // Get glass pricing if specified
      let glassSpec = null;
      if (materialType === 'Glass' && glassThickness && glassQuality) {
        if (!['3mm', '4mm', '5mm', '6mm'].includes(glassThickness) || 
            !['Local', 'Imported'].includes(glassQuality)) {
          results.push({
            index: i,
            error: 'Invalid glass specifications',
            input: calc
          });
          continue;
        }

        const glassPricing = await GlassPricing.getCurrentPrice(materialType, glassThickness, glassQuality);
        if (glassPricing) {
          glassSpec = {
            thickness: glassPricing.thickness,
            quality: glassPricing.quality,
            pricePerSqFt: glassPricing.pricePerSqFt,
            displayName: glassPricing.displayName,
            formattedPrice: glassPricing.formattedPrice
          };
        }
      }

      // Process dimensions based on measurement type
      let processedDimensions = {};

      switch (measurementType) {
        case 'SFT':
          if (dimensions.length && dimensions.width) {
            processedDimensions.length = parseFloat(dimensions.length);
            processedDimensions.width = parseFloat(dimensions.width);
          } else if (dimensions.lengthFeet !== undefined && dimensions.widthFeet !== undefined) {
            processedDimensions.length = convertToTotalFeet(dimensions.lengthFeet, dimensions.lengthInches);
            processedDimensions.width = convertToTotalFeet(dimensions.widthFeet, dimensions.widthInches);
          } else {
            throw new Error('Invalid SFT dimensions');
          }
          break;

        case 'RFT':
          if (dimensions.runningLength) {
            processedDimensions.runningLength = parseFloat(dimensions.runningLength);
          } else if (dimensions.runningLengthFeet !== undefined) {
            processedDimensions.runningLength = convertToTotalFeet(dimensions.runningLengthFeet, dimensions.runningLengthInches);
          } else {
            throw new Error('Invalid RFT dimensions');
          }
          break;

        case 'PANEL':
          if (!dimensions.panelCount) throw new Error('Panel count required');
          processedDimensions.panelCount = parseInt(dimensions.panelCount);
          break;

        case 'SHEET':
          if (!dimensions.sheetCount) throw new Error('Sheet count required');
          processedDimensions.sheetCount = parseInt(dimensions.sheetCount);
          break;

        case 'CUSTOM':
          if (!dimensions.customQuantity || !dimensions.customUnitPrice) {
            throw new Error('Custom quantity and unit price required');
          }
          processedDimensions.customQuantity = parseFloat(dimensions.customQuantity);
          processedDimensions.customUnitPrice = parseFloat(dimensions.customUnitPrice);
          processedDimensions.customUnit = dimensions.customUnit || 'unit';
          break;
      }

      // Calculate with glass pricing support
      const calculationResult = calculateByMeasurementType(measurementType, processedDimensions, config.pricing, glassSpec);
      totalAmount += calculationResult.totalPrice;

      results.push({
        index: i,
        success: true,
        input: calc,
        result: {
          measurementType,
          quantity: calculationResult.quantity,
          unit: calculationResult.unit,
          unitPrice: calculationResult.unitPrice,
          totalPrice: calculationResult.totalPrice,
          formattedUnitPrice: CurrencyService.formatBDT(calculationResult.unitPrice),
          formattedTotalPrice: CurrencyService.formatBDT(calculationResult.totalPrice),
          breakdown: calculationResult.breakdown,
          ...(calculationResult.glassSpecification && { glassSpecification: calculationResult.glassSpecification })
        }
      });

    } catch (error) {
      results.push({
        index: i,
        error: error.message,
        input: calc
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const errorCount = results.filter(r => r.error).length;

  res.status(200).json({
    success: true,
    summary: {
      total: calculations.length,
      successful: successCount,
      errors: errorCount,
      totalAmount: Math.round(totalAmount * 100) / 100,
      formattedTotalAmount: CurrencyService.formatBDT(totalAmount)
    },
    data: results
  });
});