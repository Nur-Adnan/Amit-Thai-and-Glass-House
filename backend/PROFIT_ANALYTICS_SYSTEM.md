# Profit Analytics System

## Overview

The Profit Analytics System provides comprehensive profit calculation and analysis capabilities for the Thai and Aluminum business. It implements the exact profit calculation formula requested and generates detailed reports across daily, monthly, and product-wise dimensions.

## ✅ Implemented Features

### 1. Core Profit Calculations
- **Profit Formula**: `Profit = Total Sales - Product Cost - Salaries - Other Expenses`
- **Profit Margin**: `Profit Margin (%) = (Profit / Total Sales) × 100`
- **Automatic Calculations**: All calculations performed automatically with high precision
- **Real-time Analysis**: Generate profit reports on-demand for any date range

### 2. Analysis Types
- **Daily Profit**: Calculate profit for any specific date
- **Monthly Profit**: Calculate profit for any month/year combination
- **Product-wise Profit**: Detailed breakdown by individual products
- **Custom Period**: Flexible date range analysis

### 3. Advanced Analytics
- **Profit Trends**: Track profit performance over time
- **Top Performing Products**: Identify most profitable products
- **Cost Breakdown**: Detailed expense categorization
- **Dashboard Metrics**: Executive summary with key performance indicators

### 4. Business Intelligence
- **Profit Status**: Profitable, Break-even, or Loss classification
- **Performance Indicators**: Gross margin, net margin, average order value
- **Trend Analysis**: Period-over-period comparisons
- **Product Performance**: Revenue, cost, profit, and margin per product

## 📁 File Structure

```
backend/src/
├── models/
│   └── ProfitAnalytics.js         ✅ Complete profit analytics model
├── services/
│   └── profitCalculationService.js ✅ Core calculation engine
├── controllers/
│   └── profitController.js        ✅ API endpoints and business logic
├── routes/
│   └── profit.js                  ✅ Secure API routes
└── scripts/
    ├── seedProfitAnalyses.js      ✅ Sample profit data generation
    └── testProfitSystem.js        ✅ Comprehensive system testing
```

## 🧮 Calculation Logic

### Revenue Calculation (Total Sales)
```javascript
// Source: Paid and partially paid invoices
const totalSales = await Invoice.aggregate([
  {
    $match: {
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['paid', 'partial'] },
      isActive: true
    }
  },
  {
    $group: {
      _id: null,
      totalSales: { $sum: '$paidAmount' } // Use actual paid amount
    }
  }
]);
```

### Product Cost Calculation (COGS)
```javascript
// Source: Purchase price of sold products
const productCosts = await Invoice.aggregate([
  // Match paid invoices
  { $match: { /* paid invoices filter */ } },
  { $unwind: '$items' },
  // Join with product details
  { $lookup: { from: 'products', /* ... */ } },
  {
    $group: {
      _id: null,
      totalProductCost: {
        $sum: {
          $multiply: ['$items.quantity', '$productDetails.purchasePrice']
        }
      }
    }
  }
]);
```

### Salary Expenses Calculation
```javascript
// Source: Approved salary expenses
const salaryExpenses = await Expense.aggregate([
  {
    $match: {
      expenseDate: { $gte: startDate, $lte: endDate },
      category: 'Salary Expense',
      status: 'approved'
    }
  },
  {
    $group: {
      _id: null,
      totalSalaryExpenses: { $sum: '$amount' }
    }
  }
]);
```

### Other Expenses Calculation
```javascript
// Source: All non-salary approved expenses
const otherExpenses = await Expense.aggregate([
  {
    $match: {
      expenseDate: { $gte: startDate, $lte: endDate },
      category: { $ne: 'Salary Expense' },
      status: 'approved'
    }
  },
  {
    $group: {
      _id: null,
      totalOtherExpenses: { $sum: '$amount' }
    }
  }
]);
```

### Final Profit Calculation
```javascript
// Automatic calculation in ProfitAnalytics model
const totalCosts = productCosts + salaryExpenses + otherExpenses;
const grossProfit = totalSales - productCosts;
const netProfit = totalSales - totalCosts;
const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;
```

## 🚀 API Endpoints

### Calculation Endpoints
- `POST /api/profit/daily` - Calculate daily profit
- `POST /api/profit/monthly` - Calculate monthly profit
- `POST /api/profit/product-wise` - Calculate product-wise profit

### Analysis Endpoints
- `GET /api/profit/analyses` - Get all profit analyses
- `GET /api/profit/analyses/:id` - Get specific analysis
- `GET /api/profit/trends` - Get profit trends over time
- `GET /api/profit/top-products` - Get top performing products
- `GET /api/profit/dashboard` - Get executive dashboard

