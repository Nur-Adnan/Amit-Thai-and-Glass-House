import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

dotenv.config();

const testShopConfigAPI = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find owner user
    const owner = await User.findOne({ role: 'owner' });
    if (!owner) {
      console.log('No owner user found');
      process.exit(1);
    }

    // Generate token
    const token = jwt.sign(
      { id: owner._id, role: owner.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    console.log('\n=== SHOP CONFIGURATION API TESTS ===\n');

    // Test 1: Get public shop config
    console.log('1. Testing public shop config endpoint...');
    try {
      const response = await fetch('http://localhost:3001/api/shop-config');
      const data = await response.json();
      if (data.success) {
        console.log('✅ Public config retrieved successfully');
        console.log('   Shop Name:', data.data.shopName);
        console.log('   Currency:', data.data.currency.symbol, data.data.currency.code);
      } else {
        console.log('❌ Failed to get public config:', data.message);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }

    // Test 2: Get admin shop config
    console.log('\n2. Testing admin shop config endpoint...');
    try {
      const response = await fetch('http://localhost:3001/api/shop-config/admin', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        console.log('✅ Admin config retrieved successfully');
        console.log('   Version:', data.data.version);
        console.log('   Created By:', data.data.createdBy?.name);
      } else {
        console.log('❌ Failed to get admin config:', data.message);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }

    // Test 3: Test invoice number generation
    console.log('\n3. Testing invoice number generation...');
    try {
      const response = await fetch('http://localhost:3001/api/shop-config/test-invoice-number?sequence=5', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        console.log('✅ Invoice number generated successfully');
        console.log('   Invoice Number:', data.data.invoiceNumber);
        console.log('   Format:', data.data.format);
      } else {
        console.log('❌ Failed to generate invoice number:', data.message);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }

    // Test 4: Test invoice preview
    console.log('\n4. Testing invoice preview...');
    try {
      const response = await fetch('http://localhost:3001/api/shop-config/invoice-preview', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        console.log('✅ Invoice preview generated successfully');
        console.log('   Sample Invoice No:', data.data.sampleInvoice.invoiceNo);
        console.log('   Sample Total:', data.data.sampleInvoice.grandTotal);
      } else {
        console.log('❌ Failed to get invoice preview:', data.message);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }

    // Test 5: Update shop config
    console.log('\n5. Testing shop config update...');
    try {
      const updateData = {
        shopName: 'Amit Thai & Aluminum (Updated)',
        footerNote: 'Thank you for your business! Updated footer.'
      };

      const response = await fetch('http://localhost:3001/api/shop-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      const data = await response.json();
      if (data.success) {
        console.log('✅ Shop config updated successfully');
        console.log('   New Shop Name:', data.data.shopName);
        console.log('   New Footer:', data.data.footerNote);
        console.log('   Version:', data.data.version);
      } else {
        console.log('❌ Failed to update config:', data.message);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }

    console.log('\n✅ All shop configuration API tests completed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error testing shop config API:', error.message);
    process.exit(1);
  }
};

testShopConfigAPI();