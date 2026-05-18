import asyncHandler from '../utils/asyncHandler.js';
import Product from '../models/Product.js';
import Brand from '../models/Brand.js';
import MaterialSpec from '../models/MaterialSpec.js';
import StockPurchase from '../models/StockPurchase.js';
import Investment from '../models/Investment.js';
import mongoose from 'mongoose';
import { MoneyValidator } from '../utils/validation.js';
import BusinessRulesService from '../services/businessRulesService.js';
import AuditService from '../services/auditService.js';
import CurrencyService from '../services/currencyService.js';

// @desc    Get form data for BD shop stock addition
// @route   GET /api/bd-shop-inventory/form-data
// @access  Private (Manager and above)
export const getStockFormData = asyncHandler(async (req, res) => {
  try {
    // Get all active brands grouped by material type
    const brands = await Brand.find({
      isActive: true,
      isDeleted: { $ne: true }
    }).select('name materialType country notes').sort({ materialType: 1, name: 1 });

    // Group brands by material type
    const brandsByMaterial = {
      Thai: brands.filter(brand => brand.materialType === 'Thai'),
      Glass: brands.filter(brand => brand.materialType === 'Glass')
    };

    // Get material specifications
    const materialSpecs = await MaterialSpec.find({
      isActive: true,
      isDeleted: { $ne: true }
    }).select('materialType thicknessMM quality defaultUnit').sort({ materialType: 1, thicknessMM: 1 });

    // Group specs by material type
    const specsByMaterial = {
      Thai: materialSpecs.filter(spec => spec.materialType === 'Thai'),
      Glass: materialSpecs.filter(spec => spec.materialType === 'Glass')
    };

    // Get unique thickness options for Glass
    const glassThicknesses = [...new Set(
      materialSpecs
        .filter(spec => spec.materialType === 'Glass')
        .map(spec => spec.thicknessMM)
    )].sort((a, b) => a - b);

    // Get unique quality options
    const qualityOptions = [...new Set(
      materialSpecs.map(spec => spec.quality)
    )].sort();

    // Measurement type options
    const measurementTypes = [
      { value: 'SFT', label: 'Square Feet (SFT)', bangla: 'বর্গফুট' },
      { value: 'RFT', label: 'Running Feet (RFT)', bangla: 'রানিং ফুট' },
      { value: 'PANEL', label: 'Panel', bangla: 'প্যানেল' },
      { value: 'SHEET', label: 'Sheet', bangla: 'শিট' },
      { value: 'PIECE', label: 'Piece', bangla: 'পিস' }
    ];

    // Material type options
    const materialTypes = [
      { value: 'Thai', label: 'Thai Glass', bangla: 'থাই গ্লাস' },
      { value: 'Glass', label: 'Glass', bangla: 'কাঁচ' }
    ];

    res.status(200).json({
      success: true,
      data: {
        materialTypes,
        brands: brandsByMaterial,
        thicknesses: {
          Glass: glassThicknesses.map(thickness => ({
            value: thickness,
            label: `${thickness}mm`,
            bangla: `${thickness}মিমি`
          })),
          Thai: [] // Thai doesn't use thickness
        },
        qualities: qualityOptions.map(quality => ({
          value: quality,
          label: quality,
          bangla: quality === 'Local' ? 'দেশীয়' : quality === 'Imported' ? 'আমদানিকৃত' : quality === 'Premium' ? 'প্রিমিয়াম' : quality
        })),
        measurementTypes,
        specs: specsByMaterial,
        defaultValues: {
          materialType: 'Glass',
          measurementType: 'SFT',
          quality: 'Local'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load form data',
      error: error.message
    });
  }
});

// @desc    Search companies/brands
// @route   GET /api/bd-shop-inventory/search-companies
// @access  Private (Manager and above)
export const searchCompanies = asyncHandler(async (req, res) => {
  const { q, materialType } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Search query must be at least 2 characters'
    });
  }

  try {
    const query = {
      isActive: true,
      isDeleted: { $ne: true },
      name: { $regex: q, $options: 'i' }
    };

    if (materialType) {
      query.materialType = materialType;
    }

    const companies = await Brand.find(query)
      .select('name materialType country notes')
      .sort({ name: 1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: companies.map(company => ({
        id: company._id,
        name: company.name,
        materialType: company.materialType,
        country: company.country,
        notes: company.notes,
        label: `${company.name}${company.country ? ` (${company.country})` : ''}`,
        value: company.name
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to search companies',
      error: error.message
    });
  }
});

// @desc    Add new company/brand
// @route   POST /api/bd-shop-inventory/add-company
// @access  Private (Manager and above)
export const addNewCompany = asyncHandler(async (req, res) => {
  const { name, materialType, country, notes } = req.body;

  // Validate required fields
  if (!name || !materialType) {
    return res.status(400).json({
      success: false,
      message: 'Company name and material type are required'
    });
  }

  // Check if company already exists
  const existingCompany = await Brand.findOne({
    name: { $regex: `^${name}$`, $options: 'i' },
    materialType
  });

  if (existingCompany) {
    if (existingCompany.isDeleted) {
      // Restore soft-deleted company
      existingCompany.isDeleted = false;
      existingCompany.isActive = true;
      existingCompany.deletedAt = undefined;
      existingCompany.deletedBy = undefined;
      existingCompany.updatedBy = req.user.id;
      await existingCompany.save();

      return res.status(200).json({
        success: true,
        message: 'Company restored successfully',
        data: {
          id: existingCompany._id,
          name: existingCompany.name,
          materialType: existingCompany.materialType,
          country: existingCompany.country,
          notes: existingCompany.notes,
          label: `${existingCompany.name}${existingCompany.country ? ` (${existingCompany.country})` : ''}`,
          value: existingCompany.name
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: `Company "${name}" already exists for ${materialType}`
      });
    }
  }

  // Create new company
  const newCompany = new Brand({
    name: name.trim(),
    materialType,
    country: country?.trim(),
    notes: notes?.trim(),
    createdBy: req.user.id
  });

  await newCompany.save();

  res.status(201).json({
    success: true,
    message: 'Company added successfully',
    data: {
      id: newCompany._id,
      name: newCompany.name,
      materialType: newCompany.materialType,
      country: newCompany.country,
      notes: newCompany.notes,
      label: `${newCompany.name}${newCompany.country ? ` (${newCompany.country})` : ''}`,
      value: newCompany.name
    }
  });
});

// @desc    Add stock in BD shop style
// @route   POST /api/bd-shop-inventory/add-stock
// @access  Private (Manager and above)
export const addStock = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const {
        materialType,
        company,
        thicknessMM,
        quality,
        measurementType,
        purchasePrice,
        sellingPrice,
        stockQuantity,
        notes,
        supplierInfo
      } = req.body;

      // Validate required fields
      const validation = await BusinessRulesService.validateProductVariant({
        materialType,
        company,
        thicknessMM: materialType === 'Glass' ? thicknessMM : undefined,
        quality,
        measurementType
      });

      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Validate prices and quantity
      const purchasePriceValidation = MoneyValidator.validateAmount(purchasePrice, 'Purchase price', {
        allowZero: true,
        maxAmount: 100000
      });

      if (!purchasePriceValidation.isValid) {
        throw new Error(`Invalid purchase price: ${purchasePriceValidation.errors.join(', ')}`);
      }

      const sellingPriceValidation = MoneyValidator.validateAmount(sellingPrice, 'Selling price', {
        allowZero: false,
        maxAmount: 100000
      });

      if (!sellingPriceValidation.isValid) {
        throw new Error(`Invalid selling price: ${sellingPriceValidation.errors.join(', ')}`);
      }

      const quantityValidation = MoneyValidator.validateAmount(stockQuantity, 'Stock quantity', {
        allowZero: false,
        maxAmount: 100000
      });

      if (!quantityValidation.isValid) {
        throw new Error(`Invalid stock quantity: ${quantityValidation.errors.join(', ')}`);
      }

      // Check if product variant already exists
      const existingProduct = await Product.findOne({
        materialType,
        company,
        thicknessMM: materialType === 'Glass' ? thicknessMM : undefined,
        quality,
        measurementType,
        isActive: true,
        isDeleted: { $ne: true }
      }).session(session);

      let product;
      let isNewProduct = false;

      if (existingProduct) {
        // Update existing product
        product = existingProduct;
        product.stockQuantity += quantityValidation.sanitizedAmount;
        product.purchasePrice = purchasePriceValidation.sanitizedAmount;
        product.sellingPrice = sellingPriceValidation.sanitizedAmount;
        product.updatedBy = req.user.id;
        
        if (notes) {
          product.notes = notes;
        }

        await product.save({ session });
      } else {
        // Create new product
        isNewProduct = true;
        
        // Generate product name
        let productName = `${materialType}`;
        if (materialType === 'Glass' && thicknessMM) {
          productName += ` ${thicknessMM}mm`;
        }
        productName += ` ${quality}`;

        // Map measurement type to unit
        let unit;
        switch(measurementType) {
          case 'SFT': unit = 'sqft'; break;
          case 'RFT': unit = 'rft'; break;
          case 'PANEL': unit = 'panel'; break;
          case 'SHEET': unit = 'sheet'; break;
          case 'PIECE': unit = 'piece'; break;
          default: unit = 'sqft';
        }

        product = new Product({
          name: productName,
          materialType,
          company,
          thicknessMM: materialType === 'Glass' ? thicknessMM : undefined,
          quality,
          measurementType,
          unit,
          purchasePrice: purchasePriceValidation.sanitizedAmount,
          sellingPrice: sellingPriceValidation.sanitizedAmount,
          stockQuantity: quantityValidation.sanitizedAmount,
          notes,
          createdBy: req.user.id
        });

        await product.save({ session });
      }

      // Create stock purchase record if supplier info provided
      let stockPurchase = null;
      let investment = null;

      if (supplierInfo && supplierInfo.supplierId) {
        const totalCost = quantityValidation.sanitizedAmount * purchasePriceValidation.sanitizedAmount;

        // Create stock purchase
        stockPurchase = new StockPurchase({
          supplier: supplierInfo.supplierId,
          supplierName: supplierInfo.supplierName,
          items: [{
            product: product._id,
            productName: product.name,
            materialType: product.materialType,
            company: product.company,
            thicknessMM: product.thicknessMM,
            quality: product.quality,
            measurementType: product.measurementType,
            quantity: quantityValidation.sanitizedAmount,
            unit: product.measurementType,
            purchasePrice: purchasePriceValidation.sanitizedAmount,
            totalCost: totalCost,
            previousStock: existingProduct ? existingProduct.stockQuantity : 0,
            newStock: product.stockQuantity
          }],
          subtotal: totalCost,
          grandTotal: totalCost,
          paidAmount: supplierInfo.paidAmount || 0,
          dueAmount: totalCost - (supplierInfo.paidAmount || 0),
          paymentMethod: supplierInfo.paymentMethod || 'cash',
          notes: `BD Shop stock addition - ${product.name}`,
          createdBy: req.user.id
        });

        await stockPurchase.save({ session });

        // Create investment record
        investment = new Investment({
          type: 'stock_purchase',
          category: 'inventory',
          description: `BD Shop stock addition - ${product.name}`,
          amount: totalCost,
          relatedDocument: {
            documentType: 'stock_purchase',
            documentId: stockPurchase._id,
            documentNo: stockPurchase.purchaseNo
          },
          supplier: supplierInfo.supplierId,
          supplierName: supplierInfo.supplierName,
          paymentMethod: supplierInfo.paymentMethod || 'cash',
          notes: `Investment for BD shop stock addition`,
          createdBy: req.user.id
        });

        await investment.save({ session });

        // Link investment to stock purchase
        stockPurchase.investmentRecord = investment._id;
        await stockPurchase.save({ session });
      }

      // Log audit trail
      await AuditService.log({
        action: isNewProduct ? 'BD_SHOP_PRODUCT_CREATE' : 'BD_SHOP_STOCK_ADD',
        entityType: 'Product',
        entityId: product._id,
        performedBy: req.user.id,
        details: {
          productName: product.name,
          materialType: product.materialType,
          company: product.company,
          thicknessMM: product.thicknessMM,
          quality: product.quality,
          quantityAdded: quantityValidation.sanitizedAmount,
          newStockLevel: product.stockQuantity,
          purchasePrice: purchasePriceValidation.sanitizedAmount,
          sellingPrice: sellingPriceValidation.sanitizedAmount,
          isNewProduct,
          stockPurchaseId: stockPurchase?._id,
          investmentId: investment?._id
        },
        metadata: {
          source: 'BD Shop Inventory',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      }, req);

      // Populate product for response
      await product.populate('createdBy updatedBy', 'name email');

      res.status(isNewProduct ? 201 : 200).json({
        success: true,
        message: isNewProduct ? 'New product created and stock added successfully' : 'Stock added to existing product successfully',
        data: {
          product: {
            id: product._id,
            name: product.name,
            materialType: product.materialType,
            company: product.company,
            thicknessMM: product.thicknessMM,
            quality: product.quality,
            measurementType: product.measurementType,
            stockQuantity: product.stockQuantity,
            purchasePrice: product.purchasePrice,
            sellingPrice: product.sellingPrice,
            formattedPurchasePrice: CurrencyService.formatBDT(product.purchasePrice),
            formattedSellingPrice: CurrencyService.formatBDT(product.sellingPrice),
            formattedStockQuantity: `${product.stockQuantity} ${product.measurementType}`,
            isNewProduct
          },
          stockPurchase: stockPurchase ? {
            id: stockPurchase._id,
            purchaseNo: stockPurchase.purchaseNo,
            grandTotal: stockPurchase.grandTotal,
            formattedGrandTotal: CurrencyService.formatBDT(stockPurchase.grandTotal)
          } : null,
          investment: investment ? {
            id: investment._id,
            investmentNo: investment.investmentNo,
            amount: investment.amount,
            formattedAmount: CurrencyService.formatBDT(investment.amount)
          } : null
        }
      });
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
      suggestion: 'Please check all required fields and ensure valid data is provided'
    });
  } finally {
    await session.endSession();
  }
});

