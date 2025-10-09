#!/usr/bin/env python3
"""
Simple test for customer creation with salesperson assignment
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
        
        # Get salespersons
        salespersons_response = requests.get(f"{BASE_URL}/users/salespersons/context/", headers=headers)
        if salespersons_response.status_code == 200:
            salespersons_data = salespersons_response.json()
            salespersons = salespersons_data.get('data', [])
            
            print(f"\n📋 Available salespersons:")
            for person in salespersons:
                print(f"  - ID: {person.get('id')}, Name: {person.get('first_name')} {person.get('last_name')}")
            
            # Find Varma Ji
            varma_id = None
            for person in salespersons:
                if 'varma' in person.get('first_name', '').lower():
                    varma_id = person.get('id')
                    break
            
            if varma_id:
                print(f"\n🎯 Testing with Varma Ji (ID: {varma_id})")
                
                # Test customer creation
                customer_data = {
                    "first_name": "Test",
                    "last_name": "Customer",
                    "email": "test.customer@example.com",
                    "phone": "+919876543210",
                    "city": "Mumbai",
                    "state": "Maharashtra",
                    "sales_person": "Varma Ji",
                    "sales_person_id": varma_id,
                    "reason_for_visit": "Purchase",
                    "customer_status": "lead",
                    "lead_source": "walk_in"
                }
                
                print("🚀 Creating customer...")
                create_response = requests.post(f"{BASE_URL}/clients/clients/", json=customer_data, headers=headers)
                
                print(f"Status: {create_response.status_code}")
                if create_response.status_code == 201:
                    customer = create_response.json()
                    print("✅ Customer created!")
                    print(f"Created By: {customer.get('created_by', {}).get('first_name')} {customer.get('created_by', {}).get('last_name')}")
                else:
                    print(f"❌ Error: {create_response.text}")
            else:
                print("❌ Varma Ji not found")
        else:
            print(f"❌ Failed to get salespersons: {salespersons_response.status_code}")
    else:
        print("❌ No token")
else:
    print(f"❌ Login failed: {login_response.status_code}")
