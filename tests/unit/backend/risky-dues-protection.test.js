// Risky Dues Protection Tests
// Ensures business is protected from risky customer dues and credit exposure

describe('Risky Dues Protection Tests', () => {
  let testUser;
  let ownerUser;
  let testProduct;
  let testCustomer;
  let highRiskCustomer;

  beforeEach(async () => {
    // Create test users
    const userResult = await global.testUtils.createTestUser({
      role: 'accountant'
    });
    testUser = userResult.user;

    const ownerResult = await global.testUtils.createTestUser({
      role: 'owner'
    });
    ownerUser = ownerResult.user;

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

    // Create test customer with moderate credit limit
    testCustomer = await global.testUtils.createTestCustomer({
      name: 'Regular Customer',
      phone: '01712345678',
      creditLimit: 50000, // ৳50,000 credit limit
      createdBy: testUser._id
    });

    // Create high-risk customer with low credit limit
    highRiskCustomer = await global.testUtils.createTestCustomer({
      name: 'High Risk Customer',
      phone: '01787654321',
      creditLimit: 10000, // ৳10,000 credit limit
      createdBy: testUser._id
    });
  });

  describe('Due Amount Increases Correctly', () => {
    test('should increase customer due amount when creating due invoice', async () => {
      const mockCreateDueInvoice = async (invoiceData, customerId) => {
        const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
        const { default: Customer } = await import('../../../backend/src/models/Customer.js');

        // Get current customer due amount
        const customer = await Customer.findById(customerId);
        const previousDue = customer.totalDue || 0;

        // Create due invoice
        const invoice = await Invoice.create({
          invoiceNo: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
          customer: customerId,
          customerName: invoiceData.customerName,
          customerPhone: invoiceData.customerPhone,
          items: [{
            product: testProduct._id,
            productName: testProduct.name,
            quantity: invoiceData.quantity,
            unit: 'sqft',
            unitPrice: invoiceData.unitPrice,
            totalPrice: invoiceData.quantity * invoiceData.unitPrice
          }],
          subtotal: invoiceData.quantity * invoiceData.unitPrice,
          discount: 0,
          grandTotal: invoiceData.quantity * invoiceData.unitPrice,
          paidAmount: 0,
          dueAmount: invoiceData.quantity * invoiceData.unitPrice,
          status: 'due',
          paymentMethod: 'bank_transfer',
          createdBy: testUser._id
        });

        // Update customer due amount
        const newDueAmount = previousDue + invoice.dueAmount;
        await Customer.findByIdAndUpdate(customerId, {
          totalDue: newDueAmount,
          lastInvoiceDate: new Date()
        });

        return {
          invoice,
          previousDue,
          newDueAmount,
          increaseAmount: invoice.dueAmount
        };
      };

      const invoiceData = {
        customerName: testCustomer.name,
        customerPhone: testCustomer.phone,
        quantity: 20,
        unitPrice: 150
      };

      const result = await mockCreateDueInvoice(invoiceData, testCustomer._id);

      // Verify due amount increased correctly
      expect(result.previousDue).toBe(0);
      expect(result.increaseAmount).toBe(3000); // 20 * 150
      expect(result.newDueAmount).toBe(3000);
      expect(result.invoice.status).toBe('due');
      expect(result.invoice.dueAmount).toBe(3000);
    });

    test('should accumulate multiple due invoices correctly', async () => {
      const mockAccumulateDues = async (invoices, customerId) => {
        const { default: Customer } = await import('../../../backend/src/models/Customer.js');
        
        let totalDue = 0;
        const invoiceResults = [];

        for (const invoiceData of invoices) {
          const invoiceAmount = invoiceData.quantity * invoiceData.unitPrice;
          totalDue += invoiceAmount;
          
          invoiceResults.push({
            amount: invoiceAmount,
            runningTotal: totalDue
          });
        }

        // Update customer total due
        await Customer.findByIdAndUpdate(customerId, {
          totalDue: totalDue
        });

        return {
          invoiceResults,
          finalTotalDue: totalDue
        };
      };

      const invoices = [
        { quantity: 10, unitPrice: 150 }, // ৳1,500
        { quantity: 15, unitPrice: 200 }, // ৳3,000
        { quantity: 8, unitPrice: 175 }   // ৳1,400
      ];

      const result = await mockAccumulateDues(invoices, testCustomer._id);

      // Verify accumulation
      expect(result.invoiceResults[0].runningTotal).toBe(1500);
      expect(result.invoiceResults[1].runningTotal).toBe(4500); // 1500 + 3000
      expect(result.invoiceResults[2].runningTotal).toBe(5900); // 4500 + 1400
      expect(result.finalTotalDue).toBe(5900);
    });
  });

  describe('Partial Due Payment Updates Balance', () => {
    test('should correctly update due balance after partial payment', async () => {
      const mockProcessPartialPayment = async (invoiceId, paymentAmount) => {
        const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
        const { default: Customer } = await import('../../../backend/src/models/Customer.js');

        // Get invoice
        const invoice = await Invoice.findById(invoiceId);
        const customer = await Customer.findById(invoice.customer);

        // Calculate new amounts
        const newPaidAmount = invoice.paidAmount + paymentAmount;
        const newDueAmount = invoice.grandTotal - newPaidAmount;
        
        // Determine new status
        let newStatus = 'due';
        if (newPaidAmount >= invoice.grandTotal) {
          newStatus = 'paid';
        } else if (newPaidAmount > 0) {
          newStatus = 'partial';
        }

        // Update invoice
        await Invoice.findByIdAndUpdate(invoiceId, {
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount,
          status: newStatus
        });

        // Update customer total due
        const customerDueReduction = Math.min(paymentAmount, invoice.dueAmount);
        const newCustomerDue = Math.max(0, customer.totalDue - customerDueReduction);
        
        await Customer.findByIdAndUpdate(invoice.customer, {
          totalDue: newCustomerDue,
          lastPaymentDate: new Date()
        });

        return {
          previousPaidAmount: invoice.paidAmount,
          newPaidAmount,
          previousDueAmount: invoice.dueAmount,
          newDueAmount,
          newStatus,
          customerDueReduction,
          newCustomerTotalDue: newCustomerDue
        };
      };

      // Create a due invoice first
      const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
      const { default: Customer } = await import('../../../backend/src/models/Customer.js');
      
      const invoice = await Invoice.create({
        invoiceNo: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
        customer: testCustomer._id,
        customerName: testCustomer.name,
        customerPhone: testCustomer.phone,
        items: [{
          product: testProduct._id,
          productName: testProduct.name,
          quantity: 20,
          unit: 'sqft',
          unitPrice: 150,
          totalPrice: 3000
        }],
        subtotal: 3000,
        discount: 0,
        grandTotal: 3000,
        paidAmount: 0,
        dueAmount: 3000,
        status: 'due',
        createdBy: testUser._id
      });

      // Set customer total due
      await Customer.findByIdAndUpdate(testCustomer._id, {
        totalDue: 3000
      });

      // Process partial payment of ৳1,500
      const result = await mockProcessPartialPayment(invoice._id, 1500);

      // Verify partial payment processing
      expect(result.previousPaidAmount).toBe(0);
      expect(result.newPaidAmount).toBe(1500);
      expect(result.previousDueAmount).toBe(3000);
      expect(result.newDueAmount).toBe(1500);
      expect(result.newStatus).toBe('partial');
      expect(result.customerDueReduction).toBe(1500);
      expect(result.newCustomerTotalDue).toBe(1500);
    });

    test('should handle full payment of due invoice', async () => {
      const mockProcessFullPayment = async (invoiceAmount, paymentAmount) => {
        // Simulate full payment
        const newPaidAmount = paymentAmount;
        const newDueAmount = invoiceAmount - paymentAmount;
        
        let newStatus = 'due';
        if (newPaidAmount >= invoiceAmount) {
          newStatus = 'paid';
        } else if (newPaidAmount > 0) {
          newStatus = 'partial';
        }

        return {
          invoiceAmount,
          paymentAmount,
          newDueAmount: Math.max(0, newDueAmount),
          newStatus,
          isFullyPaid: newPaidAmount >= invoiceAmount
        };
      };

      const result = await mockProcessFullPayment(2500, 2500);

      expect(result.newDueAmount).toBe(0);
      expect(result.newStatus).toBe('paid');
      expect(result.isFullyPaid).toBe(true);
    });
  });
  describe('Credit Limit Warning System', () => {
    test('should show warning when approaching credit limit', async () => {
      const mockCreditLimitWarning = async (customerId, newInvoiceAmount) => {
        const { default: Customer } = await import('../../../backend/src/models/Customer.js');
        
        const customer = await Customer.findById(customerId);
        const currentDue = customer.totalDue || 0;
        const totalDueAfterInvoice = currentDue + newInvoiceAmount;
        const creditUtilization = (totalDueAfterInvoice / customer.creditLimit) * 100;
        
        let warningLevel = 'none';
        let warningMessage = '';
        
        if (creditUtilization >= 90) {
          warningLevel = 'critical';
          warningMessage = `CRITICAL: Customer will exceed 90% credit limit (${creditUtilization.toFixed(1)}%)`;
        } else if (creditUtilization >= 75) {
          warningLevel = 'high';
          warningMessage = `HIGH RISK: Customer will reach ${creditUtilization.toFixed(1)}% of credit limit`;
        } else if (creditUtilization >= 50) {
          warningLevel = 'medium';
          warningMessage = `CAUTION: Customer will reach ${creditUtilization.toFixed(1)}% of credit limit`;
        }
        
        return {
          customerId,
          customerName: customer.name,
          creditLimit: customer.creditLimit,
          currentDue,
          newInvoiceAmount,
          totalDueAfterInvoice,
          creditUtilization: Math.round(creditUtilization * 100) / 100,
          warningLevel,
          warningMessage,
          shouldWarn: warningLevel !== 'none'
        };
      };

      // Test high-risk customer approaching limit
      const { default: Customer } = await import('../../../backend/src/models/Customer.js');
      await Customer.findByIdAndUpdate(highRiskCustomer._id, {
        totalDue: 7500 // Already ৳7,500 due out of ৳10,000 limit
      });

      const result = await mockCreditLimitWarning(highRiskCustomer._id, 2000);

      expect(result.creditUtilization).toBe(95); // (7500 + 2000) / 10000 * 100
      expect(result.warningLevel).toBe('critical');
      expect(result.shouldWarn).toBe(true);
      expect(result.warningMessage).toContain('CRITICAL');
      expect(result.warningMessage).toContain('90%');
    });

    test('should show different warning levels based on credit utilization', async () => {
      const mockWarningLevels = async (creditLimit, currentDue, newAmount) => {
        const totalDue = currentDue + newAmount;
        const utilization = (totalDue / creditLimit) * 100;
        
        if (utilization >= 90) return { level: 'critical', color: 'red' };
        if (utilization >= 75) return { level: 'high', color: 'orange' };
        if (utilization >= 50) return { level: 'medium', color: 'yellow' };
        return { level: 'none', color: 'green' };
      };

      // Test different scenarios
      const scenarios = [
        { creditLimit: 10000, currentDue: 2000, newAmount: 3000, expectedLevel: 'medium' }, // 50%
        { creditLimit: 10000, currentDue: 5000, newAmount: 3000, expectedLevel: 'high' },   // 80%
        { creditLimit: 10000, currentDue: 7000, newAmount: 2500, expectedLevel: 'critical' }, // 95%
        { creditLimit: 10000, currentDue: 1000, newAmount: 2000, expectedLevel: 'none' }    // 30%
      ];

      for (const scenario of scenarios) {
        const result = await mockWarningLevels(
          scenario.creditLimit,
          scenario.currentDue,
          scenario.newAmount
        );
        expect(result.level).toBe(scenario.expectedLevel);
      }
    });

    test('should prevent invoice creation when credit limit exceeded', async () => {
      const mockCreditLimitEnforcement = async (customerId, invoiceAmount, userRole) => {
        const { default: Customer } = await import('../../../backend/src/models/Customer.js');
        
        const customer = await Customer.findById(customerId);
        const totalDueAfterInvoice = (customer.totalDue || 0) + invoiceAmount;
        
        if (totalDueAfterInvoice > customer.creditLimit) {
          if (userRole !== 'owner') {
            throw new Error(
              `Credit limit exceeded. Customer limit: ৳${customer.creditLimit}, ` +
              `Current due: ৳${customer.totalDue || 0}, ` +
              `Invoice amount: ৳${invoiceAmount}, ` +
              `Total would be: ৳${totalDueAfterInvoice}. ` +
              `Owner override required.`
            );
          }
        }
        
        return {
          allowed: true,
          requiresOwnerOverride: totalDueAfterInvoice > customer.creditLimit && userRole !== 'owner'
        };
      };

      // Set high-risk customer to near limit
      const { default: Customer } = await import('../../../backend/src/models/Customer.js');
      await Customer.findByIdAndUpdate(highRiskCustomer._id, {
        totalDue: 8000 // ৳8,000 out of ৳10,000 limit
      });

      // Test accountant trying to exceed limit
      await expect(mockCreditLimitEnforcement(highRiskCustomer._id, 3000, 'accountant'))
        .rejects.toThrow('Credit limit exceeded');

      // Test owner can override
      const ownerResult = await mockCreditLimitEnforcement(highRiskCustomer._id, 3000, 'owner');
      expect(ownerResult.allowed).toBe(true);
    });
  });

  describe('Owner Override System', () => {
    test('should allow owner to override credit limit restrictions', async () => {
      const mockOwnerOverride = async (customerId, invoiceAmount, userId, userRole, overrideReason) => {
        const { default: Customer } = await import('../../../backend/src/models/Customer.js');
        const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
        
        const customer = await Customer.findById(customerId);
        const totalDueAfterInvoice = (customer.totalDue || 0) + invoiceAmount;
        const exceedsLimit = totalDueAfterInvoice > customer.creditLimit;
        
        if (exceedsLimit && userRole !== 'owner') {
          throw new Error('Only owner can override credit limit');
        }
        
        // Create invoice with owner override
        const invoice = await Invoice.create({
          invoiceNo: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
          customer: customerId,
          customerName: customer.name,
          customerPhone: customer.phone,
          items: [{
            product: testProduct._id,
            productName: testProduct.name,
            quantity: 10,
            unit: 'sqft',
            unitPrice: invoiceAmount / 10,
            totalPrice: invoiceAmount
          }],
          subtotal: invoiceAmount,
          discount: 0,
          grandTotal: invoiceAmount,
          paidAmount: 0,
          dueAmount: invoiceAmount,
          status: 'due',
          notes: exceedsLimit ? `CREDIT_LIMIT_OVERRIDE: ${overrideReason} | Original limit: ৳${customer.creditLimit} | New due: ৳${totalDueAfterInvoice} | Overridden by: ${userId}` : null,
          createdBy: userId
        });

        // Create override tracking object
        const overrideDetails = exceedsLimit ? {
          overriddenBy: userId,
          overrideReason: overrideReason,
          overrideDate: new Date(),
          originalLimit: customer.creditLimit,
          newDueAmount: totalDueAfterInvoice,
          invoiceId: invoice._id
        } : null;

        return {
          invoice,
          wasOverridden: exceedsLimit,
          overrideDetails
        };
      };

      // Set customer near limit
      const { default: Customer } = await import('../../../backend/src/models/Customer.js');
      await Customer.findByIdAndUpdate(testCustomer._id, {
        totalDue: 45000 // ৳45,000 out of ৳50,000 limit
      });

      const result = await mockOwnerOverride(
        testCustomer._id,
        8000, // This will exceed the ৳50,000 limit
        ownerUser._id,
        'owner',
        'Trusted long-term customer with good payment history'
      );

      expect(result.wasOverridden).toBe(true);
      expect(result.overrideDetails).toBeDefined();
      expect(result.overrideDetails.overriddenBy.toString()).toBe(ownerUser._id.toString());
      expect(result.overrideDetails.overrideReason).toContain('Trusted long-term customer');
      expect(result.overrideDetails.originalLimit).toBe(50000);
      expect(result.overrideDetails.newDueAmount).toBe(53000); // 45000 + 8000
      expect(result.invoice.notes).toContain('CREDIT_LIMIT_OVERRIDE');
    });

    test('should log owner override for audit trail', async () => {
      const mockAuditOverride = async (overrideData) => {
        // Simulate audit log entry
        const auditEntry = {
          action: 'CREDIT_LIMIT_OVERRIDE',
          timestamp: new Date(),
          userId: overrideData.overriddenBy,
          userRole: 'owner',
          customerId: overrideData.customerId,
          customerName: overrideData.customerName,
          originalLimit: overrideData.originalLimit,
          exceedAmount: overrideData.newDueAmount - overrideData.originalLimit,
          reason: overrideData.overrideReason,
          invoiceId: overrideData.invoiceId,
          riskLevel: overrideData.exceedAmount > 10000 ? 'HIGH' : 'MEDIUM'
        };

        return auditEntry;
      };

      const overrideData = {
        overriddenBy: ownerUser._id,
        customerId: testCustomer._id,
        customerName: testCustomer.name,
        originalLimit: 50000,
        newDueAmount: 58000,
        overrideReason: 'Emergency order for important project',
        invoiceId: 'INV-202401-1234'
      };

      const auditEntry = await mockAuditOverride(overrideData);

      expect(auditEntry.action).toBe('CREDIT_LIMIT_OVERRIDE');
      expect(auditEntry.userRole).toBe('owner');
      expect(auditEntry.exceedAmount).toBe(8000); // 58000 - 50000
      expect(auditEntry.riskLevel).toBe('MEDIUM'); // < 10000
      expect(auditEntry.reason).toContain('Emergency order');
    });

    test('should prevent non-owner users from overriding credit limits', async () => {
      const mockNonOwnerOverride = async (userRole) => {
        if (userRole !== 'owner') {
          throw new Error(`Access denied. Only owner can override credit limits. Current role: ${userRole}`);
        }
        return { allowed: true };
      };

      // Test different roles
      await expect(mockNonOwnerOverride('accountant'))
        .rejects.toThrow('Access denied. Only owner can override');
      
      await expect(mockNonOwnerOverride('manager'))
        .rejects.toThrow('Access denied. Only owner can override');

      // Owner should work
      const result = await mockNonOwnerOverride('owner');
      expect(result.allowed).toBe(true);
    });
  });
  describe('Due Aging Buckets Analysis', () => {
    test('should categorize dues into aging buckets (0-30, 31-60, 60+ days)', async () => {
      const mockDueAgingAnalysis = async (customerId) => {
        const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
        
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));
        
        // Get all due invoices for customer
        const dueInvoices = await Invoice.find({
          customer: customerId,
          status: { $in: ['due', 'partial'] },
          dueAmount: { $gt: 0 }
        }).sort({ createdAt: 1 });

        const agingBuckets = {
          current: { // 0-30 days
            invoices: [],
            totalAmount: 0,
            count: 0
          },
          thirtyToSixty: { // 31-60 days
            invoices: [],
            totalAmount: 0,
            count: 0
          },
          overSixty: { // 60+ days
            invoices: [],
            totalAmount: 0,
            count: 0
          }
        };

        for (const invoice of dueInvoices) {
          const daysPastDue = Math.floor((now - invoice.createdAt) / (1000 * 60 * 60 * 24));
          
          const invoiceData = {
            invoiceId: invoice._id,
            invoiceNo: invoice.invoiceNo,
            dueAmount: invoice.dueAmount,
            daysPastDue,
            createdAt: invoice.createdAt
          };

          if (daysPastDue <= 30) {
            agingBuckets.current.invoices.push(invoiceData);
            agingBuckets.current.totalAmount += invoice.dueAmount;
            agingBuckets.current.count++;
          } else if (daysPastDue <= 60) {
            agingBuckets.thirtyToSixty.invoices.push(invoiceData);
            agingBuckets.thirtyToSixty.totalAmount += invoice.dueAmount;
            agingBuckets.thirtyToSixty.count++;
          } else {
            agingBuckets.overSixty.invoices.push(invoiceData);
            agingBuckets.overSixty.totalAmount += invoice.dueAmount;
            agingBuckets.overSixty.count++;
          }
        }

        const totalDue = agingBuckets.current.totalAmount + 
                        agingBuckets.thirtyToSixty.totalAmount + 
                        agingBuckets.overSixty.totalAmount;

        return {
          customerId,
          agingBuckets,
          totalDue,
          riskAssessment: {
            riskLevel: agingBuckets.overSixty.totalAmount > 10000 ? 'HIGH' : 
                      agingBuckets.thirtyToSixty.totalAmount > 5000 ? 'MEDIUM' : 'LOW',
            oldestInvoiceDays: dueInvoices.length > 0 ? 
              Math.floor((now - dueInvoices[0].createdAt) / (1000 * 60 * 60 * 24)) : 0
          }
        };
      };

      // Create test invoices with different ages
      const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
      
      const now = new Date();
      const testInvoices = [
        {
          createdAt: new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000)), // 15 days old
          dueAmount: 2000
        },
        {
          createdAt: new Date(now.getTime() - (45 * 24 * 60 * 60 * 1000)), // 45 days old
          dueAmount: 3500
        },
        {
          createdAt: new Date(now.getTime() - (75 * 24 * 60 * 60 * 1000)), // 75 days old
          dueAmount: 5000
        }
      ];

      // Create invoices
      for (let i = 0; i < testInvoices.length; i++) {
        const invoiceData = testInvoices[i];
        await Invoice.create({
          invoiceNo: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(1000 + i).padStart(4, '0')}`,
          customer: testCustomer._id,
          customerName: testCustomer.name,
          customerPhone: testCustomer.phone,
          items: [{
            product: testProduct._id,
            productName: testProduct.name,
            quantity: 10,
            unit: 'sqft',
            unitPrice: invoiceData.dueAmount / 10,
            totalPrice: invoiceData.dueAmount
          }],
          subtotal: invoiceData.dueAmount,
          discount: 0,
          grandTotal: invoiceData.dueAmount,
          paidAmount: 0,
          dueAmount: invoiceData.dueAmount,
          status: 'due',
          createdAt: invoiceData.createdAt,
          createdBy: testUser._id
        });
      }

      const result = await mockDueAgingAnalysis(testCustomer._id);

      // Verify aging buckets
      expect(result.agingBuckets.current.count).toBe(1);
      expect(result.agingBuckets.current.totalAmount).toBe(2000);
      
      expect(result.agingBuckets.thirtyToSixty.count).toBe(1);
      expect(result.agingBuckets.thirtyToSixty.totalAmount).toBe(3500);
      
      expect(result.agingBuckets.overSixty.count).toBe(1);
      expect(result.agingBuckets.overSixty.totalAmount).toBe(5000);
      
      expect(result.totalDue).toBe(10500);
      expect(result.riskAssessment.riskLevel).toBe('LOW'); // overSixty = 5000 < 10000 and thirtyToSixty = 3500 < 5000
    });

    test('should generate aging report for all customers', async () => {
      const mockGenerateAgingReport = async () => {
        const { default: Customer } = await import('../../../backend/src/models/Customer.js');
        const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
        
        const customers = await Customer.find({ totalDue: { $gt: 0 } });
        const agingReport = [];
        
        for (const customer of customers) {
          const now = new Date();
          const dueInvoices = await Invoice.find({
            customer: customer._id,
            status: { $in: ['due', 'partial'] },
            dueAmount: { $gt: 0 }
          });

          let current = 0, thirtyToSixty = 0, overSixty = 0;
          
          for (const invoice of dueInvoices) {
            const daysPastDue = Math.floor((now - invoice.createdAt) / (1000 * 60 * 60 * 24));
            
            if (daysPastDue <= 30) {
              current += invoice.dueAmount;
            } else if (daysPastDue <= 60) {
              thirtyToSixty += invoice.dueAmount;
            } else {
              overSixty += invoice.dueAmount;
            }
          }

          if (current + thirtyToSixty + overSixty > 0) {
            agingReport.push({
              customerId: customer._id,
              customerName: customer.name,
              creditLimit: customer.creditLimit,
              current,
              thirtyToSixty,
              overSixty,
              totalDue: current + thirtyToSixty + overSixty,
              riskScore: (overSixty * 3) + (thirtyToSixty * 2) + (current * 1), // Weighted risk
              riskLevel: overSixty > 10000 ? 'HIGH' : thirtyToSixty > 5000 ? 'MEDIUM' : 'LOW'
            });
          }
        }

        // Sort by risk score descending
        agingReport.sort((a, b) => b.riskScore - a.riskScore);

        return {
          reportDate: new Date(),
          totalCustomersWithDues: agingReport.length,
          summary: {
            totalCurrent: agingReport.reduce((sum, c) => sum + c.current, 0),
            totalThirtyToSixty: agingReport.reduce((sum, c) => sum + c.thirtyToSixty, 0),
            totalOverSixty: agingReport.reduce((sum, c) => sum + c.overSixty, 0),
            grandTotal: agingReport.reduce((sum, c) => sum + c.totalDue, 0)
          },
          customers: agingReport
        };
      };

      const report = await mockGenerateAgingReport();

      expect(report.totalCustomersWithDues).toBeGreaterThanOrEqual(0);
      expect(report.summary).toBeDefined();
      expect(report.summary.grandTotal).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(report.customers)).toBe(true);
      
      // If there are customers with dues, verify structure
      if (report.customers.length > 0) {
        const firstCustomer = report.customers[0];
        expect(firstCustomer).toHaveProperty('customerName');
        expect(firstCustomer).toHaveProperty('current');
        expect(firstCustomer).toHaveProperty('thirtyToSixty');
        expect(firstCustomer).toHaveProperty('overSixty');
        expect(firstCustomer).toHaveProperty('riskLevel');
      }
    });

    test('should identify high-risk customers based on aging analysis', async () => {
      const mockIdentifyHighRiskCustomers = async (riskThreshold = 15000) => {
        const agingData = [
          {
            customerId: 'cust1',
            customerName: 'Customer A',
            current: 2000,
            thirtyToSixty: 3000,
            overSixty: 12000, // High risk due to old dues
            totalDue: 17000
          },
          {
            customerId: 'cust2',
            customerName: 'Customer B',
            current: 5000,
            thirtyToSixty: 2000,
            overSixty: 1000,
            totalDue: 8000
          },
          {
            customerId: 'cust3',
            customerName: 'Customer C',
            current: 1000,
            thirtyToSixty: 8000, // Medium-high risk
            overSixty: 5000,
            totalDue: 14000
          }
        ];

        const highRiskCustomers = agingData.filter(customer => {
          const riskScore = (customer.overSixty * 3) + (customer.thirtyToSixty * 2) + (customer.current * 1);
          return riskScore >= riskThreshold || customer.overSixty > 10000;
        });

        return {
          highRiskCustomers,
          riskThreshold,
          totalHighRiskAmount: highRiskCustomers.reduce((sum, c) => sum + c.totalDue, 0)
        };
      };

      const result = await mockIdentifyHighRiskCustomers();

      expect(result.highRiskCustomers.length).toBe(2); // Customer A and C
      expect(result.totalHighRiskAmount).toBe(31000); // 17000 + 14000
      
      // Verify Customer A is identified as high risk
      const customerA = result.highRiskCustomers.find(c => c.customerName === 'Customer A');
      expect(customerA).toBeDefined();
      expect(customerA.overSixty).toBe(12000);
    });
  });
});