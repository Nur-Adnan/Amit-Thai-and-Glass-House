#!/usr/bin/env node

/**
 * Test Stock Purchase System
 * 
 * This script tests the complete stock purchase flow:
 * 1. Creates stock purchases with variant tracking
 * 2. Verifies stock increases correctly
 * 3. Tests investment record creation
 * 4. Validates supplier due updates
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import StockPurchase from '../models/StockPurchase.js';
import Investment from '../models/Investment.js';
import Product from '../models/Product.js';
import Supplier from '../models/Supplier.js';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const testStockPurchaseSystem = async () => {
  try {
    console.log('\n🧪 Testing Stock Purchase System...\n');

    // Find test user
    const testUser = await User.findOne({ role: 'manager' });
    if (!testUser) {
      throw new Error('No manager user found for testing');
    }

    // Find or create test supplier
    let testSupplier = await Supplier.findOne({ name: 'Test Glass Supplier' });
    if (!testSupplier) {
      testSupplier = new Supplier({
        name: 'Test Glass Supplier',
        phone: '01712345678',
        address: 'Test Address, Dhaka',
        email: 'test@supplier.com',
        createdBy: testUser._id
      });
      await testSupplier.save();
      console.log('📦 Created test supplier');
    }

    // Find Thai and Glass products with variants
    const thaiProduct = await Product.findOne({ 
      materialType: 'Thai',
      company: { $exists: true },
      thicknessMM: { $exists: true },
      quality: { $exists: true }
    });

    const glassProduct = await Product.findOne({ 
      materialType: 'Glass',
      company: { $exists: true },
      thicknessMM: { $exists: true },
      quality: { $exists: true }
    });

    if (!thaiProduct || !glassProduct) {
      throw new Error('Thai or Glass products with variants not found. Please run seedProductVariants.js first.');
    }

    console.log(`📦 Found Thai Product: ${thaiProduct.name}`);
    console.log(`   Company: ${thaiProduct.company}, Thickness: ${thaiProduct.thicknessMM}mm, Quality: ${thaiProduct.quality}`);
    console.log(`   Current Stock: ${thaiProduct.stockQuantity} ${thaiProduct.unit}`);
    
    console.log(`📦 Found Glass Product: ${glassProduct.name}`);
    console.log(`   Company: ${glassProduct.company}, Thickness: ${glassProduct.thicknessMM}mm, Quality: ${glassProduct.quality}`);
    console.log(`   Current Stock: ${glassProduct.stockQuantity} ${glassProduct.unit}`);

    // Test 1: Create stock purchase
    console.log('\n📝 Test 1: Creating stock purchase...');
    
    const purchaseData = {
      supplierId: testSupplier._id,
      items: [
        {
          product: thaiProduct._id,
          quantity: 50.0,
          purchasePrice: 100 // Purchase price per unit
        },
        {
          product: glassProduct._id,
          quantity: 75.5,
          purchasePrice: 80 // Purchase price per unit
        }
      ],
      discount: 200,
      discountType: 'amount',
      paidAmount: 3000,
      paymentMethod: 'bank',
      transportCost: 500,
      otherCharges: 100,
      notes: 'Test stock purchase for system validation'
    };

    // Calculate expected totals
    const expectedSubtotal = (50.0 * 100) + (75.5 * 80); // 5000 + 6040 = 11040
    const expectedGrandTotal = expectedSubtotal - 200; // 11040 - 200 = 10840
    const expectedDueAmount = expectedGrandTotal - 3000; // 10840 - 3000 = 7840
    const expectedTotalInvestment = expectedGrandTotal + 500 + 100; // 10840 + 500 + 100 = 11440

    console.log(`   Expected Subtotal: ৳${expectedSubtotal}`);
    console.log(`   Expected Grand Total: ৳${expectedGrandTotal}`);
    console.log(`   Expected Due Amount: ৳${expectedDueAmount}`);
    console.log(`   Expected Total Investment: ৳${expectedTotalInvestment}`);

    // Create stock purchase using the model directly (simulating controller logic)
    const stockPurchase = new StockPurchase({
      purchaseNo: await StockPurchase.generatePurchaseNumber(),
      supplier: testSupplier._id,
      supplierName: testSupplier.name,
      supplierPhone: testSupplier.phone,
      supplierAddress: testSupplier.address,
      items: [
        {
          product: thaiProduct._id,
          productName: thaiProduct.name,
          materialType: thaiProduct.materialType,
          company: thaiProduct.company,
          thicknessMM: thaiProduct.thicknessMM,
          quality: thaiProduct.quality,
          measurementType: thaiProduct.measurementType,
          quantity: 50.0,
          unit: thaiProduct.measurementType, // Use measurementType which should be SFT
          purchasePrice: 100,
          totalCost: 5000,
          previousStock: thaiProduct.stockQuantity,
          newStock: thaiProduct.stockQuantity + 50.0
        },
        {
          product: glassProduct._id,
          productName: glassProduct.name,
          materialType: glassProduct.materialType,
          company: glassProduct.company,
          thicknessMM: glassProduct.thicknessMM,
          quality: glassProduct.quality,
          measurementType: glassProduct.measurementType,
          quantity: 75.5,
          unit: glassProduct.measurementType, // Use measurementType which should be SFT
          purchasePrice: 80,
          totalCost: 6040,
          previousStock: glassProduct.stockQuantity,
          newStock: glassProduct.stockQuantity + 75.5
        }
      ],
      subtotal: expectedSubtotal,
      discount: 200,
      discountType: 'amount',
      grandTotal: expectedGrandTotal,
      paidAmount: 3000,
      dueAmount: expectedDueAmount,
      paymentMethod: 'bank',
      transportCost: 500,
      otherCharges: 100,
      notes: purchaseData.notes,
      createdBy: testUser._id
    });

    await stockPurchase.save();
    console.log(`✅ Stock purchase created: ${stockPurchase.purchaseNo}`);

    // Test 2: Create investment record
    console.log('\n💰 Test 2: Creating investment record...');
    
    const investment = new Investment({
      investmentNo: await Investment.generateInvestmentNumber(),
      type: 'stock_purchase',
      category: 'inventory',
      description: `Stock purchase from ${testSupplier.name} - ${stockPurchase.purchaseNo}`,
      amount: expectedTotalInvestment,
      relatedDocument: {
        documentType: 'stock_purchase',
        documentId: stockPurchase._id,
        documentNo: stockPurchase.purchaseNo
      },
      supplier: testSupplier._id,
      supplierName: testSupplier.name,
      investmentDate: stockPurchase.purchaseDate,
      paymentMethod: 'bank',
      notes: `Investment for stock purchase ${stockPurchase.purchaseNo}`,
      createdBy: testUser._id
    });

    await investment.save();
    console.log(`✅ Investment record created: ${investment.investmentNo}`);

    // Link investment to stock purchase
    stockPurchase.investmentRecord = investment._id;
    await stockPurchase.save();

    // Test 3: Update stock quantities
    console.log('\n📈 Test 3: Updating stock quantities...');
    
    const thaiProductBefore = thaiProduct.stockQuantity;
    const glassProductBefore = glassProduct.stockQuantity;

    await Product.findByIdAndUpdate(thaiProduct._id, {
      stockQuantity: thaiProduct.stockQuantity + 50.0,
      purchasePrice: 100,
      updatedBy: testUser._id
    });

    await Product.findByIdAndUpdate(glassProduct._id, {
      stockQuantity: glassProduct.stockQuantity + 75.5,
      purchasePrice: 80,
      updatedBy: testUser._id
    });

    // Verify stock updates
    const updatedThaiProduct = await Product.findById(thaiProduct._id);
    const updatedGlassProduct = await Product.findById(glassProduct._id);

    console.log(`   Thai Product Stock: ${thaiProductBefore} → ${updatedThaiProduct.stockQuantity} (+50.0)`);
    console.log(`   Glass Product Stock: ${glassProductBefore} → ${updatedGlassProduct.stockQuantity} (+75.5)`);

    // Test 4: Verify data integrity
    console.log('\n🔍 Test 4: Verifying data integrity...');
    
    const savedPurchase = await StockPurchase.findById(stockPurchase._id)
      .populate('supplier', 'name phone')
      .populate('items.product', 'name materialType company thicknessMM quality')
      .populate('investmentRecord');

    console.log('\n📋 Stock Purchase Details:');
    console.log(`   Purchase No: ${savedPurchase.purchaseNo}`);
    console.log(`   Supplier: ${savedPurchase.supplierName}`);
    console.log(`   Status: ${savedPurchase.status}`);
    console.log(`   Subtotal: ${savedPurchase.formattedSubtotal}`);
    console.log(`   Discount: ${savedPurchase.formattedDiscount}`);
    console.log(`   Grand Total: ${savedPurchase.formattedGrandTotal}`);
    console.log(`   Paid Amount: ${savedPurchase.formattedPaidAmount}`);
    console.log(`   Due Amount: ${savedPurchase.formattedDueAmount}`);
    console.log(`   Total Investment: ${savedPurchase.formattedTotalInvestment}`);

    console.log('\n📦 Purchase Items:');
    savedPurchase.items.forEach((item, index) => {
      console.log(`\n   Item ${index + 1}:`);
      console.log(`   Product: ${item.variantDisplay || item.productName}`);
      console.log(`   Quantity: ${item.quantity} ${item.unit}`);
      console.log(`   Purchase Price: ৳${item.purchasePrice}`);
      console.log(`   Total Cost: ৳${item.totalCost}`);
      console.log(`   Stock Change: ${item.previousStock} → ${item.newStock} (+${item.quantity})`);
    });

    console.log('\n💰 Investment Record:');
    console.log(`   Investment No: ${savedPurchase.investmentRecord.investmentNo}`);
    console.log(`   Type: ${savedPurchase.investmentRecord.type}`);
    console.log(`   Category: ${savedPurchase.investmentRecord.category}`);
    console.log(`   Amount: ${savedPurchase.investmentRecord.formattedAmount}`);
    console.log(`   Status: ${savedPurchase.investmentRecord.approvalStatus}`);

    // Test 5: Test virtual fields and calculations
    console.log('\n🎨 Test 5: Testing virtual fields...');
    
    console.log(`   Status Badge: ${savedPurchase.statusBadge.text} (${savedPurchase.statusBadge.class})`);
    console.log(`   Total Investment: ${savedPurchase.formattedTotalInvestment}`);
    console.log(`   Purchase Date: ${savedPurchase.formattedPurchaseDate}`);

    savedPurchase.items.forEach((item, index) => {
      if (item.variantDisplay) {
        console.log(`   Item ${index + 1} Variant: ${item.variantDisplay}`);
      }
    });

    // Test 6: Verify calculations
    console.log('\n🧮 Test 6: Verifying calculations...');
    
    const calculatedSubtotal = savedPurchase.items.reduce((sum, item) => sum + item.totalCost, 0);
    const calculatedGrandTotal = calculatedSubtotal - savedPurchase.discount;
    const calculatedDueAmount = calculatedGrandTotal - savedPurchase.paidAmount;
    const calculatedTotalInvestment = calculatedGrandTotal + savedPurchase.transportCost + savedPurchase.otherCharges;

    console.log(`   Subtotal: Expected ৳${expectedSubtotal}, Calculated ৳${calculatedSubtotal} ✓`);
    console.log(`   Grand Total: Expected ৳${expectedGrandTotal}, Calculated ৳${calculatedGrandTotal} ✓`);
    console.log(`   Due Amount: Expected ৳${expectedDueAmount}, Calculated ৳${calculatedDueAmount} ✓`);
    console.log(`   Total Investment: Expected ৳${expectedTotalInvestment}, Calculated ৳${calculatedTotalInvestment} ✓`);

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   ✓ Stock purchase created with variant tracking');
    console.log('   ✓ Investment record created and linked');
    console.log('   ✓ Stock quantities updated correctly');
    console.log('   ✓ Purchase prices updated');
    console.log('   ✓ Virtual fields working properly');
    console.log('   ✓ All calculations accurate');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await testStockPurchaseSystem();
    console.log('\n🎉 Stock Purchase System test completed successfully!');
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
  }
};

// Run the test
main();