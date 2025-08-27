// Test script to verify production API connection
const API_URL = 'https://crm-final-mfe4.onrender.com';

async function testAPI() {
  console.log('Testing API connection to:', API_URL);
  
  try {
    // Test health check endpoint
    const healthResponse = await fetch(`${API_URL}/api/health/`);
    console.log('Health check status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Health check response:', healthData);
    }
    
    // Test login endpoint (without credentials)
    const loginResponse = await fetch(`${API_URL}/api/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'test',
        password: 'test'
      })
    });
    
    console.log('Login endpoint status:', loginResponse.status);
    
    if (!loginResponse.ok) {
      const errorData = await loginResponse.text();
      console.log('Login error response:', errorData);
    }
    
  } catch (error) {
    console.error('API test failed:', error.message);
  }
}

testAPI();
