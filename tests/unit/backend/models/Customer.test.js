const Customer = require('../../../../backend/src/models/Customer.js').default;

describe('Customer Model', () => {
  describe('Validation', () => {
    test('should create a valid customer', async () => {
      const customerData = {
        name: 'John Doe',
        phone: '01712345678',
        email: 'john@example.com',
        customerType: 'regular',
        creditLimit: 5000
      };

      const customer = new Customer(customerData);
      const savedCustomer = await customer.save();

      expect(savedCustomer._id).toBeDefined();
      expect(savedCustomer.customerId).toMatch(/^CUST-\d{4}$/);
      expect(savedCustomer.name).toBe(customerData.name);
      expect(savedCustomer.phone).toBe(customerData.phone);
      expect(savedCustomer.creditLimit).toBe(customerData.creditLimit);
    });

    test('should require name field', async () => {
      const customer = new Customer({
        phone: '01712345678',
        customerType: 'regular'
      });

      await expect(customer.save()).rejects.toThrow('Path `name` is required');
    });

    test('should validate Bangladesh phone number format', async () => {
      const customer = new Customer({
        name: 'Test Customer',
        phone: '123456789', // Invalid format
        customerType: 'regular'
      });

      await expect(customer.save()).rejects.toThrow();
    });

    test('should validate email format', async () => {
      const customer = new Customer({
        name: 'Test Customer',
        phone: '01712345678',
        email: 'invalid-email', // Invalid format
        customerType: 'regular'
      });

      await expect(customer.save()).rejects.toThrow();
    });

    test('should validate customer type enum', async () => {
      const customer = new Customer({
        name: 'Test Customer',
        phone: '01712345678',
        customerType: 'invalid-type' // Invalid enum value
      });

      await expect(customer.save()).rejects.toThrow();
    });
  });

  describe('Virtual Fields', () => {
    test('should calculate credit utilization correctly', async () => {
      const customer = new Customer({
        name: 'Test Customer',
        phone: '01712345678',
        customerType: 'regular',
        creditLimit: 10000,
        totalDue: 3000
      });

      expect(customer.creditUtilization).toBe(30);
    });

    test('should calculate credit available correctly', async () => {
      const customer = new Customer({
        name: 'Test Customer',
        phone: '01712345678',
        customerType: 'regular',
        creditLimit: 10000,
        totalDue: 3000
      });

      expect(customer.creditAvailable).toBe(7000);
    });

    test('should determine credit status correctly', async () => {
      // Good credit status
      const goodCustomer = new Customer({
        name: 'Good Customer',
        phone: '01712345678',
        customerType: 'regular',
        creditLimit: 10000,
        totalDue: 2000
      });
      expect(goodCustomer.creditStatus).toBe('good');

      // Warning credit status
      const warningCustomer = new Customer({
        name: 'Warning Customer',
        phone: '01812345678',
        customerType: 'regular',
        creditLimit: 10000,
        totalDue: 8000
      });
      expect(warningCustomer.creditStatus).toBe('warning');

      // Blocked credit status
      const blockedCustomer = new Customer({
        name: 'Blocked Customer',
        phone: '01912345678',
        customerType: 'regular',
        creditLimit: 10000,
        totalDue: 12000
      });
      expect(blockedCustomer.creditStatus).toBe('blocked');
    });
  });

  describe('Static Methods', () => {
    test('should generate unique customer ID', async () => {
      const id1 = await Customer.generateCustomerId();
      const id2 = await Customer.generateCustomerId();

      expect(id1).toMatch(/^CUST-\d{4}$/);
      expect(id2).toMatch(/^CUST-\d{4}$/);
      expect(id1).not.toBe(id2);
    });

    test('should find customers by credit risk', async () => {
      // Create test customers with different risk levels
      await Customer.create({
        name: 'Low Risk Customer',
        phone: '01712345678',
        customerType: 'regular',
        creditLimit: 10000,
        totalDue: 1000
      });

      await Customer.create({
        name: 'High Risk Customer',
        phone: '01812345678',
        customerType: 'regular',
        creditLimit: 10000,
        totalDue: 9000
      });

      const highRiskCustomers = await Customer.findByCreditRisk('high');
      expect(highRiskCustomers).toHaveLength(1);
      expect(highRiskCustomers[0].name).toBe('High Risk Customer');
    });
  });

  describe('Instance Methods', () => {
    test('should update total due amount', async () => {
      const customer = await Customer.create({
        name: 'Test Customer',
        phone: '01712345678',
        customerType: 'regular',
        creditLimit: 10000,
        totalDue: 1000
      });

      await customer.updateTotalDue(2000);
      expect(customer.totalDue).toBe(2000);
    });

    test('should check if invoice creation is allowed', async () => {
      const customer = await Customer.create({
        name: 'Test Customer',
        phone: '01712345678',
        customerType: 'regular',
        creditLimit: 10000,
        totalDue: 5000
      });

      // Should allow invoice creation within credit limit
      expect(customer.canCreateInvoice(3000)).toBe(true);

      // Should not allow invoice creation exceeding credit limit
      expect(customer.canCreateInvoice(8000)).toBe(false);
    });
  });

  describe('Middleware', () => {
    test('should generate customer ID before saving', async () => {
      const customer = new Customer({
        name: 'Test Customer',
        phone: '01712345678',
        customerType: 'regular'
      });

      const savedCustomer = await customer.save();
      expect(savedCustomer.customerId).toMatch(/^CUST-\d{4}$/);
    });

    test('should set default values', async () => {
      const customer = new Customer({
        name: 'Test Customer',
        phone: '01712345678',
        customerType: 'regular'
      });

      const savedCustomer = await customer.save();
      expect(savedCustomer.totalDue).toBe(0);
      expect(savedCustomer.creditLimit).toBe(0);
      expect(savedCustomer.isActive).toBe(true);
    });
  });
});