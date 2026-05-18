import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const API_BASE = 'http://localhost:3001/api';

// Test user credentials (you may need to adjust these)
const testUser = {
  email: 'owner@test.com',
  password: 'password123'
};

async function testReportsAPI() {
  try {
    console.log('🧪 Testing Reports API Integration...\n');

    // 1. Login to get token
    console.log('1. Logging in...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
    }

    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('✅ Login successful');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Test Today's Sales API
    console.log('\n2. Testing Today\'s Sales API...');
    const salesRes = await fetch(`${API_BASE}/dashboard/todays-sales`, { headers });
    
    if (salesRes.ok) {
      const salesData = await salesRes.json();
      console.log('✅ Today\'s Sales API working');
      console.log(`   - Total Sales: ${salesData.data?.summary?.totalSales || 0}`);
      console.log(`   - Total Invoices: ${salesData.data?.summary?.totalInvoices || 0}`);
    } else {
      console.log(`❌ Today's Sales API failed: ${salesRes.status}`);
    }

    // 3. Test Profit Dashboard API
    console.log('\n3. Testing Profit Dashboard API...');
    const profitRes = await fetch(`${API_BASE}/profit/dashboard`, { headers });
    
    if (profitRes.ok) {
      const profitData = await profitRes.json();
      console.log('✅ Profit Dashboard API working');
      console.log(`   - Net Profit: ${profitData.data?.profit?.netProfit || 0}`);
      console.log(`   - Revenue: ${profitData.data?.revenue?.totalSales || 0}`);
    } else {
      console.log(`❌ Profit Dashboard API failed: ${profitRes.status}`);
    }

    // 4. Test Expenses Stats API
    console.log('\n4. Testing Expenses Stats API...');
    const expensesRes = await fetch(`${API_BASE}/expenses/stats`, { headers });
    
    if (expensesRes.ok) {
      const expensesData = await expensesRes.json();
      console.log('✅ Expenses Stats API working');
      console.log(`   - Total Amount: ${expensesData.data?.totalAmount || 0}`);
      console.log(`   - Categories: ${expensesData.data?.byCategory?.length || 0}`);
    } else {
      console.log(`❌ Expenses Stats API failed: ${expensesRes.status}`);
    }

    // 5. Test Invoices List API
    console.log('\n5. Testing Invoices List API...');
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];
    
    const invoicesRes = await fetch(`${API_BASE}/invoices?startDate=${startDate}&endDate=${endDate}&limit=1000`, { headers });
    
    if (invoicesRes.ok) {
      const invoicesData = await invoicesRes.json();
      console.log('✅ Invoices List API working');
      console.log(`   - Total Invoices: ${invoicesData.data?.length || 0}`);
      console.log(`   - Date Range: ${startDate} to ${endDate}`);
    } else {
      console.log(`❌ Invoices List API failed: ${invoicesRes.status}`);
    }

    // 6. Test Dashboard Overview API
    console.log('\n6. Testing Dashboard Overview API...');
    const overviewRes = await fetch(`${API_BASE}/dashboard/overview`, { headers });
    
    if (overviewRes.ok) {
      const overviewData = await overviewRes.json();
      console.log('✅ Dashboard Overview API working');
      console.log(`   - Today's Sales: ${overviewData.data?.todaysSales?.totalSales || 0}`);
      console.log(`   - Monthly Profit: ${overviewData.data?.monthlyProfit?.netProfit || 0}`);
      console.log(`   - Due Invoices: ${overviewData.data?.dueInvoices?.totalDue || 0}`);
    } else {
      console.log(`❌ Dashboard Overview API failed: ${overviewRes.status}`);
    }

    console.log('\n🎉 Reports API Integration Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testReportsAPI();