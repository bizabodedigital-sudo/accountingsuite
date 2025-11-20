require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const logger = require('../config/logger');

// Import models
const User = require('../models/User');
const Tenant = require('../models/Tenant');

const checkDatabase = async () => {
  try {
    console.log('🔍 Checking database connection...');
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    console.log('✅ Connected to database');

    // Check if any tenants exist
    const tenantCount = await Tenant.countDocuments();
    console.log(`\n📊 Tenant count: ${tenantCount}`);
    
    if (tenantCount > 0) {
      const tenants = await Tenant.find().limit(5);
      console.log('Tenants found:');
      tenants.forEach(t => console.log(`  - ${t.name} (${t._id})`));
    }

    // Check if any users exist
    const userCount = await User.countDocuments();
    console.log(`\n📊 User count: ${userCount}`);
    
    if (userCount > 0) {
      const users = await User.find().select('+password').populate('tenantId');
      console.log('\nUsers found:');
      users.forEach(u => {
        console.log(`  - ${u.email} (${u.role})`);
        console.log(`    Tenant: ${u.tenantId ? u.tenantId.name : 'N/A'}`);
        console.log(`    Active: ${u.isActive}`);
        console.log(`    Password hash: ${u.password ? u.password.substring(0, 20) + '...' : 'MISSING'}`);
        console.log(`    Password length: ${u.password ? u.password.length : 0}`);
      });

      // Test password comparison for owner user
      const owner = await User.findOne({ email: 'owner@jamaicatech.com' }).select('+password');
      if (owner) {
        console.log('\n🧪 Testing password comparison for owner@jamaicatech.com:');
        const testPassword = 'password123';
        const isMatch = await owner.comparePassword(testPassword);
        console.log(`  Password '${testPassword}' matches: ${isMatch}`);
        
        if (!isMatch) {
          console.log('  ⚠️  Password mismatch detected!');
          console.log('  🔧 Attempting to reset password...');
          owner.password = 'password123';
          await owner.save();
          console.log('  ✅ Password reset, testing again...');
          const isMatchAfter = await owner.comparePassword(testPassword);
          console.log(`  Password '${testPassword}' matches after reset: ${isMatchAfter}`);
        }
      } else {
        console.log('\n⚠️  Owner user not found!');
      }
    } else {
      console.log('\n⚠️  No users found in database!');
      console.log('💡 Run the seed script to create default users:');
      console.log('   node src/scripts/seed.js');
    }

    // Check database connection status
    console.log('\n📡 Database connection status:');
    console.log(`  State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    console.log(`  Host: ${mongoose.connection.host || 'N/A'}`);
    console.log(`  Name: ${mongoose.connection.name || 'N/A'}`);

  } catch (error) {
    console.error('\n❌ Error checking database:');
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
};

// Run if executed directly
if (require.main === module) {
  checkDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

module.exports = checkDatabase;

