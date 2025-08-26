#!/usr/bin/env python3
"""
Test script to debug announcements creation and fetching
"""

import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8000/api"
LOGIN_URL = f"{BASE_URL}/auth/login/"
ANNOUNCEMENTS_URL = f"{BASE_URL}/announcements/announcements/"

def test_announcements():
    print("🔍 Testing Announcements API...")
    
    # Test data
    test_announcement = {
        "title": f"Test Announcement {datetime.now().strftime('%H:%M:%S')}",
        "content": "This is a test announcement to debug the issue",
        "announcement_type": "team_specific",
        "priority": "medium",
        "is_pinned": False,
        "requires_acknowledgment": False,
        "target_roles": ["manager", "inhouse_sales"],
        "publish_at": datetime.now().isoformat(),
        "expires_at": (datetime.now() + timedelta(days=7)).isoformat()
    }
    
    print(f"\n📝 Test Announcement Data:")
    print(json.dumps(test_announcement, indent=2))
    
    # Step 1: Test login (you'll need to provide credentials)
    print(f"\n🔐 Step 1: Testing Login...")
    print(f"Login URL: {LOGIN_URL}")
    print("Please provide your credentials to test:")
    
    username = input("Username: ")
    password = input("Password: ")
    
    login_data = {
        "username": username,
        "password": password
    }
    
    try:
        login_response = requests.post(LOGIN_URL, json=login_data)
        print(f"Login Status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            print(f"Login Success: {login_result.get('success', False)}")
            
            if login_result.get('success'):
                token = login_result.get('token')
                user = login_result.get('user')
                print(f"User Role: {user.get('role')}")
                print(f"User Store: {user.get('store')}")
                print(f"Token: {token[:20]}...")
                
                headers = {
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
                
                # Step 2: Test fetching existing announcements
                print(f"\n📋 Step 2: Fetching Existing Announcements...")
                fetch_response = requests.get(ANNOUNCEMENTS_URL, headers=headers)
                print(f"Fetch Status: {fetch_response.status_code}")
                
                if fetch_response.status_code == 200:
                    fetch_result = fetch_response.json()
                    print(f"Fetch Result Type: {type(fetch_result)}")
                    print(f"Fetch Result: {fetch_result}")
                    
                    # Handle both response formats
                    if isinstance(fetch_result, dict):
                        # Expected format: {"success": true, "data": [...]}
                        print(f"Fetch Success: {fetch_result.get('success', False)}")
                        data = fetch_result.get('data')
                        print(f"Data Type: {type(data)}")
                        
                        if isinstance(data, list):
                            print(f"Announcements Count: {len(data)}")
                            for i, ann in enumerate(data[:3]):  # Show first 3
                                print(f"  {i+1}. {ann.get('title')} - {ann.get('announcement_type')}")
                        elif isinstance(data, dict) and 'results' in data:
                            print(f"Results Count: {len(data['results'])}")
                            for i, ann in enumerate(data['results'][:3]):  # Show first 3
                                print(f"  {i+1}. {ann.get('title')} - {ann.get('announcement_type')}")
                        else:
                            print(f"Unexpected data format: {data}")
                    elif isinstance(fetch_result, list):
                        # Direct list format: [...]
                        print(f"Direct List Response - Announcements Count: {len(fetch_result)}")
                        for i, ann in enumerate(fetch_result[:3]):  # Show first 3
                            print(f"  {i+1}. {ann.get('title')} - {ann.get('announcement_type')}")
                    else:
                        print(f"Unexpected response format: {fetch_result}")
                else:
                    print(f"Fetch Error: {fetch_response.text}")
                
                # Step 3: Test creating a new announcement
                print(f"\n➕ Step 3: Creating New Announcement...")
                create_response = requests.post(ANNOUNCEMENTS_URL, json=test_announcement, headers=headers)
                print(f"Create Status: {create_response.status_code}")
                
                if create_response.status_code == 201:
                    create_result = create_response.json()
                    print(f"Create Result Type: {type(create_result)}")
                    print(f"Create Result: {create_result}")
                    
                    # Handle both response formats
                    if isinstance(create_result, dict):
                        # Expected format: {"success": true, "data": {...}}
                        print(f"Create Success: {create_result.get('success', False)}")
                        created_id = create_result.get('id')
                        created_title = create_result.get('title')
                    elif isinstance(create_result, dict) and 'id' in create_result:
                        # Direct object format: {"id": 1, "title": "..."}
                        created_id = create_result.get('id')
                        created_title = create_result.get('title')
                        print(f"Created Announcement ID: {created_id}")
                        print(f"Created Announcement Title: {created_title}")
                    else:
                        print(f"Unexpected create response format: {create_result}")
                        created_id = None
                        created_title = None
                    
                    if created_id:
                        # Step 4: Test fetching announcements again to see if new one appears
                        print(f"\n🔄 Step 4: Fetching Announcements After Creation...")
                        fetch_after_response = requests.get(ANNOUNCEMENTS_URL, headers=headers)
                        print(f"Fetch After Status: {fetch_after_response.status_code}")
                        
                        if fetch_after_response.status_code == 200:
                            fetch_after_result = fetch_after_response.json()
                            print(f"Fetch After Result Type: {type(fetch_after_result)}")
                            
                            # Handle both response formats
                            if isinstance(fetch_after_result, dict):
                                data = fetch_after_result.get('data')
                                if isinstance(data, list):
                                    print(f"Announcements Count After: {len(data)}")
                                    # Look for our test announcement
                                    test_announcements = [ann for ann in data if 'Test Announcement' in ann.get('title', '')]
                                    print(f"Test Announcements Found: {len(test_announcements)}")
                                    for ann in test_announcements:
                                        print(f"  - {ann.get('title')} (ID: {ann.get('id')})")
                                elif isinstance(data, dict) and 'results' in data:
                                    print(f"Results Count After: {len(data['results'])}")
                                    # Look for our test announcement
                                    test_announcements = [ann for ann in data['results'] if 'Test Announcement' in ann.get('title', '')]
                                    print(f"Test Announcements Found: {len(test_announcements)}")
                                    for ann in test_announcements:
                                        print(f"  - {ann.get('title')} (ID: {ann.get('id')})")
                            elif isinstance(fetch_after_result, list):
                                print(f"Direct List Response - Announcements Count After: {len(fetch_after_result)}")
                                # Look for our test announcement
                                test_announcements = [ann for ann in fetch_after_result if 'Test Announcement' in ann.get('title', '')]
                                print(f"Test Announcements Found: {len(test_announcements)}")
                                for ann in test_announcements:
                                    print(f"  - {ann.get('title')} (ID: {ann.get('id')})")
                            else:
                                print(f"Unexpected fetch after response format: {fetch_after_result}")
                        else:
                            print(f"Fetch After Error: {fetch_after_response.text}")
                        
                else:
                    print(f"Create Error: {create_response.text}")
                    
            else:
                print(f"Login Failed: {login_result.get('message', 'Unknown error')}")
        else:
            print(f"Login Error: {login_response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"Request Error: {e}")
    except Exception as e:
        print(f"Unexpected Error: {e}")

if __name__ == "__main__":
    test_announcements()
