#!/usr/bin/env python3
"""
Test script to verify customer creation with selected salesperson
"""
import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_customer_creation_with_salesperson():
    """Test creating a customer with a selected salesperson"""
    
    # Login as sales@liberty
    login_data = {"username": "sales@liberty", "password": "sales123@"}
    login_response = requests.post(f"{BASE_URL}/login/", json=login_data)
    
    if login_response.status_code == 200:
        token_data = login_response.json()
        access_token = token_data.get('token')
        
        if access_token:
            print("✅ Login successful as sales@liberty")
            
            # First, get the salespersons to see their IDs
            headers = {"Authorization": f"Bearer {access_token}"}
            salespersons_response = requests.get(f"{BASE_URL}/users/salespersons/context/", headers=headers)
            
            if salespersons_response.status_code == 200:
                salespersons_data = salespersons_response.json()
                salespersons = salespersons_data.get('data', [])
                
                print(f"\n📋 Available salespersons:")
                for person in salespersons:
                    print(f"  - ID: {person.get('id')}, Name: {person.get('first_name')} {person.get('last_name')}, Username: {person.get('username')}")
                
                # Find Varma Ji's ID
                varma_id = None
                for person in salespersons:
                    if 'varma' in person.get('first_name', '').lower():
                        varma_id = person.get('id')
                        break
                
                if varma_id:
                    print(f"\n🎯 Found Varma Ji with ID: {varma_id}")
                    
                    # Create a test customer assigned to Varma Ji
                    customer_data = {
                        "first_name": "Test",
                        "last_name": "Customer",
                        "email": "test.customer@example.com",
                        "phone": "+919876543210",
                        "city": "Mumbai",
                        "state": "Maharashtra",
                        "country": "India",
                        "sales_person": "Varma Ji",
                        "sales_person_id": varma_id,
                        "reason_for_visit": "Purchase",
                        "customer_status": "lead",
                        "lead_source": "walk_in",
                        "product_type": "Necklace",
                        "style": "Traditional"
                    }
                    
                    print(f"\n🚀 Creating customer assigned to Varma Ji...")
                    create_response = requests.post(f"{BASE_URL}/clients/", json=customer_data, headers=headers)
                    
                    if create_response.status_code == 201:
                        customer = create_response.json()
                        print(f"✅ Customer created successfully!")
                        print(f"Customer ID: {customer.get('id')}")
                        print(f"Customer Name: {customer.get('first_name')} {customer.get('last_name')}")
                        print(f"Created By ID: {customer.get('created_by', {}).get('id')}")
                        print(f"Created By Name: {customer.get('created_by', {}).get('first_name')} {customer.get('created_by', {}).get('last_name')}")
                        print(f"Created By Username: {customer.get('created_by', {}).get('username')}")
                        
                        # Verify the customer was created by Varma Ji, not sales@liberty
                        created_by_name = f"{customer.get('created_by', {}).get('first_name', '')} {customer.get('created_by', {}).get('last_name', '')}".strip()
                        if 'varma' in created_by_name.lower():
                            print("✅ SUCCESS: Customer was created by Varma Ji (selected salesperson)")
                        else:
                            print(f"❌ ISSUE: Customer was created by {created_by_name} instead of Varma Ji")
                            
                    else:
                        print(f"❌ Customer creation failed: {create_response.status_code}")
                        print(f"Response: {create_response.text}")
                else:
                    print("❌ Could not find Varma Ji in salespersons list")
            else:
                print(f"❌ Failed to get salespersons: {salespersons_response.status_code}")
        else:
            print("❌ No access token received")
    else:
        print(f"❌ Login failed: {login_response.status_code}")

if __name__ == "__main__":
    test_customer_creation_with_salesperson()
