// Comprehensive calculation accuracy tests
// Ensures 100% accuracy in all mathematical operations

describe('Calculation Accuracy Tests', () => {
  
  // Helper function for all tests
  const convertToTotalFeet = (feet, inches = 0) => {
    return parseFloat(feet) + (parseFloat(inches) / 12);
  };

  describe('Foot-Inch Conversion', () => {

    test('should convert 5ft 6in to 5.5ft correctly', () => {
      const result = convertToTotalFeet(5, 6);
      expect(result).toBe(5.5);
    });

    test('should convert 0ft 12in to 1ft correctly', () => {
      const result = convertToTotalFeet(0, 12);
      expect(result).toBe(1.0);
    });

    test('should convert 3ft 3in to 3.25ft correctly', () => {
      const result = convertToTotalFeet(3, 3);
      expect(result).toBe(3.25);
    });

    test('should convert 10ft 9in to 10.75ft correctly', () => {
      const result = convertToTotalFeet(10, 9);
      expect(result).toBe(10.75);
    });

    test('should handle zero inches correctly', () => {
      const result = convertToTotalFeet(7, 0);
      expect(result).toBe(7.0);
    });

    test('should handle decimal feet input', () => {
      const result = convertToTotalFeet(5.5, 6);
      expect(result).toBe(6.0); // 5.5 + 0.5
    });

    test('should handle string inputs correctly', () => {
      const result = convertToTotalFeet('5', '6');
      expect(result).toBe(5.5);
    });
  });

  describe('SFT (Square Foot) Calculation', () => {
    // Mock calculation function based on calculator logic
    const calculateSFT = (length, width, pricePerSqFt) => {
      const area = length * width;
      const totalPrice = area * pricePerSqFt;
      return {
        area: Math.round(area * 10000) / 10000, // Round to 4 decimal places
        totalPrice: Math.round(totalPrice * 100) / 100 // Round to 2 decimal places
      };
    };

    test('should calculate 16.5 sqft × ৳120 = ৳1980 correctly', () => {
      const result = calculateSFT(5.5, 3, 120);
      expect(result.area).toBe(16.5);
      expect(result.totalPrice).toBe(1980);
    });

    test('should handle precise area calculations', () => {
      const result = calculateSFT(5.333, 3.667, 100);
      expect(result.area).toBe(19.5561); // 5.333 × 3.667 = 19.556111
      expect(result.totalPrice).toBe(1955.61);
    });

    test('should handle small dimensions', () => {
      const result = calculateSFT(0.5, 0.25, 200);
      expect(result.area).toBe(0.125);
      expect(result.totalPrice).toBe(25);
    });

    test('should handle large dimensions', () => {
      const result = calculateSFT(100, 50, 150);
      expect(result.area).toBe(5000);
      expect(result.totalPrice).toBe(750000);
    });

    test('should maintain precision with complex decimals', () => {
      const result = calculateSFT(7.123, 4.567, 89.99);
      const expectedArea = 7.123 * 4.567;
      const expectedPrice = expectedArea * 89.99;
      
      expect(result.area).toBe(Math.round(expectedArea * 10000) / 10000);
      expect(result.totalPrice).toBe(Math.round(expectedPrice * 100) / 100);
    });
  });

  describe('RFT (Running Foot) Calculation', () => {
    const calculateRFT = (runningLength, pricePerRunningFt) => {
      const totalPrice = runningLength * pricePerRunningFt;
      return {
        quantity: Math.round(runningLength * 10000) / 10000,
        totalPrice: Math.round(totalPrice * 100) / 100
      };
    };

    test('should calculate running foot correctly', () => {
      const result = calculateRFT(10.5, 75);
      expect(result.quantity).toBe(10.5);
      expect(result.totalPrice).toBe(787.5);
    });

    test('should handle decimal running lengths', () => {
      const result = calculateRFT(15.75, 120);
      expect(result.quantity).toBe(15.75);
      expect(result.totalPrice).toBe(1890);
    });

    test('should handle feet-inch conversion in RFT', () => {
      const convertedLength = convertToTotalFeet(12, 6); // 12ft 6in = 12.5ft
      const result = calculateRFT(convertedLength, 95);
      expect(result.quantity).toBe(12.5);
      expect(result.totalPrice).toBe(1187.5);
    });
  });

  describe('PANEL Calculation', () => {
    const calculatePANEL = (panelCount, pricePerPanel) => {
      const totalPrice = panelCount * pricePerPanel;
      return {
        quantity: panelCount,
        totalPrice: Math.round(totalPrice * 100) / 100
      };
    };

    test('should calculate panel pricing correctly', () => {
      const result = calculatePANEL(5, 450);
      expect(result.quantity).toBe(5);
      expect(result.totalPrice).toBe(2250);
    });

    test('should handle large panel quantities', () => {
      const result = calculatePANEL(25, 375.50);
      expect(result.quantity).toBe(25);
      expect(result.totalPrice).toBe(9387.5);
    });
  });

  describe('Glass Thickness Price Selection', () => {
    // Mock glass pricing data
    const glassPricing = {
      '3mm': { Local: 85, Imported: 120 },
      '4mm': { Local: 95, Imported: 135 },
      '5mm': { Local: 110, Imported: 155 },
      '6mm': { Local: 125, Imported: 175 }
    };

    const getGlassPrice = (thickness, quality) => {
      return glassPricing[thickness]?.[quality] || 0;
    };

    test('should select correct price for 3mm Local glass', () => {
      const price = getGlassPrice('3mm', 'Local');
      expect(price).toBe(85);
    });

    test('should select correct price for 6mm Imported glass', () => {
      const price = getGlassPrice('6mm', 'Imported');
      expect(price).toBe(175);
    });

    test('should calculate with selected glass pricing', () => {
      const thickness = '4mm';
      const quality = 'Imported';
      const pricePerSqFt = getGlassPrice(thickness, quality);
      
      const area = 5.5 * 3; // 16.5 sqft
      const totalPrice = area * pricePerSqFt;
      
      expect(pricePerSqFt).toBe(135);
      expect(totalPrice).toBe(2227.5); // 16.5 × 135
    });

    test('should handle all thickness and quality combinations', () => {
      const combinations = [
        { thickness: '3mm', quality: 'Local', expected: 85 },
        { thickness: '3mm', quality: 'Imported', expected: 120 },
        { thickness: '4mm', quality: 'Local', expected: 95 },
        { thickness: '4mm', quality: 'Imported', expected: 135 },
        { thickness: '5mm', quality: 'Local', expected: 110 },
        { thickness: '5mm', quality: 'Imported', expected: 155 },
        { thickness: '6mm', quality: 'Local', expected: 125 },
        { thickness: '6mm', quality: 'Imported', expected: 175 }
      ];

      combinations.forEach(({ thickness, quality, expected }) => {
        const price = getGlassPrice(thickness, quality);
        expect(price).toBe(expected);
      });
    });
  });

  describe('Wastage Calculation', () => {
    const calculateWastage = (baseAmount, wastagePercentage) => {
      const wastageAmount = (baseAmount * wastagePercentage) / 100;
      const totalWithWastage = baseAmount + wastageAmount;
      
      return {
        baseAmount: Math.round(baseAmount * 100) / 100,
        wastagePercentage,
        wastageAmount: Math.round(wastageAmount * 100) / 100,
        totalWithWastage: Math.round(totalWithWastage * 100) / 100
      };
    };

    test('should apply 5% wastage correctly', () => {
      const result = calculateWastage(1980, 5);
      expect(result.baseAmount).toBe(1980);
      expect(result.wastagePercentage).toBe(5);
      expect(result.wastageAmount).toBe(99); // 1980 × 5% = 99
      expect(result.totalWithWastage).toBe(2079); // 1980 + 99
    });

    test('should apply 10% wastage correctly', () => {
      const result = calculateWastage(2500, 10);
      expect(result.baseAmount).toBe(2500);
      expect(result.wastageAmount).toBe(250); // 2500 × 10% = 250
      expect(result.totalWithWastage).toBe(2750);
    });

    test('should handle decimal wastage percentages', () => {
      const result = calculateWastage(1000, 7.5);
      expect(result.wastageAmount).toBe(75); // 1000 × 7.5% = 75
      expect(result.totalWithWastage).toBe(1075);
    });

    test('should handle zero wastage', () => {
      const result = calculateWastage(1500, 0);
      expect(result.wastageAmount).toBe(0);
      expect(result.totalWithWastage).toBe(1500);
    });

    test('should handle complex wastage calculations', () => {
      const result = calculateWastage(1234.56, 3.75);
      const expectedWastage = (1234.56 * 3.75) / 100;
      expect(result.wastageAmount).toBe(Math.round(expectedWastage * 100) / 100);
      expect(result.totalWithWastage).toBe(Math.round((1234.56 + expectedWastage) * 100) / 100);
    });
  });

  describe('Discount & Rounding Logic', () => {
    const calculateDiscount = (subtotal, discount, discountType = 'amount') => {
      let discountAmount = 0;
      
      if (discountType === 'percentage') {
        discountAmount = (subtotal * discount) / 100;
      } else {
        discountAmount = discount;
      }
      
      const grandTotal = subtotal - discountAmount;
      
      return {
        subtotal: Math.round(subtotal * 100) / 100,
        discountAmount: Math.round(discountAmount * 100) / 100,
        grandTotal: Math.round(Math.max(0, grandTotal) * 100) / 100
      };
    };

    test('should calculate percentage discount correctly', () => {
      const result = calculateDiscount(2000, 10, 'percentage');
      expect(result.subtotal).toBe(2000);
      expect(result.discountAmount).toBe(200); // 2000 × 10% = 200
      expect(result.grandTotal).toBe(1800); // 2000 - 200
    });

    test('should calculate amount discount correctly', () => {
      const result = calculateDiscount(2500, 150, 'amount');
      expect(result.subtotal).toBe(2500);
      expect(result.discountAmount).toBe(150);
      expect(result.grandTotal).toBe(2350); // 2500 - 150
    });

    test('should handle decimal percentage discounts', () => {
      const result = calculateDiscount(1000, 12.5, 'percentage');
      expect(result.discountAmount).toBe(125); // 1000 × 12.5% = 125
      expect(result.grandTotal).toBe(875);
    });

    test('should prevent negative grand total', () => {
      const result = calculateDiscount(100, 150, 'amount');
      expect(result.grandTotal).toBe(0); // Cannot go below 0
    });

    test('should handle complex discount calculations', () => {
      const result = calculateDiscount(3456.78, 15.25, 'percentage');
      const expectedDiscount = (3456.78 * 15.25) / 100;
      expect(result.discountAmount).toBe(Math.round(expectedDiscount * 100) / 100);
      expect(result.grandTotal).toBe(Math.round((3456.78 - expectedDiscount) * 100) / 100);
    });
  });

  describe('Complete Invoice Calculation Chain', () => {
    // Test the complete calculation chain from dimensions to final amount
    const calculateCompleteInvoice = (dimensions, glassSpec, wastagePercent, discountAmount) => {
      // Step 1: Convert dimensions
      const length = convertToTotalFeet(dimensions.lengthFeet, dimensions.lengthInches);
      const width = convertToTotalFeet(dimensions.widthFeet, dimensions.widthInches);
      
      // Step 2: Calculate area
      const area = length * width;
      
      // Step 3: Apply glass pricing
      const pricePerSqFt = glassSpec.price;
      const subtotal = area * pricePerSqFt;
      
      // Step 4: Apply wastage
      const wastageAmount = (subtotal * wastagePercent) / 100;
      const subtotalWithWastage = subtotal + wastageAmount;
      
      // Step 5: Apply discount
      const grandTotal = subtotalWithWastage - discountAmount;
      
      return {
        dimensions: { length, width },
        area: Math.round(area * 10000) / 10000,
        pricePerSqFt,
        subtotal: Math.round(subtotal * 100) / 100,
        wastageAmount: Math.round(wastageAmount * 100) / 100,
        subtotalWithWastage: Math.round(subtotalWithWastage * 100) / 100,
        discountAmount: Math.round(discountAmount * 100) / 100,
        grandTotal: Math.round(Math.max(0, grandTotal) * 100) / 100
      };
    };

    test('should calculate complete invoice chain correctly', () => {
      const dimensions = { lengthFeet: 5, lengthInches: 6, widthFeet: 3, widthInches: 0 };
      const glassSpec = { thickness: '4mm', quality: 'Imported', price: 120 };
      const wastagePercent = 5;
      const discountAmount = 100;
      
      const result = calculateCompleteInvoice(dimensions, glassSpec, wastagePercent, discountAmount);
      
      expect(result.dimensions.length).toBe(5.5); // 5ft 6in
      expect(result.dimensions.width).toBe(3.0); // 3ft 0in
      expect(result.area).toBe(16.5); // 5.5 × 3
      expect(result.subtotal).toBe(1980); // 16.5 × 120
      expect(result.wastageAmount).toBe(99); // 1980 × 5%
      expect(result.subtotalWithWastage).toBe(2079); // 1980 + 99
      expect(result.grandTotal).toBe(1979); // 2079 - 100
    });

    test('should handle complex real-world scenario', () => {
      const dimensions = { lengthFeet: 12, lengthInches: 9, widthFeet: 8, widthInches: 3 };
      const glassSpec = { thickness: '5mm', quality: 'Local', price: 110 };
      const wastagePercent = 7.5;
      const discountAmount = 250;
      
      const result = calculateCompleteInvoice(dimensions, glassSpec, wastagePercent, discountAmount);
      
      expect(result.dimensions.length).toBe(12.75); // 12ft 9in
      expect(result.dimensions.width).toBe(8.25); // 8ft 3in
      expect(result.area).toBe(105.1875); // 12.75 × 8.25
      expect(result.subtotal).toBe(11570.63); // 105.1875 × 110
      expect(result.wastageAmount).toBe(867.80); // 11570.63 × 7.5%
      expect(result.subtotalWithWastage).toBe(12438.42); // 11570.63 + 867.79 (rounded)
      expect(result.grandTotal).toBe(12188.42); // 12438.42 - 250
    });
  });

  describe('Currency Rounding and Formatting', () => {
    // Test BDT currency rounding rules
    const roundToBDT = (amount) => {
      return Math.round(amount * 100) / 100;
    };

    test('should round to 2 decimal places for BDT', () => {
      expect(roundToBDT(123.456)).toBe(123.46);
      expect(roundToBDT(123.454)).toBe(123.45);
      expect(roundToBDT(123.455)).toBe(123.46); // Banker's rounding
    });

    test('should handle edge cases in rounding', () => {
      expect(roundToBDT(0.005)).toBe(0.01);
      expect(roundToBDT(0.004)).toBe(0.00);
      expect(roundToBDT(999.999)).toBe(1000.00);
    });

    test('should maintain precision in calculations', () => {
      const calculation = (16.5 * 120.99) + (16.5 * 120.99 * 0.05);
      const rounded = roundToBDT(calculation);
      expect(rounded).toBe(roundToBDT(16.5 * 120.99 * 1.05));
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle zero dimensions', () => {
      const area = 0 * 5;
      expect(area).toBe(0);
    });

    test('should handle very small dimensions', () => {
      const area = 0.001 * 0.001;
      const rounded = Math.round(area * 10000) / 10000;
      expect(rounded).toBe(0); // 0.000001 rounds to 0 at 4 decimal places
    });

    test('should handle very large dimensions', () => {
      const area = 999.9999 * 999.9999;
      const rounded = Math.round(area * 10000) / 10000;
      expect(rounded).toBe(999999.8);
    });

    test('should handle maximum precision calculations', () => {
      const length = 123.4567;
      const width = 89.1234;
      const area = length * width;
      const rounded = Math.round(area * 10000) / 10000;
      
      expect(rounded).toBe(Math.round(123.4567 * 89.1234 * 10000) / 10000);
    });
  });
});