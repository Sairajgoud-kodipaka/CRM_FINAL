// Test login functionality
const API_BASE_URL = 'http://localhost:8000/api';

async function testLogin() {
  console.log('Testing login functionality...');
  
  const testUsers = [
    { username: 'test_manager', password: 'testpass123' },
    { username: 'test_manager_1', password: 'testpass123' },
    { username: 'test_manager_2', password: 'testpass123' },
    { username: 'testuser', password: 'testpass123' },
    { username: 'charyv', password: 'testpass123' }
  ];

  for (const user of testUsers) {
    try {
      console.log(`\nTesting login for user: ${user.username}`);
      
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.username,
          password: user.password
        }),
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Login successful!');
        console.log('User role:', data.user?.role);
        console.log('Token received:', !!data.token);
        
        // Test inventory endpoint with token
        const inventoryResponse = await fetch(`${API_BASE_URL}/products/inventory/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.token}`
          },
        });
        
        console.log('Inventory response status:', inventoryResponse.status);
        
        if (inventoryResponse.ok) {
          const inventoryData = await inventoryResponse.json();
          console.log('Inventory data received:', !!inventoryData);
        } else {
          const errorText = await inventoryResponse.text();
          console.log('Inventory error:', errorText);
        }
        
        break; // Stop after first successful login
      } else {
        const errorText = await response.text();
        console.log('Login failed:', errorText);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  }
}

testLogin(); 