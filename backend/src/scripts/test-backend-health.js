require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config/env');

const testBackend = async () => {
  console.log('🔍 Testing Backend Health');
  console.log('');
  
  // Test 1: Database connection
  console.log('1️⃣  Testing Database Connection...');
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    console.log('   ✅ Database connected');
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    
    // Check if users exist
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    console.log(`   Users in database: ${userCount}`);
    
    if (userCount > 0) {
      const owner = await User.findOne({ email: 'owner@jamaicatech.com' }).select('+password');
      if (owner) {
        const passwordMatch = await owner.comparePassword('password123');
        console.log(`   ✅ Owner user exists and password works: ${passwordMatch}`);
      } else {
        console.log(`   ⚠️  Owner user not found`);
      }
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.log(`   ❌ Database connection failed: ${error.message}`);
  }
  
  console.log('');
  
  // Test 2: Backend server
  console.log('2️⃣  Testing Backend Server...');
  const axios = require('axios');
  const urls = [
    `http://localhost:${process.env.PORT || 3001}/healthz`,
    'http://localhost:3001/healthz',
  ];
  
  for (const url of urls) {
    try {
      const response = await axios.get(url, { timeout: 3000, validateStatus: () => true });
      console.log(`   ${url}: Status ${response.status}`);
      if (response.status === 200) {
        console.log(`   ✅ Backend is healthy`);
        console.log(`   Response: ${JSON.stringify(response.data)}`);
        break;
      } else {
        console.log(`   Response: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      console.log(`   ${url}: ${error.code || error.message}`);
    }
  }
  
  console.log('');
  console.log('✅ Health check complete');
};

testBackend()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });

