import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');
  
  // Launch browser for cleanup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Login as owner to get auth token for cleanup
    const loginResponse = await page.request.post('http://localhost:3001/api/auth/login', {
      data: {
        email: 'owner@example.com',
        password: 'password123'
      }
    });
    
    if (loginResponse.ok()) {
      const loginData = await loginResponse.json();
      const token = loginData.data.token;
      
      // Clean up test data (optional - depends on test strategy)
      console.log('🗑️  Cleaning up test data...');
      
      // Note: In a real scenario, you might want to:
      // 1. Keep test data for debugging failed tests
      // 2. Use a separate test database that gets reset
      // 3. Only clean up specific test data
      
      // For now, we'll just log the cleanup
      console.log('ℹ️  Test data cleanup skipped (using persistent test data)');
      
      // If you want to clean up, you could do:
      /*
      try {
        // Delete test invoices
        await page.request.delete('http://localhost:3001/api/test/cleanup/invoices', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Delete test customers
        await page.request.delete('http://localhost:3001/api/test/cleanup/customers', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Delete test products
        await page.request.delete('http://localhost:3001/api/test/cleanup/products', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('✅ Test data cleaned up successfully');
      } catch (error) {
        console.log('⚠️  Error during test data cleanup:', error);
      }
      */
    }
    
    // Generate test report summary
    console.log('📊 Generating test report summary...');
    
    // This could include:
    // - Test execution time
    // - Pass/fail rates
    // - Performance metrics
    // - Screenshot/video cleanup
    
    console.log('✅ Global test teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global test teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  } finally {
    await browser.close();
  }
}

export default globalTeardown;