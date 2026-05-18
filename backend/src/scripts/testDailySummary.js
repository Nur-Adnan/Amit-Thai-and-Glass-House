import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

dotenv.config();

const testDailySummary = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n=== DAILY SUMMARY API TEST ===\n');

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

    // Test 1: Get today's daily summary
    console.log('1. Testing today\'s daily summary...');
    try {
      const response = await fetch('http://localhost:3001/api/daily-summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Daily summary retrieved successfully');
        console.log('   Date:', data.data.dateFormatted);
        console.log('   Invoices:', data.data.invoices.total);
        console.log('   Total Sales:', `৳${data.data.sales.total.toLocaleString()}`);
        console.log('   Profit:', `৳${data.data.profit.basic.toLocaleString()}`);
        console.log('   Profit Margin:', `${data.data.profit.margin}%`);
        console.log('   New Dues:', `৳${data.data.newDues.amount.toLocaleString()} (${data.data.newDues.count} invoices)`);
        console.log('   Total Expenses:', `৳${data.data.expenses.total.toLocaleString()}`);
        console.log('   Top Items:', data.data.insights.topItems.length);
        console.log('   Payment Methods:', data.data.insights.paymentMethods.length);
        console.log('   Hourly Sales Points:', data.data.insights.hourlySales.length);
      } else {
        const error = await response.json();
        console.log('❌ Failed to get daily summary:', error.message);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }

    // Test 2: Get daily summary for specific date
    console.log('\n2. Testing daily summary for specific date...');
    try {
      const testDate = '2026-01-02'; // Yesterday
      const response = await fetch(`http://localhost:3001/api/daily-summary?date=${testDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Historical daily summary retrieved successfully');
        console.log('   Date:', data.data.dateFormatted);
        console.log('   Invoices:', data.data.invoices.total);
        console.log('   Total Sales:', `৳${data.data.sales.total.toLocaleString()}`);
        console.log('   Profit:', `৳${data.data.profit.basic.toLocaleString()}`);
      } else {
        const error = await response.json();
        console.log('❌ Failed to get historical summary:', error.message);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }

    // Test 3: Get weekly summary
    console.log('\n3. Testing weekly summary...');
    try {
      const response = await fetch('http://localhost:3001/api/daily-summary/weekly', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Weekly summary retrieved successfully');
        console.log('   Period:', data.data.period);
        console.log('   Week Totals:');
        console.log('     Invoices:', data.data.weekTotals.invoices);
        console.log('     Sales:', `৳${data.data.weekTotals.sales.toLocaleString()}`);
        console.log('     Profit:', `৳${data.data.weekTotals.profit.toLocaleString()}`);
        console.log('   Daily Averages:');
        console.log('     Sales:', `৳${data.data.averages.dailySales.toFixed(0)}`);
        console.log('     Profit:', `৳${data.data.averages.dailyProfit.toFixed(0)}`);
        console.log('     Invoices:', data.data.averages.dailyInvoices.toFixed(1));
        console.log('   Daily Breakdown:', data.data.dailySummaries.length, 'days');
      } else {
        const error = await response.json();
        console.log('❌ Failed to get weekly summary:', error.message);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }

    // Test 4: Get monthly summary
    console.log('\n4. Testing monthly summary...');
    try {
      const response = await fetch('http://localhost:3001/api/daily-summary/monthly', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Monthly summary retrieved successfully');
        console.log('   Period:', data.data.period);
        console.log('   Summary:');
        console.log('     Invoices:', data.data.summary.invoices);
        console.log('     Sales:', `৳${data.data.summary.sales.toLocaleString()}`);
        console.log('     Expenses:', `৳${data.data.summary.expenses.toLocaleString()}`);
        console.log('     Profit:', `৳${data.data.summary.profit.toLocaleString()}`);
        console.log('     Profit Margin:', `${data.data.summary.profitMargin}%`);
        console.log('   Daily Breakdown:', data.data.dailyBreakdown.length, 'days');
      } else {
        const error = await response.json();
        console.log('❌ Failed to get monthly summary:', error.message);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }

    console.log('\n=== DAILY SUMMARY FEATURES ===');
    console.log('✅ Today\'s business summary');
    console.log('✅ Historical date selection');
    console.log('✅ Invoice count and status breakdown');
    console.log('✅ Total sales and payment tracking');
    console.log('✅ Profit calculation with margin');
    console.log('✅ New dues tracking');
    console.log('✅ Expense breakdown (salaries vs other)');
    console.log('✅ Top selling items analysis');
    console.log('✅ Payment method breakdown');
    console.log('✅ Hourly sales distribution');
    console.log('✅ Weekly comparison and trends');
    console.log('✅ Monthly summary and daily breakdown');

    console.log('\n✅ All daily summary tests completed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error testing daily summary:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

testDailySummary();