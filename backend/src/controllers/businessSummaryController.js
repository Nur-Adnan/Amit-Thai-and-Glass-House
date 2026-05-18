import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import Investment from '../models/Investment.js';
import SalaryPayment from '../models/SalaryPayment.js';

// Get instant business summary for dashboard
export const getBusinessSummary = async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    
    const yesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    // Today's Sales
    const todayInvoices = await Invoice.find({
      createdAt: { $gte: startOfToday, $lt: endOfToday },
      invoiceType: { $ne: 'BOOKING' } // Exclude booking invoices from sales
    });

    const todaysSalesAmount = todayInvoices.reduce((sum, invoice) => sum + invoice.grandTotal, 0);
    const todaysSalesCount = todayInvoices.length;

    // Yesterday's Sales for comparison
    const yesterdayInvoices = await Invoice.find({
      createdAt: { $gte: startOfYesterday, $lt: startOfToday },
      invoiceType: { $ne: 'BOOKING' }
    });

    const yesterdaysSalesAmount = yesterdayInvoices.reduce((sum, invoice) => sum + invoice.grandTotal, 0);
    const salesTrend = yesterdaysSalesAmount > 0 
      ? ((todaysSalesAmount - yesterdaysSalesAmount) / yesterdaysSalesAmount) * 100 
      : 0;

    // Today's Profit Calculation
    let todaysProfit = 0;
    let totalRevenue = 0;

    for (const invoice of todayInvoices) {
      totalRevenue += invoice.grandTotal;
      
      // Calculate profit for each item
      for (const item of invoice.items) {
        if (item.isCalculatorItem) {
          // For calculator items, profit = selling price - (area * glass pricing cost)
          const area = item.dimensions?.area || 0;
          const glassPricingCost = item.glassPricing?.pricePerSqFt || 0;
          const costPrice = area * glassPricingCost;
          const sellingPrice = item.total;
          todaysProfit += (sellingPrice - costPrice);
        } else {
          // For regular items, use product cost
          const product = await Product.findById(item.productId);
          if (product) {
            const costPrice = product.costPrice * item.quantity;
            const sellingPrice = item.total;
            todaysProfit += (sellingPrice - costPrice);
          }
        }
      }
      
      // Subtract service charges as expenses
      if (invoice.serviceCharges) {
        todaysProfit -= (invoice.serviceCharges.deliveryCharge || 0);
        todaysProfit -= (invoice.serviceCharges.installationCharge || 0);
      }
    }

    // Calculate yesterday's profit for trend
    let yesterdaysProfit = 0;
    for (const invoice of yesterdayInvoices) {
      for (const item of invoice.items) {
        if (item.isCalculatorItem) {
          const area = item.dimensions?.area || 0;
          const glassPricingCost = item.glassPricing?.pricePerSqFt || 0;
          const costPrice = area * glassPricingCost;
          const sellingPrice = item.total;
          yesterdaysProfit += (sellingPrice - costPrice);
        } else {
          const product = await Product.findById(item.productId);
          if (product) {
            const costPrice = product.costPrice * item.quantity;
            const sellingPrice = item.total;
            yesterdaysProfit += (sellingPrice - costPrice);
          }
        }
      }
      
      if (invoice.serviceCharges) {
        yesterdaysProfit -= (invoice.serviceCharges.deliveryCharge || 0);
        yesterdaysProfit -= (invoice.serviceCharges.installationCharge || 0);
      }
    }

    // Subtract today's expenses from profit
    const todayExpenses = await Investment.find({
      date: { $gte: startOfToday, $lt: endOfToday }
    });
    const todayExpenseAmount = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    todaysProfit -= todayExpenseAmount;

    // Subtract today's salary payments from profit
    const todaySalaries = await SalaryPayment.find({
      paymentDate: { $gte: startOfToday, $lt: endOfToday }
    });
    const todaySalaryAmount = todaySalaries.reduce((sum, sal) => sum + sal.amount, 0);
    todaysProfit -= todaySalaryAmount;

    const profitMargin = totalRevenue > 0 ? (todaysProfit / totalRevenue) * 100 : 0;
    const profitTrend = yesterdaysProfit !== 0 
      ? ((todaysProfit - yesterdaysProfit) / Math.abs(yesterdaysProfit)) * 100 
      : 0;

    // New Due Today
    const newDueInvoices = todayInvoices.filter(invoice => 
      invoice.paymentStatus === 'due' || invoice.paymentStatus === 'partial'
    );
    const newDueAmount = newDueInvoices.reduce((sum, invoice) => sum + invoice.dueAmount, 0);
    const newDueCount = newDueInvoices.length;

    // Yesterday's new due for comparison
    const yesterdayNewDueInvoices = yesterdayInvoices.filter(invoice => 
      invoice.paymentStatus === 'due' || invoice.paymentStatus === 'partial'
    );
    const yesterdayNewDueAmount = yesterdayNewDueInvoices.reduce((sum, invoice) => sum + invoice.dueAmount, 0);
    const dueTrend = yesterdayNewDueAmount > 0 
      ? ((newDueAmount - yesterdayNewDueAmount) / yesterdayNewDueAmount) * 100 
      : 0;

    // Low Stock Items
    const allProducts = await Product.find({ isDeleted: false });
    const lowStockItems = allProducts.filter(product => 
      product.currentStock <= product.minStock
    );
    const criticalStockItems = allProducts.filter(product => 
      product.currentStock === 0
    );

    // Sort by most critical (lowest stock first)
    const sortedLowStockItems = lowStockItems
      .sort((a, b) => a.currentStock - b.currentStock)
      .slice(0, 10) // Top 10 most critical
      .map(product => ({
        name: product.name,
        currentStock: product.currentStock,
        minStock: product.minStock,
        category: product.category
      }));

    const businessSummary = {
      todaysSales: {
        amount: todaysSalesAmount,
        count: todaysSalesCount,
        trend: Math.round(salesTrend * 100) / 100
      },
      todaysProfit: {
        amount: todaysProfit,
        margin: Math.round(profitMargin * 100) / 100,
        trend: Math.round(profitTrend * 100) / 100
      },
      newDue: {
        amount: newDueAmount,
        count: newDueCount,
        trend: Math.round(dueTrend * 100) / 100
      },
      lowStockItems: {
        count: lowStockItems.length,
        criticalCount: criticalStockItems.length,
        items: sortedLowStockItems
      }
    };

    res.json({
      success: true,
      data: businessSummary
    });

  } catch (error) {
    console.error('Error fetching business summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch business summary',
      error: error.message
    });
  }
};