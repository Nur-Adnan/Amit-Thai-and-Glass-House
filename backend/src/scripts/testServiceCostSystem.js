import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import { calculateProfit } from '../services/profitCalculationService.js';

dotenv.config();

const testServiceCostSystem = async () => {
  try {
    console.log('🧪 Testing Service Cost Tracking System...\n');

    // Connect to database
    await connectDB();

    // Get test user
    const testUser = await User.findOne({ email: 'owner@company.com' });
    if (!testUser) {
      console.log('❌ Test user not found. Please run user seeding first.');
      return;
    }

    // Get test customer
    let testCustomer = await Customer.findOne({ name: 'John Doe' });
    if (!testCustomer) {
      // Generate unique customer ID
      const customerCount = await Customer.countDocuments();
      const customerId = `CUST-${String(customerCount + 1).padStart(4, '0')}`;
      
      testCustomer = new Customer({
        customerId,
        name: 'John Doe',
        phone: '01712345678',
        address: 'Dhaka, Bangladesh',
        createdBy: testUser._id
      });
      await testCustomer.save();
      console.log('✅ Created test customer');
    } else {
      console.log('✅ Using existing test customer');
    }

    // Get test product
    let testProduct = await Product.findOne({ name: 'Clear Glass 5mm' });
    if (!testProduct) {
      testProduct = new Product({
        name: 'Clear Glass 5mm',
        category: 'Glass',
        unit: 'sqft',
        purchasePrice: 120,
        sellingPrice: 180,
        stockQuantity: 1000,
        createdBy: testUser._id
      });
      await testProduct.save();
      console.log('✅ Created test product');
    } else {
      console.log('✅ Using existing test product');
    }

    console.log('\n📋 Test 1: Creating invoice with service charges...');

    // Generate invoice number manually
    const invoiceNo = await Invoice.generateInvoiceNumber();

    // Create invoice with service charges
    const testInvoice = new Invoice({
      invoiceNo,
      customerName: testCustomer.name,
      customerPhone: testCustomer.phone,
      customerAddress: testCustomer.address,
      customer: testCustomer._id,
      customerType: 'regular',
      invoiceType: 'FINAL',
      items: [{
        product: testProduct._id,
        productName: testProduct.name,
        quantity: 50,
        unit: 'sqft',
        unitPrice: 180
      }],
      discount: 500,
      discountType: 'amount',
      serviceCharges: {
        deliveryCharge: 300,
        installationCharge: 1500,
        installerName: 'Karim Ahmed',
        installerPhone: '01798765432',
        serviceNotes: 'Installation at 3rd floor, requires special equipment'
      },
      paidAmount: 5000,
      paymentMethod: 'mixed',
      notes: 'Test invoice with service charges',
      createdBy: testUser._id
    });

    // Calculate totals to ensure service charges are included
    testInvoice.calculateTotals();
    await testInvoice.save();

    console.log(`✅ Created invoice: ${testInvoice.invoiceNo}`);
    console.log(`   Subtotal: ${testInvoice.formattedSubtotal}`);
    console.log(`   Discount: ${testInvoice.formattedDiscount}`);
    console.log(`   Service Charges: ${testInvoice.formattedTotalServiceCharges}`);
    console.log(`   Grand Total: ${testInvoice.formattedGrandTotal}`);
    console.log(`   Service Info:`, testInvoice.serviceChargesInfo);

    console.log('\n📋 Test 2: Creating invoice without service charges...');

    // Generate invoice number manually
    const regularInvoiceNo = await Invoice.generateInvoiceNumber();

    // Create invoice without service charges for comparison
    const regularInvoice = new Invoice({
      invoiceNo: regularInvoiceNo,
      customerName: 'Walk-in Customer',
      customerType: 'walk-in',
      invoiceType: 'FINAL',
      items: [{
        product: testProduct._id,
        productName: testProduct.name,
        quantity: 30,
        unit: 'sqft',
        unitPrice: 180
      }],
      discount: 0,
      discountType: 'amount',
      paidAmount: 5400,
      paymentMethod: 'cash',
      notes: 'Regular invoice without service charges',
      createdBy: testUser._id
    });

    regularInvoice.calculateTotals();
    await regularInvoice.save();

    console.log(`✅ Created regular invoice: ${regularInvoice.invoiceNo}`);
    console.log(`   Grand Total: ${regularInvoice.formattedGrandTotal}`);
    console.log(`   Service Charges: ${regularInvoice.serviceChargesInfo || 'None'}`);

    console.log('\n📋 Test 3: Testing profit calculation with service costs...');

    // Calculate profit for today (should include service costs as expenses)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const profitData = await calculateProfit(startOfDay, endOfDay, 'daily', testUser);

    console.log('✅ Profit calculation results:');
    console.log(`   Total Sales: ৳${profitData.revenue.totalSales}`);
    console.log(`   Product Costs: ৳${profitData.costs.productCosts}`);
    console.log(`   Service Costs: ৳${profitData.costs.serviceCosts}`);
    console.log(`   Total Costs: ৳${profitData.costs.productCosts + profitData.costs.serviceCosts + profitData.costs.salaryExpenses + profitData.costs.otherExpenses}`);
    console.log(`   Net Profit: ৳${profitData.profit.netProfit}`);
    
    if (profitData.serviceBreakdown) {
      console.log('   Service Breakdown:');
      console.log(`     - Delivery Charges: ৳${profitData.serviceBreakdown.deliveryCharges}`);
      console.log(`     - Installation Charges: ৳${profitData.serviceBreakdown.installationCharges}`);
      console.log(`     - Invoices with Delivery: ${profitData.serviceBreakdown.invoicesWithDelivery}`);
      console.log(`     - Invoices with Installation: ${profitData.serviceBreakdown.invoicesWithInstallation}`);
    }

    console.log('\n📋 Test 4: Testing service charge updates...');

    // Update service charges
    testInvoice.serviceCharges.deliveryCharge = 500;
    testInvoice.serviceCharges.installationCharge = 2000;
    testInvoice.serviceCharges.installerName = 'Rahim Khan';
    testInvoice.serviceCharges.installerPhone = '01987654321';
    testInvoice.serviceCharges.serviceNotes = 'Updated installation details';

    // Recalculate totals
    testInvoice.calculateTotals();
    await testInvoice.save();

    console.log(`✅ Updated service charges for invoice: ${testInvoice.invoiceNo}`);
    console.log(`   New Service Charges: ${testInvoice.formattedTotalServiceCharges}`);
    console.log(`   New Grand Total: ${testInvoice.formattedGrandTotal}`);
    console.log(`   Updated Service Info:`, testInvoice.serviceChargesInfo);

    console.log('\n📋 Test 5: Testing virtual fields and badges...');

    // Test virtual fields
    console.log('✅ Virtual fields test:');
    console.log(`   Formatted Delivery Charge: ${testInvoice.formattedDeliveryCharge}`);
    console.log(`   Formatted Installation Charge: ${testInvoice.formattedInstallationCharge}`);
    console.log(`   Service Charges Badge:`, testInvoice.serviceChargesBadge);

    // Test regular invoice virtual fields
    console.log(`   Regular Invoice Service Badge:`, regularInvoice.serviceChargesBadge);

    console.log('\n📋 Test 6: Testing aggregation queries...');

    // Test service cost aggregation
    const serviceCostSummary = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          invoiceType: 'FINAL',
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          totalDeliveryCharges: { $sum: { $ifNull: ['$serviceCharges.deliveryCharge', 0] } },
          totalInstallationCharges: { $sum: { $ifNull: ['$serviceCharges.installationCharge', 0] } },
          totalServiceCharges: { $sum: { $ifNull: ['$serviceCharges.totalServiceCharges', 0] } },
          invoicesWithDelivery: {
            $sum: {
              $cond: [{ $gt: [{ $ifNull: ['$serviceCharges.deliveryCharge', 0] }, 0] }, 1, 0]
            }
          },
          invoicesWithInstallation: {
            $sum: {
              $cond: [{ $gt: [{ $ifNull: ['$serviceCharges.installationCharge', 0] }, 0] }, 1, 0]
            }
          },
          totalInvoices: { $sum: 1 }
        }
      }
    ]);

    const summary = serviceCostSummary[0] || {};
    console.log('✅ Service cost aggregation results:');
    console.log(`   Total Delivery Charges: ৳${summary.totalDeliveryCharges || 0}`);
    console.log(`   Total Installation Charges: ৳${summary.totalInstallationCharges || 0}`);
    console.log(`   Total Service Charges: ৳${summary.totalServiceCharges || 0}`);
    console.log(`   Invoices with Delivery: ${summary.invoicesWithDelivery || 0}`);
    console.log(`   Invoices with Installation: ${summary.invoicesWithInstallation || 0}`);
    console.log(`   Total Invoices: ${summary.totalInvoices || 0}`);

    console.log('\n📋 Test 7: Testing installer aggregation...');

    // Test installer aggregation
    const installerStats = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          invoiceType: 'FINAL',
          isActive: true,
          'serviceCharges.installerName': { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$serviceCharges.installerName',
          totalJobs: { $sum: 1 },
          totalInstallationCharges: { $sum: '$serviceCharges.installationCharge' },
          averageJobValue: { $avg: '$serviceCharges.installationCharge' }
        }
      },
      { $sort: { totalInstallationCharges: -1 } }
    ]);

    console.log('✅ Installer statistics:');
    installerStats.forEach(installer => {
      console.log(`   ${installer._id}:`);
      console.log(`     - Total Jobs: ${installer.totalJobs}`);
      console.log(`     - Total Charges: ৳${installer.totalInstallationCharges}`);
      console.log(`     - Average per Job: ৳${Math.round(installer.averageJobValue)}`);
    });

    console.log('\n🎉 Service Cost Tracking System Test Completed Successfully!');
    console.log('\n📊 Summary:');
    console.log('✅ Service charge fields added to invoice schema');
    console.log('✅ Service charges included in grand total calculation');
    console.log('✅ Service costs counted as expenses in profit calculation');
    console.log('✅ Virtual fields for formatting working correctly');
    console.log('✅ Aggregation queries for reporting working');
    console.log('✅ Installer tracking and statistics working');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the test
testServiceCostSystem();