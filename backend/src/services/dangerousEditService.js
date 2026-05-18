import Product from '../models/Product.js';
import AuditService from './auditService.js';
import CurrencyService from './currencyService.js';

/**
 * Service to handle dangerous edit prevention and validation
 */
class DangerousEditService {
  
  /**
   * Check if a product edit is dangerous and requires special handling
   * @param {Object} originalProduct - Original product data
   * @param {Object} updatedData - New product data
   * @returns {Object} Validation result with warnings and restrictions
   */
  static async validateProductEdit(originalProduct, updatedData) {
    const warnings = [];
    const restrictions = [];
    const requiresConfirmation = [];
    
    // Rule 1: Company/Thickness cannot be changed if stock > 0
    if (originalProduct.stockQuantity > 0) {
      // Check company change
      if (updatedData.company && updatedData.company !== originalProduct.company) {
        restrictions.push({
          field: 'company',
          rule: 'COMPANY_CHANGE_WITH_STOCK',
          message: `Cannot change company from "${originalProduct.company}" to "${updatedData.company}" when stock exists (${originalProduct.stockQuantity} ${originalProduct.unit})`,
          currentValue: originalProduct.company,
          attemptedValue: updatedData.company,
          stockQuantity: originalProduct.stockQuantity,
          unit: originalProduct.unit
        });
      }
      
      // Check thickness change
      if (updatedData.thicknessMM && updatedData.thicknessMM !== originalProduct.thicknessMM) {
        restrictions.push({
          field: 'thicknessMM',
          rule: 'THICKNESS_CHANGE_WITH_STOCK',
          message: `Cannot change thickness from "${originalProduct.thicknessMM}mm" to "${updatedData.thicknessMM}mm" when stock exists (${originalProduct.stockQuantity} ${originalProduct.unit})`,
          currentValue: `${originalProduct.thicknessMM}mm`,
          attemptedValue: `${updatedData.thicknessMM}mm`,
          stockQuantity: originalProduct.stockQuantity,
          unit: originalProduct.unit
        });
      }
    }
    
    // Rule 2: Price changes require confirmation and reason
    const priceChangeThreshold = 0.01; // ৳0.01 threshold for price changes
    
    // Check purchase price change
    if (updatedData.purchasePrice && 
        Math.abs(updatedData.purchasePrice - originalProduct.purchasePrice) > priceChangeThreshold) {
      const changeAmount = updatedData.purchasePrice - originalProduct.purchasePrice;
      const changePercentage = ((changeAmount / originalProduct.purchasePrice) * 100).toFixed(2);
      
      requiresConfirmation.push({
        field: 'purchasePrice',
        rule: 'PURCHASE_PRICE_CHANGE',
        message: `Purchase price change detected: ${CurrencyService.formatBDT(originalProduct.purchasePrice)} → ${CurrencyService.formatBDT(updatedData.purchasePrice)}`,
        details: {
          oldPrice: CurrencyService.formatBDT(originalProduct.purchasePrice),
          newPrice: CurrencyService.formatBDT(updatedData.purchasePrice),
          changeAmount: CurrencyService.formatBDT(Math.abs(changeAmount)),
          changeDirection: changeAmount > 0 ? 'increase' : 'decrease',
          changePercentage: `${Math.abs(changePercentage)}%`,
          stockValue: CurrencyService.formatBDT(originalProduct.stockQuantity * originalProduct.purchasePrice),
          newStockValue: CurrencyService.formatBDT(originalProduct.stockQuantity * updatedData.purchasePrice)
        },
        requiresReason: true,
        severity: Math.abs(changePercentage) > 20 ? 'high' : Math.abs(changePercentage) > 10 ? 'medium' : 'low'
      });
    }
    
    // Check selling price change
    if (updatedData.sellingPrice && 
        Math.abs(updatedData.sellingPrice - originalProduct.sellingPrice) > priceChangeThreshold) {
      const changeAmount = updatedData.sellingPrice - originalProduct.sellingPrice;
      const changePercentage = ((changeAmount / originalProduct.sellingPrice) * 100).toFixed(2);
      
      requiresConfirmation.push({
        field: 'sellingPrice',
        rule: 'SELLING_PRICE_CHANGE',
        message: `Selling price change detected: ${CurrencyService.formatBDT(originalProduct.sellingPrice)} → ${CurrencyService.formatBDT(updatedData.sellingPrice)}`,
        details: {
          oldPrice: CurrencyService.formatBDT(originalProduct.sellingPrice),
          newPrice: CurrencyService.formatBDT(updatedData.sellingPrice),
          changeAmount: CurrencyService.formatBDT(Math.abs(changeAmount)),
          changeDirection: changeAmount > 0 ? 'increase' : 'decrease',
          changePercentage: `${Math.abs(changePercentage)}%`,
          oldProfitMargin: this.calculateProfitMargin(originalProduct.purchasePrice, originalProduct.sellingPrice),
          newProfitMargin: this.calculateProfitMargin(originalProduct.purchasePrice, updatedData.sellingPrice)
        },
        requiresReason: true,
        severity: Math.abs(changePercentage) > 20 ? 'high' : Math.abs(changePercentage) > 10 ? 'medium' : 'low'
      });
    }
    
    // Rule 3: Manual stock edits require reason
    if (updatedData.stockQuantity !== undefined && 
        updatedData.stockQuantity !== originalProduct.stockQuantity) {
      const changeAmount = updatedData.stockQuantity - originalProduct.stockQuantity;
      
      requiresConfirmation.push({
        field: 'stockQuantity',
        rule: 'MANUAL_STOCK_EDIT',
        message: `Manual stock adjustment detected: ${originalProduct.stockQuantity} → ${updatedData.stockQuantity} ${originalProduct.unit}`,
        details: {
          oldStock: `${originalProduct.stockQuantity} ${originalProduct.unit}`,
          newStock: `${updatedData.stockQuantity} ${originalProduct.unit}`,
          changeAmount: `${changeAmount > 0 ? '+' : ''}${changeAmount} ${originalProduct.unit}`,
          changeDirection: changeAmount > 0 ? 'increase' : 'decrease',
          oldStockValue: CurrencyService.formatBDT(originalProduct.stockQuantity * originalProduct.purchasePrice),
          newStockValue: CurrencyService.formatBDT(updatedData.stockQuantity * originalProduct.purchasePrice)
        },
        requiresReason: true,
        severity: Math.abs(changeAmount) > (originalProduct.stockQuantity * 0.5) ? 'high' : 'medium'
      });
    }
    
    // Additional warnings for significant changes
    if (updatedData.quality && updatedData.quality !== originalProduct.quality) {
      warnings.push({
        field: 'quality',
        message: `Quality change: ${originalProduct.quality} → ${updatedData.quality}`,
        impact: 'This may affect customer expectations and pricing'
      });
    }
    
    return {
      isValid: restrictions.length === 0,
      hasWarnings: warnings.length > 0,
      requiresConfirmation: requiresConfirmation.length > 0,
      restrictions,
      warnings,
      confirmationRequired: requiresConfirmation,
      summary: {
        restrictedFields: restrictions.map(r => r.field),
        warningFields: warnings.map(w => w.field),
        confirmationFields: requiresConfirmation.map(c => c.field),
        totalIssues: restrictions.length + warnings.length + requiresConfirmation.length
      }
    };
  }
  
  /**
   * Process a confirmed dangerous edit with proper logging
   * @param {Object} originalProduct - Original product data
   * @param {Object} updatedData - New product data
   * @param {Object} confirmation - Confirmation details with reasons
   * @param {Object} user - User performing the edit
   * @param {Object} request - HTTP request object
   * @returns {Object} Processing result
   */
  static async processConfirmedEdit(originalProduct, updatedData, confirmation, user, request) {
    try {
      // Validate that all required confirmations are provided
      const validation = await this.validateProductEdit(originalProduct, updatedData);
      
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Edit contains restricted changes that cannot be processed',
          restrictions: validation.restrictions
        };
      }
      
      if (validation.requiresConfirmation) {
        for (const required of validation.confirmationRequired) {
          if (required.requiresReason && !confirmation.reasons?.[required.field]) {
            return {
              success: false,
              message: `Reason required for ${required.field} change`,
              missingReason: required.field
            };
          }
        }
      }
      
      // Log the dangerous edit with detailed information
      await AuditService.logAction({
        action: 'DANGEROUS_PRODUCT_EDIT',
        entityType: 'Product',
        entityId: originalProduct._id,
        performedBy: user.id,
        details: {
          originalData: {
            company: originalProduct.company,
            thicknessMM: originalProduct.thicknessMM,
            purchasePrice: originalProduct.purchasePrice,
            sellingPrice: originalProduct.sellingPrice,
            stockQuantity: originalProduct.stockQuantity
          },
          updatedData: {
            company: updatedData.company,
            thicknessMM: updatedData.thicknessMM,
            purchasePrice: updatedData.purchasePrice,
            sellingPrice: updatedData.sellingPrice,
            stockQuantity: updatedData.stockQuantity
          },
          confirmationDetails: confirmation,
          validationResult: validation,
          userConfirmed: true,
          reasonsProvided: confirmation.reasons || {}
        },
        severity: 'high',
        metadata: {
          ipAddress: request.ip,
          userAgent: request.get('User-Agent'),
          timestamp: new Date(),
          productName: originalProduct.name,
          materialType: originalProduct.materialType
        }
      });
      
      return {
        success: true,
        message: 'Dangerous edit processed successfully',
        auditLogged: true
      };
      
    } catch (error) {
      return {
        success: false,
        message: 'Failed to process dangerous edit',
        error: error.message
      };
    }
  }
  
  /**
   * Calculate profit margin percentage
   * @param {number} purchasePrice - Purchase price
   * @param {number} sellingPrice - Selling price
   * @returns {string} Formatted profit margin percentage
   */
  static calculateProfitMargin(purchasePrice, sellingPrice) {
    if (purchasePrice === 0) return '0.00%';
    const margin = ((sellingPrice - purchasePrice) / purchasePrice * 100);
    return `${margin.toFixed(2)}%`;
  }
  
  /**
   * Get dangerous edit history for a product
   * @param {string} productId - Product ID
   * @param {Object} options - Query options
   * @returns {Object} Edit history
   */
  static async getDangerousEditHistory(productId, options = {}) {
    try {
      const { limit = 10, page = 1 } = options;
      
      // Get audit logs for dangerous edits
      const auditLogs = await AuditService.getEntityHistory('Product', productId, {
        action: 'DANGEROUS_PRODUCT_EDIT',
        limit,
        page,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      return {
        success: true,
        data: auditLogs
      };
      
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve edit history',
        error: error.message
      };
    }
  }
}

export default DangerousEditService;