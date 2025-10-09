#!/usr/bin/env python3
"""
Debug test to see what data is being sent
"""
import requests
import json

BASE_URL = "http://localhost:8000/api"

# Login
login_data = {"username": "sales@liberty", "password": "sales123@"}
login_response = requests.post(f"{BASE_URL}/login/", json=login_data)

if login_response.status_code == 200:
    token_data = login_response.json()
    access_token = token_data.get('token')
    
    if access_token:
        print("✅ Login successful")
        
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Test with detailed logging
        customer_data = {
            "first_name": "Final",
            "last_name": "Test",
            "email": "final.test@example.com",
            "phone": "+919876543999",
            "city": "Mumbai",
            "state": "Maharashtra",
            "sales_person": "Varma Ji",
            "sales_person_id": 133,  # Varma Ji's ID
            "reason_for_visit": "Purchase",
            "customer_status": "lead",
            "lead_source": "walk_in"
        }
        
        print(f"📤 Sending data: {json.dumps(customer_data, indent=2)}")
        
        create_response = requests.post(f"{BASE_URL}/clients/clients/", json=customer_data, headers=headers)
        
        print(f"Status: {create_response.status_code}")
        if create_response.status_code == 201:
            customer = create_response.json()
            print("✅ Customer created!")
            print(f"Created By ID: {customer.get('created_by', {}).get('id')}")
            print(f"Created By Name: {customer.get('created_by', {}).get('first_name')} {customer.get('created_by', {}).get('last_name')}")
            print(f"Created By Username: {customer.get('created_by', {}).get('username')}")
        else:
            print(f"❌ Error: {create_response.text}")
    else:
        print("❌ No token")
else:
    print(f"❌ Login failed: {login_response.status_code}")
