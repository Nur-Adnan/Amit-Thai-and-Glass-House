import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Investment from '../models/Investment.js';
import User from '../models/User.js';
import connectDB from '../config/database.js';

dotenv.config();

const seedInvestments = async () => {
  try {
    await connectDB();

    // Clear existing investments
    await Investment.deleteMany({});

    // Get a user to assign as creator
    const user = await User.findOne({ role: 'owner' });
    if (!user) {
      console.log('No owner user found. Please run seed:owner first.');
      process.exit(1);
    }

    // Sample investments data
    const investments = [
      {
        title: 'New Cutting Machine Purchase',
        description: 'High-precision cutting machine for Thai marble processing',
        amount: 150000,
        investmentType: 'Machinery',
        category: 'Capital Expenditure',
        investmentDate: new Date('2025-12-15'),
        expectedROI: {
          percentage: 25,
          timeframe: 'annually',
          description: 'Expected to increase production capacity by 40%'
        },
        paymentMethod: 'bank_transfer',
        referenceNumber: 'MACH-2025-001',
        vendor: {
          name: 'Industrial Machinery Corp',
          contact: '+1-555-1001',
          address: '123 Industrial Ave, Manufacturing District'
        },
        depreciation: {
          method: 'straight-line',
          usefulLife: 10,
          salvageValue: 15000
        },
        status: 'completed',
        approvedBy: user._id,
        approvedAt: new Date('2025-12-10'),
        completedAt: new Date('2025-12-20'),
        actualROI: {
          amount: 165000,
          percentage: 10,
          lastUpdated: new Date('2026-01-01')
        },
        createdBy: user._id
      },
      {
        title: 'Warehouse Expansion Project',
        description: 'Expansion of main warehouse to increase storage capacity',
        amount: 250000,
        investmentType: 'Infrastructure',
        category: 'Capital Expenditure',
        investmentDate: new Date('2025-11-01'),
        expectedROI: {
          percentage: 15,
          timeframe: 'annually',
          description: 'Increased storage capacity will reduce rental costs'
        },
        paymentMethod: 'loan',
        referenceNumber: 'WAREHOUSE-EXP-2025',
        vendor: {
          name: 'Construction Solutions Ltd',
          contact: '+1-555-1002',
          address: '456 Construction Blvd, City'
        },
        status: 'completed',
        approvedBy: user._id,
        approvedAt: new Date('2025-10-25'),
        completedAt: new Date('2025-12-30'),
        createdBy: user._id
      },
      {
        title: 'ERP Software Implementation',
        description: 'Enterprise Resource Planning software for business automation',
        amount: 75000,
        investmentType: 'Technology',
        category: 'Operational Investment',
        investmentDate: new Date('2026-01-01'),
        expectedROI: {
          percentage: 30,
          timeframe: 'annually',
          description: 'Automation will reduce operational costs and improve efficiency'
        },
        paymentMethod: 'bank_transfer',
        referenceNumber: 'ERP-2026-001',
        vendor: {
          name: 'TechSolutions Inc',
          contact: '+1-555-1003',
          address: '789 Tech Park, Innovation District'
        },
        status: 'approved',
        approvedBy: user._id,
        approvedAt: new Date('2025-12-28'),
        createdBy: user._id
      },
      {
        title: 'Employee Training Program',
        description: 'Comprehensive training program for production staff',
        amount: 25000,
        investmentType: 'Training',
        category: 'Operational Investment',
        investmentDate: new Date('2026-01-02'),
        expectedROI: {
          percentage: 20,
          timeframe: 'annually',
          description: 'Improved skills will increase productivity and reduce errors'
        },
        paymentMethod: 'card',
        referenceNumber: 'TRAIN-2026-001',
        vendor: {
          name: 'Professional Training Institute',
          contact: '+1-555-1004'
        },
        status: 'approved',
        approvedBy: user._id,
        approvedAt: new Date('2025-12-30'),
        createdBy: user._id
      },
      {
        title: 'Quality Control Equipment',
        description: 'Advanced quality control and testing equipment',
        amount: 45000,
        investmentType: 'Equipment',
        category: 'Capital Expenditure',
        investmentDate: new Date('2025-12-20'),
        expectedROI: {
          percentage: 18,
          timeframe: 'annually',
          description: 'Better quality control will reduce waste and improve customer satisfaction'
        },
        paymentMethod: 'bank_transfer',
        referenceNumber: 'QC-EQUIP-2025',
        vendor: {
          name: 'Quality Systems Ltd',
          contact: '+1-555-1005',
          address: '321 Quality Street, Industrial Zone'
        },
        depreciation: {
          method: 'straight-line',
          usefulLife: 8,
          salvageValue: 5000
        },
        status: 'completed',
        approvedBy: user._id,
        approvedAt: new Date('2025-12-18'),
        completedAt: new Date('2025-12-25'),
        createdBy: user._id
      },
      {
        title: 'Marketing Campaign - Trade Show',
        description: 'Participation in international trade show for market expansion',
        amount: 35000,
        investmentType: 'Marketing Campaign',
        category: 'Strategic Investment',
        investmentDate: new Date('2026-01-03'),
        expectedROI: {
          percentage: 40,
          timeframe: 'annually',
          description: 'Expected to generate new business leads and partnerships'
        },
        paymentMethod: 'card',
        referenceNumber: 'TRADE-SHOW-2026',
        vendor: {
          name: 'International Trade Expo',
          contact: '+1-555-1006'
        },
        status: 'pending',
        createdBy: user._id
      },
      {
        title: 'Research & Development Lab',
        description: 'Setting up R&D lab for new product development',
        amount: 120000,
        investmentType: 'Research & Development',
        category: 'Strategic Investment',
        investmentDate: new Date('2025-12-01'),
        expectedROI: {
          percentage: 35,
          timeframe: 'annually',
          description: 'New product development will open new market segments'
        },
        paymentMethod: 'bank_transfer',
        referenceNumber: 'RND-LAB-2025',
        vendor: {
          name: 'Lab Equipment Specialists',
          contact: '+1-555-1007',
          address: '654 Research Blvd, Science Park'
        },
        status: 'approved',
        approvedBy: user._id,
        approvedAt: new Date('2025-11-28'),
        createdBy: user._id
      },
      {
        title: 'Delivery Vehicle Fleet',
        description: 'Purchase of delivery trucks for improved logistics',
        amount: 180000,
        investmentType: 'Equipment',
        category: 'Capital Expenditure',
        investmentDate: new Date('2025-11-15'),
        expectedROI: {
          percentage: 22,
          timeframe: 'annually',
          description: 'Own delivery fleet will reduce logistics costs'
        },
        paymentMethod: 'loan',
        referenceNumber: 'FLEET-2025-001',
        vendor: {
          name: 'Commercial Vehicles Ltd',
          contact: '+1-555-1008',
          address: '987 Auto Plaza, Commercial District'
        },
        depreciation: {
          method: 'declining-balance',
          usefulLife: 12,
          salvageValue: 20000
        },
        status: 'completed',
        approvedBy: user._id,
        approvedAt: new Date('2025-11-10'),
        completedAt: new Date('2025-11-25'),
        actualROI: {
          amount: 190000,
          percentage: 5.5,
          lastUpdated: new Date('2026-01-01')
        },
        createdBy: user._id
      }
    ];

    // Generate investment IDs and create investments
    for (const investmentData of investments) {
      const investmentId = await Investment.generateInvestmentId();
      await Investment.create({
        ...investmentData,
        investmentId
      });
    }

    console.log('✅ Sample investments created successfully');
    console.log(`📊 Created ${investments.length} investment records`);
    console.log('💡 Investment types included: Machinery, Infrastructure, Technology, Training, Equipment, Marketing, R&D');
    console.log('📈 Investment categories: Capital Expenditure, Operational Investment, Strategic Investment');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding investments:', error);
    process.exit(1);
  }
};

seedInvestments();