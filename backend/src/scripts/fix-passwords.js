require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const logger = require('../config/logger');

// Import models
const User = require('../models/User');
const Tenant = require('../models/Tenant');

const fixPasswords = async () => {
  try {
    console.log('🔍 Connecting to database...');
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    console.log('✅ Connected to database');

    // Get all users
    const users = await User.find().select('+password');
    console.log(`\n📊 Found ${users.length} users`);

    if (users.length === 0) {
      console.log('\n⚠️  No users found! Creating default users...');
      
      // Create tenant if it doesn't exist
      let tenant = await Tenant.findOne({ name: 'Jamaica Tech Solutions' });
      if (!tenant) {
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
        console.log('✅ Created tenant: Jamaica Tech Solutions');
      }

      // Create default users
      const defaultUsers = [
        {
          email: 'owner@jamaicatech.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Smith',
          role: 'OWNER',
          tenantId: tenant._id,
          isActive: true
        },
        {
          email: 'accountant@jamaicatech.com',
          password: 'password123',
          firstName: 'Sarah',
          lastName: 'Johnson',
          role: 'ACCOUNTANT',
          tenantId: tenant._id,
          isActive: true
        },
        {
          email: 'staff@jamaicatech.com',
          password: 'password123',
          firstName: 'Mike',
          lastName: 'Brown',
          role: 'STAFF',
          tenantId: tenant._id,
          isActive: true
        }
      ];

      for (const userData of defaultUsers) {
        const existingUser = await User.findOne({ email: userData.email });
        if (!existingUser) {
          const user = await User.create(userData);
          console.log(`✅ Created user: ${user.email}`);
        } else {
          console.log(`⚠️  User already exists: ${userData.email}`);
        }
      }
    } else {
      console.log('\n🔧 Fixing passwords for existing users...');
      
      for (const user of users) {
        // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
        const isHashed = user.password && (
          user.password.startsWith('$2a$') ||
          user.password.startsWith('$2b$') ||
          user.password.startsWith('$2y$')
        );

        if (!isHashed) {
          console.log(`  🔧 Fixing password for ${user.email}...`);
          // Set password directly (pre-save hook will hash it)
          user.password = 'password123';
          await user.save();
          console.log(`  ✅ Fixed password for ${user.email}`);
        } else {
          // Test if password works
          const testMatch = await user.comparePassword('password123');
          if (!testMatch) {
            console.log(`  🔧 Resetting password for ${user.email} (hash exists but doesn't match)...`);
            user.password = 'password123';
            await user.save();
            console.log(`  ✅ Reset password for ${user.email}`);
          } else {
            console.log(`  ✅ Password OK for ${user.email}`);
          }
        }
      }
    }

    // Verify all users can login
    console.log('\n🧪 Verifying passwords...');
    const testUsers = await User.find().select('+password');
    for (const user of testUsers) {
      const testMatch = await user.comparePassword('password123');
      if (testMatch) {
        console.log(`  ✅ ${user.email}: Password verified`);
      } else {
        console.log(`  ❌ ${user.email}: Password verification failed`);
      }
    }

    console.log('\n✅ Password fix completed!');
    console.log('\n📋 Login credentials:');
    console.log('  Owner: owner@jamaicatech.com / password123');
    console.log('  Accountant: accountant@jamaicatech.com / password123');
    console.log('  Staff: staff@jamaicatech.com / password123');

  } catch (error) {
    console.error('\n❌ Error fixing passwords:');
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
};

// Run if executed directly
if (require.main === module) {
  fixPasswords()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

module.exports = fixPasswords;

