import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import Invoice from '../models/Invoice.js';
import StockPurchase from '../models/StockPurchase.js';

/**
 * Business Rules Validation Service
 * 
 * Enforces critical business rules to prevent real-world mistakes:
 * 1. Cannot sell without selecting company & thickness
 * 2. Cannot mix thickness in one calculator item
 * 3. Purchase price changes do NOT affect past invoices
 * 4. Soft-deleted brands cannot be used
 */
class BusinessRulesService {
  
  /**
   * Validate invoice item for required variant information
   * Rule: Cannot sell without selecting company & thickness
   */
  static async validateInvoiceItem(item, productId) {
    const errors = [];
    
    try {
      // Get product details
      const product = await Product.findById(productId);
      if (!product) {
        errors.push('Product not found');
        return { isValid: false, errors };
      }

      // Check if product requires variant information (Thai & Glass materials)
      if (product.materialType && ['Thai', 'Glass'].includes(product.materialType)) {
        
        // Company is required for Thai & Glass
        if (!item.company && !product.company) {
          errors.push(`Company selection is required for ${product.materialType} products`);
        }
        
        // Thickness is required for Thai & Glass
        if (!item.thicknessMM && !product.thicknessMM) {
          errors.push(`Thickness selection is required for ${product.materialType} products`);
        }
        
        // Quality is required for Thai & Glass
        if (!item.quality && !product.quality) {
          errors.push(`Quality selection is required for ${product.materialType} products`);
        }
        
        // Measurement type is required
        if (!item.measurementType && !product.measurementType) {
          errors.push(`Measurement type is required for ${product.materialType} products`);
        }
        
        // If item has variant info, validate it matches product
        if (item.company && product.company && item.company !== product.company) {
          errors.push(`Selected company "${item.company}" does not match product company "${product.company}"`);
        }
        
        if (item.thicknessMM && product.thicknessMM && item.thicknessMM !== product.thicknessMM) {
          errors.push(`Selected thickness "${item.thicknessMM}mm" does not match product thickness "${product.thicknessMM}mm"`);
        }
        
        if (item.quality && product.quality && item.quality !== product.quality) {
          errors.push(`Selected quality "${item.quality}" does not match product quality "${product.quality}"`);
        }
      }
      
    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate calculator item for thickness consistency
   * Rule: Cannot mix thickness in one calculator item
   */
  static validateCalculatorItem(calculatorData) {
    const errors = [];
    
    try {
      // Check if calculator has dimensions that would result in mixed thickness
      if (calculatorData.materialType && ['Thai', 'Glass'].includes(calculatorData.materialType)) {
        
        // Company is required
        if (!calculatorData.company) {
          errors.push('Company selection is required for calculator');
        }
        
        // Thickness is required
        if (!calculatorData.thicknessMM) {
          errors.push('Thickness selection is required for calculator');
        }
        
        // Quality is required
        if (!calculatorData.quality) {
          errors.push('Quality selection is required for calculator');
        }
        
        // Measurement type is required
        if (!calculatorData.measurementType) {
          errors.push('Measurement type is required for calculator');
        }
        
        // Validate that all dimensions use the same thickness
        // This prevents mixing different thickness in one calculation
        if (calculatorData.items && Array.isArray(calculatorData.items)) {
          const thicknesses = calculatorData.items
            .map(item => item.thicknessMM)
            .filter(thickness => thickness !== undefined);
          
          const uniqueThicknesses = [...new Set(thicknesses)];
          
          if (uniqueThicknesses.length > 1) {
            errors.push(`Cannot mix different thicknesses in one calculator item. Found: ${uniqueThicknesses.join('mm, ')}mm`);
          }
          
          // Ensure all items have the same thickness as the main calculator
          if (calculatorData.thicknessMM && uniqueThicknesses.length > 0) {
            const invalidThicknesses = uniqueThicknesses.filter(t => t !== calculatorData.thicknessMM);
            if (invalidThicknesses.length > 0) {
              errors.push(`All items must use the selected thickness of ${calculatorData.thicknessMM}mm. Invalid: ${invalidThicknesses.join('mm, ')}mm`);
            }
          }
        }
      }
      
    } catch (error) {
      errors.push(`Calculator validation error: ${error.message}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate that purchase price changes don't affect past invoices
   * Rule: Purchase price change does NOT affect past invoices
   */
  static async validatePurchasePriceChange(productId, newPurchasePrice, userId) {
    const errors = [];
    const warnings = [];
    
    try {
      const product = await Product.findById(productId);
      if (!product) {
        errors.push('Product not found');
        return { isValid: false, errors, warnings };
      }
      
      // Check if purchase price is actually changing
      if (product.purchasePrice === newPurchasePrice) {
        return { isValid: true, errors: [], warnings: [] };
      }
      
      // Find invoices that used this product
      const invoicesWithProduct = await Invoice.find({
        'items.product': productId,
        isActive: true,
        isDeleted: { $ne: true }
      }).select('invoiceNo createdAt items.$');
      
      if (invoicesWithProduct.length > 0) {
        warnings.push(
          `Purchase price change detected for "${product.name}". ` +
          `This will NOT affect ${invoicesWithProduct.length} existing invoices. ` +
          `Past invoices maintain their original profit calculations.`
        );
        
        // Log the price change for audit trail
        const priceChangeLog = {
          productId: productId,
          productName: product.name,
          oldPurchasePrice: product.purchasePrice,
          newPurchasePrice: newPurchasePrice,
          affectedInvoiceCount: invoicesWithProduct.length,
          changedBy: userId,
          changeDate: new Date(),
          note: 'Purchase price changed - past invoices unaffected'
        };
        
        warnings.push(`Price change logged for audit: ${JSON.stringify(priceChangeLog)}`);
      }
      
    } catch (error) {
      errors.push(`Purchase price validation error: ${error.message}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate that soft-deleted brands cannot be used
   * Rule: Soft-deleted brands cannot be used
   */
  static async validateBrandUsage(brandName, materialType) {
    const errors = [];
    
    try {
      if (!brandName) {
        errors.push('Brand name is required');
        return { isValid: false, errors };
      }
      
      // Find the brand
      const brand = await Brand.findOne({ 
        name: brandName,
        materialType: materialType 
      });
      
      if (!brand) {
        errors.push(`Brand "${brandName}" not found for material type "${materialType}"`);
        return { isValid: false, errors };
      }
      
      // Check if brand is soft-deleted
      if (brand.isDeleted) {
        errors.push(
          `Brand "${brandName}" is no longer available (deleted on ${brand.deletedAt?.toLocaleDateString()}). ` +
          `Please select a different brand or contact administrator to restore this brand.`
        );
      }
      
      // Check if brand is active
      if (!brand.isActive) {
        errors.push(
          `Brand "${brandName}" is currently inactive. ` +
          `Please select an active brand or contact administrator.`
        );
      }
      
    } catch (error) {
      errors.push(`Brand validation error: ${error.message}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate product creation/update for variant requirements
   */
  static async validateProductVariant(productData) {
    const errors = [];
    
    try {
      // If material type is Thai or Glass, validate required fields
      if (productData.materialType && ['Thai', 'Glass'].includes(productData.materialType)) {
        
        if (!productData.company) {
          errors.push(`Company is required for ${productData.materialType} products`);
        }
        
        if (!productData.thicknessMM) {
          errors.push(`Thickness is required for ${productData.materialType} products`);
        }
        
        if (!productData.quality) {
          errors.push(`Quality is required for ${productData.materialType} products`);
        }
        
        if (!productData.measurementType) {
          errors.push(`Measurement type is required for ${productData.materialType} products`);
        }
        
        // Validate brand if provided
        if (productData.company) {
          const brandValidation = await this.validateBrandUsage(productData.company, productData.materialType);
          if (!brandValidation.isValid) {
            errors.push(...brandValidation.errors);
          }
        }
      }
      
    } catch (error) {
      errors.push(`Product variant validation error: ${error.message}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate stock purchase for variant requirements
   */
  static async validateStockPurchaseItem(item, productId) {
    const errors = [];
    
    try {
      const product = await Product.findById(productId);
      if (!product) {
        errors.push('Product not found');
        return { isValid: false, errors };
      }
      
      // For Thai & Glass products, ensure variant information is complete
      if (product.materialType && ['Thai', 'Glass'].includes(product.materialType)) {
        
        if (!product.company) {
          errors.push(`Product "${product.name}" is missing company information`);
        }
        
        if (!product.thicknessMM) {
          errors.push(`Product "${product.name}" is missing thickness information`);
        }
        
        if (!product.quality) {
          errors.push(`Product "${product.name}" is missing quality information`);
        }
        
        // Validate brand is not soft-deleted
        if (product.company) {
          const brandValidation = await this.validateBrandUsage(product.company, product.materialType);
          if (!brandValidation.isValid) {
            errors.push(...brandValidation.errors.map(err => `Product "${product.name}": ${err}`));
          }
        }
      }
      
    } catch (error) {
      errors.push(`Stock purchase validation error: ${error.message}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Comprehensive validation for invoice creation
   */
  static async validateInvoiceCreation(invoiceData) {
    const errors = [];
    const warnings = [];
    
    try {
      if (!invoiceData.items || !Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
        errors.push('Invoice must have at least one item');
        return { isValid: false, errors, warnings };
      }
      
      // Validate each item
      for (let i = 0; i < invoiceData.items.length; i++) {
        const item = invoiceData.items[i];
        
        if (!item.product) {
          errors.push(`Item ${i + 1}: Product is required`);
          continue;
        }
        
        // Validate item variant requirements
        const itemValidation = await this.validateInvoiceItem(item, item.product);
        if (!itemValidation.isValid) {
          errors.push(...itemValidation.errors.map(err => `Item ${i + 1}: ${err}`));
        }
      }
      
    } catch (error) {
      errors.push(`Invoice validation error: ${error.message}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get all active brands for a material type
   */
  static async getActiveBrands(materialType) {
    try {
      const brands = await Brand.find({
        materialType: materialType,
        isActive: true,
        isDeleted: { $ne: true }
      }).select('name country notes').sort({ name: 1 });
      
      return {
        success: true,
        brands
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate calculator result before creating invoice item
   */
  static validateCalculatorResult(calculatorResult) {
    const errors = [];
    
    try {
      // Ensure calculator result has required variant information
      if (!calculatorResult.materialType) {
        errors.push('Material type is required from calculator');
      }
      
      if (!calculatorResult.company) {
        errors.push('Company selection is required from calculator');
      }
      
      if (!calculatorResult.thicknessMM) {
        errors.push('Thickness selection is required from calculator');
      }
      
      if (!calculatorResult.quality) {
        errors.push('Quality selection is required from calculator');
      }
      
      if (!calculatorResult.measurementType) {
        errors.push('Measurement type is required from calculator');
      }
      
      // Validate calculated area
      if (!calculatorResult.calculatedArea || calculatorResult.calculatedArea <= 0) {
        errors.push('Valid calculated area is required from calculator');
      }
      
      // Validate product selection
      if (!calculatorResult.selectedProduct) {
        errors.push('Product selection is required from calculator');
      }
      
    } catch (error) {
      errors.push(`Calculator result validation error: ${error.message}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default BusinessRulesService;