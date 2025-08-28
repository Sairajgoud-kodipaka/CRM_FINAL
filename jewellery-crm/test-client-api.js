// Test script to verify client API endpoints are working
const API_BASE_URL = 'https://crm-final-mfe4.onrender.com/api';

async function testClientEndpoints() {
  console.log('🧪 Testing Client API Endpoints...\n');

  // Test 1: Check if clients endpoint is accessible
  try {
    console.log('1️⃣ Testing GET /api/clients/...');
    const response = await fetch(`${API_BASE_URL}/clients/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`   Status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success: Found ${data.results?.length || 0} clients`);
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
  }

  // Test 2: Check if dropdown options endpoint exists
  try {
    console.log('\n2️⃣ Testing GET /api/clients/dropdown_options/...');
    const response = await fetch(`${API_BASE_URL}/clients/dropdown_options/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`   Status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success: Dropdown options available`);
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
  }

  // Test 3: Check if appointments endpoint exists
  try {
    console.log('\n3️⃣ Testing GET /api/clients/appointments/...');
    const response = await fetch(`${API_BASE_URL}/clients/appointments/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`   Status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success: Appointments endpoint working`);
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
  }

  // Test 4: Check if follow-ups endpoint exists
  try {
    console.log('\n4️⃣ Testing GET /api/clients/follow-ups/...');
    const response = await fetch(`${API_BASE_URL}/clients/follow-ups/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`   Status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success: Follow-ups endpoint working`);
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
  }

  // Test 5: Check if purchases endpoint exists
  try {
    console.log('\n5️⃣ Testing GET /api/clients/purchases/...');
    const response = await fetch(`${API_BASE_URL}/clients/purchases/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`   Status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success: Purchases endpoint working`);
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
  }

  console.log('\n🎯 Test Summary:');
  console.log('   - If you see ✅ Success for endpoint 1, the main clients API is working');
  console.log('   - If you see ❌ Error for other endpoints, they may not exist in the backend');
  console.log('   - The main issue was with the client creation endpoint, which should now be fixed');
}

// Run the test
testClientEndpoints().catch(console.error);
