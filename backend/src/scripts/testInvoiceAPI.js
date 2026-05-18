#!/usr/bin/env node

/**
 * Test Invoice API with Variant Tracking
 * 
 * This script tests the invoice creation API endpoint with variant tracking
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
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

const testInvoiceAPI = async () => {
  try {
    console.log('\n🧪 Testing Invoice API with Variant Tracking...\n');

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
      throw new Error('Thai or Glass products with variants not found');
    }

    console.log('📦 Test Products Found:');
    console.log(`   Thai: ${thaiProduct.name} (${thaiProduct.company}, ${thaiProduct.thicknessMM}mm, ${thaiProduct.quality})`);
    console.log(`   Glass: ${glassProduct.name} (${glassProduct.company}, ${glassProduct.thicknessMM}mm, ${glassProduct.quality})`);

    // Prepare API request payload
    const invoicePayload = {
      customerName: 'API Test Customer',
      customerPhone: '01712345678',
      customerAddress: 'Test Address, Dhaka',
      items: [
        {
          product: thaiProduct._id.toString(),
          quantity: 12.5,
          unitPrice: thaiProduct.sellingPrice,
          calculatedArea: 18.75 // This should be stored in the invoice
        },
        {
          product: glassProduct._id.toString(),
          quantity: 9.25,
          unitPrice: glassProduct.sellingPrice,
          calculatedArea: 14.5 // This should be stored in the invoice
        }
      ],
      discount: 100,
      discountType: 'amount',
      paidAmount: 500,
      paymentMethod: 'cash',
      notes: 'API test invoice with variant tracking'
    };

    console.log('\n📝 Invoice Payload:');
    console.log(JSON.stringify(invoicePayload, null, 2));

    console.log('\n✅ API payload prepared successfully!');
    console.log('\n📋 Expected Behavior:');
    console.log('   1. Invoice should be created with variant tracking');
    console.log('   2. Each item should store: materialType, company, thicknessMM, quality, measurementType, calculatedArea');
    console.log('   3. Invoice print should show: "Thai (Thai Float Glass, 4mm, Local)"');
    console.log('   4. Virtual fields should work for variant display');

    console.log('\n🔧 To test this API:');
    console.log('   1. Start the backend server: npm run dev');
    console.log('   2. Use Postman or curl to POST to: http://localhost:5000/api/invoices');
    console.log('   3. Include Authorization header with valid JWT token');
    console.log('   4. Send the above payload as JSON');

    console.log('\n📄 Expected Response Structure:');
    console.log(`{
  "success": true,
  "message": "Invoice created successfully",
  "data": {
    "invoiceNo": "INV-202601-XXXX",
    "customerName": "API Test Customer",
    "items": [
      {
        "product": "${thaiProduct._id}",
        "productName": "${thaiProduct.name}",
        "materialType": "${thaiProduct.materialType}",
        "company": "${thaiProduct.company}",
        "thicknessMM": ${thaiProduct.thicknessMM},
        "quality": "${thaiProduct.quality}",
        "measurementType": "${thaiProduct.measurementType}",
        "calculatedArea": 18.75,
        "quantity": 12.5,
        "unitPrice": ${thaiProduct.sellingPrice},
        "totalPrice": ${12.5 * thaiProduct.sellingPrice},
        "variantDisplay": "${thaiProduct.materialType} (${thaiProduct.company}, ${thaiProduct.thicknessMM}mm, ${thaiProduct.quality})"
      }
    ]
  }
}`);

  } catch (error) {
    console.error('❌ Test preparation failed:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await testInvoiceAPI();
    console.log('\n🎉 Invoice API test preparation completed!');
  } catch (error) {
    console.error('❌ Test preparation failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
  }
};

// Run the test
main();