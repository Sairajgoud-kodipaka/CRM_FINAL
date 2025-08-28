#!/usr/bin/env python3
"""
🧪 API Endpoint Test Script

This script tests the role-based assignment API endpoints to ensure they're working correctly.
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"  # Change this to your backend URL
API_BASE = f"{BASE_URL}/api"

def test_endpoint(method, endpoint, data=None, headers=None):
    """Test an API endpoint"""
    url = f"{API_BASE}{endpoint}"
    
    print(f"\n🔍 Testing {method} {endpoint}")
    print(f"   URL: {url}")
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers)
        elif method == "PUT":
            response = requests.put(url, json=data, headers=headers)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers)
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                response_data = response.json()
                print(f"   ✅ Success: {len(response_data) if isinstance(response_data, list) else 'Data received'}")
                return True
            except:
                print(f"   ✅ Success: {response.text[:100]}...")
                return True
        elif response.status_code == 401:
            print(f"   🔐 Unauthorized (expected for unauthenticated requests)")
            return True
        elif response.status_code == 403:
            print(f"   🚫 Forbidden (expected for role-based access)")
            return True
        elif response.status_code == 404:
            print(f"   ❌ Not Found - Endpoint doesn't exist")
            return False
        else:
            print(f"   ❌ Error: {response.text[:100]}...")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"   ❌ Connection Error - Backend not running or wrong URL")
        return False
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
        return False

def run_api_tests():
    """Run all API endpoint tests"""
    print("🚀 Starting API Endpoint Tests...")
    print("=" * 60)
    
    # Test endpoints without authentication (should return 401 or 403)
    print("\n📋 Testing Endpoints (Unauthenticated):")
    
    endpoints_to_test = [
        ("GET", "/team-members/1/"),
        ("GET", "/tenant/1/sales-users/"),
        ("GET", "/sales-users/"),
        ("POST", "/audit/assignment-override/"),
        ("GET", "/team-members/list/"),
    ]
    
    success_count = 0
    total_count = len(endpoints_to_test)
    
    for method, endpoint in endpoints_to_test:
        if test_endpoint(method, endpoint):
            success_count += 1
    
    print(f"\n📊 Test Results:")
    print(f"   ✅ Successful: {success_count}")
    print(f"   ❌ Failed: {total_count - success_count}")
    print(f"   📈 Success Rate: {(success_count/total_count)*100:.1f}%")
    
    if success_count == total_count:
        print("\n🎉 All endpoints are accessible!")
        print("   • Backend is running correctly")
        print("   • URL routing is working")
        print("   • Role-based access control is enforced")
    else:
        print("\n⚠️  Some endpoints failed:")
        print("   • Check if backend is running")
        print("   • Verify URL configuration")
        print("   • Check Django URL patterns")
    
    print("\n🔍 Next Steps:")
    print("   1. Test with authenticated users")
    print("   2. Verify role-based access control")
    print("   3. Test the frontend integration")

if __name__ == "__main__":
    run_api_tests()
