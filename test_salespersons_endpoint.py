#!/usr/bin/env python3
"""
Test script for the salespersons context endpoint
"""
import requests
import json

# Test the new endpoint
BASE_URL = "http://localhost:8000/api"

def test_salespersons_context():
    """Test the salespersons context endpoint"""
    
    # You'll need to replace this with actual credentials
    # For testing, you might need to create a test user or use existing credentials
    login_data = {
        "username": "admin",  # Replace with actual username
        "password": "admin"   # Replace with actual password
    }
    
    try:
        # Login to get token
        print("🔐 Logging in...")
        login_response = requests.post(f"{BASE_URL}/login/", json=login_data)
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            access_token = token_data.get('access')
            
            if access_token:
                print("✅ Login successful")
                
                # Test the salespersons context endpoint
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
                
                print("🎯 Testing salespersons context endpoint...")
                response = requests.get(f"{BASE_URL}/users/salespersons/context/", headers=headers)
                
                print(f"Status Code: {response.status_code}")
                print(f"Response Headers: {dict(response.headers)}")
                
                if response.status_code == 200:
                    data = response.json()
                    print("✅ Endpoint working!")
                    print(f"Success: {data.get('success')}")
                    print(f"Count: {data.get('count')}")
                    print(f"Context: {data.get('context')}")
                    
                    if data.get('data'):
                        print(f"Salespersons found: {len(data['data'])}")
                        for i, person in enumerate(data['data'][:3]):  # Show first 3
                            print(f"  {i+1}. {person.get('first_name')} {person.get('last_name')} ({person.get('role')})")
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

if __name__ == "__main__":
    test_salespersons_context()
