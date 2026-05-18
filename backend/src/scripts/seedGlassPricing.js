/**
 * Seed Glass Pricing Data
 * Creates initial glass pricing for different thickness and quality combinations
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import GlassPricing from '../models/GlassPricing.js';
import User from '../models/User.js';
import connectDB from '../config/database.js';

// Load environment variables
dotenv.config();

const seedGlassPricing = async () => {
  try {
    console.log('🔄 Starting glass pricing seed...');

    // Connect to database
    await connectDB();

    // Get owner user for createdBy field
    const owner = await User.findOne({ role: 'owner' });
    if (!owner) {
      console.error('❌ Owner user not found. Please run user seed first.');
      process.exit(1);
    }

    // Clear existing glass pricing
    await GlassPricing.deleteMany({});
    console.log('🗑️  Cleared existing glass pricing data');

    // Glass pricing data for Bangladesh market
    const glassPricingData = [
      // Thai Glass Pricing
      {
        materialType: 'Thai',
        thickness: '3mm',
        quality: 'Local',
        pricePerSqFt: 85,
        priceChangeReason: 'Initial pricing setup',
        createdBy: owner._id,
        isActive: true
      },
      {
        materialType: 'Thai',
        thickness: '3mm',
        quality: 'Imported',
        pricePerSqFt: 120,
        priceChangeReason: 'Initial pricing setup',
        createdBy: owner._id,
        isActive: true
      },
      {
        materialType: 'Thai',
        thickness: '4mm',
        quality: 'Local',
        pricePerSqFt: 95,
        priceChangeReason: 'Initial pricing setup',
        createdBy: owner._id,
        isActive: true
      },
      {
        materialType: 'Thai',
        thickness: '4mm',
        quality: 'Imported',
        pricePerSqFt: 135,
        priceChangeReason: 'Initial pricing setup',
        createdBy: owner._id,
        isActive: true
      },
      {
        materialType: 'Thai',
        thickness: '5mm',
        quality: 'Local',
        pricePerSqFt: 110,
        priceChangeReason: 'Initial pricing setup',
        createdBy: owner._id,
        isActive: true
      },
      {
        materialType: 'Thai',
        thickness: '5mm',
        quality: 'Imported',
        pricePerSqFt: 155,
        priceChangeReason: 'Initial pricing setup',
        createdBy: owner._id,
        isActive: true
      },
      {
        materialType: 'Thai',
        thickness: '6mm',
        quality: 'Local',
        pricePerSqFt: 125,
        priceChangeReason: 'Initial pricing setup',
        createdBy: owner._id,
        isActive: true
      },
      {
        materialType: 'Thai',
        thickness: '6mm',
        quality: 'Imported',
        pricePerSqFt: 175,
        priceChangeReason: 'Initial pricing setup',
        createdBy: owner._id,
        isActive: true
      },

      // Glass Pricing
      {
        materialType: 'Glass',
        thickness: '3mm',
        quality: 'Local',
        pricePerSqFt: 75,
        priceChangeReason: 'Initial pricing setup',
        createdBy: owner._id,
        isActive: true
      },
      {
        materialType: 'Glass',
        thickness: '3mm',
        quality: 'Imported',
        pricePerSqFt: 105,
        priceChangeReason: 'Initial pricing setup',
        createdBy: owner._id,
        isActive: true
      },
      {
        materialType: 'Glass',
        thickness: '4mm',
        quality: 'Local',
        pricePerSqFt: 85,
        priceChangeReason: 'Initial pricing setup',
        createdBy: owner._id,
        isActive: true
      },
      {
        materialType: 'Glass',
        thickness: '4mm',
        quality: 'Imported',
        pricePerSqFt: 120,
        priceChangeReason: 'Initial pricing setup',
        createdBy: owner._id,
        isActive: true
      },
      {
        materialType: 'Glass',
        thickness: '5mm',
        quality: 'Local',
        pricePerSqFt: 100,
        priceChangeReason: 'Initial pricing setup',
        createdBy: owner._id,
        isActive: true
      },
      {
        materialType: 'Glass',
        thickness: '5mm',
        quality: 'Imported',
        pricePerSqFt: 140,
        priceChangeReason: 'Initial pricing setup',
        createdBy: owner._id,
        isActive: true
      },
      {
        materialType: 'Glass',
        thickness: '6mm',
        quality: 'Local',
        pricePerSqFt: 115,
        priceChangeReason: 'Initial pricing setup',
        createdBy: owner._id,
        isActive: true
      },
      {
        materialType: 'Glass',
        thickness: '6mm',
        quality: 'Imported',
        pricePerSqFt: 160,
        priceChangeReason: 'Initial pricing setup',
        createdBy: owner._id,
        isActive: true
      }
    ];

    // Create glass pricing records
    const createdPricing = await GlassPricing.insertMany(glassPricingData);
    console.log(`✅ Created ${createdPricing.length} glass pricing records`);

    // Display created pricing
    console.log('\n📊 Glass Pricing Summary:');
    console.log('='.repeat(60));
    
    const groupedPricing = {};
    createdPricing.forEach(pricing => {
      const key = pricing.materialType;
      if (!groupedPricing[key]) {
        groupedPricing[key] = [];
      }
      groupedPricing[key].push(pricing);
    });

    Object.keys(groupedPricing).forEach(materialType => {
      console.log(`\n${materialType} Glass:`);
      console.log('-'.repeat(40));
      
      groupedPricing[materialType].forEach(pricing => {
        console.log(`  ${pricing.thickness} ${pricing.quality}: ৳${pricing.pricePerSqFt}/sqft`);
      });
    });

    console.log('\n🎉 Glass pricing seed completed successfully!');
    console.log('\n💡 Usage Examples:');
    console.log('   - 5mm Local Thai Glass: ৳110/sqft');
    console.log('   - 4mm Imported Glass: ৳120/sqft');
    console.log('   - 6mm Imported Thai Glass: ৳175/sqft');

  } catch (error) {
    console.error('❌ Error seeding glass pricing:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the seed function
seedGlassPricing();