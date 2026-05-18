import mongoose from 'mongoose';

const profitAnalyticsSchema = new mongoose.Schema({
  analysisId: {
    type: String,
    required: [true, 'Analysis ID is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^PROFIT-\d{6}-\d{4}$/, 'Analysis ID must follow format PROFIT-YYYYMM-XXXX']
  },
  analysisType: {
    type: String,
    required: [true, 'Analysis type is required'],
    enum: {
      values: ['daily', 'monthly', 'product-wise', 'custom-period'],
      message: 'Analysis type must be daily, monthly, product-wise, or custom-period'
    }
  },
  analysisDate: {
    type: Date,
    required: [true, 'Analysis date is required'],
    default: Date.now
  },
  periodStart: {
    type: Date,
    required: [true, 'Period start date is required']
  },
  periodEnd: {
    type: Date,
    required: [true, 'Period end date is required']
  },
  // Revenue Components
  revenue: {
    totalSales: {
      type: Number,
      required: [true, 'Total sales is required'],
      min: [0, 'Total sales cannot be negative'],
      default: 0
    },
    invoiceCount: {
      type: Number,
      min: [0, 'Invoice count cannot be negative'],
      default: 0
    },
    averageOrderValue: {
      type: Number,
      min: [0, 'Average order value cannot be negative'],
      default: 0
    }
  },
  // Cost Components
  costs: {
    productCosts: {
      type: Number,
      required: [true, 'Product costs is required'],
      min: [0, 'Product costs cannot be negative'],
      default: 0
    },
    salaryExpenses: {
      type: Number,
      required: [true, 'Salary expenses is required'],
      min: [0, 'Salary expenses cannot be negative'],
      default: 0
    },
    otherExpenses: {
      type: Number,
      required: [true, 'Other expenses is required'],
      min: [0, 'Other expenses cannot be negative'],
      default: 0
    },
    totalCosts: {
      type: Number,
      required: [true, 'Total costs is required'],
      min: [0, 'Total costs cannot be negative'],
      default: 0
    }
  },
  // Profit Calculations
  profit: {
    grossProfit: {
      type: Number,
      required: [true, 'Gross profit is required'],
      default: 0
    },
    netProfit: {
      type: Number,
      required: [true, 'Net profit is required'],
      default: 0
    },
    profitMargin: {
      type: Number,
      required: [true, 'Profit margin is required'],
      min: [-100, 'Profit margin cannot be less than -100%'],
      max: [100, 'Profit margin cannot exceed 100%'],
      default: 0
    }
  },
  // Product-specific data (for product-wise analysis)
  productBreakdown: [{
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product'
    },
    productName: String,
    quantitySold: {
      type: Number,
      min: [0, 'Quantity sold cannot be negative'],
      default: 0
    },
    revenue: {
      type: Number,
      min: [0, 'Product revenue cannot be negative'],
      default: 0
    },
    cost: {
      type: Number,
      min: [0, 'Product cost cannot be negative'],
      default: 0
    },
    profit: {
      type: Number,
      default: 0
    },
    profitMargin: {
      type: Number,
      min: [-100, 'Product profit margin cannot be less than -100%'],
      max: [100, 'Product profit margin cannot exceed 100%'],
      default: 0
    }
  }],
  // Expense breakdown
  expenseBreakdown: {
    salaryExpenseDetails: [{
      category: {
        type: String,
        required: true
      },
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      count: {
        type: Number,
        required: true,
        min: 0
      }
    }],
    otherExpenseDetails: [{
      category: {
        type: String,
        required: true
      },
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      count: {
        type: Number,
        required: true,
        min: 0
      }
    }]
  },
  // Metadata
  calculatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  calculationMethod: {
    type: String,
    enum: ['automatic', 'manual'],
    default: 'automatic'
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  }
}, {
  timestamps: true
});

// Generate analysis ID
profitAnalyticsSchema.statics.generateAnalysisId = async function() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const yearMonth = `${year}${month}`;
  
  // Find the last analysis for this month
  const lastAnalysis = await this.findOne({
    analysisId: { $regex: `^PROFIT-${yearMonth}-` }
  }).sort({ analysisId: -1 });
  
  let sequence = 1;
  if (lastAnalysis) {
    const lastSequence = parseInt(lastAnalysis.analysisId.split('-')[2]);
    sequence = lastSequence + 1;
  }
  
  const sequenceStr = String(sequence).padStart(4, '0');
  return `PROFIT-${yearMonth}-${sequenceStr}`;
};

// Pre-save middleware to calculate totals and margins
profitAnalyticsSchema.pre('save', function() {
  // Calculate total costs
  this.costs.totalCosts = this.costs.productCosts + this.costs.salaryExpenses + this.costs.otherExpenses;
  
  // Calculate gross profit (Revenue - Product Costs)
  this.profit.grossProfit = this.revenue.totalSales - this.costs.productCosts;
  
  // Calculate net profit (Revenue - All Costs)
  this.profit.netProfit = this.revenue.totalSales - this.costs.totalCosts;
  
  // Calculate profit margin
  if (this.revenue.totalSales > 0) {
    this.profit.profitMargin = (this.profit.netProfit / this.revenue.totalSales) * 100;
  } else {
    this.profit.profitMargin = 0;
  }
  
  // Calculate average order value
  if (this.revenue.invoiceCount > 0) {
    this.revenue.averageOrderValue = this.revenue.totalSales / this.revenue.invoiceCount;
  } else {
    this.revenue.averageOrderValue = 0;
  }
  
  // Calculate product-wise profit margins
  this.productBreakdown.forEach(product => {
    product.profit = product.revenue - product.cost;
    if (product.revenue > 0) {
      product.profitMargin = (product.profit / product.revenue) * 100;
    } else {
      product.profitMargin = 0;
    }
  });
});

// Virtual for profit status
profitAnalyticsSchema.virtual('profitStatus').get(function() {
  if (this.profit.netProfit > 0) return 'profitable';
  if (this.profit.netProfit === 0) return 'break-even';
  return 'loss';
});

// Virtual for cost breakdown percentages
profitAnalyticsSchema.virtual('costBreakdownPercentages').get(function() {
  if (this.costs.totalCosts === 0) return { productCosts: 0, salaryExpenses: 0, otherExpenses: 0 };
  
  return {
    productCosts: (this.costs.productCosts / this.costs.totalCosts) * 100,
    salaryExpenses: (this.costs.salaryExpenses / this.costs.totalCosts) * 100,
    otherExpenses: (this.costs.otherExpenses / this.costs.totalCosts) * 100
  };
});

// Index for better query performance
profitAnalyticsSchema.index({ analysisId: 1 });
profitAnalyticsSchema.index({ analysisType: 1 });
profitAnalyticsSchema.index({ analysisDate: -1 });
profitAnalyticsSchema.index({ periodStart: 1, periodEnd: 1 });
profitAnalyticsSchema.index({ 'profit.profitMargin': -1 });
profitAnalyticsSchema.index({ createdAt: -1 });

// Include virtuals when converting to JSON
profitAnalyticsSchema.set('toJSON', { virtuals: true });
profitAnalyticsSchema.set('toObject', { virtuals: true });

export default mongoose.model('ProfitAnalytics', profitAnalyticsSchema);