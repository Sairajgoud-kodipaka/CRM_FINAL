// Test API connection
const API_BASE_URL = 'http://localhost:8000/api';

async function testApiConnection() {
  console.log('Testing API connection...');
  
  try {
    // Test basic connectivity
    const response = await fetch(`${API_BASE_URL}/products/inventory/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', data);
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.error('Connection error:', error);
  }
}

testApiConnection(); 