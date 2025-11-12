const mongoose = require('mongoose');
require('dotenv').config({ path: './env.local' });

async function testMongoConnection() {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    console.log('📍 Connection URI:', process.env.MONGODB_URI);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB Connected Successfully!');
    console.log('🏠 Host:', conn.connection.host);
    console.log('🗄️ Database:', conn.connection.name);
    console.log('🔌 Port:', conn.connection.port);
    
    // Test a simple operation
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('📚 Collections:', collections.map(c => c.name));
    
    await mongoose.connection.close();
    console.log('🔒 Connection closed gracefully');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

testMongoConnection();
