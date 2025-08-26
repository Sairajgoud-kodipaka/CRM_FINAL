// Simple test to check backend connectivity
const API_BASE_URL = 'http://localhost:8000/api';

async function testConnection() {
  try {
    console.log('Testing connection to:', API_BASE_URL);
    
    const response = await fetch(`${API_BASE_URL}/auth/demo-users/`);
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', data);
      console.log('✅ Backend is accessible!');
    } else {
      console.log('❌ Backend responded with error:', response.status);
    }
  } catch (error) {
    console.error('❌ Connection failed:', error);
    console.log('This might be due to:');
    console.log('1. Backend server not running on port 8000');
    console.log('2. CORS issues');
    console.log('3. Network connectivity problems');
  }
}

testConnection(); 