// Test Production API connection with corrected endpoints
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://crm-final-mfe4.onrender.com';

async function testProductionApi() {
  console.log('🧪 Testing Production API with corrected endpoints...');
  console.log('API Base URL:', API_BASE_URL);
  
  try {
    // Test 1: Health check endpoint
    console.log('\n1️⃣ Testing Health Check...');
    const healthResponse = await fetch(`${API_BASE_URL}/api/health/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Health Check Status:', healthResponse.status);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health Check Response:', healthData);
    } else {
      const errorText = await healthResponse.text();
      console.log('❌ Health Check Error:', errorText);
    }
    
    // Test 2: Clients endpoint (GET) - should work
    console.log('\n2️⃣ Testing Clients GET endpoint...');
    const clientsResponse = await fetch(`${API_BASE_URL}/api/clients/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Clients GET Status:', clientsResponse.status);
    if (clientsResponse.ok) {
      const clientsData = await clientsResponse.json();
      console.log('✅ Clients Response:', clientsData);
    } else {
      const errorText = await clientsResponse.text();
      console.log('❌ Clients GET Error:', errorText);
    }
    
    // Test 3: Clients endpoint (POST) - should fail without auth (but not "Method not allowed")
    console.log('\n3️⃣ Testing Clients POST endpoint (should fail without auth, not method error)...');
    const postResponse = await fetch(`${API_BASE_URL}/api/clients/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        phone: '+919876543210',
        city: 'Hyderabad',
        state: 'Telangana',
        catchment_area: 'Banjara Hills',
        pincode: '500034'
      }),
    });
    
    console.log('Clients POST Status:', postResponse.status);
    if (postResponse.ok) {
      const postData = await postResponse.json();
      console.log('✅ Clients POST Response:', postData);
    } else {
      const errorText = await postResponse.text();
      console.log('📝 Clients POST Error (expected without auth):', errorText);
      
      // Check if it's an auth error (good) vs method error (bad)
      if (errorText.includes('Method') || errorText.includes('not allowed')) {
        console.log('❌ BAD: Still getting method error - endpoints not fixed');
      } else if (errorText.includes('auth') || errorText.includes('401') || errorText.includes('403')) {
        console.log('✅ GOOD: Getting auth error - endpoints are working correctly');
      }
    }
    
    // Test 4: Test specific client endpoints
    console.log('\n4️⃣ Testing specific client endpoints...');
    
    // Test dropdown options
    const dropdownResponse = await fetch(`${API_BASE_URL}/api/clients/dropdown_options/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('Dropdown Options Status:', dropdownResponse.status);
    
    // Test tags
    const tagsResponse = await fetch(`${API_BASE_URL}/api/clients/tags/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('Tags Status:', tagsResponse.status);
    
  } catch (error) {
    console.error('❌ Connection error:', error);
  }
}

// Check if we're in Node.js environment
if (typeof window === 'undefined') {
  testProductionApi();
} else {
  console.log('This script should be run in Node.js environment');
  console.log('Run: node test-production-api.js');
}
