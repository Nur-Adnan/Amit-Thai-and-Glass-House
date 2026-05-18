/**
 * Seed Brand Data
 * Creates standard Thai & Glass company/brand names commonly used in Bangladesh
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Brand from '../models/Brand.js';
import User from '../models/User.js';
import connectDB from '../config/database.js';

// Load environment variables
dotenv.config();

const seedBrands = async () => {
  try {
    console.log('🔄 Starting brand seed...');

    // Connect to database
    await connectDB();

    // Get owner user for createdBy field
    const owner = await User.findOne({ role: 'owner' });
    if (!owner) {
      console.error('❌ Owner user not found. Please run user seed first.');
      process.exit(1);
    }

    // Clear existing brands
    await Brand.deleteMany({});
    console.log('🗑️  Cleared existing brand data');

    // Standard Thai & Glass brands commonly used in Bangladesh
    const brandData = [
      // Thai Glass Brands
      {
        name: "Thai Float Glass",
        materialType: "Thai",
        country: "Thailand",
        notes: "Leading Thai glass manufacturer, popular in Bangladesh construction",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "Bangkok Glass",
        materialType: "Thai",
        country: "Thailand", 
        notes: "Premium Thai glass brand, high quality imported glass",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "Guardian Glass Thailand",
        materialType: "Thai",
        country: "Thailand",
        notes: "International brand with Thai manufacturing, premium quality",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "Asahi Glass Thailand",
        materialType: "Thai",
        country: "Thailand",
        notes: "Japanese brand manufactured in Thailand, excellent quality",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "Thai Toughened Glass",
        materialType: "Thai",
        country: "Thailand",
        notes: "Specialized in toughened and safety glass products",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "Siam Glass",
        materialType: "Thai",
        country: "Thailand",
        notes: "Traditional Thai glass manufacturer, good value for money",
        createdBy: owner._id,
        isActive: true
      },

      // Local Glass Brands (Bangladesh)
      {
        name: "Nasir Glass",
        materialType: "Glass",
        country: "Bangladesh",
        notes: "Leading local glass manufacturer, widely available across Bangladesh",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "PHP Glass",
        materialType: "Glass",
        country: "Bangladesh",
        notes: "PHP Group glass division, quality local glass products",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "Dhaka Glass",
        materialType: "Glass",
        country: "Bangladesh",
        notes: "Local glass manufacturer based in Dhaka, competitive pricing",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "Bengal Glass",
        materialType: "Glass",
        country: "Bangladesh",
        notes: "Regional glass manufacturer, good for standard applications",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "Chittagong Glass Works",
        materialType: "Glass",
        country: "Bangladesh",
        notes: "Port city based manufacturer, efficient distribution",
        createdBy: owner._id,
        isActive: true
      },

      // International Glass Brands (Imported)
      {
        name: "Guardian Glass",
        materialType: "Glass",
        country: "USA",
        notes: "Premium international glass brand, high-end applications",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "Pilkington",
        materialType: "Glass",
        country: "UK",
        notes: "British glass manufacturer, premium quality imported glass",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "Saint-Gobain",
        materialType: "Glass",
        country: "France",
        notes: "French multinational, high-end architectural glass",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "Asahi Glass",
        materialType: "Glass",
        country: "Japan",
        notes: "Japanese glass manufacturer, premium quality and technology",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "Xinyi Glass",
        materialType: "Glass",
        country: "China",
        notes: "Chinese glass manufacturer, cost-effective imported option",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "Fuyao Glass",
        materialType: "Glass",
        country: "China",
        notes: "Major Chinese glass producer, automotive and construction glass",
        createdBy: owner._id,
        isActive: true
      },

      // Specialized/Regional Brands
      {
        name: "Indo Glass",
        materialType: "Glass",
        country: "India",
        notes: "Indian glass manufacturer, regional import option",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "Myanmar Glass",
        materialType: "Glass",
        country: "Myanmar",
        notes: "Regional glass supplier, border trade option",
        createdBy: owner._id,
        isActive: true
      },

      // Some inactive brands for testing
      {
        name: "Old Thai Glass Co",
        materialType: "Thai",
        country: "Thailand",
        notes: "Legacy brand, no longer actively imported",
        createdBy: owner._id,
        isActive: false
      },
      {
        name: "Discontinued Glass Brand",
        materialType: "Glass",
        country: "Bangladesh",
        notes: "Previously used local brand, now discontinued",
        createdBy: owner._id,
        isActive: false
      }
    ];

    // Create brands
    const createdBrands = await Brand.insertMany(brandData);
    console.log(`✅ Created ${createdBrands.length} brands`);

    // Display created brands grouped by material type and country
    console.log('\n📊 Brand Summary:');
    console.log('='.repeat(80));
    
    const groupedBrands = {};
    createdBrands.forEach(brand => {
      const key = `${brand.materialType} - ${brand.country}`;
      if (!groupedBrands[key]) {
        groupedBrands[key] = [];
      }
      groupedBrands[key].push(brand);
    });

    Object.keys(groupedBrands).sort().forEach(group => {
      console.log(`\n${group}:`);
      console.log('-'.repeat(50));
      
      groupedBrands[group].forEach(brand => {
        const status = brand.isActive ? '✅ Active' : '❌ Inactive';
        console.log(`  ${brand.name} ${status}`);
        if (brand.notes) {
          console.log(`    ${brand.notes}`);
        }
      });
    });

    // Display statistics
    const stats = {
      totalBrands: createdBrands.length,
      byMaterialType: {},
      byCountry: {},
      byStatus: {
        active: 0,
        inactive: 0
      }
    };

    createdBrands.forEach(brand => {
      // Material type stats
      if (!stats.byMaterialType[brand.materialType]) {
        stats.byMaterialType[brand.materialType] = 0;
      }
      stats.byMaterialType[brand.materialType]++;

      // Country stats
      if (!stats.byCountry[brand.country]) {
        stats.byCountry[brand.country] = 0;
      }
      stats.byCountry[brand.country]++;

      // Status stats
      if (brand.isActive) {
        stats.byStatus.active++;
      } else {
        stats.byStatus.inactive++;
      }
    });

    console.log('\n📈 Statistics:');
    console.log('='.repeat(40));
    console.log(`Total Brands: ${stats.totalBrands}`);
    console.log(`\nBy Material Type:`);
    Object.entries(stats.byMaterialType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} brands`);
    });
    console.log(`\nBy Country:`);
    Object.entries(stats.byCountry).forEach(([country, count]) => {
      console.log(`  ${country}: ${count} brands`);
    });
    console.log(`\nBy Status:`);
    console.log(`  Active: ${stats.byStatus.active} brands`);
    console.log(`  Inactive: ${stats.byStatus.inactive} brands`);

    console.log('\n🎉 Brand seed completed successfully!');
    console.log('\n💡 Usage Examples:');
    console.log('   - Thai brands: Thai Float Glass, Bangkok Glass, Guardian Glass Thailand');
    console.log('   - Local brands: Nasir Glass, PHP Glass, Dhaka Glass');
    console.log('   - International: Guardian Glass, Pilkington, Saint-Gobain');
    console.log('   - Standardized naming prevents duplicates and ensures consistency');

  } catch (error) {
    console.error('❌ Error seeding brands:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the seed function
seedBrands();