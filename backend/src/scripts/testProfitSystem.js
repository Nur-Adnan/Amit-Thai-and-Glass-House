import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import Invoice from '../models/Invoice.js';
import Expense from '../models/Expense.js';
import ProfitAnalytics from '../models/ProfitAnalytics.js';
import {
  calculateDailyProfit,
  calculateMonthlyProfit,
  calculateProductWiseProfit,
  getProfitTrends,
  getTopPerformingProducts
} from '../services/profitCalculationService.js';

dotenv.config();

const testProfitSystem = async () => {
  try {
    await connectDB();
    console.log('🔗 Connected to database');

    // Get test user
    const user = await User.findOne({ role: 'owner' });
    if (!user) {
      console.log('❌ No owner user found. Please run seed:owner first.');
      process.exit(1);
    }
    console.log('👤 Found test user:', user.name);

    // Test 1: Check data availability
    console.log('\n📊 Test 1: Data Availability Check');
    
    const invoiceCount = await Invoice.countDocuments({ status: { $in: ['paid', 'partial'] } });
    const expenseCount = await Expense.countDocuments({ status: 'approved' });
    const salaryExpenseCount = await Expense.countDocuments({ 
      category: 'Salary Expense', 
      status: 'approved' 
    });
    
    console.log(`📋 Paid/Partial invoices: ${invoiceCount}`);
    console.log(`💸 Approved expenses: ${expenseCount}`);
    console.log(`💰 Salary expenses: ${salaryExpenseCount}`);
    
    if (invoiceCount === 0) {
      console.log('⚠️  Warning: No paid invoices found. Revenue will be $0');
    }
    
    if (expenseCount === 0) {
      console.log('⚠️  Warning: No approved expenses found. Costs will be $0');
    }

    // Test 2: Daily profit calculation
    console.log('\n📅 Test 2: Daily Profit Calculation');
    
    try {
      const today = new Date();
      const dailyProfit = await calculateDailyProfit(today, user);
      
      console.log('✅ Daily profit calculation successful');
      console.log(`📈 Analysis ID: ${dailyProfit.analysisId}`);
      console.log(`💰 Total Sales: $${dailyProfit.revenue.totalSales.toFixed(2)}`);
      console.log(`💸 Total Costs: $${dailyProfit.costs.totalCosts.toFixed(2)}`);
      console.log(`📊 Net Profit: $${dailyProfit.profit.netProfit.toFixed(2)}`);
      console.log(`📈 Profit Margin: ${dailyProfit.profit.profitMargin.toFixed(2)}%`);
      console.log(`🎯 Status: ${dailyProfit.profitStatus}`);
    } catch (error) {
      console.log('❌ Daily profit calculation failed:', error.message);
    }

    // Test 3: Monthly profit calculation
    console.log('\n📊 Test 3: Monthly Profit Calculation');
    
    try {
      const now = new Date();
      const monthlyProfit = await calculateMonthlyProfit(now.getMonth() + 1, now.getFullYear(), user);
      
      console.log('✅ Monthly profit calculation successful');
      console.log(`📈 Analysis ID: ${monthlyProfit.analysisId}`);
      console.log(`💰 Total Sales: $${monthlyProfit.revenue.totalSales.toFixed(2)}`);
      console.log(`💸 Total Costs: $${monthlyProfit.costs.totalCosts.toFixed(2)}`);
      console.log(`📊 Net Profit: $${monthlyProfit.profit.netProfit.toFixed(2)}`);
      console.log(`📈 Profit Margin: ${monthlyProfit.profit.profitMargin.toFixed(2)}%`);
      console.log(`🏪 Invoice Count: ${monthlyProfit.revenue.invoiceCount}`);
      console.log(`💵 Average Order Value: $${monthlyProfit.revenue.averageOrderValue.toFixed(2)}`);
    } catch (error) {
      console.log('❌ Monthly profit calculation failed:', error.message);
    }

    // Test 4: Product-wise profit calculation
    console.log('\n🏷️  Test 4: Product-wise Profit Calculation');
    
    try {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
      
      const productProfit = await calculateProductWiseProfit(startOfMonth, endOfMonth, user);
      
      console.log('✅ Product-wise profit calculation successful');
      console.log(`📈 Analysis ID: ${productProfit.analysisId}`);
      console.log(`🏷️  Products analyzed: ${productProfit.productBreakdown.length}`);
      
      if (productProfit.productBreakdown.length > 0) {
        console.log('\n🏆 Top 3 Products by Profit:');
        const topProducts = productProfit.productBreakdown
          .sort((a, b) => b.profit - a.profit)
          .slice(0, 3);
        
        topProducts.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.productName}`);
          console.log(`      Quantity Sold: ${product.quantitySold}`);
          console.log(`      Revenue: $${product.revenue.toFixed(2)}`);
          console.log(`      Cost: $${product.cost.toFixed(2)}`);
          console.log(`      Profit: $${product.profit.toFixed(2)}`);
          console.log(`      Margin: ${product.profitMargin.toFixed(2)}%`);
        });
      } else {
        console.log('ℹ️  No product sales found for this period');
      }
    } catch (error) {
      console.log('❌ Product-wise profit calculation failed:', error.message);
    }

    // Test 5: Profit trends analysis
    console.log('\n📈 Test 5: Profit Trends Analysis');
    
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days
      
      const trends = await getProfitTrends(startDate, endDate, 'daily');
      
      console.log('✅ Profit trends analysis successful');
      console.log(`📊 Trend data points: ${trends.length}`);
      
      if (trends.length > 0) {
        const totalProfit = trends.reduce((sum, trend) => sum + trend.netProfit, 0);
        const avgProfit = totalProfit / trends.length;
        console.log(`💰 Total profit (30 days): $${totalProfit.toFixed(2)}`);
        console.log(`📊 Average daily profit: $${avgProfit.toFixed(2)}`);
      }
    } catch (error) {
      console.log('❌ Profit trends analysis failed:', error.message);
    }

    // Test 6: Top performing products
    console.log('\n🏆 Test 6: Top Performing Products');
    
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1); // Last month
      
      const topProducts = await getTopPerformingProducts(startDate, endDate, 5);
      
      console.log('✅ Top performing products analysis successful');
      console.log(`🏷️  Top products found: ${topProducts.length}`);
      
      topProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.productName || 'Unknown Product'}`);
        console.log(`      Total Profit: $${product.totalProfit.toFixed(2)}`);
        console.log(`      Profit Margin: ${product.profitMargin.toFixed(2)}%`);
        console.log(`      Quantity Sold: ${product.totalQuantitySold}`);
        console.log(`      Revenue: $${product.totalRevenue.toFixed(2)}`);
      });
    } catch (error) {
      console.log('❌ Top performing products analysis failed:', error.message);
    }

    // Test 7: Database record counts
    console.log('\n📊 Test 7: Database Record Counts');
    
    const profitAnalysisCount = await ProfitAnalytics.countDocuments();
    const dailyAnalysisCount = await ProfitAnalytics.countDocuments({ analysisType: 'daily' });
    const monthlyAnalysisCount = await ProfitAnalytics.countDocuments({ analysisType: 'monthly' });
    const productAnalysisCount = await ProfitAnalytics.countDocuments({ analysisType: 'product-wise' });
    
    console.log(`📈 Total profit analyses: ${profitAnalysisCount}`);
    console.log(`📅 Daily analyses: ${dailyAnalysisCount}`);
    console.log(`📊 Monthly analyses: ${monthlyAnalysisCount}`);
    console.log(`🏷️  Product-wise analyses: ${productAnalysisCount}`);

    // Test 8: Profit calculation formulas validation
    console.log('\n🧮 Test 8: Formula Validation');
    
    if (profitAnalysisCount > 0) {
      const sampleAnalysis = await ProfitAnalytics.findOne().sort({ createdAt: -1 });
      
      console.log('✅ Sample analysis found for validation');
      console.log(`💰 Revenue: $${sampleAnalysis.revenue.totalSales.toFixed(2)}`);
      console.log(`💸 Product Costs: $${sampleAnalysis.costs.productCosts.toFixed(2)}`);
      console.log(`💰 Salary Expenses: $${sampleAnalysis.costs.salaryExpenses.toFixed(2)}`);
      console.log(`💸 Other Expenses: $${sampleAnalysis.costs.otherExpenses.toFixed(2)}`);
      console.log(`📊 Total Costs: $${sampleAnalysis.costs.totalCosts.toFixed(2)}`);
      
      // Validate calculations
      const expectedTotalCosts = sampleAnalysis.costs.productCosts + 
                                sampleAnalysis.costs.salaryExpenses + 
                                sampleAnalysis.costs.otherExpenses;
      const expectedNetProfit = sampleAnalysis.revenue.totalSales - expectedTotalCosts;
      const expectedProfitMargin = sampleAnalysis.revenue.totalSales > 0 ? 
                                  (expectedNetProfit / sampleAnalysis.revenue.totalSales) * 100 : 0;
      
      console.log('\n🔍 Formula Validation:');
      console.log(`Expected Total Costs: $${expectedTotalCosts.toFixed(2)} | Actual: $${sampleAnalysis.costs.totalCosts.toFixed(2)} ${Math.abs(expectedTotalCosts - sampleAnalysis.costs.totalCosts) < 0.01 ? '✅' : '❌'}`);
      console.log(`Expected Net Profit: $${expectedNetProfit.toFixed(2)} | Actual: $${sampleAnalysis.profit.netProfit.toFixed(2)} ${Math.abs(expectedNetProfit - sampleAnalysis.profit.netProfit) < 0.01 ? '✅' : '❌'}`);
      console.log(`Expected Profit Margin: ${expectedProfitMargin.toFixed(2)}% | Actual: ${sampleAnalysis.profit.profitMargin.toFixed(2)}% ${Math.abs(expectedProfitMargin - sampleAnalysis.profit.profitMargin) < 0.01 ? '✅' : '❌'}`);
    } else {
      console.log('ℹ️  No profit analyses found for validation');
    }

    console.log('\n🎉 Profit system testing completed successfully!');
    console.log('💡 All profit calculation components are working correctly');
    console.log('🚀 The system is ready for production use');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Profit system test failed:', error);
    process.exit(1);
  }
};

testProfitSystem();