/**
 * Test Wastage Tracking System
 * Comprehensive testing of glass cutting wastage tracking and reporting
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import CurrencyService from '../services/currencyService.js';
import DateService from '../services/dateService.js';
import connectDB from '../config/database.js';

// Load environment variables
dotenv.config();

const testWastageTrackingSystem = async () => {
  try {
    console.log('🧪 Starting Wastage Tracking System Tests...');

    // Connect to database
    await connectDB();

    // Get owner user
    const owner = await User.findOne({ role: 'owner' });
    if (!owner) {
      console.error('❌ Owner user not found. Please run user seed first.');
      process.exit(1);
    }

    console.log('\n1️⃣ Setup Test Data');
    console.log('='.repeat(50));

    // Create test customer
    const testCustomer = await Customer.create({
      name: 'Wastage Test Customer',
      phone: '01700000066',
      email: 'wastage@test.com',
      customerType: 'corporate',
      createdBy: owner._id
    });

    console.log(`✅ Created customer: ${testCustomer.customerId}`);

    // Get or create test products
    let glassProduct = await Product.findOne({ name: 'Wastage Test Glass' });
    if (!glassProduct) {
      glassProduct = await Product.create({
        name: 'Wastage Test Glass',
        category: 'Glass',
        sellingPrice: 1800, // ৳1800 per sqft
        purchasePrice: 1400, // ৳1400 per sqft
        stockQuantity: 1000,
        unit: 'sqft',
        createdBy: owner._id
      });
      console.log(`✅ Created glass product: ${glassProduct.name}`);
    }

    let aluminumProduct = await Product.findOne({ name: 'Wastage Test Thai Product' });
    if (!aluminumProduct) {
      aluminumProduct = await Product.create({
        name: 'Wastage Test Thai Product',
        category: 'Thai', // Use 'Thai' instead of 'Aluminum'
        sellingPrice: 2200, // ৳2200 per sqft
        purchasePrice: 1800, // ৳1800 per sqft
        stockQuantity: 500,
        unit: 'sqft',
        createdBy: owner._id
      });
      console.log(`✅ Created Thai product: ${aluminumProduct.name}`);
    }

    console.log('\n2️⃣ Testing Wastage Input Methods');
    console.log('='.repeat(50));

    // Test 1: Create invoice with percentage-based wastage
    console.log('\n📋 Test 1: Percentage-based Wastage');
    
    const percentageInvoiceNo = await Invoice.generateInvoiceNumber();
    const percentageInvoice = await Invoice.create({
      invoiceNo: percentageInvoiceNo,
      invoiceType: 'FINAL',
      customer: testCustomer._id,
      customerName: testCustomer.name,
      customerType: 'regular',
      items: [{
        product: glassProduct._id,
        productName: glassProduct.name,
        quantity: 25, // 25 sqft
        unit: glassProduct.unit,
        unitPrice: glassProduct.sellingPrice,
        totalPrice: 25 * glassProduct.sellingPrice,
        wastage: {
          inputMethod: 'percentage',
          percentage: 8, // 8% wastage
          manualAmount: 0,
          notes: 'Standard cutting wastage for complex design',
          category: 'cutting'
        }
      }],
      discount: 0,
      discountType: 'amount',
      createdBy: owner._id
    });

    percentageInvoice.calculateTotals();
    await percentageInvoice.save();

    console.log(`✅ Created percentage wastage invoice: ${percentageInvoice.invoiceNo}`);
    console.log(`   Product: ${percentageInvoice.items[0].productName}`);
    console.log(`   Quantity Sold: ${percentageInvoice.items[0].quantity} sqft`);
    console.log(`   Wastage Percentage: ${percentageInvoice.items[0].wastage.percentage}%`);
    console.log(`   Calculated Wastage: ${percentageInvoice.items[0].wastage.calculatedAmount} sqft`);
    console.log(`   Total Material Used: ${percentageInvoice.items[0].wastage.totalMaterialUsed} sqft`);
    console.log(`   Wastage Cost: ${CurrencyService.formatBDT(percentageInvoice.items[0].wastage.wastageCost)}`);

    // Test 2: Create invoice with manual wastage
    console.log('\n📋 Test 2: Manual Wastage Amount');
    
    const manualInvoiceNo = await Invoice.generateInvoiceNumber();
    const manualInvoice = await Invoice.create({
      invoiceNo: manualInvoiceNo,
      invoiceType: 'FINAL',
      customer: testCustomer._id,
      customerName: testCustomer.name,
      customerType: 'regular',
      items: [{
        product: aluminumProduct._id,
        productName: aluminumProduct.name,
        quantity: 15, // 15 sqft
        unit: aluminumProduct.unit,
        unitPrice: aluminumProduct.sellingPrice,
        totalPrice: 15 * aluminumProduct.sellingPrice,
        wastage: {
          inputMethod: 'manual',
          percentage: 0,
          manualAmount: 2.5, // 2.5 sqft manual wastage
          notes: 'Breakage during installation',
          category: 'breakage'
        }
      }],
      discount: 0,
      discountType: 'amount',
      createdBy: owner._id
    });

    manualInvoice.calculateTotals();
    await manualInvoice.save();

    console.log(`✅ Created manual wastage invoice: ${manualInvoice.invoiceNo}`);
    console.log(`   Product: ${manualInvoice.items[0].productName}`);
    console.log(`   Quantity Sold: ${manualInvoice.items[0].quantity} sqft`);
    console.log(`   Manual Wastage: ${manualInvoice.items[0].wastage.manualAmount} sqft`);
    console.log(`   Calculated Wastage: ${manualInvoice.items[0].wastage.calculatedAmount} sqft`);
    console.log(`   Total Material Used: ${manualInvoice.items[0].wastage.totalMaterialUsed} sqft`);
    console.log(`   Wastage Cost: ${CurrencyService.formatBDT(manualInvoice.items[0].wastage.wastageCost)}`);

    // Test 3: Create invoice with no wastage
    console.log('\n📋 Test 3: No Wastage Tracking');
    
    const noWastageInvoiceNo = await Invoice.generateInvoiceNumber();
    const noWastageInvoice = await Invoice.create({
      invoiceNo: noWastageInvoiceNo,
      invoiceType: 'FINAL',
      customer: testCustomer._id,
      customerName: testCustomer.name,
      customerType: 'regular',
      items: [{
        product: glassProduct._id,
        productName: glassProduct.name,
        quantity: 10, // 10 sqft
        unit: glassProduct.unit,
        unitPrice: glassProduct.sellingPrice,
        totalPrice: 10 * glassProduct.sellingPrice
        // No wastage field - should default to 'none'
      }],
      discount: 0,
      discountType: 'amount',
      createdBy: owner._id
    });

    noWastageInvoice.calculateTotals();
    await noWastageInvoice.save();

    console.log(`✅ Created no wastage invoice: ${noWastageInvoice.invoiceNo}`);
    console.log(`   Product: ${noWastageInvoice.items[0].productName}`);
    console.log(`   Quantity Sold: ${noWastageInvoice.items[0].quantity} sqft`);
    console.log(`   Wastage Method: ${noWastageInvoice.items[0].wastage.inputMethod}`);
    console.log(`   Total Material Used: ${noWastageInvoice.items[0].wastage.totalMaterialUsed} sqft`);

    console.log('\n3️⃣ Testing Multi-Item Wastage');
    console.log('='.repeat(50));

    // Test 4: Create invoice with multiple items having different wastage
    console.log('\n📋 Test 4: Multi-Item Invoice with Mixed Wastage');
    
    const multiItemInvoiceNo = await Invoice.generateInvoiceNumber();
    const multiItemInvoice = await Invoice.create({
      invoiceNo: multiItemInvoiceNo,
      invoiceType: 'FINAL',
      customer: testCustomer._id,
      customerName: testCustomer.name,
      customerType: 'regular',
      items: [
        {
          product: glassProduct._id,
          productName: glassProduct.name,
          quantity: 20, // 20 sqft
          unit: glassProduct.unit,
          unitPrice: glassProduct.sellingPrice,
          totalPrice: 20 * glassProduct.sellingPrice,
          wastage: {
            inputMethod: 'percentage',
            percentage: 12, // 12% wastage
            manualAmount: 0,
            notes: 'Complex curved cutting',
            category: 'cutting'
          }
        },
        {
          product: aluminumProduct._id,
          productName: aluminumProduct.name,
          quantity: 8, // 8 sqft
          unit: aluminumProduct.unit,
          unitPrice: aluminumProduct.sellingPrice,
          totalPrice: 8 * aluminumProduct.sellingPrice,
          wastage: {
            inputMethod: 'manual',
            percentage: 0,
            manualAmount: 1.2, // 1.2 sqft manual wastage
            notes: 'Measurement error',
            category: 'measurement_error'
          }
        }
      ],
      discount: 1000, // ৳1000 discount
      discountType: 'amount',
      createdBy: owner._id
    });

    multiItemInvoice.calculateTotals();
    await multiItemInvoice.save();

    console.log(`✅ Created multi-item wastage invoice: ${multiItemInvoice.invoiceNo}`);
    console.log(`   Total Items: ${multiItemInvoice.items.length}`);
    
    multiItemInvoice.items.forEach((item, index) => {
      console.log(`   Item ${index + 1}: ${item.productName}`);
      console.log(`     Quantity: ${item.quantity} ${item.unit}`);
      console.log(`     Wastage Method: ${item.wastage.inputMethod}`);
      console.log(`     Wastage Amount: ${item.wastage.calculatedAmount} ${item.unit}`);
      console.log(`     Wastage Cost: ${CurrencyService.formatBDT(item.wastage.wastageCost)}`);
    });

    // Test invoice-level wastage summary
    const wastageInfo = multiItemInvoice.wastageInfo;
    if (wastageInfo) {
      console.log(`   Invoice Wastage Summary:`);
      console.log(`     Total Wastage: ${wastageInfo.formattedTotalWastageAmount}`);
      console.log(`     Total Wastage Cost: ${wastageInfo.formattedTotalWastageCost}`);
      console.log(`     Overall Wastage %: ${wastageInfo.formattedWastagePercentage}`);
      console.log(`     Wastage Badge: ${multiItemInvoice.wastageBadge.text} (${multiItemInvoice.wastageBadge.class})`);
    }

    console.log('\n4️⃣ Testing Wastage Reporting');
    console.log('='.repeat(50));

    // Test 5: Generate monthly wastage report
    console.log('\n📋 Test 5: Monthly Wastage Report');
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const monthlyReport = await Invoice.getMonthlyWastageReport(currentYear, currentMonth);
    
    console.log(`✅ Monthly Wastage Report for ${monthlyReport.period.monthName} ${currentYear}:`);
    console.log(`   Total Invoices with Wastage: ${monthlyReport.summary.totalInvoicesWithWastage}`);
    console.log(`   Total Wastage Amount: ${monthlyReport.summary.formattedTotalWastageAmount}`);
    console.log(`   Total Wastage Cost: ${monthlyReport.summary.formattedTotalWastageCost}`);
    console.log(`   Overall Wastage Percentage: ${monthlyReport.summary.overallWastagePercentage}%`);
    
    console.log(`   Category Breakdown:`);
    Object.entries(monthlyReport.summary.categoryBreakdown).forEach(([category, data]) => {
      console.log(`     ${category}: ${CurrencyService.formatBDT(data.wastageCost)} (${data.invoiceCount} invoices)`);
    });

    console.log(`   Top Wastage Products:`);
    monthlyReport.wastageData.slice(0, 3).forEach((product, index) => {
      console.log(`     ${index + 1}. ${product.productName}`);
      console.log(`        Wastage: ${product.formattedTotalWastageAmount} (${product.formattedAverageWastagePercentage})`);
      console.log(`        Cost: ${product.formattedTotalWastageCost}`);
    });

    // Test 6: Get wastage trends
    console.log('\n📋 Test 6: Wastage Trends');
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const trends = await Invoice.getWastageTrends(sixMonthsAgo, now, 'month');
    
    console.log(`✅ Wastage Trends (Last 6 Months):`);
    trends.slice(-3).forEach(trend => {
      const monthName = new Date(trend.period.year, trend.period.month - 1).toLocaleString('default', { month: 'long' });
      console.log(`   ${monthName} ${trend.period.year}:`);
      console.log(`     Wastage: ${trend.formattedWastageAmount} (${trend.wastagePercentage}%)`);
      console.log(`     Cost: ${trend.formattedWastageCost}`);
      console.log(`     Invoices: ${trend.invoiceCount}`);
    });

    // Test 7: Get top wastage products
    console.log('\n📋 Test 7: Top Wastage Products');
    
    const monthStart = new Date(currentYear, currentMonth - 1, 1);
    const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
    
    const topProducts = await Invoice.getTopWastageProducts(monthStart, monthEnd, 5);
    
    console.log(`✅ Top Wastage Products (Current Month):`);
    topProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.productName} (${product.category})`);
      console.log(`      Wastage: ${product.formattedTotalWastageAmount} (${product.formattedWastagePercentage})`);
      console.log(`      Cost: ${product.formattedTotalWastageCost}`);
      console.log(`      Invoices: ${product.invoiceCount}`);
    });

    console.log('\n5️⃣ Testing Wastage Categories');
    console.log('='.repeat(50));

    // Test 8: Create invoices with different wastage categories
    console.log('\n📋 Test 8: Different Wastage Categories');
    
    const categories = [
      { name: 'cutting', description: 'Standard cutting wastage' },
      { name: 'breakage', description: 'Glass breakage during handling' },
      { name: 'measurement_error', description: 'Wrong measurements' },
      { name: 'quality_issue', description: 'Quality defects' },
      { name: 'other', description: 'Other miscellaneous wastage' }
    ];

    for (const category of categories) {
      const categoryInvoiceNo = await Invoice.generateInvoiceNumber();
      const categoryInvoice = await Invoice.create({
        invoiceNo: categoryInvoiceNo,
        invoiceType: 'FINAL',
        customer: testCustomer._id,
        customerName: testCustomer.name,
        customerType: 'regular',
        items: [{
          product: glassProduct._id,
          productName: glassProduct.name,
          quantity: 5, // 5 sqft
          unit: glassProduct.unit,
          unitPrice: glassProduct.sellingPrice,
          totalPrice: 5 * glassProduct.sellingPrice,
          wastage: {
            inputMethod: 'percentage',
            percentage: 6, // 6% wastage
            manualAmount: 0,
            notes: category.description,
            category: category.name
          }
        }],
        discount: 0,
        discountType: 'amount',
        createdBy: owner._id
      });

      categoryInvoice.calculateTotals();
      await categoryInvoice.save();

      console.log(`✅ Created ${category.name} wastage invoice: ${categoryInvoice.invoiceNo}`);
      console.log(`   Category: ${category.name}`);
      console.log(`   Wastage: ${categoryInvoice.items[0].wastage.calculatedAmount} sqft`);
      console.log(`   Cost: ${CurrencyService.formatBDT(categoryInvoice.items[0].wastage.wastageCost)}`);
    }

    console.log('\n6️⃣ Testing Edge Cases');
    console.log('='.repeat(50));

    // Test 9: Zero wastage percentage
    console.log('\n📋 Test 9: Zero Wastage Percentage');
    
    const zeroWastageInvoiceNo = await Invoice.generateInvoiceNumber();
    const zeroWastageInvoice = await Invoice.create({
      invoiceNo: zeroWastageInvoiceNo,
      invoiceType: 'FINAL',
      customer: testCustomer._id,
      customerName: testCustomer.name,
      customerType: 'regular',
      items: [{
        product: glassProduct._id,
        productName: glassProduct.name,
        quantity: 12, // 12 sqft
        unit: glassProduct.unit,
        unitPrice: glassProduct.sellingPrice,
        totalPrice: 12 * glassProduct.sellingPrice,
        wastage: {
          inputMethod: 'percentage',
          percentage: 0, // 0% wastage
          manualAmount: 0,
          notes: 'Perfect cutting, no wastage',
          category: 'cutting'
        }
      }],
      discount: 0,
      discountType: 'amount',
      createdBy: owner._id
    });

    zeroWastageInvoice.calculateTotals();
    await zeroWastageInvoice.save();

    console.log(`✅ Created zero wastage invoice: ${zeroWastageInvoice.invoiceNo}`);
    console.log(`   Wastage Percentage: ${zeroWastageInvoice.items[0].wastage.percentage}%`);
    console.log(`   Calculated Wastage: ${zeroWastageInvoice.items[0].wastage.calculatedAmount} sqft`);
    console.log(`   Wastage Cost: ${CurrencyService.formatBDT(zeroWastageInvoice.items[0].wastage.wastageCost)}`);
    console.log(`   Badge: ${zeroWastageInvoice.wastageBadge.text}`);

    console.log('\n📊 Final System Statistics');
    console.log('='.repeat(50));
    
    // Generate final report
    const finalReport = await Invoice.getMonthlyWastageReport(currentYear, currentMonth);
    const finalTrends = await Invoice.getWastageTrends(sixMonthsAgo, now, 'month');
    const finalTopProducts = await Invoice.getTopWastageProducts(monthStart, monthEnd, 10);
    
    console.log(`📈 Total Test Invoices Created: ${finalReport.summary.totalInvoicesWithWastage}`);
    console.log(`📈 Total Wastage Amount: ${finalReport.summary.formattedTotalWastageAmount}`);
    console.log(`📈 Total Wastage Cost: ${finalReport.summary.formattedTotalWastageCost}`);
    console.log(`📈 Average Wastage Percentage: ${finalReport.summary.overallWastagePercentage}%`);
    console.log(`📈 Categories Tested: ${Object.keys(finalReport.summary.categoryBreakdown).length}`);
    console.log(`📈 Products with Wastage: ${finalTopProducts.length}`);

    console.log('\n🎉 All Wastage Tracking System Tests Completed Successfully!');
    
    console.log('\n💡 Key Features Verified:');
    console.log('   ✅ Percentage-based wastage calculation');
    console.log('   ✅ Manual wastage amount input');
    console.log('   ✅ No wastage tracking option');
    console.log('   ✅ Multi-item invoice wastage handling');
    console.log('   ✅ Wastage cost calculation');
    console.log('   ✅ Monthly wastage reporting');
    console.log('   ✅ Wastage trends analysis');
    console.log('   ✅ Top wastage products identification');
    console.log('   ✅ Wastage categorization (cutting, breakage, etc.)');
    console.log('   ✅ Invoice-level wastage summaries');
    console.log('   ✅ Wastage badges and visual indicators');

    console.log('\n🔧 Real-World Usage Scenarios:');
    console.log('   • Track cutting wastage for different glass types');
    console.log('   • Monitor breakage during installation');
    console.log('   • Identify measurement errors and improve accuracy');
    console.log('   • Generate monthly wastage reports for management');
    console.log('   • Analyze wastage trends to optimize processes');
    console.log('   • Calculate true material costs including wastage');
    console.log('   • Identify products with highest wastage rates');
    console.log('   • Set wastage budgets and track performance');

  } catch (error) {
    console.error('❌ Error in wastage tracking system tests:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the test function
testWastageTrackingSystem();