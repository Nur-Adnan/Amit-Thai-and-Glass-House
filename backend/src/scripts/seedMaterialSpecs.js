import mongoose from 'mongoose';
import MaterialSpec from '../models/MaterialSpec.js';
import User from '../models/User.js';
import config from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * Seed Material Specifications for Bangladesh Glass & Thai Market
 * 
 * This script creates standard material specifications that will be used
 * to populate dropdowns and validate product creation.
 */

const materialSpecs = [
  // Glass Specifications - Standard Bangladesh Market
  {
    materialType: 'Glass',
    thicknessMM: 3,
    quality: 'Local',
    defaultUnit: 'SFT',
    description: '3mm Local Glass - Standard quality for basic applications',
    notes: 'Most economical option for residential use'
  },
  {
    materialType: 'Glass',
    thicknessMM: 4,
    quality: 'Local',
    defaultUnit: 'SFT',
    description: '4mm Local Glass - Good quality for windows and doors',
    notes: 'Popular choice for residential windows'
  },
  {
    materialType: 'Glass',
    thicknessMM: 5,
    quality: 'Local',
    defaultUnit: 'SFT',
    description: '5mm Local Glass - Standard thickness for most applications',
    notes: 'Most commonly used thickness in Bangladesh'
  },
  {
    materialType: 'Glass',
    thicknessMM: 6,
    quality: 'Local',
    defaultUnit: 'SFT',
    description: '6mm Local Glass - Heavy duty applications',
    notes: 'Suitable for large windows and commercial use'
  },
  {
    materialType: 'Glass',
    thicknessMM: 8,
    quality: 'Local',
    defaultUnit: 'SFT',
    description: '8mm Local Glass - Extra strength for commercial use',
    notes: 'Used in commercial buildings and large installations'
  },
  {
    materialType: 'Glass',
    thicknessMM: 10,
    quality: 'Local',
    defaultUnit: 'SFT',
    description: '10mm Local Glass - Premium thickness for special applications',
    notes: 'High-end residential and commercial projects'
  },
  
  // Imported Glass Specifications
  {
    materialType: 'Glass',
    thicknessMM: 3,
    quality: 'Imported',
    defaultUnit: 'SFT',
    description: '3mm Imported Glass - Superior clarity and finish',
    notes: 'Better optical quality than local glass'
  },
  {
    materialType: 'Glass',
    thicknessMM: 4,
    quality: 'Imported',
    defaultUnit: 'SFT',
    description: '4mm Imported Glass - High quality for premium applications',
    notes: 'Excellent for high-end residential projects'
  },
  {
    materialType: 'Glass',
    thicknessMM: 5,
    quality: 'Imported',
    defaultUnit: 'SFT',
    description: '5mm Imported Glass - Premium standard thickness',
    notes: 'Top choice for quality-conscious customers'
  },
  {
    materialType: 'Glass',
    thicknessMM: 6,
    quality: 'Imported',
    defaultUnit: 'SFT',
    description: '6mm Imported Glass - Premium heavy duty',
    notes: 'Best quality for commercial and luxury residential'
  },
  {
    materialType: 'Glass',
    thicknessMM: 8,
    quality: 'Imported',
    defaultUnit: 'SFT',
    description: '8mm Imported Glass - Premium commercial grade',
    notes: 'Top quality for high-end commercial projects'
  },
  {
    materialType: 'Glass',
    thicknessMM: 10,
    quality: 'Imported',
    defaultUnit: 'SFT',
    description: '10mm Imported Glass - Ultra premium thickness',
    notes: 'Luxury applications and special architectural projects'
  },
  {
    materialType: 'Glass',
    thicknessMM: 12,
    quality: 'Imported',
    defaultUnit: 'SFT',
    description: '12mm Imported Glass - Extra thick for special applications',
    notes: 'Structural glazing and high-security applications'
  },
  
  // Premium Glass Specifications
  {
    materialType: 'Glass',
    thicknessMM: 5,
    quality: 'Premium',
    defaultUnit: 'SFT',
    description: '5mm Premium Glass - Top-tier quality with special treatments',
    notes: 'May include special coatings or treatments'
  },
  {
    materialType: 'Glass',
    thicknessMM: 6,
    quality: 'Premium',
    defaultUnit: 'SFT',
    description: '6mm Premium Glass - Luxury grade with enhanced properties',
    notes: 'Special treatments for UV protection or energy efficiency'
  },
  {
    materialType: 'Glass',
    thicknessMM: 8,
    quality: 'Premium',
    defaultUnit: 'SFT',
    description: '8mm Premium Glass - Ultra-high quality for luxury projects',
    notes: 'Top-of-the-line specifications for premium installations'
  },
  
  // Thai Specifications - Standard Bangladesh Market
  {
    materialType: 'Thai',
    thicknessMM: 3,
    quality: 'Local',
    defaultUnit: 'SFT',
    description: '3mm Local Thai - Basic quality aluminum composite',
    notes: 'Entry-level option for budget projects'
  },
  {
    materialType: 'Thai',
    thicknessMM: 4,
    quality: 'Local',
    defaultUnit: 'SFT',
    description: '4mm Local Thai - Standard quality for most applications',
    notes: 'Most popular thickness for residential use'
  },
  {
    materialType: 'Thai',
    thicknessMM: 5,
    quality: 'Local',
    defaultUnit: 'SFT',
    description: '5mm Local Thai - Heavy duty local quality',
    notes: 'Good for commercial and heavy-duty residential use'
  },
  {
    materialType: 'Thai',
    thicknessMM: 6,
    quality: 'Local',
    defaultUnit: 'SFT',
    description: '6mm Local Thai - Premium local thickness',
    notes: 'High-end local option for demanding applications'
  },
  
  // Imported Thai Specifications
  {
    materialType: 'Thai',
    thicknessMM: 3,
    quality: 'Imported',
    defaultUnit: 'SFT',
    description: '3mm Imported Thai - Superior quality aluminum composite',
    notes: 'Better finish and durability than local options'
  },
  {
    materialType: 'Thai',
    thicknessMM: 4,
    quality: 'Imported',
    defaultUnit: 'SFT',
    description: '4mm Imported Thai - High quality standard thickness',
    notes: 'Excellent choice for quality-conscious projects'
  },
  {
    materialType: 'Thai',
    thicknessMM: 5,
    quality: 'Imported',
    defaultUnit: 'SFT',
    description: '5mm Imported Thai - Premium imported quality',
    notes: 'Top choice for commercial and luxury residential'
  },
  {
    materialType: 'Thai',
    thicknessMM: 6,
    quality: 'Imported',
    defaultUnit: 'SFT',
    description: '6mm Imported Thai - Ultra-premium thickness',
    notes: 'Best quality for high-end commercial projects'
  },
  
  // Premium Thai Specifications
  {
    materialType: 'Thai',
    quality: 'Premium',
    defaultUnit: 'SFT',
    description: 'Premium Thai - Top-tier quality with special properties',
    notes: 'May include fire-resistant or weather-resistant treatments'
  },
  
  // Panel-based specifications for special applications
  {
    materialType: 'Thai',
    thicknessMM: 4,
    quality: 'Imported',
    defaultUnit: 'PANEL',
    description: '4mm Imported Thai Panel - Pre-cut panel format',
    notes: 'Standard panel size for modular installations'
  },
  {
    materialType: 'Glass',
    thicknessMM: 5,
    quality: 'Imported',
    defaultUnit: 'PANEL',
    description: '5mm Imported Glass Panel - Pre-cut glass panels',
    notes: 'Standard panel format for curtain wall systems'
  }
];

