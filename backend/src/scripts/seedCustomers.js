import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Customer from '../models/Customer.js';
import User from '../models/User.js';
import connectDB from '../config/database.js';

dotenv.config();

const seedCustomers = async () => {
  try {
    await connectDB();

    // Find the owner user for createdBy field
    const owner = await User.findOne({ role: 'owner' });
    if (!owner) {
      console.error('❌ Owner user not found. Please run seed:owner first.');
      process.exit(1);
    }

    // Clear existing customers
    const deletedCount = await Customer.deleteMany({});
    console.log(`🗑️  Cleared ${deletedCount.deletedCount} existing customers`);

    // Sample customers data
    const customersData = [
      {
        name: 'ABC Construction Company',
        phone: '+1-555-0101',
        email: 'contact@abcconstruction.com',
        address: {
          street: '123 Business Park Drive',
          city: 'Houston',
          state: 'TX',
          zipCode: '77001',
          country: 'USA'
        },
        customerType: 'corporate',
        creditLimit: 50000,
        notes: 'Large construction company, regular customer'
      },
      {
        name: 'John Smith',
        phone: '+1-555-0102',
        email: 'john.smith@email.com',
        address: {
          street: '456 Residential Lane',
          city: 'Houston',
          state: 'TX',
          zipCode: '77002',
          country: 'USA'
        },
        customerType: 'regular',
        notes: 'Homeowner, kitchen renovation project'
      },
      {
        name: 'Premium Glass Solutions',
        phone: '+1-555-0103',
        email: 'orders@premiumglass.com',
        address: {
          street: '789 Industrial Boulevard',
          city: 'Houston',
          state: 'TX',
          zipCode: '77003',
          country: 'USA'
        },
        customerType: 'corporate',
        creditLimit: 75000,
        notes: 'Glass installation company, bulk orders'
      },
      {
        name: 'Maria Rodriguez',
        phone: '+1-555-0104',
        email: 'maria.rodriguez@email.com',
        address: {
          street: '321 Suburban Street',
          city: 'Houston',
          state: 'TX',
          zipCode: '77004',
          country: 'USA'
        },
        customerType: 'regular',
        notes: 'Bathroom renovation, repeat customer'
      },
      {
        name: 'Elite Interiors LLC',
        phone: '+1-555-0105',
        email: 'projects@eliteinteriors.com',
        address: {
          street: '654 Design District',
          city: 'Houston',
          state: 'TX',
          zipCode: '77005',
          country: 'USA'
        },
        customerType: 'corporate',
        creditLimit: 100000,
        notes: 'Interior design company, high-end projects'
      },
      {
        name: 'Robert Johnson',
        phone: '+1-555-0106',
        address: {
          street: '987 Oak Avenue',
          city: 'Houston',
          state: 'TX',
          zipCode: '77006',
          country: 'USA'
        },
        customerType: 'regular',
        notes: 'Commercial property owner'
      },
      {
        name: 'Texas Builders Group',
        phone: '+1-555-0107',
        email: 'procurement@texasbuilders.com',
        address: {
          street: '147 Construction Way',
          city: 'Houston',
          state: 'TX',
          zipCode: '77007',
          country: 'USA'
        },
        customerType: 'corporate',
        creditLimit: 200000,
        notes: 'Major construction company, VIP customer'
      },
      {
        name: 'Sarah Williams',
        phone: '+1-555-0108',
        email: 'sarah.williams@email.com',
        address: {
          street: '258 Garden View',
          city: 'Houston',
          state: 'TX',
          zipCode: '77008',
          country: 'USA'
        },
        customerType: 'regular',
        notes: 'New home construction'
      },
      {
        name: 'Metro Glass & Marble',
        phone: '+1-555-0109',
        email: 'sales@metroglass.com',
        address: {
          street: '369 Trade Center',
          city: 'Houston',
          state: 'TX',
          zipCode: '77009',
          country: 'USA'
        },
        customerType: 'corporate',
        creditLimit: 150000,
        notes: 'Wholesale distributor'
      },
      {
        name: 'David Chen',
        phone: '+1-555-0110',
        email: 'david.chen@email.com',
        address: {
          street: '741 Modern Plaza',
          city: 'Houston',
          state: 'TX',
          zipCode: '77010',
          country: 'USA'
        },
        customerType: 'regular',
        notes: 'Restaurant renovation project'
      }
    ];

    // Create customers with generated IDs
    const customers = [];
    for (let i = 0; i < customersData.length; i++) {
      const customerData = {
        ...customersData[i],
        createdBy: owner._id
      };
      customers.push(customerData);
    }

    // Insert customers one by one to generate unique IDs
    const createdCustomers = [];
    for (const customerData of customers) {
      const customerId = await Customer.generateCustomerId();
      customerData.customerId = customerId;
      const customer = await Customer.create(customerData);
      createdCustomers.push(customer);
    }
    
    console.log('✅ Sample customers created successfully:');
    createdCustomers.forEach(customer => {
      console.log(`   ${customer.customerId}: ${customer.name} (${customer.customerType})`);
    });

    console.log(`\n📊 Summary:`);
    console.log(`   Total customers: ${createdCustomers.length}`);
    console.log(`   Regular customers: ${createdCustomers.filter(c => c.customerType === 'regular').length}`);
    console.log(`   Corporate customers: ${createdCustomers.filter(c => c.customerType === 'corporate').length}`);
    
    const totalCreditLimit = createdCustomers
      .filter(c => c.customerType === 'corporate')
      .reduce((sum, c) => sum + c.creditLimit, 0);
    console.log(`   Total credit limit: $${totalCreditLimit.toLocaleString()}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding customers:', error);
    process.exit(1);
  }
};

// Run the seed function
seedCustomers();