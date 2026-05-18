/**
 * Currency Service
 * Handles all currency formatting and validation for BDT (Bangladeshi Taka)
 */

class CurrencyService {
  static CURRENCY_CODE = 'BDT';
  static CURRENCY_SYMBOL = '৳';
  static LOCALE = 'bn-BD';
  static FALLBACK_LOCALE = 'en-US';

  /**
   * Format amount as BDT currency
   * @param {number} amount - Amount to format
   * @param {object} options - Formatting options
   * @returns {string} Formatted currency string
   */
  static formatBDT(amount, options = {}) {
    const {
      showSymbol = true,
      showCode = false,
      minimumFractionDigits = 2,
      maximumFractionDigits = 2,
      useGrouping = true,
      symbolPosition = 'before' // 'before' or 'after'
    } = options;

    // Handle null, undefined, or invalid amounts
    if (amount === null || amount === undefined || isNaN(amount)) {
      return showSymbol ? `${this.CURRENCY_SYMBOL}0.00` : '0.00';
    }

    const numAmount = parseFloat(amount);
    
    try {
      // Format the number
      const formatter = new Intl.NumberFormat(this.LOCALE, {
        minimumFractionDigits,
        maximumFractionDigits,
        useGrouping
      });

      let formattedNumber = formatter.format(Math.abs(numAmount));
      
      // Add currency symbol and/or code
      let result = formattedNumber;
      
      if (showSymbol) {
        if (symbolPosition === 'before') {
          result = `${this.CURRENCY_SYMBOL}${formattedNumber}`;
        } else {
          result = `${formattedNumber} ${this.CURRENCY_SYMBOL}`;
        }
      }
      
      if (showCode) {
        result = showSymbol ? `${result} ${this.CURRENCY_CODE}` : `${formattedNumber} ${this.CURRENCY_CODE}`;
      }
      
      // Add negative sign if needed
      if (numAmount < 0) {
        result = `-${result}`;
      }
      
      return result;
    } catch (error) {
      // Fallback formatting
      const formattedAmount = Math.abs(numAmount).toFixed(maximumFractionDigits);
      const sign = numAmount < 0 ? '-' : '';
      
      if (showSymbol) {
        return symbolPosition === 'before' 
          ? `${sign}${this.CURRENCY_SYMBOL}${formattedAmount}`
          : `${sign}${formattedAmount} ${this.CURRENCY_SYMBOL}`;
      }
      
      return `${sign}${formattedAmount}`;
    }
  }

  /**
   * Format amount for display in different contexts
   * @param {number} amount - Amount to format
   * @param {string} context - Display context
   * @returns {string} Formatted currency string
   */
  static formatForContext(amount, context = 'default') {
    switch (context) {
      case 'invoice':
        return this.formatBDT(amount, {
          showSymbol: true,
          showCode: false,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          useGrouping: true
        });
      
      case 'report':
        return this.formatBDT(amount, {
          showSymbol: true,
          showCode: true,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          useGrouping: true
        });
      
      case 'compact':
        return this.formatBDT(amount, {
          showSymbol: true,
          showCode: false,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
          useGrouping: true
        });
      
      case 'precise':
        return this.formatBDT(amount, {
          showSymbol: true,
          showCode: false,
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
          useGrouping: true
        });
      
      case 'api':
        // For API responses - no symbol, just formatted number
        return this.formatBDT(amount, {
          showSymbol: false,
          showCode: false,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          useGrouping: false
        });
      
      default:
        return this.formatBDT(amount);
    }
  }

