/**
 * Seed Suppliers Data
 * Creates initial supplier data for testing the supplier management system
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Supplier from '../models/Supplier.js';
import User from '../models/User.js';
import connectDB from '../config/database.js';

// Load environment variables
dotenv.config();

const seedSuppliers = async () => {
  try {
    console.log('🔄 Starting supplier seed...');

    // Connect to database
    await connectDB();

    // Get owner user for createdBy field
    const owner = await User.findOne({ role: 'owner' });
    if (!owner) {
      console.error('❌ Owner user not found. Please run user seed first.');
      process.exit(1);
    }

    // Clear existing suppliers
    await Supplier.deleteMany({});
    console.log('🗑️  Cleared existing supplier data');

    // Supplier data for Bangladesh glass and Thai business
    const supplierData = [
      {
        name: 'Dhaka Glass House',
        phone: '01712345678',
        email: 'info@dhakaglasshouse.com',
        address: {
          street: '123 Glass Street',
          area: 'Dhanmondi',
          city: 'Dhaka',
          district: 'Dhaka',
          postalCode: '1205'
        },
        supplierType: 'Glass',
        creditLimit: 500000,
        paymentTerms: 'Credit-30',
        notes: 'Main glass supplier for imported glass',
        createdBy: owner._id
      },
      {
        name: 'Chittagong Thai Aluminum',
        phone: '01823456789',
        email: 'sales@ctgaluminum.com',
        address: {
          street: '456 Industrial Road',
          area: 'Agrabad',
          city: 'Chittagong',
          district: 'Chittagong',
          postalCode: '4100'
        },
        supplierType: 'Thai',
        creditLimit: 750000,
        paymentTerms: 'Credit-45',
        notes: 'Premium Thai aluminum supplier',
        createdBy: owner._id
      },
      {
        name: 'Local Glass Traders',
        phone: '01934567890',
        email: 'contact@localglasstraders.bd',
        address: {
          street: '789 Market Lane',
          area: 'Old Dhaka',
          city: 'Dhaka',
          district: 'Dhaka',
          postalCode: '1100'
        },
        supplierType: 'Glass',
        creditLimit: 300000,
        paymentTerms: 'Credit-15',
        notes: 'Local glass supplier with competitive prices',
        createdBy: owner._id
      },
      {
        name: 'Hardware Plus BD',
        phone: '01645678901',
        email: 'orders@hardwareplus.bd',
        address: {
          street: '321 Hardware Bazaar',
          area: 'Elephant Road',
          city: 'Dhaka',
          district: 'Dhaka',
          postalCode: '1205'
        },
        supplierType: 'Hardware',
        creditLimit: 200000,
        paymentTerms: 'Credit-7',
        notes: 'Tools and hardware supplier',
        createdBy: owner._id
      },
      {
        name: 'Sylhet Thai Works',
        phone: '01756789012',
        email: 'info@sylhetthai.com',
        address: {
          street: '654 Industrial Area',
          area: 'Zindabazar',
          city: 'Sylhet',
          district: 'Sylhet',
          postalCode: '3100'
        },
        supplierType: 'Thai',
        creditLimit: 400000,
        paymentTerms: 'Credit-30',
        notes: 'Regional Thai supplier for Sylhet area',
        createdBy: owner._id
      },
      {
        name: 'Rajshahi Glass Industries',
        phone: '01867890123',
        email: 'sales@rajshahiglass.com',
        address: {
          street: '987 Glass Factory Road',
          area: 'Rajpara',
          city: 'Rajshahi',
          district: 'Rajshahi',
          postalCode: '6000'
        },
        supplierType: 'Glass',
        creditLimit: 600000,
        paymentTerms: 'Credit-60',
        notes: 'Large scale glass manufacturer',
        createdBy: owner._id
      },
      {
        name: 'Quick Tools Supply',
        phone: '01978901234',
        email: 'quicktools@gmail.com',
        address: {
          street: '147 Tool Market',
          area: 'Gulshan',
          city: 'Dhaka',
          district: 'Dhaka',
          postalCode: '1212'
        },
        supplierType: 'Tools',
        creditLimit: 150000,
        paymentTerms: 'Cash',
        notes: 'Quick delivery for urgent tool requirements',
        createdBy: owner._id
      },
      {
        name: 'Barisal Building Materials',
        phone: '01589012345',
        email: 'barisal.materials@yahoo.com',
        address: {
          street: '258 Building Supply Street',
          area: 'Sadar Road',
          city: 'Barisal',
          district: 'Barisal',
          postalCode: '8200'
        },
        supplierType: 'Other',
        creditLimit: 250000,
        paymentTerms: 'Credit-15',
        notes: 'General building materials supplier',
        createdBy: owner._id
      },
      {
        name: 'Premium Glass Imports',
        phone: '01690123456',
        email: 'premium@glassimports.bd',
        address: {
          street: '369 Import House',
          area: 'Motijheel',
          city: 'Dhaka',
          district: 'Dhaka',
          postalCode: '1000'
        },
        supplierType: 'Glass',
        creditLimit: 1000000,
        paymentTerms: 'Credit-45',
        notes: 'High-end imported glass supplier',
        createdBy: owner._id
      },
      {
        name: 'Service & Maintenance Co',
        phone: '01501234567',
        email: 'service@maintenance.bd',
        address: {
          street: '741 Service Center',
          area: 'Wari',
          city: 'Dhaka',
          district: 'Dhaka',
          postalCode: '1203'
        },
        supplierType: 'Services',
        creditLimit: 100000,
        paymentTerms: 'Cash',
        notes: 'Equipment maintenance and repair services',
        createdBy: owner._id
      }
    ];

    // Create suppliers one by one to trigger pre-save middleware
    const createdSuppliers = [];
    for (let i = 0; i < supplierData.length; i++) {
      const data = supplierData[i];
      console.log(`Creating supplier ${i + 1}: ${data.name}`);
      try {
        const supplier = await Supplier.create(data);
        console.log(`✅ Created: ${supplier.supplierId} - ${supplier.name}`);
        createdSuppliers.push(supplier);
      } catch (error) {
        console.error(`❌ Error creating supplier ${data.name}:`, error.message);
        throw error;
      }
    }
    console.log(`✅ Created ${createdSuppliers.length} suppliers`);

    // Display created suppliers
    console.log('\n📊 Supplier Summary:');
    console.log('='.repeat(80));
    
    const suppliersByType = {};
    createdSuppliers.forEach(supplier => {
      const type = supplier.supplierType;
      if (!suppliersByType[type]) {
        suppliersByType[type] = [];
      }
      suppliersByType[type].push(supplier);
    });

    Object.keys(suppliersByType).forEach(type => {
      console.log(`\n${type} Suppliers:`);
      console.log('-'.repeat(50));
      
      suppliersByType[type].forEach(supplier => {
        console.log(`  ${supplier.supplierId}: ${supplier.name}`);
        console.log(`    Phone: ${supplier.phone}`);
        console.log(`    Location: ${supplier.address.city}, ${supplier.address.district}`);
        console.log(`    Credit Limit: ${supplier.formattedCreditLimit}`);
        console.log(`    Payment Terms: ${supplier.paymentTerms}`);
        console.log('');
      });
    });

    // Add some sample due amounts to make testing more realistic
    console.log('\n💰 Adding Sample Due Amounts...');
    
    const sampleDues = [
      { supplierId: createdSuppliers[0]._id, purchase: 125000, paid: 75000 },
      { supplierId: createdSuppliers[1]._id, purchase: 200000, paid: 150000 },
      { supplierId: createdSuppliers[2]._id, purchase: 80000, paid: 80000 },
      { supplierId: createdSuppliers[3]._id, purchase: 45000, paid: 20000 },
      { supplierId: createdSuppliers[4]._id, purchase: 150000, paid: 100000 }
    ];

    for (const due of sampleDues) {
      const supplier = await Supplier.findById(due.supplierId);
      if (supplier) {
        await supplier.updateDueAmount(due.purchase, due.paid);
        console.log(`  ${supplier.name}: Purchase ৳${due.purchase}, Paid ৳${due.paid}, Due ${supplier.formattedTotalDue}`);
      }
    }

    console.log('\n🎉 Supplier seed completed successfully!');
    
    console.log('\n📈 Final Statistics:');
    const stats = await Supplier.getSupplierStats();
    console.log(`   Total Suppliers: ${stats.overview.totalSuppliers}`);
    console.log(`   Active Suppliers: ${stats.overview.activeSuppliers}`);
    console.log(`   Total Due Amount: ৳${stats.overview.totalDueAmount.toLocaleString()}`);
    console.log(`   Suppliers with Due: ${stats.overview.suppliersWithDue}`);

    console.log('\n💡 Usage Examples:');
    console.log('   GET /api/suppliers - List all suppliers');
    console.log('   GET /api/suppliers/stats - Get supplier statistics');
    console.log('   POST /api/suppliers - Create new supplier');
    console.log('   PUT /api/suppliers/:id/due - Update supplier due amount');
    console.log('   POST /api/suppliers/:id/payment - Make payment to supplier');

  } catch (error) {
    console.error('❌ Error seeding suppliers:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the seed function
seedSuppliers();