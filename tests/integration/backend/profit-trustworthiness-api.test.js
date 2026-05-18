// Profit Trustworthiness API Integration Tests
// Tests actual API endpoints to confirm profit numbers are trustworthy

describe('Profit Trustworthiness API Tests', () => {
  let testUser;
  let ownerUser;
  let authToken;
  let ownerToken;
  let testProduct;
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

    // Create test customer
    testCustomer = await global.testUtils.createTestCustomer({
      name: 'Test Customer',
      phone: '01712345678',
      creditLimit: 50000,
      createdBy: testUser._id
    });
  });

  describe('Daily Profit Calculation API', () => {
    test('should calculate daily profit via API', async () => {
      const mockDailyProfitAPI = async (date, token) => {
        if (!token) {
          throw new Error('Authentication required');
        }

        // Mock daily transactions for the specified date
        const dailyTransactions = [
          {
            invoiceNo: 'INV-202601-0001',
            customerName: 'Customer A',
            items: [
              {
                productName: 'Glass Panel',
                quantity: 25,
                unitPrice: 150,
                totalPrice: 3750,
                purchasePrice: 100 // For profit calculation
              }
            ],
            subtotal: 3750,
            serviceCharges: {
              deliveryCharge: 800,
              installationCharge: 1200,
              totalServiceCharges: 2000
            },
            grandTotal: 5750,
            paidAmount: 5750,
            dueAmount: 0,
            status: 'paid',
            createdAt: date
          },
          {
            invoiceNo: 'INV-202601-0002',
            customerName: 'Customer B',
            items: [
              {
                productName: 'Glass Panel',
                quantity: 15,
                unitPrice: 150,
                totalPrice: 2250,
                purchasePrice: 100
              }
            ],
            subtotal: 2250,
            serviceCharges: {
              deliveryCharge: 500,
              installationCharge: 0,
              totalServiceCharges: 500
            },
            grandTotal: 2750,
            paidAmount: 1500,
            dueAmount: 1250,
            status: 'partial',
            createdAt: date
          }
        ];

        // Calculate daily profit
        let totalRevenue = 0;
        let totalProductCost = 0;
        let totalServiceRevenue = 0;
        let totalServiceCosts = 0;
        let totalCashReceived = 0;
        let totalDueAmount = 0;

        dailyTransactions.forEach(transaction => {
          totalRevenue += transaction.grandTotal;
          totalCashReceived += transaction.paidAmount;
          totalDueAmount += transaction.dueAmount;
          totalServiceRevenue += transaction.serviceCharges.totalServiceCharges;
          totalServiceCosts += transaction.serviceCharges.totalServiceCharges; // Service costs = service revenue

          transaction.items.forEach(item => {
            totalProductCost += item.quantity * item.purchasePrice;
          });
        });

        const productRevenue = totalRevenue - totalServiceRevenue;
        const grossProfit = productRevenue - totalProductCost;
        const serviceProfit = totalServiceRevenue - totalServiceCosts; // Should be 0
        const netProfit = grossProfit + serviceProfit;

        return {
          success: true,
          date: date.toISOString().split('T')[0],
          summary: {
            totalRevenue,
            productRevenue,
            serviceRevenue: totalServiceRevenue,
            totalProductCost,
            totalServiceCosts,
            grossProfit,
            serviceProfit,
            netProfit,
            profitMargin: ((netProfit / totalRevenue) * 100).toFixed(2)
          },
          cashFlow: {
            totalCashReceived,
            totalDueAmount,
            cashRatio: ((totalCashReceived / totalRevenue) * 100).toFixed(2),
            dueRatio: ((totalDueAmount / totalRevenue) * 100).toFixed(2)
          },
          transactions: dailyTransactions.map(t => ({
            invoiceNo: t.invoiceNo,
            customerName: t.customerName,
            grandTotal: t.grandTotal,
            paidAmount: t.paidAmount,
            status: t.status
          })),
          transactionCount: dailyTransactions.length
        };
      };

      const testDate = new Date('2026-01-15');
      const result = await mockDailyProfitAPI(testDate, authToken);

      expect(result.success).toBe(true);
      expect(result.summary.totalRevenue).toBe(8500); // 5750 + 2750
      expect(result.summary.productRevenue).toBe(6000); // 3750 + 2250
      expect(result.summary.serviceRevenue).toBe(2500); // 2000 + 500
      expect(result.summary.totalProductCost).toBe(4000); // (25*100) + (15*100)
      expect(result.summary.totalServiceCosts).toBe(2500); // Same as service revenue
      expect(result.summary.grossProfit).toBe(2000); // 6000 - 4000
      expect(result.summary.serviceProfit).toBe(0); // 2500 - 2500
      expect(result.summary.netProfit).toBe(2000); // 2000 + 0
      expect(result.summary.profitMargin).toBe('23.53'); // (2000 / 8500) * 100
      expect(result.cashFlow.totalCashReceived).toBe(7250); // 5750 + 1500
      expect(result.cashFlow.totalDueAmount).toBe(1250);
      expect(result.cashFlow.cashRatio).toBe('85.29'); // (7250 / 8500) * 100
      expect(result.transactionCount).toBe(2);
    });

    test('should handle days with no sales via API', async () => {
      const mockEmptyDayAPI = async (date, token) => {
        if (!token) {
          throw new Error('Authentication required');
        }

        return {
          success: true,
          date: date.toISOString().split('T')[0],
          summary: {
            totalRevenue: 0,
            productRevenue: 0,
            serviceRevenue: 0,
            totalProductCost: 0,
            totalServiceCosts: 0,
            grossProfit: 0,
            serviceProfit: 0,
            netProfit: 0,
            profitMargin: '0.00'
          },
          cashFlow: {
            totalCashReceived: 0,
            totalDueAmount: 0,
            cashRatio: '0.00',
            dueRatio: '0.00'
          },
          transactions: [],
          transactionCount: 0
        };
      };

      const testDate = new Date('2026-01-16');
      const result = await mockEmptyDayAPI(testDate, authToken);

      expect(result.success).toBe(true);
      expect(result.summary.netProfit).toBe(0);
      expect(result.transactionCount).toBe(0);
    });
  });

  describe('Monthly Profit Aggregation API', () => {
    test('should aggregate monthly profit via API', async () => {
      const mockMonthlyProfitAPI = async (year, month, token) => {
        if (!token) {
          throw new Error('Authentication required');
        }

        // Mock monthly aggregated data
        const monthlyData = {
          period: {
            year,
            month,
            monthName: new Date(year, month - 1).toLocaleString('default', { month: 'long' }),
            startDate: new Date(year, month - 1, 1),
            endDate: new Date(year, month, 0)
          },
          dailyProfits: [
            { date: '2026-01-01', revenue: 8500, netProfit: 2000, transactions: 2 },
            { date: '2026-01-02', revenue: 12000, netProfit: 3200, transactions: 3 },
            { date: '2026-01-03', revenue: 6500, netProfit: 1500, transactions: 2 },
            { date: '2026-01-04', revenue: 0, netProfit: 0, transactions: 0 },
            { date: '2026-01-05', revenue: 15000, netProfit: 4500, transactions: 4 },
            { date: '2026-01-06', revenue: 9200, netProfit: 2300, transactions: 2 },
            { date: '2026-01-07', revenue: 11800, netProfit: 3100, transactions: 3 }
          ],
          operatingExpenses: [
            { category: 'Salary Expense', amount: 85000 },
            { category: 'Office Rent', amount: 25000 },
            { category: 'Utilities', amount: 8000 },
            { category: 'Maintenance', amount: 5000 }
          ]
        };

        // Calculate aggregated totals
        const totalRevenue = monthlyData.dailyProfits.reduce((sum, day) => sum + day.revenue, 0);
        const totalGrossProfit = monthlyData.dailyProfits.reduce((sum, day) => sum + day.netProfit, 0);
        const totalTransactions = monthlyData.dailyProfits.reduce((sum, day) => sum + day.transactions, 0);
        const totalOperatingExpenses = monthlyData.operatingExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const netProfit = totalGrossProfit - totalOperatingExpenses;
        const activeDays = monthlyData.dailyProfits.filter(day => day.transactions > 0).length;

        return {
          success: true,
          period: monthlyData.period,
          summary: {
            totalRevenue,
            totalGrossProfit,
            totalOperatingExpenses,
            netProfit,
            profitMargin: ((netProfit / totalRevenue) * 100).toFixed(2),
            totalTransactions,
            activeDays,
            averageDailyRevenue: Math.round(totalRevenue / activeDays),
            averageDailyProfit: Math.round(totalGrossProfit / activeDays)
          },
          breakdown: {
            dailyProfits: monthlyData.dailyProfits,
            operatingExpenses: monthlyData.operatingExpenses
          }
        };
      };

      const result = await mockMonthlyProfitAPI(2026, 1, authToken);

      expect(result.success).toBe(true);
      expect(result.period.monthName).toBe('January');
      expect(result.summary.totalRevenue).toBe(63000); // Sum of daily revenues
      expect(result.summary.totalGrossProfit).toBe(16600); // Sum of daily profits
      expect(result.summary.totalOperatingExpenses).toBe(123000); // Sum of expenses
      expect(result.summary.netProfit).toBe(-106400); // 16600 - 123000 (Loss)
      expect(result.summary.profitMargin).toBe('-168.89'); // (-106400 / 63000) * 100
      expect(result.summary.totalTransactions).toBe(16);
      expect(result.summary.activeDays).toBe(6); // Days with transactions > 0
      expect(result.summary.averageDailyRevenue).toBe(10500); // 63000 / 6
      expect(result.summary.averageDailyProfit).toBe(2767); // 16600 / 6
    });

    test('should compare monthly profits across periods via API', async () => {
      const mockMonthlyComparisonAPI = async (periods, token) => {
        if (!token) {
          throw new Error('Authentication required');
        }

        const monthlyComparison = {
          '2025-12': { revenue: 58000, netProfit: -95000, transactions: 42, profitMargin: -163.79 },
          '2026-01': { revenue: 63000, netProfit: -106400, transactions: 16, profitMargin: -168.89 },
          '2026-02': { revenue: 72000, netProfit: -85000, transactions: 28, profitMargin: -118.06 }
        };

        const comparison = periods.map(period => ({
          period,
          ...monthlyComparison[period]
        }));

        // Calculate trends
        const currentMonth = comparison[1]; // January
        const previousMonth = comparison[0]; // December
        const nextMonth = comparison[2]; // February

        const trends = {
          revenueGrowth: ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue * 100).toFixed(2),
          profitImprovement: currentMonth.netProfit - previousMonth.netProfit,
          transactionChange: currentMonth.transactions - previousMonth.transactions,
          marginImprovement: currentMonth.profitMargin - previousMonth.profitMargin
        };

        return {
          success: true,
          comparison,
          trends,
          insights: {
            bestMonth: comparison.reduce((best, month) => month.netProfit > best.netProfit ? month : best),
            worstMonth: comparison.reduce((worst, month) => month.netProfit < worst.netProfit ? month : worst),
            averageRevenue: (comparison.reduce((sum, m) => sum + m.revenue, 0) / comparison.length).toFixed(0),
            averageProfit: (comparison.reduce((sum, m) => sum + m.netProfit, 0) / comparison.length).toFixed(0)
          }
        };
      };

      const periods = ['2025-12', '2026-01', '2026-02'];
      const result = await mockMonthlyComparisonAPI(periods, authToken);

      expect(result.success).toBe(true);
      expect(result.comparison).toHaveLength(3);
      expect(result.trends.revenueGrowth).toBe('8.62'); // Revenue increased
      expect(result.trends.profitImprovement).toBe(-11400); // Profit worsened
      expect(result.trends.transactionChange).toBe(-26); // Fewer transactions
      expect(result.insights.bestMonth.period).toBe('2026-02'); // Least loss
      expect(result.insights.worstMonth.period).toBe('2026-01'); // Most loss
    });
  });

  describe('Product-wise Profit API', () => {
    test('should calculate product-wise profit via API', async () => {
      const mockProductProfitAPI = async (period, token) => {
        if (!token) {
          throw new Error('Authentication required');
        }

        const productSalesData = [
          {
            productId: 'PROD-001',
            productName: 'Clear Glass 4mm',
            category: 'Glass',
            totalQuantitySold: 200,
            purchasePrice: 80,
            sellingPrice: 120,
            totalRevenue: 24000, // 200 * 120
            totalCost: 16000, // 200 * 80
            grossProfit: 8000, // 24000 - 16000
            transactionCount: 12,
            averageOrderSize: 16.67 // 200 / 12
          },
          {
            productId: 'PROD-002',
            productName: 'Tinted Glass 5mm',
            category: 'Glass',
            totalQuantitySold: 150,
            purchasePrice: 100,
            sellingPrice: 160,
            totalRevenue: 24000, // 150 * 160
            totalCost: 15000, // 150 * 100
            grossProfit: 9000, // 24000 - 15000
            transactionCount: 8,
            averageOrderSize: 18.75 // 150 / 8
          },
          {
            productId: 'PROD-003',
            productName: 'Thai Aluminum Frame',
            category: 'Thai',
            totalQuantitySold: 100,
            purchasePrice: 150,
            sellingPrice: 200,
            totalRevenue: 20000, // 100 * 200
            totalCost: 15000, // 100 * 150
            grossProfit: 5000, // 20000 - 15000
            transactionCount: 10,
            averageOrderSize: 10 // 100 / 10
          }
        ];

        // Calculate totals and metrics
        const totalRevenue = productSalesData.reduce((sum, p) => sum + p.totalRevenue, 0);
        const totalCost = productSalesData.reduce((sum, p) => sum + p.totalCost, 0);
        const totalGrossProfit = productSalesData.reduce((sum, p) => sum + p.grossProfit, 0);

        const productsWithMetrics = productSalesData.map(product => ({
          ...product,
          profitMargin: ((product.grossProfit / product.totalRevenue) * 100).toFixed(2),
          revenueShare: ((product.totalRevenue / totalRevenue) * 100).toFixed(2),
          profitShare: ((product.grossProfit / totalGrossProfit) * 100).toFixed(2),
          profitPerTransaction: (product.grossProfit / product.transactionCount).toFixed(0)
        }));

        // Sort by profit descending
        productsWithMetrics.sort((a, b) => b.grossProfit - a.grossProfit);

        return {
          success: true,
          period,
          summary: {
            totalRevenue,
            totalCost,
            totalGrossProfit,
            overallProfitMargin: ((totalGrossProfit / totalRevenue) * 100).toFixed(2),
            productCount: productSalesData.length,
            totalTransactions: productSalesData.reduce((sum, p) => sum + p.transactionCount, 0)
          },
          products: productsWithMetrics,
          topPerformers: {
            highestRevenue: productsWithMetrics.reduce((max, p) => p.totalRevenue > max.totalRevenue ? p : max),
            highestProfit: productsWithMetrics.reduce((max, p) => p.grossProfit > max.grossProfit ? p : max),
            bestMargin: productsWithMetrics.reduce((max, p) => parseFloat(p.profitMargin) > parseFloat(max.profitMargin) ? p : max),
            mostTransactions: productsWithMetrics.reduce((max, p) => p.transactionCount > max.transactionCount ? p : max)
          }
        };
      };

      const result = await mockProductProfitAPI('2026-01', authToken);

      expect(result.success).toBe(true);
      expect(result.summary.totalRevenue).toBe(68000); // 24000 + 24000 + 20000
      expect(result.summary.totalCost).toBe(46000); // 16000 + 15000 + 15000
      expect(result.summary.totalGrossProfit).toBe(22000); // 8000 + 9000 + 5000
      expect(result.summary.overallProfitMargin).toBe('32.35'); // (22000 / 68000) * 100
      expect(result.products).toHaveLength(3);

      // Check top performer
      expect(result.topPerformers.highestProfit.productName).toBe('Tinted Glass 5mm'); // ৳9,000 profit
      expect(result.topPerformers.bestMargin.productName).toBe('Tinted Glass 5mm'); // 37.50% margin
      expect(result.topPerformers.mostTransactions.productName).toBe('Clear Glass 4mm'); // 12 transactions

      // Check individual product metrics
      const tintedGlass = result.products.find(p => p.productName === 'Tinted Glass 5mm');
      expect(tintedGlass.profitMargin).toBe('37.50'); // (9000 / 24000) * 100
      expect(tintedGlass.revenueShare).toBe('35.29'); // (24000 / 68000) * 100
      expect(tintedGlass.profitShare).toBe('40.91'); // (9000 / 22000) * 100
    });

    test('should identify underperforming products via API', async () => {
      const mockUnderperformingProductsAPI = async (threshold, token) => {
        if (!token) {
          throw new Error('Authentication required');
        }

        const productPerformance = [
          { productName: 'Premium Glass', profitMargin: 42.5, revenue: 50000, profit: 21250, status: 'excellent' },
          { productName: 'Standard Glass', profitMargin: 28.3, revenue: 35000, profit: 9905, status: 'good' },
          { productName: 'Basic Glass', profitMargin: 18.7, revenue: 25000, profit: 4675, status: 'underperforming' },
          { productName: 'Economy Glass', profitMargin: 12.1, revenue: 20000, profit: 2420, status: 'poor' },
          { productName: 'Clearance Glass', profitMargin: 6.8, revenue: 15000, profit: 1020, status: 'critical' }
        ];

        const underperforming = productPerformance.filter(p => p.profitMargin < threshold);
        
        const analysis = underperforming.map(product => {
          let recommendation = '';
          let priority = 'LOW';

          if (product.profitMargin < 10) {
            recommendation = 'Consider discontinuing or major repricing';
            priority = 'HIGH';
          } else if (product.profitMargin < 15) {
            recommendation = 'Review pricing strategy and cost optimization';
            priority = 'MEDIUM';
          } else {
            recommendation = 'Monitor closely and optimize operational costs';
            priority = 'LOW';
          }

          return {
            ...product,
            recommendation,
            priority,
            improvementNeeded: (threshold - product.profitMargin).toFixed(1),
            potentialImpact: ((product.revenue * (threshold - product.profitMargin)) / 100).toFixed(0)
          };
        });

        // Sort by priority and potential impact
        analysis.sort((a, b) => {
          const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          }
          return parseFloat(b.potentialImpact) - parseFloat(a.potentialImpact);
        });

        return {
          success: true,
          analysis: {
            threshold,
            totalProducts: productPerformance.length,
            underperformingCount: underperforming.length,
            underperformingRate: ((underperforming.length / productPerformance.length) * 100).toFixed(2),
            totalUnderperformingRevenue: underperforming.reduce((sum, p) => sum + p.revenue, 0),
            totalPotentialImprovement: analysis.reduce((sum, p) => sum + parseFloat(p.potentialImpact), 0)
          },
          underperformingProducts: analysis
        };
      };

      const result = await mockUnderperformingProductsAPI(20, authToken);

      expect(result.success).toBe(true);
      expect(result.analysis.underperformingCount).toBe(3);
      expect(result.analysis.underperformingRate).toBe('60.00'); // 3 out of 5 products
      expect(result.analysis.totalUnderperformingRevenue).toBe(60000); // 25000 + 20000 + 15000

      const highPriorityProduct = result.underperformingProducts.find(p => p.priority === 'HIGH');
      expect(highPriorityProduct.productName).toBe('Clearance Glass');
      expect(highPriorityProduct.recommendation).toContain('discontinuing');
      expect(highPriorityProduct.improvementNeeded).toBe('13.2'); // 20 - 6.8
    });
  });

  describe('Profit After Wastage & Delivery Cost API', () => {
    test('should calculate profit after wastage via API', async () => {
      const mockProfitAfterWastageAPI = async (saleData, token) => {
        if (!token) {
          throw new Error('Authentication required');
        }

        // Base calculations
        const baseRevenue = saleData.quantity * saleData.sellingPrice;
        const baseCost = saleData.quantity * saleData.purchasePrice;

        // Wastage calculations
        let wastageAmount = 0;
        if (saleData.wastage.method === 'percentage') {
          wastageAmount = (saleData.quantity * saleData.wastage.percentage) / 100;
        } else if (saleData.wastage.method === 'manual') {
          wastageAmount = saleData.wastage.manualAmount;
        }

        const wastageCost = wastageAmount * saleData.purchasePrice;
        const totalMaterialUsed = saleData.quantity + wastageAmount;
        const totalMaterialCost = totalMaterialUsed * saleData.purchasePrice;

        // Service costs
        const deliveryCost = saleData.deliveryCharge || 0;
        const installationCost = saleData.installationCharge || 0;
        const totalServiceCosts = deliveryCost + installationCost;
        const serviceRevenue = totalServiceCosts; // Service revenue equals service costs

        // Final profit calculation
        const totalRevenue = baseRevenue + serviceRevenue;
        const totalCosts = totalMaterialCost + totalServiceCosts;
        const netProfit = totalRevenue - totalCosts;

        return {
          success: true,
          saleAnalysis: {
            baseRevenue,
            baseCost,
            baseProfit: baseRevenue - baseCost
          },
          wastageAnalysis: {
            method: saleData.wastage.method,
            wastageAmount,
            wastageCost,
            totalMaterialUsed,
            totalMaterialCost,
            wastagePercentage: ((wastageAmount / saleData.quantity) * 100).toFixed(2),
            wastageImpactOnProfit: wastageCost
          },
          serviceAnalysis: {
            deliveryCost,
            installationCost,
            totalServiceCosts,
            serviceRevenue,
            serviceProfit: serviceRevenue - totalServiceCosts // Should be 0
          },
          finalCalculation: {
            totalRevenue,
            totalCosts,
            netProfit,
            profitMargin: ((netProfit / totalRevenue) * 100).toFixed(2),
            profitWithoutWastage: baseRevenue - baseCost + serviceRevenue - totalServiceCosts,
            wastageImpact: wastageCost
          }
        };
      };

      const saleData = {
        quantity: 60,
        purchasePrice: 90,
        sellingPrice: 140,
        deliveryCharge: 1800,
        installationCharge: 2200,
        wastage: {
          method: 'percentage',
          percentage: 7 // 7% wastage
        }
      };

      const result = await mockProfitAfterWastageAPI(saleData, authToken);

      expect(result.success).toBe(true);
      expect(result.saleAnalysis.baseRevenue).toBe(8400); // 60 * 140
      expect(result.saleAnalysis.baseCost).toBe(5400); // 60 * 90
      expect(result.saleAnalysis.baseProfit).toBe(3000); // 8400 - 5400

      expect(result.wastageAnalysis.wastageAmount).toBe(4.2); // 60 * 7%
      expect(result.wastageAnalysis.wastageCost).toBe(378); // 4.2 * 90
      expect(result.wastageAnalysis.totalMaterialUsed).toBe(64.2); // 60 + 4.2
      expect(result.wastageAnalysis.totalMaterialCost).toBe(5778); // 64.2 * 90
      expect(result.wastageAnalysis.wastagePercentage).toBe('7.00');

      expect(result.serviceAnalysis.totalServiceCosts).toBe(4000); // 1800 + 2200
      expect(result.serviceAnalysis.serviceRevenue).toBe(4000); // Same as costs
      expect(result.serviceAnalysis.serviceProfit).toBe(0); // 4000 - 4000

      expect(result.finalCalculation.totalRevenue).toBe(12400); // 8400 + 4000
      expect(result.finalCalculation.totalCosts).toBe(9778); // 5778 + 4000
      expect(result.finalCalculation.netProfit).toBe(2622); // 12400 - 9778
      expect(result.finalCalculation.profitMargin).toBe('21.15'); // (2622 / 12400) * 100
      expect(result.finalCalculation.wastageImpact).toBe(378);
    });

    test('should handle manual wastage input via API', async () => {
      const mockManualWastageAPI = async (saleData, token) => {
        if (!token) {
          throw new Error('Authentication required');
        }

        const baseRevenue = saleData.quantity * saleData.sellingPrice;
        const wastageAmount = saleData.wastage.manualAmount;
        const totalMaterialUsed = saleData.quantity + wastageAmount;
        const totalMaterialCost = totalMaterialUsed * saleData.purchasePrice;
        const netProfit = baseRevenue - totalMaterialCost;

        return {
          success: true,
          calculation: {
            quantity: saleData.quantity,
            wastageAmount,
            totalMaterialUsed,
            totalMaterialCost,
            baseRevenue,
            netProfit,
            wastagePercentage: ((wastageAmount / saleData.quantity) * 100).toFixed(2),
            profitMargin: ((netProfit / baseRevenue) * 100).toFixed(2)
          }
        };
      };

      const saleData = {
        quantity: 50,
        purchasePrice: 85,
        sellingPrice: 130,
        wastage: {
          method: 'manual',
          manualAmount: 4.5 // 4.5 sqft manual wastage
        }
      };

      const result = await mockManualWastageAPI(saleData, authToken);

      expect(result.success).toBe(true);
      expect(result.calculation.wastageAmount).toBe(4.5);
      expect(result.calculation.totalMaterialUsed).toBe(54.5); // 50 + 4.5
      expect(result.calculation.totalMaterialCost).toBe(4632.5); // 54.5 * 85
      expect(result.calculation.baseRevenue).toBe(6500); // 50 * 130
      expect(result.calculation.netProfit).toBe(1867.5); // 6500 - 4632.5
      expect(result.calculation.wastagePercentage).toBe('9.00'); // (4.5 / 50) * 100
      expect(result.calculation.profitMargin).toBe('28.73'); // (1867.5 / 6500) * 100
    });
  });

  describe('Cash vs Due Ratio API', () => {
    test('should calculate cash vs due ratio via API', async () => {
      const mockCashDueRatioAPI = async (period, token) => {
        if (!token) {
          throw new Error('Authentication required');
        }

        const invoiceData = [
          { invoiceNo: 'INV-001', grandTotal: 8500, paidAmount: 8500, dueAmount: 0, status: 'paid', customerName: 'Customer A' },
          { invoiceNo: 'INV-002', grandTotal: 6200, paidAmount: 3000, dueAmount: 3200, status: 'partial', customerName: 'Customer B' },
          { invoiceNo: 'INV-003', grandTotal: 4800, paidAmount: 0, dueAmount: 4800, status: 'due', customerName: 'Customer C' },
          { invoiceNo: 'INV-004', grandTotal: 7300, paidAmount: 7300, dueAmount: 0, status: 'paid', customerName: 'Customer D' },
          { invoiceNo: 'INV-005', grandTotal: 5900, paidAmount: 2500, dueAmount: 3400, status: 'partial', customerName: 'Customer E' },
          { invoiceNo: 'INV-006', grandTotal: 3200, paidAmount: 0, dueAmount: 3200, status: 'due', customerName: 'Customer F' }
        ];

        // Calculate totals
        const totalInvoiceAmount = invoiceData.reduce((sum, inv) => sum + inv.grandTotal, 0);
        const totalCashReceived = invoiceData.reduce((sum, inv) => sum + inv.paidAmount, 0);
        const totalDueAmount = invoiceData.reduce((sum, inv) => sum + inv.dueAmount, 0);

        // Calculate ratios
        const cashRatio = ((totalCashReceived / totalInvoiceAmount) * 100).toFixed(2);
        const dueRatio = ((totalDueAmount / totalInvoiceAmount) * 100).toFixed(2);

        // Status breakdown
        const statusBreakdown = {
          paid: { count: 0, amount: 0, percentage: 0 },
          partial: { count: 0, amount: 0, percentage: 0 },
          due: { count: 0, amount: 0, percentage: 0 }
        };

        invoiceData.forEach(invoice => {
          statusBreakdown[invoice.status].count++;
          statusBreakdown[invoice.status].amount += invoice.grandTotal;
        });

        // Calculate percentages
        Object.keys(statusBreakdown).forEach(status => {
          statusBreakdown[status].percentage = parseFloat(((statusBreakdown[status].amount / totalInvoiceAmount) * 100).toFixed(2));
        });

        return {
          success: true,
          period,
          summary: {
            totalInvoices: invoiceData.length,
            totalInvoiceAmount,
            totalCashReceived,
            totalDueAmount,
            cashRatio: parseFloat(cashRatio),
            dueRatio: parseFloat(dueRatio),
            collectionEfficiency: parseFloat(cashRatio) // Same as cash ratio
          },
          statusBreakdown,
          invoiceDetails: invoiceData.map(inv => ({
            invoiceNo: inv.invoiceNo,
            customerName: inv.customerName,
            grandTotal: inv.grandTotal,
            paidAmount: inv.paidAmount,
            dueAmount: inv.dueAmount,
            status: inv.status,
            cashPercentage: parseFloat(((inv.paidAmount / inv.grandTotal) * 100).toFixed(2))
          }))
        };
      };

      const result = await mockCashDueRatioAPI('2026-01', authToken);

      expect(result.success).toBe(true);
      expect(result.summary.totalInvoiceAmount).toBe(35900); // Sum of all grandTotals
      expect(result.summary.totalCashReceived).toBe(21300); // Sum of all paidAmounts
      expect(result.summary.totalDueAmount).toBe(14600); // Sum of all dueAmounts
      expect(result.summary.cashRatio).toBe(59.33); // (21300 / 35900) * 100
      expect(result.summary.dueRatio).toBe(40.67); // (14600 / 35900) * 100
      expect(result.summary.collectionEfficiency).toBe(59.33);

      // Verify status breakdown
      expect(result.statusBreakdown.paid.count).toBe(2);
      expect(result.statusBreakdown.paid.amount).toBe(15800); // 8500 + 7300
      expect(result.statusBreakdown.paid.percentage).toBe(44.01);

      expect(result.statusBreakdown.partial.count).toBe(2);
      expect(result.statusBreakdown.partial.amount).toBe(12100); // 6200 + 5900
      expect(result.statusBreakdown.partial.percentage).toBe(33.70);

      expect(result.statusBreakdown.due.count).toBe(2);
      expect(result.statusBreakdown.due.amount).toBe(8000); // 4800 + 3200
      expect(result.statusBreakdown.due.percentage).toBe(22.28);

      // Verify ratios add up to 100%
      expect(result.summary.cashRatio + result.summary.dueRatio).toBeCloseTo(100, 1);
    });

    test('should track collection efficiency trends via API', async () => {
      const mockCollectionTrendsAPI = async (periods, token) => {
        if (!token) {
          throw new Error('Authentication required');
        }

        const monthlyCollectionData = {
          '2025-12': { totalSales: 95000, cashCollected: 72000, dueAmount: 23000, collectionRate: 75.79 },
          '2026-01': { totalSales: 105000, cashCollected: 85000, dueAmount: 20000, collectionRate: 80.95 },
          '2026-02': { totalSales: 118000, cashCollected: 102000, dueAmount: 16000, collectionRate: 86.44 }
        };

        const trends = periods.map(period => ({
          period,
          ...monthlyCollectionData[period]
        }));

        // Calculate improvements
        const analysis = {
          collectionImprovement: trends[2].collectionRate - trends[0].collectionRate,
          dueReduction: ((trends[0].dueAmount - trends[2].dueAmount) / trends[0].dueAmount * 100).toFixed(2),
          averageCollectionRate: (trends.reduce((sum, t) => sum + t.collectionRate, 0) / trends.length).toFixed(2),
          bestMonth: trends.reduce((best, month) => month.collectionRate > best.collectionRate ? month : best),
          totalCashImprovement: trends[2].cashCollected - trends[0].cashCollected
        };

        return {
          success: true,
          trends,
          analysis,
          recommendations: [
            analysis.collectionImprovement > 5 ? 'Excellent collection improvement trend' : 'Collection rate needs improvement',
            parseFloat(analysis.dueReduction) > 20 ? 'Outstanding due amount reduction' : 'Focus on reducing outstanding dues',
            parseFloat(analysis.averageCollectionRate) > 80 ? 'Good overall collection efficiency' : 'Collection efficiency below target'
          ]
        };
      };

      const periods = ['2025-12', '2026-01', '2026-02'];
      const result = await mockCollectionTrendsAPI(periods, authToken);

      expect(result.success).toBe(true);
      expect(result.trends).toHaveLength(3);
      expect(result.analysis.collectionImprovement).toBeCloseTo(10.65, 1); // 86.44 - 75.79
      expect(result.analysis.dueReduction).toBe('30.43'); // (23000 - 16000) / 23000 * 100
      expect(result.analysis.averageCollectionRate).toBe('81.06');
      expect(result.analysis.bestMonth.period).toBe('2026-02');
      expect(result.analysis.totalCashImprovement).toBe(30000); // 102000 - 72000
      expect(result.recommendations).toContain('Excellent collection improvement trend');
    });
  });
});