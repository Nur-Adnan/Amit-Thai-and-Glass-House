import BusinessRulesService from '../services/businessRulesService.js';
import logger from '../utils/logger.js';

/**
 * Business Rules Enforcement Middleware
 * 
 * Applies business rules validation to prevent real-world mistakes
 */

/**
 * Middleware to validate invoice creation
 */
export const validateInvoiceRules = async (req, res, next) => {
  try {
    const validation = await BusinessRulesService.validateInvoiceCreation(req.body);
    
    if (!validation.isValid) {
      logger.warn('Invoice creation blocked by business rules', {
        userId: req.user?.id,
        errors: validation.errors,
        requestBody: req.body
      });
      
      return res.status(400).json({
        success: false,
        message: 'Invoice creation blocked by business rules',
        errors: validation.errors,
        suggestion: 'Please ensure all items have complete variant information (company, thickness, quality)'
      });
    }
    
    // Log warnings if any
    if (validation.warnings && validation.warnings.length > 0) {
      logger.info('Invoice creation warnings', {
        userId: req.user?.id,
        warnings: validation.warnings
      });
      
      // Attach warnings to request for controller to handle
      req.businessWarnings = validation.warnings;
    }
    
    next();
  } catch (error) {
    logger.error('Business rules validation error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    
    return res.status(500).json({
      success: false,
      message: 'Business rules validation failed',
      error: error.message
    });
  }
};

/**
 * Middleware to validate calculator input
 */
export const validateCalculatorRules = async (req, res, next) => {
  try {
    const validation = BusinessRulesService.validateCalculatorItem(req.body);
    
    if (!validation.isValid) {
      logger.warn('Calculator blocked by business rules', {
        userId: req.user?.id,
        errors: validation.errors,
        requestBody: req.body
      });
      
      return res.status(400).json({
        success: false,
        message: 'Calculator blocked by business rules',
        errors: validation.errors,
        suggestion: 'Please select company, thickness, and quality. Cannot mix different thicknesses in one calculation.'
      });
    }
    
    next();
  } catch (error) {
    logger.error('Calculator rules validation error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    
    return res.status(500).json({
      success: false,
      message: 'Calculator rules validation failed',
      error: error.message
    });
  }
};

/**
 * Middleware to validate product updates (especially purchase price changes)
 */
export const validateProductUpdateRules = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const updateData = req.body;
    
    // Check if purchase price is being changed
    if (updateData.purchasePrice !== undefined) {
      const validation = await BusinessRulesService.validatePurchasePriceChange(
        productId, 
        updateData.purchasePrice, 
        req.user?.id
      );
      
      if (!validation.isValid) {
        logger.warn('Product purchase price change blocked', {
          userId: req.user?.id,
          productId,
          errors: validation.errors
        });
        
        return res.status(400).json({
          success: false,
          message: 'Purchase price change blocked by business rules',
          errors: validation.errors
        });
      }
      
      // Log warnings about price change impact
      if (validation.warnings && validation.warnings.length > 0) {
        logger.info('Product purchase price change warnings', {
          userId: req.user?.id,
          productId,
          warnings: validation.warnings
        });
        
        req.businessWarnings = validation.warnings;
      }
    }
    
    // Validate product variant requirements
    if (updateData.materialType || updateData.company || updateData.thicknessMM || updateData.quality) {
      const variantValidation = await BusinessRulesService.validateProductVariant(updateData);
      
      if (!variantValidation.isValid) {
        logger.warn('Product variant update blocked', {
          userId: req.user?.id,
          productId,
          errors: variantValidation.errors
        });
        
        return res.status(400).json({
          success: false,
          message: 'Product variant update blocked by business rules',
          errors: variantValidation.errors,
          suggestion: 'Thai and Glass products require company, thickness, quality, and measurement type'
        });
      }
    }
    
    next();
  } catch (error) {
    logger.error('Product update rules validation error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      productId: req.params.id
    });
    
    return res.status(500).json({
      success: false,
      message: 'Product update rules validation failed',
      error: error.message
    });
  }
};

