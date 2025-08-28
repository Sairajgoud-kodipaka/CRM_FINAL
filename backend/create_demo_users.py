#!/usr/bin/env python3
"""
Create Demo Users for Jewellery CRM
This script creates demo users with proper credentials for testing.
"""

import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.tenants.models import Tenant
from apps.stores.models import Store

User = get_user_model()

def create_demo_users():
    """Create demo users for testing"""
    
    print("🚀 Creating Demo Users...")
    
    # Create a default tenant if it doesn't exist
    tenant, created = Tenant.objects.get_or_create(
        name="Demo Jewellery Store",
        defaults={
            'description': 'Demo tenant for testing',
            'is_active': True
        }
    )
    if created:
        print(f"✅ Created tenant: {tenant.name}")
    else:
        print(f"✅ Using existing tenant: {tenant.name}")
    
    # Create a default store if it doesn't exist
    store, created = Store.objects.get_or_create(
        name="Main Store",
        tenant=tenant,
        defaults={
            'code': 'MAIN001',
            'address': '123 Demo Street, Demo City',
            'city': 'Demo City',
            'state': 'Demo State',
            'timezone': 'Asia/Kolkata',
            'is_active': True
        }
    )
    if created:
        print(f"✅ Created store: {store.name}")
    else:
        print(f"✅ Using existing store: {store.name}")
    
    # Demo users with their credentials
    demo_users = [
        {
            'username': 'admin',
            'email': 'admin@demo.com',
            'password': 'admin123',
            'first_name': 'Admin',
            'last_name': 'User',
            'role': 'platform_admin',
            'tenant': None,
            'store': None,
            'is_active': True
        },
        {
            'username': 'business_admin',
            'email': 'business@demo.com',
            'password': 'admin123',
            'first_name': 'Business',
            'last_name': 'Admin',
            'role': 'business_admin',
            'tenant': tenant,
            'store': None,
            'is_active': True
        },
        {
            'username': 'manager',
            'email': 'manager@demo.com',
            'password': 'password123',
            'first_name': 'Store',
            'last_name': 'Manager',
            'role': 'manager',
            'tenant': tenant,
            'store': store,
            'is_active': True
        },
        {
            'username': 'salesperson',
            'email': 'sales@demo.com',
            'password': 'password123',
            'first_name': 'Sales',
            'last_name': 'Person',
            'role': 'inhouse_sales',
            'tenant': tenant,
            'store': store,
            'is_active': True
        },
        {
            'username': 'telecaller',
            'email': 'tele@demo.com',
            'password': 'password123',
            'first_name': 'Tele',
            'last_name': 'Caller',
            'role': 'tele_calling',
            'tenant': tenant,
            'store': store,
            'is_active': True
        }
    ]
    
    created_users = []
    
    for user_data in demo_users:
        username = user_data['username']
        
        # Check if user already exists
        if User.objects.filter(username=username).exists():
            user = User.objects.get(username=username)
            print(f"✅ User {username} already exists")
            
            # Update password if needed
            if user.check_password(user_data['password']):
                print(f"   Password is correct")
            else:
                user.set_password(user_data['password'])
                user.save()
                print(f"   Password updated")
        else:
            # Create new user
            user = User.objects.create_user(
                username=username,
                email=user_data['email'],
                password=user_data['password'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                role=user_data['role'],
                tenant=user_data['tenant'],
                store=user_data['store'],
                is_active=user_data['is_active']
            )
            print(f"✅ Created user: {username} ({user_data['role']})")
            created_users.append(user)
    
    print(f"\n🎉 Demo users setup completed!")
    print(f"Created {len(created_users)} new users")
    
    # Print login credentials
    print(f"\n🔑 Login Credentials:")
    print(f"Platform Admin: admin / admin123")
    print(f"Business Admin: business_admin / admin123")
    print(f"Manager: manager / password123")
    print(f"Sales Person: salesperson / password123")
    print(f"Tele Caller: telecaller / password123")
    
    return created_users

if __name__ == '__main__':
    try:
        create_demo_users()
    except Exception as e:
        print(f"❌ Error creating demo users: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)