### Management Endpoints
- `DELETE /api/profit/analyses/:id` - Delete analysis (Owner only)

## 📊 Response Examples

### Daily Profit Response
```json
{
  "success": true,
  "data": {
    "analysisId": "PROFIT-202601-0001",
    "period": {
      "start": "2026-01-03T00:00:00.000Z",
      "end": "2026-01-03T23:59:59.999Z",
      "type": "daily"
    },
    "revenue": {
      "totalSales": 15000.00,
      "invoiceCount": 25,
      "averageOrderValue": 600.00
    },
    "costs": {
      "productCosts": 8500.00,
      "salaryExpenses": 3200.00,
      "otherExpenses": 1800.00,
      "totalCosts": 13500.00
    },
    "profit": {
      "grossProfit": 6500.00,
      "netProfit": 1500.00,
      "profitMargin": 10.00
    },
    "profitStatus": "profitable",
    "costBreakdownPercentages": {
      "productCosts": 62.96,
      "salaryExpenses": 23.70,
      "otherExpenses": 13.33
    }
  }
}
```

### Product-wise Profit Response
```json
{
  "success": true,
  "data": {
    "analysisId": "PROFIT-202601-0002",
    "productBreakdown": [
      {
        "product": "product_id_1",
        "productName": "Premium Thai Marble - White",
        "quantitySold": 50,
        "revenue": 7500.00,
        "cost": 5000.00,
        "profit": 2500.00,
        "profitMargin": 33.33
      },
      {
        "product": "product_id_2",
        "productName": "Tempered Glass Panel - 8mm",
        "quantitySold": 30,
        "revenue": 4500.00,
        "cost": 2700.00,
        "profit": 1800.00,
        "profitMargin": 40.00
      }
    ]
  }
}
```

### Dashboard Response
```json
{
  "success": true,
  "data": {
    "period": {
      "type": "current-month",
      "start": "2026-01-01T00:00:00.000Z",
      "end": "2026-01-31T23:59:59.999Z"
    },
    "summary": {
      "totalSales": 125000.00,
      "totalCosts": 98000.00,
      "totalProfit": 27000.00,
      "profitMargin": 21.60,
      "profitabilityRate": 85.71
    },
    "trends": [
      {
        "_id": { "year": 2026, "month": 1, "day": 1 },
        "totalSales": 5000.00,
        "totalCosts": 3800.00,
        "netProfit": 1200.00,
        "profitMargin": 24.00
      }
    ],
    "topProducts": [
      {
        "productName": "Premium Thai Marble - White",
        "totalProfit": 8500.00,
        "profitMargin": 35.42,
        "totalQuantitySold": 150,
        "totalRevenue": 24000.00
      }
    ]
  }
}
```

## 🔧 Usage Instructions

### 1. Setup and Testing
```bash
# Test the profit system
npm run test:profit

# Generate sample profit analyses
npm run seed:profit

# Start the server
npm run dev
```

### 2. Calculate Daily Profit
```bash
curl -X POST /api/profit/daily \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-01-03"}'
```

### 3. Calculate Monthly Profit
```bash
curl -X POST /api/profit/monthly \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"month": 1, "year": 2026}'
```

### 4. Get Product-wise Analysis
```bash
curl -X POST /api/profit/product-wise \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-01-01",
    "endDate": "2026-01-31"
  }'
```

### 5. View Dashboard
```bash
curl -X GET "/api/profit/dashboard?period=current-month" \
  -H "Authorization: Bearer <token>"
```

## 📈 Business Intelligence Features

### Profit Status Classification
- **Profitable**: Net profit > $0 (Green indicator)
- **Break-even**: Net profit = $0 (Yellow indicator)
- **Loss**: Net profit < $0 (Red indicator)

### Key Performance Indicators
- **Gross Profit Margin**: (Revenue - Product Costs) / Revenue
- **Net Profit Margin**: (Revenue - Total Costs) / Revenue
- **Average Order Value**: Total Sales / Number of Invoices
- **Cost Efficiency**: Product Costs / Total Costs ratio

### Trend Analysis
- **Daily Trends**: Track daily profit patterns
- **Monthly Trends**: Monitor monthly performance
- **Period Comparisons**: Compare current vs previous periods
- **Growth Rates**: Calculate profit growth percentages

### Product Performance Metrics
- **Revenue per Product**: Total sales by product
- **Profit per Product**: Net profit contribution
- **Margin per Product**: Profitability percentage
- **Volume Analysis**: Quantity sold vs profit relationship

