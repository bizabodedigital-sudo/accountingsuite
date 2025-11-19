const mongoose = require('mongoose');
const Product = require('../models/Product');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

const seedProducts = async () => {
  try {
    await connectDB();

    // Get the first tenant and user
    const tenant = await Tenant.findOne();
    const user = await User.findOne();

    if (!tenant || !user) {
      console.log('No tenant or user found. Please run the main seed script first.');
      process.exit(1);
    }

    // Clear existing products for this tenant
    await Product.deleteMany({ tenantId: tenant._id });
    console.log('Cleared existing products');

    const products = [
      {
        name: 'Web Development Services',
        description: 'Custom web application development using modern technologies',
        sku: 'WEB-DEV-001',
        category: 'SERVICES',
        unitPrice: 15000,
        cost: 5000,
        unit: 'HOUR',
        stockQuantity: 0,
        minStockLevel: 0,
        maxStockLevel: 0,
        isActive: true,
        isService: true,
        taxRate: 15,
        tags: ['web', 'development', 'custom'],
        tenantId: tenant._id,
        createdBy: user._id
      },
      {
        name: 'Mobile App Development',
        description: 'Cross-platform mobile application development',
        sku: 'MOBILE-APP-001',
        category: 'SERVICES',
        unitPrice: 20000,
        cost: 8000,
        unit: 'HOUR',
        stockQuantity: 0,
        minStockLevel: 0,
        maxStockLevel: 0,
        isActive: true,
        isService: true,
        taxRate: 15,
        tags: ['mobile', 'app', 'development'],
        tenantId: tenant._id,
        createdBy: user._id
      },
      {
        name: 'Database Design & Setup',
        description: 'Database architecture and implementation services',
        sku: 'DB-DESIGN-001',
        category: 'SERVICES',
        unitPrice: 12000,
        cost: 3000,
        unit: 'HOUR',
        stockQuantity: 0,
        minStockLevel: 0,
        maxStockLevel: 0,
        isActive: true,
        isService: true,
        taxRate: 15,
        tags: ['database', 'design', 'setup'],
        tenantId: tenant._id,
        createdBy: user._id
      },
      {
        name: 'Cloud Hosting Setup',
        description: 'AWS/Azure cloud infrastructure setup and configuration',
        sku: 'CLOUD-SETUP-001',
        category: 'SERVICES',
        unitPrice: 25000,
        cost: 10000,
        unit: 'PROJECT',
        stockQuantity: 0,
        minStockLevel: 0,
        maxStockLevel: 0,
        isActive: true,
        isService: true,
        taxRate: 15,
        tags: ['cloud', 'hosting', 'aws', 'azure'],
        tenantId: tenant._id,
        createdBy: user._id
      },
      {
        name: 'Software License - Microsoft Office',
        description: 'Annual Microsoft Office 365 Business license',
        sku: 'MS-OFFICE-365',
        category: 'SOFTWARE',
        unitPrice: 8500,
        cost: 6000,
        unit: 'PIECE',
        stockQuantity: 10,
        minStockLevel: 2,
        maxStockLevel: 20,
        isActive: true,
        isService: false,
        taxRate: 15,
        tags: ['software', 'office', 'license'],
        tenantId: tenant._id,
        createdBy: user._id
      },
      {
        name: 'Software License - Adobe Creative Suite',
        description: 'Annual Adobe Creative Cloud license',
        sku: 'ADOBE-CC-001',
        category: 'SOFTWARE',
        unitPrice: 12000,
        cost: 8000,
        unit: 'PIECE',
        stockQuantity: 5,
        minStockLevel: 1,
        maxStockLevel: 10,
        isActive: true,
        isService: false,
        taxRate: 15,
        tags: ['software', 'adobe', 'creative', 'license'],
        tenantId: tenant._id,
        createdBy: user._id
      },
      {
        name: 'Laptop - Dell XPS 15',
        description: 'Dell XPS 15 laptop with 16GB RAM, 512GB SSD',
        sku: 'DELL-XPS-15',
        category: 'HARDWARE',
        unitPrice: 180000,
        cost: 150000,
        unit: 'PIECE',
        stockQuantity: 3,
        minStockLevel: 1,
        maxStockLevel: 5,
        isActive: true,
        isService: false,
        taxRate: 15,
        tags: ['laptop', 'dell', 'xps', 'hardware'],
        tenantId: tenant._id,
        createdBy: user._id
      },
      {
        name: 'Monitor - Samsung 27" 4K',
        description: 'Samsung 27-inch 4K UHD monitor',
        sku: 'SAMSUNG-27-4K',
        category: 'HARDWARE',
        unitPrice: 45000,
        cost: 35000,
        unit: 'PIECE',
        stockQuantity: 8,
        minStockLevel: 2,
        maxStockLevel: 15,
        isActive: true,
        isService: false,
        taxRate: 15,
        tags: ['monitor', 'samsung', '4k', 'hardware'],
        tenantId: tenant._id,
        createdBy: user._id
      },
      {
        name: 'Consulting - IT Strategy',
        description: 'IT strategy and digital transformation consulting',
        sku: 'CONSULT-IT-STRAT',
        category: 'CONSULTING',
        unitPrice: 25000,
        cost: 10000,
        unit: 'HOUR',
        stockQuantity: 0,
        minStockLevel: 0,
        maxStockLevel: 0,
        isActive: true,
        isService: true,
        taxRate: 15,
        tags: ['consulting', 'strategy', 'it', 'transformation'],
        tenantId: tenant._id,
        createdBy: user._id
      },
      {
        name: 'Digital Marketing Package',
        description: 'Comprehensive digital marketing services package',
        sku: 'DIGITAL-MKTG-001',
        category: 'SERVICES',
        unitPrice: 50000,
        cost: 20000,
        unit: 'MONTH',
        stockQuantity: 0,
        minStockLevel: 0,
        maxStockLevel: 0,
        isActive: true,
        isService: true,
        taxRate: 15,
        tags: ['marketing', 'digital', 'seo', 'social'],
        tenantId: tenant._id,
        createdBy: user._id
      }
    ];

    // Insert products
    const createdProducts = await Product.insertMany(products);
    console.log(`✅ Created ${createdProducts.length} products`);

    // Display summary
    console.log('\n📊 Product Summary:');
    console.log(`Total Products: ${createdProducts.length}`);
    
    const services = createdProducts.filter(p => p.isService).length;
    const goods = createdProducts.filter(p => !p.isService).length;
    console.log(`Services: ${services}`);
    console.log(`Goods: ${goods}`);

    const totalValue = createdProducts.reduce((sum, p) => sum + p.totalValue, 0);
    console.log(`Total Inventory Value: J$${totalValue.toLocaleString()}`);

    const lowStock = createdProducts.filter(p => p.stockStatus === 'LOW_STOCK').length;
    const outOfStock = createdProducts.filter(p => p.stockStatus === 'OUT_OF_STOCK').length;
    console.log(`Low Stock Items: ${lowStock}`);
    console.log(`Out of Stock Items: ${outOfStock}`);

    console.log('\n🎉 Product seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
};

// Run the seeder
seedProducts();















