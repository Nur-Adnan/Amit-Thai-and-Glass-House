import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

dotenv.config();

const testPrintInvoice = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n=== PRINT INVOICE SYSTEM TEST ===\n');

    // Find a user for creating invoice
    const user = await User.findOne({ role: 'owner' });
    if (!user) {
      console.log('No user found');
      process.exit(1);
    }

    // Find some products
    const products = await Product.find().limit(2);
    if (products.length === 0) {
      console.log('No products found');
      process.exit(1);
    }

    // Create a test invoice with calculator-based items
    const testInvoice = new Invoice({
      customerName: 'Test Customer for Print',
      customerPhone: '+880-123-456789',
      customerAddress: '123 Test Street, Dhaka, Bangladesh',
      customerType: 'walk-in',
      items: [
        {
          product: products[0]._id,
          productName: products[0].name + ' (Calculator Item)',
          quantity: 10.5, // Calculator-based quantity (area in sq ft)
          unit: 'sqft',
          unitPrice: 150,
          totalPrice: 10.5 * 150,
          // Add calculator-specific fields
          isCalculatorItem: true,
          dimensions: {
            length: 3.5, // feet
            width: 3, // feet
            area: 10.5 // calculated area
          }
        },
        {
          product: products[1]._id,
          productName: products[1].name,
          quantity: 5,
          unit: 'pieces',
          unitPrice: 200,
          totalPrice: 5 * 200
        }
      ],
      subtotal: (10.5 * 150) + (5 * 200),
      discount: 100,
      discountType: 'amount',
      grandTotal: ((10.5 * 150) + (5 * 200)) - 100,
      paidAmount: 1000,
      dueAmount: (((10.5 * 150) + (5 * 200)) - 100) - 1000,
      status: 'partial',
      paymentMethod: 'cash',
      notes: 'Test invoice for print functionality with calculator-based items',
      createdBy: user._id
    });

    // Calculate totals
    testInvoice.calculateTotals();

    // Generate invoice number
    testInvoice.invoiceNo = await Invoice.generateInvoiceNumber();

    await testInvoice.save();

    console.log('✅ Test invoice created successfully!');
    console.log('Invoice Details:');
    console.log('   Invoice No:', testInvoice.invoiceNo);
    console.log('   Customer:', testInvoice.customerName);
    console.log('   Items:', testInvoice.items.length);
    console.log('   Calculator Item:', testInvoice.items[0].isCalculatorItem ? 'Yes' : 'No');
    console.log('   Dimensions:', testInvoice.items[0].dimensions);
    console.log('   Grand Total:', testInvoice.grandTotal);
    console.log('   Status:', testInvoice.status);

    // Test invoice retrieval with populated data
    const retrievedInvoice = await Invoice.findById(testInvoice._id)
      .populate('items.product', 'name category unit')
      .populate('createdBy', 'name email');

    console.log('\n✅ Invoice retrieved successfully!');
    console.log('   Retrieved Invoice No:', retrievedInvoice.invoiceNo);
    console.log('   Created By:', retrievedInvoice.createdBy.name);

    // Test API endpoint format
    const apiResponse = {
      success: true,
      data: {
        _id: retrievedInvoice._id,
        invoiceNo: retrievedInvoice.invoiceNo,
        customerName: retrievedInvoice.customerName,
        customerPhone: retrievedInvoice.customerPhone,
        customerAddress: retrievedInvoice.customerAddress,
        items: retrievedInvoice.items.map(item => ({
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          isCalculatorItem: item.isCalculatorItem,
          dimensions: item.dimensions
        })),
        subtotal: retrievedInvoice.subtotal,
        discount: retrievedInvoice.discount,
        discountType: retrievedInvoice.discountType,
        grandTotal: retrievedInvoice.grandTotal,
        paidAmount: retrievedInvoice.paidAmount,
        dueAmount: retrievedInvoice.dueAmount,
        status: retrievedInvoice.status,
        paymentMethod: retrievedInvoice.paymentMethod,
        notes: retrievedInvoice.notes,
        createdAt: retrievedInvoice.createdAt
      }
    };

    console.log('\n✅ API Response Format:');
    console.log(JSON.stringify(apiResponse, null, 2));

    console.log('\n🖨️  Print Test Instructions:');
    console.log('1. Open the frontend application');
    console.log('2. Navigate to Invoice Management');
    console.log('3. Find invoice:', testInvoice.invoiceNo);
    console.log('4. Click "Print/View" button');
    console.log('5. Test both Print and PDF Download buttons');
    console.log('6. Verify calculator-based item dimensions are displayed');
    console.log('7. Check A4 print layout and black & white formatting');

    console.log('\n✅ Print invoice test setup completed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error testing print invoice:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

testPrintInvoice();