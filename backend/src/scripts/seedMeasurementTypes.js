/**
 * Seed Measurement Types Configuration
 * Sets up calculator configurations for Thai and Glass with all measurement types
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CalculatorConfig from '../models/CalculatorConfig.js';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Seed calculator configurations
const seedCalculatorConfigs = async () => {
  console.log('🌱 Seeding Calculator Configurations with Measurement Types...\n');

  try {
    // Find an admin user to use as creator
    let adminUser = await User.findOne({ role: 'owner' });
    if (!adminUser) {
      adminUser = await User.findOne({ role: 'manager' });
    }
    if (!adminUser) {
      console.log('⚠️  No admin user found. Creating configurations without user reference.');
      adminUser = { _id: new mongoose.Types.ObjectId() };
    }

    // Thai Glass Configuration
    const thaiConfig = {
      materialType: 'Thai',
      pricing: {
        SFT: {
          pricePerSqFt: 180, // ৳180 per square foot
          isActive: true
        },
        RFT: {
          pricePerRunningFt: 120, // ৳120 per running foot
          isActive: true
        },
        PANEL: {
          pricePerPanel: 850, // ৳850 per panel
          standardSize: {
            length: 4, // 4 feet
            width: 6   // 6 feet
          },
          isActive: true
        },
        SHEET: {
          pricePerSheet: 450, // ৳450 per sheet
          standardSize: {
            length: 8, // 8 feet
            width: 4   // 4 feet
          },
          isActive: true
        },
        CUSTOM: {
          allowCustomPricing: true,
          isActive: true
        }
      },
      supportedMeasurementTypes: ['SFT', 'RFT', 'PANEL', 'SHEET', 'CUSTOM'],
      defaultMeasurementType: 'SFT',
      pricePerSqFt: 180, // For backward compatibility
      isActive: true,
      createdBy: adminUser._id
    };

    // Glass Configuration
    const glassConfig = {
      materialType: 'Glass',
      pricing: {
        SFT: {
          pricePerSqFt: 220, // ৳220 per square foot (higher quality)
          isActive: true
        },
        RFT: {
          pricePerRunningFt: 150, // ৳150 per running foot
          isActive: true
        },
        PANEL: {
          pricePerPanel: 1200, // ৳1200 per panel (premium glass)
          standardSize: {
            length: 4, // 4 feet
            width: 6   // 6 feet
          },
          isActive: true
        },
        SHEET: {
          pricePerSheet: 650, // ৳650 per sheet
          standardSize: {
            length: 8, // 8 feet
            width: 4   // 4 feet
          },
          isActive: true
        },
        CUSTOM: {
          allowCustomPricing: true,
          isActive: true
        }
      },
      supportedMeasurementTypes: ['SFT', 'RFT', 'PANEL', 'SHEET', 'CUSTOM'],
      defaultMeasurementType: 'SFT',
      pricePerSqFt: 220, // For backward compatibility
      isActive: true,
      createdBy: adminUser._id
    };

    // Delete existing configurations
    await CalculatorConfig.deleteMany({});
    console.log('🗑️  Cleared existing calculator configurations');

    // Create new configurations
    const thaiConfigDoc = await CalculatorConfig.create(thaiConfig);
    console.log('✅ Created Thai configuration:');
    console.log(`   - Material Type: ${thaiConfigDoc.materialType}`);
    console.log(`   - Active Measurement Types: ${thaiConfigDoc.getActiveMeasurementTypes().join(', ')}`);
    console.log(`   - SFT Price: ৳${thaiConfigDoc.pricing.SFT.pricePerSqFt}/sq ft`);
    console.log(`   - RFT Price: ৳${thaiConfigDoc.pricing.RFT.pricePerRunningFt}/running ft`);
    console.log(`   - Panel Price: ৳${thaiConfigDoc.pricing.PANEL.pricePerPanel}/panel (${thaiConfigDoc.pricing.PANEL.standardSize.length}ft × ${thaiConfigDoc.pricing.PANEL.standardSize.width}ft)`);
    console.log(`   - Sheet Price: ৳${thaiConfigDoc.pricing.SHEET.pricePerSheet}/sheet (${thaiConfigDoc.pricing.SHEET.standardSize.length}ft × ${thaiConfigDoc.pricing.SHEET.standardSize.width}ft)`);

    const glassConfigDoc = await CalculatorConfig.create(glassConfig);
    console.log('\n✅ Created Glass configuration:');
    console.log(`   - Material Type: ${glassConfigDoc.materialType}`);
    console.log(`   - Active Measurement Types: ${glassConfigDoc.getActiveMeasurementTypes().join(', ')}`);
    console.log(`   - SFT Price: ৳${glassConfigDoc.pricing.SFT.pricePerSqFt}/sq ft`);
    console.log(`   - RFT Price: ৳${glassConfigDoc.pricing.RFT.pricePerRunningFt}/running ft`);
    console.log(`   - Panel Price: ৳${glassConfigDoc.pricing.PANEL.pricePerPanel}/panel (${glassConfigDoc.pricing.PANEL.standardSize.length}ft × ${glassConfigDoc.pricing.PANEL.standardSize.width}ft)`);
    console.log(`   - Sheet Price: ৳${glassConfigDoc.pricing.SHEET.pricePerSheet}/sheet (${glassConfigDoc.pricing.SHEET.standardSize.length}ft × ${glassConfigDoc.pricing.SHEET.standardSize.width}ft)`);

    console.log('\n🎉 Calculator configurations seeded successfully!');
    
    // Display usage examples
    console.log('\n📋 Usage Examples:');
    console.log('\n--- SFT (Square Foot) Example ---');
    console.log('POST /api/calculator/calculate');
    console.log(JSON.stringify({
      materialType: 'Thai',
      measurementType: 'SFT',
      lengthFeet: 5,
      lengthInches: 6,
      widthFeet: 3,
      widthInches: 0
    }, null, 2));

    console.log('\n--- RFT (Running Foot) Example ---');
    console.log('POST /api/calculator/calculate');
    console.log(JSON.stringify({
      materialType: 'Glass',
      measurementType: 'RFT',
      runningLengthFeet: 12,
      runningLengthInches: 3
    }, null, 2));

    console.log('\n--- PANEL Example ---');
    console.log('POST /api/calculator/calculate');
    console.log(JSON.stringify({
      materialType: 'Thai',
      measurementType: 'PANEL',
      panelCount: 6
    }, null, 2));

    console.log('\n--- SHEET Example ---');
    console.log('POST /api/calculator/calculate');
    console.log(JSON.stringify({
      materialType: 'Glass',
      measurementType: 'SHEET',
      sheetCount: 10
    }, null, 2));

    console.log('\n--- CUSTOM Example ---');
    console.log('POST /api/calculator/calculate');
    console.log(JSON.stringify({
      materialType: 'Thai',
      measurementType: 'CUSTOM',
      customQuantity: 24,
      customUnitPrice: 35,
      customUnit: 'pieces'
    }, null, 2));

  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  }
};

// Main function
const runSeed = async () => {
  try {
    await connectDB();
    await seedCalculatorConfigs();
  } catch (error) {
    console.error('❌ Seed execution error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeed();
}

export default runSeed;