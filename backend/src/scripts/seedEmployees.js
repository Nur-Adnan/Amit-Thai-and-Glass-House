import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import Employee from '../models/Employee.js';
import User from '../models/User.js';

dotenv.config();

const seedEmployees = async () => {
  try {
    await connectDB();

    // Find a user to assign as creator
    const user = await User.findOne({ role: { $in: ['owner', 'manager'] } });
    if (!user) {
      console.log('No owner or manager found. Please create a user first.');
      process.exit(1);
    }

    // Clear existing employees
    await Employee.deleteMany();

    const sampleEmployees = [
      {
        name: 'John Smith',
        email: 'john.smith@company.com',
        phone: '+1-555-0101',
        address: '123 Main St, City, State 12345',
        position: 'Sales Manager',
        department: 'Sales',
        monthlySalary: 45000,
        employmentType: 'full-time',
        bankDetails: {
          accountNumber: '1234567890',
          bankName: 'ABC Bank',
          ifscCode: 'ABC0001234'
        },
        createdBy: user._id
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        phone: '+1-555-0102',
        address: '456 Oak Ave, City, State 12345',
        position: 'Production Supervisor',
        department: 'Production',
        monthlySalary: 38000,
        employmentType: 'full-time',
        bankDetails: {
          accountNumber: '2345678901',
          bankName: 'XYZ Bank',
          ifscCode: 'XYZ0001234'
        },
        createdBy: user._id
      },
      {
        name: 'Mike Davis',
        email: 'mike.davis@company.com',
        phone: '+1-555-0103',
        address: '789 Pine St, City, State 12345',
        position: 'Warehouse Assistant',
        department: 'Warehouse',
        monthlySalary: 25000,
        employmentType: 'full-time',
        bankDetails: {
          accountNumber: '3456789012',
          bankName: 'DEF Bank',
          ifscCode: 'DEF0001234'
        },
        createdBy: user._id
      },
      {
        name: 'Lisa Wilson',
        email: 'lisa.wilson@company.com',
        phone: '+1-555-0104',
        address: '321 Elm St, City, State 12345',
        position: 'Accountant',
        department: 'Finance',
        monthlySalary: 35000,
        employmentType: 'full-time',
        bankDetails: {
          accountNumber: '4567890123',
          bankName: 'GHI Bank',
          ifscCode: 'GHI0001234'
        },
        createdBy: user._id
      },
      {
        name: 'Tom Brown',
        email: 'tom.brown@company.com',
        phone: '+1-555-0105',
        address: '654 Maple Ave, City, State 12345',
        position: 'HR Assistant',
        department: 'HR',
        monthlySalary: 28000,
        employmentType: 'part-time',
        bankDetails: {
          accountNumber: '5678901234',
          bankName: 'JKL Bank',
          ifscCode: 'JKL0001234'
        },
        createdBy: user._id
      }
    ];

    // Create employees one by one to trigger ID generation
    const createdEmployees = [];
    for (const employeeData of sampleEmployees) {
      const employeeId = await Employee.generateEmployeeId();
      employeeData.employeeId = employeeId;
      
      const employee = await Employee.create(employeeData);
      createdEmployees.push(employee);
    }

    console.log(`${createdEmployees.length} sample employees created successfully:`);
    createdEmployees.forEach(employee => {
      console.log(`- ${employee.employeeId}: ${employee.name} (${employee.department}) - $${employee.monthlySalary}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding employees:', error);
    process.exit(1);
  }
};

seedEmployees();