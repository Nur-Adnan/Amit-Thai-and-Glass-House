/**
 * Seed Product Variants Data
 * Creates sample Thai & Glass products with different variants (Company/Brand/Thickness/Quality)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import User from '../models/User.js';
import connectDB from '../config/database.js';

// Load environment variables
dotenv.config();

const seedProductVariants = async () => {
  try {
    console.log('🔄 Starting product variants seed...');

    // Connect to database
    await connectDB();

    // Get owner user for createdBy field
    const owner = await User.findOne({ role: 'owner' });
    if (!owner) {
      console.error('❌ Owner user not found. Please run user seed first.');
      process.exit(1);
    }

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing product data');

    // Sample product variants data
    const productVariants = [
      // Clear Glass variants
      {
        name: "Clear Glass",
        materialType: "Glass",
        company: "Nasir Glass",
        thicknessMM: 3,
        quality: "Local",
        measurementType: "SFT",
        purchasePrice: 75,
        sellingPrice: 95,
        stockQuantity: 500,
        unit: "sqft",
        description: "High quality clear glass for windows and doors",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "Clear Glass",
        materialType: "Glass",
        company: "Nasir Glass",
        thicknessMM: 4,
        quality: "Local",
        measurementType: "SFT",
        purchasePrice: 85,
        sellingPrice: 110,
        stockQuantity: 300,
        unit: "sqft",
        description: "High quality clear glass for windows and doors",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "Clear Glass",
        materialType: "Glass",
        company: "Nasir Glass",
        thicknessMM: 5,
        quality: "Local",
        measurementType: "SFT",
        purchasePrice: 100,
        sellingPrice: 130,
        stockQuantity: 200,
        unit: "sqft",
        description: "High quality clear glass for windows and doors",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "Clear Glass",
        materialType: "Glass",
        company: "Nasir Glass",
        thicknessMM: 6,
        quality: "Local",
        measurementType: "SFT",
        purchasePrice: 115,
        sellingPrice: 150,
        stockQuantity: 150,
        unit: "sqft",
        description: "High quality clear glass for windows and doors",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "Clear Glass",
        materialType: "Glass",
        company: "Nasir Glass",
        thicknessMM: 5,
        quality: "Imported",
        measurementType: "SFT",
        purchasePrice: 140,
        sellingPrice: 180,
        stockQuantity: 100,
        unit: "sqft",
        description: "Premium imported clear glass",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "Clear Glass",
        materialType: "Glass",
        company: "Guardian Glass",
        thicknessMM: 5,
        quality: "Imported",
        measurementType: "SFT",
        purchasePrice: 160,
        sellingPrice: 200,
        stockQuantity: 75,
        unit: "sqft",
        description: "Premium Guardian brand imported clear glass",
        createdBy: owner._id,
        isActive: true
      },

      // Thai Glass variants
      {
        name: "Thai Glass",
        materialType: "Thai",
        company: "Thai Float Glass",
        thicknessMM: 4,
        quality: "Local",
        measurementType: "SFT",
        purchasePrice: 95,
        sellingPrice: 125,
        stockQuantity: 400,
        unit: "sqft",
        description: "Standard Thai glass for construction",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "Thai Glass",
        materialType: "Thai",
        company: "Thai Float Glass",
        thicknessMM: 5,
        quality: "Local",
        measurementType: "SFT",
        purchasePrice: 110,
        sellingPrice: 145,
        stockQuantity: 350,
        unit: "sqft",
        description: "Standard Thai glass for construction",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "Thai Glass",
        materialType: "Thai",
        company: "Thai Float Glass",
        thicknessMM: 6,
        quality: "Local",
        measurementType: "SFT",
        purchasePrice: 125,
        sellingPrice: 165,
        stockQuantity: 250,
        unit: "sqft",
        description: "Standard Thai glass for construction",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "Thai Glass",
        materialType: "Thai",
        company: "Thai Float Glass",
        thicknessMM: 5,
        quality: "Imported",
        measurementType: "SFT",
        purchasePrice: 155,
        sellingPrice: 195,
        stockQuantity: 120,
        unit: "sqft",
        description: "Premium imported Thai glass",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "Thai Glass",
        materialType: "Thai",
        company: "Bangkok Glass",
        thicknessMM: 5,
        quality: "Imported",
        measurementType: "SFT",
        purchasePrice: 175,
        sellingPrice: 220,
        stockQuantity: 80,
        unit: "sqft",
        description: "Premium Bangkok Glass brand imported",
        createdBy: owner._id,
        isActive: true
      },

      // Tinted Glass variants
      {
        name: "Tinted Glass",
        materialType: "Glass",
        company: "Nasir Glass",
        thicknessMM: 5,
        quality: "Local",
        measurementType: "SFT",
        purchasePrice: 120,
        sellingPrice: 155,
        stockQuantity: 180,
        unit: "sqft",
        description: "Bronze tinted glass for privacy and heat reduction",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "Tinted Glass",
        materialType: "Glass",
        company: "Nasir Glass",
        thicknessMM: 6,
        quality: "Local",
        measurementType: "SFT",
        purchasePrice: 135,
        sellingPrice: 175,
        stockQuantity: 120,
        unit: "sqft",
        description: "Bronze tinted glass for privacy and heat reduction",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "Tinted Glass",
        materialType: "Glass",
        company: "Guardian Glass",
        thicknessMM: 5,
        quality: "Imported",
        measurementType: "SFT",
        purchasePrice: 180,
        sellingPrice: 230,
        stockQuantity: 60,
        unit: "sqft",
        description: "Premium imported tinted glass",
        createdBy: owner._id,
        isActive: true
      },

      // Reflective Glass variants
      {
        name: "Reflective Glass",
        materialType: "Thai",
        company: "Thai Float Glass",
        thicknessMM: 6,
        quality: "Local",
        measurementType: "SFT",
        purchasePrice: 145,
        sellingPrice: 190,
        stockQuantity: 90,
        unit: "sqft",
        description: "Reflective glass for commercial buildings",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "Reflective Glass",
        materialType: "Thai",
        company: "Bangkok Glass",
        thicknessMM: 6,
        quality: "Imported",
        measurementType: "SFT",
        purchasePrice: 200,
        sellingPrice: 260,
        stockQuantity: 45,
        unit: "sqft",
        description: "Premium imported reflective glass",
        createdBy: owner._id,
        isActive: true
      },

      // Low stock variants for testing alerts
      {
        name: "Tempered Glass",
        materialType: "Glass",
        company: "Guardian Glass",
        thicknessMM: 8,
        quality: "Imported",
        measurementType: "SFT",
        purchasePrice: 250,
        sellingPrice: 320,
        stockQuantity: 5, // Low stock
        unit: "sqft",
        description: "Safety tempered glass",
        createdBy: owner._id,
        isActive: true
      },
      {
        name: "Laminated Glass",
        materialType: "Glass",
        company: "Nasir Glass",
        thicknessMM: 10,
        quality: "Local",
        measurementType: "SFT",
        purchasePrice: 300,
        sellingPrice: 380,
        stockQuantity: 0, // Out of stock
        unit: "sqft",
        description: "Safety laminated glass",
        createdBy: owner._id,
        isActive: true
      }
    ];

    // Create product variants
    const createdProducts = await Product.insertMany(productVariants);
    console.log(`✅ Created ${createdProducts.length} product variants`);

    // Display created variants grouped by product name
    console.log('\n📊 Product Variants Summary:');
    console.log('='.repeat(80));
    
    const groupedProducts = {};
    createdProducts.forEach(product => {
      const key = `${product.name} (${product.materialType})`;
      if (!groupedProducts[key]) {
        groupedProducts[key] = [];
      }
      groupedProducts[key].push(product);
    });

    Object.keys(groupedProducts).forEach(productName => {
      console.log(`\n${productName}:`);
      console.log('-'.repeat(60));
      
      groupedProducts[productName].forEach(variant => {
        const stockStatus = variant.stockQuantity === 0 ? '❌ OUT OF STOCK' : 
                           variant.stockQuantity <= 10 ? '⚠️  LOW STOCK' : '✅ IN STOCK';
        
        console.log(`  ${variant.company} - ${variant.thicknessMM}mm ${variant.quality}: ৳${variant.sellingPrice}/sqft (Stock: ${variant.stockQuantity}) ${stockStatus}`);
      });
    });

    // Display statistics
    const stats = {
      totalVariants: createdProducts.length,
      byMaterialType: {},
      byCompany: {},
      byThickness: {},
      byQuality: {},
      stockAlerts: {
        outOfStock: 0,
        lowStock: 0
      }
    };

    createdProducts.forEach(product => {
      // Material type stats
      if (!stats.byMaterialType[product.materialType]) {
        stats.byMaterialType[product.materialType] = 0;
      }
      stats.byMaterialType[product.materialType]++;

      // Company stats
      if (!stats.byCompany[product.company]) {
        stats.byCompany[product.company] = 0;
      }
      stats.byCompany[product.company]++;

      // Thickness stats
      const thickness = `${product.thicknessMM}mm`;
      if (!stats.byThickness[thickness]) {
        stats.byThickness[thickness] = 0;
      }
      stats.byThickness[thickness]++;

      // Quality stats
      if (!stats.byQuality[product.quality]) {
        stats.byQuality[product.quality] = 0;
      }
      stats.byQuality[product.quality]++;

      // Stock alerts
      if (product.stockQuantity === 0) {
        stats.stockAlerts.outOfStock++;
      } else if (product.stockQuantity <= 10) {
        stats.stockAlerts.lowStock++;
      }
    });

    console.log('\n📈 Statistics:');
    console.log('='.repeat(40));
    console.log(`Total Variants: ${stats.totalVariants}`);
    console.log(`\nBy Material Type:`);
    Object.entries(stats.byMaterialType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} variants`);
    });
    console.log(`\nBy Company:`);
    Object.entries(stats.byCompany).forEach(([company, count]) => {
      console.log(`  ${company}: ${count} variants`);
    });
    console.log(`\nBy Thickness:`);
    Object.entries(stats.byThickness).forEach(([thickness, count]) => {
      console.log(`  ${thickness}: ${count} variants`);
    });
    console.log(`\nBy Quality:`);
    Object.entries(stats.byQuality).forEach(([quality, count]) => {
      console.log(`  ${quality}: ${count} variants`);
    });
    console.log(`\nStock Alerts:`);
    console.log(`  Out of Stock: ${stats.stockAlerts.outOfStock} variants`);
    console.log(`  Low Stock (≤10): ${stats.stockAlerts.lowStock} variants`);

    console.log('\n🎉 Product variants seed completed successfully!');
    console.log('\n💡 Usage Examples:');
    console.log('   - Same product name with different variants: "Clear Glass"');
    console.log('   - Different companies: "Nasir Glass", "Guardian Glass", "Thai Float Glass"');
    console.log('   - Various thicknesses: 3mm, 4mm, 5mm, 6mm, 8mm, 10mm');
    console.log('   - Quality options: "Local", "Imported"');
    console.log('   - Independent stock tracking for each variant');

  } catch (error) {
    console.error('❌ Error seeding product variants:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the seed function
seedProductVariants();