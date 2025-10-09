#!/usr/bin/env python3
"""
Test script for sales@liberty user to verify they can see other salespersons
"""
import requests
import json
import time

# Test configuration
BASE_URL = "http://localhost:8000/api"

def test_sales_liberty():
    """Test the sales@liberty user"""
    
    # Login with sales@liberty credentials
    login_data = {
        "username": "sales@liberty",
        "password": "sales123@"
    }
    
    try:
        print("🔐 Logging in as sales@liberty...")
        login_response = requests.post(f"{BASE_URL}/login/", json=login_data)
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            access_token = token_data.get('access')
            
            if access_token:
                print("✅ Login successful for sales@liberty")
                
                # Test the salespersons context endpoint
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
                
                print("\n🎯 Testing salespersons context endpoint...")
                response = requests.get(f"{BASE_URL}/users/salespersons/context/", headers=headers)
                
                print(f"Status Code: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    print("✅ Endpoint working!")
                    print(f"Success: {data.get('success')}")
                    print(f"Count: {data.get('count')}")
                    
                    context = data.get('context', {})
                    print(f"\n📋 User Context:")
                    print(f"  Role: {context.get('user_role')}")
                    print(f"  Tenant ID: {context.get('tenant_id')}")
                    print(f"  Store ID: {context.get('store_id')}")
                    print(f"  Tenant Name: {context.get('tenant_name')}")
                    print(f"  Store Name: {context.get('store_name')}")
                    
                    salespersons = data.get('data', [])
                    print(f"\n👥 Salespersons found: {len(salespersons)}")
                    
                    if salespersons:
                        print("\n📝 Salesperson List:")
                        for i, person in enumerate(salespersons):
                            name = f"{person.get('first_name', '')} {person.get('last_name', '')}".strip()
                            role = person.get('role', '')
                            store = person.get('store', 'N/A')
                            tenant = person.get('tenant', 'N/A')
                            print(f"  {i+1}. {name} ({role}) - Store: {store} - Tenant: {tenant}")
                        
                        # Check if varma and sharma are in the list
                        all_names = []
                        for person in salespersons:
                            first_name = person.get('first_name', '').lower()
                            last_name = person.get('last_name', '').lower()
                            all_names.extend([first_name, last_name])
                        
                        print(f"\n🔍 Checking for expected salespersons:")
                        if 'varma' in all_names:
                            print("✅ Found 'varma' in the salesperson list")
                        else:
                            print("❌ 'varma' not found in the salesperson list")
                            
                        if 'sharma' in all_names:
                            print("✅ Found 'sharma' in the salesperson list")
                        else:
                            print("❌ 'sharma' not found in the salesperson list")
                            
                        # Check if sales@liberty can see themselves
                        liberty_found = any('liberty' in name.lower() for name in all_names)
                        if liberty_found:
                            print("✅ Found 'liberty' (current user) in the list")
                        else:
                            print("❌ 'liberty' (current user) not found in the list")
                            
                    else:
                        print("❌ No salespersons found")
                        
                else:
                    print(f"❌ Error: {response.status_code}")
                    print(f"Response: {response.text}")
                    
            else:
                print("❌ No access token received")
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure the backend is running on localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    """Main test function"""
    print("🚀 Testing sales@liberty user access to salespersons")
    print("=" * 60)
    
    # Wait for server to start
    print("⏳ Waiting for server to start...")
    time.sleep(2)
    
    test_sales_liberty()
    
    print(f"\n{'='*60}")
    print("🏁 Test completed!")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
