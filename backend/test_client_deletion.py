#!/usr/bin/env python
"""
Test script to verify client deletion works properly
"""
import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.clients.models import Client
from apps.users.permissions import CanDeleteCustomer

User = get_user_model()

def test_client_deletion_permissions():
    print("Testing client deletion permissions...")
    
    # Find a test client
    clients = Client.objects.all()[:5]
    
    if not clients.exists():
        print("No clients found to test with")
        return
    
    client = clients.first()
    print(f"\nTesting with client: {client.first_name} {client.last_name} (ID: {client.id})")
    
    # Test different user roles
    test_users = User.objects.filter(role__in=['business_admin', 'manager', 'inhouse_sales'])[:3]
    
    for user in test_users:
        print(f"\nTesting with user: {user.username} (Role: {user.role})")
        
        # Create a mock request object
        class MockRequest:
            def __init__(self, user):
                self.user = user
        
        request = MockRequest(user)
        
        # Test permission
        permission = CanDeleteCustomer()
        has_permission = permission.has_permission(request, None)
        has_object_permission = permission.has_object_permission(request, None, client)
        
        print(f"  has_permission: {has_permission}")
        print(f"  has_object_permission: {has_object_permission}")
        
        if has_permission and has_object_permission:
            print(f"  ✅ {user.role} can delete clients")
        else:
            print(f"  ❌ {user.role} cannot delete clients")

def test_client_deletion():
    print("\nTesting actual client deletion...")
    
    # Find a business admin user
    business_admin = User.objects.filter(role='business_admin').first()
    if not business_admin:
        print("No business admin found to test deletion")
        return
    
    # Find a test client
    clients = Client.objects.all()[:5]
    if not clients.exists():
        print("No clients found to test deletion")
        return
    
    client = clients.first()
    print(f"Deleting client: {client.first_name} {client.last_name} (ID: {client.id})")
    
    # Count before deletion
    client_count_before = Client.objects.count()
    print(f"Before deletion - Clients: {client_count_before}")
    
    try:
        # Delete the client
        client.delete()
        
        # Count after deletion
        client_count_after = Client.objects.count()
        print(f"After deletion - Clients: {client_count_after}")
        
        if client_count_after < client_count_before:
            print(f"  ✅ SUCCESS: Client deleted")
        else:
            print(f"  ❌ FAILED: Client deletion didn't work")
            
    except Exception as e:
        print(f"  ❌ ERROR: {e}")

if __name__ == "__main__":
    test_client_deletion_permissions()
    test_client_deletion()