// @desc    Get stock summary for BD shop
// @route   GET /api/bd-shop-inventory/summary
// @access  Private (Manager and above)
export const getStockSummary = asyncHandler(async (req, res) => {
  const { materialType, company } = req.query;

  try {
    // Build query
    const query = {
      isActive: true,
      isDeleted: { $ne: true },
      materialType: { $exists: true }
    };

    if (materialType) {
      query.materialType = materialType;
    }

    if (company) {
      query.company = company;
    }

    // Get stock summary
    const summary = await Product.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            materialType: '$materialType',
            company: '$company',
            quality: '$quality'
          },
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$stockQuantity' },
          totalValue: { $sum: { $multiply: ['$stockQuantity', '$sellingPrice'] } },
          totalCost: { $sum: { $multiply: ['$stockQuantity', '$purchasePrice'] } },
          avgSellingPrice: { $avg: '$sellingPrice' },
          avgPurchasePrice: { $avg: '$purchasePrice' },
          thicknesses: { $addToSet: '$thicknessMM' }
        }
      },
      {
        $addFields: {
          materialType: '$_id.materialType',
          company: '$_id.company',
          quality: '$_id.quality',
          potentialProfit: { $subtract: ['$totalValue', '$totalCost'] },
          profitMargin: {
            $cond: [
              { $gt: ['$totalCost', 0] },
              { $multiply: [{ $divide: [{ $subtract: ['$totalValue', '$totalCost'] }, '$totalCost'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { materialType: 1, company: 1, quality: 1 } }
    ]);

    // Format summary
    const formattedSummary = summary.map(item => ({
      ...item,
      formattedTotalStock: `${item.totalStock.toFixed(2)} SFT`,
      formattedTotalValue: CurrencyService.formatBDT(item.totalValue),
      formattedTotalCost: CurrencyService.formatBDT(item.totalCost),
      formattedPotentialProfit: CurrencyService.formatBDT(item.potentialProfit),
      formattedProfitMargin: `${item.profitMargin.toFixed(2)}%`,
      formattedAvgSellingPrice: CurrencyService.formatBDT(item.avgSellingPrice),
      formattedAvgPurchasePrice: CurrencyService.formatBDT(item.avgPurchasePrice),
      thicknessRange: item.thicknesses.filter(t => t).sort((a, b) => a - b).join(', ') + 'mm'
    }));

    // Overall totals
    const overallTotals = {
      totalProducts: summary.reduce((sum, item) => sum + item.totalProducts, 0),
      totalStock: summary.reduce((sum, item) => sum + item.totalStock, 0),
      totalValue: summary.reduce((sum, item) => sum + item.totalValue, 0),
      totalCost: summary.reduce((sum, item) => sum + item.totalCost, 0)
    };

    overallTotals.potentialProfit = overallTotals.totalValue - overallTotals.totalCost;
    overallTotals.profitMargin = overallTotals.totalCost > 0 ? 
      ((overallTotals.potentialProfit / overallTotals.totalCost) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: formattedSummary,
        totals: {
          ...overallTotals,
          formattedTotalStock: `${overallTotals.totalStock.toFixed(2)} SFT`,
          formattedTotalValue: CurrencyService.formatBDT(overallTotals.totalValue),
          formattedTotalCost: CurrencyService.formatBDT(overallTotals.totalCost),
          formattedPotentialProfit: CurrencyService.formatBDT(overallTotals.potentialProfit),
          formattedProfitMargin: `${overallTotals.profitMargin.toFixed(2)}%`
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get stock summary',
      error: error.message
    });
  }
});