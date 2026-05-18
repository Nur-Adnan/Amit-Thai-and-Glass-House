import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🧪 Starting global test setup...');
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for backend to be ready
    console.log('⏳ Waiting for backend server...');
    let backendReady = false;
    let attempts = 0;
    const maxAttempts = 30;
    
    while (!backendReady && attempts < maxAttempts) {
      try {
        const response = await page.request.get('http://localhost:3001/api/health');
        if (response.ok()) {
          backendReady = true;
          console.log('✅ Backend server is ready');
        }
      } catch (error) {
        attempts++;
        await page.waitForTimeout(2000);
      }
    }
    
    if (!backendReady) {
      throw new Error('Backend server failed to start within timeout');
    }
    
    // Wait for frontend to be ready
    console.log('⏳ Waiting for frontend server...');
    let frontendReady = false;
    attempts = 0;
    
    while (!frontendReady && attempts < maxAttempts) {
      try {
        const response = await page.request.get('http://localhost:3000');
        if (response.ok()) {
          frontendReady = true;
          console.log('✅ Frontend server is ready');
        }
      } catch (error) {
        attempts++;
        await page.waitForTimeout(2000);
      }
    }
    
    if (!frontendReady) {
      throw new Error('Frontend server failed to start within timeout');
    }
    
    // Setup test data
    console.log('📊 Setting up test data...');
    
    // Create test users
    const testUsers = [
      {
        name: 'Test Owner',
        email: 'owner@example.com',
        password: 'password123',
        role: 'owner'
      },
      {
        name: 'Test Manager',
        email: 'manager@example.com',
        password: 'password123',
        role: 'manager'
      },
      {
        name: 'Test Accountant',
        email: 'accountant@example.com',
        password: 'password123',
        role: 'accountant'
      }
    ];
    
    for (const user of testUsers) {
      try {
        const response = await page.request.post('http://localhost:3001/api/auth/register', {
          data: user
        });
        
        if (response.ok()) {
          console.log(`✅ Created test user: ${user.email}`);
        } else {
          const error = await response.json();
          if (error.message?.includes('already exists')) {
            console.log(`ℹ️  Test user already exists: ${user.email}`);
          } else {
            console.log(`⚠️  Failed to create user ${user.email}:`, error.message);
          }
        }
      } catch (error) {
        console.log(`⚠️  Error creating user ${user.email}:`, error);
      }
    }
    
    // Create test customers
    console.log('👥 Creating test customers...');
    
    // First, login as owner to get auth token
    const loginResponse = await page.request.post('http://localhost:3001/api/auth/login', {
      data: {
        email: 'owner@example.com',
        password: 'password123'
      }
    });
    
    if (loginResponse.ok()) {
      const loginData = await loginResponse.json();
      const token = loginData.data.token;
      
      const testCustomers = [
        {
          name: 'John Doe',
          phone: '01712345678',
          email: 'john@example.com',
          customerType: 'regular',
          creditLimit: 10000
        },
        {
          name: 'Jane Smith',
          phone: '01812345678',
          email: 'jane@example.com',
          customerType: 'corporate',
          creditLimit: 25000
        },
        {
          name: 'Low Credit Customer',
          phone: '01912345678',
          email: 'lowcredit@example.com',
          customerType: 'regular',
          creditLimit: 500,
          totalDue: 400
        }
      ];
      
      for (const customer of testCustomers) {
        try {
          const response = await page.request.post('http://localhost:3001/api/customers', {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            data: customer
          });
          
          if (response.ok()) {
            console.log(`✅ Created test customer: ${customer.name}`);
          } else {
            const error = await response.json();
            console.log(`⚠️  Failed to create customer ${customer.name}:`, error.message);
          }
        } catch (error) {
          console.log(`⚠️  Error creating customer ${customer.name}:`, error);
        }
      }
      
      // Create test products
      console.log('📦 Creating test products...');
      
      const testProducts = [
        {
          name: 'Clear Glass',
          category: 'Glass',
          stockQuantity: 100,
          unit: 'SFT',
          purchasePrice: 50,
          sellingPrice: 80
        },
        {
          name: 'Tinted Glass',
          category: 'Glass',
          stockQuantity: 50,
          unit: 'SFT',
          purchasePrice: 70,
          sellingPrice: 100
        },
        {
          name: 'Thai Aluminum Frame',
          category: 'Thai',
          stockQuantity: 25,
          unit: 'PCS',
          purchasePrice: 200,
          sellingPrice: 300
        }
      ];
      
      for (const product of testProducts) {
        try {
          const response = await page.request.post('http://localhost:3001/api/products', {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            data: product
          });
          
          if (response.ok()) {
            console.log(`✅ Created test product: ${product.name}`);
          } else {
            const error = await response.json();
            console.log(`⚠️  Failed to create product ${product.name}:`, error.message);
          }
        } catch (error) {
          console.log(`⚠️  Error creating product ${product.name}:`, error);
        }
      }
      
      // Create test invoices
      console.log('📄 Creating test invoices...');
      
      const testInvoices = [
        {
          customerName: 'John Doe',
          customerPhone: '01712345678',
          items: [{
            productName: 'Clear Glass',
            quantity: 10,
            unit: 'SFT',
            unitPrice: 80,
            totalPrice: 800
          }],
          subtotal: 800,
          grandTotal: 800,
          paidAmount: 800,
          dueAmount: 0,
          status: 'paid',
          paymentMethod: 'cash'
        },
        {
          customerName: 'Jane Smith',
          customerPhone: '01812345678',
          items: [{
            productName: 'Tinted Glass',
            quantity: 5,
            unit: 'SFT',
            unitPrice: 100,
            totalPrice: 500
          }],
          subtotal: 500,
          grandTotal: 500,
          paidAmount: 0,
          dueAmount: 500,
          status: 'due',
          paymentMethod: 'cash'
        }
      ];
      
      for (const invoice of testInvoices) {
        try {
          const response = await page.request.post('http://localhost:3001/api/invoices', {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            data: invoice
          });
          
          if (response.ok()) {
            console.log(`✅ Created test invoice for: ${invoice.customerName}`);
          } else {
            const error = await response.json();
            console.log(`⚠️  Failed to create invoice for ${invoice.customerName}:`, error.message);
          }
        } catch (error) {
          console.log(`⚠️  Error creating invoice for ${invoice.customerName}:`, error);
        }
      }
    }
    
    console.log('✅ Global test setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global test setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;