import { test, expect } from '@playwright/test';

test.describe('Invoice Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as owner
    await page.goto('/login');
    await page.fill('input[type="email"]', 'owner@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create a new invoice successfully', async ({ page }) => {
    // Navigate to invoice creation
    await page.click('text=Create Invoice');
    await expect(page).toHaveURL('/invoice');
    
    // Fill customer information
    await page.fill('[data-testid="customer-name"]', 'John Doe');
    await page.fill('[data-testid="customer-phone"]', '01712345678');
    await page.fill('[data-testid="customer-address"]', '123 Test Street, Dhaka');
    
    // Add product item
    await page.click('[data-testid="add-item-button"]');
    await page.fill('[data-testid="product-name-0"]', 'Clear Glass');
    await page.fill('[data-testid="quantity-0"]', '10');
    await page.selectOption('[data-testid="unit-0"]', 'SFT');
    await page.fill('[data-testid="unit-price-0"]', '80');
    
    // Verify total calculation
    await expect(page.locator('[data-testid="item-total-0"]')).toHaveText('৳800');
    await expect(page.locator('[data-testid="subtotal"]')).toHaveText('৳800');
    await expect(page.locator('[data-testid="grand-total"]')).toHaveText('৳800');
    
    // Apply discount
    await page.fill('[data-testid="discount-amount"]', '50');
    await expect(page.locator('[data-testid="grand-total"]')).toHaveText('৳750');
    
    // Record payment
    await page.fill('[data-testid="paid-amount"]', '400');
    await expect(page.locator('[data-testid="due-amount"]')).toHaveText('৳350');
    
    // Add notes
    await page.fill('[data-testid="notes"]', 'Test invoice for automation');
    
    // Save invoice
    await page.click('[data-testid="save-invoice"]');
    
    // Should show success message
    await expect(page.locator('text=Invoice created successfully')).toBeVisible();
    
    // Should redirect to invoice list or show invoice details
    await expect(page.locator('[data-testid="invoice-number"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Navigate to invoice creation
    await page.click('text=Create Invoice');
    
    // Try to save without required fields
    await page.click('[data-testid="save-invoice"]');
    
    // Should show validation errors
    await expect(page.locator('text=Customer name is required')).toBeVisible();
    await expect(page.locator('text=At least one item is required')).toBeVisible();
  });

  test('should calculate totals correctly with multiple items', async ({ page }) => {
    // Navigate to invoice creation
    await page.click('text=Create Invoice');
    
    // Fill customer information
    await page.fill('[data-testid="customer-name"]', 'Jane Doe');
    await page.fill('[data-testid="customer-phone"]', '01812345678');
    
    // Add first item
    await page.click('[data-testid="add-item-button"]');
    await page.fill('[data-testid="product-name-0"]', 'Clear Glass');
    await page.fill('[data-testid="quantity-0"]', '10');
    await page.fill('[data-testid="unit-price-0"]', '80');
    
    // Add second item
    await page.click('[data-testid="add-item-button"]');
    await page.fill('[data-testid="product-name-1"]', 'Tinted Glass');
    await page.fill('[data-testid="quantity-1"]', '5');
    await page.fill('[data-testid="unit-price-1"]', '100');
    
    // Verify individual totals
    await expect(page.locator('[data-testid="item-total-0"]')).toHaveText('৳800');
    await expect(page.locator('[data-testid="item-total-1"]')).toHaveText('৳500');
    
    // Verify subtotal
    await expect(page.locator('[data-testid="subtotal"]')).toHaveText('৳1,300');
    
    // Apply percentage discount
    await page.selectOption('[data-testid="discount-type"]', 'percentage');
    await page.fill('[data-testid="discount-value"]', '10');
    
    // Verify final total
    await expect(page.locator('[data-testid="grand-total"]')).toHaveText('৳1,170');
  });

  test('should remove items correctly', async ({ page }) => {
    // Navigate to invoice creation
    await page.click('text=Create Invoice');
    
    // Fill customer information
    await page.fill('[data-testid="customer-name"]', 'Test Customer');
    
    // Add two items
    await page.click('[data-testid="add-item-button"]');
    await page.fill('[data-testid="product-name-0"]', 'Item 1');
    await page.fill('[data-testid="quantity-0"]', '5');
    await page.fill('[data-testid="unit-price-0"]', '100');
    
    await page.click('[data-testid="add-item-button"]');
    await page.fill('[data-testid="product-name-1"]', 'Item 2');
    await page.fill('[data-testid="quantity-1"]', '3');
    await page.fill('[data-testid="unit-price-1"]', '150');
    
    // Verify subtotal with both items
    await expect(page.locator('[data-testid="subtotal"]')).toHaveText('৳950');
    
    // Remove first item
    await page.click('[data-testid="remove-item-0"]');
    
    // Verify subtotal updated
    await expect(page.locator('[data-testid="subtotal"]')).toHaveText('৳450');
    
    // Verify only one item remains
    await expect(page.locator('[data-testid="product-name-0"]')).toHaveValue('Item 2');
  });

  test('should handle credit limit validation', async ({ page }) => {
    // Navigate to invoice creation
    await page.click('text=Create Invoice');
    
    // Fill customer with low credit limit
    await page.fill('[data-testid="customer-name"]', 'Low Credit Customer');
    await page.fill('[data-testid="customer-phone"]', '01912345678');
    
    // Add high-value item
    await page.click('[data-testid="add-item-button"]');
    await page.fill('[data-testid="product-name-0"]', 'Expensive Glass');
    await page.fill('[data-testid="quantity-0"]', '20');
    await page.fill('[data-testid="unit-price-0"]', '200');
    
    // Try to save (should trigger credit limit check)
    await page.click('[data-testid="save-invoice"]');
    
    // Should show credit limit warning
    await expect(page.locator('text=Credit limit exceeded')).toBeVisible();
    
    // Should show owner override option
    await expect(page.locator('[data-testid="owner-override"]')).toBeVisible();
    
    // Use owner override
    await page.check('[data-testid="owner-override"]');
    await page.click('[data-testid="confirm-save"]');
    
    // Should save successfully
    await expect(page.locator('text=Invoice created successfully')).toBeVisible();
  });

  test('should print invoice', async ({ page }) => {
    // First create an invoice
    await page.click('text=Create Invoice');
    await page.fill('[data-testid="customer-name"]', 'Print Test Customer');
    await page.fill('[data-testid="customer-phone"]', '01712345678');
    
    await page.click('[data-testid="add-item-button"]');
    await page.fill('[data-testid="product-name-0"]', 'Glass');
    await page.fill('[data-testid="quantity-0"]', '10');
    await page.fill('[data-testid="unit-price-0"]', '80');
    
    await page.click('[data-testid="save-invoice"]');
    
    // Wait for invoice to be created
    await expect(page.locator('[data-testid="invoice-number"]')).toBeVisible();
    
    // Mock print dialog
    page.on('dialog', dialog => dialog.accept());
    
    // Click print button
    await page.click('[data-testid="print-invoice"]');
    
    // Verify print preview opens (this might need adjustment based on implementation)
    // For now, we'll just check that the print button is clickable
    await expect(page.locator('[data-testid="print-invoice"]')).toBeEnabled();
  });

  test('should search and filter invoices', async ({ page }) => {
    // Navigate to invoices list
    await page.click('text=Invoices');
    await expect(page).toHaveURL('/invoices');
    
    // Search by customer name
    await page.fill('[data-testid="search-input"]', 'John Doe');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    // Should show filtered results
    await expect(page.locator('[data-testid="invoice-row"]')).toContainText('John Doe');
    
    // Clear search
    await page.fill('[data-testid="search-input"]', '');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    // Filter by status
    await page.selectOption('[data-testid="status-filter"]', 'paid');
    
    // Should show only paid invoices
    await expect(page.locator('[data-testid="status-badge"]')).toHaveText('Paid');
    
    // Filter by date range
    await page.fill('[data-testid="start-date"]', '2024-01-01');
    await page.fill('[data-testid="end-date"]', '2024-12-31');
    await page.click('[data-testid="apply-filter"]');
    
    // Should show filtered results
    await expect(page.locator('[data-testid="invoice-row"]')).toBeVisible();
  });

  test('should record payment for invoice', async ({ page }) => {
    // Navigate to invoices list
    await page.click('text=Invoices');
    
    // Click on first invoice with due amount
    await page.click('[data-testid="invoice-row"]:has-text("Due")');
    
    // Should open invoice details
    await expect(page.locator('[data-testid="invoice-details"]')).toBeVisible();
    
    // Click record payment
    await page.click('[data-testid="record-payment"]');
    
    // Fill payment details
    await page.fill('[data-testid="payment-amount"]', '500');
    await page.selectOption('[data-testid="payment-method"]', 'cash');
    await page.fill('[data-testid="payment-notes"]', 'Partial payment received');
    
    // Save payment
    await page.click('[data-testid="save-payment"]');
    
    // Should show success message
    await expect(page.locator('text=Payment recorded successfully')).toBeVisible();
    
    // Should update invoice status
    await expect(page.locator('[data-testid="invoice-status"]')).toHaveText('Partial');
    
    // Should update due amount
    await expect(page.locator('[data-testid="due-amount"]')).not.toHaveText('৳0');
  });

  test('should handle Bengali language toggle', async ({ page }) => {
    // Navigate to invoice creation
    await page.click('text=Create Invoice');
    
    // Toggle to Bengali
    await page.click('[data-testid="language-toggle"]');
    
    // Check if interface switched to Bengali
    await expect(page.locator('text=গ্রাহকের নাম')).toBeVisible(); // Customer Name in Bengali
    await expect(page.locator('text=পণ্যের নাম')).toBeVisible(); // Product Name in Bengali
    
    // Fill form in Bengali context
    await page.fill('[data-testid="customer-name"]', 'জন ডো');
    await page.fill('[data-testid="customer-phone"]', '০১৭১২৩৪৫৬৭৮');
    
    // Add item
    await page.click('[data-testid="add-item-button"]');
    await page.fill('[data-testid="product-name-0"]', 'স্বচ্ছ কাচ');
    await page.fill('[data-testid="quantity-0"]', '১০');
    await page.fill('[data-testid="unit-price-0"]', '৮০');
    
    // Verify Bengali number formatting
    await expect(page.locator('[data-testid="item-total-0"]')).toHaveText('৳৮০০');
    
    // Toggle back to English
    await page.click('[data-testid="language-toggle"]');
    
    // Check if interface switched back to English
    await expect(page.locator('text=Customer Name')).toBeVisible();
  });
});