import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Load test environment variables
dotenv.config({ path: '.env.test' });

let mongoServer;

// Global test setup
beforeAll(async () => {
  // Start in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri);
  
  console.log('🧪 Test database connected');
});

// Global test teardown
afterAll(async () => {
  // Close database connection
  await mongoose.connection.close();
  
  // Stop the in-memory MongoDB instance
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  console.log('🧪 Test database disconnected');
});

// Clean up between tests
afterEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Global test utilities
global.testUtils = {
  // Create test user with JWT token
  createTestUser: async (userData = {}) => {
    const { default: User } = await import('../src/models/User.js');
    
    // Generate unique email to avoid duplicates
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    
    const defaultUser = {
      name: 'Test User',
      email: `test-${timestamp}-${randomId}@example.com`,
      password: 'password123',
      role: 'owner',
      ...userData
    };
    
    const user = new User(defaultUser);
    await user.save();
    
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
    return { user, token };
  },
  
  // Create test customer
  createTestCustomer: async (customerData = {}) => {
    const { default: Customer } = await import('../src/models/Customer.js');
    
    // Create a default user if createdBy is not provided
    let createdBy = customerData.createdBy;
    if (!createdBy) {
      const userResult = await global.testUtils.createTestUser({ role: 'owner' });
      createdBy = userResult.user._id;
    }
    
    const defaultCustomer = {
      name: 'Test Customer',
      phone: '01712345678',
      email: 'customer@example.com',
      customerType: 'regular',
      creditLimit: 10000,
      createdBy,
      ...customerData
    };
    
    const customer = new Customer(defaultCustomer);
    await customer.save();
    
    return customer;
  },
  
  // Create test product
  createTestProduct: async (productData = {}) => {
    const { default: Product } = await import('../src/models/Product.js');
    
    const defaultProduct = {
      name: 'Test Glass',
      category: 'Glass',
      stockQuantity: 100,
      unit: 'sqft', // Use valid unit
      purchasePrice: 50,
      sellingPrice: 80,
      ...productData
    };
    
    const product = new Product(defaultProduct);
    await product.save();
    
    return product;
  },
  
  // Create test supplier
  createTestSupplier: async (supplierData = {}) => {
    const { default: Supplier } = await import('../src/models/Supplier.js');
    
    // Create a default user if createdBy is not provided
    let createdBy = supplierData.createdBy;
    if (!createdBy) {
      const userResult = await global.testUtils.createTestUser({ role: 'owner' });
      createdBy = userResult.user._id;
    }
    
    const defaultSupplier = {
      name: 'Test Supplier',
      phone: '01712345678',
      email: 'supplier@example.com',
      address: 'Test Address, Dhaka',
      createdBy,
      ...supplierData
    };
    
    const supplier = new Supplier(defaultSupplier);
    await supplier.save();
    
    return supplier;
  },
  
  // Create test invoice
  createTestInvoice: async (invoiceData = {}) => {
    const { default: Invoice } = await import('../src/models/Invoice.js');
    
    // Create a default user if createdBy is not provided
    let createdBy = invoiceData.createdBy;
    if (!createdBy) {
      const userResult = await global.testUtils.createTestUser({ role: 'owner' });
      createdBy = userResult.user._id;
    }
    
    // Create customer and product with proper createdBy field
    const customer = await global.testUtils.createTestCustomer({ createdBy });
    const product = await global.testUtils.createTestProduct({ createdBy });
    
    // Calculate proper totals
    const quantity = invoiceData.quantity || 10;
    const unitPrice = invoiceData.unitPrice || product.sellingPrice;
    const totalPrice = quantity * unitPrice;
    const subtotal = totalPrice;
    const discount = invoiceData.discount || 0;
    const grandTotal = subtotal - discount;
    const paidAmount = invoiceData.paidAmount || 0;
    const dueAmount = grandTotal - paidAmount;
    
    // Generate proper invoice number format: PREFIX-YYYYMM-XXXX
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const sequence = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
    const invoiceNo = `INV-${year}${month}-${sequence}`;
    
    const defaultInvoice = {
      invoiceNo: invoiceNo,
      customer: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerType: 'regular',
      invoiceType: 'FINAL',
      items: [{
        product: product._id,
        productName: product.name,
        quantity: quantity,
        unit: product.unit,
        unitPrice: unitPrice,
        totalPrice: totalPrice
      }],
      subtotal: subtotal,
      discount: discount,
      discountType: 'amount',
      grandTotal: grandTotal,
      paidAmount: paidAmount,
      dueAmount: dueAmount,
      status: paidAmount === 0 ? 'due' : (paidAmount >= grandTotal ? 'paid' : 'partial'),
      paymentMethod: 'cash',
      createdBy,
      ...invoiceData
    };
    
    const invoice = new Invoice(defaultInvoice);
    await invoice.save();
    
    return invoice;
  }
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.PORT = '3001';