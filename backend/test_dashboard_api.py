#!/usr/bin/env python3
"""
Backend Dashboard API Test Script
This script tests the business admin dashboard API with different date ranges
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8000"  # Adjust if your Django server runs on different port
API_ENDPOINT = "/api/tenants/dashboard/"

def test_dashboard_api():
    """Test the dashboard API with different date ranges"""
    
    print("🧪 Testing Business Admin Dashboard API")
    print("=" * 50)
    
    # Test cases
    test_cases = [
        {
            "name": "Current Month",
            "params": {
                "start_date": "2025-10-01T00:00:00.000Z",
                "end_date": "2025-10-31T23:59:59.999Z",
                "filter_type": "custom"
            }
        },
        {
            "name": "Last Month",
            "params": {
                "start_date": "2025-09-01T00:00:00.000Z",
                "end_date": "2025-09-30T23:59:59.999Z",
                "filter_type": "custom"
            }
        },
        {
            "name": "Custom Range (Sep 15-30)",
            "params": {
                "start_date": "2025-09-15T00:00:00.000Z",
                "end_date": "2025-09-30T23:59:59.999Z",
                "filter_type": "custom"
            }
        },
        {
            "name": "Today Only",
            "params": {
                "start_date": "2025-10-13T00:00:00.000Z",
                "end_date": "2025-10-13T23:59:59.999Z",
                "filter_type": "custom"
            }
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n📊 Test {i}: {test_case['name']}")
        print("-" * 30)
        
        try:
            # Make API request
            response = requests.get(
                f"{BASE_URL}{API_ENDPOINT}",
                params=test_case['params'],
                headers={
                    'Content-Type': 'application/json',
                    # Add authentication headers if needed
                    # 'Authorization': 'Bearer YOUR_TOKEN_HERE'
                },
                timeout=10
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Success: {data.get('success', 'N/A')}")
                print(f"Message: {data.get('message', 'N/A')}")
                
                if 'data' in data:
                    dashboard_data = data['data']
                    print(f"Period Sales: {dashboard_data.get('total_sales', {}).get('period', 'N/A')}")
                    print(f"Period Count: {dashboard_data.get('total_sales', {}).get('period_count', 'N/A')}")
                    print(f"Today Sales: {dashboard_data.get('total_sales', {}).get('today', 'N/A')}")
                    print(f"Month Sales: {dashboard_data.get('total_sales', {}).get('month', 'N/A')}")
                    
                    if 'date_range' in dashboard_data:
                        print(f"Applied Start: {dashboard_data['date_range'].get('start_date', 'N/A')}")
                        print(f"Applied End: {dashboard_data['date_range'].get('end_date', 'N/A')}")
                        print(f"Applied Filter: {dashboard_data['date_range'].get('filter_type', 'N/A')}")
                else:
                    print("❌ No data in response")
            else:
                print(f"❌ Error: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {e}")
        except json.JSONDecodeError as e:
            print(f"❌ JSON decode error: {e}")
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Test completed!")

def test_without_auth():
    """Test what happens without authentication"""
    print("\n🔐 Testing without authentication...")
    
    try:
        response = requests.get(f"{BASE_URL}{API_ENDPOINT}", timeout=5)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🚀 Starting Dashboard API Tests")
    print("Make sure your Django server is running on http://localhost:8000")
    print("Press Ctrl+C to cancel")
    
    try:
        test_dashboard_api()
        test_without_auth()
    except KeyboardInterrupt:
        print("\n⏹️ Tests cancelled by user")
    except Exception as e:
        print(f"\n❌ Test suite failed: {e}")


