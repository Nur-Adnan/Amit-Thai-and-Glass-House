import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import {
  calculateDailyProfit,
  calculateMonthlyProfit,
  calculateProductWiseProfit
} from '../services/profitCalculationService.js';

dotenv.config();

const seedProfitAnalyses = async () => {
  try {
    await connectDB();
    console.log('🔗 Connected to database');

    // Get a user to assign as calculator
    const user = await User.findOne({ role: 'owner' });
    if (!user) {
      console.log('❌ No owner user found. Please run seed:owner first.');
      process.exit(1);
    }
    console.log('👤 Found user:', user.name);

    // Check if we have the required data
    const Invoice = (await import('../models/Invoice.js')).default;
    const Expense = (await import('../models/Expense.js')).default;
    
    const invoiceCount = await Invoice.countDocuments();
    const expenseCount = await Expense.countDocuments();
    
    if (invoiceCount === 0 || expenseCount === 0) {
      console.log('⚠️  Warning: No invoices or expenses found. Profit calculations may be empty.');
      console.log(`📊 Found ${invoiceCount} invoices and ${expenseCount} expenses`);
    }

    console.log('📈 Generating profit analyses...');

    // 1. Generate daily profit analyses for the last 7 days
    console.log('\n📅 Generating daily profit analyses...');
    const dailyAnalyses = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      try {
        const analysis = await calculateDailyProfit(date, user);
        dailyAnalyses.push(analysis);
        console.log(`✅ Daily analysis for ${date.toDateString()}: $${analysis.profit.netProfit.toFixed(2)} profit`);
      } catch (error) {
        console.log(`⚠️  Daily analysis for ${date.toDateString()} failed: ${error.message}`);
      }
    }

    // 2. Generate monthly profit analyses for the last 3 months
    console.log('\n📊 Generating monthly profit analyses...');
    const monthlyAnalyses = [];
    
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      
      try {
        const analysis = await calculateMonthlyProfit(month, year, user);
        monthlyAnalyses.push(analysis);
        console.log(`✅ Monthly analysis for ${month}/${year}: $${analysis.profit.netProfit.toFixed(2)} profit`);
      } catch (error) {
        console.log(`⚠️  Monthly analysis for ${month}/${year} failed: ${error.message}`);
      }
    }

    // 3. Generate product-wise profit analysis for current month
    console.log('\n🏷️  Generating product-wise profit analysis...');
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    try {
      const productAnalysis = await calculateProductWiseProfit(startOfMonth, endOfMonth, user);
      console.log(`✅ Product-wise analysis: ${productAnalysis.productBreakdown.length} products analyzed`);
      
      // Show top 3 products
      const topProducts = productAnalysis.productBreakdown
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 3);
      
      topProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.productName}: $${product.profit.toFixed(2)} profit (${product.profitMargin.toFixed(1)}% margin)`);
      });
    } catch (error) {
      console.log(`⚠️  Product-wise analysis failed: ${error.message}`);
    }

    // 4. Generate summary statistics
    console.log('\n📈 Summary Statistics:');
    console.log(`📅 Daily analyses generated: ${dailyAnalyses.length}`);
    console.log(`📊 Monthly analyses generated: ${monthlyAnalyses.length}`);
    
    const totalDailyProfit = dailyAnalyses.reduce((sum, analysis) => sum + analysis.profit.netProfit, 0);
    const totalMonthlyProfit = monthlyAnalyses.reduce((sum, analysis) => sum + analysis.profit.netProfit, 0);
    
    console.log(`💰 Total daily profit (last 7 days): $${totalDailyProfit.toFixed(2)}`);
    console.log(`💰 Total monthly profit (last 3 months): $${totalMonthlyProfit.toFixed(2)}`);
    
    if (dailyAnalyses.length > 0) {
      const avgDailyProfit = totalDailyProfit / dailyAnalyses.length;
      console.log(`📊 Average daily profit: $${avgDailyProfit.toFixed(2)}`);
    }
    
    if (monthlyAnalyses.length > 0) {
      const avgMonthlyProfit = totalMonthlyProfit / monthlyAnalyses.length;
      console.log(`📊 Average monthly profit: $${avgMonthlyProfit.toFixed(2)}`);
    }

    console.log('\n🎉 Profit analyses seeding completed successfully!');
    console.log('💡 You can now use the profit analytics endpoints to view detailed reports');
    console.log('🔍 Try: GET /api/profit/dashboard?period=current-month');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding profit analyses:', error);
    process.exit(1);
  }
};

seedProfitAnalyses();