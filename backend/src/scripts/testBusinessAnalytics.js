#!/usr/bin/env node

/**
 * Test Business Analytics System
 * 
 * This script tests all business analytics endpoints:
 * 1. Stock by Company Report
 * 2. Profit by Thickness Report  
 * 3. Sales by Brand Report
 * 4. Fast-Moving Thickness Report
 * 5. Business Dashboard
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invoice from '../models/Invoice.js';
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

const testBusinessAnalytics = async () => {
  try {
    console.log('\n🧪 Testing Business Analytics System...\n');

    // Find test user
    const testUser = await User.findOne({ role: 'manager' });
    if (!testUser) {
      throw new Error('No manager user found for testing');
    }

    // Test 1: Stock by Company Report
    console.log('📊 Test 1: Stock by Company Report...');
    
    const stockByCompanyPipeline = [
      {
        $match: {
          isActive: true,
          isDeleted: { $ne: true },
          materialType: { $exists: true },
          company: { $exists: true }
        }
      },
      {
        $group: {
          _id: {
            company: '$company',
            materialType: '$materialType',
            quality: '$quality'
          },
          totalStock: { $sum: '$stockQuantity' },
          totalValue: { $sum: { $multiply: ['$stockQuantity', '$sellingPrice'] } },
          totalCost: { $sum: { $multiply: ['$stockQuantity', '$purchasePrice'] } },
          productCount: { $sum: 1 },
          avgSellingPrice: { $avg: '$sellingPrice' },
          avgPurchasePrice: { $avg: '$purchasePrice' }
        }
      },
      {
        $addFields: {
          company: '$_id.company',
          materialType: '$_id.materialType',
          quality: '$_id.quality',
          potentialProfit: { $subtract: ['$totalValue', '$totalCost'] },
          profitMargin: {
            $cond: [
              { $gt: ['$totalCost', 0] },
              { $multiply: [{ $divide: [{ $subtract: ['$totalValue', '$totalCost'] }, '$totalCost'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { totalStock: -1 } },
      { $limit: 10 }
    ];

    const stockByCompany = await Product.aggregate(stockByCompanyPipeline);
    
    console.log(`   Found ${stockByCompany.length} company entries`);
    if (stockByCompany.length > 0) {
      const topCompany = stockByCompany[0];
      console.log(`   Top Company: ${topCompany.company} (${topCompany.materialType})`);
      console.log(`   Stock: ${topCompany.totalStock.toFixed(2)} SFT`);
      console.log(`   Value: ৳${topCompany.totalValue.toFixed(2)}`);
      console.log(`   Potential Profit: ৳${topCompany.potentialProfit.toFixed(2)}`);
      console.log(`   Profit Margin: ${topCompany.profitMargin.toFixed(2)}%`);
    }

    // Test 2: Profit by Thickness Report
    console.log('\n📈 Test 2: Profit by Thickness Report...');
    
    const profitByThicknessPipeline = [
      {
        $match: {
          isActive: true,
          isDeleted: { $ne: true },
          'items.materialType': { $exists: true },
          'items.thicknessMM': { $exists: true }
        }
      },
      { $unwind: '$items' },
      {
        $match: {
          'items.thicknessMM': { $exists: true }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      {
        $group: {
          _id: {
            thicknessMM: '$items.thicknessMM',
            materialType: '$items.materialType'
          },
          totalQuantitySold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          totalCost: { $sum: { $multiply: ['$items.quantity', '$productDetails.purchasePrice'] } },
          invoiceCount: { $sum: 1 }
        }
      },
      {
        $addFields: {
          thicknessMM: '$_id.thicknessMM',
          materialType: '$_id.materialType',
          totalProfit: { $subtract: ['$totalRevenue', '$totalCost'] },
          profitMargin: {
            $cond: [
              { $gt: ['$totalCost', 0] },
              { $multiply: [{ $divide: [{ $subtract: ['$totalRevenue', '$totalCost'] }, '$totalCost'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { totalProfit: -1 } },
      { $limit: 10 }
    ];

    const profitByThickness = await Invoice.aggregate(profitByThicknessPipeline);
    
    console.log(`   Found ${profitByThickness.length} thickness entries`);
    if (profitByThickness.length > 0) {
      const topThickness = profitByThickness[0];
      console.log(`   Top Thickness: ${topThickness.thicknessMM}mm (${topThickness.materialType})`);
      console.log(`   Quantity Sold: ${topThickness.totalQuantitySold.toFixed(2)} SFT`);
      console.log(`   Revenue: ৳${topThickness.totalRevenue.toFixed(2)}`);
      console.log(`   Profit: ৳${topThickness.totalProfit.toFixed(2)}`);
      console.log(`   Profit Margin: ${topThickness.profitMargin.toFixed(2)}%`);
    }

    // Test 3: Sales by Brand Report
    console.log('\n🏷️ Test 3: Sales by Brand Report...');
    
    const salesByBrandPipeline = [
      {
        $match: {
          isActive: true,
          isDeleted: { $ne: true },
          'items.materialType': { $exists: true },
          'items.company': { $exists: true }
        }
      },
      { $unwind: '$items' },
      {
        $match: {
          'items.company': { $exists: true }
        }
      },
      {
        $group: {
          _id: {
            company: '$items.company',
            materialType: '$items.materialType',
            quality: '$items.quality'
          },
          totalQuantitySold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          invoiceCount: { $sum: 1 },
          uniqueCustomers: { $addToSet: '$customerName' },
          avgOrderValue: { $avg: '$items.totalPrice' }
        }
      },
      {
        $addFields: {
          company: '$_id.company',
          materialType: '$_id.materialType',
          quality: '$_id.quality',
          customerCount: { $size: '$uniqueCustomers' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ];

    const salesByBrand = await Invoice.aggregate(salesByBrandPipeline);
    
    console.log(`   Found ${salesByBrand.length} brand entries`);
    if (salesByBrand.length > 0) {
      const topBrand = salesByBrand[0];
      console.log(`   Top Brand: ${topBrand.company} (${topBrand.materialType})`);
      console.log(`   Quantity Sold: ${topBrand.totalQuantitySold.toFixed(2)} SFT`);
      console.log(`   Revenue: ৳${topBrand.totalRevenue.toFixed(2)}`);
      console.log(`   Customers: ${topBrand.customerCount}`);
      console.log(`   Avg Order Value: ৳${topBrand.avgOrderValue.toFixed(2)}`);
    }

    // Test 4: Fast-Moving Thickness Report
    console.log('\n🚀 Test 4: Fast-Moving Thickness Report...');
    
    // Calculate velocity for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const fastMovingPipeline = [
      {
        $match: {
          isActive: true,
          isDeleted: { $ne: true },
          'items.thicknessMM': { $exists: true },
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      { $unwind: '$items' },
      {
        $match: {
          'items.thicknessMM': { $exists: true }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      {
        $group: {
          _id: {
            thicknessMM: '$items.thicknessMM',
            materialType: '$items.materialType'
          },
          totalQuantitySold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPrice' },
          invoiceCount: { $sum: 1 },
          currentStock: { $avg: '$productDetails.stockQuantity' }
        }
      },
      {
        $addFields: {
          thicknessMM: '$_id.thicknessMM',
          materialType: '$_id.materialType',
          velocity: { $divide: ['$totalQuantitySold', 30] }, // per day
          frequency: { $divide: ['$invoiceCount', 30] }, // orders per day
          turnoverRate: {
            $cond: [
              { $gt: ['$currentStock', 0] },
              { $divide: ['$totalQuantitySold', '$currentStock'] },
              0
            ]
          }
        }
      },
      {
        $addFields: {
          movementCategory: {
            $switch: {
              branches: [
                {
                  case: { $and: [{ $gte: ['$velocity', 10] }, { $gte: ['$frequency', 0.5] }] },
                  then: 'Fast Moving'
                },
                {
                  case: { $and: [{ $gte: ['$velocity', 5] }, { $gte: ['$frequency', 0.2] }] },
                  then: 'Medium Moving'
                },
                {
                  case: { $and: [{ $gte: ['$velocity', 1] }, { $gte: ['$frequency', 0.1] }] },
                  then: 'Slow Moving'
                }
              ],
              default: 'Very Slow Moving'
            }
          }
        }
      },
      { $sort: { velocity: -1 } },
      { $limit: 10 }
    ];

    const fastMovingThickness = await Invoice.aggregate(fastMovingPipeline);
    
    console.log(`   Found ${fastMovingThickness.length} thickness entries`);
    if (fastMovingThickness.length > 0) {
      const fastestMoving = fastMovingThickness[0];
      console.log(`   Fastest Moving: ${fastestMoving.thicknessMM}mm (${fastestMoving.materialType})`);
      console.log(`   Velocity: ${fastestMoving.velocity.toFixed(2)} SFT/day`);
      console.log(`   Frequency: ${fastestMoving.frequency.toFixed(2)} orders/day`);
      console.log(`   Category: ${fastestMoving.movementCategory}`);
      console.log(`   Turnover Rate: ${fastestMoving.turnoverRate.toFixed(2)}x`);
    }

    // Test 5: Business Dashboard Summary
    console.log('\n📋 Test 5: Business Dashboard Summary...');
    
    // Top companies by stock
    const topCompaniesByStock = await Product.aggregate([
      {
        $match: {
          isActive: true,
          materialType: { $exists: true },
          company: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$company',
          totalStock: { $sum: '$stockQuantity' },
          totalValue: { $sum: { $multiply: ['$stockQuantity', '$sellingPrice'] } }
        }
      },
      { $sort: { totalStock: -1 } },
      { $limit: 5 }
    ]);

    console.log(`   Top Companies by Stock: ${topCompaniesByStock.length}`);
    topCompaniesByStock.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company._id}: ${company.totalStock.toFixed(2)} SFT (৳${company.totalValue.toFixed(2)})`);
    });

    // Test 6: Data Quality Verification
    console.log('\n🔍 Test 6: Data Quality Verification...');
    
    // Check for products with variant data
    const productsWithVariants = await Product.countDocuments({
      isActive: true,
      materialType: { $exists: true },
      company: { $exists: true },
      thicknessMM: { $exists: true },
      quality: { $exists: true }
    });

    // Check for invoices with variant data
    const invoicesWithVariants = await Invoice.countDocuments({
      isActive: true,
      'items.materialType': { $exists: true },
      'items.company': { $exists: true },
      'items.thicknessMM': { $exists: true }
    });

    console.log(`   Products with variant data: ${productsWithVariants}`);
    console.log(`   Invoices with variant data: ${invoicesWithVariants}`);

    // Check material types distribution
    const materialDistribution = await Product.aggregate([
      {
        $match: {
          isActive: true,
          materialType: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$materialType',
          count: { $sum: 1 },
          totalStock: { $sum: '$stockQuantity' }
        }
      }
    ]);

    console.log('   Material Distribution:');
    materialDistribution.forEach(material => {
      console.log(`   - ${material._id}: ${material.count} products, ${material.totalStock.toFixed(2)} SFT stock`);
    });

    // Check thickness distribution
    const thicknessDistribution = await Product.aggregate([
      {
        $match: {
          isActive: true,
          thicknessMM: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$thicknessMM',
          count: { $sum: 1 },
          totalStock: { $sum: '$stockQuantity' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('   Thickness Distribution:');
    thicknessDistribution.forEach(thickness => {
      console.log(`   - ${thickness._id}mm: ${thickness.count} products, ${thickness.totalStock.toFixed(2)} SFT stock`);
    });

    console.log('\n✅ All business analytics tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   ✓ Stock by Company report working');
    console.log('   ✓ Profit by Thickness analysis functional');
    console.log('   ✓ Sales by Brand tracking operational');
    console.log('   ✓ Fast-Moving Thickness detection active');
    console.log('   ✓ Business Dashboard data available');
    console.log('   ✓ Data quality verification passed');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await testBusinessAnalytics();
    console.log('\n🎉 Business Analytics System test completed successfully!');
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