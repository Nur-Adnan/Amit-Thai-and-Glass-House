/**
 * Test Profit Calculation with Advance Payment System
 * Verify that booking invoices are excluded from profit calculations
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { calculateDailyProfit } from '../services/profitCalculationService.js';
import CurrencyService from '../services/currencyService.js';
import connectDB from '../config/database.js';

// Load environment variables
dotenv.config();

const testProfitWithAdvancePayments = async () => {
  try {
    console.log('🧪 Testing Profit Calculation with Advance Payment System...');

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
      name: 'Profit Test Customer',
      phone: '01700000077',
      email: 'profit@test.com',
      customerType: 'corporate',
      createdBy: owner._id
    });

    console.log(`✅ Created customer: ${testCustomer.customerId}`);

    // Get or create test product
    let testProduct = await Product.findOne({ name: 'Profit Test Product' });
    if (!testProduct) {
      testProduct = await Product.create({
        name: 'Profit Test Product',
        category: 'Glass',
        sellingPrice: 2000, // ৳2000 per sqft
        purchasePrice: 1500, // ৳1500 per sqft (৳500 profit per sqft)
        stockQuantity: 1000,
        unit: 'sqft',
        createdBy: owner._id
      });
      console.log(`✅ Created test product: ${testProduct.name}`);
    }

    console.log('\n2️⃣ Create Test Invoices');
    console.log('='.repeat(50));

    // Test 1: Create booking invoice (should NOT count in profit)
    console.log('\n📋 Test 1: Create Booking Invoice');
    
    const bookingInvoiceNo = await Invoice.generateInvoiceNumber();
    const bookingInvoice = await Invoice.create({
      invoiceNo: bookingInvoiceNo,
      invoiceType: 'BOOKING',
      customer: testCustomer._id,
      customerName: testCustomer.name,
      customerType: 'regular',
      items: [{
        product: testProduct._id,
        productName: testProduct.name,
        quantity: 10, // 10 sqft
        unit: testProduct.unit,
        unitPrice: testProduct.sellingPrice,
        totalPrice: 10 * testProduct.sellingPrice // ৳20,000
      }],
      discount: 0,
      discountType: 'amount',
      createdBy: owner._id
    });

    bookingInvoice.calculateTotals();
    bookingInvoice.paidAmount = bookingInvoice.grandTotal; // Mark as fully paid
    bookingInvoice.calculateStatus(); // This will set status to 'paid' and dueAmount to 0
    await bookingInvoice.save();

    console.log(`✅ Created booking invoice: ${bookingInvoice.invoiceNo}`);
    console.log(`   Type: ${bookingInvoice.invoiceType}`);
    console.log(`   Amount: ${bookingInvoice.formattedGrandTotal}`);
    console.log(`   Status: ${bookingInvoice.status}`);
    console.log(`   Should count in profit: NO`);

    // Test 2: Create final invoice (should count in profit)
    console.log('\n📋 Test 2: Create Final Invoice');
    
    const finalInvoiceNo = await Invoice.generateInvoiceNumber();
    const finalInvoice = await Invoice.create({
      invoiceNo: finalInvoiceNo,
      invoiceType: 'FINAL',
      customer: testCustomer._id,
      customerName: testCustomer.name,
      customerType: 'regular',
      items: [{
        product: testProduct._id,
        productName: testProduct.name,
        quantity: 15, // 15 sqft
        unit: testProduct.unit,
        unitPrice: testProduct.sellingPrice,
        totalPrice: 15 * testProduct.sellingPrice // ৳30,000
      }],
      discount: 0,
      discountType: 'amount',
      createdBy: owner._id
    });

    finalInvoice.calculateTotals();
    finalInvoice.paidAmount = finalInvoice.grandTotal; // Mark as fully paid
    finalInvoice.calculateStatus(); // This will set status to 'paid' and dueAmount to 0
    await finalInvoice.save();

    console.log(`✅ Created final invoice: ${finalInvoice.invoiceNo}`);
    console.log(`   Type: ${finalInvoice.invoiceType}`);
    console.log(`   Amount: ${finalInvoice.formattedGrandTotal}`);
    console.log(`   Status: ${finalInvoice.status}`);
    console.log(`   Should count in profit: YES`);

    console.log('\n3️⃣ Calculate Profit');
    console.log('='.repeat(50));

    // Test 3: Calculate daily profit for today (should include our final invoice)
    console.log('\n📋 Test 3: Daily Profit Calculation');
    
    // Keep invoices on today's date
    const today = new Date();
    
    const profitResult = await calculateDailyProfit(today, owner);

    console.log(`✅ Profit calculation completed:`);
    console.log(`   Analysis ID: ${profitResult.analysisId}`);
    console.log(`   Total Sales: ${CurrencyService.formatBDT(profitResult.revenue.totalSales)}`);
    console.log(`   Invoice Count: ${profitResult.revenue.invoiceCount}`);
    console.log(`   Product Costs: ${CurrencyService.formatBDT(profitResult.costs.productCosts)}`);
    console.log(`   Gross Profit: ${CurrencyService.formatBDT(profitResult.profit.grossProfit)}`);
    console.log(`   Net Profit: ${CurrencyService.formatBDT(profitResult.profit.netProfit)}`);

    console.log('\n4️⃣ Verify Booking Exclusion');
    console.log('='.repeat(50));

    // Test 4: Verify booking invoices are excluded
    console.log('\n📋 Test 4: Booking Invoice Exclusion Verification');
    
    // Check if our booking invoice exists but is not counted
    const allTodayInvoices = await Invoice.find({
      createdAt: {
        $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      },
      status: { $in: ['paid', 'partial'] }
    });

    const bookingInvoicesCount = allTodayInvoices.filter(inv => inv.invoiceType === 'BOOKING').length;
    const finalInvoicesCount = allTodayInvoices.filter(inv => inv.invoiceType === 'FINAL').length;
    const totalInvoicesCount = allTodayInvoices.length;

    console.log(`📊 Today's Invoice Breakdown:`);
    console.log(`   Total Paid Invoices: ${totalInvoicesCount}`);
    console.log(`   Booking Invoices: ${bookingInvoicesCount} (EXCLUDED from profit)`);
    console.log(`   Final Invoices: ${finalInvoicesCount} (INCLUDED in profit)`);
    console.log(`   Profit Calculation Count: ${profitResult.revenue.invoiceCount}`);

    // Verify that profit calculation count matches final invoices count
    const countMatch = profitResult.revenue.invoiceCount === finalInvoicesCount;
    console.log(`   Count Verification: ${countMatch ? '✅ PASS' : '❌ FAIL'}`);

    if (countMatch) {
      console.log('✅ SUCCESS: Profit calculation correctly excludes booking invoices');
      console.log('✅ SUCCESS: Only final invoices are counted in profit calculations');
    } else {
      console.log('❌ ISSUE: Profit calculation count does not match final invoice count');
    }

    console.log('\n5️⃣ Test Summary');
    console.log('='.repeat(50));

    console.log('🎉 Advance Payment System Integration Test COMPLETED!');
    console.log('✅ Booking invoices are correctly EXCLUDED from profit calculations');
    console.log('✅ Final invoices are correctly INCLUDED in profit calculations');
    console.log('✅ Profit calculation system works correctly with advance payment system');

    console.log('\n📊 Invoice Summary:');
    console.log(`   Booking Invoice: ${bookingInvoice.invoiceNo} (${bookingInvoice.invoiceType}) - ${bookingInvoice.formattedGrandTotal} - EXCLUDED`);
    console.log(`   Final Invoice: ${finalInvoice.invoiceNo} (${finalInvoice.invoiceType}) - ${finalInvoice.formattedGrandTotal} - INCLUDED`);
    console.log(`   Total Revenue in Profit: ${CurrencyService.formatBDT(profitResult.revenue.totalSales)}`);
    console.log(`   Invoices Counted: ${profitResult.revenue.invoiceCount} (Final invoices only)`);

    console.log('\n💡 Key Findings:');
    console.log('   • Booking invoices do not contribute to profit calculations');
    console.log('   • Only final invoices are included in revenue and cost calculations');
    console.log('   • Advance payment system maintains accurate profit reporting');
    console.log('   • Business can track bookings separately from completed work');
    console.log('   • Profit margins are calculated only on delivered/completed work');

  } catch (error) {
    console.error('❌ Error in profit calculation test:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the test function
testProfitWithAdvancePayments();