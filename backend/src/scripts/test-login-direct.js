require('dotenv').config();
const axios = require('axios');

const testLogin = async () => {
  // Try multiple URLs - backend might be on different port or internal network
  const urls = [
    `http://localhost:${process.env.PORT || 3001}/api/auth/login`,
    'http://localhost:3001/api/auth/login',
    'http://backend:3001/api/auth/login',
    process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/api/auth/login` : null,
  ].filter(Boolean);
  
  console.log('🧪 Testing Login API - Trying multiple endpoints');
  console.log('');
  
  for (const url of urls) {
    console.log(`Trying: ${url}`);
    try {
      const response = await axios.post(url, {
        email: 'owner@jamaicatech.com',
        password: 'password123'
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000,
        validateStatus: () => true // Don't throw on any status
      });
      
      console.log(`   Status: ${response.status}`);
      
      if (response.status === 200 && response.data.success) {
        console.log('');
        console.log('✅ LOGIN SUCCESSFUL!');
        console.log(`   URL: ${url}`);
        console.log(`   Token: ${response.data.token ? response.data.token.substring(0, 50) + '...' : 'N/A'}`);
        console.log(`   User: ${response.data.user?.email || 'N/A'}`);
        console.log(`   Role: ${response.data.user?.role || 'N/A'}`);
        console.log(`   Tenant: ${response.data.tenant?.name || 'N/A'}`);
        console.log('');
        console.log('🎉 Backend API is working!');
        return;
      } else if (response.status === 401) {
        console.log(`   ❌ Authentication failed: ${response.data.error || 'Invalid credentials'}`);
      } else if (response.status === 503) {
        console.log(`   ⚠️  Service unavailable: ${response.data.error || 'Database connection issue'}`);
      } else {
        console.log(`   Response: ${JSON.stringify(response.data).substring(0, 200)}`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`   ❌ Connection refused - service not running on this URL`);
      } else if (error.code === 'ENOTFOUND') {
        console.log(`   ❌ Host not found - check hostname`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`   ❌ Timeout - service not responding`);
      } else {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    console.log('');
  }
  
  console.log('💡 If all failed, check:');
  console.log('   1. Backend service is running (check Coolify logs)');
  console.log('   2. Backend port is correct (should be 3001)');
  console.log('   3. Coolify routing: /api/* should route to backend service');
  console.log('   4. Backend healthcheck: curl http://localhost:3001/healthz');
};

testLogin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });

