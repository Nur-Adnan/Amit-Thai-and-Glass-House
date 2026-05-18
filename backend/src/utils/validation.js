/**
 * Production-Safe Validation Utilities
 * Comprehensive validation for all data types with proper error messages
 */

import mongoose from 'mongoose';

/**
 * Money field validation utilities
 */
export const MoneyValidator = {
  /**
   * Validate money amount
   * @param {number} amount - Amount to validate
   * @param {string} fieldName - Field name for error messages
   * @param {object} options - Validation options
   * @returns {object} Validation result
   */
  validateAmount(amount, fieldName = 'amount', options = {}) {
    const {
      allowZero = true,
      allowNegative = false,
      minAmount = null,
      maxAmount = null,
      maxDecimals = 2
    } = options;

    const errors = [];

    // Check if amount is provided
    if (amount === undefined || amount === null) {
      return {
        isValid: false,
        errors: [`${fieldName} is required`],
        sanitizedAmount: 0
      };
    }

    // Convert to number if string
    let numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    // Check if valid number
    if (isNaN(numAmount) || !isFinite(numAmount)) {
      return {
        isValid: false,
        errors: [`${fieldName} must be a valid number`],
        sanitizedAmount: 0
      };
    }

    // Check for negative values
    if (!allowNegative && numAmount < 0) {
      errors.push(`${fieldName} cannot be negative`);
    }

    // Check for zero values
    if (!allowZero && numAmount === 0) {
      errors.push(`${fieldName} must be greater than zero`);
    }

    // Check minimum amount
    if (minAmount !== null && numAmount < minAmount) {
      errors.push(`${fieldName} must be at least ৳${this.formatCurrency(minAmount)}`);
    }

    // Check maximum amount
    if (maxAmount !== null && numAmount > maxAmount) {
      errors.push(`${fieldName} cannot exceed ৳${this.formatCurrency(maxAmount)}`);
    }

    // Check decimal places
    const decimalPlaces = (numAmount.toString().split('.')[1] || '').length;
    if (decimalPlaces > maxDecimals) {
      errors.push(`${fieldName} cannot have more than ${maxDecimals} decimal places`);
    }

    // Sanitize amount (round to specified decimal places)
    const sanitizedAmount = Math.round(numAmount * Math.pow(10, maxDecimals)) / Math.pow(10, maxDecimals);

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedAmount,
      originalAmount: numAmount
    };
  },

  /**
   * Format currency for display
   * @param {number} amount - Amount to format
   * @param {object} options - Formatting options
   * @returns {string} Formatted currency string
   */
  formatCurrency(amount, options = {}) {
    const {
      currency = 'BDT',
      symbol = '৳',
      locale = 'bn-BD',
      minimumFractionDigits = 2,
      maximumFractionDigits = 2
    } = options;

    if (amount === null || amount === undefined || isNaN(amount)) {
      return `${symbol}0.00`;
    }

    try {
      // Use Intl.NumberFormat for proper formatting
      const formatter = new Intl.NumberFormat(locale, {
        style: 'decimal',
        minimumFractionDigits,
        maximumFractionDigits
      });

      const formattedNumber = formatter.format(Math.abs(amount));
      const sign = amount < 0 ? '-' : '';
      
      return `${sign}${symbol}${formattedNumber}`;
    } catch (error) {
      // Fallback formatting
      const formattedAmount = Math.abs(amount).toFixed(maximumFractionDigits);
      const sign = amount < 0 ? '-' : '';
      return `${sign}${symbol}${formattedAmount}`;
    }
  },

  /**
   * Parse currency string to number
   * @param {string} currencyString - Currency string to parse
   * @returns {number} Parsed amount
   */
  parseCurrency(currencyString) {
    if (typeof currencyString !== 'string') {
      return parseFloat(currencyString) || 0;
    }

    // Remove currency symbols and spaces
    const cleanString = currencyString
      .replace(/[৳$,\s]/g, '')
      .replace(/[^\d.-]/g, '');

    return parseFloat(cleanString) || 0;
  },

  /**
   * Validate money calculation
   * @param {object} calculation - Calculation object
   * @returns {object} Validation result
   */
  validateCalculation(calculation) {
    const { subtotal, discount, discountType, grandTotal, paidAmount, dueAmount } = calculation;
    const errors = [];

    // Validate subtotal
    const subtotalValidation = this.validateAmount(subtotal, 'Subtotal', { allowZero: false });
    if (!subtotalValidation.isValid) {
      errors.push(...subtotalValidation.errors);
    }

    // Validate discount
    if (discount !== undefined && discount !== null) {
      const discountValidation = this.validateAmount(discount, 'Discount', { 
        allowZero: true,
        maxAmount: discountType === 'percentage' ? 100 : subtotal 
      });
      if (!discountValidation.isValid) {
        errors.push(...discountValidation.errors);
      }
    }

    // Validate grand total
    if (grandTotal !== undefined && grandTotal !== null) {
      const grandTotalValidation = this.validateAmount(grandTotal, 'Grand Total', { allowZero: false });
      if (!grandTotalValidation.isValid) {
        errors.push(...grandTotalValidation.errors);
      }
    }

    // Validate paid amount
    if (paidAmount !== undefined && paidAmount !== null) {
      const paidValidation = this.validateAmount(paidAmount, 'Paid Amount', { 
        allowZero: true,
        maxAmount: grandTotal 
      });
      if (!paidValidation.isValid) {
        errors.push(...paidValidation.errors);
      }
    }

    // Validate due amount
    if (dueAmount !== undefined && dueAmount !== null) {
      const dueValidation = this.validateAmount(dueAmount, 'Due Amount', { allowZero: true });
      if (!dueValidation.isValid) {
        errors.push(...dueValidation.errors);
      }
    }

    // Validate calculation logic
    if (subtotal && discount !== undefined && grandTotal) {
      let expectedGrandTotal = subtotal;
      if (discountType === 'percentage') {
        expectedGrandTotal = subtotal - (subtotal * discount / 100);
      } else {
        expectedGrandTotal = subtotal - discount;
      }
      
      if (Math.abs(expectedGrandTotal - grandTotal) > 0.01) {
        errors.push('Grand total calculation is incorrect');
      }
    }

    if (grandTotal && paidAmount !== undefined && dueAmount !== undefined) {
      const expectedDueAmount = grandTotal - paidAmount;
      if (Math.abs(expectedDueAmount - dueAmount) > 0.01) {
        errors.push('Due amount calculation is incorrect');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

/**
 * Date validation utilities
 */
export const DateValidator = {
  /**
   * Validate date
   * @param {any} date - Date to validate
   * @param {string} fieldName - Field name for error messages
   * @param {object} options - Validation options
   * @returns {object} Validation result
   */
  validateDate(date, fieldName = 'date', options = {}) {
    const {
      required = true,
      allowFuture = true,
      allowPast = true,
      minDate = null,
      maxDate = null
    } = options;

    const errors = [];

    // Check if date is provided
    if (!date) {
      if (required) {
        errors.push(`${fieldName} is required`);
      }
      return {
        isValid: !required,
        errors,
        sanitizedDate: null
      };
    }

    // Convert to Date object
    let dateObj;
    try {
      dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [`${fieldName} must be a valid date`],
        sanitizedDate: null
      };
    }

    const now = new Date();

    // Check future dates
    if (!allowFuture && dateObj > now) {
      errors.push(`${fieldName} cannot be in the future`);
    }

    // Check past dates
    if (!allowPast && dateObj < now) {
      errors.push(`${fieldName} cannot be in the past`);
    }

    // Check minimum date
    if (minDate && dateObj < new Date(minDate)) {
      errors.push(`${fieldName} cannot be before ${this.formatDate(minDate)}`);
    }

    // Check maximum date
    if (maxDate && dateObj > new Date(maxDate)) {
      errors.push(`${fieldName} cannot be after ${this.formatDate(maxDate)}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedDate: dateObj
    };
  },

  /**
   * Format date for display
   * @param {Date|string} date - Date to format
   * @param {object} options - Formatting options
   * @returns {string} Formatted date string
   */
  formatDate(date, options = {}) {
    const {
      format = 'full',
      locale = 'en-US',
      timeZone = 'Asia/Dhaka'
    } = options;

    if (!date) return '';

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';

    try {
      switch (format) {
        case 'short':
          return dateObj.toLocaleDateString(locale, { timeZone });
        case 'medium':
          return dateObj.toLocaleDateString(locale, { 
            timeZone,
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        case 'long':
          return dateObj.toLocaleDateString(locale, {
            timeZone,
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        case 'full':
          return dateObj.toLocaleString(locale, {
            timeZone,
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        case 'time':
          return dateObj.toLocaleTimeString(locale, {
            timeZone,
            hour: '2-digit',
            minute: '2-digit'
          });
        case 'iso':
          return dateObj.toISOString();
        case 'business':
          return dateObj.toLocaleDateString('en-GB', { timeZone }); // DD/MM/YYYY
        default:
          return dateObj.toLocaleString(locale, { timeZone });
      }
    } catch (error) {
      return dateObj.toString();
    }
  },

  /**
   * Get date range validation
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {object} Validation result
   */
  validateDateRange(startDate, endDate) {
    const errors = [];

    const startValidation = this.validateDate(startDate, 'Start date');
    const endValidation = this.validateDate(endDate, 'End date');

    if (!startValidation.isValid) {
      errors.push(...startValidation.errors);
    }

    if (!endValidation.isValid) {
      errors.push(...endValidation.errors);
    }

    if (startValidation.isValid && endValidation.isValid) {
      if (startValidation.sanitizedDate > endValidation.sanitizedDate) {
        errors.push('Start date cannot be after end date');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      startDate: startValidation.sanitizedDate,
      endDate: endValidation.sanitizedDate
    };
  }
};

/**
 * General validation utilities
 */
export const GeneralValidator = {
  /**
   * Validate MongoDB ObjectId
   * @param {string} id - ID to validate
   * @param {string} fieldName - Field name for error messages
   * @returns {object} Validation result
   */
  validateObjectId(id, fieldName = 'ID') {
    if (!id) {
      return {
        isValid: false,
        errors: [`${fieldName} is required`]
      };
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return {
        isValid: false,
        errors: [`${fieldName} must be a valid ID`]
      };
    }

    return {
      isValid: true,
      errors: []
    };
  },

  /**
   * Validate email
   * @param {string} email - Email to validate
   * @param {string} fieldName - Field name for error messages
   * @returns {object} Validation result
   */
  validateEmail(email, fieldName = 'Email') {
    if (!email) {
      return {
        isValid: false,
        errors: [`${fieldName} is required`]
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        errors: [`${fieldName} must be a valid email address`]
      };
    }

    return {
      isValid: true,
      errors: [],
      sanitizedEmail: email.toLowerCase().trim()
    };
  },

  /**
   * Validate phone number
   * @param {string} phone - Phone number to validate
   * @param {string} fieldName - Field name for error messages
   * @returns {object} Validation result
   */
  validatePhone(phone, fieldName = 'Phone number') {
    if (!phone) {
      return {
        isValid: false,
        errors: [`${fieldName} is required`]
      };
    }

    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');

    // Check length (Bangladesh phone numbers)
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return {
        isValid: false,
        errors: [`${fieldName} must be between 10 and 15 digits`]
      };
    }

    return {
      isValid: true,
      errors: [],
      sanitizedPhone: cleanPhone
    };
  },

  /**
   * Validate string length
   * @param {string} str - String to validate
   * @param {string} fieldName - Field name for error messages
   * @param {object} options - Validation options
   * @returns {object} Validation result
   */
  validateString(str, fieldName = 'Field', options = {}) {
    const {
      required = true,
      minLength = 0,
      maxLength = 255,
      allowEmpty = false,
      trim = true
    } = options;

    const errors = [];

    if (!str && required) {
      return {
        isValid: false,
        errors: [`${fieldName} is required`]
      };
    }

    if (!str && !required) {
      return {
        isValid: true,
        errors: [],
        sanitizedString: ''
      };
    }

    let sanitizedString = trim ? str.trim() : str;

    if (!allowEmpty && sanitizedString.length === 0) {
      errors.push(`${fieldName} cannot be empty`);
    }

    if (sanitizedString.length < minLength) {
      errors.push(`${fieldName} must be at least ${minLength} characters long`);
    }

    if (sanitizedString.length > maxLength) {
      errors.push(`${fieldName} cannot exceed ${maxLength} characters`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedString
    };
  }
};

/**
 * Comprehensive validation for common business objects
 */
export const BusinessValidator = {
  /**
   * Validate product data with MaterialSpec integration
   * @param {object} productData - Product data to validate
   * @returns {object} Validation result
   */
  async validateProduct(productData) {
    const errors = [];
    const sanitizedData = {};

    // Validate name
    const nameValidation = GeneralValidator.validateString(productData.name, 'Product name', {
      minLength: 2,
      maxLength: 100
    });
    if (!nameValidation.isValid) {
      errors.push(...nameValidation.errors);
    } else {
      sanitizedData.name = nameValidation.sanitizedString;
    }

    // Validate materialType (required)
    const materialType = productData.materialType || productData.category;
    if (!materialType) {
      errors.push('Material type is required');
    } else if (!['Thai', 'Glass'].includes(materialType)) {
      errors.push('Material type must be either Thai or Glass');
    } else {
      sanitizedData.materialType = materialType;
      // Backward compatibility
      sanitizedData.category = materialType;
    }

    // Validate variant fields for Thai/Glass products using MaterialSpec
    if (['Thai', 'Glass'].includes(materialType)) {
      // Validate company
      const companyValidation = GeneralValidator.validateString(productData.company, 'Company name', {
        minLength: 2,
        maxLength: 50
      });
      if (!companyValidation.isValid) {
        errors.push(...companyValidation.errors);
      } else {
        sanitizedData.company = companyValidation.sanitizedString;
      }

      // Validate thickness and quality using MaterialSpec
      if (productData.thicknessMM !== undefined && productData.quality) {
        try {
          // Dynamic import to avoid circular dependency
          const { default: MaterialSpec } = await import('../models/MaterialSpec.js');
          
          const validSpec = await MaterialSpec.validateSpec(
            materialType, 
            productData.thicknessMM, 
            productData.quality
          );
          
          if (!validSpec) {
            errors.push(`Invalid ${materialType} specification: ${productData.thicknessMM}mm ${productData.quality} is not available`);
          } else {
            sanitizedData.thicknessMM = parseFloat(productData.thicknessMM);
            sanitizedData.quality = productData.quality;
            
            // Auto-set measurement type from MaterialSpec if not provided
            if (!productData.measurementType) {
              sanitizedData.measurementType = validSpec.defaultUnit;
            }
          }
        } catch (error) {
          // Fallback to basic validation if MaterialSpec is not available
          const thickness = parseFloat(productData.thicknessMM);
          const validThicknesses = [3, 4, 5, 6, 8, 10, 12, 15, 19, 25];
          
          if (isNaN(thickness) || !validThicknesses.includes(thickness)) {
            errors.push(`Thickness must be one of: ${validThicknesses.join(', ')} mm`);
          } else {
            sanitizedData.thicknessMM = thickness;
          }
          
          if (!['Local', 'Imported', 'Premium'].includes(productData.quality)) {
            errors.push('Quality must be Local, Imported, or Premium');
          } else {
            sanitizedData.quality = productData.quality;
          }
        }
      } else {
        // Individual validation if not both provided
        if (productData.thicknessMM === undefined || productData.thicknessMM === null) {
          errors.push('Thickness is required for Thai/Glass products');
        } else {
          const thickness = parseFloat(productData.thicknessMM);
          const validThicknesses = [3, 4, 5, 6, 8, 10, 12, 15, 19, 25];
          
          if (isNaN(thickness) || !validThicknesses.includes(thickness)) {
            errors.push(`Thickness must be one of: ${validThicknesses.join(', ')} mm`);
          } else {
            sanitizedData.thicknessMM = thickness;
          }
        }

        if (!productData.quality) {
          errors.push('Quality is required for Thai/Glass products');
        } else if (!['Local', 'Imported', 'Premium'].includes(productData.quality)) {
          errors.push('Quality must be Local, Imported, or Premium');
        } else {
          sanitizedData.quality = productData.quality;
        }
      }
    }

    // Validate measurement type
    if (!productData.measurementType) {
      errors.push('Measurement type is required');
    } else if (!['SFT', 'RFT', 'PANEL', 'SHEET', 'PIECE'].includes(productData.measurementType)) {
      errors.push('Measurement type must be SFT, RFT, PANEL, SHEET, or PIECE');
    } else {
      sanitizedData.measurementType = productData.measurementType;
      
      // Auto-set unit based on measurement type if not provided
      if (!productData.unit) {
        switch(productData.measurementType) {
          case 'SFT': sanitizedData.unit = 'sqft'; break;
          case 'RFT': sanitizedData.unit = 'rft'; break;
          case 'PANEL': sanitizedData.unit = 'panel'; break;
          case 'SHEET': sanitizedData.unit = 'sheet'; break;
          case 'PIECE': sanitizedData.unit = 'piece'; break;
          default: sanitizedData.unit = 'sqft';
        }
      }
    }

    // Validate unit if provided
    if (productData.unit) {
      const validUnits = ['sqft', 'rft', 'panel', 'sheet', 'piece', 'kg', 'meter'];
      if (!validUnits.includes(productData.unit)) {
        errors.push(`Unit must be one of: ${validUnits.join(', ')}`);
      } else {
        sanitizedData.unit = productData.unit;
      }
    }

    // Validate prices
    const purchasePriceValidation = MoneyValidator.validateAmount(
      productData.purchasePrice, 
      'Purchase price', 
      { allowZero: false, maxAmount: 1000000 }
    );
    if (!purchasePriceValidation.isValid) {
      errors.push(...purchasePriceValidation.errors);
    } else {
      sanitizedData.purchasePrice = purchasePriceValidation.sanitizedAmount;
    }

    const sellingPriceValidation = MoneyValidator.validateAmount(
      productData.sellingPrice, 
      'Selling price', 
      { allowZero: false, maxAmount: 1000000 }
    );
    if (!sellingPriceValidation.isValid) {
      errors.push(...sellingPriceValidation.errors);
    } else {
      sanitizedData.sellingPrice = sellingPriceValidation.sanitizedAmount;
    }

    // Validate selling price is not less than purchase price
    if (sanitizedData.sellingPrice && sanitizedData.purchasePrice) {
      if (sanitizedData.sellingPrice < sanitizedData.purchasePrice) {
        errors.push('Selling price cannot be less than purchase price');
      }
    }

    // Validate stock quantity
    if (productData.stockQuantity !== undefined) {
      if (!Number.isInteger(productData.stockQuantity) || productData.stockQuantity < 0) {
        errors.push('Stock quantity must be a non-negative integer');
      } else {
        sanitizedData.stockQuantity = productData.stockQuantity;
      }
    }

    // Validate description if provided
    if (productData.description) {
      if (productData.description.length > 500) {
        errors.push('Description cannot exceed 500 characters');
      } else {
        sanitizedData.description = productData.description.trim();
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData
    };
  },

  /**
   * Validate invoice data
   * @param {object} invoiceData - Invoice data to validate
   * @returns {object} Validation result
   */
  validateInvoice(invoiceData) {
    const errors = [];
    const sanitizedData = {};

    // Validate customer name
    const customerNameValidation = GeneralValidator.validateString(
      invoiceData.customerName, 
      'Customer name', 
      { minLength: 2, maxLength: 100 }
    );
    if (!customerNameValidation.isValid) {
      errors.push(...customerNameValidation.errors);
    } else {
      sanitizedData.customerName = customerNameValidation.sanitizedString;
    }

    // Validate items
    if (!invoiceData.items || !Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
      errors.push('Invoice must have at least one item');
    } else {
      sanitizedData.items = [];
      invoiceData.items.forEach((item, index) => {
        const itemErrors = [];
        const sanitizedItem = {};

        // Validate product ID
        const productIdValidation = GeneralValidator.validateObjectId(item.product, `Item ${index + 1} product`);
        if (!productIdValidation.isValid) {
          itemErrors.push(...productIdValidation.errors);
        } else {
          sanitizedItem.product = item.product;
        }

        // Validate quantity
        const quantityValidation = MoneyValidator.validateAmount(
          item.quantity, 
          `Item ${index + 1} quantity`, 
          { allowZero: false, maxAmount: 10000 }
        );
        if (!quantityValidation.isValid) {
          itemErrors.push(...quantityValidation.errors);
        } else {
          sanitizedItem.quantity = quantityValidation.sanitizedAmount;
        }

        // Validate unit price
        const unitPriceValidation = MoneyValidator.validateAmount(
          item.unitPrice, 
          `Item ${index + 1} unit price`, 
          { allowZero: false, maxAmount: 100000 }
        );
        if (!unitPriceValidation.isValid) {
          itemErrors.push(...unitPriceValidation.errors);
        } else {
          sanitizedItem.unitPrice = unitPriceValidation.sanitizedAmount;
        }

        if (itemErrors.length > 0) {
          errors.push(...itemErrors);
        } else {
          sanitizedItem.totalPrice = sanitizedItem.quantity * sanitizedItem.unitPrice;
          sanitizedData.items.push(sanitizedItem);
        }
      });
    }

    // Validate money calculations
    if (sanitizedData.items && sanitizedData.items.length > 0) {
      const subtotal = sanitizedData.items.reduce((sum, item) => sum + item.totalPrice, 0);
      sanitizedData.subtotal = subtotal;

      // Validate discount
      if (invoiceData.discount !== undefined) {
        const discountValidation = MoneyValidator.validateAmount(
          invoiceData.discount, 
          'Discount', 
          { 
            allowZero: true,
            maxAmount: invoiceData.discountType === 'percentage' ? 100 : subtotal 
          }
        );
        if (!discountValidation.isValid) {
          errors.push(...discountValidation.errors);
        } else {
          sanitizedData.discount = discountValidation.sanitizedAmount;
        }
      }

      // Calculate grand total
      let grandTotal = subtotal;
      if (sanitizedData.discount) {
        if (invoiceData.discountType === 'percentage') {
          grandTotal = subtotal - (subtotal * sanitizedData.discount / 100);
        } else {
          grandTotal = subtotal - sanitizedData.discount;
        }
      }
      sanitizedData.grandTotal = Math.max(0, grandTotal);

      // Validate paid amount
      if (invoiceData.paidAmount !== undefined) {
        const paidAmountValidation = MoneyValidator.validateAmount(
          invoiceData.paidAmount, 
          'Paid amount', 
          { 
            allowZero: true,
            maxAmount: sanitizedData.grandTotal 
          }
        );
        if (!paidAmountValidation.isValid) {
          errors.push(...paidAmountValidation.errors);
        } else {
          sanitizedData.paidAmount = paidAmountValidation.sanitizedAmount;
          sanitizedData.dueAmount = sanitizedData.grandTotal - sanitizedData.paidAmount;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData
    };
  },

  /**
   * Validate stock purchase data
   * @param {Object} purchaseData - Stock purchase data to validate
   * @returns {Object} Validation result
   */
  validateStockPurchase(purchaseData) {
    const errors = [];
    const sanitizedData = {};
    
    // Validate supplier
    if (!purchaseData.supplierId) {
      errors.push('Supplier is required');
    } else {
      const supplierValidation = GeneralValidator.validateObjectId(purchaseData.supplierId, 'Supplier');
      if (!supplierValidation.isValid) {
        errors.push(...supplierValidation.errors);
      } else {
        sanitizedData.supplierId = purchaseData.supplierId;
      }
    }
    
    // Validate items
    if (!purchaseData.items || !Array.isArray(purchaseData.items) || purchaseData.items.length === 0) {
      errors.push('At least one item is required');
    } else {
      sanitizedData.items = [];
      purchaseData.items.forEach((item, index) => {
        const itemErrors = [];
        const sanitizedItem = {};

        // Validate product ID
        const productIdValidation = GeneralValidator.validateObjectId(item.product, `Item ${index + 1} product`);
        if (!productIdValidation.isValid) {
          itemErrors.push(...productIdValidation.errors);
        } else {
          sanitizedItem.product = item.product;
        }
        
        // Validate quantity
        const quantityValidation = MoneyValidator.validateAmount(
          item.quantity, 
          `Item ${index + 1} quantity`, 
          { allowZero: false, maxAmount: 100000 }
        );
        if (!quantityValidation.isValid) {
          itemErrors.push(...quantityValidation.errors);
        } else {
          sanitizedItem.quantity = quantityValidation.sanitizedAmount;
        }
        
        // Validate purchase price
        const purchasePriceValidation = MoneyValidator.validateAmount(
          item.purchasePrice, 
          `Item ${index + 1} purchase price`, 
          { allowZero: true, maxAmount: 100000 }
        );
        if (!purchasePriceValidation.isValid) {
          itemErrors.push(...purchasePriceValidation.errors);
        } else {
          sanitizedItem.purchasePrice = purchasePriceValidation.sanitizedAmount;
        }

        if (itemErrors.length > 0) {
          errors.push(...itemErrors);
        } else {
          sanitizedData.items.push(sanitizedItem);
        }
      });
    }
    
    // Validate discount
    if (purchaseData.discount !== undefined) {
      const discountValidation = MoneyValidator.validateAmount(
        purchaseData.discount, 
        'Discount', 
        { 
          allowZero: true, 
          maxAmount: purchaseData.discountType === 'percentage' ? 100 : 1000000 
        }
      );
      if (!discountValidation.isValid) {
        errors.push(...discountValidation.errors);
      } else {
        sanitizedData.discount = discountValidation.sanitizedAmount;
        sanitizedData.discountType = purchaseData.discountType || 'amount';
      }
    }
    
    // Validate paid amount
    if (purchaseData.paidAmount !== undefined) {
      const paidAmountValidation = MoneyValidator.validateAmount(
        purchaseData.paidAmount, 
        'Paid amount', 
        { allowZero: true, maxAmount: 10000000 }
      );
      if (!paidAmountValidation.isValid) {
        errors.push(...paidAmountValidation.errors);
      } else {
        sanitizedData.paidAmount = paidAmountValidation.sanitizedAmount;
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData
    };
  }
};