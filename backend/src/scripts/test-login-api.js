require('dotenv').config();
const axios = require('axios');

const testLogin = async () => {
  const apiUrl = process.env.FRONTEND_URL || 'https://accountingsuite.bizabodeserver.org';
  const loginUrl = `${apiUrl}/api/auth/login`;
  
  console.log('🧪 Testing Login API');
  console.log(`   URL: ${loginUrl}`);
  console.log(`   Email: owner@jamaicatech.com`);
  console.log(`   Password: password123`);
  console.log('');
  
  try {
    const response = await axios.post(loginUrl, {
      email: 'owner@jamaicatech.com',
      password: 'password123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.data.success) {
      console.log('✅ LOGIN SUCCESSFUL!');
      console.log('');
      console.log('Response:');
      console.log(`  Success: ${response.data.success}`);
      console.log(`  Token: ${response.data.token ? response.data.token.substring(0, 50) + '...' : 'N/A'}`);
      console.log(`  User: ${response.data.user?.email || 'N/A'}`);
      console.log(`  Role: ${response.data.user?.role || 'N/A'}`);
      console.log(`  Tenant: ${response.data.tenant?.name || 'N/A'}`);
      console.log('');
      console.log('🎉 The backend API is working correctly!');
      console.log('   The issue is with the frontend, not the backend.');
    } else {
      console.log('❌ Login failed:');
      console.log(`   ${response.data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log('❌ API Request Failed:');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`);
      console.log(`   Data:`, JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('   No response received from server');
      console.log(`   URL: ${loginUrl}`);
      console.log('   Check if backend is running and accessible');
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }
};

testLogin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });

