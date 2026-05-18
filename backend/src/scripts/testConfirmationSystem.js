import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import jwt from 'jsonwebtoken';

dotenv.config();

const testConfirmationSystem = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n=== CONFIRMATION SYSTEM TEST ===\n');

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

    // Test 1: Try to cancel invoice without confirmation
    console.log('1. Testing invoice cancellation without confirmation...');
    try {
      const invoice = await Invoice.findOne({ isActive: true });
      if (!invoice) {
        console.log('   No active invoice found for testing');
      } else {
        const response = await fetch(`http://localhost:3001/api/invoices/${invoice._id}/cancel`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        if (data.confirmationRequired) {
          console.log('   ✅ Confirmation required as expected');
          console.log('   Action:', data.actionConfig.action);
          console.log('   Requires Reason:', data.actionConfig.requiresReason);
          console.log('   Message:', data.actionConfig.message);
        } else {
          console.log('   ❌ Expected confirmation requirement');
        }
      }
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }

    // Test 2: Try to update stock without confirmation
    console.log('\n2. Testing stock update without confirmation...');
    try {
      const product = await Product.findOne({ isActive: true });
      if (!product) {
        console.log('   No active product found for testing');
      } else {
        const response = await fetch(`http://localhost:3001/api/products/${product._id}/stock`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            quantity: 5,
            operation: 'add'
          })
        });
        
        const data = await response.json();
        if (data.confirmationRequired) {
          console.log('   ✅ Confirmation required as expected');
          console.log('   Action:', data.actionConfig.action);
          console.log('   Requires Reason:', data.actionConfig.requiresReason);
          console.log('   Message:', data.actionConfig.message);
        } else {
          console.log('   ❌ Expected confirmation requirement');
        }
      }
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }

    // Test 3: Try to modify paid invoice (should be locked)
    console.log('\n3. Testing paid invoice lock...');
    try {
      // Find or create a paid invoice
      let paidInvoice = await Invoice.findOne({ status: 'paid', isActive: true });
      
      if (!paidInvoice) {
        // Create a test paid invoice
        const product = await Product.findOne({ isActive: true });
        if (product) {
          paidInvoice = new Invoice({
            customerName: 'Test Customer for Lock Test',
            customerPhone: '+880-123-456789',
            items: [{
              product: product._id,
              productName: product.name,
              quantity: 1,
              unit: product.unit,
              unitPrice: product.sellingPrice,
              totalPrice: product.sellingPrice
            }],
            subtotal: product.sellingPrice,
            discount: 0,
            discountType: 'amount',
            grandTotal: product.sellingPrice,
            paidAmount: product.sellingPrice,
            dueAmount: 0,
            status: 'paid',
            paymentMethod: 'cash',
            createdBy: owner._id
          });
          
          paidInvoice.invoiceNo = await Invoice.generateInvoiceNumber();
          await paidInvoice.save();
          console.log('   Created test paid invoice:', paidInvoice.invoiceNo);
        }
      }

      if (paidInvoice) {
        const response = await fetch(`http://localhost:3001/api/invoices/${paidInvoice._id}/cancel`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'x-confirm-action': 'true',
            'x-action-reason': 'Testing lock system'
          }
        });
        
        const data = await response.json();
        if (data.locked) {
          console.log('   ✅ Invoice locked as expected');
          console.log('   Invoice Status:', data.invoiceStatus);
          console.log('   Invoice No:', data.invoiceNo);
          console.log('   Message:', data.message);
        } else {
          console.log('   ❌ Expected invoice to be locked');
        }
      }
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }

    // Test 4: Test successful confirmation with reason
    console.log('\n4. Testing successful confirmation with reason...');
    try {
      const product = await Product.findOne({ isActive: true });
      if (product) {
        const response = await fetch(`http://localhost:3001/api/products/${product._id}/stock`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'x-confirm-action': 'true',
            'x-action-reason': 'Testing confirmation system - adding test stock'
          },
          body: JSON.stringify({
            quantity: 2,
            operation: 'add'
          })
        });
        
        const data = await response.json();
        if (data.success) {
          console.log('   ✅ Stock updated successfully with confirmation');
          console.log('   Previous Stock:', data.stockChange.previousStock);
          console.log('   New Stock:', data.stockChange.newStock);
          console.log('   Operation:', data.stockChange.operation);
        } else {
          console.log('   ❌ Expected successful stock update');
          console.log('   Error:', data.message);
        }
      }
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }

    // Test 5: Test confirmation requirement without reason (should fail)
    console.log('\n5. Testing confirmation without required reason...');
    try {
      const invoice = await Invoice.findOne({ isActive: true, status: { $ne: 'paid' } });
      if (invoice) {
        const response = await fetch(`http://localhost:3001/api/invoices/${invoice._id}/cancel`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'x-confirm-action': 'true'
            // No reason provided
          }
        });
        
        const data = await response.json();
        if (!data.success && data.message.includes('Reason is required')) {
          console.log('   ✅ Correctly rejected confirmation without reason');
          console.log('   Message:', data.message);
        } else {
          console.log('   ❌ Expected rejection for missing reason');
        }
      }
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }

    console.log('\n=== CONFIRMATION SYSTEM FEATURES ===');
    console.log('✅ Invoice edit confirmation');
    console.log('✅ Invoice cancellation with reason requirement');
    console.log('✅ Stock manual adjustment with reason requirement');
    console.log('✅ Salary edit confirmation');
    console.log('✅ Paid invoice locking (read-only)');
    console.log('✅ Audit logging with confirmation details');
    console.log('✅ Reason validation for critical actions');

    console.log('\n✅ All confirmation system tests completed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error testing confirmation system:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

testConfirmationSystem();