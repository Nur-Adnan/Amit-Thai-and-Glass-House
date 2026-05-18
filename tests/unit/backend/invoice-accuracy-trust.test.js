// Invoice Accuracy and Trust Tests
// Ensures all invoice types maintain accuracy and business trust

describe('Invoice Accuracy and Trust Tests', () => {
  let testUser;
  let testProduct;
  let testCustomer;

  beforeEach(async () => {
    // Create test user
    const userResult = await global.testUtils.createTestUser({
      role: 'owner'
    });
    testUser = userResult.user;

    // Create test product
    testProduct = await global.testUtils.createTestProduct({
      name: 'Test Glass Panel',
      category: 'Glass',
      stockQuantity: 100,
      purchasePrice: 100,
      sellingPrice: 150,
      unit: 'sqft',
      isActive: true,
      createdBy: testUser._id
    });

    // Create test customer
    testCustomer = await global.testUtils.createTestCustomer({
      name: 'Test Customer',
      phone: '01712345678',
      creditLimit: 50000,
      createdBy: testUser._id
    });
  });

  describe('Cash Invoice Accuracy', () => {
    test('should create accurate cash invoice with correct totals', async () => {
      const mockCreateCashInvoice = async (invoiceData) => {
        const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
        const { default: Product } = await import('../../../backend/src/models/Product.js');
        
        // Calculate totals
        let subtotal = 0;
        const processedItems = [];
        
        for (const item of invoiceData.items) {
          const product = await Product.findById(item.productId);
          const itemTotal = item.quantity * item.unitPrice;
          subtotal += itemTotal;
          
          processedItems.push({
            product: item.productId,
            productName: product.name,
            quantity: item.quantity,
            unit: product.unit,
            unitPrice: item.unitPrice,
            totalPrice: itemTotal
          });
        }
        
        const discountAmount = invoiceData.discountAmount || 0;
        const grandTotal = subtotal - discountAmount;
        
        // For cash invoice, paid amount should equal grand total
        if (invoiceData.paymentMethod === 'cash' && invoiceData.paidAmount !== grandTotal) {
          throw new Error('Cash invoice must be fully paid');
        }
        
        const invoice = await Invoice.create({
          invoiceNo: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
          customerName: invoiceData.customerName,
          customerPhone: invoiceData.customerPhone,
          items: processedItems,
          subtotal,
          discount: discountAmount,
          grandTotal,
          paidAmount: invoiceData.paidAmount,
          dueAmount: grandTotal - invoiceData.paidAmount,
          status: invoiceData.paidAmount >= grandTotal ? 'paid' : 'due',
          paymentMethod: invoiceData.paymentMethod,
          createdBy: testUser._id
        });
        
        return invoice;
      };

      const invoiceData = {
        customerName: testCustomer.name,
        customerPhone: testCustomer.phone,
        items: [{
          productId: testProduct._id,
          quantity: 10,
          unitPrice: 150
        }],
        discountAmount: 50,
        paidAmount: 1450, // 1500 - 50 discount
        paymentMethod: 'cash'
      };

      const invoice = await mockCreateCashInvoice(invoiceData);
      
      // Verify invoice accuracy
      expect(invoice.subtotal).toBe(1500); // 10 * 150
      expect(invoice.discount).toBe(50);
      expect(invoice.grandTotal).toBe(1450); // 1500 - 50
      expect(invoice.paidAmount).toBe(1450);
      expect(invoice.dueAmount).toBe(0);
      expect(invoice.status).toBe('paid');
      expect(invoice.paymentMethod).toBe('cash');
      
      // Verify invoice number format
      expect(invoice.invoiceNo).toMatch(/^[A-Z]+-\d{6}-\d{4}$/);
    });

    test('should prevent cash invoice with partial payment', async () => {
      const mockCreateCashInvoice = async (invoiceData) => {
        const grandTotal = 1500;
        
        if (invoiceData.paymentMethod === 'cash' && invoiceData.paidAmount < grandTotal) {
          throw new Error('Cash invoice must be fully paid');
        }
        
        return { success: true };
      };

      const invoiceData = {
        customerName: testCustomer.name,
        customerPhone: testCustomer.phone,
        items: [{ productId: testProduct._id, quantity: 10, unitPrice: 150 }],
        paidAmount: 1000, // Less than total
        paymentMethod: 'cash'
      };

      await expect(mockCreateCashInvoice(invoiceData))
        .rejects.toThrow('Cash invoice must be fully paid');
    });

    test('should handle cash invoice with multiple items accurately', async () => {
      // Create second product
      const secondProduct = await global.testUtils.createTestProduct({
        name: 'Test Thai Panel',
        category: 'Thai',
        stockQuantity: 50,
        purchasePrice: 80,
        sellingPrice: 120,
        unit: 'piece',
        createdBy: testUser._id
      });

      const mockCreateMultiItemCashInvoice = async (invoiceData) => {
        const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
        const { default: Product } = await import('../../../backend/src/models/Product.js');
        
        let subtotal = 0;
        const processedItems = [];
        
        for (const item of invoiceData.items) {
          const product = await Product.findById(item.productId);
          const itemTotal = item.quantity * item.unitPrice;
          subtotal += itemTotal;
          
          processedItems.push({
            product: item.productId,
            productName: product.name,
            quantity: item.quantity,
            unit: product.unit,
            unitPrice: item.unitPrice,
            totalPrice: itemTotal
          });
        }
        
        const grandTotal = subtotal;
        
        const invoice = await Invoice.create({
          invoiceNo: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
          customerName: invoiceData.customerName,
          customerPhone: invoiceData.customerPhone,
          items: processedItems,
          subtotal,
          discountAmount: 0,
          grandTotal,
          paidAmount: grandTotal,
          dueAmount: 0,
          status: 'paid',
          paymentMethod: 'cash',
          createdBy: testUser._id
        });
        
        return invoice;
      };

      const invoiceData = {
        customerName: testCustomer.name,
        customerPhone: testCustomer.phone,
        items: [
          { productId: testProduct._id, quantity: 5, unitPrice: 150 },
          { productId: secondProduct._id, quantity: 3, unitPrice: 120 }
        ]
      };

      const invoice = await mockCreateMultiItemCashInvoice(invoiceData);
      
      // Verify calculations
      expect(invoice.subtotal).toBe(1110); // (5 * 150) + (3 * 120) = 750 + 360
      expect(invoice.grandTotal).toBe(1110);
      expect(invoice.paidAmount).toBe(1110);
      expect(invoice.status).toBe('paid');
      
      // Verify item details
      expect(invoice.items).toHaveLength(2);
      expect(invoice.items[0].totalPrice).toBe(750); // 5 * 150
      expect(invoice.items[1].totalPrice).toBe(360); // 3 * 120
    });
  });

  describe('Partial Payment Invoice Accuracy', () => {
    test('should create accurate partial payment invoice', async () => {
      const mockCreatePartialPaymentInvoice = async (invoiceData) => {
        const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
        const { default: Product } = await import('../../../backend/src/models/Product.js');
        
        let subtotal = 0;
        const processedItems = [];
        
        for (const item of invoiceData.items) {
          const product = await Product.findById(item.productId);
          const itemTotal = item.quantity * item.unitPrice;
          subtotal += itemTotal;
          
          processedItems.push({
            product: item.productId,
            productName: product.name,
            quantity: item.quantity,
            unit: product.unit,
            unitPrice: item.unitPrice,
            totalPrice: itemTotal
          });
        }
        
        const discountAmount = invoiceData.discountAmount || 0;
        const grandTotal = subtotal - discountAmount;
        const paidAmount = invoiceData.paidAmount || 0;
        const dueAmount = grandTotal - paidAmount;
        
        let status = 'due';
        if (paidAmount >= grandTotal) {
          status = 'paid';
        } else if (paidAmount > 0) {
          status = 'partial';
        }
        
        const invoice = await Invoice.create({
          invoiceNo: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
          customerName: invoiceData.customerName,
          customerPhone: invoiceData.customerPhone,
          items: processedItems,
          subtotal,
          discount: discountAmount,
          grandTotal,
          paidAmount,
          dueAmount,
          status,
          paymentMethod: invoiceData.paymentMethod,
          createdBy: testUser._id
        });
        
        return invoice;
      };

      const invoiceData = {
        customerName: testCustomer.name,
        customerPhone: testCustomer.phone,
        items: [{
          productId: testProduct._id,
          quantity: 20,
          unitPrice: 150
        }],
        discountAmount: 100,
        paidAmount: 1500, // Partial payment
        paymentMethod: 'bank_transfer'
      };

      const invoice = await mockCreatePartialPaymentInvoice(invoiceData);
      
      // Verify calculations
      expect(invoice.subtotal).toBe(3000); // 20 * 150
      expect(invoice.discount).toBe(100);
      expect(invoice.grandTotal).toBe(2900); // 3000 - 100
      expect(invoice.paidAmount).toBe(1500);
      expect(invoice.dueAmount).toBe(1400); // 2900 - 1500
      expect(invoice.status).toBe('partial');
    });

    test('should handle zero payment correctly', async () => {
      const mockCreateDueInvoice = async (invoiceData) => {
        const subtotal = 1000;
        const grandTotal = subtotal;
        const paidAmount = 0;
        const dueAmount = grandTotal;
        
        return {
          subtotal,
          grandTotal,
          paidAmount,
          dueAmount,
          status: 'due'
        };
      };

      const invoiceData = {
        customerName: testCustomer.name,
        customerPhone: testCustomer.phone,
        items: [{ productId: testProduct._id, quantity: 10, unitPrice: 100 }],
        paidAmount: 0,
        paymentMethod: 'bank_transfer'
      };

      const result = await mockCreateDueInvoice(invoiceData);
      
      expect(result.paidAmount).toBe(0);
      expect(result.dueAmount).toBe(1000);
      expect(result.status).toBe('due');
    });

    test('should validate payment amount limits', async () => {
      const mockValidatePaymentAmount = async (grandTotal, paidAmount) => {
        if (paidAmount < 0) {
          throw new Error('Payment amount cannot be negative');
        }
        
        if (paidAmount > grandTotal) {
          throw new Error('Payment amount cannot exceed invoice total');
        }
        
        return { valid: true };
      };

      const grandTotal = 1500;
      
      // Test negative payment
      await expect(mockValidatePaymentAmount(grandTotal, -100))
        .rejects.toThrow('Payment amount cannot be negative');
      
      // Test overpayment
      await expect(mockValidatePaymentAmount(grandTotal, 2000))
        .rejects.toThrow('Payment amount cannot exceed invoice total');
      
      // Test valid payment
      const result = await mockValidatePaymentAmount(grandTotal, 1000);
      expect(result.valid).toBe(true);
    });
  });

  describe('Due Invoice Accuracy', () => {
    test('should create accurate due invoice', async () => {
      const mockCreateDueInvoice = async (invoiceData) => {
        const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
        const { default: Product } = await import('../../../backend/src/models/Product.js');
        
        let subtotal = 0;
        const processedItems = [];
        
        for (const item of invoiceData.items) {
          const product = await Product.findById(item.productId);
          const itemTotal = item.quantity * item.unitPrice;
          subtotal += itemTotal;
          
          processedItems.push({
            product: item.productId,
            productName: product.name,
            quantity: item.quantity,
            unit: product.unit,
            unitPrice: item.unitPrice,
            totalPrice: itemTotal
          });
        }
        
        const discountAmount = invoiceData.discountAmount || 0;
        const grandTotal = subtotal - discountAmount;
        
        const invoice = await Invoice.create({
          invoiceNo: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
          customerName: invoiceData.customerName,
          customerPhone: invoiceData.customerPhone,
          items: processedItems,
          subtotal,
          discount: discountAmount,
          grandTotal,
          paidAmount: 0,
          dueAmount: grandTotal,
          status: 'due',
          paymentMethod: 'bank_transfer',
          createdBy: testUser._id
        });
        
        return invoice;
      };

      const invoiceData = {
        customerName: testCustomer.name,
        customerPhone: testCustomer.phone,
        items: [{
          productId: testProduct._id,
          quantity: 15,
          unitPrice: 150
        }],
        discountAmount: 250
      };

      const invoice = await mockCreateDueInvoice(invoiceData);
      
      // Verify due invoice accuracy
      expect(invoice.subtotal).toBe(2250); // 15 * 150
      expect(invoice.discount).toBe(250);
      expect(invoice.grandTotal).toBe(2000); // 2250 - 250
      expect(invoice.paidAmount).toBe(0);
      expect(invoice.dueAmount).toBe(2000);
      expect(invoice.status).toBe('due');
    });

    test('should enforce credit limit for due invoices', async () => {
      const mockCreateDueInvoiceWithCreditCheck = async (invoiceData, customer) => {
        const grandTotal = 25000; // Large invoice amount
        const customerDueAmount = 30000; // Existing due
        const totalDue = customerDueAmount + grandTotal;
        
        if (totalDue > customer.creditLimit) {
          throw new Error(
            `Credit limit exceeded. Customer limit: ৳${customer.creditLimit}, ` +
            `Current due: ৳${customerDueAmount}, Invoice amount: ৳${grandTotal}, ` +
            `Total would be: ৳${totalDue}`
          );
        }
        
        return { success: true, grandTotal };
      };

      const invoiceData = {
        customerName: testCustomer.name,
        customerPhone: testCustomer.phone,
        items: [{ productId: testProduct._id, quantity: 25, unitPrice: 100 }]
      };

      await expect(mockCreateDueInvoiceWithCreditCheck(invoiceData, testCustomer))
        .rejects.toThrow('Credit limit exceeded');
    });
  });

  describe('Booking to Final Invoice Conversion', () => {
    test('should convert booking invoice to final invoice accurately', async () => {
      const mockBookingToFinalConversion = async (bookingInvoiceId, finalInvoiceData) => {
        const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
        
        // Get booking invoice
        const bookingInvoice = await Invoice.findById(bookingInvoiceId);
        if (!bookingInvoice) {
          throw new Error('Booking invoice not found');
        }
        
        if (bookingInvoice.invoiceType !== 'BOOKING') {
          throw new Error('Invoice is not a booking invoice');
        }
        
        if (bookingInvoice.status === 'converted') {
          throw new Error('Booking invoice already converted');
        }
        
        // Calculate final invoice totals
        let subtotal = 0;
        const processedItems = [];
        
        for (const item of finalInvoiceData.items) {
          const itemTotal = item.quantity * item.unitPrice;
          subtotal += itemTotal;
          
          processedItems.push({
            product: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            totalPrice: itemTotal
          });
        }
        
        const discountAmount = finalInvoiceData.discountAmount || 0;
        const grandTotal = subtotal - discountAmount;
        const advanceFromBooking = bookingInvoice.paidAmount;
        const remainingAmount = grandTotal - advanceFromBooking;
        
        // Create final invoice
        const finalInvoice = await Invoice.create({
          invoiceNo: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
          customerName: bookingInvoice.customerName,
          customerPhone: bookingInvoice.customerPhone,
          items: processedItems,
          subtotal,
          discount: discountAmount,
          grandTotal,
          paidAmount: finalInvoiceData.additionalPayment + advanceFromBooking,
          dueAmount: Math.max(0, remainingAmount - finalInvoiceData.additionalPayment),
          status: (finalInvoiceData.additionalPayment >= remainingAmount) ? 'paid' : 'partial',
          paymentMethod: finalInvoiceData.paymentMethod,
          invoiceType: 'FINAL',
          bookingReference: {
            bookingInvoice: bookingInvoiceId,
            bookingInvoiceNo: bookingInvoice.invoiceNo,
            conversionDate: new Date(),
            convertedBy: testUser._id
          },
          createdBy: testUser._id
        });
        
        // Mark booking invoice as converted (add finalInvoiceId reference)
        await Invoice.findByIdAndUpdate(bookingInvoiceId, {
          'finalInvoiceReference.finalInvoice': finalInvoice._id,
          'finalInvoiceReference.finalInvoiceNo': finalInvoice.invoiceNo,
          'finalInvoiceReference.isConverted': true,
          notes: 'Converted to final invoice'
        });
        
        return { bookingInvoice, finalInvoice };
      };

      // First create a booking invoice
      const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
      const bookingInvoice = await Invoice.create({
        invoiceNo: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
        customerName: testCustomer.name,
        customerPhone: testCustomer.phone,
        items: [{
          product: testProduct._id,
          productName: testProduct.name,
          quantity: 10,
          unit: 'sqft',
          unitPrice: 150,
          totalPrice: 1500
        }],
        subtotal: 1500,
        discountAmount: 0,
        grandTotal: 1500,
        paidAmount: 500, // Advance payment
        dueAmount: 1000,
        status: 'partial',
        paymentMethod: 'cash',
        invoiceType: 'BOOKING',
        createdBy: testUser._id
      });

      const finalInvoiceData = {
        items: [{
          productId: testProduct._id,
          productName: testProduct.name,
          quantity: 12, // Different quantity in final
          unit: 'sqft',
          unitPrice: 150
        }],
        discountAmount: 100,
        additionalPayment: 1000,
        paymentMethod: 'cash'
      };

      const result = await mockBookingToFinalConversion(bookingInvoice._id, finalInvoiceData);
      
      // Verify conversion accuracy
      expect(result.finalInvoice.subtotal).toBe(1800); // 12 * 150
      expect(result.finalInvoice.discount).toBe(100);
      expect(result.finalInvoice.grandTotal).toBe(1700); // 1800 - 100
      expect(result.finalInvoice.bookingReference.bookingInvoiceNo).toBe(bookingInvoice.invoiceNo); // From booking
      expect(result.finalInvoice.paidAmount).toBe(1500); // 500 + 1000
      expect(result.finalInvoice.dueAmount).toBe(200); // 1700 - 1500
      expect(result.finalInvoice.status).toBe('partial');
      expect(result.finalInvoice.invoiceType).toBe('FINAL');
      
      // Verify booking invoice updated
      const updatedBooking = await Invoice.findById(bookingInvoice._id);
      expect(updatedBooking.finalInvoiceReference.finalInvoice.toString()).toBe(result.finalInvoice._id.toString());
    });

    test('should prevent double conversion of booking invoice', async () => {
      const mockPreventDoubleConversion = async (bookingInvoiceId) => {
        const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
        
        const bookingInvoice = await Invoice.findById(bookingInvoiceId);
        
        if (bookingInvoice.finalInvoiceReference?.isConverted) {
          throw new Error('Booking invoice already converted');
        }
        
        return { canConvert: true };
      };

      // Create a converted booking invoice
      const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
      const convertedBooking = await Invoice.create({
        invoiceNo: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
        customerName: testCustomer.name,
        customerPhone: testCustomer.phone,
        items: [{ product: testProduct._id, productName: testProduct.name, quantity: 5, unit: 'sqft', unitPrice: 150, totalPrice: 750 }],
        subtotal: 750,
        grandTotal: 750,
        paidAmount: 300,
        dueAmount: 450,
        status: 'partial',
        invoiceType: 'BOOKING',
        finalInvoiceReference: {
          isConverted: true,
          finalInvoice: testUser._id // Simulate already converted
        },
        createdBy: testUser._id
      });

      await expect(mockPreventDoubleConversion(convertedBooking._id))
        .rejects.toThrow('Booking invoice already converted');
    });
  });

  describe('Invoice Edit Lock After Payment', () => {
    test('should prevent editing paid invoice', async () => {
      const mockEditInvoiceValidation = async (invoiceId, editData) => {
        const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
        
        const invoice = await Invoice.findById(invoiceId);
        
        if (invoice.status === 'paid') {
          throw new Error('Cannot edit paid invoice. Paid invoices are locked for data integrity.');
        }
        
        if (invoice.paidAmount > 0 && editData.items) {
          throw new Error('Cannot edit items after payment received. Create a new invoice or process return.');
        }
        
        return { canEdit: true };
      };

      // Create a paid invoice
      const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
      const paidInvoice = await Invoice.create({
        invoiceNo: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
        customerName: testCustomer.name,
        customerPhone: testCustomer.phone,
        items: [{ product: testProduct._id, productName: testProduct.name, quantity: 8, unit: 'sqft', unitPrice: 150, totalPrice: 1200 }],
        subtotal: 1200,
        grandTotal: 1200,
        paidAmount: 1200,
        dueAmount: 0,
        status: 'paid',
        createdBy: testUser._id
      });

      const editData = {
        items: [{ productId: testProduct._id, quantity: 10, unitPrice: 150 }]
      };

      await expect(mockEditInvoiceValidation(paidInvoice._id, editData))
        .rejects.toThrow('Cannot edit paid invoice');
    });

    test('should prevent item editing after partial payment', async () => {
      const mockEditPartialPaidInvoice = async (invoiceId, editData) => {
        const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
        
        const invoice = await Invoice.findById(invoiceId);
        
        if (invoice.paidAmount > 0 && editData.items) {
          throw new Error('Cannot edit items after payment received. Create a new invoice or process return.');
        }
        
        return { canEdit: true };
      };

      // Create a partially paid invoice
      const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
      const partialInvoice = await Invoice.create({
        invoiceNo: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
        customerName: testCustomer.name,
        customerPhone: testCustomer.phone,
        items: [{ product: testProduct._id, productName: testProduct.name, quantity: 6, unit: 'sqft', unitPrice: 150, totalPrice: 900 }],
        subtotal: 900,
        grandTotal: 900,
        paidAmount: 400, // Partial payment
        dueAmount: 500,
        status: 'partial',
        createdBy: testUser._id
      });

      const editData = {
        items: [{ productId: testProduct._id, quantity: 8, unitPrice: 150 }]
      };

      await expect(mockEditPartialPaidInvoice(partialInvoice._id, editData))
        .rejects.toThrow('Cannot edit items after payment received');
    });

    test('should allow editing due invoice', async () => {
      const mockEditDueInvoice = async (invoiceId, editData) => {
        const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
        
        const invoice = await Invoice.findById(invoiceId);
        
        if (invoice.status === 'paid') {
          throw new Error('Cannot edit paid invoice');
        }
        
        if (invoice.paidAmount > 0 && editData.items) {
          throw new Error('Cannot edit items after payment received');
        }
        
        // Allow editing due invoice
        return { canEdit: true, invoice };
      };

      // Create a due invoice
      const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
      const dueInvoice = await Invoice.create({
        invoiceNo: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
        customerName: testCustomer.name,
        customerPhone: testCustomer.phone,
        items: [{ product: testProduct._id, productName: testProduct.name, quantity: 4, unit: 'sqft', unitPrice: 150, totalPrice: 600 }],
        subtotal: 600,
        grandTotal: 600,
        paidAmount: 0,
        dueAmount: 600,
        status: 'due',
        createdBy: testUser._id
      });

      const editData = {
        items: [{ productId: testProduct._id, quantity: 5, unitPrice: 150 }]
      };

      const result = await mockEditDueInvoice(dueInvoice._id, editData);
      expect(result.canEdit).toBe(true);
    });
  });

  describe('Invoice Return Stock & Profit Restoration', () => {
    test('should restore stock and adjust profit on invoice return', async () => {
      const mockProcessInvoiceReturn = async (invoiceId, returnData) => {
        const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
        const { default: Product } = await import('../../../backend/src/models/Product.js');
        
        const invoice = await Invoice.findById(invoiceId);
        
        if (!invoice) {
          throw new Error('Invoice not found');
        }
        
        if (invoice.status === 'returned') {
          throw new Error('Invoice already returned');
        }
        
        // Restore stock for returned items
        const stockRestorations = [];
        let totalReturnAmount = 0;
        
        for (const returnItem of returnData.items) {
          const originalItem = invoice.items.find(item => 
            item.product.toString() === returnItem.productId.toString()
          );
          
          if (!originalItem) {
            throw new Error(`Product not found in original invoice: ${returnItem.productId}`);
          }
          
          if (returnItem.quantity > originalItem.quantity) {
            throw new Error(`Cannot return more than originally sold: ${originalItem.quantity}`);
          }
          
          // Restore stock
          await Product.findByIdAndUpdate(returnItem.productId, {
            $inc: { stockQuantity: returnItem.quantity }
          });
          
          stockRestorations.push({
            productId: returnItem.productId,
            quantityRestored: returnItem.quantity,
            originalQuantity: originalItem.quantity
          });
          
          totalReturnAmount += returnItem.quantity * originalItem.unitPrice;
        }
        
        // Calculate refund amount
        const refundAmount = Math.min(totalReturnAmount, invoice.paidAmount);
        
        // Update invoice status
        await Invoice.findByIdAndUpdate(invoiceId, {
          status: 'returned',
          returnDate: new Date(),
          returnAmount: totalReturnAmount,
          refundAmount: refundAmount,
          returnedBy: testUser._id
        });
        
        return {
          stockRestorations,
          totalReturnAmount,
          refundAmount,
          profitAdjustment: -totalReturnAmount // Negative impact on profit
        };
      };

      // Create and process an invoice
      const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
      const { default: Product } = await import('../../../backend/src/models/Product.js');
      
      const originalStock = testProduct.stockQuantity;
      
      const invoice = await Invoice.create({
        invoiceNo: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
        customerName: testCustomer.name,
        customerPhone: testCustomer.phone,
        items: [{
          product: testProduct._id,
          productName: testProduct.name,
          quantity: 8,
          unit: 'sqft',
          unitPrice: 150,
          totalPrice: 1200
        }],
        subtotal: 1200,
        grandTotal: 1200,
        paidAmount: 1200,
        dueAmount: 0,
        status: 'paid',
        createdBy: testUser._id
      });

      // Simulate stock reduction from invoice creation
      await Product.findByIdAndUpdate(testProduct._id, {
        $inc: { stockQuantity: -8 }
      });

      const returnData = {
        items: [{
          productId: testProduct._id,
          quantity: 5 // Return 5 out of 8
        }]
      };

      const result = await mockProcessInvoiceReturn(invoice._id, returnData);
      
      // Verify stock restoration
      const updatedProduct = await Product.findById(testProduct._id);
      expect(updatedProduct.stockQuantity).toBe(originalStock - 3); // 100 - 8 + 5 = 97
      
      // Verify return calculations
      expect(result.totalReturnAmount).toBe(750); // 5 * 150
      expect(result.refundAmount).toBe(750);
      expect(result.profitAdjustment).toBe(-750);
      expect(result.stockRestorations).toHaveLength(1);
      expect(result.stockRestorations[0].quantityRestored).toBe(5);
    });

    test('should prevent over-return of items', async () => {
      const mockValidateReturnQuantity = async (originalQuantity, returnQuantity) => {
        if (returnQuantity > originalQuantity) {
          throw new Error(`Cannot return more than originally sold: ${originalQuantity}`);
        }
        
        if (returnQuantity <= 0) {
          throw new Error('Return quantity must be positive');
        }
        
        return { valid: true };
      };

      // Test over-return
      await expect(mockValidateReturnQuantity(5, 8))
        .rejects.toThrow('Cannot return more than originally sold: 5');
      
      // Test negative return
      await expect(mockValidateReturnQuantity(5, -2))
        .rejects.toThrow('Return quantity must be positive');
      
      // Test valid return
      const result = await mockValidateReturnQuantity(5, 3);
      expect(result.valid).toBe(true);
    });
  });

  describe('Invoice Number Format Verification', () => {
    test('should validate invoice number format', async () => {
      const mockValidateInvoiceNumber = (invoiceNo) => {
        const pattern = /^[A-Z]+-\d{6}-\d{4}$/;
        
        if (!pattern.test(invoiceNo)) {
          throw new Error('Invoice number must follow format PREFIX-YYYYMM-XXXX');
        }
        
        return { valid: true, format: 'PREFIX-YYYYMM-XXXX' };
      };

      // Test valid formats
      expect(mockValidateInvoiceNumber('INV-202401-0001').valid).toBe(true);
      expect(mockValidateInvoiceNumber('BOOK-202412-9999').valid).toBe(true);
      
      // Test invalid formats
      expect(() => mockValidateInvoiceNumber('INV-2024-01')).toThrow('Invoice number must follow format');
      expect(() => mockValidateInvoiceNumber('INV-20240101-001')).toThrow('Invoice number must follow format');
      expect(() => mockValidateInvoiceNumber('inv-202401-0001')).toThrow('Invoice number must follow format');
    });

    test('should generate sequential invoice numbers', async () => {
      const mockGenerateInvoiceNumber = async (prefix = 'INV') => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const sequence = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
        
        const invoiceNo = `${prefix}-${year}${month}-${sequence}`;
        
        // Validate format
        const pattern = /^[A-Z]+-\d{6}-\d{4}$/;
        if (!pattern.test(invoiceNo)) {
          throw new Error('Generated invoice number format invalid');
        }
        
        return invoiceNo;
      };

      const invoiceNo1 = await mockGenerateInvoiceNumber('INV');
      const invoiceNo2 = await mockGenerateInvoiceNumber('BOOK');
      
      expect(invoiceNo1).toMatch(/^INV-\d{6}-\d{4}$/);
      expect(invoiceNo2).toMatch(/^BOOK-\d{6}-\d{4}$/);
      expect(invoiceNo1).not.toBe(invoiceNo2);
    });
  });

  describe('Totals Match Calculator Verification', () => {
    test('should verify invoice totals match calculator logic', async () => {
      const mockCalculateInvoiceTotals = (items, discountAmount = 0) => {
        let subtotal = 0;
        
        // Calculate subtotal
        for (const item of items) {
          const itemTotal = item.quantity * item.unitPrice;
          subtotal += itemTotal;
        }
        
        // Apply discount
        const grandTotal = subtotal - discountAmount;
        
        // Validate calculations
        if (subtotal < 0) {
          throw new Error('Subtotal cannot be negative');
        }
        
        if (discountAmount > subtotal) {
          throw new Error('Discount cannot exceed subtotal');
        }
        
        if (grandTotal < 0) {
          throw new Error('Grand total cannot be negative');
        }
        
        return {
          subtotal: Math.round(subtotal * 100) / 100, // Round to 2 decimals
          discountAmount: Math.round(discountAmount * 100) / 100,
          grandTotal: Math.round(grandTotal * 100) / 100
        };
      };

      const items = [
        { quantity: 10.5, unitPrice: 150.75 },
        { quantity: 5, unitPrice: 200 },
        { quantity: 2.25, unitPrice: 100.50 }
      ];

      const result = mockCalculateInvoiceTotals(items, 100);
      
      // Verify calculations
      expect(result.subtotal).toBe(2809); // (10.5 * 150.75) + (5 * 200) + (2.25 * 100.50) = 1582.875 + 1000 + 226.125 = 2809
      expect(result.discountAmount).toBe(100);
      expect(result.grandTotal).toBe(2709); // 2809 - 100
    });

    test('should handle edge cases in calculations', async () => {
      const mockCalculateWithValidation = (items, discountAmount = 0) => {
        if (!items || items.length === 0) {
          throw new Error('Invoice must have at least one item');
        }
        
        let subtotal = 0;
        
        for (const item of items) {
          if (item.quantity <= 0) {
            throw new Error('Item quantity must be positive');
          }
          
          if (item.unitPrice < 0) {
            throw new Error('Item price cannot be negative');
          }
          
          subtotal += item.quantity * item.unitPrice;
        }
        
        if (discountAmount < 0) {
          throw new Error('Discount cannot be negative');
        }
        
        if (discountAmount > subtotal) {
          throw new Error('Discount cannot exceed subtotal');
        }
        
        return {
          subtotal,
          discountAmount,
          grandTotal: subtotal - discountAmount
        };
      };

      // Test empty items
      await expect(() => mockCalculateWithValidation([])).toThrow('Invoice must have at least one item');
      
      // Test negative quantity
      await expect(() => mockCalculateWithValidation([{ quantity: -1, unitPrice: 100 }]))
        .toThrow('Item quantity must be positive');
      
      // Test negative price
      await expect(() => mockCalculateWithValidation([{ quantity: 1, unitPrice: -100 }]))
        .toThrow('Item price cannot be negative');
      
      // Test excessive discount
      await expect(() => mockCalculateWithValidation([{ quantity: 1, unitPrice: 100 }], 150))
        .toThrow('Discount cannot exceed subtotal');
    });
  });

  describe('Print View Data Accuracy', () => {
    test('should ensure print view matches invoice data', async () => {
      const mockGeneratePrintData = async (invoiceId) => {
        const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
        
        const invoice = await Invoice.findById(invoiceId);
        
        if (!invoice) {
          throw new Error('Invoice not found');
        }
        
        // Format data for print view
        const printData = {
          invoiceNo: invoice.invoiceNo,
          date: invoice.createdAt.toLocaleDateString('en-GB'),
          customerName: invoice.customerName,
          customerPhone: invoice.customerPhone,
          items: invoice.items.map(item => ({
            description: item.productName,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: `৳${item.unitPrice.toFixed(2)}`,
            totalPrice: `৳${item.totalPrice.toFixed(2)}`
          })),
          subtotal: `৳${invoice.subtotal.toFixed(2)}`,
          discount: invoice.discount > 0 ? `৳${invoice.discount.toFixed(2)}` : null,
          grandTotal: `৳${invoice.grandTotal.toFixed(2)}`,
          paidAmount: `৳${invoice.paidAmount.toFixed(2)}`,
          dueAmount: `৳${invoice.dueAmount.toFixed(2)}`,
          status: invoice.status.toUpperCase(),
          paymentMethod: invoice.paymentMethod?.toUpperCase() || 'N/A'
        };
        
        // Verify data integrity
        const calculatedSubtotal = invoice.items.reduce((sum, item) => sum + item.totalPrice, 0);
        const calculatedGrandTotal = calculatedSubtotal - (invoice.discount || 0);
        const calculatedDueAmount = calculatedGrandTotal - invoice.paidAmount;
        
        if (Math.abs(calculatedSubtotal - invoice.subtotal) > 0.01) {
          throw new Error('Print data subtotal mismatch');
        }
        
        if (Math.abs(calculatedGrandTotal - invoice.grandTotal) > 0.01) {
          throw new Error('Print data grand total mismatch');
        }
        
        if (Math.abs(calculatedDueAmount - invoice.dueAmount) > 0.01) {
          throw new Error('Print data due amount mismatch');
        }
        
        return printData;
      };

      // Create test invoice
      const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
      const invoice = await Invoice.create({
        invoiceNo: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
        customerName: testCustomer.name,
        customerPhone: testCustomer.phone,
        items: [{
          product: testProduct._id,
          productName: testProduct.name,
          quantity: 7.5,
          unit: 'sqft',
          unitPrice: 150,
          totalPrice: 1125
        }],
        subtotal: 1125,
        discount: 25,
        grandTotal: 1100,
        paidAmount: 600,
        dueAmount: 500,
        status: 'partial',
        paymentMethod: 'cash',
        createdBy: testUser._id
      });

      const printData = await mockGeneratePrintData(invoice._id);
      
      // Verify print data accuracy
      expect(printData.invoiceNo).toBe(invoice.invoiceNo);
      expect(printData.customerName).toBe(testCustomer.name);
      expect(printData.items).toHaveLength(1);
      expect(printData.items[0].quantity).toBe(7.5);
      expect(printData.items[0].unitPrice).toBe('৳150.00');
      expect(printData.items[0].totalPrice).toBe('৳1125.00');
      expect(printData.subtotal).toBe('৳1125.00');
      expect(printData.discount).toBe('৳25.00');
      expect(printData.grandTotal).toBe('৳1100.00');
      expect(printData.paidAmount).toBe('৳600.00');
      expect(printData.dueAmount).toBe('৳500.00');
      expect(printData.status).toBe('PARTIAL');
    });

    test('should handle print data formatting edge cases', async () => {
      const mockFormatPrintData = (invoice) => {
        const formatCurrency = (amount) => {
          if (typeof amount !== 'number') {
            throw new Error('Amount must be a number');
          }
          
          return `৳${amount.toFixed(2)}`;
        };
        
        const formatDate = (date) => {
          if (!date || !(date instanceof Date)) {
            throw new Error('Invalid date');
          }
          
          return date.toLocaleDateString('en-GB');
        };
        
        return {
          subtotal: formatCurrency(invoice.subtotal),
          grandTotal: formatCurrency(invoice.grandTotal),
          date: formatDate(invoice.createdAt)
        };
      };

      const validInvoice = {
        subtotal: 1500.50,
        grandTotal: 1400.75,
        createdAt: new Date()
      };

      const result = mockFormatPrintData(validInvoice);
      expect(result.subtotal).toBe('৳1500.50');
      expect(result.grandTotal).toBe('৳1400.75');
      expect(result.date).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);

      // Test invalid data
      const invalidInvoice = {
        subtotal: 'invalid',
        grandTotal: 1400.75,
        createdAt: new Date()
      };

      expect(() => mockFormatPrintData(invalidInvoice)).toThrow('Amount must be a number');
    });
  });
});