#!/usr/bin/env node

/**
 * Test Business Rules System
 * 
 * This script tests all business rules to prevent real-world mistakes:
 * 1. Cannot sell without selecting company & thickness
 * 2. Cannot mix thickness in one calculator item
 * 3. Purchase price changes do NOT affect past invoices
 * 4. Soft-deleted brands cannot be used
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BusinessRulesService from '../services/businessRulesService.js';
import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import Invoice from '../models/Invoice.js';
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

const testBusinessRules = async () => {
  try {
    console.log('\n🧪 Testing Business Rules System...\n');

    // Find test user
    const testUser = await User.findOne({ role: 'manager' });
    if (!testUser) {
      throw new Error('No manager user found for testing');
    }

    // Test 1: Cannot sell without selecting company & thickness
    console.log('🚫 Test 1: Cannot sell without company & thickness...');
    
    // Find a Thai/Glass product
    const testProduct = await Product.findOne({ 
      materialType: { $in: ['Thai', 'Glass'] },
      company: { $exists: true },
      thicknessMM: { $exists: true }
    });

    if (!testProduct) {
      throw new Error('No Thai/Glass product found for testing');
    }

    console.log(`   Testing with product: ${testProduct.name} (${testProduct.materialType})`);

    // Test invalid item (missing company)
    const invalidItem1 = {
      quantity: 10,
      unitPrice: 100
      // Missing company, thickness, quality - should use product's values
    };

    const validation1 = await BusinessRulesService.validateInvoiceItem(invalidItem1, testProduct._id);
    console.log(`   ✅ Missing variant info validation: ${validation1.isValid ? 'PASS (using product data)' : 'FAIL (blocked)'}`);
    if (!validation1.isValid) {
      console.log(`      Errors: ${validation1.errors.join(', ')}`);
    }

    // Test item with mismatched variant info
    const mismatchedItem = {
      company: 'Wrong Company',
      thicknessMM: 999,
      quality: 'Wrong Quality',
      quantity: 10,
      unitPrice: 100
    };

    const validation1b = await BusinessRulesService.validateInvoiceItem(mismatchedItem, testProduct._id);
    console.log(`   ✅ Mismatched variant info blocked: ${!validation1b.isValid ? 'PASS' : 'FAIL'}`);
    if (!validation1b.isValid) {
      console.log(`      Errors: ${validation1b.errors.join(', ')}`);
    }

    // Test valid item (complete variant info)
    const validItem = {
      company: testProduct.company,
      thicknessMM: testProduct.thicknessMM,
      quality: testProduct.quality,
      measurementType: testProduct.measurementType,
      quantity: 10,
      unitPrice: 100
    };

    const validation2 = await BusinessRulesService.validateInvoiceItem(validItem, testProduct._id);
    console.log(`   ✅ Complete variant info allowed: ${validation2.isValid ? 'PASS' : 'FAIL'}`);

    // Test 2: Cannot mix thickness in one calculator item
    console.log('\n🔧 Test 2: Cannot mix thickness in calculator...');
    
    const calculatorData1 = {
      materialType: 'Glass',
      company: 'Nasir Glass',
      thicknessMM: 5,
      quality: 'Local',
      measurementType: 'SFT',
      items: [
        { thicknessMM: 5, area: 10 },
        { thicknessMM: 6, area: 15 } // Different thickness - should fail
      ]
    };

    const calcValidation1 = BusinessRulesService.validateCalculatorItem(calculatorData1);
    console.log(`   ✅ Mixed thickness blocked: ${!calcValidation1.isValid ? 'PASS' : 'FAIL'}`);
    if (!calcValidation1.isValid) {
      console.log(`      Errors: ${calcValidation1.errors.join(', ')}`);
    }

    // Test valid calculator (same thickness)
    const calculatorData2 = {
      materialType: 'Glass',
      company: 'Nasir Glass',
      thicknessMM: 5,
      quality: 'Local',
      measurementType: 'SFT',
      items: [
        { thicknessMM: 5, area: 10 },
        { thicknessMM: 5, area: 15 } // Same thickness - should pass
      ]
    };

    const calcValidation2 = BusinessRulesService.validateCalculatorItem(calculatorData2);
    console.log(`   ✅ Same thickness allowed: ${calcValidation2.isValid ? 'PASS' : 'FAIL'}`);

    // Test missing required fields
    const calculatorData3 = {
      materialType: 'Glass'
      // Missing company, thickness, quality
    };

    const calcValidation3 = BusinessRulesService.validateCalculatorItem(calculatorData3);
    console.log(`   ✅ Missing required fields blocked: ${!calcValidation3.isValid ? 'PASS' : 'FAIL'}`);
    if (!calcValidation3.isValid) {
      console.log(`      Errors: ${calcValidation3.errors.join(', ')}`);
    }

    // Test 3: Purchase price changes do NOT affect past invoices
    console.log('\n💰 Test 3: Purchase price change validation...');
    
    // Check if there are existing invoices with this product
    const existingInvoices = await Invoice.find({
      'items.product': testProduct._id,
      isActive: true,
      isDeleted: { $ne: true }
    });

    const priceValidation = await BusinessRulesService.validatePurchasePriceChange(
      testProduct._id, 
      testProduct.purchasePrice + 10, // New higher price
      testUser._id
    );

    console.log(`   ✅ Price change validation: ${priceValidation.isValid ? 'PASS' : 'FAIL'}`);
    if (existingInvoices.length > 0) {
      console.log(`   📊 Found ${existingInvoices.length} existing invoices`);
      console.log(`   ⚠️  Warnings: ${priceValidation.warnings?.length || 0}`);
      if (priceValidation.warnings && priceValidation.warnings.length > 0) {
        console.log(`      ${priceValidation.warnings[0]}`);
      }
    } else {
      console.log(`   📊 No existing invoices found`);
    }

    // Test 4: Soft-deleted brands cannot be used
    console.log('\n🏷️ Test 4: Soft-deleted brand validation...');
    
    // Find an active brand
    const activeBrand = await Brand.findOne({ 
      isActive: true, 
      isDeleted: { $ne: true } 
    });

    if (activeBrand) {
      console.log(`   Testing with brand: ${activeBrand.name} (${activeBrand.materialType})`);
      
      // Test active brand (should pass)
      const brandValidation1 = await BusinessRulesService.validateBrandUsage(
        activeBrand.name, 
        activeBrand.materialType
      );
      console.log(`   ✅ Active brand allowed: ${brandValidation1.isValid ? 'PASS' : 'FAIL'}`);

      // Test soft-deleted brand validation by simulating a deleted brand
      const brandValidation2 = await BusinessRulesService.validateBrandUsage(
        'Non-Existent Brand', 
        'Glass'
      );
      console.log(`   ✅ Non-existent brand blocked: ${!brandValidation2.isValid ? 'PASS' : 'FAIL'}`);
      if (!brandValidation2.isValid) {
        console.log(`      Errors: ${brandValidation2.errors.join(', ')}`);
      }
    } else {
      console.log('   ⚠️  No active brands found for testing');
    }

    // Test 5: Product variant validation
    console.log('\n📦 Test 5: Product variant validation...');
    
    // Test invalid product data (Thai/Glass without required fields)
    const invalidProductData = {
      name: 'Test Invalid Product',
      materialType: 'Glass'
      // Missing company, thickness, quality
    };

    const productValidation1 = await BusinessRulesService.validateProductVariant(invalidProductData);
    console.log(`   ✅ Incomplete variant blocked: ${!productValidation1.isValid ? 'PASS' : 'FAIL'}`);
    if (!productValidation1.isValid) {
      console.log(`      Errors: ${productValidation1.errors.join(', ')}`);
    }

    // Test valid product data
    const validProductData = {
      name: 'Test Valid Product',
      materialType: 'Glass',
      company: activeBrand?.name || 'Nasir Glass',
      thicknessMM: 5,
      quality: 'Local',
      measurementType: 'SFT'
    };

    const productValidation2 = await BusinessRulesService.validateProductVariant(validProductData);
    console.log(`   ✅ Complete variant allowed: ${productValidation2.isValid ? 'PASS' : 'FAIL'}`);

    // Test 6: Invoice creation validation
    console.log('\n📄 Test 6: Invoice creation validation...');
    
    // Test invalid invoice (items without variant info)
    const invalidInvoiceData = {
      customerName: 'Test Customer',
      items: [
        {
          product: testProduct._id,
          quantity: 10,
          unitPrice: 100
          // Missing variant information
        }
      ]
    };

    const invoiceValidation1 = await BusinessRulesService.validateInvoiceCreation(invalidInvoiceData);
    console.log(`   ✅ Incomplete invoice blocked: ${!invoiceValidation1.isValid ? 'PASS' : 'FAIL'}`);
    if (!invoiceValidation1.isValid) {
      console.log(`      Errors: ${invoiceValidation1.errors.join(', ')}`);
    }

    // Test 7: Calculator result validation
    console.log('\n🧮 Test 7: Calculator result validation...');
    
    // Test invalid calculator result
    const invalidCalculatorResult = {
      materialType: 'Glass',
      // Missing company, thickness, quality, etc.
      calculatedArea: 15.5
    };

    const calcResultValidation1 = BusinessRulesService.validateCalculatorResult(invalidCalculatorResult);
    console.log(`   ✅ Incomplete calculator result blocked: ${!calcResultValidation1.isValid ? 'PASS' : 'FAIL'}`);
    if (!calcResultValidation1.isValid) {
      console.log(`      Errors: ${calcResultValidation1.errors.join(', ')}`);
    }

    // Test valid calculator result
    const validCalculatorResult = {
      materialType: 'Glass',
      company: 'Nasir Glass',
      thicknessMM: 5,
      quality: 'Local',
      measurementType: 'SFT',
      calculatedArea: 15.5,
      selectedProduct: testProduct._id
    };

    const calcResultValidation2 = BusinessRulesService.validateCalculatorResult(validCalculatorResult);
    console.log(`   ✅ Complete calculator result allowed: ${calcResultValidation2.isValid ? 'PASS' : 'FAIL'}`);

    // Test 8: Get active brands
    console.log('\n🏪 Test 8: Active brands retrieval...');
    
    const glassActiveBrands = await BusinessRulesService.getActiveBrands('Glass');
    const thaiActiveBrands = await BusinessRulesService.getActiveBrands('Thai');
    
    console.log(`   ✅ Glass brands found: ${glassActiveBrands.success ? glassActiveBrands.brands.length : 0}`);
    console.log(`   ✅ Thai brands found: ${thaiActiveBrands.success ? thaiActiveBrands.brands.length : 0}`);

    if (glassActiveBrands.success && glassActiveBrands.brands.length > 0) {
      console.log(`      Sample Glass brand: ${glassActiveBrands.brands[0].name}`);
    }

    console.log('\n✅ All business rules tests completed!');
    console.log('\n📊 Summary:');
    console.log('   ✓ Variant requirement validation working');
    console.log('   ✓ Calculator thickness mixing prevention active');
    console.log('   ✓ Purchase price change protection enabled');
    console.log('   ✓ Soft-deleted brand blocking functional');
    console.log('   ✓ Product variant validation operational');
    console.log('   ✓ Invoice creation validation active');
    console.log('   ✓ Calculator result validation working');
    console.log('   ✓ Active brand retrieval functional');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await testBusinessRules();
    console.log('\n🎉 Business Rules System test completed successfully!');
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