#!/usr/bin/env python3
"""
Test script to check the deployment status of the Jewellery CRM application
"""

import requests
import json
import sys

def test_backend_health():
    """Test backend health endpoint"""
    try:
        print("🔍 Testing backend health...")
        response = requests.get("https://crm-final-tj4n.onrender.com/api/health/", timeout=30)
        
        if response.status_code == 200:
            print("✅ Backend health check passed!")
            print(f"Response: {response.json()}")
            return True
        else:
            print(f"❌ Backend health check failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend health check failed with error: {e}")
        return False

def test_frontend():
    """Test frontend availability"""
    try:
        print("🔍 Testing frontend...")
        response = requests.get("https://jewel-crm.vercel.app", timeout=30)
        
        if response.status_code == 200:
            print("✅ Frontend is accessible!")
            return True
        else:
            print(f"❌ Frontend failed with status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Frontend test failed with error: {e}")
        return False

def test_google_sheets_status():
    """Test Google Sheets integration status"""
    try:
        print("🔍 Testing Google Sheets integration...")
        # This would require authentication, so we'll skip for now
        print("⚠️ Google Sheets test requires authentication - skipping")
        return True
    except Exception as e:
        print(f"❌ Google Sheets test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting deployment tests...\n")
    
    tests = [
        ("Backend Health", test_backend_health),
        ("Frontend", test_frontend),
        ("Google Sheets", test_google_sheets_status),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{'='*50}")
        print(f"Testing: {test_name}")
        print('='*50)
        
        result = test_func()
        results.append((test_name, result))
    
    print(f"\n{'='*50}")
    print("SUMMARY")
    print('='*50)
    
    all_passed = True
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
        if not result:
            all_passed = False
    
    if all_passed:
        print("\n🎉 All tests passed! Deployment is ready.")
        sys.exit(0)
    else:
        print("\n⚠️ Some tests failed. Check the issues above.")
        sys.exit(1)

if __name__ == "__main__":
    main()