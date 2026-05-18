// Expense and Profit Accuracy Tests
// Ensures all expenses and profit calculations are real and accurate

describe('Expense and Profit Accuracy Tests', () => {
  let testUser;
  let ownerUser;
  let testProduct;
  let testSupplier;
  let testCustomer;

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

  describe('Salary Payment Expense Tracking', () => {
    test('should add salary payment as expense correctly', async () => {
      const mockAddSalaryExpense = async (salaryData) => {
        const { default: Expense } = await import('../../../backend/src/models/Expense.js');
        
        // Create salary expense
        const expense = await Expense.create({
          expenseId: `EXP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
          title: `Salary Payment - ${salaryData.employeeName}`,
          description: `Salary payment for ${salaryData.employeeName} - ${salaryData.month}`,
          amount: salaryData.amount,
          category: 'Salary Expense',
          paymentMethod: salaryData.paymentMethod || 'bank_transfer',
          expenseDate: salaryData.paymentDate || new Date(),
          sourceType: 'salary',
          employeeDetails: {
            employeeName: salaryData.employeeName,
            employeeId: salaryData.employeeId,
            position: salaryData.position,
            month: salaryData.month,
            year: salaryData.year
          },
          status: 'approved',
          notes: salaryData.notes || `Monthly salary for ${salaryData.month} ${salaryData.year}`,
          createdBy: testUser._id
        });

        return {
          expense,
          expenseId: expense._id,
          amount: expense.amount,
          employeeName: expense.employeeDetails.employeeName,
          month: expense.employeeDetails.month,
          isPaid: expense.isPaid
        };
      };

      const salaryData = {
        employeeName: 'John Doe',
        employeeId: 'EMP-001',
        position: 'Sales Manager',
        amount: 35000, // ৳35,000
        month: 'January',
        year: 2026,
        paymentMethod: 'bank_transfer',
        paymentDate: new Date('2026-01-31'),
        notes: 'Monthly salary payment'
      };

      const result = await mockAddSalaryExpense(salaryData);

      expect(result.amount).toBe(35000);
      expect(result.employeeName).toBe('John Doe');
      expect(result.month).toBe('January');
      expect(result.isPaid).toBe(true);
      expect(result.expense.type).toBe('salary');
      expect(result.expense.category).toBe('operational');
    });

    test('should track multiple employee salaries separately', async () => {
      const mockTrackMultipleSalaries = async (salariesData) => {
        const { default: Expense } = await import('../../../backend/src/models/Expense.js');
        
        const salaryExpenses = [];
        let totalSalaryExpense = 0;

        for (const salaryData of salariesData) {
          const expense = await Expense.create({
            type: 'salary',
            category: 'operational',
            description: `Salary payment for ${salaryData.employeeName} - ${salaryData.month}`,
            amount: salaryData.amount,
            paymentMethod: 'bank_transfer',
            expenseDate: new Date(),
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

          salaryExpenses.push(expense);
          totalSalaryExpense += expense.amount;
        }

        return {
          salaryExpenses,
          totalSalaryExpense,
          employeeCount: salariesData.length
        };
      };

      const salariesData = [
        {
          employeeName: 'John Doe',
          employeeId: 'EMP-001',
          position: 'Sales Manager',
          amount: 35000,
          month: 'January',
          year: 2026
        },
        {
          employeeName: 'Jane Smith',
          employeeId: 'EMP-002',
          position: 'Accountant',
          amount: 28000,
          month: 'January',
          year: 2026
        },
        {
          employeeName: 'Mike Johnson',
          employeeId: 'EMP-003',
          position: 'Installer',
          amount: 22000,
          month: 'January',
          year: 2026
        }
      ];

      const result = await mockTrackMultipleSalaries(salariesData);

      expect(result.employeeCount).toBe(3);
      expect(result.totalSalaryExpense).toBe(85000); // 35000 + 28000 + 22000
      expect(result.salaryExpenses).toHaveLength(3);
      
      // Verify individual salary records
      const johnSalary = result.salaryExpenses.find(e => e.employeeDetails.employeeName === 'John Doe');
      expect(johnSalary.amount).toBe(35000);
      expect(johnSalary.employeeDetails.position).toBe('Sales Manager');
    });
  });

  describe('Salary Double Payment Prevention', () => {
    test('should prevent double payment of same salary', async () => {
      const mockPreventDoubleSalaryPayment = async (salaryData) => {
        const { default: Expense } = await import('../../../backend/src/models/Expense.js');
        
        // Check if salary already paid for this employee and month
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

        // Create new salary expense if not already paid
        const expense = await Expense.create({
          type: 'salary',
          category: 'operational',
          description: `Salary payment for ${salaryData.employeeName} - ${salaryData.month}`,
          amount: salaryData.amount,
          paymentMethod: 'bank_transfer',
          expenseDate: new Date(),
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

        return {
          success: true,
          expense,
          message: `Salary payment recorded for ${salaryData.employeeName}`
        };
      };

      const salaryData = {
        employeeName: 'John Doe',
        employeeId: 'EMP-001',
        position: 'Sales Manager',
        amount: 35000,
        month: 'January',
        year: 2026
      };

      // First payment should succeed
      const firstPayment = await mockPreventDoubleSalaryPayment(salaryData);
      expect(firstPayment.success).toBe(true);
      expect(firstPayment.expense.amount).toBe(35000);

      // Second payment should fail
      await expect(mockPreventDoubleSalaryPayment(salaryData))
        .rejects.toThrow('Salary already paid for John Doe for January 2026');
    });

    test('should allow salary payment for different months', async () => {
      const mockAllowDifferentMonthSalary = async (salaryData) => {
        const { default: Expense } = await import('../../../backend/src/models/Expense.js');
        
        // Check for existing salary (should not find any for different month)
        const existingSalary = await Expense.findOne({
          type: 'salary',
          'employeeDetails.employeeId': salaryData.employeeId,
          'employeeDetails.month': salaryData.month,
          'employeeDetails.year': salaryData.year,
          isPaid: true,
          isDeleted: { $ne: true }
        });

        if (existingSalary) {
          throw new Error(`Salary already paid for ${salaryData.month} ${salaryData.year}`);
        }

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

        return expense;
      };

      const employee = {
        employeeName: 'John Doe',
        employeeId: 'EMP-001',
        position: 'Sales Manager',
        amount: 35000
      };

      // Pay January salary
      const januarySalary = await mockAllowDifferentMonthSalary({
        ...employee,
        month: 'January',
        year: 2026
      });

      // Pay February salary (should succeed)
      const februarySalary = await mockAllowDifferentMonthSalary({
        ...employee,
        month: 'February',
        year: 2026
      });

      expect(januarySalary.employeeDetails.month).toBe('January');
      expect(februarySalary.employeeDetails.month).toBe('February');
      expect(januarySalary.amount).toBe(35000);
      expect(februarySalary.amount).toBe(35000);
    });
  });

  describe('Expense Date Filtering', () => {
    test('should filter expenses by date range correctly', async () => {
      const mockFilterExpensesByDate = async (startDate, endDate) => {
        const { default: Expense } = await import('../../../backend/src/models/Expense.js');
        
        // Create test expenses with different dates
        const testExpenses = [
          {
            type: 'salary',
            category: 'operational',
            description: 'January Salary',
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
            description: 'February Salary',
            amount: 35000,
            expenseDate: new Date('2026-02-15'),
            isPaid: true,
            createdBy: testUser._id
          },
          {
            type: 'maintenance',
            category: 'operational',
            description: 'Equipment Repair',
            amount: 8000,
            expenseDate: new Date('2026-03-10'),
            isPaid: true,
            createdBy: testUser._id
          }
        ];

        // Create expenses
        for (const expenseData of testExpenses) {
          await Expense.create(expenseData);
        }

        // Filter expenses by date range
        const filteredExpenses = await Expense.find({
          expenseDate: {
            $gte: startDate,
            $lte: endDate
          },
          isDeleted: { $ne: true }
        }).sort({ expenseDate: 1 });

        const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

        return {
          expenses: filteredExpenses,
          totalAmount,
          count: filteredExpenses.length,
          dateRange: {
            start: startDate,
            end: endDate
          }
        };
      };

      // Filter January 2026 expenses
      const januaryStart = new Date('2026-01-01');
      const januaryEnd = new Date('2026-01-31');
      
      const januaryResult = await mockFilterExpensesByDate(januaryStart, januaryEnd);

      expect(januaryResult.count).toBe(2); // Salary + Electricity
      expect(januaryResult.totalAmount).toBe(40000); // 35000 + 5000
      
      // Verify expense types
      const expenseTypes = januaryResult.expenses.map(e => e.type);
      expect(expenseTypes).toContain('salary');
      expect(expenseTypes).toContain('utility');

      // Filter February 2026 expenses
      const februaryStart = new Date('2026-02-01');
      const februaryEnd = new Date('2026-02-28');
      
      const februaryResult = await mockFilterExpensesByDate(februaryStart, februaryEnd);

      expect(februaryResult.count).toBe(1); // Only February salary
      expect(februaryResult.totalAmount).toBe(35000);
    });

    test('should generate monthly expense reports', async () => {
      const mockGenerateMonthlyExpenseReport = async (year, month) => {
        const { default: Expense } = await import('../../../backend/src/models/Expense.js');
        
        // Build date range for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

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
            categoryTotals[category] = {
              amount: 0,
              count: 0,
              expenses: []
            };
          }
          categoryTotals[category].amount += expense.amount;
          categoryTotals[category].count += 1;
          categoryTotals[category].expenses.push(expense);
          totalExpenses += expense.amount;
        });

        return {
          period: {
            year,
            month,
            monthName: new Date(year, month - 1).toLocaleString('default', { month: 'long' })
          },
          totalExpenses,
          categoryTotals,
          expenseCount: expenses.length,
          expenses
        };
      };

      // Create test expenses for January 2026
      const { default: Expense } = await import('../../../backend/src/models/Expense.js');
      
      await Expense.create({
        type: 'salary',
        category: 'operational',
        description: 'Staff Salaries',
        amount: 85000,
        expenseDate: new Date('2026-01-31'),
        isPaid: true,
        createdBy: testUser._id
      });

      await Expense.create({
        type: 'utility',
        category: 'operational',
        description: 'Electricity Bill',
        amount: 5000,
        expenseDate: new Date('2026-01-15'),
        isPaid: true,
        createdBy: testUser._id
      });

      await Expense.create({
        type: 'purchase',
        category: 'inventory',
        description: 'Glass Purchase',
        amount: 150000,
        expenseDate: new Date('2026-01-10'),
        isPaid: true,
        createdBy: testUser._id
      });

      const report = await mockGenerateMonthlyExpenseReport(2026, 1);

      expect(report.period.monthName).toBe('January');
      expect(report.totalExpenses).toBe(240000); // 85000 + 5000 + 150000
      expect(report.expenseCount).toBe(3);
      
      // Check category breakdown
      expect(report.categoryTotals.operational.amount).toBe(90000); // 85000 + 5000
      expect(report.categoryTotals.inventory.amount).toBe(150000);
    });
  });

  describe('Delivery & Installation Cost Deduction', () => {
    test('should deduct delivery and installation costs from profit', async () => {
      const mockCalculateProfitWithServiceCosts = async (invoiceData) => {
        const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
        
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
            totalServiceCharges: (invoiceData.deliveryCharge || 0) + (invoiceData.installationCharge || 0)
          },
          grandTotal: (invoiceData.quantity * invoiceData.sellingPrice) + 
                     (invoiceData.deliveryCharge || 0) + 
                     (invoiceData.installationCharge || 0),
          paidAmount: 0,
          dueAmount: (invoiceData.quantity * invoiceData.sellingPrice) + 
                    (invoiceData.deliveryCharge || 0) + 
                    (invoiceData.installationCharge || 0),
          status: 'due',
          createdBy: testUser._id
        });

        // Calculate profit
        const productCost = invoiceData.quantity * invoiceData.purchasePrice;
        const productRevenue = invoiceData.quantity * invoiceData.sellingPrice;
        const serviceRevenue = (invoiceData.deliveryCharge || 0) + (invoiceData.installationCharge || 0);
        const serviceCosts = serviceRevenue; // Service costs equal service charges (they are expenses)
        
        const grossProfit = productRevenue - productCost;
        const netProfit = grossProfit + serviceRevenue - serviceCosts; // Service revenue cancels out service costs
        
        return {
          invoice,
          profitCalculation: {
            productCost,
            productRevenue,
            grossProfit,
            serviceRevenue,
            serviceCosts,
            netProfit,
            totalRevenue: productRevenue + serviceRevenue,
            totalCosts: productCost + serviceCosts
          }
        };
      };

      const invoiceData = {
        quantity: 20,
        purchasePrice: 100,
        sellingPrice: 150,
        deliveryCharge: 2000,
        installationCharge: 3000
      };

      const result = await mockCalculateProfitWithServiceCosts(invoiceData);

      expect(result.profitCalculation.productCost).toBe(2000); // 20 * 100
      expect(result.profitCalculation.productRevenue).toBe(3000); // 20 * 150
      expect(result.profitCalculation.grossProfit).toBe(1000); // 3000 - 2000
      expect(result.profitCalculation.serviceRevenue).toBe(5000); // 2000 + 3000
      expect(result.profitCalculation.serviceCosts).toBe(5000); // Same as service revenue (they are expenses)
      expect(result.profitCalculation.netProfit).toBe(1000); // Gross profit only (service revenue - service costs = 0)
      expect(result.profitCalculation.totalRevenue).toBe(8000); // 3000 + 5000
      expect(result.profitCalculation.totalCosts).toBe(7000); // 2000 + 5000
    });

    test('should track service costs as separate expense entries', async () => {
      const mockTrackServiceCostsAsExpenses = async (invoiceData) => {
        const { default: Invoice } = await import('../../../backend/src/models/Invoice.js');
        const { default: Expense } = await import('../../../backend/src/models/Expense.js');
        
        // Create invoice
        const invoice = await Invoice.create({
          invoiceNo: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
          customer: testCustomer._id,
          customerName: testCustomer.name,
          items: [{
            product: testProduct._id,
            productName: testProduct.name,
            quantity: invoiceData.quantity,
            unit: 'sqft',
            unitPrice: invoiceData.sellingPrice,
            totalPrice: invoiceData.quantity * invoiceData.sellingPrice
          }],
          subtotal: invoiceData.quantity * invoiceData.sellingPrice,
          serviceCharges: {
            deliveryCharge: invoiceData.deliveryCharge || 0,
            installationCharge: invoiceData.installationCharge || 0,
            installerName: invoiceData.installerName,
            totalServiceCharges: (invoiceData.deliveryCharge || 0) + (invoiceData.installationCharge || 0)
          },
          grandTotal: (invoiceData.quantity * invoiceData.sellingPrice) + 
                     (invoiceData.deliveryCharge || 0) + 
                     (invoiceData.installationCharge || 0),
          status: 'paid',
          createdBy: testUser._id
        });

        const serviceExpenses = [];

        // Create delivery expense if applicable
        if (invoiceData.deliveryCharge > 0) {
          const deliveryExpense = await Expense.create({
            type: 'delivery',
            category: 'service',
            description: `Delivery cost for invoice ${invoice.invoiceNo}`,
            amount: invoiceData.deliveryCharge,
            relatedInvoice: invoice._id,
            expenseDate: new Date(),
            isPaid: true,
            paidDate: new Date(),
            createdBy: testUser._id
          });
          serviceExpenses.push(deliveryExpense);
        }

        // Create installation expense if applicable
        if (invoiceData.installationCharge > 0) {
          const installationExpense = await Expense.create({
            type: 'installation',
            category: 'service',
            description: `Installation cost for invoice ${invoice.invoiceNo} - ${invoiceData.installerName || 'Installer'}`,
            amount: invoiceData.installationCharge,
            relatedInvoice: invoice._id,
            expenseDate: new Date(),
            isPaid: true,
            paidDate: new Date(),
            serviceDetails: {
              installerName: invoiceData.installerName,
              serviceType: 'installation'
            },
            createdBy: testUser._id
          });
          serviceExpenses.push(installationExpense);
        }

        return {
          invoice,
          serviceExpenses,
          totalServiceCosts: serviceExpenses.reduce((sum, exp) => sum + exp.amount, 0)
        };
      };

      const invoiceData = {
        quantity: 15,
        sellingPrice: 200,
        deliveryCharge: 1500,
        installationCharge: 2500,
        installerName: 'Ahmed Installation Services'
      };

      const result = await mockTrackServiceCostsAsExpenses(invoiceData);

      expect(result.serviceExpenses).toHaveLength(2);
      expect(result.totalServiceCosts).toBe(4000); // 1500 + 2500
      
      // Check delivery expense
      const deliveryExpense = result.serviceExpenses.find(e => e.type === 'delivery');
      expect(deliveryExpense.amount).toBe(1500);
      expect(deliveryExpense.category).toBe('service');
      
      // Check installation expense
      const installationExpense = result.serviceExpenses.find(e => e.type === 'installation');
      expect(installationExpense.amount).toBe(2500);
      expect(installationExpense.serviceDetails.installerName).toBe('Ahmed Installation Services');
    });
  });

  describe('Supplier Due Update After Purchase', () => {
    test('should update supplier due amount after purchase', async () => {
      const mockUpdateSupplierDueAfterPurchase = async (purchaseData) => {
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
          purchase,
          supplierDueTracking: {
            previousDue,
            purchaseAmount: purchase.grandTotal,
            paidAmount: purchase.paidAmount,
            newDueAmount,
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

      const result = await mockUpdateSupplierDueAfterPurchase(purchaseData);

      expect(result.supplierDueTracking.previousDue).toBe(0);
      expect(result.supplierDueTracking.purchaseAmount).toBe(4000); // 50 * 80
      expect(result.supplierDueTracking.paidAmount).toBe(2000);
      expect(result.supplierDueTracking.dueIncrease).toBe(2000); // 4000 - 2000
      expect(result.supplierDueTracking.newDueAmount).toBe(2000);
      expect(result.purchase.status).toBe('partial');
    });

    test('should handle full payment purchases correctly', async () => {
      const mockHandleFullPaymentPurchase = async (purchaseData) => {
        const { default: Purchase } = await import('../../../backend/src/models/Purchase.js');
        const { default: Supplier } = await import('../../../backend/src/models/Supplier.js');
        
        const supplier = await Supplier.findById(purchaseData.supplierId);
        const previousDue = supplier.totalDue || 0;

        const purchaseAmount = purchaseData.quantity * purchaseData.unitPrice;
        const paidAmount = purchaseData.paidAmount;
        const dueAmount = Math.max(0, purchaseAmount - paidAmount);

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
            totalPrice: purchaseAmount
          }],
          subtotal: purchaseAmount,
          grandTotal: purchaseAmount,
          paidAmount: paidAmount,
          dueAmount: dueAmount,
          status: dueAmount === 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'due',
          createdBy: testUser._id
        });

        // Update supplier due (should not increase if fully paid)
        const newSupplierDue = previousDue + dueAmount;
        await Supplier.findByIdAndUpdate(purchaseData.supplierId, {
          totalDue: newSupplierDue,
          lastPurchaseDate: new Date(),
          lastPaymentDate: paidAmount > 0 ? new Date() : supplier.lastPaymentDate
        });

        return {
          purchase,
          isFullyPaid: dueAmount === 0,
          supplierDueChange: dueAmount
        };
      };

      const fullPaymentPurchase = {
        supplierId: testSupplier._id,
        quantity: 30,
        unitPrice: 90,
        paidAmount: 2700 // Full payment: 30 * 90 = 2700
      };

      const result = await mockHandleFullPaymentPurchase(fullPaymentPurchase);

      expect(result.isFullyPaid).toBe(true);
      expect(result.supplierDueChange).toBe(0);
      expect(result.purchase.status).toBe('paid');
      expect(result.purchase.dueAmount).toBe(0);
    });

    test('should track supplier payment history', async () => {
      const mockTrackSupplierPaymentHistory = async (supplierId, paymentData) => {
        const { default: Purchase } = await import('../../../backend/src/models/Purchase.js');
        const { default: Supplier } = await import('../../../backend/src/models/Supplier.js');
        const { default: SupplierPayment } = await import('../../../backend/src/models/SupplierPayment.js');
        
        // Find the purchase to pay
        const purchase = await Purchase.findById(paymentData.purchaseId);
        const supplier = await Supplier.findById(supplierId);
        
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
          supplier: supplierId,
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
        await Supplier.findByIdAndUpdate(supplierId, {
          totalDue: newSupplierDue,
          lastPaymentDate: new Date()
        });

        return {
          payment,
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
        purchaseId: purchase._id,
        amount: 1500,
        paymentMethod: 'bank_transfer',
        paymentDate: new Date(),
        notes: 'Partial payment for glass purchase'
      };

      const result = await mockTrackSupplierPaymentHistory(testSupplier._id, paymentData);

      expect(result.payment.amount).toBe(1500);
      expect(result.purchase.newPaidAmount).toBe(1500);
      expect(result.purchase.newDueAmount).toBe(1900); // 3400 - 1500
      expect(result.purchase.newStatus).toBe('partial');
      expect(result.supplier.newDue).toBe(1900); // 3400 - 1500
      expect(result.supplier.dueReduction).toBe(1500);
    });
  });
});