async function seedMaterialSpecs() {
  try {
    // Connect to database
    await mongoose.connect(config.mongoUri);
    logger.info('Connected to MongoDB for MaterialSpec seeding');

    // Find admin user for createdBy field
    const adminUser = await User.findOne({ role: { $in: ['Admin', 'owner'] } });
    if (!adminUser) {
      throw new Error('Admin or owner user not found. Please create an admin user first.');
    }

    // Clear existing material specifications
    const existingCount = await MaterialSpec.countDocuments();
    if (existingCount > 0) {
      logger.info(`Found ${existingCount} existing material specifications`);
      const shouldClear = process.argv.includes('--clear');
      
      if (shouldClear) {
        await MaterialSpec.deleteMany({});
        logger.info('Cleared existing material specifications');
      } else {
        logger.info('Skipping clear. Use --clear flag to remove existing specifications');
        return;
      }
    }

    // Add createdBy to all specifications
    const specsWithCreator = materialSpecs.map(spec => ({
      ...spec,
      createdBy: adminUser._id,
      isActive: true,
      isDeleted: false
    }));

    // Insert material specifications
    const insertedSpecs = await MaterialSpec.insertMany(specsWithCreator);
    
    logger.info(`✅ Successfully seeded ${insertedSpecs.length} material specifications`);
    
    // Log summary by material type and quality
    const summary = await MaterialSpec.aggregate([
      {
        $group: {
          _id: { materialType: '$materialType', quality: '$quality' },
          count: { $sum: 1 },
          thicknesses: { $push: '$thicknessMM' },
          units: { $addToSet: '$defaultUnit' }
        }
      },
      {
        $sort: { '_id.materialType': 1, '_id.quality': 1 }
      }
    ]);

    logger.info('\n📊 Material Specification Summary:');
    summary.forEach(item => {
      const thicknesses = item.thicknesses.filter(t => t !== null).sort((a, b) => a - b);
      const thicknessStr = thicknesses.length > 0 ? thicknesses.join(', ') + 'mm' : 'Variable';
      logger.info(`  ${item._id.materialType} ${item._id.quality}: ${item.count} specs (${thicknessStr}) [${item.units.join(', ')}]`);
    });

    // Test dropdown options
    logger.info('\n🔍 Testing dropdown options:');
    const dropdownOptions = await MaterialSpec.getDropdownOptions();
    logger.info(`  Material Types: ${dropdownOptions.materialTypes.join(', ')}`);
    logger.info(`  Glass Thicknesses: ${dropdownOptions.thicknesses.Glass?.join(', ') || 'None'}mm`);
    logger.info(`  Thai Thicknesses: ${dropdownOptions.thicknesses.Thai?.join(', ') || 'None'}mm`);
    logger.info(`  Glass Qualities: ${dropdownOptions.qualities.Glass?.join(', ') || 'None'}`);
    logger.info(`  Thai Qualities: ${dropdownOptions.qualities.Thai?.join(', ') || 'None'}`);
    logger.info(`  Available Units: ${dropdownOptions.units.join(', ')}`);

    logger.info('\n✅ Material specification seeding completed successfully!');
    
  } catch (error) {
    logger.error('❌ Error seeding material specifications:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

// Run seeding if called directly
const currentFile = decodeURIComponent(new URL(import.meta.url).pathname);
const calledFile = process.argv[1];

if (currentFile === calledFile) {
  seedMaterialSpecs()
    .then(() => {
      logger.info('Material specification seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Material specification seeding failed:', error);
      process.exit(1);
    });
}

export default seedMaterialSpecs;