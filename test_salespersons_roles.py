#!/usr/bin/env python3
"""
Comprehensive test script for the salespersons context endpoint with different user roles
"""
import requests
import json
import time

# Test configuration
BASE_URL = "http://localhost:8000/api"

# Test users with different roles (you'll need to adjust these based on your actual users)
TEST_USERS = [
    {
        "username": "admin",
        "password": "admin",
        "role": "platform_admin",
        "expected_access": "all_tenants"
    },
    {
        "username": "business_admin",
        "password": "admin",
        "role": "business_admin", 
        "expected_access": "tenant_only"
    },
    {
        "username": "manager",
        "password": "admin",
        "role": "manager",
        "expected_access": "store_only"
    },
    {
        "username": "sales_liberty",
        "password": "admin",
        "role": "inhouse_sales",
        "expected_access": "store_only"
    }
]

def login_user(username, password):
    """Login and get access token"""
    login_data = {
        "username": username,
        "password": password
    }
    
    try:
        response = requests.post(f"{BASE_URL}/login/", json=login_data)
        if response.status_code == 200:
            token_data = response.json()
            return token_data.get('access')
        else:
            print(f"❌ Login failed for {username}: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error for {username}: {e}")
        return None

def test_salespersons_endpoint(access_token, user_info):
    """Test the salespersons context endpoint"""
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        print(f"\n🎯 Testing {user_info['role']} user: {user_info['username']}")
        print(f"Expected access: {user_info['expected_access']}")
        
        response = requests.get(f"{BASE_URL}/users/salespersons/context/", headers=headers)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success: {data.get('success')}")
            print(f"Count: {data.get('count')}")
            
            context = data.get('context', {})
            print(f"User Role: {context.get('user_role')}")
            print(f"Tenant ID: {context.get('tenant_id')}")
            print(f"Store ID: {context.get('store_id')}")
            print(f"Tenant Name: {context.get('tenant_name')}")
            print(f"Store Name: {context.get('store_name')}")
            
            salespersons = data.get('data', [])
            print(f"Salespersons found: {len(salespersons)}")
            
            for i, person in enumerate(salespersons[:5]):  # Show first 5
                print(f"  {i+1}. {person.get('first_name')} {person.get('last_name')} ({person.get('role')}) - Store: {person.get('store')} - Tenant: {person.get('tenant')}")
            
            # Validate based on expected access
            if user_info['expected_access'] == 'all_tenants':
                if len(salespersons) > 0:
                    print("✅ Platform admin can see salespersons from multiple tenants")
                else:
                    print("⚠️ Platform admin sees no salespersons")
                    
            elif user_info['expected_access'] == 'tenant_only':
                tenant_ids = set(person.get('tenant_id') for person in salespersons if person.get('tenant_id'))
                if len(tenant_ids) <= 1:
                    print("✅ Business admin sees salespersons from their tenant only")
                else:
                    print("⚠️ Business admin sees salespersons from multiple tenants")
                    
            elif user_info['expected_access'] == 'store_only':
                store_ids = set(person.get('store_id') for person in salespersons if person.get('store_id'))
                if len(store_ids) <= 1:
                    print("✅ Manager/Sales user sees salespersons from their store only")
                else:
                    print("⚠️ Manager/Sales user sees salespersons from multiple stores")
            
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Test error: {e}")

def main():
    """Main test function"""
    print("🚀 Starting comprehensive salespersons context endpoint test")
    print("=" * 60)
    
    # Wait for server to start
    print("⏳ Waiting for server to start...")
    time.sleep(3)
    
    # Test each user role
    for user_info in TEST_USERS:
        print(f"\n{'='*60}")
        print(f"Testing {user_info['role'].upper()} role")
        print(f"{'='*60}")
        
        # Login
        access_token = login_user(user_info['username'], user_info['password'])
        
        if access_token:
            # Test the endpoint
            test_salespersons_endpoint(access_token, user_info)
        else:
            print(f"❌ Could not login as {user_info['username']}")
        
        print(f"\n{'-'*40}")
    
    print(f"\n{'='*60}")
    print("🏁 Test completed!")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