## 🔒 Security and Access Control

### Role-based Access
- **Owner**: Full access to all profit analytics
- **Manager**: Can calculate and view all profit reports
- **Accountant**: Read-only access to profit analyses

### Data Security
- **Authentication**: JWT token required for all endpoints
- **Input Validation**: Comprehensive validation on all inputs
- **SQL Injection Prevention**: MongoDB aggregation pipeline protection
- **Audit Trail**: Complete tracking of who calculated what and when

## 🧪 Testing and Validation

### Comprehensive Test Suite
- **Data Availability**: Validates required data exists
- **Calculation Accuracy**: Verifies formula implementations
- **Formula Validation**: Cross-checks mathematical accuracy
- **Performance Testing**: Ensures fast response times
- **Edge Case Handling**: Tests zero sales, negative profits, etc.

### Test Coverage
- ✅ Daily profit calculations
- ✅ Monthly profit calculations
- ✅ Product-wise profit breakdowns
- ✅ Trend analysis algorithms
- ✅ Top product identification
- ✅ Dashboard metric aggregation
- ✅ Database query optimization
- ✅ Error handling and edge cases

## 📊 Data Sources and Accuracy

### Revenue Data Sources
- **Primary**: Invoice.paidAmount (actual payments received)
- **Filter**: Only paid and partially paid invoices
- **Period**: Based on invoice creation date
- **Validation**: Active invoices only

### Cost Data Sources
- **Product Costs**: Product.purchasePrice × quantity sold
- **Salary Expenses**: Expense records with category 'Salary Expense'
- **Other Expenses**: All non-salary approved expenses
- **Validation**: Only approved expenses included

### Data Integrity
- **Real-time Calculations**: Always uses current data
- **Atomic Operations**: Consistent data during calculations
- **Decimal Precision**: 2 decimal places for all monetary values
- **Zero Division Handling**: Graceful handling of edge cases

## 🎯 Business Value

### Financial Insights
1. **Profitability Analysis**: Understand which periods are most profitable
2. **Cost Control**: Identify cost categories consuming the most resources
3. **Product Performance**: Determine which products drive the most profit
4. **Trend Identification**: Spot profit trends and seasonal patterns

### Decision Support
1. **Pricing Decisions**: Use profit margins to optimize pricing
2. **Product Focus**: Concentrate on high-margin products
3. **Cost Optimization**: Target high-cost categories for reduction
4. **Performance Monitoring**: Track business health over time

### Operational Benefits
1. **Automated Reporting**: Eliminate manual profit calculations
2. **Real-time Insights**: Get instant profit analysis
3. **Historical Tracking**: Maintain complete profit history
4. **Scalable Analysis**: Handle growing business data volumes

## 🔄 Future Enhancements

### Potential Improvements
1. **Forecasting**: Predict future profits based on trends
2. **Budget Comparison**: Compare actual vs budgeted profits
3. **Scenario Analysis**: What-if analysis for different scenarios
4. **Advanced Visualizations**: Charts and graphs for better insights
5. **Export Capabilities**: PDF and Excel export functionality
6. **Automated Alerts**: Notifications for profit thresholds
7. **Multi-currency Support**: Handle different currencies
8. **Seasonal Analysis**: Identify seasonal profit patterns

---

## ✅ Task Completion Summary

**Profit Analytics System** is now **COMPLETE** with:

- ✅ **Core Calculations**: Exact formula implementation (Profit = Sales - Product Cost - Salaries - Other Expenses)
- ✅ **Daily Profit**: Calculate and track daily profitability
- ✅ **Monthly Profit**: Comprehensive monthly profit analysis
- ✅ **Product-wise Profit**: Detailed product performance breakdown
- ✅ **Advanced Analytics**: Trends, top products, dashboard metrics
- ✅ **Business Intelligence**: KPIs, status classification, performance indicators
- ✅ **Secure APIs**: Role-based access with comprehensive validation
- ✅ **Real-time Calculations**: On-demand profit analysis
- ✅ **Data Accuracy**: Precise calculations with proper data sources
- ✅ **Testing Suite**: Comprehensive validation and testing
- ✅ **Documentation**: Complete API and usage documentation

The system provides exactly what was requested:
- **Profit = Total Sales - Product Cost - Salaries - Other Expenses** ✅
- **Profit Margin (%) = (Profit / Total Sales) × 100** ✅
- **Daily profit generation** ✅
- **Monthly profit generation** ✅
- **Product-wise profit analysis** ✅

The profit analytics system is production-ready and fully integrated with the existing Thai and Aluminum business management platform.