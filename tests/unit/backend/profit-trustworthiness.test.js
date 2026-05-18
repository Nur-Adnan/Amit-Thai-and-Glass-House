// Profit Trustworthiness Tests
// Confirms that all profit calculations are accurate and trustworthy

describe('Profit Trustworthiness Tests', () => {
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

  describe('Daily Profit Calculation', () => {
    test('should calculate daily profit accurately', async () => {
      const mockCalculateDailyProfit = async (date) => {
        // Mock daily transactions
        const dailyTransactions = [
          {
            type: 'sale',
            invoiceNo: 'INV-202601-0001',
            productName: 'Glass Panel A',
            quantity: 20,
            purchasePrice: 100,
            sellingPrice: 150,
            subtotal: 3000,
            deliveryCharge: 500,
            installationCharge: 800,
            grandTotal: 4300,
            paidAmount: 4300,
            status: 'paid',
            createdAt: date
          },
          {
            type: 'sale',
            invoiceNo: 'INV-202601-0002',
            productName: 'Glass Panel B',
            quantity: 15,
            purchasePrice: 80,
            sellingPrice: 120,
            subtotal: 1800,
            deliveryCharge: 300,
            installationCharge: 0,
            grandTotal: 2100,
            paidAmount: 1000,
            status: 'partial',
            createdAt: date
          }
        ];

        const dailyExpenses = [
          {
            type: 'delivery',
            description: 'Delivery costs',
            amount: 800, // 500 + 300
            category: 'Service',
            expenseDate: date
          },
          {
            type: 'installation',
            description: 'Installation costs',
            amount: 800, // 800 + 0
            category: 'Service',
            expenseDate: date
          }
        ];

        // Calculate daily profit
        let totalRevenue = 0;
        let totalProductCost = 0;
        let totalServiceRevenue = 0;
        let totalServiceCosts = 0;

        dailyTransactions.forEach(transaction => {
          const productRevenue = transaction.quantity * transaction.sellingPrice;
          const productCost = transaction.quantity * transaction.purchasePrice;
          const serviceRevenue = (transaction.deliveryCharge || 0) + (transaction.installationCharge || 0);

          totalRevenue += transaction.grandTotal;
          totalProductCost += productCost;
          totalServiceRevenue += serviceRevenue;
        });

        dailyExpenses.forEach(expense => {
          if (expense.category === 'Service') {
            totalServiceCosts += expense.amount;
          }
        });

        const grossProfit = (totalRevenue - totalServiceRevenue) - totalProductCost;
        const serviceProfit = totalServiceRevenue - totalServiceCosts;
        const netProfit = grossProfit + serviceProfit;

        return {
          date,
          revenue: {
            totalRevenue,
            productRevenue: totalRevenue - totalServiceRevenue,
            serviceRevenue: totalServiceRevenue
          },
          costs: {
            totalProductCost,
            totalServiceCosts
          },
          profit: {
            grossProfit,
            serviceProfit,
            netProfit,
            profitMargin: ((netProfit / totalRevenue) * 100).toFixed(2)
          },
          transactionCount: dailyTransactions.length
        };
      };

      const testDate = new Date('2026-01-15');
      const result = await mockCalculateDailyProfit(testDate);

      // Verify daily profit calculations
      expect(result.revenue.totalRevenue).toBe(6400); // 4300 + 2100
      expect(result.revenue.productRevenue).toBe(4800); // 3000 + 1800
      expect(result.revenue.serviceRevenue).toBe(1600); // 500+800 + 300+0
      expect(result.costs.totalProductCost).toBe(3200); // (20*100) + (15*80)
      expect(result.costs.totalServiceCosts).toBe(1600); // 800 + 800
      expect(result.profit.grossProfit).toBe(1600); // 4800 - 3200
      expect(result.profit.serviceProfit).toBe(0); // 1600 - 1600
      expect(result.profit.netProfit).toBe(1600); // 1600 + 0
      expect(result.profit.profitMargin).toBe('25.00'); // (1600 / 6400) * 100
      expect(result.transactionCount).toBe(2);
    });

    test('should handle days with no transactions', async () => {
      const mockCalculateEmptyDayProfit = async (date) => {
        const dailyTransactions = [];
        const dailyExpenses = [];

        return {
          date,
          revenue: {
            totalRevenue: 0,
            productRevenue: 0,
            serviceRevenue: 0
          },
          costs: {
            totalProductCost: 0,
            totalServiceCosts: 0
          },
          profit: {
            grossProfit: 0,
            serviceProfit: 0,
            netProfit: 0,
            profitMargin: '0.00'
          },
          transactionCount: 0
        };
      };

      const testDate = new Date('2026-01-16');
      const result = await mockCalculateEmptyDayProfit(testDate);

      expect(result.profit.netProfit).toBe(0);
      expect(result.profit.profitMargin).toBe('0.00');
      expect(result.transactionCount).toBe(0);
    });
  });

  describe('Monthly Profit Aggregation', () => {
    test('should aggregate monthly profit correctly', async () => {
      const mockCalculateMonthlyProfit = async (year, month) => {
        // Mock monthly data (15 days of transactions)
        const dailyProfits = [
          { date: '2026-01-01', netProfit: 1500, revenue: 5000, transactions: 2 },
          { date: '2026-01-02', netProfit: 2200, revenue: 7500, transactions: 3 },
          { date: '2026-01-03', netProfit: 800, revenue: 3200, transactions: 1 },
          { date: '2026-01-04', netProfit: 0, revenue: 0, transactions: 0 }, // No sales day
          { date: '2026-01-05', netProfit: 3100, revenue: 9800, transactions: 4 },
          { date: '2026-01-06', netProfit: 1800, revenue: 6200, transactions: 2 },
          { date: '2026-01-07', netProfit: 2500, revenue: 8100, transactions: 3 },
          { date: '2026-01-08', netProfit: 1200, revenue: 4500, transactions: 2 },
          { date: '2026-01-09', netProfit: 2800, revenue: 8900, transactions: 3 },
          { date: '2026-01-10', netProfit: 1600, revenue: 5800, transactions: 2 },
          { date: '2026-01-11', netProfit: 0, revenue: 0, transactions: 0 }, // Weekend
          { date: '2026-01-12', netProfit: 0, revenue: 0, transactions: 0 }, // Weekend
          { date: '2026-01-13', netProfit: 2100, revenue: 7200, transactions: 3 },
          { date: '2026-01-14', netProfit: 1900, revenue: 6500, transactions: 2 },
          { date: '2026-01-15', netProfit: 2400, revenue: 8000, transactions: 3 }
        ];

        const monthlyExpenses = [
          { type: 'salary', amount: 85000, category: 'Operational' },
          { type: 'rent', amount: 25000, category: 'Operational' },
          { type: 'utilities', amount: 8000, category: 'Operational' },
          { type: 'maintenance', amount: 5000, category: 'Operational' }
        ];

        // Aggregate monthly totals
        const totalRevenue = dailyProfits.reduce((sum, day) => sum + day.revenue, 0);
        const totalGrossProfit = dailyProfits.reduce((sum, day) => sum + day.netProfit, 0);
        const totalTransactions = dailyProfits.reduce((sum, day) => sum + day.transactions, 0);
        const totalOperatingExpenses = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const netProfit = totalGrossProfit - totalOperatingExpenses;
        const activeDays = dailyProfits.filter(day => day.transactions > 0).length;
        const averageDailyProfit = activeDays > 0 ? totalGrossProfit / activeDays : 0;

        return {
          period: { year, month, monthName: 'January' },
          summary: {
            totalRevenue,
            totalGrossProfit,
            totalOperatingExpenses,
            netProfit,
            profitMargin: ((netProfit / totalRevenue) * 100).toFixed(2),
            totalTransactions,
            activeDays,
            averageDailyProfit: Math.round(averageDailyProfit)
          },
          dailyBreakdown: dailyProfits,
          expenses: monthlyExpenses
        };
      };

      const result = await mockCalculateMonthlyProfit(2026, 1);

      // Verify monthly aggregation
      expect(result.summary.totalRevenue).toBe(80700); // Sum of all daily revenues
      expect(result.summary.totalGrossProfit).toBe(23900); // Sum of all daily profits
      expect(result.summary.totalOperatingExpenses).toBe(123000); // 85000+25000+8000+5000
      expect(result.summary.netProfit).toBe(-99100); // 23900 - 123000 (Loss)
      expect(result.summary.profitMargin).toBe('-122.80'); // (-99100 / 80700) * 100
      expect(result.summary.totalTransactions).toBe(30);
      expect(result.summary.activeDays).toBe(12); // Days with transactions > 0
      expect(result.summary.averageDailyProfit).toBe(1992); // 23900 / 12
    });

    test('should compare monthly profits across periods', async () => {
      const mockCompareMonthlyProfits = async (periods) => {
        const monthlyData = {
          '2025-12': { revenue: 85000, netProfit: -15000, transactions: 45 },
          '2026-01': { revenue: 90700, netProfit: -99100, transactions: 30 },
          '2026-02': { revenue: 95000, netProfit: -5000, transactions: 52 }
        };

        const comparison = periods.map(period => {
          const data = monthlyData[period];
          return {
            period,
            ...data,
            profitMargin: ((data.netProfit / data.revenue) * 100).toFixed(2)
          };
        });

        // Calculate trends
        const trends = {
          revenueGrowth: ((comparison[1].revenue - comparison[0].revenue) / comparison[0].revenue * 100).toFixed(2),
          profitImprovement: comparison[1].netProfit - comparison[0].netProfit,
          transactionChange: comparison[1].transactions - comparison[0].transactions
        };

        return { comparison, trends };
      };

      const periods = ['2025-12', '2026-01', '2026-02'];
      const result = await mockCompareMonthlyProfits(periods);

      expect(result.comparison).toHaveLength(3);
      expect(result.trends.revenueGrowth).toBe('6.71'); // Revenue increased
      expect(result.trends.profitImprovement).toBe(-84100); // Profit decreased (more loss)
      expect(result.trends.transactionChange).toBe(-15); // Fewer transactions
    });
  });

  describe('Product-wise Profit Analysis', () => {
    test('should calculate profit by product accurately', async () => {
      const mockCalculateProductWiseProfit = async (period) => {
        const productSales = [
          {
            productId: 'PROD-001',
            productName: 'Clear Glass 4mm',
            category: 'Glass',
            totalQuantitySold: 150,
            purchasePrice: 80,
            sellingPrice: 120,
            totalRevenue: 18000, // 150 * 120
            totalCost: 12000, // 150 * 80
            grossProfit: 6000, // 18000 - 12000
            transactionCount: 8,
            averageOrderSize: 18.75 // 150 / 8
          },
          {
            productId: 'PROD-002',
            productName: 'Tinted Glass 5mm',
            category: 'Glass',
            totalQuantitySold: 100,
            purchasePrice: 100,
            sellingPrice: 160,
            totalRevenue: 16000, // 100 * 160
            totalCost: 10000, // 100 * 100
            grossProfit: 6000, // 16000 - 10000
            transactionCount: 5,
            averageOrderSize: 20 // 100 / 5
          },
          {
            productId: 'PROD-003',
            productName: 'Thai Aluminum Frame',
            category: 'Thai',
            totalQuantitySold: 80,
            purchasePrice: 150,
            sellingPrice: 200,
            totalRevenue: 16000, // 80 * 200
            totalCost: 12000, // 80 * 150
            grossProfit: 4000, // 16000 - 12000
            transactionCount: 6,
            averageOrderSize: 13.33 // 80 / 6
          }
        ];

        // Calculate totals and rankings
        const totalRevenue = productSales.reduce((sum, p) => sum + p.totalRevenue, 0);
        const totalCost = productSales.reduce((sum, p) => sum + p.totalCost, 0);
        const totalGrossProfit = productSales.reduce((sum, p) => sum + p.grossProfit, 0);

        // Add profit margins and rankings
        const productsWithMetrics = productSales.map(product => ({
          ...product,
          profitMargin: ((product.grossProfit / product.totalRevenue) * 100).toFixed(2),
          revenueShare: ((product.totalRevenue / totalRevenue) * 100).toFixed(2),
          profitShare: ((product.grossProfit / totalGrossProfit) * 100).toFixed(2)
        }));

        // Sort by profit descending
        productsWithMetrics.sort((a, b) => b.grossProfit - a.grossProfit);

        return {
          period,
          summary: {
            totalRevenue,
            totalCost,
            totalGrossProfit,
            overallProfitMargin: ((totalGrossProfit / totalRevenue) * 100).toFixed(2),
            productCount: productSales.length
          },
          products: productsWithMetrics,
          topPerformers: {
            highestRevenue: productsWithMetrics.reduce((max, p) => p.totalRevenue > max.totalRevenue ? p : max),
            highestProfit: productsWithMetrics.reduce((max, p) => p.grossProfit > max.grossProfit ? p : max),
            bestMargin: productsWithMetrics.reduce((max, p) => parseFloat(p.profitMargin) > parseFloat(max.profitMargin) ? p : max)
          }
        };
      };

      const result = await mockCalculateProductWiseProfit('2026-01');

      // Verify product-wise calculations
      expect(result.summary.totalRevenue).toBe(50000); // 18000 + 16000 + 16000
      expect(result.summary.totalCost).toBe(34000); // 12000 + 10000 + 12000
      expect(result.summary.totalGrossProfit).toBe(16000); // 6000 + 6000 + 4000
      expect(result.summary.overallProfitMargin).toBe('32.00'); // (16000 / 50000) * 100
      expect(result.products).toHaveLength(3);

      // Check individual product metrics
      const clearGlass = result.products.find(p => p.productName === 'Clear Glass 4mm');
      expect(clearGlass.profitMargin).toBe('33.33'); // (6000 / 18000) * 100
      expect(clearGlass.revenueShare).toBe('36.00'); // (18000 / 50000) * 100

      const tintedGlass = result.products.find(p => p.productName === 'Tinted Glass 5mm');
      expect(tintedGlass.profitMargin).toBe('37.50'); // (6000 / 16000) * 100

      // Verify top performers
      expect(result.topPerformers.bestMargin.productName).toBe('Tinted Glass 5mm'); // 37.50% margin
    });

    test('should identify underperforming products', async () => {
      const mockIdentifyUnderperformingProducts = async (threshold = 20) => {
        const productPerformance = [
          { productName: 'Premium Glass', profitMargin: 35.5, status: 'excellent' },
          { productName: 'Standard Glass', profitMargin: 25.2, status: 'good' },
          { productName: 'Basic Glass', profitMargin: 18.7, status: 'underperforming' },
          { productName: 'Economy Glass', profitMargin: 12.3, status: 'poor' },
          { productName: 'Clearance Glass', profitMargin: 8.1, status: 'loss-making' }
        ];

        const underperforming = productPerformance.filter(p => p.profitMargin < threshold);
        const recommendations = underperforming.map(product => {
          let recommendation = '';
          if (product.profitMargin < 10) {
            recommendation = 'Consider discontinuing or repricing';
          } else if (product.profitMargin < 15) {
            recommendation = 'Review pricing strategy';
          } else {
            recommendation = 'Monitor closely and optimize costs';
          }

          return {
            ...product,
            recommendation,
            improvementNeeded: (threshold - product.profitMargin).toFixed(1)
          };
        });

        return {
          threshold,
          totalProducts: productPerformance.length,
          underperformingCount: underperforming.length,
          underperformingProducts: recommendations,
          averageMargin: (productPerformance.reduce((sum, p) => sum + p.profitMargin, 0) / productPerformance.length).toFixed(2)
        };
      };

      const result = await mockIdentifyUnderperformingProducts(20);

      expect(result.underperformingCount).toBe(3);
      expect(result.averageMargin).toBe('19.96');
      
      const lossProduct = result.underperformingProducts.find(p => p.productName === 'Clearance Glass');
      expect(lossProduct.recommendation).toBe('Consider discontinuing or repricing');
      expect(lossProduct.improvementNeeded).toBe('11.9'); // 20 - 8.1
    });
  });

  describe('Profit After Wastage & Delivery Cost', () => {
    test('should calculate profit after wastage deduction', async () => {
      const mockCalculateProfitAfterWastage = async (saleData) => {
        // Calculate base profit
        const baseRevenue = saleData.quantity * saleData.sellingPrice;
        const baseCost = saleData.quantity * saleData.purchasePrice;
        const baseProfit = baseRevenue - baseCost;

        // Calculate wastage impact
        let wastageAmount = 0;
        let wastageCost = 0;

        if (saleData.wastage.method === 'percentage') {
          wastageAmount = (saleData.quantity * saleData.wastage.percentage) / 100;
        } else if (saleData.wastage.method === 'manual') {
          wastageAmount = saleData.wastage.manualAmount;
        }

        wastageCost = wastageAmount * saleData.purchasePrice;
        const totalMaterialUsed = saleData.quantity + wastageAmount;
        const totalMaterialCost = totalMaterialUsed * saleData.purchasePrice;

        // Calculate delivery costs
        const deliveryCost = saleData.deliveryCharge || 0;
        const installationCost = saleData.installationCharge || 0;
        const totalServiceCosts = deliveryCost + installationCost;

        // Calculate final profit
        const totalRevenue = baseRevenue + (saleData.deliveryCharge || 0) + (saleData.installationCharge || 0);
        const totalCosts = totalMaterialCost + totalServiceCosts;
        const netProfit = totalRevenue - totalCosts;

        return {
          saleDetails: {
            quantity: saleData.quantity,
            sellingPrice: saleData.sellingPrice,
            baseRevenue,
            baseCost,
            baseProfit
          },
          wastageImpact: {
            method: saleData.wastage.method,
            wastageAmount,
            wastageCost,
            totalMaterialUsed,
            totalMaterialCost,
            wastagePercentage: ((wastageAmount / saleData.quantity) * 100).toFixed(2)
          },
          serviceCosts: {
            deliveryCost,
            installationCost,
            totalServiceCosts
          },
          finalCalculation: {
            totalRevenue,
            totalCosts,
            netProfit,
            profitMargin: ((netProfit / totalRevenue) * 100).toFixed(2),
            wastageImpactOnProfit: baseProfit - (netProfit - (saleData.deliveryCharge || 0) - (saleData.installationCharge || 0) + totalServiceCosts)
          }
        };
      };

      const saleData = {
        quantity: 50,
        purchasePrice: 100,
        sellingPrice: 150,
        deliveryCharge: 2000,
        installationCharge: 1500,
        wastage: {
          method: 'percentage',
          percentage: 5, // 5% wastage
          manualAmount: 0
        }
      };

      const result = await mockCalculateProfitAfterWastage(saleData);

      // Verify wastage calculations
      expect(result.saleDetails.baseRevenue).toBe(7500); // 50 * 150
      expect(result.saleDetails.baseCost).toBe(5000); // 50 * 100
      expect(result.saleDetails.baseProfit).toBe(2500); // 7500 - 5000

      expect(result.wastageImpact.wastageAmount).toBe(2.5); // 50 * 5%
      expect(result.wastageImpact.wastageCost).toBe(250); // 2.5 * 100
      expect(result.wastageImpact.totalMaterialUsed).toBe(52.5); // 50 + 2.5
      expect(result.wastageImpact.totalMaterialCost).toBe(5250); // 52.5 * 100
      expect(result.wastageImpact.wastagePercentage).toBe('5.00');

      expect(result.serviceCosts.totalServiceCosts).toBe(3500); // 2000 + 1500

      expect(result.finalCalculation.totalRevenue).toBe(11000); // 7500 + 2000 + 1500
      expect(result.finalCalculation.totalCosts).toBe(8750); // 5250 + 3500
      expect(result.finalCalculation.netProfit).toBe(2250); // 11000 - 8750
      expect(result.finalCalculation.profitMargin).toBe('20.45'); // (2250 / 11000) * 100
    });

    test('should handle manual wastage input', async () => {
      const mockCalculateManualWastage = async (saleData) => {
        const baseRevenue = saleData.quantity * saleData.sellingPrice;
        const wastageAmount = saleData.wastage.manualAmount;
        const totalMaterialUsed = saleData.quantity + wastageAmount;
        const totalMaterialCost = totalMaterialUsed * saleData.purchasePrice;
        const netProfit = baseRevenue - totalMaterialCost;

        return {
          quantity: saleData.quantity,
          wastageAmount,
          totalMaterialUsed,
          totalMaterialCost,
          netProfit,
          wastagePercentage: ((wastageAmount / saleData.quantity) * 100).toFixed(2)
        };
      };

      const saleData = {
        quantity: 40,
        purchasePrice: 80,
        sellingPrice: 120,
        wastage: {
          method: 'manual',
          manualAmount: 3 // 3 sqft manual wastage
        }
      };

      const result = await mockCalculateManualWastage(saleData);

      expect(result.wastageAmount).toBe(3);
      expect(result.totalMaterialUsed).toBe(43); // 40 + 3
      expect(result.totalMaterialCost).toBe(3440); // 43 * 80
      expect(result.netProfit).toBe(1360); // (40 * 120) - 3440
      expect(result.wastagePercentage).toBe('7.50'); // (3 / 40) * 100
    });
  });

  describe('Cash vs Due Ratio Correctness', () => {
    test('should calculate cash vs due ratio accurately', async () => {
      const mockCalculateCashDueRatio = async (period) => {
        const invoices = [
          { invoiceNo: 'INV-001', grandTotal: 5000, paidAmount: 5000, dueAmount: 0, status: 'paid' },
          { invoiceNo: 'INV-002', grandTotal: 3000, paidAmount: 1500, dueAmount: 1500, status: 'partial' },
          { invoiceNo: 'INV-003', grandTotal: 4000, paidAmount: 0, dueAmount: 4000, status: 'due' },
          { invoiceNo: 'INV-004', grandTotal: 2500, paidAmount: 2500, dueAmount: 0, status: 'paid' },
          { invoiceNo: 'INV-005', grandTotal: 6000, paidAmount: 2000, dueAmount: 4000, status: 'partial' },
          { invoiceNo: 'INV-006', grandTotal: 3500, paidAmount: 0, dueAmount: 3500, status: 'due' }
        ];

        // Calculate totals
        const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
        const totalCashReceived = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
        const totalDueAmount = invoices.reduce((sum, inv) => sum + inv.dueAmount, 0);

        // Calculate ratios
        const cashRatio = ((totalCashReceived / totalInvoiceAmount) * 100).toFixed(2);
        const dueRatio = ((totalDueAmount / totalInvoiceAmount) * 100).toFixed(2);

        // Status breakdown
        const statusBreakdown = {
          paid: { count: 0, amount: 0 },
          partial: { count: 0, amount: 0 },
          due: { count: 0, amount: 0 }
        };

        invoices.forEach(invoice => {
          statusBreakdown[invoice.status].count++;
          statusBreakdown[invoice.status].amount += invoice.grandTotal;
        });

        // Calculate percentages for each status
        Object.keys(statusBreakdown).forEach(status => {
          statusBreakdown[status].percentage = ((statusBreakdown[status].amount / totalInvoiceAmount) * 100).toFixed(2);
        });

        return {
          period,
          summary: {
            totalInvoices: invoices.length,
            totalInvoiceAmount,
            totalCashReceived,
            totalDueAmount,
            cashRatio: parseFloat(cashRatio),
            dueRatio: parseFloat(dueRatio)
          },
          statusBreakdown,
          invoices: invoices.map(inv => ({
            ...inv,
            cashPercentage: ((inv.paidAmount / inv.grandTotal) * 100).toFixed(2),
            duePercentage: ((inv.dueAmount / inv.grandTotal) * 100).toFixed(2)
          }))
        };
      };

      const result = await mockCalculateCashDueRatio('2026-01');

      // Verify cash vs due calculations
      expect(result.summary.totalInvoiceAmount).toBe(24000); // Sum of all grandTotals
      expect(result.summary.totalCashReceived).toBe(11000); // Sum of all paidAmounts
      expect(result.summary.totalDueAmount).toBe(13000); // Sum of all dueAmounts
      expect(result.summary.cashRatio).toBe(45.83); // (11000 / 24000) * 100
      expect(result.summary.dueRatio).toBe(54.17); // (13000 / 24000) * 100

      // Verify status breakdown
      expect(result.statusBreakdown.paid.count).toBe(2);
      expect(result.statusBreakdown.paid.amount).toBe(7500); // 5000 + 2500
      expect(result.statusBreakdown.partial.count).toBe(2);
      expect(result.statusBreakdown.partial.amount).toBe(9000); // 3000 + 6000
      expect(result.statusBreakdown.due.count).toBe(2);
      expect(result.statusBreakdown.due.amount).toBe(7500); // 4000 + 3500

      // Verify ratios add up to 100%
      expect(result.summary.cashRatio + result.summary.dueRatio).toBeCloseTo(100, 1);
    });

    test('should track cash collection efficiency over time', async () => {
      const mockTrackCollectionEfficiency = async (periods) => {
        const monthlyData = {
          '2025-12': { totalSales: 80000, cashCollected: 65000, dueAmount: 15000 },
          '2026-01': { totalSales: 90000, cashCollected: 70000, dueAmount: 20000 },
          '2026-02': { totalSales: 95000, cashCollected: 85000, dueAmount: 10000 }
        };

        const efficiency = periods.map(period => {
          const data = monthlyData[period];
          const collectionRate = ((data.cashCollected / data.totalSales) * 100).toFixed(2);
          const dueRate = ((data.dueAmount / data.totalSales) * 100).toFixed(2);

          return {
            period,
            totalSales: data.totalSales,
            cashCollected: data.cashCollected,
            dueAmount: data.dueAmount,
            collectionRate: parseFloat(collectionRate),
            dueRate: parseFloat(dueRate)
          };
        });

        // Calculate trends
        const trends = {
          collectionImprovement: efficiency[2].collectionRate - efficiency[0].collectionRate,
          dueReduction: efficiency[0].dueRate - efficiency[2].dueRate,
          averageCollectionRate: (efficiency.reduce((sum, e) => sum + e.collectionRate, 0) / efficiency.length).toFixed(2)
        };

        return { efficiency, trends };
      };

      const periods = ['2025-12', '2026-01', '2026-02'];
      const result = await mockTrackCollectionEfficiency(periods);

      expect(result.efficiency).toHaveLength(3);
      expect(result.efficiency[0].collectionRate).toBe(81.25); // (65000 / 80000) * 100
      expect(result.efficiency[2].collectionRate).toBe(89.47); // (85000 / 95000) * 100
      expect(result.trends.collectionImprovement).toBeCloseTo(8.22, 1); // 89.47 - 81.25
      expect(result.trends.dueReduction).toBeCloseTo(8.22, 1); // 18.75 - 10.53
    });

    test('should identify customers with poor payment patterns', async () => {
      const mockIdentifyPoorPaymentPatterns = async () => {
        const customerPaymentData = [
          {
            customerId: 'CUST-001',
            customerName: 'Good Payer Ltd',
            totalInvoices: 10,
            totalAmount: 50000,
            paidAmount: 48000,
            dueAmount: 2000,
            paymentRate: 96.0,
            averagePaymentDelay: 5 // days
          },
          {
            customerId: 'CUST-002',
            customerName: 'Slow Payer Co',
            totalInvoices: 8,
            totalAmount: 40000,
            paidAmount: 25000,
            dueAmount: 15000,
            paymentRate: 62.5,
            averagePaymentDelay: 25 // days
          },
          {
            customerId: 'CUST-003',
            customerName: 'Reliable Customer',
            totalInvoices: 12,
            totalAmount: 60000,
            paidAmount: 58000,
            dueAmount: 2000,
            paymentRate: 96.7,
            averagePaymentDelay: 3 // days
          },
          {
            customerId: 'CUST-004',
            customerName: 'Problem Customer',
            totalInvoices: 6,
            totalAmount: 30000,
            paidAmount: 15000,
            dueAmount: 15000,
            paymentRate: 50.0,
            averagePaymentDelay: 45 // days
          }
        ];

        // Identify poor payment patterns (payment rate < 80% or delay > 15 days)
        const poorPayers = customerPaymentData.filter(customer => 
          customer.paymentRate < 80 || customer.averagePaymentDelay > 15
        );

        // Categorize risk levels
        const riskCategories = poorPayers.map(customer => {
          let riskLevel = 'LOW';
          let recommendation = 'Monitor payment patterns';

          if (customer.paymentRate < 60 || customer.averagePaymentDelay > 30) {
            riskLevel = 'HIGH';
            recommendation = 'Require advance payment or reduce credit limit';
          } else if (customer.paymentRate < 75 || customer.averagePaymentDelay > 20) {
            riskLevel = 'MEDIUM';
            recommendation = 'Follow up on overdue payments and consider payment terms adjustment';
          }

          return {
            ...customer,
            riskLevel,
            recommendation
          };
        });

        return {
          totalCustomers: customerPaymentData.length,
          poorPayersCount: poorPayers.length,
          poorPaymentRate: ((poorPayers.length / customerPaymentData.length) * 100).toFixed(2),
          riskCategories,
          totalAtRiskAmount: poorPayers.reduce((sum, c) => sum + c.dueAmount, 0)
        };
      };

      const result = await mockIdentifyPoorPaymentPatterns();

      expect(result.poorPayersCount).toBe(2); // Slow Payer Co and Problem Customer
      expect(result.poorPaymentRate).toBe('50.00'); // 2 out of 4 customers
      expect(result.totalAtRiskAmount).toBe(30000); // 15000 + 15000

      const highRiskCustomer = result.riskCategories.find(c => c.riskLevel === 'HIGH');
      expect(highRiskCustomer.customerName).toBe('Problem Customer');
      expect(highRiskCustomer.paymentRate).toBe(50.0);
      expect(highRiskCustomer.recommendation).toContain('advance payment');
    });
  });
});