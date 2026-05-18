/**
 * Test Product Variants Functionality
 * Tests the new variant system for Thai & Glass products
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import connectDB from '../config/database.js';

// Load environment variables
dotenv.config();

const testProductVariants = async () => {
  try {
    console.log('🧪 Testing Product Variants Functionality...');

    // Connect to database
    await connectDB();

    // Test 1: Find all variants of "Clear Glass"
    console.log('\n📋 Test 1: Finding all variants of "Clear Glass"');
    console.log('-'.repeat(50));
    
    const clearGlassVariants = await Product.findVariants('Clear Glass');
    console.log(`Found ${clearGlassVariants.length} variants of Clear Glass:`);
    
    clearGlassVariants.forEach(variant => {
      console.log(`  - ${variant.variantDisplayName} (Stock: ${variant.stockQuantity})`);
      console.log(`    Specification: ${JSON.stringify(variant.variantSpecification)}`);
      console.log(`    Variant Key: ${variant.variantKey}`);
    });

    // Test 2: Check if specific variant exists
    console.log('\n📋 Test 2: Checking if specific variant exists');
    console.log('-'.repeat(50));
    
    const existingVariant = await Product.variantExists(
      'Clear Glass', 
      'Glass', 
      'Nasir Glass', 
      5, 
      'Imported'
    );
    
    if (existingVariant) {
      console.log('✅ Variant exists:');
      console.log(`   ${existingVariant.variantDisplayName}`);
      console.log(`   Stock: ${existingVariant.stockQuantity}`);
      console.log(`   Price: ৳${existingVariant.sellingPrice}/sqft`);
    } else {
      console.log('❌ Variant does not exist');
    }

    // Test 3: Try to find non-existent variant
    console.log('\n📋 Test 3: Checking non-existent variant');
    console.log('-'.repeat(50));
    
    const nonExistentVariant = await Product.variantExists(
      'Clear Glass', 
      'Glass', 
      'Non-existent Company', 
      12, 
      'Local'
    );
    
    console.log(`Non-existent variant found: ${!!nonExistentVariant}`);

    // Test 4: Get similar variants for a product
    console.log('\n📋 Test 4: Getting similar variants');
    console.log('-'.repeat(50));
    
    const sampleProduct = await Product.findOne({ name: 'Thai Glass' });
    if (sampleProduct) {
      const similarVariants = await sampleProduct.getSimilarVariants();
      console.log(`Found ${similarVariants.length} similar variants for "${sampleProduct.name}":`);
      
      similarVariants.forEach(variant => {
        console.log(`  - ${variant.variantDisplayName}`);
      });
    }

    // Test 5: Test virtual fields
    console.log('\n📋 Test 5: Testing virtual fields');
    console.log('-'.repeat(50));
    
    const testProduct = await Product.findOne({ 
      name: 'Clear Glass',
      company: 'Guardian Glass' 
    });
    
    if (testProduct) {
      console.log('Virtual Fields Test:');
      console.log(`  Product Name: ${testProduct.name}`);
      console.log(`  Variant Display Name: ${testProduct.variantDisplayName}`);
      console.log(`  Variant Key: ${testProduct.variantKey}`);
      console.log(`  Stock Value: ${testProduct.stockValue}`);
      console.log(`  Profit Margin: ${testProduct.profitMargin}`);
      console.log(`  Profit Amount: ${testProduct.profitAmount}`);
      console.log(`  Stock Status: ${testProduct.stockStatus}`);
    }

    // Test 6: Aggregation by variants
    console.log('\n📋 Test 6: Aggregation statistics');
    console.log('-'.repeat(50));
    
    const variantStats = await Product.aggregate([
      {
        $match: { 
          materialType: { $in: ['Thai', 'Glass'] },
          isDeleted: { $ne: true }
        }
      },
      {
        $group: {
          _id: {
            name: '$name',
            materialType: '$materialType'
          },
          variantCount: { $sum: 1 },
          totalStock: { $sum: '$stockQuantity' },
          avgPrice: { $avg: '$sellingPrice' },
          companies: { $addToSet: '$company' },
          thicknesses: { $addToSet: '$thicknessMM' }
        }
      },
      {
        $sort: { variantCount: -1 }
      }
    ]);

    console.log('Product Variant Statistics:');
    variantStats.forEach(stat => {
      console.log(`  ${stat._id.name} (${stat._id.materialType}):`);
      console.log(`    Variants: ${stat.variantCount}`);
      console.log(`    Total Stock: ${stat.totalStock}`);
      console.log(`    Avg Price: ৳${stat.avgPrice.toFixed(2)}`);
      console.log(`    Companies: ${stat.companies.join(', ')}`);
      console.log(`    Thicknesses: ${stat.thicknesses.sort((a, b) => a - b).join('mm, ')}mm`);
    });

    // Test 7: Test unique constraint
    console.log('\n📋 Test 7: Testing unique constraint');
    console.log('-'.repeat(50));
    
    try {
      const duplicateVariant = new Product({
        name: "Clear Glass",
        materialType: "Glass",
        company: "Nasir Glass",
        thicknessMM: 5,
        quality: "Imported",
        measurementType: "SFT",
        purchasePrice: 140,
        sellingPrice: 180,
        stockQuantity: 50,
        createdBy: new mongoose.Types.ObjectId()
      });
      
      await duplicateVariant.save();
      console.log('❌ Duplicate variant was saved (this should not happen)');
    } catch (error) {
      if (error.code === 11000) {
        console.log('✅ Unique constraint working - duplicate variant rejected');
      } else {
        console.log(`❌ Unexpected error: ${error.message}`);
      }
    }

    console.log('\n🎉 All variant tests completed successfully!');

  } catch (error) {
    console.error('❌ Error testing product variants:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the test function
testProductVariants();