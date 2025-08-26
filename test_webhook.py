#!/usr/bin/env python3
"""
Test script for DoubleTick WhatsApp webhook functionality
Run this to test if your webhook endpoints are working correctly
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"  # Change this to your Django server URL
WEBHOOK_URL = f"{BASE_URL}/api/whatsapp/webhook/test_session/"
TEST_WEBHOOK_URL = f"{BASE_URL}/api/whatsapp/webhook/test/"

def test_webhook_endpoint():
    """Test if the webhook endpoint is accessible"""
    print("🔍 Testing webhook endpoint accessibility...")
    
    try:
        response = requests.get(WEBHOOK_URL)
        print(f"✅ Webhook endpoint accessible (Status: {response.status_code})")
        return True
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to Django server. Make sure it's running on port 8000.")
        return False
    except Exception as e:
        print(f"❌ Error accessing webhook: {e}")
        return False

def test_webhook_functionality():
    """Test the webhook functionality with a sample message"""
    print("\n📱 Testing webhook functionality...")
    
    # Sample WhatsApp message payload
    test_payload = {
        "type": "message",
        "data": {
            "from": "+919876543210",
            "id": f"test_msg_{int(time.time())}",
            "type": "text",
            "text": {
                "body": "Hello, I want to know about your latest jewelry collection"
            },
            "timestamp": datetime.now().isoformat(),
            "notifyName": "Test Customer"
        }
    }
    
    try:
        response = requests.post(
            WEBHOOK_URL,
            json=test_payload,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            print("✅ Webhook processed successfully!")
            print(f"   Response: {response.text}")
        else:
            print(f"❌ Webhook failed (Status: {response.status_code})")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing webhook: {e}")

def test_webhook_test_endpoint():
    """Test the webhook test endpoint"""
    print("\n🧪 Testing webhook test endpoint...")
    
    try:
        response = requests.post(
            TEST_WEBHOOK_URL,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✅ Webhook test endpoint working!")
                print(f"   Result: {result}")
            else:
                print(f"❌ Webhook test failed: {result.get('error')}")
        else:
            print(f"❌ Test endpoint failed (Status: {response.status_code})")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing webhook test endpoint: {e}")

def test_api_endpoints():
    """Test other API endpoints"""
    print("\n🌐 Testing other API endpoints...")
    
    endpoints = [
        "/api/whatsapp/sessions/",
        "/api/whatsapp/contacts/",
        "/api/whatsapp/bots/",
        "/api/whatsapp/campaigns/",
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}")
            if response.status_code in [200, 401, 403]:  # 401/403 means endpoint exists but needs auth
                print(f"✅ {endpoint} - Accessible (Status: {response.status_code})")
            else:
                print(f"❌ {endpoint} - Failed (Status: {response.status_code})")
        except Exception as e:
            print(f"❌ {endpoint} - Error: {e}")

def main():
    """Main test function"""
    print("🚀 DoubleTick WhatsApp Webhook Test Suite")
    print("=" * 50)
    
    # Test 1: Check if server is accessible
    if not test_webhook_endpoint():
        print("\n❌ Cannot proceed with tests. Please start your Django server first.")
        return
    
    # Test 2: Test webhook functionality
    test_webhook_functionality()
    
    # Test 3: Test webhook test endpoint
    test_webhook_test_endpoint()
    
    # Test 4: Test other API endpoints
    test_api_endpoints()
    
    print("\n" + "=" * 50)
    print("🏁 Test suite completed!")
    print("\n📋 Next steps:")
    print("1. Check Django logs for any errors")
    print("2. Verify your WAHA server configuration")
    print("3. Test with real WhatsApp messages")
    print("4. Configure your first bot in the DoubleTick interface")

if __name__ == "__main__":
    main()