/**
 * Middleware to validate product creation
 */
export const validateProductCreationRules = async (req, res, next) => {
  try {
    const validation = await BusinessRulesService.validateProductVariant(req.body);
    
    if (!validation.isValid) {
      logger.warn('Product creation blocked by business rules', {
        userId: req.user?.id,
        errors: validation.errors,
        requestBody: req.body
      });
      
      return res.status(400).json({
        success: false,
        message: 'Product creation blocked by business rules',
        errors: validation.errors,
        suggestion: 'Thai and Glass products require company, thickness, quality, and measurement type'
      });
    }
    
    next();
  } catch (error) {
    logger.error('Product creation rules validation error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    
    return res.status(500).json({
      success: false,
      message: 'Product creation rules validation failed',
      error: error.message
    });
  }
};

/**
 * Middleware to validate stock purchase
 */
export const validateStockPurchaseRules = async (req, res, next) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock purchase must have at least one item'
      });
    }
    
    // Validate each item
    const errors = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (!item.product) {
        errors.push(`Item ${i + 1}: Product is required`);
        continue;
      }
      
      const itemValidation = await BusinessRulesService.validateStockPurchaseItem(item, item.product);
      if (!itemValidation.isValid) {
        errors.push(...itemValidation.errors.map(err => `Item ${i + 1}: ${err}`));
      }
    }
    
    if (errors.length > 0) {
      logger.warn('Stock purchase blocked by business rules', {
        userId: req.user?.id,
        errors,
        requestBody: req.body
      });
      
      return res.status(400).json({
        success: false,
        message: 'Stock purchase blocked by business rules',
        errors,
        suggestion: 'Ensure all products have complete variant information and use active brands'
      });
    }
    
    next();
  } catch (error) {
    logger.error('Stock purchase rules validation error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    
    return res.status(500).json({
      success: false,
      message: 'Stock purchase rules validation failed',
      error: error.message
    });
  }
};

/**
 * Middleware to validate brand usage
 */
export const validateBrandUsageRules = async (req, res, next) => {
  try {
    const { company, materialType } = req.body;
    
    if (company && materialType) {
      const validation = await BusinessRulesService.validateBrandUsage(company, materialType);
      
      if (!validation.isValid) {
        logger.warn('Brand usage blocked by business rules', {
          userId: req.user?.id,
          company,
          materialType,
          errors: validation.errors
        });
        
        return res.status(400).json({
          success: false,
          message: 'Brand usage blocked by business rules',
          errors: validation.errors,
          suggestion: 'Please select an active brand or contact administrator'
        });
      }
    }
    
    next();
  } catch (error) {
    logger.error('Brand usage rules validation error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    
    return res.status(500).json({
      success: false,
      message: 'Brand usage rules validation failed',
      error: error.message
    });
  }
};

/**
 * Middleware to validate calculator result before invoice creation
 */
export const validateCalculatorResultRules = (req, res, next) => {
  try {
    // Check if request contains calculator result data
    const { items } = req.body;
    
    if (items && Array.isArray(items)) {
      const errors = [];
      
      items.forEach((item, index) => {
        // If item has calculator data, validate it
        if (item.isCalculatorItem || item.calculatedArea) {
          const validation = BusinessRulesService.validateCalculatorResult(item);
          
          if (!validation.isValid) {
            errors.push(...validation.errors.map(err => `Item ${index + 1}: ${err}`));
          }
        }
      });
      
      if (errors.length > 0) {
        logger.warn('Calculator result blocked by business rules', {
          userId: req.user?.id,
          errors,
          requestBody: req.body
        });
        
        return res.status(400).json({
          success: false,
          message: 'Calculator result blocked by business rules',
          errors,
          suggestion: 'Ensure calculator results include complete variant information'
        });
      }
    }
    
    next();
  } catch (error) {
    logger.error('Calculator result rules validation error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    
    return res.status(500).json({
      success: false,
      message: 'Calculator result rules validation failed',
      error: error.message
    });
  }
};