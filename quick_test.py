#!/usr/bin/env python3
"""
Simple test for sales@liberty user
"""
import requests
import json

BASE_URL = "http://localhost:8000/api"

# Login
login_data = {"username": "sales@liberty", "password": "sales123@"}
login_response = requests.post(f"{BASE_URL}/login/", json=login_data)

if login_response.status_code == 200:
    token_data = login_response.json()
    access_token = token_data.get('token')  # Note: using 'token' not 'access'
    
    if access_token:
        print("✅ Login successful")
        
        # Test endpoint
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{BASE_URL}/users/salespersons/context/", headers=headers)
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Success: {data.get('success')}")
            print(f"Count: {data.get('count')}")
            
            context = data.get('context', {})
            print(f"Role: {context.get('user_role')}")
            print(f"Store: {context.get('store_name')}")
            
            salespersons = data.get('data', [])
            print(f"\nSalespersons ({len(salespersons)}):")
            for person in salespersons:
                name = f"{person.get('first_name', '')} {person.get('last_name', '')}".strip()
                print(f"  - {name} ({person.get('role')})")
        else:
            print(f"Error: {response.text}")
    else:
        print("❌ No token received")
else:
    print(f"❌ Login failed: {login_response.text}")
