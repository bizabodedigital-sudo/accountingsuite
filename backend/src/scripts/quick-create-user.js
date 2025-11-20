require('dotenv').config();
const mongoose = require('mongoose');

// Direct connection - works with any database name
const connectAndCreate = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://mongo:27017/bizabode';
  console.log('🔍 Connecting to:', uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide password
  
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected');
    console.log(`   Database: ${mongoose.connection.name}`);
    
    // Get the database name from connection
    const dbName = mongoose.connection.name;
    const db = mongoose.connection.db;
    
    // Check if collections exist
    const collections = await db.listCollections().toArray();
    console.log(`\n📊 Collections: ${collections.length}`);
    
    // Create tenant directly
    const tenants = db.collection('tenants');
    let tenant = await tenants.findOne({ name: 'Jamaica Tech Solutions' });
    
    if (!tenant) {
      console.log('\n📦 Creating tenant...');
      const tenantResult = await tenants.insertOne({
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
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      tenant = await tenants.findOne({ _id: tenantResult.insertedId });
      console.log(`✅ Created tenant: ${tenant.name}`);
    } else {
      console.log(`\n✅ Tenant exists: ${tenant.name}`);
    }
    
    // Hash password
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    // Create user directly
    const users = db.collection('users');
    let user = await users.findOne({ email: 'owner@jamaicatech.com' });
    
    if (!user) {
      console.log('\n📦 Creating user...');
      await users.insertOne({
        email: 'owner@jamaicatech.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Smith',
        role: 'OWNER',
        tenantId: tenant._id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Created user: owner@jamaicatech.com');
    } else {
      console.log(`\n⚠️  User exists, updating password...`);
      await users.updateOne(
        { email: 'owner@jamaicatech.com' },
        { $set: { password: hashedPassword, updatedAt: new Date() } }
      );
      console.log('✅ Password updated');
    }
    
    // Verify
    user = await users.findOne({ email: 'owner@jamaicatech.com' });
    const passwordMatch = await bcrypt.compare('password123', user.password);
    
    if (passwordMatch) {
      console.log('\n✅ SUCCESS! Password verified!');
      console.log('\n📋 Login credentials:');
      console.log('   Email: owner@jamaicatech.com');
      console.log('   Password: password123');
    } else {
      console.log('\n❌ Password verification failed!');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Closed connection');
  }
};

connectAndCreate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });

