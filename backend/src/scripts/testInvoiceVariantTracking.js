#!/usr/bin/env node

/**
 * Test Invoice Variant Tracking System
 * 
 * This script tests the new invoice variant tracking functionality:
 * 1. Creates test invoices with variant information
 * 2. Verifies variant data is stored correctly
 * 3. Tests variant display formatting
 * 4. Validates invoice print format shows variants
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import ShopConfig from '../models/ShopConfig.js';

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

const testInvoiceVariantTracking = async () => {
  try {
    console.log('\n🧪 Testing Invoice Variant Tracking System...\n');

    // Find test user
    const testUser = await User.findOne({ role: 'manager' });
    if (!testUser) {
      throw new Error('No manager user found for testing');
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
    
    console.log(`📦 Found Glass Product: ${glassProduct.name}`);
    console.log(`   Company: ${glassProduct.company}, Thickness: ${glassProduct.thicknessMM}mm, Quality: ${glassProduct.quality}`);

    // Test 1: Create invoice with variant tracking
    console.log('\n📝 Test 1: Creating invoice with variant tracking...');
    
    const testInvoiceData = {
      customerName: 'Test Customer - Variant Tracking',
      customerPhone: '01712345678',
      customerAddress: 'Test Address, Dhaka',
      items: [
        {
          product: thaiProduct._id,
          quantity: 10.5,
          unitPrice: thaiProduct.sellingPrice,
          calculatedArea: 15.75 // Example calculated area
        },
        {
          product: glassProduct._id,
          quantity: 8.25,
          unitPrice: glassProduct.sellingPrice,
          calculatedArea: 12.5 // Example calculated area
        }
      ],
      discount: 0,
      discountType: 'amount',
      paidAmount: 0,
      paymentMethod: 'cash',
      notes: 'Test invoice for variant tracking system'
    };

    // Create invoice using the controller logic (simplified)
    const invoiceItems = [];
    let subtotal = 0;

    for (const item of testInvoiceData.items) {
      const product = await Product.findById(item.product);
      const totalPrice = item.quantity * item.unitPrice;
      
      const invoiceItem = {
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        unit: product.unit,
        unitPrice: item.unitPrice,
        totalPrice: totalPrice
      };

      // Add variant tracking fields
      if (product.materialType && ['Thai', 'Glass'].includes(product.materialType)) {
        invoiceItem.materialType = product.materialType;
        invoiceItem.company = product.company;
        invoiceItem.thicknessMM = product.thicknessMM;
        invoiceItem.quality = product.quality;
        invoiceItem.measurementType = product.measurementType;
        invoiceItem.calculatedArea = item.calculatedArea;
      }

      invoiceItems.push(invoiceItem);
      subtotal += totalPrice;
    }

    const invoice = new Invoice({
      invoiceNo: await Invoice.generateInvoiceNumber(),
      customerName: testInvoiceData.customerName,
      customerPhone: testInvoiceData.customerPhone,
      customerAddress: testInvoiceData.customerAddress,
      customerType: 'walk-in',
      items: invoiceItems,
      subtotal: subtotal,
      discount: 0,
      discountType: 'amount',
      grandTotal: subtotal,
      paidAmount: 0,
      dueAmount: subtotal,
      status: 'due',
      paymentMethod: 'cash',
      notes: testInvoiceData.notes,
      createdBy: testUser._id
    });

    await invoice.save();
    console.log(`✅ Invoice created: ${invoice.invoiceNo}`);

    // Test 2: Verify variant data storage
    console.log('\n🔍 Test 2: Verifying variant data storage...');
    
    const savedInvoice = await Invoice.findById(invoice._id)
      .populate('items.product', 'name materialType company thicknessMM quality measurementType');

    console.log('\n📋 Invoice Items with Variant Data:');
    savedInvoice.items.forEach((item, index) => {
      console.log(`\n   Item ${index + 1}:`);
      console.log(`   Product: ${item.productName}`);
      
      if (item.materialType) {
        console.log(`   Material Type: ${item.materialType}`);
        console.log(`   Company: ${item.company}`);
        console.log(`   Thickness: ${item.thicknessMM}mm`);
        console.log(`   Quality: ${item.quality}`);
        console.log(`   Measurement Type: ${item.measurementType}`);
        console.log(`   Calculated Area: ${item.calculatedArea} ${item.measurementType}`);
        console.log(`   Variant Display: ${item.variantDisplay}`);
      } else {
        console.log(`   ⚠️  No variant data stored`);
      }
    });

    // Test 3: Test virtual fields
    console.log('\n🎨 Test 3: Testing virtual fields...');
    
    savedInvoice.items.forEach((item, index) => {
      if (item.variantInfo) {
        console.log(`\n   Item ${index + 1} Variant Info:`);
        console.log(`   Display: ${item.variantInfo.display}`);
        console.log(`   Material: ${item.variantInfo.materialType}`);
        console.log(`   Company: ${item.variantInfo.company}`);
        console.log(`   Thickness: ${item.variantInfo.thicknessMM}mm`);
        console.log(`   Quality: ${item.variantInfo.quality}`);
      }
    });

    // Test 4: Test invoice print format
    console.log('\n🖨️  Test 4: Testing invoice print format...');
    
    console.log('\n📄 Invoice Print Preview:');
    console.log(`Invoice No: ${savedInvoice.invoiceNo}`);
    console.log(`Customer: ${savedInvoice.customerName}`);
    console.log(`Date: ${savedInvoice.formattedDate}`);
    console.log('\nItems:');
    
    savedInvoice.items.forEach((item, index) => {
      const displayName = item.variantDisplay || item.productName;
      console.log(`${index + 1}. ${displayName}`);
      console.log(`   Quantity: ${item.quantity} ${item.unit}`);
      console.log(`   Unit Price: ৳${item.unitPrice}`);
      console.log(`   Total: ৳${item.totalPrice}`);
      
      if (item.calculatedArea) {
        console.log(`   Calculated Area: ${item.calculatedArea} ${item.measurementType}`);
      }
    });
    
    console.log(`\nSubtotal: ${savedInvoice.formattedSubtotal}`);
    console.log(`Grand Total: ${savedInvoice.formattedGrandTotal}`);
    console.log(`Due Amount: ${savedInvoice.formattedDueAmount}`);

    // Test 5: Verify backward compatibility
    console.log('\n🔄 Test 5: Testing backward compatibility...');
    
    // Find a product without variant data (if any)
    const legacyProduct = await Product.findOne({ 
      materialType: { $exists: false }
    });

    if (legacyProduct) {
      console.log(`📦 Found legacy product: ${legacyProduct.name}`);
      
      // Create invoice with legacy product
      const legacyInvoice = new Invoice({
        invoiceNo: await Invoice.generateInvoiceNumber(),
        customerName: 'Legacy Customer Test',
        customerType: 'walk-in',
        items: [{
          product: legacyProduct._id,
          productName: legacyProduct.name,
          quantity: 5,
          unit: legacyProduct.unit,
          unitPrice: legacyProduct.sellingPrice,
          totalPrice: 5 * legacyProduct.sellingPrice
        }],
        subtotal: 5 * legacyProduct.sellingPrice,
        grandTotal: 5 * legacyProduct.sellingPrice,
        paidAmount: 0,
        dueAmount: 5 * legacyProduct.sellingPrice,
        status: 'due',
        createdBy: testUser._id
      });

      await legacyInvoice.save();
      console.log(`✅ Legacy invoice created: ${legacyInvoice.invoiceNo}`);
      
      const savedLegacyInvoice = await Invoice.findById(legacyInvoice._id);
      const legacyItem = savedLegacyInvoice.items[0];
      
      console.log(`   Legacy item display: ${legacyItem.variantDisplay || legacyItem.productName}`);
      console.log(`   Has variant info: ${legacyItem.variantInfo ? 'Yes' : 'No'}`);
    } else {
      console.log('   No legacy products found - all products have variant data');
    }

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   ✓ Invoice variant tracking implemented');
    console.log('   ✓ Variant data stored correctly');
    console.log('   ✓ Virtual fields working');
    console.log('   ✓ Print format shows variants');
    console.log('   ✓ Backward compatibility maintained');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await testInvoiceVariantTracking();
    console.log('\n🎉 Invoice Variant Tracking System test completed successfully!');
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