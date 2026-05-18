const Invoice = require('../../../../backend/src/models/Invoice.js').default;

describe('Invoice Model', () => {
  describe('Validation', () => {
    test('should create a valid invoice', async () => {
      const invoiceData = {
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
        discountAmount: 0,
        grandTotal: 800,
        paidAmount: 400,
        dueAmount: 400,
        status: 'partial',
        paymentMethod: 'cash'
      };

      const invoice = new Invoice(invoiceData);
      const savedInvoice = await invoice.save();

      expect(savedInvoice._id).toBeDefined();
      expect(savedInvoice.invoiceNo).toMatch(/^INV-\d{6}-\d{4}$/);
      expect(savedInvoice.customerName).toBe(invoiceData.customerName);
      expect(savedInvoice.grandTotal).toBe(invoiceData.grandTotal);
      expect(savedInvoice.status).toBe(invoiceData.status);
    });

    test('should require customer name', async () => {
      const invoice = new Invoice({
        items: [{
          productName: 'Clear Glass',
          quantity: 10,
          unit: 'SFT',
          unitPrice: 80,
          totalPrice: 800
        }],
        subtotal: 800,
        grandTotal: 800
      });

      await expect(invoice.save()).rejects.toThrow('Path `customerName` is required');
    });

    test('should require at least one item', async () => {
      const invoice = new Invoice({
        customerName: 'John Doe',
        items: [], // Empty items array
        subtotal: 0,
        grandTotal: 0
      });

      await expect(invoice.save()).rejects.toThrow();
    });

    test('should validate status enum values', async () => {
      const invoice = new Invoice({
        customerName: 'John Doe',
        items: [{
          productName: 'Clear Glass',
          quantity: 10,
          unit: 'SFT',
          unitPrice: 80,
          totalPrice: 800
        }],
        subtotal: 800,
        grandTotal: 800,
        status: 'invalid-status' // Invalid enum value
      });

      await expect(invoice.save()).rejects.toThrow();
    });

    test('should validate payment method enum values', async () => {
      const invoice = new Invoice({
        customerName: 'John Doe',
        items: [{
          productName: 'Clear Glass',
          quantity: 10,
          unit: 'SFT',
          unitPrice: 80,
          totalPrice: 800
        }],
        subtotal: 800,
        grandTotal: 800,
        paymentMethod: 'invalid-method' // Invalid enum value
      });

      await expect(invoice.save()).rejects.toThrow();
    });
  });

  describe('Virtual Fields', () => {
    test('should calculate total items correctly', async () => {
      const invoice = new Invoice({
        customerName: 'John Doe',
        items: [
          {
            productName: 'Clear Glass',
            quantity: 10,
            unit: 'SFT',
            unitPrice: 80,
            totalPrice: 800
          },
          {
            productName: 'Tinted Glass',
            quantity: 5,
            unit: 'SFT',
            unitPrice: 100,
            totalPrice: 500
          }
        ],
        subtotal: 1300,
        grandTotal: 1300
      });

      expect(invoice.totalItems).toBe(2);
    });

    test('should calculate total quantity correctly', async () => {
      const invoice = new Invoice({
        customerName: 'John Doe',
        items: [
          {
            productName: 'Clear Glass',
            quantity: 10,
            unit: 'SFT',
            unitPrice: 80,
            totalPrice: 800
          },
          {
            productName: 'Tinted Glass',
            quantity: 5,
            unit: 'SFT',
            unitPrice: 100,
            totalPrice: 500
          }
        ],
        subtotal: 1300,
        grandTotal: 1300
      });

      expect(invoice.totalQuantity).toBe(15);
    });

    test('should determine if invoice is paid', async () => {
      const paidInvoice = new Invoice({
        customerName: 'John Doe',
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
        status: 'paid'
      });

      expect(paidInvoice.isPaid).toBe(true);

      const unpaidInvoice = new Invoice({
        customerName: 'Jane Doe',
        items: [{
          productName: 'Clear Glass',
          quantity: 10,
          unit: 'SFT',
          unitPrice: 80,
          totalPrice: 800
        }],
        subtotal: 800,
        grandTotal: 800,
        paidAmount: 0,
        dueAmount: 800,
        status: 'due'
      });

      expect(unpaidInvoice.isPaid).toBe(false);
    });
  });

  describe('Static Methods', () => {
    test('should generate unique invoice number', async () => {
      const invoiceNo1 = await Invoice.generateInvoiceNumber();
      const invoiceNo2 = await Invoice.generateInvoiceNumber();

      expect(invoiceNo1).toMatch(/^INV-\d{6}-\d{4}$/);
      expect(invoiceNo2).toMatch(/^INV-\d{6}-\d{4}$/);
      expect(invoiceNo1).not.toBe(invoiceNo2);
    });

    test('should find invoices by status', async () => {
      // Create test invoices with different statuses
      await Invoice.create({
        customerName: 'Customer 1',
        items: [{
          productName: 'Glass',
          quantity: 10,
          unit: 'SFT',
          unitPrice: 80,
          totalPrice: 800
        }],
        subtotal: 800,
        grandTotal: 800,
        status: 'paid'
      });

      await Invoice.create({
        customerName: 'Customer 2',
        items: [{
          productName: 'Glass',
          quantity: 5,
          unit: 'SFT',
          unitPrice: 80,
          totalPrice: 400
        }],
        subtotal: 400,
        grandTotal: 400,
        status: 'due'
      });

      const paidInvoices = await Invoice.findByStatus('paid');
      const dueInvoices = await Invoice.findByStatus('due');

      expect(paidInvoices).toHaveLength(1);
      expect(dueInvoices).toHaveLength(1);
      expect(paidInvoices[0].customerName).toBe('Customer 1');
      expect(dueInvoices[0].customerName).toBe('Customer 2');
    });

    test('should calculate total sales for date range', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Create invoices for different dates
      await Invoice.create({
        customerName: 'Customer 1',
        items: [{
          productName: 'Glass',
          quantity: 10,
          unit: 'SFT',
          unitPrice: 80,
          totalPrice: 800
        }],
        subtotal: 800,
        grandTotal: 800,
        createdAt: today
      });

      await Invoice.create({
        customerName: 'Customer 2',
        items: [{
          productName: 'Glass',
          quantity: 5,
          unit: 'SFT',
          unitPrice: 80,
          totalPrice: 400
        }],
        subtotal: 400,
        grandTotal: 400,
        createdAt: yesterday
      });

      const totalSales = await Invoice.getTotalSales(yesterday, today);
      expect(totalSales).toBe(1200);
    });
  });

  describe('Instance Methods', () => {
    test('should calculate totals correctly', async () => {
      const invoice = new Invoice({
        customerName: 'John Doe',
        items: [
          {
            productName: 'Clear Glass',
            quantity: 10,
            unit: 'SFT',
            unitPrice: 80,
            totalPrice: 800
          },
          {
            productName: 'Tinted Glass',
            quantity: 5,
            unit: 'SFT',
            unitPrice: 100,
            totalPrice: 500
          }
        ]
      });

      invoice.calculateTotals();

      expect(invoice.subtotal).toBe(1300);
      expect(invoice.grandTotal).toBe(1300);
    });

    test('should apply discount correctly', async () => {
      const invoice = new Invoice({
        customerName: 'John Doe',
        items: [{
          productName: 'Clear Glass',
          quantity: 10,
          unit: 'SFT',
          unitPrice: 80,
          totalPrice: 800
        }],
        subtotal: 800
      });

      invoice.applyDiscount(100);
      expect(invoice.discountAmount).toBe(100);
      expect(invoice.grandTotal).toBe(700);
    });

    test('should record payment correctly', async () => {
      const invoice = await Invoice.create({
        customerName: 'John Doe',
        items: [{
          productName: 'Clear Glass',
          quantity: 10,
          unit: 'SFT',
          unitPrice: 80,
          totalPrice: 800
        }],
        subtotal: 800,
        grandTotal: 800,
        paidAmount: 0,
        dueAmount: 800,
        status: 'due'
      });

      await invoice.recordPayment(400);

      expect(invoice.paidAmount).toBe(400);
      expect(invoice.dueAmount).toBe(400);
      expect(invoice.status).toBe('partial');
    });

    test('should mark as paid when full payment received', async () => {
      const invoice = await Invoice.create({
        customerName: 'John Doe',
        items: [{
          productName: 'Clear Glass',
          quantity: 10,
          unit: 'SFT',
          unitPrice: 80,
          totalPrice: 800
        }],
        subtotal: 800,
        grandTotal: 800,
        paidAmount: 0,
        dueAmount: 800,
        status: 'due'
      });

      await invoice.recordPayment(800);

      expect(invoice.paidAmount).toBe(800);
      expect(invoice.dueAmount).toBe(0);
      expect(invoice.status).toBe('paid');
    });
  });

  describe('Middleware', () => {
    test('should generate invoice number before saving', async () => {
      const invoice = new Invoice({
        customerName: 'John Doe',
        items: [{
          productName: 'Clear Glass',
          quantity: 10,
          unit: 'SFT',
          unitPrice: 80,
          totalPrice: 800
        }],
        subtotal: 800,
        grandTotal: 800
      });

      const savedInvoice = await invoice.save();
      expect(savedInvoice.invoiceNo).toMatch(/^INV-\d{6}-\d{4}$/);
    });

    test('should calculate totals before saving', async () => {
      const invoice = new Invoice({
        customerName: 'John Doe',
        items: [{
          productName: 'Clear Glass',
          quantity: 10,
          unit: 'SFT',
          unitPrice: 80,
          totalPrice: 800
        }]
      });

      const savedInvoice = await invoice.save();
      expect(savedInvoice.subtotal).toBe(800);
      expect(savedInvoice.grandTotal).toBe(800);
      expect(savedInvoice.dueAmount).toBe(800);
    });

    test('should set default values', async () => {
      const invoice = new Invoice({
        customerName: 'John Doe',
        items: [{
          productName: 'Clear Glass',
          quantity: 10,
          unit: 'SFT',
          unitPrice: 80,
          totalPrice: 800
        }],
        subtotal: 800,
        grandTotal: 800
      });

      const savedInvoice = await invoice.save();
      expect(savedInvoice.discountAmount).toBe(0);
      expect(savedInvoice.paidAmount).toBe(0);
      expect(savedInvoice.status).toBe('due');
      expect(savedInvoice.paymentMethod).toBe('cash');
    });
  });
});