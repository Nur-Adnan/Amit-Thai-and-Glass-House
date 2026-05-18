import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Expense from '../models/Expense.js';
import User from '../models/User.js';
import connectDB from '../config/database.js';

dotenv.config();

const seedExpenses = async () => {
  try {
    await connectDB();

    // Clear existing expenses
    await Expense.deleteMany({});

    // Get a user to assign as creator
    const user = await User.findOne({ role: 'owner' });
    if (!user) {
      console.log('No owner user found. Please run seed:owner first.');
      process.exit(1);
    }

    // Sample expenses data
    const expenses = [
      {
        title: 'Office Rent - January 2026',
        description: 'Monthly office rent payment for main office',
        amount: 25000,
        category: 'Office Rent',
        expenseDate: new Date('2026-01-01'),
        paymentMethod: 'bank_transfer',
        referenceNumber: 'RENT-JAN-2026',
        vendor: {
          name: 'ABC Properties',
          contact: '+1-555-0101',
          address: '123 Business District, City'
        },
        status: 'approved',
        approvedBy: user._id,
        approvedAt: new Date(),
        createdBy: user._id
      },
      {
        title: 'Electricity Bill - December 2025',
        description: 'Monthly electricity bill for office and warehouse',
        amount: 3500,
        category: 'Utilities',
        expenseDate: new Date('2025-12-28'),
        paymentMethod: 'upi',
        referenceNumber: 'ELEC-DEC-2025',
        vendor: {
          name: 'City Electric Company',
          contact: '+1-555-0202'
        },
        taxDetails: {
          isTaxable: true,
          taxRate: 18,
          taxAmount: 630
        },
        status: 'approved',
        approvedBy: user._id,
        approvedAt: new Date(),
        createdBy: user._id
      },
      {
        title: 'Marketing Campaign - Social Media',
        description: 'Digital marketing campaign for Q1 2026',
        amount: 15000,
        category: 'Marketing',
        expenseDate: new Date('2026-01-02'),
        paymentMethod: 'card',
        referenceNumber: 'MKT-SM-Q1-2026',
        vendor: {
          name: 'Digital Marketing Solutions',
          contact: '+1-555-0303',
          address: '456 Marketing Ave, City'
        },
        status: 'approved',
        approvedBy: user._id,
        approvedAt: new Date(),
        createdBy: user._id
      },
      {
        title: 'Office Supplies Purchase',
        description: 'Stationery, printer paper, and office supplies',
        amount: 2800,
        category: 'Supplies',
        expenseDate: new Date('2026-01-03'),
        paymentMethod: 'cash',
        vendor: {
          name: 'Office Depot',
          contact: '+1-555-0404'
        },
        status: 'approved',
        approvedBy: user._id,
        approvedAt: new Date(),
        createdBy: user._id
      },
      {
        title: 'Equipment Maintenance',
        description: 'Annual maintenance for cutting machines',
        amount: 8500,
        category: 'Maintenance',
        expenseDate: new Date('2025-12-30'),
        paymentMethod: 'cheque',
        referenceNumber: 'MAINT-2025-001',
        vendor: {
          name: 'Industrial Equipment Services',
          contact: '+1-555-0505',
          address: '789 Industrial Park, City'
        },
        status: 'approved',
        approvedBy: user._id,
        approvedAt: new Date(),
        createdBy: user._id
      },
      {
        title: 'Business Insurance Premium',
        description: 'Annual business insurance premium payment',
        amount: 12000,
        category: 'Insurance',
        expenseDate: new Date('2026-01-01'),
        paymentMethod: 'bank_transfer',
        referenceNumber: 'INS-2026-PREM',
        vendor: {
          name: 'Business Insurance Corp',
          contact: '+1-555-0606'
        },
        status: 'approved',
        approvedBy: user._id,
        approvedAt: new Date(),
        createdBy: user._id
      },
      {
        title: 'Professional Services - Legal',
        description: 'Legal consultation for contract review',
        amount: 5500,
        category: 'Professional Services',
        expenseDate: new Date('2025-12-29'),
        paymentMethod: 'bank_transfer',
        referenceNumber: 'LEGAL-DEC-2025',
        vendor: {
          name: 'Smith & Associates Law Firm',
          contact: '+1-555-0707',
          address: '321 Legal Plaza, City'
        },
        status: 'pending',
        createdBy: user._id
      },
      {
        title: 'Travel Expenses - Client Meeting',
        description: 'Travel and accommodation for client meeting in another city',
        amount: 4200,
        category: 'Travel',
        expenseDate: new Date('2026-01-02'),
        paymentMethod: 'card',
        referenceNumber: 'TRAVEL-JAN-001',
        status: 'approved',
        approvedBy: user._id,
        approvedAt: new Date(),
        createdBy: user._id
      }
    ];

    // Generate expense IDs and create expenses
    for (const expenseData of expenses) {
      const expenseId = await Expense.generateExpenseId();
      await Expense.create({
        ...expenseData,
        expenseId
      });
    }

    console.log('✅ Sample expenses created successfully');
    console.log(`📊 Created ${expenses.length} expense records`);
    console.log('💡 Expense categories included: Office Rent, Utilities, Marketing, Supplies, Maintenance, Insurance, Professional Services, Travel');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding expenses:', error);
    process.exit(1);
  }
};

seedExpenses();