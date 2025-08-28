// Test script to verify client creation endpoint is working
const API_BASE_URL = 'https://crm-final-mfe4.onrender.com/api';

async function testClientCreation() {
  console.log('🧪 Testing Client Creation Endpoint...\n');

  // Test the correct endpoint structure
  try {
    console.log('1️⃣ Testing POST /api/clients/clients/ (correct endpoint)...');
    const response = await fetch(`${API_BASE_URL}/clients/clients/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        phone: '+919876543210',
        customer_type: 'individual'
      })
    });
    
    console.log(`   Status: ${response.status}`);
    if (response.status === 401) {
      console.log(`   ✅ Success: Endpoint exists and returns 401 (authentication required)`);
      console.log(`   🎯 This means the URL structure is correct!`);
    } else if (response.status === 405) {
      console.log(`   ❌ Error: Method not allowed - URL structure is still wrong`);
    } else {
      const errorText = await response.text();
      console.log(`   📝 Response: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
  }

  // Test the old incorrect endpoint for comparison
  try {
    console.log('\n2️⃣ Testing POST /api/clients/ (old incorrect endpoint)...');
    const response = await fetch(`${API_BASE_URL}/clients/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        phone: '+919876543210',
        customer_type: 'individual'
      })
    });
    
    console.log(`   Status: ${response.status}`);
    if (response.status === 405) {
      console.log(`   ❌ Confirmed: Old endpoint still returns 405 (Method not allowed)`);
    } else {
      const errorText = await response.text();
      console.log(`   📝 Response: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
  }

  console.log('\n🎯 Test Summary:');
  console.log('   - If endpoint 1 returns 401, the URL structure is correct');
  console.log('   - If endpoint 1 returns 405, there\'s still a URL issue');
  console.log('   - Endpoint 2 should return 405 (confirming the old issue)');
}

// Run the test
testClientCreation().catch(console.error);
