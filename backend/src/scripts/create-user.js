require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const logger = require('../config/logger');

// Import models
const User = require('../models/User');
const Tenant = require('../models/Tenant');

const createUser = async () => {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    console.log('✅ Connected to database');
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);

    // Check if tenant exists, create if not
    let tenant = await Tenant.findOne({ name: 'Jamaica Tech Solutions' });
    if (!tenant) {
      console.log('\n📦 Creating tenant...');
      tenant = await Tenant.create({
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
      console.log(`✅ Created tenant: ${tenant.name} (${tenant._id})`);
    } else {
      console.log(`\n✅ Tenant exists: ${tenant.name} (${tenant._id})`);
    }

    // Check if user exists
    let user = await User.findOne({ email: 'owner@jamaicatech.com' });
    
    if (user) {
      console.log(`\n⚠️  User already exists: ${user.email}`);
      console.log('🔧 Resetting password...');
      user.password = 'password123';
      await user.save();
      console.log('✅ Password reset');
    } else {
      console.log('\n📦 Creating user...');
      user = await User.create({
        email: 'owner@jamaicatech.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Smith',
        role: 'OWNER',
        tenantId: tenant._id,
        isActive: true
      });
      console.log(`✅ Created user: ${user.email}`);
    }

    // Verify password works
    console.log('\n🧪 Testing password...');
    const testUser = await User.findOne({ email: 'owner@jamaicatech.com' }).select('+password');
    const passwordMatch = await testUser.comparePassword('password123');
    
    if (passwordMatch) {
      console.log('✅ Password verified successfully!');
    } else {
      console.log('❌ Password verification failed!');
      throw new Error('Password verification failed');
    }

    console.log('\n✅ SUCCESS! You can now login with:');
    console.log('   Email: owner@jamaicatech.com');
    console.log('   Password: password123');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
};

// Run if executed directly
if (require.main === module) {
  createUser()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

module.exports = createUser;

