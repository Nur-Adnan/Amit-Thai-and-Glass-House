import asyncHandler from '../utils/asyncHandler.js';
import CalculatorConfig from '../models/CalculatorConfig.js';
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

// Helper function to calculate based on measurement type
const calculateByMeasurementType = (measurementType, dimensions, pricing) => {
  let quantity = 0;
  let unitPrice = 0;
  let formula = '';
  let calculation = '';
  let unit = '';

  switch (measurementType) {
    case 'SFT': // Square Foot - length × width
      if (!dimensions.length || !dimensions.width) {
        throw new Error('Length and width are required for SFT measurement');
      }
      quantity = dimensions.length * dimensions.width; // area in sq ft
      unitPrice = pricing.SFT.pricePerSqFt;
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
    breakdown: {
      formula,
      calculation,
      priceCalculation
    }
  };
};

// @desc    Get all calculator configurations
// @route   GET /api/calculator/config
// @access  Private (All authenticated users)
export const getConfigs = asyncHandler(async (req, res) => {
  const configs = await CalculatorConfig.find({ isActive: true })
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .sort({ materialType: 1 });

  res.status(200).json({
    success: true,
    count: configs.length,
    data: configs
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
      message: 'Material type must be either Thai or Glass'
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
      message: `Configuration not found for ${materialType}`
    });
  }

  res.status(200).json({
    success: true,
    data: config
  });
});

// @desc    Create or update calculator configuration
// @route   POST /api/calculator/config
// @access  Private (Manager and above)
export const saveConfig = asyncHandler(async (req, res) => {
  const { materialType, pricePerSqFt } = req.body;

  if (!materialType || !pricePerSqFt) {
    return res.status(400).json({
      success: false,
      message: 'Please provide materialType and pricePerSqFt'
    });
  }

  // Check if configuration already exists
  let config = await CalculatorConfig.findOne({ materialType });

  if (config) {
    // Update existing configuration
    config.pricePerSqFt = pricePerSqFt;
    config.updatedBy = req.user.id;
    config.isActive = true;
    await config.save();

    await config.populate('createdBy', 'name email');
    await config.populate('updatedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Configuration updated successfully',
      data: config
    });
  } else {
    // Create new configuration
    config = await CalculatorConfig.create({
      materialType,
      pricePerSqFt,
      createdBy: req.user.id
    });

    await config.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Configuration created successfully',
      data: config
    });
  }
});

