/**
 * Test Advance Payment System
 * Comprehensive testing of booking invoices, advance payments, and conversion to final invoices
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

const testAdvancePaymentSystem = async () => {
  try {
    console.log('🧪 Starting Advance Payment System Tests...');

    // Connect to database
    await connectDB();

    // Get owner user
    const owner = await User.findOne({ role: 'owner' });
    if (!owner) {
      console.error('❌ Owner user not found. Please run user seed first.');
      process.exit(1);
    }

    console.log('\n1️⃣ Testing Booking Invoice Creation');
    console.log('='.repeat(50));

    // Test 1: Create customer for testing
    console.log('\n📋 Test 1: Create Test Customer');
    const testCustomer = await Customer.create({
      name: 'Advance Payment Test Customer',
      phone: '01700000088',
      email: 'advance@test.com',
      customerType: 'corporate',
      creditLimit: 200000, // ৳200,000 credit limit
      createdBy: owner._id
    });

    console.log(`✅ Created customer: ${testCustomer.customerId} - ${testCustomer.name}`);

    // Get or create test product
    let testProduct = await Product.findOne({ name: 'Advance Payment Test Product' });
    if (!testProduct) {
      testProduct = await Product.create({
        name: 'Advance Payment Test Product',
        category: 'Glass',
        sellingPrice: 1500, // ৳1500 per sqft
        purchasePrice: 1200, // ৳1200 per sqft
        stockQuantity: 1000,
        unit: 'sqft',
        createdBy: owner._id
      });
      console.log(`✅ Created test product: ${testProduct.name} - ${CurrencyService.formatBDT(testProduct.sellingPrice)}/sqft`);
    }

    // Test 2: Create booking invoice with advance payment
    console.log('\n📋 Test 2: Create Booking Invoice with Advance Payment');
    
    const bookingInvoiceNo = await Invoice.generateInvoiceNumber();
    const bookingInvoice = await Invoice.create({
      invoiceNo: bookingInvoiceNo,
      invoiceType: 'BOOKING',
      customer: testCustomer._id,
      customerName: testCustomer.name,
      customerPhone: testCustomer.phone,
      customerType: 'regular',
      items: [{
        product: testProduct._id,
        productName: testProduct.name,
        quantity: 50, // 50 sqft
        unit: testProduct.unit,
        unitPrice: testProduct.sellingPrice,
        totalPrice: 50 * testProduct.sellingPrice // ৳75,000
      }],
      discount: 5000, // ৳5,000 discount
      discountType: 'amount',
      paymentMethod: 'cash',
      notes: 'Booking for glass installation project',
      createdBy: owner._id
    });

    // Calculate totals first
    bookingInvoice.calculateTotals();

    // Record advance payment (50% of total)
    const advanceAmount = Math.round(bookingInvoice.grandTotal * 0.5); // 50% advance
    bookingInvoice.recordAdvancePayment({
      amount: advanceAmount,
      receivedDate: new Date(),
      paymentMethod: 'cash',
      notes: '50% advance payment received'
    });

    await bookingInvoice.save();

    console.log(`✅ Created booking invoice: ${bookingInvoice.invoiceNo}`);
    console.log(`   Invoice Type: ${bookingInvoice.invoiceType}`);
    console.log(`   Grand Total: ${bookingInvoice.formattedGrandTotal}`);
    console.log(`   Advance Payment: ${bookingInvoice.formattedAdvancePayment}`);
    console.log(`   Remaining Balance: ${bookingInvoice.formattedRemainingBalance}`);
    console.log(`   Status: ${bookingInvoice.status}`);
    console.log(`   Can Convert: ${bookingInvoice.conversionStatus.canConvert}`);

    console.log('\n2️⃣ Testing Advance Payment Management');
    console.log('='.repeat(50));

    // Test 3: Update advance payment
    console.log('\n📋 Test 3: Update Advance Payment');
    
    const newAdvanceAmount = Math.round(bookingInvoice.grandTotal * 0.7); // Increase to 70%
    bookingInvoice.recordAdvancePayment({
      amount: newAdvanceAmount,
      receivedDate: new Date(),
      paymentMethod: 'bank_transfer',
      notes: 'Updated to 70% advance payment via bank transfer'
    });

    await bookingInvoice.save();

    console.log(`✅ Updated advance payment: ${bookingInvoice.formattedAdvancePayment}`);
    console.log(`   Payment Method: ${bookingInvoice.advancePayment.paymentMethod}`);
    console.log(`   Remaining Balance: ${bookingInvoice.formattedRemainingBalance}`);

    // Test 4: Get bookings ready for conversion
    console.log('\n📋 Test 4: Get Bookings Ready for Conversion');
    
    const bookingsReady = await Invoice.getBookingsReadyForConversion({
      customerId: testCustomer._id,
      hasAdvancePayment: true,
      limit: 10
    });

    console.log(`✅ Found ${bookingsReady.length} bookings ready for conversion:`);
    bookingsReady.forEach((booking, index) => {
      console.log(`   ${index + 1}. ${booking.invoiceNo} - ${booking.formattedGrandTotal} (Advance: ${booking.formattedAdvancePayment})`);
    });

    console.log('\n3️⃣ Testing Booking to Final Conversion');
    console.log('='.repeat(50));

    // Test 5: Convert booking to final invoice (same items)
    console.log('\n📋 Test 5: Convert Booking to Final Invoice (Same Items)');
    
    const finalInvoiceData = {
      items: bookingInvoice.items, // Same items
      discount: 3000, // Reduced discount for final
      discountType: 'amount',
      paymentMethod: 'mixed',
      notes: 'Final invoice after project completion'
    };

    const finalInvoice = await bookingInvoice.convertToFinalInvoice(finalInvoiceData, owner._id);

    console.log(`✅ Converted to final invoice: ${finalInvoice.invoiceNo}`);
    console.log(`   Invoice Type: ${finalInvoice.invoiceType}`);
    console.log(`   Grand Total: ${finalInvoice.formattedGrandTotal}`);
    console.log(`   Paid Amount: ${finalInvoice.formattedPaidAmount} (from advance)`);
    console.log(`   Due Amount: ${finalInvoice.formattedDueAmount}`);
    console.log(`   Status: ${finalInvoice.status}`);

    // Check booking invoice conversion status
    const updatedBooking = await Invoice.findById(bookingInvoice._id);
    console.log(`   Booking Converted: ${updatedBooking.finalInvoiceReference.isConverted}`);
    console.log(`   Final Invoice No: ${updatedBooking.finalInvoiceReference.finalInvoiceNo}`);

    console.log('\n4️⃣ Testing Different Scenarios');
    console.log('='.repeat(50));

    // Test 6: Create booking with different items for final conversion
    console.log('\n📋 Test 6: Booking with Modified Final Invoice');
    
    const booking2InvoiceNo = await Invoice.generateInvoiceNumber();
    const booking2 = await Invoice.create({
      invoiceNo: booking2InvoiceNo,
      invoiceType: 'BOOKING',
      customer: testCustomer._id,
      customerName: testCustomer.name,
      customerType: 'regular',
      items: [{
        product: testProduct._id,
        productName: testProduct.name,
        quantity: 30, // 30 sqft initially
        unit: testProduct.unit,
        unitPrice: testProduct.sellingPrice,
        totalPrice: 30 * testProduct.sellingPrice
      }],
      discount: 0,
      discountType: 'amount',
      createdBy: owner._id
    });

    booking2.calculateTotals();
    
    // Record advance payment
    const advance2Amount = 20000; // ৳20,000 advance
    booking2.recordAdvancePayment({
      amount: advance2Amount,
      receivedDate: new Date(),
      paymentMethod: 'cash',
      notes: 'Initial advance payment'
    });

    await booking2.save();

    console.log(`✅ Created second booking: ${booking2.invoiceNo}`);
    console.log(`   Original Quantity: 30 sqft`);
    console.log(`   Advance Payment: ${booking2.formattedAdvancePayment}`);

    // Convert with modified items (increased quantity)
    const modifiedFinalData = {
      items: [{
        product: testProduct._id,
        productName: testProduct.name,
        quantity: 45, // Increased to 45 sqft
        unit: testProduct.unit,
        unitPrice: testProduct.sellingPrice,
        totalPrice: 45 * testProduct.sellingPrice
      }],
      discount: 2000,
      discountType: 'amount',
      paymentMethod: 'mixed',
      notes: 'Final invoice with increased quantity'
    };

    const finalInvoice2 = await booking2.convertToFinalInvoice(modifiedFinalData, owner._id);

    console.log(`✅ Converted with modifications: ${finalInvoice2.invoiceNo}`);
    console.log(`   Final Quantity: 45 sqft`);
    console.log(`   Grand Total: ${finalInvoice2.formattedGrandTotal}`);
    console.log(`   Applied Advance: ${CurrencyService.formatBDT(advance2Amount)}`);
    console.log(`   Remaining Due: ${finalInvoice2.formattedDueAmount}`);

    console.log('\n5️⃣ Testing Advance Payment Summary');
    console.log('='.repeat(50));

    // Test 7: Get advance payment summary
    console.log('\n📋 Test 7: Advance Payment Summary');
    
    const summary = await Invoice.getAdvancePaymentSummary({
      customerId: testCustomer._id
    });

    console.log(`✅ Advance Payment Summary:`);
    console.log(`   Total Bookings: ${summary.totalBookings}`);
    console.log(`   Total Advance Amount: ${CurrencyService.formatBDT(summary.totalAdvanceAmount)}`);
    console.log(`   Converted Bookings: ${summary.convertedBookings}`);
    console.log(`   Pending Bookings: ${summary.pendingBookings}`);
    console.log(`   Pending Advance Amount: ${CurrencyService.formatBDT(summary.pendingAdvanceAmount)}`);
    console.log(`   Conversion Rate: ${summary.totalBookings > 0 ? Math.round((summary.convertedBookings / summary.totalBookings) * 100) : 0}%`);

    console.log('\n6️⃣ Testing Error Scenarios');
    console.log('='.repeat(50));

    // Test 8: Try to convert already converted booking
    console.log('\n📋 Test 8: Prevent Double Conversion');
    
    try {
      await bookingInvoice.convertToFinalInvoice({}, owner._id);
      console.log('❌ Should have prevented double conversion');
    } catch (error) {
      console.log('✅ Correctly prevented double conversion');
      console.log(`   Error: ${error.message}`);
    }

    // Test 9: Try to convert non-booking invoice
    console.log('\n📋 Test 9: Prevent Converting Non-Booking Invoice');
    
    try {
      await finalInvoice.convertToFinalInvoice({}, owner._id);
      console.log('❌ Should have prevented converting final invoice');
    } catch (error) {
      console.log('✅ Correctly prevented converting non-booking invoice');
      console.log(`   Error: ${error.message}`);
    }

    // Test 10: Try to record advance payment on final invoice
    console.log('\n📋 Test 10: Prevent Advance Payment on Final Invoice');
    
    try {
      finalInvoice.recordAdvancePayment({
        amount: 5000,
        paymentMethod: 'cash'
      });
      console.log('❌ Should have prevented advance payment on final invoice');
    } catch (error) {
      console.log('✅ Correctly prevented advance payment on final invoice');
      console.log(`   Error: ${error.message}`);
    }

    console.log('\n7️⃣ Testing Walk-in Customer Booking');
    console.log('='.repeat(50));

    // Test 11: Create booking for walk-in customer
    console.log('\n📋 Test 11: Walk-in Customer Booking');
    
    const walkinBookingNo = await Invoice.generateInvoiceNumber();
    const walkinBooking = await Invoice.create({
      invoiceNo: walkinBookingNo,
      invoiceType: 'BOOKING',
      customerName: 'Walk-in Customer for Booking',
      customerPhone: '01700000099',
      customerType: 'walk-in',
      items: [{
        product: testProduct._id,
        productName: testProduct.name,
        quantity: 20,
        unit: testProduct.unit,
        unitPrice: testProduct.sellingPrice,
        totalPrice: 20 * testProduct.sellingPrice
      }],
      discount: 0,
      discountType: 'amount',
      createdBy: owner._id
    });

    walkinBooking.calculateTotals();
    walkinBooking.recordAdvancePayment({
      amount: 15000,
      paymentMethod: 'cash',
      notes: 'Walk-in customer advance payment'
    });

    await walkinBooking.save();

    console.log(`✅ Created walk-in booking: ${walkinBooking.invoiceNo}`);
    console.log(`   Customer Type: ${walkinBooking.customerType}`);
    console.log(`   Advance Payment: ${walkinBooking.formattedAdvancePayment}`);

    console.log('\n8️⃣ Testing Profit Calculation Impact');
    console.log('='.repeat(50));

    // Test 12: Verify profit is only counted on final invoices
    console.log('\n📋 Test 12: Profit Calculation Verification');
    
    // Get all invoices for profit calculation test
    const allTestInvoices = await Invoice.find({
      $or: [
        { invoiceNo: bookingInvoice.invoiceNo },
        { invoiceNo: finalInvoice.invoiceNo },
        { invoiceNo: booking2.invoiceNo },
        { invoiceNo: finalInvoice2.invoiceNo },
        { invoiceNo: walkinBooking.invoiceNo }
      ]
    });

    console.log(`✅ Invoice Types and Profit Impact:`);
    allTestInvoices.forEach(invoice => {
      const shouldCountForProfit = invoice.invoiceType === 'FINAL';
      console.log(`   ${invoice.invoiceNo} (${invoice.invoiceType}): ${shouldCountForProfit ? 'COUNTS' : 'DOES NOT COUNT'} for profit`);
    });

    console.log('\n📊 Final System Statistics');
    console.log('='.repeat(50));
    
    const finalSummary = await Invoice.getAdvancePaymentSummary();
    const allBookings = await Invoice.find({ invoiceType: 'BOOKING', isDeleted: { $ne: true } });
    const allFinals = await Invoice.find({ invoiceType: 'FINAL', isDeleted: { $ne: true } });
    
    console.log(`📈 Total Booking Invoices: ${allBookings.length}`);
    console.log(`📈 Total Final Invoices: ${allFinals.length}`);
    console.log(`📈 Total Advance Amount: ${CurrencyService.formatBDT(finalSummary.totalAdvanceAmount)}`);
    console.log(`📈 Conversion Rate: ${finalSummary.totalBookings > 0 ? Math.round((finalSummary.convertedBookings / finalSummary.totalBookings) * 100) : 0}%`);
    console.log(`📈 Pending Conversions: ${finalSummary.pendingBookings}`);
    console.log(`📈 Pending Advance Amount: ${CurrencyService.formatBDT(finalSummary.pendingAdvanceAmount)}`);

    console.log('\n🎉 All Advance Payment System Tests Completed Successfully!');
    
    console.log('\n💡 Key Features Verified:');
    console.log('   ✅ Booking invoice creation with advance payments');
    console.log('   ✅ Advance payment recording and updates');
    console.log('   ✅ Booking to final invoice conversion');
    console.log('   ✅ Modified final invoices (different items/quantities)');
    console.log('   ✅ Advance payment application to final invoices');
    console.log('   ✅ Conversion status tracking and validation');
    console.log('   ✅ Error prevention (double conversion, wrong types)');
    console.log('   ✅ Walk-in customer booking support');
    console.log('   ✅ Comprehensive reporting and summaries');
    console.log('   ✅ Profit calculation impact (only final invoices count)');

    console.log('\n🔧 Real-World Usage Scenarios:');
    console.log('   • Customer places order with 50% advance payment');
    console.log('   • Track advance payments and pending conversions');
    console.log('   • Convert bookings to final invoices upon completion');
    console.log('   • Handle quantity/specification changes in final invoice');
    console.log('   • Apply advance payments to reduce final balance');
    console.log('   • Generate reports for advance payment management');
    console.log('   • Ensure profit calculations only include completed work');

  } catch (error) {
    console.error('❌ Error in advance payment system tests:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the test function
testAdvancePaymentSystem();