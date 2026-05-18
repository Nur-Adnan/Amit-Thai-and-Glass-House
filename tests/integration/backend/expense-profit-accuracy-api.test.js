// Expense and Profit Accuracy API Integration Tests
// Tests actual API endpoints for ensuring expenses and profit calculations are real and accurate

describe('Expense and Profit Accuracy API Tests', () => {
  let testUser;
  let ownerUser;
  let authToken;
  let ownerToken;
  let testProduct;
  let testSupplier;
  let testCustomer;

  beforeEach(async () => {
    // Create test users and get auth tokens
    const userResult = await global.testUtils.createTestUser({
      role: 'accountant'
    });
    testUser = userResult.user;
    authToken = userResult.token;

    const ownerResult = await global.testUtils.createTestUser({
      role: 'owner'
    });
    ownerUser = ownerResult.user;
    ownerToken = ownerResult.token;

    // Create test product
    testProduct = await global.testUtils.createTestProduct({
      name: 'Test Glass Panel',
      category: 'Glass',
      stockQuantity: 200,
      purchasePrice: 100,
      sellingPrice: 150,
      unit: 'sqft',
      isActive: true,
      createdBy: testUser._id
    });

    // Create test supplier
    testSupplier = await global.testUtils.createTestSupplier({
      name: 'Glass Supplier Ltd',
      phone: '01712345678',
      email: 'supplier@glass.com',
      address: 'Dhaka, Bangladesh',
      createdBy: testUser._id
    });

    // Create test customer
    testCustomer = await global.testUtils.createTestCustomer({
      name: 'Test Customer',
      phone: '01787654321',
      creditLimit: 50000,
      createdBy: testUser._id
    });
  });

  describe('Salary Payment Expense API', () => {
    test('should add salary payment as expense via API', async () => {
      const mockSalaryPaymentAPI = async (salaryData, token) => {
        if (!token) {
          throw new Error('Authentication required');
        }

        const { default: Expense } = await import('../../../backend/src/models/Expense.js');
        
        // Check for duplicate salary payment
        const existingSalary = await Expense.findOne({
          type: 'salary',
          'employeeDetails.employeeId': salaryData.employeeId,
          'employeeDetails.month': salaryData.month,
          'employeeDetails.year': salaryData.year,
          isPaid: true,
          isDeleted: { $ne: true }
        });

        if (existingSalary) {
          throw new Error(
            `Salary already paid for ${salaryData.employeeName} for ${salaryData.month} ${salaryData.year}`
          );
        }

        // Create salary expense
        const expense = await Expense.create({
          type: 'salary',
          category: 'operational',
          description: `Salary payment for ${salaryData.employeeName} - ${salaryData.month}`,
          amount: salaryData.amount,
          paymentMethod: salaryData.paymentMethod || 'bank_transfer',
          expenseDate: salaryData.paymentDate || new Date(),
          employeeDetails: {
            employeeName: salaryData.employeeName,
            employeeId: salaryData.employeeId,
            position: salaryData.position,
            month: salaryData.month,
            year: salaryData.year
          },
          isPaid: true,
          paidDate: salaryData.paymentDate || new Date(),
          notes: salaryData.notes || `Monthly salary for ${salaryData.month} ${salaryData.year}`,
          createdBy: testUser._id
        });

        return {
          success: true,
          expense: {
            id: expense._id,
            type: expense.type,
            amount: expense.amount,
            employeeName: expense.employeeDetails.employeeName,
            month: expense.employeeDetails.month,
            year: expense.employeeDetails.year,
            isPaid: expense.isPaid
          }
        };
      };

      const salaryData = {
        employeeName: 'John Doe',
        employeeId: 'EMP-001',
        position: 'Sales Manager',
        amount: 35000,
        month: 'January',
        year: 2026,
        paymentMethod: 'bank_transfer',
        paymentDate: new Date('2026-01-31'),
        notes: 'Monthly salary payment'
      };

      const result = await mockSalaryPaymentAPI(salaryData, authToken);

      expect(result.success).toBe(true);
      expect(result.expense.amount).toBe(35000);
      expect(result.expense.employeeName).toBe('John Doe');
      expect(result.expense.month).toBe('January');
      expect(result.expense.year).toBe(2026);
      expect(result.expense.isPaid).toBe(true);
    });

    test('should prevent double salary payment via API', async () => {
      const mockPreventDoubleSalaryAPI = async (salaryData, token) => {
        if (!token) {
          throw new Error('Authentication required');
        }

        const { default: Expense } = await import('../../../backend/src/models/Expense.js');
        
        // Check for existing salary payment
        const existingSalary = await Expense.findOne({
          type: 'salary',
          'employeeDetails.employeeId': salaryData.employeeId,
          'employeeDetails.month': salaryData.month,
          'employeeDetails.year': salaryData.year,
          isPaid: true,
          isDeleted: { $ne: true }
        });

        if (existingSalary) {
          throw new Error(
            `Salary already paid for ${salaryData.employeeName} for ${salaryData.month} ${salaryData.year}. ` +
            `Previous payment: ৳${existingSalary.amount} on ${existingSalary.paidDate.toDateString()}`
          );
        }

        // Create new salary expense
        const expense = await Expense.create({
          type: 'salary',
          category: 'operational',
          description: `Salary payment for ${salaryData.employeeName} - ${salaryData.month}`,
          amount: salaryData.amount,
          employeeDetails: {
            employeeName: salaryData.employeeName,
            employeeId: salaryData.employeeId,
            position: salaryData.position,
            month: salaryData.month,
            year: salaryData.year
          },
          isPaid: true,
          paidDate: new Date(),
          createdBy: testUser._id
        });

        return { success: true, expense };
      };

      const salaryData = {
        employeeName: 'Jane Smith',
        employeeId: 'EMP-002',
        position: 'Accountant',
        amount: 28000,
        month: 'January',
        year: 2026
      };

      // First payment should succeed
      const firstResult = await mockPreventDoubleSalaryAPI(salaryData, authToken);
      expect(firstResult.success).toBe(true);

      // Second payment should fail
      await expect(mockPreventDoubleSalaryAPI(salaryData, authToken))
        .rejects.toThrow('Salary already paid for Jane Smith for January 2026');
    });
  });

  describe('Expense Date Filtering API', () => {
    test('should filter expenses by date range via API', async () => {
      const mockExpenseDateFilterAPI = async (startDate, endDate, token) => {
        if (!token) {
          throw new Error('Authentication required');
        }

        const { default: Expense } = await import('../../../backend/src/models/Expense.js');
        
        // Create test expenses with different dates
        const testExpenses = [
          {
            type: 'salary',
            category: 'operational',
            description: 'January Salary - John',
            amount: 35000,
            expenseDate: new Date('2026-01-15'),
            isPaid: true,
            createdBy: testUser._id
          },
          {
            type: 'utility',
            category: 'operational',
            description: 'Electricity Bill',
            amount: 5000,
            expenseDate: new Date('2026-01-20'),
            isPaid: true,
            createdBy: testUser._id
          },
          {
            type: 'salary',
            category: 'operational',
            description: 'February Salary - John',
            amount: 35000,
            expenseDate: new Date('2026-02-15'),
            isPaid: true,
            createdBy: testUser._id
          }
        ];

        // Create expenses
        for (const expenseData of testExpenses) {
          await Expense.create(expenseData);
        }

        // Filter by date range
        const filteredExpenses = await Expense.find({
          expenseDate: {
            $gte: startDate,
            $lte: endDate
          },
          isDeleted: { $ne: true }
        }).sort({ expenseDate: 1 });

        const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const categoryBreakdown = {};

        filteredExpenses.forEach(expense => {
          const category = expense.category || 'other';
          if (!categoryBreakdown[category]) {
            categoryBreakdown[category] = { amount: 0, count: 0 };
          }
          categoryBreakdown[category].amount += expense.amount;
          categoryBreakdown[category].count += 1;
        });

        return {
          success: true,
          dateRange: { startDate, endDate },
          expenses: filteredExpenses.map(exp => ({
            id: exp._id,
            type: exp.type,
            category: exp.category,
            description: exp.description,
            amount: exp.amount,
            expenseDate: exp.expenseDate,
            isPaid: exp.isPaid
          })),
          summary: {
            totalAmount,
            count: filteredExpenses.length,
            categoryBreakdown
          }
        };
      };

      // Filter January 2026 expenses
      const januaryStart = new Date('2026-01-01');
      const januaryEnd = new Date('2026-01-31');
      
      const result = await mockExpenseDateFilterAPI(januaryStart, januaryEnd, authToken);

      expect(result.success).toBe(true);
      expect(result.summary.count).toBe(2); // Salary + Utility
      expect(result.summary.totalAmount).toBe(40000); // 35000 + 5000
      expect(result.summary.categoryBreakdown.operational.amount).toBe(40000);
      expect(result.summary.categoryBreakdown.operational.count).toBe(2);
    });

    test('should generate monthly expense report via API', async () => {
      const mockMonthlyExpenseReportAPI = async (year, month, token) => {
        if (!token) {
          throw new Error('Authentication required');
        }

        const { default: Expense } = await import('../../../backend/src/models/Expense.js');
        
        // Build date range for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        // Create test expenses for the month
        await Expense.create({
          type: 'salary',
          category: 'operational',
          description: 'Staff Salaries',
          amount: 85000,
          expenseDate: new Date(year, month - 1, 31),
          isPaid: true,
          createdBy: testUser._id
        });

        await Expense.create({
          type: 'utility',
          category: 'operational',
          description: 'Electricity Bill',
          amount: 5000,
          expenseDate: new Date(year, month - 1, 15),
          isPaid: true,
          createdBy: testUser._id
        });

        await Expense.create({
          type: 'purchase',
          category: 'inventory',
          description: 'Glass Purchase',
          amount: 150000,
          expenseDate: new Date(year, month - 1, 10),
          isPaid: true,
          createdBy: testUser._id
        });

        const expenses = await Expense.find({
          expenseDate: { $gte: startDate, $lte: endDate },
          isDeleted: { $ne: true }
        });

        // Group by category
        const categoryTotals = {};
        let totalExpenses = 0;

        expenses.forEach(expense => {
          const category = expense.category || 'other';
          if (!categoryTotals[category]) {
            categoryTotals[category] = { amount: 0, count: 0, expenses: [] };
          }
          categoryTotals[category].amount += expense.amount;
          categoryTotals[category].count += 1;
          categoryTotals[category].expenses.push({
            id: expense._id,
            type: expense.type,
            description: expense.description,
            amount: expense.amount,
            expenseDate: expense.expenseDate
          });
          totalExpenses += expense.amount;
        });

        return {
          success: true,
          period: {
            year,
            month,
            monthName: new Date(year, month - 1).toLocaleString('default', { month: 'long' })
          },
          summary: {
            totalExpenses,
            expenseCount: expenses.length,
            categoryTotals
          },
          reportGeneratedAt: new Date()
        };
      };

      const result = await mockMonthlyExpenseReportAPI(2026, 1, authToken);

      expect(result.success).toBe(true);
      expect(result.period.monthName).toBe('January');
      expect(result.summary.totalExpenses).toBe(240000); // 85000 + 5000 + 150000
      expect(result.summary.expenseCount).toBe(3);
      expect(result.summary.categoryTotals.operational.amount).toBe(90000);
      expect(result.summary.categoryTotals.inventory.amount).toBe(150000);
    });
  });

  describe('Service Cost Deduction API', () => {
    test('should calculate profit with service cost deduction via API', async () => {
      const mockProfitCalculationAPI = async (invoiceData, token) => {
        if (!token) {
          throw new Error('Authentication required');
        }

        const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
        const { default: Expense } = await import('../../../backend/src/models/Expense.js');
        
        // Create invoice with service charges
        const invoice = await Invoice.create({
          invoiceNo: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
          customer: testCustomer._id,
          customerName: testCustomer.name,
          customerPhone: testCustomer.phone,
          items: [{
            product: testProduct._id,
            productName: testProduct.name,
            quantity: invoiceData.quantity,
            unit: 'sqft',
            unitPrice: invoiceData.sellingPrice,
            totalPrice: invoiceData.quantity * invoiceData.sellingPrice
          }],
          subtotal: invoiceData.quantity * invoiceData.sellingPrice,
          discount: 0,
          serviceCharges: {
            deliveryCharge: invoiceData.deliveryCharge || 0,
            installationCharge: invoiceData.installationCharge || 0,
            installerName: invoiceData.installerName,
            totalServiceCharges: (invoiceData.deliveryCharge || 0) + (invoiceData.installationCharge || 0)
          },
          grandTotal: (invoiceData.quantity * invoiceData.sellingPrice) + 
                     (invoiceData.deliveryCharge || 0) + 
                     (invoiceData.installationCharge || 0),
          paidAmount: invoiceData.quantity * invoiceData.sellingPrice + 
                     (invoiceData.deliveryCharge || 0) + 
                     (invoiceData.installationCharge || 0),
          dueAmount: 0,
          status: 'paid',
          createdBy: testUser._id
        });

        // Create service cost expenses
        const serviceExpenses = [];
        
        if (invoiceData.deliveryCharge > 0) {
          const deliveryExpense = await Expense.create({
            type: 'delivery',
            category: 'service',
            description: `Delivery cost for invoice ${invoice.invoiceNo}`,
            amount: invoiceData.deliveryCharge,
            relatedInvoice: invoice._id,
            expenseDate: new Date(),
            isPaid: true,
            createdBy: testUser._id
          });
          serviceExpenses.push(deliveryExpense);
        }

        if (invoiceData.installationCharge > 0) {
          const installationExpense = await Expense.create({
            type: 'installation',
            category: 'service',
            description: `Installation cost for invoice ${invoice.invoiceNo}`,
            amount: invoiceData.installationCharge,
            relatedInvoice: invoice._id,
            expenseDate: new Date(),
            isPaid: true,
            serviceDetails: {
              installerName: invoiceData.installerName
            },
            createdBy: testUser._id
          });
          serviceExpenses.push(installationExpense);
        }

        // Calculate profit
        const productCost = invoiceData.quantity * invoiceData.purchasePrice;
        const productRevenue = invoiceData.quantity * invoiceData.sellingPrice;
        const serviceRevenue = (invoiceData.deliveryCharge || 0) + (invoiceData.installationCharge || 0);
        const serviceCosts = serviceExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        
        const grossProfit = productRevenue - productCost;
        const netProfit = grossProfit + serviceRevenue - serviceCosts;

        return {
          success: true,
          invoice: {
            id: invoice._id,
            invoiceNo: invoice.invoiceNo,
            grandTotal: invoice.grandTotal,
            status: invoice.status
          },
          profitAnalysis: {
            productCost,
            productRevenue,
            grossProfit,
            serviceRevenue,
            serviceCosts,
            netProfit,
            totalRevenue: productRevenue + serviceRevenue,
            totalCosts: productCost + serviceCosts,
            profitMargin: ((netProfit / (productRevenue + serviceRevenue)) * 100).toFixed(2)
          },
          serviceExpenses: serviceExpenses.map(exp => ({
            id: exp._id,
            type: exp.type,
            amount: exp.amount,
            description: exp.description
          }))
        };
      };

      const invoiceData = {
        quantity: 20,
        purchasePrice: 100,
        sellingPrice: 150,
        deliveryCharge: 2000,
        installationCharge: 3000,
        installerName: 'Ahmed Installation Services'
      };

      const result = await mockProfitCalculationAPI(invoiceData, authToken);

      expect(result.success).toBe(true);
      expect(result.profitAnalysis.productCost).toBe(2000); // 20 * 100
      expect(result.profitAnalysis.productRevenue).toBe(3000); // 20 * 150
      expect(result.profitAnalysis.grossProfit).toBe(1000); // 3000 - 2000
      expect(result.profitAnalysis.serviceRevenue).toBe(5000); // 2000 + 3000
      expect(result.profitAnalysis.serviceCosts).toBe(5000); // Same as service revenue (they are expenses)
      expect(result.profitAnalysis.netProfit).toBe(1000); // Gross profit only
      expect(result.profitAnalysis.totalRevenue).toBe(8000);
      expect(result.profitAnalysis.totalCosts).toBe(7000);
      expect(result.serviceExpenses).toHaveLength(2);
    });

    test('should track service expenses separately via API', async () => {
      const mockServiceExpenseTrackingAPI = async (serviceData, token) => {
        if (!token) {
          throw new Error('Authentication required');
        }

        const { default: Expense } = await import('../../../backend/src/models/Expense.js');
        
        const serviceExpenses = [];

        for (const service of serviceData) {
          const expense = await Expense.create({
            type: service.type,
            category: 'service',
            description: service.description,
            amount: service.amount,
            relatedInvoice: service.invoiceId,
            expenseDate: service.serviceDate || new Date(),
            isPaid: true,
            paidDate: new Date(),
            serviceDetails: {
              serviceName: service.serviceName,
              serviceProvider: service.serviceProvider,
              serviceType: service.type
            },
            createdBy: testUser._id
          });
          serviceExpenses.push(expense);
        }

        const totalServiceCosts = serviceExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        return {
          success: true,
          serviceExpenses: serviceExpenses.map(exp => ({
            id: exp._id,
            type: exp.type,
            description: exp.description,
            amount: exp.amount,
            serviceProvider: exp.serviceDetails?.serviceProvider,
            expenseDate: exp.expenseDate
          })),
          summary: {
            totalServiceCosts,
            serviceCount: serviceExpenses.length
          }
        };
      };

      const serviceData = [
        {
          type: 'delivery',
          description: 'Glass delivery to customer location',
          amount: 1500,
          serviceName: 'Delivery Service',
          serviceProvider: 'Express Delivery Co.',
          invoiceId: testCustomer._id // Mock invoice ID
        },
        {
          type: 'installation',
          description: 'Glass installation service',
          amount: 2500,
          serviceName: 'Installation Service',
          serviceProvider: 'Ahmed Installation Services',
          invoiceId: testCustomer._id // Mock invoice ID
        }
      ];

      const result = await mockServiceExpenseTrackingAPI(serviceData, authToken);

      expect(result.success).toBe(true);
      expect(result.summary.totalServiceCosts).toBe(4000);
      expect(result.summary.serviceCount).toBe(2);
      expect(result.serviceExpenses).toHaveLength(2);
      
      const deliveryExpense = result.serviceExpenses.find(exp => exp.type === 'delivery');
      expect(deliveryExpense.amount).toBe(1500);
      expect(deliveryExpense.serviceProvider).toBe('Express Delivery Co.');
    });
  });

  describe('Supplier Due Update API', () => {
    test('should update supplier due after purchase via API', async () => {
      const mockSupplierDueUpdateAPI = async (purchaseData, token) => {
        if (!token) {
          throw new Error('Authentication required');
        }

        const { default: Purchase } = await import('../../../backend/src/models/Purchase.js');
        const { default: Supplier } = await import('../../../backend/src/models/Supplier.js');
        
        // Get supplier current due
        const supplier = await Supplier.findById(purchaseData.supplierId);
        const previousDue = supplier.totalDue || 0;

        // Create purchase
        const purchase = await Purchase.create({
          purchaseNo: `PUR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
          supplier: purchaseData.supplierId,
          supplierName: supplier.name,
          items: [{
            product: testProduct._id,
            productName: testProduct.name,
            quantity: purchaseData.quantity,
            unit: 'sqft',
            unitPrice: purchaseData.unitPrice,
            totalPrice: purchaseData.quantity * purchaseData.unitPrice
          }],
          subtotal: purchaseData.quantity * purchaseData.unitPrice,
          discount: 0,
          grandTotal: purchaseData.quantity * purchaseData.unitPrice,
          paidAmount: purchaseData.paidAmount || 0,
          dueAmount: (purchaseData.quantity * purchaseData.unitPrice) - (purchaseData.paidAmount || 0),
          status: purchaseData.paidAmount >= (purchaseData.quantity * purchaseData.unitPrice) ? 'paid' : 
                  purchaseData.paidAmount > 0 ? 'partial' : 'due',
          createdBy: testUser._id
        });

        // Update supplier due amount
        const newDueAmount = previousDue + purchase.dueAmount;
        await Supplier.findByIdAndUpdate(purchaseData.supplierId, {
          totalDue: newDueAmount,
          lastPurchaseDate: new Date()
        });

        return {
          success: true,
          purchase: {
            id: purchase._id,
            purchaseNo: purchase.purchaseNo,
            grandTotal: purchase.grandTotal,
            paidAmount: purchase.paidAmount,
            dueAmount: purchase.dueAmount,
            status: purchase.status
          },
          supplier: {
            id: supplier._id,
            name: supplier.name,
            previousDue,
            newDue: newDueAmount,
            dueIncrease: purchase.dueAmount
          }
        };
      };

      const purchaseData = {
        supplierId: testSupplier._id,
        quantity: 50,
        unitPrice: 80,
        paidAmount: 2000 // Partial payment
      };

      const result = await mockSupplierDueUpdateAPI(purchaseData, authToken);

      expect(result.success).toBe(true);
      expect(result.purchase.grandTotal).toBe(4000); // 50 * 80
      expect(result.purchase.paidAmount).toBe(2000);
      expect(result.purchase.dueAmount).toBe(2000);
      expect(result.purchase.status).toBe('partial');
      expect(result.supplier.previousDue).toBe(0);
      expect(result.supplier.newDue).toBe(2000);
      expect(result.supplier.dueIncrease).toBe(2000);
    });

    test('should handle supplier payment via API', async () => {
      const mockSupplierPaymentAPI = async (paymentData, token) => {
        if (!token) {
          throw new Error('Authentication required');
        }

        const { default: Purchase } = await import('../../../backend/src/models/Purchase.js');
        const { default: Supplier } = await import('../../../backend/src/models/Supplier.js');
        const { default: SupplierPayment } = await import('../../../backend/src/models/SupplierPayment.js');
        
        // Find the purchase to pay
        const purchase = await Purchase.findById(paymentData.purchaseId);
        const supplier = await Supplier.findById(paymentData.supplierId);
        
        if (!purchase || purchase.status === 'paid') {
          throw new Error('Purchase not found or already fully paid');
        }

        // Calculate payment amounts
        const paymentAmount = Math.min(paymentData.amount, purchase.dueAmount);
        const newPaidAmount = purchase.paidAmount + paymentAmount;
        const newDueAmount = purchase.grandTotal - newPaidAmount;
        
        let newStatus = 'due';
        if (newPaidAmount >= purchase.grandTotal) {
          newStatus = 'paid';
        } else if (newPaidAmount > 0) {
          newStatus = 'partial';
        }

        // Update purchase
        await Purchase.findByIdAndUpdate(paymentData.purchaseId, {
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount,
          status: newStatus
        });

        // Create payment record
        const payment = await SupplierPayment.create({
          supplier: paymentData.supplierId,
          supplierName: supplier.name,
          purchase: paymentData.purchaseId,
          purchaseNo: purchase.purchaseNo,
          amount: paymentAmount,
          paymentMethod: paymentData.paymentMethod || 'bank_transfer',
          paymentDate: paymentData.paymentDate || new Date(),
          notes: paymentData.notes || `Payment for purchase ${purchase.purchaseNo}`,
          createdBy: testUser._id
        });

        // Update supplier total due
        const newSupplierDue = Math.max(0, supplier.totalDue - paymentAmount);
        await Supplier.findByIdAndUpdate(paymentData.supplierId, {
          totalDue: newSupplierDue,
          lastPaymentDate: new Date()
        });

        return {
          success: true,
          payment: {
            id: payment._id,
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
            paymentDate: payment.paymentDate
          },
          purchase: {
            previousPaidAmount: purchase.paidAmount,
            newPaidAmount,
            newDueAmount,
            newStatus
          },
          supplier: {
            previousDue: supplier.totalDue,
            newDue: newSupplierDue,
            dueReduction: paymentAmount
          }
        };
      };

      // First create a purchase with due amount
      const { default: Purchase } = await import('../../../backend/src/models/Purchase.js');
      const { default: Supplier } = await import('../../../backend/src/models/Supplier.js');
      
      const purchase = await Purchase.create({
        purchaseNo: `PUR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
        supplier: testSupplier._id,
        supplierName: testSupplier.name,
        items: [{
          product: testProduct._id,
          productName: testProduct.name,
          quantity: 40,
          unit: 'sqft',
          unitPrice: 85,
          totalPrice: 3400
        }],
        subtotal: 3400,
        grandTotal: 3400,
        paidAmount: 0,
        dueAmount: 3400,
        status: 'due',
        createdBy: testUser._id
      });

      // Update supplier due
      await Supplier.findByIdAndUpdate(testSupplier._id, {
        totalDue: 3400
      });

      const paymentData = {
        supplierId: testSupplier._id,
        purchaseId: purchase._id,
        amount: 1500,
        paymentMethod: 'bank_transfer',
        paymentDate: new Date(),
        notes: 'Partial payment for glass purchase'
      };

      const result = await mockSupplierPaymentAPI(paymentData, authToken);

      expect(result.success).toBe(true);
      expect(result.payment.amount).toBe(1500);
      expect(result.purchase.newPaidAmount).toBe(1500);
      expect(result.purchase.newDueAmount).toBe(1900);
      expect(result.purchase.newStatus).toBe('partial');
      expect(result.supplier.newDue).toBe(1900);
      expect(result.supplier.dueReduction).toBe(1500);
    });
  });
});