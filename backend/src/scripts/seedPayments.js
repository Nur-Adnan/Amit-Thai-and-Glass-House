import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import Invoice from '../models/Invoice.js';
import InvoicePayment from '../models/InvoicePayment.js';
import User from '../models/User.js';

dotenv.config();

const seedPayments = async () => {
  try {
    await connectDB();

    // Find a user to assign as creator
    const user = await User.findOne({ role: { $in: ['owner', 'manager'] } });
    if (!user) {
      console.log('No owner or manager found. Please create a user first.');
      process.exit(1);
    }

    // Get invoices with due amounts
    const invoices = await Invoice.find({ 
      status: { $in: ['due', 'partial'] },
      isActive: true 
    });

    if (invoices.length === 0) {
      console.log('No invoices with due amounts found. Please create some invoices first.');
      process.exit(1);
    }

    // Clear existing payments
    await InvoicePayment.deleteMany();

    const samplePayments = [];

    for (const invoice of invoices) {
      // Add partial payments for demonstration
      const paymentAmount = Math.min(invoice.dueAmount * 0.3, invoice.dueAmount);
      
      if (paymentAmount > 0) {
        samplePayments.push({
          invoice: invoice._id,
          paymentAmount: parseFloat(paymentAmount.toFixed(2)),
          paymentMethod: ['cash', 'card', 'bank_transfer'][Math.floor(Math.random() * 3)],
          referenceNumber: `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          notes: 'Partial payment received',
          previousStatus: invoice.status,
          newStatus: paymentAmount >= invoice.dueAmount ? 'paid' : 'partial',
          previousPaidAmount: invoice.paidAmount,
          newPaidAmount: invoice.paidAmount + paymentAmount,
          remainingDueAmount: Math.max(0, invoice.dueAmount - paymentAmount),
          createdBy: user._id
        });
      }
    }

    if (samplePayments.length === 0) {
      console.log('No payments to create.');
      process.exit(0);
    }

    const createdPayments = await InvoicePayment.create(samplePayments);

    // Update invoices with new payment amounts
    for (let i = 0; i < createdPayments.length; i++) {
      const payment = createdPayments[i];
      const invoice = invoices[i];
      
      invoice.paidAmount = payment.newPaidAmount;
      invoice.dueAmount = payment.remainingDueAmount;
      invoice.status = payment.newStatus;
      invoice.updatedBy = user._id;
      
      await invoice.save();
    }

    console.log(`${createdPayments.length} sample payments created successfully:`);
    for (let i = 0; i < createdPayments.length; i++) {
      const payment = createdPayments[i];
      const invoice = invoices[i];
      console.log(`- ${invoice.invoiceNo}: $${payment.paymentAmount} (${payment.paymentMethod})`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding payments:', error);
    process.exit(1);
  }
};

seedPayments();