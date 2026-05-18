import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE = 'http://localhost:3001/api';

// Test function to get invoices
async function testInvoiceListAPI() {
  try {
    console.log('🧪 Testing Invoice List API...\n');

    // Test 1: Get all invoices (without auth - should fail)
    console.log('1. Testing GET /api/invoices without auth...');
    try {
      const response = await fetch(`${API_BASE}/invoices`);
      const data = await response.json();
      
      if (response.status === 401) {
        console.log('✅ Correctly rejected unauthorized request');
      } else {
        console.log('❌ Should have rejected unauthorized request');
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }

    // Test 2: Get all invoices with valid auth
    console.log('\n2. Testing GET /api/invoices with valid auth...');
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NThkMmY2NWVmMTI3YjZiYzBiYWNhOCIsImlhdCI6MTc2NzQyODg1NCwiZXhwIjoxNzcwMDIwODU0fQ._-Fpv6QA47vTatNVhRXBvUh7zaPKv1V8mG_bbttsPXs';
    
    try {
      const response = await fetch(`${API_BASE}/invoices`, {
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log('✅ Successfully fetched invoices');
        console.log(`📊 Found ${data.count} invoices`);
      } else {
        console.log('❌ Failed to fetch invoices:', data.message);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }

    // Test 3: Test search functionality
    console.log('\n3. Testing GET /api/invoices/search...');
    try {
      const response = await fetch(`${API_BASE}/invoices/search?q=INV`, {
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Status:', response.status);
      console.log('Search Results:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log('✅ Search functionality working');
      } else {
        console.log('❌ Search failed:', data.message);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }

    console.log('\n🎉 Invoice List API test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testInvoiceListAPI();