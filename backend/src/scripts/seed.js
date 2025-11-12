require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const logger = require('../config/logger');

// Import models
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const Product = require('../models/Product');

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info('Connected to database for seeding');

    // Clear existing data
    await Promise.all([
      Tenant.deleteMany({}),
      User.deleteMany({}),
      Customer.deleteMany({}),
      Invoice.deleteMany({}),
      Expense.deleteMany({}),
      Product.deleteMany({})
    ]);
    logger.info('Cleared existing data');

    // Create sample tenant
    const tenant = await Tenant.create({
      name: 'Jamaica Tech Solutions',
      currency: 'JMD',
      plan: 'PRO',
      settings: {
        timezone: 'America/Jamaica',
        dateFormat: 'DD/MM/YYYY',
        invoicePrefix: 'JTS',
        invoiceNumber: 1,
        taxRate: 15,
        paymentTerms: 30,
        defaultCurrency: 'JMD'
      }
    });
    logger.info('Created sample tenant');

    // Create sample users
    const owner = await User.create({
      email: 'owner@jamaicatech.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Smith',
      role: 'OWNER',
      tenantId: tenant._id,
      isActive: true,
      lastLogin: new Date()
    });

    const accountant = await User.create({
      email: 'accountant@jamaicatech.com',
      password: 'password123',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'ACCOUNTANT',
      tenantId: tenant._id,
      isActive: true,
      lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    });

    const staff = await User.create({
      email: 'staff@jamaicatech.com',
      password: 'password123',
      firstName: 'Mike',
      lastName: 'Brown',
      role: 'STAFF',
      tenantId: tenant._id,
      isActive: true,
      lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    });

    logger.info('Created sample users');

    // Create comprehensive products
    const products = await Product.create([
      // Software Development Services
      {
        name: 'Web Development Services',
        description: 'Custom web application development using React, Node.js, and modern technologies',
        sku: 'WEB-DEV-001',
        unitPrice: 15000,
        cost: 5000,
        unit: 'HOUR',
        taxRate: 15,
        category: 'SERVICES',
        isActive: true,
        isService: true,
        stockQuantity: 0,
        minStockLevel: 0,
        maxStockLevel: 0,
        tags: ['web', 'development', 'react', 'nodejs'],
        tenantId: tenant._id,
        createdBy: owner._id
      },
      {
        name: 'Mobile App Development',
        description: 'Cross-platform mobile application development using React Native',
        sku: 'MOBILE-DEV-001',
        unitPrice: 20000,
        cost: 7000,
        unit: 'HOUR',
        taxRate: 15,
        category: 'SERVICES',
        isActive: true,
        isService: true,
        stockQuantity: 0,
        minStockLevel: 0,
        maxStockLevel: 0,
        tags: ['mobile', 'react-native', 'ios', 'android'],
        tenantId: tenant._id,
        createdBy: owner._id
      },
      {
        name: 'Database Design & Optimization',
        description: 'Database architecture, design, and performance optimization services',
        sku: 'DB-DESIGN-001',
        unitPrice: 18000,
        cost: 6000,
        unit: 'HOUR',
        taxRate: 15,
        category: 'SERVICES',
        isActive: true,
        isService: true,
        stockQuantity: 0,
        minStockLevel: 0,
        maxStockLevel: 0,
        tags: ['database', 'mysql', 'mongodb', 'optimization'],
        tenantId: tenant._id,
        createdBy: accountant._id
      },
      {
        name: 'Cloud Infrastructure Setup',
        description: 'AWS, Azure, and Google Cloud infrastructure setup and management',
        sku: 'CLOUD-SETUP-001',
        unitPrice: 25000,
        cost: 8000,
        unit: 'HOUR',
        taxRate: 15,
        category: 'SERVICES',
        isActive: true,
        isService: true,
        stockQuantity: 0,
        minStockLevel: 0,
        maxStockLevel: 0,
        tags: ['cloud', 'aws', 'azure', 'infrastructure'],
        tenantId: tenant._id,
        createdBy: staff._id
      },
      {
        name: 'SEO Optimization Services',
        description: 'Search engine optimization and digital marketing services',
        sku: 'SEO-OPT-001',
        unitPrice: 8000,
        cost: 3000,
        unit: 'HOUR',
        taxRate: 15,
        category: 'SERVICES',
        isActive: true,
        isService: true,
        stockQuantity: 0,
        minStockLevel: 0,
        maxStockLevel: 0,
        tags: ['seo', 'marketing', 'digital', 'optimization'],
        tenantId: tenant._id,
        createdBy: accountant._id
      },
      {
        name: 'Consulting Services',
        description: 'Business consulting and technical advisory services',
        sku: 'CONSULT-001',
        unitPrice: 12000,
        cost: 4000,
        unit: 'HOUR',
        taxRate: 15,
        category: 'SERVICES',
        isActive: true,
        isService: true,
        stockQuantity: 0,
        minStockLevel: 0,
        maxStockLevel: 0,
        tags: ['consulting', 'business', 'advisory'],
        tenantId: tenant._id,
        createdBy: owner._id
      },
      // Software Licenses
      {
        name: 'Microsoft Office 365 Business',
        description: 'Annual Microsoft Office 365 Business license for up to 5 users',
        sku: 'MS-OFFICE-365',
        unitPrice: 8500,
        cost: 6000,
        unit: 'PIECE',
        taxRate: 15,
        category: 'SOFTWARE',
        isActive: true,
        isService: false,
        stockQuantity: 15,
        minStockLevel: 3,
        maxStockLevel: 25,
        tags: ['microsoft', 'office', 'license', 'annual'],
        tenantId: tenant._id,
        createdBy: accountant._id
      },
      {
        name: 'Adobe Creative Cloud',
        description: 'Adobe Creative Cloud subscription for design and creative work',
        sku: 'ADOBE-CC-001',
        unitPrice: 12000,
        cost: 9000,
        unit: 'PIECE',
        taxRate: 15,
        category: 'SOFTWARE',
        isActive: true,
        isService: false,
        stockQuantity: 8,
        minStockLevel: 2,
        maxStockLevel: 15,
        tags: ['adobe', 'creative', 'design', 'subscription'],
        tenantId: tenant._id,
        createdBy: staff._id
      },
      {
        name: 'JetBrains IntelliJ IDEA',
        description: 'Professional IDE for Java, Kotlin, and other JVM languages',
        sku: 'INTELLIJ-PRO',
        unitPrice: 15000,
        cost: 11000,
        unit: 'PIECE',
        taxRate: 15,
        category: 'SOFTWARE',
        isActive: true,
        isService: false,
        stockQuantity: 5,
        minStockLevel: 1,
        maxStockLevel: 10,
        tags: ['jetbrains', 'ide', 'java', 'kotlin'],
        tenantId: tenant._id,
        createdBy: owner._id
      },
      // Hardware
      {
        name: 'Dell XPS 15 Laptop',
        description: 'Dell XPS 15 laptop with Intel i7, 16GB RAM, 512GB SSD',
        sku: 'DELL-XPS-15',
        unitPrice: 180000,
        cost: 150000,
        unit: 'PIECE',
        taxRate: 15,
        category: 'HARDWARE',
        isActive: true,
        isService: false,
        stockQuantity: 3,
        minStockLevel: 1,
        maxStockLevel: 8,
        priority: 'CRITICAL',
        tags: ['dell', 'laptop', 'xps', 'i7'],
        tenantId: tenant._id,
        createdBy: accountant._id
      },
      {
        name: 'MacBook Pro 16-inch',
        description: 'Apple MacBook Pro 16-inch with M2 Pro chip, 16GB RAM, 512GB SSD',
        sku: 'MACBOOK-PRO-16',
        unitPrice: 250000,
        cost: 220000,
        unit: 'PIECE',
        taxRate: 15,
        category: 'HARDWARE',
        isActive: true,
        isService: false,
        stockQuantity: 2,
        minStockLevel: 1,
        maxStockLevel: 5,
        priority: 'MUST_HAVE',
        tags: ['apple', 'macbook', 'm2', 'pro'],
        tenantId: tenant._id,
        createdBy: owner._id
      },
      {
        name: 'Dell Monitor 27-inch 4K',
        description: 'Dell UltraSharp 27-inch 4K monitor with USB-C connectivity',
        sku: 'DELL-MONITOR-27',
        unitPrice: 45000,
        cost: 35000,
        unit: 'PIECE',
        taxRate: 15,
        category: 'HARDWARE',
        isActive: true,
        isService: false,
        stockQuantity: 8,
        minStockLevel: 2,
        maxStockLevel: 15,
        tags: ['dell', 'monitor', '4k', 'usb-c'],
        tenantId: tenant._id,
        createdBy: staff._id
      },
      // Cloud Services
      {
        name: 'AWS EC2 Instance',
        description: 'Amazon Web Services EC2 instance for cloud hosting',
        sku: 'AWS-EC2-001',
        unitPrice: 5000,
        cost: 3000,
        unit: 'MONTH',
        taxRate: 15,
        category: 'SERVICES',
        isActive: true,
        isService: true,
        stockQuantity: 0,
        minStockLevel: 0,
        maxStockLevel: 0,
        tags: ['aws', 'ec2', 'cloud', 'hosting'],
        tenantId: tenant._id,
        createdBy: owner._id
      },
      {
        name: 'Google Cloud Storage',
        description: 'Google Cloud Storage for file and data storage',
        sku: 'GCS-STORAGE-001',
        unitPrice: 2000,
        cost: 1200,
        unit: 'MONTH',
        taxRate: 15,
        category: 'SERVICES',
        isActive: true,
        isService: true,
        stockQuantity: 0,
        minStockLevel: 0,
        maxStockLevel: 0,
        tags: ['google', 'cloud', 'storage', 'files'],
        tenantId: tenant._id,
        createdBy: accountant._id
      }
    ]);
    logger.info('Created comprehensive products');

    // Create comprehensive customers
    const customers = await Customer.create([
      {
        name: 'Kingston Manufacturing Ltd',
        email: 'billing@kingstonmfg.com',
        phone: '+1-876-555-0101',
        address: {
          street: '123 Industrial Road',
          city: 'Kingston',
          parish: 'St. Andrew',
          country: 'Jamaica'
        },
        taxId: 'TAX123456789',
        notes: 'Large manufacturing client with regular IT needs',
        status: 'active',
        creditLimit: 500000,
        paymentTerms: 30,
        tenantId: tenant._id,
        createdBy: owner._id
      },
      {
        name: 'Montego Bay Resort & Spa',
        email: 'accounts@mobayresort.com',
        phone: '+1-876-555-0202',
        address: {
          street: '456 Resort Drive',
          city: 'Montego Bay',
          parish: 'St. James',
          country: 'Jamaica'
        },
        taxId: 'TAX987654321',
        notes: 'Tourism industry client requiring website and booking system',
        status: 'active',
        creditLimit: 300000,
        paymentTerms: 15,
        tenantId: tenant._id,
        createdBy: accountant._id
      },
      {
        name: 'Portmore Tech Hub',
        email: 'finance@portmoretech.com',
        phone: '+1-876-555-0303',
        address: {
          street: '789 Tech Boulevard',
          city: 'Portmore',
          parish: 'St. Catherine',
          country: 'Jamaica'
        },
        taxId: 'TAX456789123',
        notes: 'Technology startup requiring mobile app development',
        status: 'active',
        creditLimit: 200000,
        paymentTerms: 30,
        tenantId: tenant._id,
        createdBy: staff._id
      },
      {
        name: 'Spanish Town Medical Center',
        email: 'admin@spanishtownmedical.com',
        phone: '+1-876-555-0404',
        address: {
          street: '321 Health Street',
          city: 'Spanish Town',
          parish: 'St. Catherine',
          country: 'Jamaica'
        },
        taxId: 'TAX789123456',
        notes: 'Medical facility requiring patient management system',
        status: 'active',
        creditLimit: 400000,
        paymentTerms: 45,
        tenantId: tenant._id,
        createdBy: owner._id
      },
      {
        name: 'Negril Beach Hotel',
        email: 'finance@negrilbeach.com',
        phone: '+1-876-555-0505',
        address: {
          street: '654 Beach Road',
          city: 'Negril',
          parish: 'Westmoreland',
          country: 'Jamaica'
        },
        taxId: 'TAX321654987',
        notes: 'Beachfront hotel requiring online booking and payment system',
        status: 'active',
        creditLimit: 350000,
        paymentTerms: 30,
        tenantId: tenant._id,
        createdBy: accountant._id
      },
      {
        name: 'Mandeville Coffee Co.',
        email: 'orders@mandevillecoffee.com',
        phone: '+1-876-555-0606',
        address: {
          street: '987 Coffee Lane',
          city: 'Mandeville',
          parish: 'Manchester',
          country: 'Jamaica'
        },
        taxId: 'TAX654987321',
        notes: 'Coffee company requiring e-commerce platform',
        status: 'active',
        creditLimit: 150000,
        paymentTerms: 30,
        tenantId: tenant._id,
        createdBy: staff._id
      }
    ]);
    logger.info('Created comprehensive customers');

    // Create comprehensive invoices
    const invoices = await Invoice.create([
      {
        number: 'JTS-001',
        type: 'INVOICE',
        customerId: customers[0]._id,
        items: [
          {
            description: 'Web Development Services',
            quantity: 40,
            unitPrice: 15000,
            total: 600000
          },
          {
            description: 'Database Design & Optimization',
            quantity: 15,
            unitPrice: 18000,
            total: 270000
          },
          {
            description: 'Microsoft Office 365 Business',
            quantity: 5,
            unitPrice: 8500,
            total: 42500
          }
        ],
        subtotal: 912500,
        taxRate: 15,
        taxAmount: 136875,
        total: 1049375,
        status: 'PAID',
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        issueDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        paidDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        notes: 'Payment received via bank transfer',
        tenantId: tenant._id,
        createdBy: owner._id
      },
      {
        number: 'JTS-002',
        type: 'INVOICE',
        customerId: customers[1]._id,
        items: [
          {
            description: 'Mobile App Development',
            quantity: 60,
            unitPrice: 20000,
            total: 1200000
          },
          {
            description: 'Cloud Infrastructure Setup',
            quantity: 20,
            unitPrice: 25000,
            total: 500000
          }
        ],
        subtotal: 1700000,
        taxRate: 15,
        taxAmount: 255000,
        total: 1955000,
        status: 'SENT',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        issueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        notes: 'Mobile app for resort booking system',
        tenantId: tenant._id,
        createdBy: accountant._id
      },
      {
        number: 'JTS-003',
        type: 'QUOTE',
        customerId: customers[2]._id,
        items: [
          {
            description: 'Web Development Services',
            quantity: 80,
            unitPrice: 15000,
            total: 1200000
          },
          {
            description: 'SEO Optimization Services',
            quantity: 20,
            unitPrice: 8000,
            total: 160000
          }
        ],
        subtotal: 1360000,
        taxRate: 15,
        taxAmount: 204000,
        total: 1564000,
        status: 'DRAFT',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        issueDate: new Date(),
        notes: 'Quote for tech startup website and SEO',
        tenantId: tenant._id,
        createdBy: staff._id
      },
      {
        number: 'JTS-004',
        type: 'INVOICE',
        customerId: customers[3]._id,
        items: [
          {
            description: 'Database Design & Optimization',
            quantity: 25,
            unitPrice: 18000,
            total: 450000
          },
          {
            description: 'Consulting Services',
            quantity: 10,
            unitPrice: 12000,
            total: 120000
          }
        ],
        subtotal: 570000,
        taxRate: 15,
        taxAmount: 85500,
        total: 655500,
        status: 'OVERDUE',
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        issueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        notes: 'Medical center patient management system',
        tenantId: tenant._id,
        createdBy: owner._id
      },
      {
        number: 'JTS-005',
        type: 'INVOICE',
        customerId: customers[4]._id,
        items: [
          {
            description: 'Web Development Services',
            quantity: 30,
            unitPrice: 15000,
            total: 450000
          },
          {
            description: 'AWS EC2 Instance',
            quantity: 6,
            unitPrice: 5000,
            total: 30000
          }
        ],
        subtotal: 480000,
        taxRate: 15,
        taxAmount: 72000,
        total: 552000,
        status: 'SENT',
        dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        issueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        notes: 'Hotel booking system development',
        tenantId: tenant._id,
        createdBy: accountant._id
      }
    ]);
    logger.info('Created comprehensive invoices');

    // Create comprehensive expenses
    const expenses = await Expense.create([
      {
        description: 'Office rent for January 2025',
        amount: 150000,
        category: 'RENT',
        vendorId: customers[0]._id,
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        isReimbursable: false,
        isTaxDeductible: true,
        notes: 'Monthly office rent payment for downtown Kingston location',
        tenantId: tenant._id,
        createdBy: accountant._id
      },
      {
        description: 'Internet service - Flow Business',
        amount: 8500,
        category: 'UTILITIES',
        vendorId: customers[1]._id,
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        isReimbursable: false,
        isTaxDeductible: true,
        notes: 'Monthly business internet service',
        tenantId: tenant._id,
        createdBy: staff._id
      },
      {
        description: 'Office supplies and stationery',
        amount: 25000,
        category: 'OFFICE_SUPPLIES',
        vendorId: customers[2]._id,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        isReimbursable: true,
        isTaxDeductible: true,
        notes: 'Pens, paper, notebooks, and office materials',
        tenantId: tenant._id,
        createdBy: owner._id
      },
      {
        description: 'Google Ads marketing campaign',
        amount: 45000,
        category: 'MARKETING',
        vendorId: customers[3]._id,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        isReimbursable: false,
        isTaxDeductible: true,
        notes: 'Digital marketing campaign for Q1 2025',
        tenantId: tenant._id,
        createdBy: accountant._id
      },
      {
        description: 'Professional development training',
        amount: 75000,
        category: 'PROFESSIONAL_SERVICES',
        vendorId: customers[4]._id,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        isReimbursable: true,
        isTaxDeductible: true,
        notes: 'React and Node.js advanced training course',
        tenantId: tenant._id,
        createdBy: staff._id
      },
      {
        description: 'Software licenses renewal',
        amount: 120000,
        category: 'EQUIPMENT',
        vendorId: customers[5]._id,
        date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
        isReimbursable: false,
        isTaxDeductible: true,
        notes: 'Annual renewal for development tools and software',
        tenantId: tenant._id,
        createdBy: owner._id
      },
      {
        description: 'Equipment maintenance',
        amount: 35000,
        category: 'EQUIPMENT',
        vendorId: customers[0]._id,
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        isReimbursable: false,
        isTaxDeductible: true,
        notes: 'Computer and server maintenance service',
        tenantId: tenant._id,
        createdBy: accountant._id
      },
      {
        description: 'Business insurance premium',
        amount: 95000,
        category: 'INSURANCE',
        vendorId: customers[1]._id,
        date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        isReimbursable: false,
        isTaxDeductible: true,
        notes: 'Annual business liability insurance',
        tenantId: tenant._id,
        createdBy: owner._id
      },
      {
        description: 'Travel expenses - client meeting',
        amount: 18000,
        category: 'TRAVEL',
        vendorId: customers[2]._id,
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        isReimbursable: true,
        isTaxDeductible: true,
        notes: 'Travel to Montego Bay for client presentation',
        tenantId: tenant._id,
        createdBy: staff._id
      },
      {
        description: 'Electricity bill - January',
        amount: 12500,
        category: 'UTILITIES',
        vendorId: customers[3]._id,
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        isReimbursable: false,
        isTaxDeductible: true,
        notes: 'Monthly electricity bill for office',
        tenantId: tenant._id,
        createdBy: accountant._id
      }
    ]);
    logger.info('Created comprehensive expenses');

    logger.info('Database seeding completed successfully');
    logger.info(`Created: 1 tenant, 3 users, ${customers.length} customers, ${products.length} products, ${invoices.length} invoices, ${expenses.length} expenses`);

  } catch (error) {
    logger.error('Database seeding failed:', error);
    console.error('Detailed error:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedData()
    .then(() => {
      logger.info('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedData;