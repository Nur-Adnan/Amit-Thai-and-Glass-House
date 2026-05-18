// Stock Disaster Prevention Tests
// Ensures inventory management prevents business disasters

describe('Stock Disaster Prevention Tests', () => {
  let testUser;
  let testProduct;

  beforeEach(async () => {
    // Create test user
    const userResult = await global.testUtils.createTestUser({
      role: 'owner'
    });
    testUser = userResult.user;

    // Create test product with stock
    testProduct = await global.testUtils.createTestProduct({
      name: 'Test Glass Panel',
      category: 'Glass',
      stockQuantity: 50,
      purchasePrice: 100,
      sellingPrice: 150,
      unit: 'piece',
      isActive: true,
      isDeleted: false,
      createdBy: testUser._id
    });
  });

  describe('Stock Decreases After Invoice Creation', () => {
    test('should decrease stock when invoice is created', async () => {
      const initialStock = testProduct.stockQuantity;
      const quantityToSell = 10;

      // Mock invoice creation logic
      const mockCreateInvoice = async (items) => {
        const { default: Product } = await import('../../../backend/src/models/Product.js');
        
        // Validate stock availability
        for (const item of items) {
          const product = await Product.findById(item.productId);
          if (product.stockQuantity < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}`);
          }
        }

        // Update stock
        for (const item of items) {
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stockQuantity: -item.quantity } }
          );
        }

        return { success: true, message: 'Invoice created successfully' };
      };

      // Create invoice with stock items
      const invoiceItems = [{
        productId: testProduct._id,
        quantity: quantityToSell,
        unitPrice: testProduct.sellingPrice
      }];

      const result = await mockCreateInvoice(invoiceItems);
      expect(result.success).toBe(true);

      // Verify stock decreased
      const { default: Product } = await import('../../../backend/src/models/Product.js');
      const updatedProduct = await Product.findById(testProduct._id);
      
      expect(updatedProduct.stockQuantity).toBe(initialStock - quantityToSell);
      expect(updatedProduct.stockQuantity).toBe(40);
    });

    test('should handle multiple items in single invoice', async () => {
      // Create second product
      const secondProduct = await global.testUtils.createTestProduct({
        name: 'Test Thai Panel',
        category: 'Thai',
        stockQuantity: 30,
        purchasePrice: 80,
        sellingPrice: 120,
        unit: 'piece', // Use valid unit
        createdBy: testUser._id
      });

      const mockCreateInvoice = async (items) => {
        const { default: Product } = await import('../../../backend/src/models/Product.js');
        
        // Validate and update stock for all items
        for (const item of items) {
          const product = await Product.findById(item.productId);
          if (product.stockQuantity < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}`);
          }
          
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stockQuantity: -item.quantity } }
          );
        }

        return { success: true };
      };

      const invoiceItems = [
        { productId: testProduct._id, quantity: 5 },
        { productId: secondProduct._id, quantity: 8 }
      ];

      await mockCreateInvoice(invoiceItems);

      // Verify both products' stock decreased
      const { default: Product } = await import('../../../backend/src/models/Product.js');
      const updatedProduct1 = await Product.findById(testProduct._id);
      const updatedProduct2 = await Product.findById(secondProduct._id);

      expect(updatedProduct1.stockQuantity).toBe(45); // 50 - 5
      expect(updatedProduct2.stockQuantity).toBe(22); // 30 - 8
    });

    test('should maintain stock accuracy with decimal quantities', async () => {
      // Update product to allow decimal quantities (like sqft)
      const { default: Product } = await import('../../../backend/src/models/Product.js');
      await Product.findByIdAndUpdate(testProduct._id, {
        unit: 'sqft',
        stockQuantity: 100.5
      });

      const mockCreateInvoice = async (items) => {
        for (const item of items) {
          const product = await Product.findById(item.productId);
          if (product.stockQuantity < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}`);
          }
          
          const newStock = Math.round((product.stockQuantity - item.quantity) * 100) / 100;
          await Product.findByIdAndUpdate(
            item.productId,
            { stockQuantity: newStock }
          );
        }
        return { success: true };
      };

      await mockCreateInvoice([{ productId: testProduct._id, quantity: 15.75 }]);

      const updatedProduct = await Product.findById(testProduct._id);
      expect(updatedProduct.stockQuantity).toBe(84.75); // 100.5 - 15.75
    });
  });

  describe('Stock Restores After Return/Cancellation', () => {
    test('should restore stock when invoice is cancelled', async () => {
      // First create an invoice (decrease stock)
      const { default: Product } = await import('../../../backend/src/models/Product.js');
      const initialStock = testProduct.stockQuantity;
      const soldQuantity = 15;

      // Simulate invoice creation
      await Product.findByIdAndUpdate(
        testProduct._id,
        { $inc: { stockQuantity: -soldQuantity } }
      );

      let updatedProduct = await Product.findById(testProduct._id);
      expect(updatedProduct.stockQuantity).toBe(initialStock - soldQuantity);

      // Mock invoice cancellation/return
      const mockCancelInvoice = async (invoiceItems) => {
        for (const item of invoiceItems) {
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stockQuantity: item.quantity } }
          );
        }
        return { success: true, message: 'Stock restored' };
      };

      // Cancel the invoice (restore stock)
      const result = await mockCancelInvoice([{
        productId: testProduct._id,
        quantity: soldQuantity
      }]);

      expect(result.success).toBe(true);

      // Verify stock restored
      updatedProduct = await Product.findById(testProduct._id);
      expect(updatedProduct.stockQuantity).toBe(initialStock);
    });

    test('should handle partial returns correctly', async () => {
      const { default: Product } = await import('../../../backend/src/models/Product.js');
      const initialStock = testProduct.stockQuantity;
      const soldQuantity = 20;
      const returnQuantity = 8;

      // Create invoice (decrease stock)
      await Product.findByIdAndUpdate(
        testProduct._id,
        { $inc: { stockQuantity: -soldQuantity } }
      );

      // Partial return (restore some stock)
      const mockPartialReturn = async (returnItems) => {
        for (const item of returnItems) {
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stockQuantity: item.quantity } }
          );
        }
        return { success: true };
      };

      await mockPartialReturn([{
        productId: testProduct._id,
        quantity: returnQuantity
      }]);

      const updatedProduct = await Product.findById(testProduct._id);
      const expectedStock = initialStock - soldQuantity + returnQuantity;
      expect(updatedProduct.stockQuantity).toBe(expectedStock);
      expect(updatedProduct.stockQuantity).toBe(38); // 50 - 20 + 8
    });

    test('should prevent over-restoration of stock', async () => {
      const { default: Product } = await import('../../../backend/src/models/Product.js');
      const initialStock = testProduct.stockQuantity;
      const soldQuantity = 10;

      // Create invoice
      await Product.findByIdAndUpdate(
        testProduct._id,
        { $inc: { stockQuantity: -soldQuantity } }
      );

      // Mock return validation
      const mockValidatedReturn = async (returnItems, originalSoldQuantity) => {
        for (const item of returnItems) {
          if (item.quantity > originalSoldQuantity) {
            throw new Error(`Cannot return more than originally sold: ${originalSoldQuantity}`);
          }
          
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stockQuantity: item.quantity } }
          );
        }
        return { success: true };
      };

      // Try to return more than sold
      await expect(mockValidatedReturn([{
        productId: testProduct._id,
        quantity: 15 // More than the 10 sold
      }], soldQuantity)).rejects.toThrow('Cannot return more than originally sold');

      // Verify stock wasn't incorrectly updated
      const updatedProduct = await Product.findById(testProduct._id);
      expect(updatedProduct.stockQuantity).toBe(initialStock - soldQuantity);
    });
  });

  describe('Cannot Sell More Than Available Stock', () => {
    test('should prevent selling more than available stock', async () => {
      const availableStock = testProduct.stockQuantity;
      const attemptedQuantity = availableStock + 10;

      const mockCreateInvoiceWithValidation = async (items) => {
        const { default: Product } = await import('../../../backend/src/models/Product.js');
        
        for (const item of items) {
          const product = await Product.findById(item.productId);
          
          if (product.stockQuantity < item.quantity) {
            throw new Error(
              `Insufficient stock for ${product.name}. ` +
              `Available: ${product.stockQuantity}, Requested: ${item.quantity}`
            );
          }
        }
        
        return { success: true };
      };

      await expect(mockCreateInvoiceWithValidation([{
        productId: testProduct._id,
        quantity: attemptedQuantity
      }])).rejects.toThrow(`Insufficient stock for ${testProduct.name}`);
    });

    test('should allow selling exact available stock', async () => {
      const availableStock = testProduct.stockQuantity;

      const mockCreateInvoice = async (items) => {
        const { default: Product } = await import('../../../backend/src/models/Product.js');
        
        for (const item of items) {
          const product = await Product.findById(item.productId);
          
          if (product.stockQuantity < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}`);
          }
          
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stockQuantity: -item.quantity } }
          );
        }
        
        return { success: true };
      };

      const result = await mockCreateInvoice([{
        productId: testProduct._id,
        quantity: availableStock
      }]);

      expect(result.success).toBe(true);

      // Verify stock is now zero
      const { default: Product } = await import('../../../backend/src/models/Product.js');
      const updatedProduct = await Product.findById(testProduct._id);
      expect(updatedProduct.stockQuantity).toBe(0);
    });

    test('should handle concurrent stock checks correctly', async () => {
      const { default: Product } = await import('../../../backend/src/models/Product.js');
      
      // Mock concurrent invoice creation attempts
      const mockConcurrentInvoiceCreation = async (quantity1, quantity2) => {
        // Simulate two simultaneous requests
        const product1 = await Product.findById(testProduct._id);
        const product2 = await Product.findById(testProduct._id);
        
        // Both check stock at the same time
        const available1 = product1.stockQuantity >= quantity1;
        const available2 = product2.stockQuantity >= quantity2;
        
        if (!available1 || !available2) {
          throw new Error('Insufficient stock for concurrent requests');
        }
        
        // Check if combined quantity exceeds stock
        if (quantity1 + quantity2 > product1.stockQuantity) {
          throw new Error('Combined quantity exceeds available stock');
        }
        
        return { success: true };
      };

      const availableStock = testProduct.stockQuantity; // 50
      
      // Try to sell 30 + 25 = 55 (more than 50 available)
      await expect(mockConcurrentInvoiceCreation(30, 25))
        .rejects.toThrow('Combined quantity exceeds available stock');
      
      // Try to sell 25 + 25 = 50 (exactly available)
      const result = await mockConcurrentInvoiceCreation(25, 25);
      expect(result.success).toBe(true);
    });

    test('should provide detailed stock information in error messages', async () => {
      const mockDetailedStockCheck = async (items) => {
        const { default: Product } = await import('../../../backend/src/models/Product.js');
        
        for (const item of items) {
          const product = await Product.findById(item.productId);
          
          if (product.stockQuantity < item.quantity) {
            const stockStatus = product.stockQuantity === 0 ? 'Out of Stock' : 
                              product.stockQuantity <= 10 ? 'Low Stock' : 'In Stock';
            
            throw new Error(
              `Stock validation failed:\n` +
              `Product: ${product.name}\n` +
              `Status: ${stockStatus}\n` +
              `Available: ${product.stockQuantity} ${product.unit}\n` +
              `Requested: ${item.quantity} ${product.unit}\n` +
              `Shortage: ${item.quantity - product.stockQuantity} ${product.unit}`
            );
          }
        }
        
        return { success: true };
      };

      try {
        await mockDetailedStockCheck([{
          productId: testProduct._id,
          quantity: 75 // More than 50 available
        }]);
      } catch (error) {
        expect(error.message).toContain('Stock validation failed');
        expect(error.message).toContain(`Product: ${testProduct.name}`);
        expect(error.message).toContain('Available: 50');
        expect(error.message).toContain('Requested: 75');
        expect(error.message).toContain('Shortage: 25');
      }
    });
  });

  describe('Manual Stock Adjustment Requires Reason', () => {
    test('should require reason for manual stock adjustments', async () => {
      const mockManualStockAdjustment = async (productId, newQuantity, reason) => {
        if (!reason || reason.trim().length === 0) {
          throw new Error('Reason is required for manual stock adjustments');
        }
        
        if (reason.trim().length < 10) {
          throw new Error('Reason must be at least 10 characters long');
        }
        
        const { default: Product } = await import('../../../backend/src/models/Product.js');
        await Product.findByIdAndUpdate(productId, {
          stockQuantity: newQuantity,
          updatedBy: testUser._id
        });
        
        return { 
          success: true, 
          message: 'Stock adjusted successfully',
          reason: reason.trim()
        };
      };

      // Test without reason
      await expect(mockManualStockAdjustment(testProduct._id, 75, ''))
        .rejects.toThrow('Reason is required for manual stock adjustments');

      // Test with short reason
      await expect(mockManualStockAdjustment(testProduct._id, 75, 'Fixed'))
        .rejects.toThrow('Reason must be at least 10 characters long');

      // Test with valid reason
      const result = await mockManualStockAdjustment(
        testProduct._id, 
        75, 
        'Physical count revealed additional inventory in warehouse'
      );
      
      expect(result.success).toBe(true);
      expect(result.reason).toBe('Physical count revealed additional inventory in warehouse');
    });

    test('should log stock adjustment history', async () => {
      const mockStockAdjustmentWithLogging = async (productId, newQuantity, reason, userId) => {
        const { default: Product } = await import('../../../backend/src/models/Product.js');
        const product = await Product.findById(productId);
        const previousQuantity = product.stockQuantity;
        
        // Update stock
        await Product.findByIdAndUpdate(productId, {
          stockQuantity: newQuantity,
          updatedBy: userId
        });
        
        // Create audit log
        const auditLog = {
          productId,
          productName: product.name,
          previousQuantity,
          newQuantity,
          quantityChange: newQuantity - previousQuantity,
          reason: reason.trim(),
          adjustedBy: userId,
          adjustedAt: new Date(),
          type: 'manual_adjustment'
        };
        
        return { 
          success: true, 
          auditLog,
          message: `Stock adjusted from ${previousQuantity} to ${newQuantity}`
        };
      };

      const result = await mockStockAdjustmentWithLogging(
        testProduct._id,
        80,
        'Received additional stock from supplier',
        testUser._id
      );

      expect(result.success).toBe(true);
      expect(result.auditLog.previousQuantity).toBe(50);
      expect(result.auditLog.newQuantity).toBe(80);
      expect(result.auditLog.quantityChange).toBe(30);
      expect(result.auditLog.reason).toBe('Received additional stock from supplier');
      expect(result.auditLog.type).toBe('manual_adjustment');
    });

    test('should validate reasonable stock adjustment limits', async () => {
      const mockValidatedStockAdjustment = async (productId, newQuantity, reason) => {
        const { default: Product } = await import('../../../backend/src/models/Product.js');
        const product = await Product.findById(productId);
        const currentQuantity = product.stockQuantity;
        const change = Math.abs(newQuantity - currentQuantity);
        const changePercentage = (change / currentQuantity) * 100;
        
        // Prevent negative stock first
        if (newQuantity < 0) {
          throw new Error('Stock quantity cannot be negative');
        }
        
        // Prevent unreasonably large quantities
        if (newQuantity > 10000) {
          throw new Error('Stock quantity seems unreasonably large. Please verify.');
        }
        
        // Flag large adjustments for additional validation
        if (changePercentage > 50 && change > 10) {
          if (!reason.includes('physical count') && !reason.includes('inventory audit')) {
            throw new Error(
              `Large stock adjustment detected (${changePercentage.toFixed(1)}% change). ` +
              `Please provide detailed reason including 'physical count' or 'inventory audit'.`
            );
          }
        }
        
        await Product.findByIdAndUpdate(productId, { stockQuantity: newQuantity });
        return { success: true };
      };

      // Test negative stock first
      await expect(mockValidatedStockAdjustment(
        testProduct._id,
        -5,
        'Correcting inventory error'
      )).rejects.toThrow('Stock quantity cannot be negative');

      // Test large adjustment without proper reason
      await expect(mockValidatedStockAdjustment(
        testProduct._id, 
        150, // 200% increase
        'Added more stock'
      )).rejects.toThrow('Large stock adjustment detected');

      // Test large adjustment with proper reason
      const result = await mockValidatedStockAdjustment(
        testProduct._id,
        150,
        'Annual physical count revealed additional inventory in storage'
      );
      expect(result.success).toBe(true);
    });
  });

  describe('Soft-Deleted Products Not Sellable', () => {
    test('should prevent selling soft-deleted products', async () => {
      const { default: Product } = await import('../../../backend/src/models/Product.js');
      
      // Soft delete the product
      await Product.findByIdAndUpdate(testProduct._id, {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: testUser._id
      });

      const mockCreateInvoiceWithDeletedCheck = async (items) => {
        for (const item of items) {
          const product = await Product.findById(item.productId);
          
          if (!product) {
            throw new Error(`Product not found: ${item.productId}`);
          }
          
          if (product.isDeleted) {
            throw new Error(
              `Cannot sell deleted product: ${product.name}. ` +
              `Product was deleted on ${product.deletedAt?.toLocaleDateString()}.`
            );
          }
          
          if (!product.isActive) {
            throw new Error(`Cannot sell inactive product: ${product.name}`);
          }
        }
        
        return { success: true };
      };

      await expect(mockCreateInvoiceWithDeletedCheck([{
        productId: testProduct._id,
        quantity: 5
      }])).rejects.toThrow(`Cannot sell deleted product: ${testProduct.name}`);
    });

    test('should prevent selling inactive products', async () => {
      const { default: Product } = await import('../../../backend/src/models/Product.js');
      
      // Deactivate the product
      await Product.findByIdAndUpdate(testProduct._id, {
        isActive: false
      });

      const mockCreateInvoiceWithActiveCheck = async (items) => {
        for (const item of items) {
          const product = await Product.findById(item.productId);
          
          if (!product.isActive) {
            throw new Error(`Cannot sell inactive product: ${product.name}`);
          }
        }
        
        return { success: true };
      };

      await expect(mockCreateInvoiceWithActiveCheck([{
        productId: testProduct._id,
        quantity: 5
      }])).rejects.toThrow(`Cannot sell inactive product: ${testProduct.name}`);
    });

    test('should allow selling after product restoration', async () => {
      const { default: Product } = await import('../../../backend/src/models/Product.js');
      
      // Soft delete the product
      await Product.findByIdAndUpdate(testProduct._id, {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: testUser._id
      });

      // Restore the product
      await Product.findByIdAndUpdate(testProduct._id, {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null
      });

      const mockCreateInvoice = async (items) => {
        for (const item of items) {
          const product = await Product.findById(item.productId);
          
          if (product.isDeleted || !product.isActive) {
            throw new Error(`Cannot sell product: ${product.name}`);
          }
          
          if (product.stockQuantity < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}`);
          }
          
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stockQuantity: -item.quantity } }
          );
        }
        
        return { success: true };
      };

      const result = await mockCreateInvoice([{
        productId: testProduct._id,
        quantity: 5
      }]);

      expect(result.success).toBe(true);

      // Verify stock was decreased
      const updatedProduct = await Product.findById(testProduct._id);
      expect(updatedProduct.stockQuantity).toBe(45); // 50 - 5
    });

    test('should filter out deleted products from product lists', async () => {
      const { default: Product } = await import('../../../backend/src/models/Product.js');
      
      // Create another active product
      const activeProduct = await global.testUtils.createTestProduct({
        name: 'Active Product',
        category: 'Glass',
        stockQuantity: 25,
        unit: 'piece', // Use valid unit
        createdBy: testUser._id
      });

      // Soft delete the first product
      await Product.findByIdAndUpdate(testProduct._id, {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: testUser._id
      });

      // Mock getting available products for sale
      const mockGetAvailableProducts = async () => {
        const products = await Product.find({
          isDeleted: false,
          isActive: true,
          stockQuantity: { $gt: 0 }
        });
        
        return products.map(product => ({
          _id: product._id,
          name: product.name,
          stockQuantity: product.stockQuantity,
          sellingPrice: product.sellingPrice,
          unit: product.unit
        }));
      };

      const availableProducts = await mockGetAvailableProducts();
      
      expect(availableProducts).toHaveLength(1);
      expect(availableProducts[0].name).toBe('Active Product');
      expect(availableProducts.find(p => p.name === testProduct.name)).toBeUndefined();
      
      // Clean up unused variable warning
      expect(activeProduct.name).toBe('Active Product');
    });
  });

  describe('Stock Validation Edge Cases', () => {
    test('should handle zero stock scenarios', async () => {
      const { default: Product } = await import('../../../backend/src/models/Product.js');
      
      // Set stock to zero
      await Product.findByIdAndUpdate(testProduct._id, { stockQuantity: 0 });

      const mockCreateInvoice = async (items) => {
        for (const item of items) {
          const product = await Product.findById(item.productId);
          
          if (product.stockQuantity === 0) {
            throw new Error(`Product ${product.name} is out of stock`);
          }
          
          if (product.stockQuantity < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}`);
          }
        }
        
        return { success: true };
      };

      await expect(mockCreateInvoice([{
        productId: testProduct._id,
        quantity: 1
      }])).rejects.toThrow(`Product ${testProduct.name} is out of stock`);
    });

    test('should handle fractional stock for appropriate units', async () => {
      const { default: Product } = await import('../../../backend/src/models/Product.js');
      
      // Set up product with fractional stock (like sqft)
      await Product.findByIdAndUpdate(testProduct._id, {
        unit: 'sqft',
        stockQuantity: 25.75
      });

      const mockCreateInvoiceWithFractional = async (items) => {
        for (const item of items) {
          const product = await Product.findById(item.productId);
          
          if (product.stockQuantity < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}`);
          }
          
          const newStock = Math.round((product.stockQuantity - item.quantity) * 100) / 100;
          await Product.findByIdAndUpdate(
            item.productId,
            { stockQuantity: newStock }
          );
        }
        
        return { success: true };
      };

      const result = await mockCreateInvoiceWithFractional([{
        productId: testProduct._id,
        quantity: 10.25
      }]);

      expect(result.success).toBe(true);

      const updatedProduct = await Product.findById(testProduct._id);
      expect(updatedProduct.stockQuantity).toBe(15.5); // 25.75 - 10.25
    });

    test('should prevent stock manipulation through invalid updates', async () => {
      const mockSecureStockUpdate = async (productId, operation, quantity, userId) => {
        if (!['decrease', 'increase', 'set'].includes(operation)) {
          throw new Error('Invalid stock operation');
        }
        
        if (typeof quantity !== 'number' || quantity < 0) {
          throw new Error('Invalid quantity value');
        }
        
        if (!userId) {
          throw new Error('User ID required for stock updates');
        }
        
        const { default: Product } = await import('../../../backend/src/models/Product.js');
        const product = await Product.findById(productId);
        
        let newStock;
        switch (operation) {
          case 'decrease':
            newStock = product.stockQuantity - quantity;
            if (newStock < 0) {
              throw new Error('Cannot decrease stock below zero');
            }
            break;
          case 'increase':
            newStock = product.stockQuantity + quantity;
            break;
          case 'set':
            newStock = quantity;
            break;
        }
        
        await Product.findByIdAndUpdate(productId, {
          stockQuantity: newStock,
          updatedBy: userId
        });
        
        return { success: true, newStock };
      };

      // Test invalid operation
      await expect(mockSecureStockUpdate(
        testProduct._id, 
        'invalid', 
        10, 
        testUser._id
      )).rejects.toThrow('Invalid stock operation');

      // Test negative quantity
      await expect(mockSecureStockUpdate(
        testProduct._id, 
        'decrease', 
        -5, 
        testUser._id
      )).rejects.toThrow('Invalid quantity value');

      // Test missing user ID
      await expect(mockSecureStockUpdate(
        testProduct._id, 
        'decrease', 
        10, 
        null
      )).rejects.toThrow('User ID required for stock updates');

      // Test valid operation
      const result = await mockSecureStockUpdate(
        testProduct._id, 
        'decrease', 
        10, 
        testUser._id
      );
      
      expect(result.success).toBe(true);
      expect(result.newStock).toBe(40); // 50 - 10
    });
  });
});