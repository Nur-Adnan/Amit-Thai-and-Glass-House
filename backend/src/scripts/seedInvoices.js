import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

dotenv.config();

const seedInvoices = async () => {
  try {
    await connectDB();

    // Find a user to assign as creator
    const user = await User.findOne({ role: { $in: ['owner', 'manager'] } });
    if (!user) {
      console.log('No owner or manager found. Please create a user first.');
      process.exit(1);
    }

    // Get some products
    const products = await Product.find({ isActive: true }).limit(5);
    if (products.length === 0) {
      console.log('No products found. Please seed products first.');
      process.exit(1);
    }

    // Clear existing invoices
    await Invoice.deleteMany();

    const sampleInvoices = [
      {
        customerName: 'John Smith Construction',
        customerPhone: '+1-555-0123',
        customerAddress: '123 Main St, City, State 12345',
        items: [
          {
            product: products[0]._id,
            productName: products[0].name,
            quantity: 25,
            unit: products[0].unit,
            unitPrice: products[0].sellingPrice,
            totalPrice: 25 * products[0].sellingPrice
          },
          {
            product: products[1]._id,
            productName: products[1].name,
            quantity: 15,
            unit: products[1].unit,
            unitPrice: products[1].sellingPrice,
            totalPrice: 15 * products[1].sellingPrice
          }
        ],
        discount: 500,
        discountType: 'amount',
        paidAmount: 5000,
        paymentMethod: 'bank_transfer',
        notes: 'Bulk order for construction project',
        createdBy: user._id
      },
      {
        customerName: 'ABC Glass Works',
        customerPhone: '+1-555-0456',
        customerAddress: '456 Oak Ave, City, State 12345',
        items: [
          {
            product: products[2]._id,
            productName: products[2].name,
            quantity: 10,
            unit: products[2].unit,
            unitPrice: products[2].sellingPrice,
            totalPrice: 10 * products[2].sellingPrice
          }
        ],
        discount: 5,
        discountType: 'percentage',
        paidAmount: 0,
        paymentMethod: 'cash',
        notes: 'Regular customer order',
        createdBy: user._id
      },
      {
        customerName: 'Home Renovation Co.',
        customerPhone: '+1-555-0789',
        customerAddress: '789 Pine St, City, State 12345',
        items: [
          {
            product: products[3]._id,
            productName: products[3].name,
            quantity: 30,
            unit: products[3].unit,
            unitPrice: products[3].sellingPrice,
            totalPrice: 30 * products[3].sellingPrice
          },
          {
            product: products[4]._id,
            productName: products[4].name,
            quantity: 20,
            unit: products[4].unit,
            unitPrice: products[4].sellingPrice,
            totalPrice: 20 * products[4].sellingPrice
          }
        ],
        discount: 1000,
        discountType: 'amount',
        paidAmount: 3000,
        paymentMethod: 'card',
        notes: 'Partial payment received',
        createdBy: user._id
      }
    ];

    // Create invoices one by one to trigger the invoice number generation
    const createdInvoices = [];
    for (const invoiceData of sampleInvoices) {
      // Generate invoice number
      const invoiceNo = await Invoice.generateInvoiceNumber();
      invoiceData.invoiceNo = invoiceNo;
      
      const invoice = await Invoice.create(invoiceData);
      createdInvoices.push(invoice);
      
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`${createdInvoices.length} sample invoices created successfully:`);
    createdInvoices.forEach(invoice => {
      console.log(`- ${invoice.invoiceNo} - ${invoice.customerName} - $${invoice.grandTotal} (${invoice.status})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding invoices:', error);
    process.exit(1);
  }
};

seedInvoices();