  /**
   * Parse currency string to number
   * @param {string} currencyString - Currency string to parse
   * @returns {number} Parsed amount
   */
  static parseCurrency(currencyString) {
    if (typeof currencyString === 'number') {
      return currencyString;
    }

    if (!currencyString || typeof currencyString !== 'string') {
      return 0;
    }

    // Remove currency symbols, codes, and spaces
    const cleanString = currencyString
      .replace(/[৳$€£¥₹,\s]/g, '') // Remove common currency symbols
      .replace(/BDT|USD|EUR|GBP|JPY|INR/gi, '') // Remove currency codes
      .replace(/[^\d.-]/g, ''); // Keep only digits, dots, and minus

    const parsed = parseFloat(cleanString);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Validate currency amount
   * @param {any} amount - Amount to validate
   * @param {object} options - Validation options
   * @returns {object} Validation result
   */
  static validateAmount(amount, options = {}) {
    const {
      allowZero = true,
      allowNegative = false,
      minAmount = null,
      maxAmount = null,
      fieldName = 'Amount'
    } = options;

    const errors = [];
    let numAmount;

    // Parse amount
    if (typeof amount === 'string') {
      numAmount = this.parseCurrency(amount);
    } else {
      numAmount = parseFloat(amount);
    }

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
      errors.push(`${fieldName} must be at least ${this.formatBDT(minAmount)}`);
    }

    // Check maximum amount
    if (maxAmount !== null && numAmount > maxAmount) {
      errors.push(`${fieldName} cannot exceed ${this.formatBDT(maxAmount)}`);
    }

    // Round to 2 decimal places for BDT
    const sanitizedAmount = Math.round(numAmount * 100) / 100;

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedAmount,
      formattedAmount: this.formatBDT(sanitizedAmount)
    };
  }

  /**
   * Calculate percentage
   * @param {number} amount - Base amount
   * @param {number} percentage - Percentage to calculate
   * @returns {object} Calculation result
   */
  static calculatePercentage(amount, percentage) {
    const baseAmount = this.parseCurrency(amount);
    const percentValue = parseFloat(percentage);

    if (isNaN(baseAmount) || isNaN(percentValue)) {
      return {
        isValid: false,
        error: 'Invalid amount or percentage',
        result: 0
      };
    }

    const result = (baseAmount * percentValue) / 100;
    const roundedResult = Math.round(result * 100) / 100;

    return {
      isValid: true,
      result: roundedResult,
      formattedResult: this.formatBDT(roundedResult),
      calculation: `${this.formatBDT(baseAmount)} × ${percentValue}% = ${this.formatBDT(roundedResult)}`
    };
  }

  /**
   * Calculate discount
   * @param {number} originalAmount - Original amount
   * @param {number} discount - Discount amount or percentage
   * @param {string} discountType - 'amount' or 'percentage'
   * @returns {object} Calculation result
   */
  static calculateDiscount(originalAmount, discount, discountType = 'amount') {
    const baseAmount = this.parseCurrency(originalAmount);
    const discountValue = this.parseCurrency(discount);

    if (isNaN(baseAmount) || isNaN(discountValue)) {
      return {
        isValid: false,
        error: 'Invalid amounts provided',
        finalAmount: baseAmount || 0
      };
    }

    let discountAmount = 0;
    let finalAmount = baseAmount;

    if (discountType === 'percentage') {
      if (discountValue > 100) {
        return {
          isValid: false,
          error: 'Discount percentage cannot exceed 100%',
          finalAmount: baseAmount
        };
      }
      discountAmount = (baseAmount * discountValue) / 100;
    } else {
      discountAmount = discountValue;
    }

    if (discountAmount > baseAmount) {
      return {
        isValid: false,
        error: 'Discount amount cannot exceed the original amount',
        finalAmount: baseAmount
      };
    }

    finalAmount = baseAmount - discountAmount;
    finalAmount = Math.max(0, Math.round(finalAmount * 100) / 100);
    discountAmount = Math.round(discountAmount * 100) / 100;

    return {
      isValid: true,
      originalAmount: baseAmount,
      discountAmount,
      finalAmount,
      formattedOriginal: this.formatBDT(baseAmount),
      formattedDiscount: this.formatBDT(discountAmount),
      formattedFinal: this.formatBDT(finalAmount),
      discountPercentage: baseAmount > 0 ? Math.round((discountAmount / baseAmount) * 10000) / 100 : 0
    };
  }

  /**
   * Sum multiple currency amounts
   * @param {array} amounts - Array of amounts to sum
   * @returns {object} Sum result
   */
  static sumAmounts(amounts) {
    if (!Array.isArray(amounts)) {
      return {
        isValid: false,
        error: 'Amounts must be provided as an array',
        total: 0
      };
    }

    let total = 0;
    const invalidAmounts = [];

    amounts.forEach((amount, index) => {
      const parsed = this.parseCurrency(amount);
      if (isNaN(parsed)) {
        invalidAmounts.push(`Amount at index ${index}: ${amount}`);
      } else {
        total += parsed;
      }
    });

    total = Math.round(total * 100) / 100;

    return {
      isValid: invalidAmounts.length === 0,
      total,
      formattedTotal: this.formatBDT(total),
      invalidAmounts,
      validCount: amounts.length - invalidAmounts.length
    };
  }

  /**
   * Convert amount to words (in Bengali/English)
   * @param {number} amount - Amount to convert
   * @param {string} language - 'en' or 'bn'
   * @returns {string} Amount in words
   */
  static toWords(amount, language = 'en') {
    const numAmount = this.parseCurrency(amount);
    
    if (isNaN(numAmount) || numAmount < 0) {
      return language === 'bn' ? 'অবৈধ পরিমাণ' : 'Invalid amount';
    }

    // This is a simplified version - in production, you might want to use a library
    // like 'number-to-words' or implement a complete Bengali number-to-words converter
    
    if (language === 'bn') {
      // Simplified Bengali conversion (you'd want a complete implementation)
      if (numAmount === 0) return 'শূন্য টাকা';
      if (numAmount === 1) return 'এক টাকা';
      // ... implement full Bengali number conversion
      return `${numAmount} টাকা`;
    } else {
      // English conversion
      if (numAmount === 0) return 'Zero Taka';
      
      const wholePart = Math.floor(numAmount);
      const decimalPart = Math.round((numAmount - wholePart) * 100);
      
      let result = this.numberToWords(wholePart) + ' Taka';
      
      if (decimalPart > 0) {
        result += ` and ${this.numberToWords(decimalPart)} Paisa`;
      }
      
      return result;
    }
  }

  /**
   * Helper method to convert number to words (English)
   * @param {number} num - Number to convert
   * @returns {string} Number in words
   */
  static numberToWords(num) {
    if (num === 0) return 'Zero';
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const thousands = ['', 'Thousand', 'Million', 'Billion'];
    
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + this.numberToWords(num % 100) : '');
    
    for (let i = 0; i < thousands.length; i++) {
      const unit = Math.pow(1000, i + 1);
      if (num < unit) {
        const quotient = Math.floor(num / Math.pow(1000, i));
        const remainder = num % Math.pow(1000, i);
        return this.numberToWords(quotient) + ' ' + thousands[i] + (remainder !== 0 ? ' ' + this.numberToWords(remainder) : '');
      }
    }
    
    return num.toString(); // Fallback for very large numbers
  }

  /**
   * Get currency configuration for frontend
   * @returns {object} Currency configuration
   */
  static getConfig() {
    return {
      code: this.CURRENCY_CODE,
      symbol: this.CURRENCY_SYMBOL,
      locale: this.LOCALE,
      name: 'Bangladeshi Taka',
      nameBengali: 'বাংলাদেশী টাকা',
      subunit: 'Paisa',
      subunitBengali: 'পয়সা',
      symbolPosition: 'before',
      decimalPlaces: 2,
      thousandsSeparator: ',',
      decimalSeparator: '.'
    };
  }
}

export default CurrencyService;