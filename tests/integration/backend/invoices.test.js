const request = require('supertest');
const app = require('../../../backend/src/app.js').default;
const Invoice = require('../../../backend/src/models/Invoice.js').default;
const Customer = require('../../../backend/src/models/Customer.js').default;
const Product = require('../../../backend/src/models/Product.js').default;

describe('Invoice API Integration Tests', () => {
  let authToken;
  let testUser;
  let testCustomer;
  let testProduct;

  beforeEach(async () => {
    // Create test user and get auth token
    const { user, token } = await global.testUtils.createTestUser({
      name: 'Test User',
      email: 'test@example.com',
      role: 'owner'
    });
    testUser = user;
    authToken = token;

    // Create test customer
    testCustomer = await global.testUtils.createTestCustomer({
      name: 'Test Customer',
      phone: '01712345678',
      creditLimit: 10000
    });

    // Create test product
    testProduct = await global.testUtils.createTestProduct({
      name: 'Clear Glass',
      category: 'Glass',
      stockQuantity: 100,
      unit: 'SFT',
      purchasePrice: 50,
      sellingPrice: 80
    });
  });

  describe('POST /api/invoices', () => {
    test('should create a new invoice successfully', async () => {
      const invoiceData = {
        customerName: testCustomer.name,
        customerPhone: testCustomer.phone,
        customerAddress: 'Test Address',
        items: [{
          productName: testProduct.name,
          quantity: 10,
          unit: testProduct.unit,
          unitPrice: testProduct.sellingPrice,
          totalPrice: 800
        }],
        subtotal: 800,
        discountAmount: 0,
        grandTotal: 800,
        paidAmount: 400,
        dueAmount: 400,
        status: 'partial',
        paymentMethod: 'cash',
        notes: 'Test invoice'
      };

      const response = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoiceData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Invoice created successfully');
      expect(response.body.data.invoice.customerName).toBe(invoiceData.customerName);
      expect(response.body.data.invoice.grandTotal).toBe(invoiceData.grandTotal);
      expect(response.body.data.invoice.invoiceNo).toMatch(/^INV-\d{6}-\d{4}$/);

      // Verify invoice was created in database
      const invoice = await Invoice.findById(response.body.data.invoice._id);
      expect(invoice).toBeTruthy();
      expect(invoice.customerName).toBe(invoiceData.customerName);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
          items: []
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('should validate items array is not empty', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerName: 'Test Customer',
          items: [] // Empty items array
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('should check customer credit limit', async () => {
      // Create customer with low credit limit
      const lowCreditCustomer = await Customer.create({
        name: 'Low Credit Customer',
        phone: '01812345678',
        creditLimit: 500,
        totalDue: 400 // Already has due amount
      });

      const invoiceData = {
        customerName: lowCreditCustomer.name,
        customerPhone: lowCreditCustomer.phone,
        items: [{
          productName: testProduct.name,
          quantity: 10,
          unit: testProduct.unit,
          unitPrice: testProduct.sellingPrice,
          totalPrice: 800
        }],
        subtotal: 800,
        grandTotal: 800,
        paidAmount: 0,
        dueAmount: 800,
        status: 'due'
      };

      const response = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoiceData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('credit limit');
    });

    test('should allow owner override for credit limit', async () => {
      // Create customer with low credit limit
      const lowCreditCustomer = await Customer.create({
        name: 'Low Credit Customer',
        phone: '01812345678',
        creditLimit: 500,
        totalDue: 400
      });

      const invoiceData = {
        customerName: lowCreditCustomer.name,
        customerPhone: lowCreditCustomer.phone,
        items: [{
          productName: testProduct.name,
          quantity: 10,
          unit: testProduct.unit,
          unitPrice: testProduct.sellingPrice,
          totalPrice: 800
        }],
        subtotal: 800,
        grandTotal: 800,
        paidAmount: 0,
        dueAmount: 800,
        status: 'due',
        ownerOverride: true // Owner override
      };

      const response = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoiceData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.invoice.customerName).toBe(lowCreditCustomer.name);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .send({
          customerName: 'Test Customer',
          items: [{
            productName: 'Glass',
            quantity: 10,
            unit: 'SFT',
            unitPrice: 80,
            totalPrice: 800
          }]
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });
  });

  describe('GET /api/invoices', () => {
    beforeEach(async () => {
      // Create test invoices
      await Invoice.create({
        customerName: 'Customer 1',
        items: [{
          productName: 'Glass 1',
          quantity: 10,
          unit: 'SFT',
          unitPrice: 80,
          totalPrice: 800
        }],
        subtotal: 800,
        grandTotal: 800,
        status: 'paid',
        createdBy: testUser._id
      });

      await Invoice.create({
        customerName: 'Customer 2',
        items: [{
          productName: 'Glass 2',
          quantity: 5,
          unit: 'SFT',
          unitPrice: 100,
          totalPrice: 500
        }],
        subtotal: 500,
        grandTotal: 500,
        status: 'due',
        createdBy: testUser._id
      });
    });

    test('should get all invoices', async () => {
      const response = await request(app)
        .get('/api/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].customerName).toBeDefined();
      expect(response.body.data[0].grandTotal).toBeDefined();
    });

    test('should filter invoices by status', async () => {
      const response = await request(app)
        .get('/api/invoices?status=paid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('paid');
    });

    test('should search invoices by customer name', async () => {
      const response = await request(app)
        .get('/api/invoices?search=Customer 1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].customerName).toBe('Customer 1');
    });

    test('should paginate results', async () => {
      const response = await request(app)
        .get('/api/invoices?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.totalPages).toBe(2);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/invoices')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });
  });

  describe('GET /api/invoices/:id', () => {
    let testInvoice;

    beforeEach(async () => {
      testInvoice = await Invoice.create({
        customerName: 'Test Customer',
        items: [{
          productName: 'Test Glass',
          quantity: 10,
          unit: 'SFT',
          unitPrice: 80,
          totalPrice: 800
        }],
        subtotal: 800,
        grandTotal: 800,
        status: 'paid',
        createdBy: testUser._id
      });
    });

    test('should get invoice by ID', async () => {
      const response = await request(app)
        .get(`/api/invoices/${testInvoice._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testInvoice._id.toString());
      expect(response.body.data.customerName).toBe(testInvoice.customerName);
    });

    test('should return 404 for non-existent invoice', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/invoices/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invoice not found');
    });

    test('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/invoices/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid invoice ID');
    });
  });

  describe('PUT /api/invoices/:id', () => {
    let testInvoice;

    beforeEach(async () => {
      testInvoice = await Invoice.create({
        customerName: 'Test Customer',
        items: [{
          productName: 'Test Glass',
          quantity: 10,
          unit: 'SFT',
          unitPrice: 80,
          totalPrice: 800
        }],
        subtotal: 800,
        grandTotal: 800,
        status: 'due',
        createdBy: testUser._id
      });
    });

    test('should update invoice successfully', async () => {
      const updateData = {
        customerName: 'Updated Customer',
        notes: 'Updated notes'
      };

      const response = await request(app)
        .put(`/api/invoices/${testInvoice._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.customerName).toBe(updateData.customerName);
      expect(response.body.data.notes).toBe(updateData.notes);

      // Verify update in database
      const updatedInvoice = await Invoice.findById(testInvoice._id);
      expect(updatedInvoice.customerName).toBe(updateData.customerName);
    });

    test('should not allow updating paid invoices', async () => {
      // Update invoice to paid status
      testInvoice.status = 'paid';
      await testInvoice.save();

      const response = await request(app)
        .put(`/api/invoices/${testInvoice._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerName: 'Updated Customer'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot update paid invoice');
    });
  });

  describe('DELETE /api/invoices/:id', () => {
    let testInvoice;

    beforeEach(async () => {
      testInvoice = await Invoice.create({
        customerName: 'Test Customer',
        items: [{
          productName: 'Test Glass',
          quantity: 10,
          unit: 'SFT',
          unitPrice: 80,
          totalPrice: 800
        }],
        subtotal: 800,
        grandTotal: 800,
        status: 'due',
        createdBy: testUser._id
      });
    });

    test('should delete invoice successfully (owner only)', async () => {
      const response = await request(app)
        .delete(`/api/invoices/${testInvoice._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Invoice deleted successfully');

      // Verify deletion in database
      const deletedInvoice = await Invoice.findById(testInvoice._id);
      expect(deletedInvoice).toBeNull();
    });

    test('should not allow non-owners to delete invoices', async () => {
      // Create manager user
      const { token: managerToken } = await global.testUtils.createTestUser({
        name: 'Manager',
        email: 'manager@example.com',
        role: 'manager'
      });

      const response = await request(app)
        .delete(`/api/invoices/${testInvoice._id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    test('should not delete paid invoices', async () => {
      // Update invoice to paid status
      testInvoice.status = 'paid';
      await testInvoice.save();

      const response = await request(app)
        .delete(`/api/invoices/${testInvoice._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot delete paid invoice');
    });
  });

  describe('POST /api/invoices/:id/payment', () => {
    let testInvoice;

    beforeEach(async () => {
      testInvoice = await Invoice.create({
        customerName: 'Test Customer',
        items: [{
          productName: 'Test Glass',
          quantity: 10,
          unit: 'SFT',
          unitPrice: 80,
          totalPrice: 800
        }],
        subtotal: 800,
        grandTotal: 800,
        paidAmount: 0,
        dueAmount: 800,
        status: 'due',
        createdBy: testUser._id
      });
    });

    test('should record partial payment', async () => {
      const paymentData = {
        amount: 400,
        paymentMethod: 'cash',
        notes: 'Partial payment'
      };

      const response = await request(app)
        .post(`/api/invoices/${testInvoice._id}/payment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paidAmount).toBe(400);
      expect(response.body.data.dueAmount).toBe(400);
      expect(response.body.data.status).toBe('partial');
    });

    test('should record full payment', async () => {
      const paymentData = {
        amount: 800,
        paymentMethod: 'cash'
      };

      const response = await request(app)
        .post(`/api/invoices/${testInvoice._id}/payment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paidAmount).toBe(800);
      expect(response.body.data.dueAmount).toBe(0);
      expect(response.body.data.status).toBe('paid');
    });

    test('should not allow overpayment', async () => {
      const paymentData = {
        amount: 1000, // More than due amount
        paymentMethod: 'cash'
      };

      const response = await request(app)
        .post(`/api/invoices/${testInvoice._id}/payment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('exceeds due amount');
    });

    test('should validate payment amount', async () => {
      const paymentData = {
        amount: -100, // Negative amount
        paymentMethod: 'cash'
      };

      const response = await request(app)
        .post(`/api/invoices/${testInvoice._id}/payment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/invoices/stats', () => {
    beforeEach(async () => {
      // Create invoices with different statuses
      await Invoice.create({
        customerName: 'Customer 1',
        items: [{ productName: 'Glass', quantity: 10, unit: 'SFT', unitPrice: 80, totalPrice: 800 }],
        subtotal: 800,
        grandTotal: 800,
        status: 'paid',
        createdBy: testUser._id
      });

      await Invoice.create({
        customerName: 'Customer 2',
        items: [{ productName: 'Glass', quantity: 5, unit: 'SFT', unitPrice: 100, totalPrice: 500 }],
        subtotal: 500,
        grandTotal: 500,
        status: 'due',
        createdBy: testUser._id
      });

      await Invoice.create({
        customerName: 'Customer 3',
        items: [{ productName: 'Glass', quantity: 8, unit: 'SFT', unitPrice: 90, totalPrice: 720 }],
        subtotal: 720,
        grandTotal: 720,
        paidAmount: 300,
        dueAmount: 420,
        status: 'partial',
        createdBy: testUser._id
      });
    });

    test('should get invoice statistics', async () => {
      const response = await request(app)
        .get('/api/invoices/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalInvoices).toBe(3);
      expect(response.body.data.totalSales).toBe(2020);
      expect(response.body.data.totalPaid).toBe(1100);
      expect(response.body.data.totalDue).toBe(920);
      expect(response.body.data.statusBreakdown.paid).toBe(1);
      expect(response.body.data.statusBreakdown.partial).toBe(1);
      expect(response.body.data.statusBreakdown.due).toBe(1);
    });

    test('should filter stats by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app)
        .get(`/api/invoices/stats?startDate=${today}&endDate=${today}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalInvoices).toBe(3);
    });
  });
});