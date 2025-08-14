const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'testpass123',
  name: 'Test User'
};

let jwtToken = '';
let accessToken = '';

async function testEndpoint(method, endpoint, body = null, headers = {}) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    console.log(`${method} ${endpoint}: ${response.status}`);
    if (response.ok) {
      console.log('✅ Success:', data.message || 'OK');
    } else {
      console.log('❌ Error:', data.error);
    }
    console.log('---');

    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.log(`${method} ${endpoint}: ERROR`);
    console.log('❌ Network Error:', error.message);
    console.log('---');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting API Endpoint Tests\n');

  // Test 1: Health Check
  console.log('1. Testing Health Check');
  await testEndpoint('GET', '/health');

  // Test 2: Register User
  console.log('2. Testing User Registration');
  const registerResult = await testEndpoint('POST', '/auth/register', testUser);
  if (registerResult.success) {
    jwtToken = registerResult.data.token;
  }

  // Test 3: Login User
  console.log('3. Testing User Login');
  const loginResult = await testEndpoint('POST', '/auth/login', {
    email: testUser.email,
    password: testUser.password
  });
  if (loginResult.success) {
    jwtToken = loginResult.data.token;
  }

  // Test 4: Get User Profile
  console.log('4. Testing Get User Profile');
  await testEndpoint('GET', '/user/profile', null, {
    'Authorization': `Bearer ${jwtToken}`
  });

  // Test 5: Add Credits
  console.log('5. Testing Add Credits');
  await testEndpoint('POST', '/user/add-credits', { amount: 50 }, {
    'Authorization': `Bearer ${jwtToken}`
  });

  // Test 6: Generate Access Token
  console.log('6. Testing Generate Access Token');
  const tokenResult = await testEndpoint('POST', '/user/generate-token', null, {
    'Authorization': `Bearer ${jwtToken}`
  });
  if (tokenResult.success) {
    accessToken = tokenResult.data.token;
  }

  // Test 7: Get Access Tokens
  console.log('7. Testing Get Access Tokens');
  await testEndpoint('GET', '/user/tokens', null, {
    'Authorization': `Bearer ${jwtToken}`
  });

  // Test 8: Get Credit Balance (with access token)
  console.log('8. Testing Get Credit Balance (Extension API)');
  await testEndpoint('GET', '/credits/balance', null, {
    'Authorization': `Bearer ${accessToken}`
  });

  // Test 9: Use Credits (with access token)
  console.log('9. Testing Use Credits (Extension API)');
  await testEndpoint('POST', '/credits/use', {
    amount: 1,
    feature: 'email_analyze',
    description: 'AI email response generation'
  }, {
    'Authorization': `Bearer ${accessToken}`
  });

  // Test 10: Get Credit History
  console.log('10. Testing Get Credit History');
  await testEndpoint('GET', '/credits/history', null, {
    'Authorization': `Bearer ${jwtToken}`
  });

  // Test 11: Test Invalid Token
  console.log('11. Testing Invalid Token');
  await testEndpoint('GET', '/user/profile', null, {
    'Authorization': 'Bearer invalid_token'
  });

  // Test 12: Test Missing Token
  console.log('12. Testing Missing Token');
  await testEndpoint('GET', '/user/profile');

  console.log('✅ All tests completed!');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    if (response.ok) {
      console.log('✅ Server is running');
      return true;
    }
  } catch (error) {
    console.log('❌ Server is not running. Please start the server first:');
    console.log('   cd server && npm run dev');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runTests();
  }
}

main().catch(console.error);
