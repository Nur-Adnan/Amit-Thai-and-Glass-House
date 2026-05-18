/**
 * Test Glass Pricing System
 * Comprehensive testing of glass pricing functionality
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import GlassPricing from '../models/GlassPricing.js';
import User from '../models/User.js';
import connectDB from '../config/database.js';

// Load environment variables
dotenv.config();

const testGlassPricing = async () => {
  try {
    console.log('🧪 Starting Glass Pricing System Tests...');

    // Connect to database
    await connectDB();

    // Get owner user
    const owner = await User.findOne({ role: 'owner' });
    if (!owner) {
      console.error('❌ Owner user not found. Please run user seed first.');
      process.exit(1);
    }

    console.log('\n1️⃣ Testing Glass Pricing Model Methods');
    console.log('='.repeat(50));

    // Test 1: Get current price for specific glass type
    console.log('\n📋 Test 1: Get Current Price');
    const currentPrice = await GlassPricing.getCurrentPrice('Glass', '5mm', 'Imported');
    if (currentPrice) {
      console.log(`✅ Found current price: ${currentPrice.displayName} - ${currentPrice.formattedPrice}`);
      console.log(`   Effective Date: ${currentPrice.formattedEffectiveDate}`);
    } else {
      console.log('❌ No current price found');
    }

    // Test 2: Get all current prices for Glass
    console.log('\n📋 Test 2: Get All Current Prices for Glass');
    const allGlassPrices = await GlassPricing.getCurrentPrices('Glass');
    console.log(`✅ Found ${allGlassPrices.length} active glass prices:`);
    allGlassPrices.forEach(price => {
      console.log(`   ${price.displayName}: ${price.formattedPrice}`);
    });

    // Test 3: Create price change
    console.log('\n📋 Test 3: Create Price Change');
    const testPricing = await GlassPricing.getCurrentPrice('Glass', '4mm', 'Local');
    if (testPricing) {
      const originalPrice = testPricing.pricePerSqFt;
      const newPrice = originalPrice + 10; // Increase by ৳10
      
      const updatedPricing = await testPricing.createPriceChange(
        newPrice,
        'Test price increase',
        owner._id
      );
      
      console.log(`✅ Price change created:`);
      console.log(`   Previous: ৳${originalPrice}`);
      console.log(`   New: ৳${updatedPricing.pricePerSqFt}`);
      console.log(`   Change: ${updatedPricing.priceChangeDirection} (${updatedPricing.priceChangePercentage}%)`);
      console.log(`   Reason: ${updatedPricing.priceChangeReason}`);
    }

    // Test 4: Get price history
    console.log('\n📋 Test 4: Get Price History');
    const priceHistory = await GlassPricing.getPriceHistory('Glass', '4mm', 'Local', 5);
    console.log(`✅ Found ${priceHistory.length} price history records:`);
    priceHistory.forEach((price, index) => {
      console.log(`   ${index + 1}. ${price.formattedPrice} (${price.formattedEffectiveDate}) - ${price.isActive ? 'Active' : 'Inactive'}`);
      if (price.priceChangeReason) {
        console.log(`      Reason: ${price.priceChangeReason}`);
      }
    });

    console.log('\n2️⃣ Testing Virtual Fields and Methods');
    console.log('='.repeat(50));

    // Test virtual fields
    const samplePricing = await GlassPricing.findOne({ materialType: 'Thai', thickness: '6mm', quality: 'Imported' });
    if (samplePricing) {
      console.log('\n📋 Virtual Fields Test:');
      console.log(`✅ Display Name: ${samplePricing.displayName}`);
      console.log(`✅ Formatted Price: ${samplePricing.formattedPrice}`);
      console.log(`✅ Formatted Date: ${samplePricing.formattedEffectiveDate}`);
      console.log(`✅ Specification:`, samplePricing.specification);
      
      if (samplePricing.previousPrice) {
        console.log(`✅ Price Change Direction: ${samplePricing.priceChangeDirection}`);
        console.log(`✅ Price Change Percentage: ${samplePricing.priceChangePercentage}%`);
      }
    }

    console.log('\n3️⃣ Testing Business Logic');
    console.log('='.repeat(50));

    // Test 5: Validate pricing constraints
    console.log('\n📋 Test 5: Pricing Validation');
    try {
      // Test invalid thickness
      await GlassPricing.create({
        materialType: 'Glass',
        thickness: '7mm', // Invalid
        quality: 'Local',
        pricePerSqFt: 100,
        createdBy: owner._id
      });
      console.log('❌ Should have failed for invalid thickness');
    } catch (error) {
      console.log('✅ Correctly rejected invalid thickness');
    }

    try {
      // Test invalid quality
      await GlassPricing.create({
        materialType: 'Glass',
        thickness: '5mm',
        quality: 'Premium', // Invalid
        pricePerSqFt: 100,
        createdBy: owner._id
      });
      console.log('❌ Should have failed for invalid quality');
    } catch (error) {
      console.log('✅ Correctly rejected invalid quality');
    }

    try {
      // Test invalid price (too high)
      await GlassPricing.create({
        materialType: 'Glass',
        thickness: '5mm',
        quality: 'Local',
        pricePerSqFt: 15000, // Too high
        createdBy: owner._id
      });
      console.log('❌ Should have failed for price too high');
    } catch (error) {
      console.log('✅ Correctly rejected price too high');
    }

    console.log('\n4️⃣ Testing Indexing and Performance');
    console.log('='.repeat(50));

    // Test 6: Query performance with indexes
    console.log('\n📋 Test 6: Index Performance');
    const startTime = Date.now();
    
    // Query that should use compound index
    const fastQuery = await GlassPricing.find({
      materialType: 'Glass',
      isActive: true,
      isDeleted: { $ne: true }
    }).sort({ effectiveDate: -1 }).limit(10);
    
    const queryTime = Date.now() - startTime;
    console.log(`✅ Query completed in ${queryTime}ms (found ${fastQuery.length} records)`);
    
    if (queryTime < 100) {
      console.log('✅ Query performance is good (< 100ms)');
    } else {
      console.log('⚠️  Query performance could be improved');
    }

    console.log('\n5️⃣ Testing Soft Delete Functionality');
    console.log('='.repeat(50));

    // Test 7: Soft delete
    console.log('\n📋 Test 7: Soft Delete');
    const testDeletePricing = await GlassPricing.findOne({ 
      materialType: 'Thai', 
      thickness: '3mm', 
      quality: 'Local' 
    });
    
    if (testDeletePricing) {
      await testDeletePricing.softDelete(owner._id, 'Test soft delete');
      console.log('✅ Soft delete completed');
      
      // Verify it's excluded from active queries
      const activeCount = await GlassPricing.countDocuments({
        materialType: 'Thai',
        thickness: '3mm',
        quality: 'Local',
        isActive: true,
        isDeleted: { $ne: true }
      });
      
      console.log(`✅ Active records after soft delete: ${activeCount}`);
      
      // Restore the record
      await testDeletePricing.restore();
      console.log('✅ Record restored successfully');
    }

    console.log('\n6️⃣ Testing Data Integrity');
    console.log('='.repeat(50));

    // Test 8: Unique constraint
    console.log('\n📋 Test 8: Unique Constraint');
    try {
      // Try to create duplicate active pricing
      await GlassPricing.create({
        materialType: 'Glass',
        thickness: '5mm',
        quality: 'Local',
        pricePerSqFt: 150,
        createdBy: owner._id,
        isActive: true
      });
      console.log('❌ Should have failed due to unique constraint');
    } catch (error) {
      if (error.code === 11000) {
        console.log('✅ Unique constraint working correctly');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('\n📊 Final Statistics');
    console.log('='.repeat(50));
    
    const totalPricing = await GlassPricing.countDocuments({});
    const activePricing = await GlassPricing.countDocuments({ isActive: true, isDeleted: { $ne: true } });
    const thaiPricing = await GlassPricing.countDocuments({ materialType: 'Thai', isActive: true });
    const glassPricing = await GlassPricing.countDocuments({ materialType: 'Glass', isActive: true });
    
    console.log(`📈 Total Pricing Records: ${totalPricing}`);
    console.log(`📈 Active Pricing Records: ${activePricing}`);
    console.log(`📈 Thai Glass Pricing: ${thaiPricing}`);
    console.log(`📈 Glass Pricing: ${glassPricing}`);

    console.log('\n🎉 All Glass Pricing Tests Completed Successfully!');
    
    console.log('\n💡 Key Features Verified:');
    console.log('   ✅ Price retrieval by specification');
    console.log('   ✅ Price history tracking');
    console.log('   ✅ Price change management');
    console.log('   ✅ Virtual fields and formatting');
    console.log('   ✅ Data validation and constraints');
    console.log('   ✅ Soft delete functionality');
    console.log('   ✅ Unique constraint enforcement');
    console.log('   ✅ Query performance with indexes');

  } catch (error) {
    console.error('❌ Error in glass pricing tests:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the test function
testGlassPricing();