// @desc    Calculate measurement and price
// @route   POST /api/calculator/calculate
// @access  Private (All authenticated users)
export const calculateMeasurement = asyncHandler(async (req, res) => {
  const {
    materialType,
    length,
    width,
    lengthFeet = 0,
    lengthInches = 0,
    widthFeet = 0,
    widthInches = 0,
    customPricePerSqFt
  } = req.body;

  // Validate required fields
  if (!materialType) {
    return res.status(400).json({
      success: false,
      message: 'Please specify material type'
    });
  }

  if (!['Thai', 'Glass'].includes(materialType)) {
    return res.status(400).json({
      success: false,
      message: 'Material type must be either Thai or Glass'
    });
  }

  let totalLength, totalWidth;

  // Calculate dimensions - support both decimal and feet/inches input
  if (length !== undefined && width !== undefined) {
    // Direct decimal input
    totalLength = parseFloat(length);
    totalWidth = parseFloat(width);
  } else if (lengthFeet !== undefined && widthFeet !== undefined) {
    // Feet and inches input
    // totalFeet = feet + (inches / 12)
    totalLength = parseFloat(lengthFeet) + (parseFloat(lengthInches || 0) / 12);
    totalWidth = parseFloat(widthFeet) + (parseFloat(widthInches || 0) / 12);
  } else {
    return res.status(400).json({
      success: false,
      message: 'Please provide either length/width or lengthFeet/widthFeet with optional inches'
    });
  }

  // Validate dimensions
  if (totalLength <= 0 || totalWidth <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Length and width must be greater than 0'
    });
  }

  // Calculate area
  const area = totalLength * totalWidth;

  let pricePerSqFt;

  // Use custom price if provided, otherwise get from configuration
  if (customPricePerSqFt !== undefined) {
    pricePerSqFt = parseFloat(customPricePerSqFt);
    if (pricePerSqFt < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price per square foot cannot be negative'
      });
    }
  } else {
    // Get price from configuration
    const config = await CalculatorConfig.findOne({ 
      materialType, 
      isActive: true 
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: `Price configuration not found for ${materialType}. Please set up the configuration first or provide customPricePerSqFt.`
      });
    }

    pricePerSqFt = config.pricePerSqFt;
  }

  // Calculate total price
  const totalPrice = area * pricePerSqFt;

  // Prepare response
  const calculation = {
    input: {
      materialType,
      dimensions: {
        length: totalLength,
        width: totalWidth,
        ...(lengthFeet !== undefined && {
          lengthFeet: parseFloat(lengthFeet),
          lengthInches: parseFloat(lengthInches || 0),
          widthFeet: parseFloat(widthFeet),
          widthInches: parseFloat(widthInches || 0)
        })
      },
      pricePerSqFt,
      customPrice: customPricePerSqFt !== undefined
    },
    calculation: {
      area: parseFloat(area.toFixed(4)),
      pricePerSqFt: parseFloat(pricePerSqFt.toFixed(2)),
      totalPrice: parseFloat(totalPrice.toFixed(2))
    },
    breakdown: {
      formula: 'Area = Length × Width',
      areaCalculation: `${totalLength.toFixed(2)} × ${totalWidth.toFixed(2)} = ${area.toFixed(4)} sq ft`,
      priceCalculation: `${area.toFixed(4)} × $${pricePerSqFt.toFixed(2)} = $${totalPrice.toFixed(2)}`
    }
  };

  res.status(200).json({
    success: true,
    data: calculation
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

// @desc    Delete calculator configuration
// @route   DELETE /api/calculator/config/:materialType
// @access  Private (Manager and above)
export const deleteConfig = asyncHandler(async (req, res) => {
  const { materialType } = req.params;

  const config = await CalculatorConfig.findOne({ materialType });

  if (!config) {
    return res.status(404).json({
      success: false,
      message: `Configuration not found for ${materialType}`
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

// @desc    Bulk calculate for multiple measurements
// @route   POST /api/calculator/bulk-calculate
// @access  Private (All authenticated users)
export const bulkCalculate = asyncHandler(async (req, res) => {
  const { calculations } = req.body;

  if (!Array.isArray(calculations) || calculations.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an array of calculations'
    });
  }

  if (calculations.length > 50) {
    return res.status(400).json({
      success: false,
      message: 'Maximum 50 calculations allowed per request'
    });
  }

  const results = [];
  let totalAmount = 0;

  for (let i = 0; i < calculations.length; i++) {
    const calc = calculations[i];
    
    try {
      // Extract calculation logic for reuse
      const {
        materialType,
        length,
        width,
        lengthFeet = 0,
        lengthInches = 0,
        widthFeet = 0,
        widthInches = 0,
        customPricePerSqFt
      } = calc;

      if (!materialType || !['Thai', 'Glass'].includes(materialType)) {
        results.push({
          index: i,
          error: 'Invalid material type',
          input: calc
        });
        continue;
      }

      let totalLength, totalWidth;

      if (length !== undefined && width !== undefined) {
        totalLength = parseFloat(length);
        totalWidth = parseFloat(width);
      } else if (lengthFeet !== undefined && widthFeet !== undefined) {
        totalLength = parseFloat(lengthFeet) + (parseFloat(lengthInches || 0) / 12);
        totalWidth = parseFloat(widthFeet) + (parseFloat(widthInches || 0) / 12);
      } else {
        results.push({
          index: i,
          error: 'Invalid dimensions provided',
          input: calc
        });
        continue;
      }

      if (totalLength <= 0 || totalWidth <= 0) {
        results.push({
          index: i,
          error: 'Length and width must be greater than 0',
          input: calc
        });
        continue;
      }

      const area = totalLength * totalWidth;
      let pricePerSqFt;

      if (customPricePerSqFt !== undefined) {
        pricePerSqFt = parseFloat(customPricePerSqFt);
      } else {
        const config = await CalculatorConfig.findOne({ 
          materialType, 
          isActive: true 
        });

        if (!config) {
          results.push({
            index: i,
            error: `Price configuration not found for ${materialType}`,
            input: calc
          });
          continue;
        }

        pricePerSqFt = config.pricePerSqFt;
      }

      const totalPrice = area * pricePerSqFt;
      totalAmount += totalPrice;

      results.push({
        index: i,
        success: true,
        input: calc,
        result: {
          area: parseFloat(area.toFixed(4)),
          pricePerSqFt: parseFloat(pricePerSqFt.toFixed(2)),
          totalPrice: parseFloat(totalPrice.toFixed(2))
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
      totalAmount: parseFloat(totalAmount.toFixed(2))
    },
    data: results
  });
});