#!/usr/bin/env python
"""
Debug script to test notification creation and identify issues
"""
import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.users.models import User
from apps.notifications.models import Notification
from apps.clients.models import Client
from apps.tenants.models import Tenant
from apps.stores.models import Store

def debug_notification_creation():
    """Debug notification creation process"""
    print("=== DEBUGGING NOTIFICATION CREATION ===")
    
    # Check all tenants and stores
    print("\n=== ALL TENANTS ===")
    tenants = Tenant.objects.all()
    print(f"Total tenants: {tenants.count()}")
    for tenant in tenants:
        print(f"- {tenant.name} (ID: {tenant.id})")
    
    print("\n=== ALL STORES ===")
    stores = Store.objects.all()
    print(f"Total stores: {stores.count()}")
    for store in stores:
        print(f"- {store.name} (tenant: {store.tenant.name if store.tenant else 'None'})")
    
    # Check users in each tenant
    print("\n=== USERS BY TENANT ===")
    for tenant in tenants:
        users = User.objects.filter(tenant=tenant)
        print(f"\nTenant: {tenant.name}")
        print(f"Total users: {users.count()}")
        
        # Group users by role
        users_by_role = {}
        for user in users:
            role = user.role
            if role not in users_by_role:
                users_by_role[role] = []
            users_by_role[role].append(user)
        
        for role, role_users in users_by_role.items():
            print(f"  {role}: {len(role_users)} users")
            for user in role_users:
                print(f"    - {user.username} (store: {user.store.name if user.store else 'None'}, active: {user.is_active})")
    
    # Get a sample tenant and store
    try:
        # Try to find a tenant with diverse user roles
        tenant_with_diverse_roles = None
        for tenant in tenants:
            users = User.objects.filter(tenant=tenant)
            roles = set(user.role for user in users)
            if len(roles) > 1 and 'manager' in roles:  # Look for tenant with managers
                tenant_with_diverse_roles = tenant
                break
        
        if not tenant_with_diverse_roles:
            print("\nNo tenants with managers found in the system")
            return
        
        tenant = tenant_with_diverse_roles
        store = Store.objects.filter(tenant=tenant).first()
        
        print(f"\nUsing tenant: {tenant.name}")
        print(f"Using store: {store.name}")
        
        # Check users in the system
        print("\n=== USERS IN SYSTEM ===")
        users = User.objects.filter(tenant=tenant)
        print(f"Total users in tenant: {users.count()}")
        
        for user in users:
            print(f"- {user.username} (role: {user.role}, store: {user.store.name if user.store else 'None'}, active: {user.is_active})")
        
        # Check business admins specifically
        print("\n=== BUSINESS ADMINS ===")
        business_admins = User.objects.filter(tenant=tenant, role='business_admin')
        print(f"Business admins found: {business_admins.count()}")
        for admin in business_admins:
            print(f"- {admin.username} (active: {admin.is_active}, store: {admin.store.name if admin.store else 'None'})")
        
        # Check managers specifically
        print("\n=== MANAGERS ===")
        managers = User.objects.filter(tenant=tenant, role='manager')
        print(f"Managers found: {managers.count()}")
        for manager in managers:
            print(f"- {manager.username} (active: {manager.is_active}, store: {manager.store.name if manager.store else 'None'})")
        
        # Check existing notifications
        print("\n=== EXISTING NOTIFICATIONS ===")
        notifications = Notification.objects.filter(tenant=tenant)
        print(f"Total notifications in tenant: {notifications.count()}")
        
        # Group notifications by user
        notifications_by_user = {}
        for notification in notifications:
            user_key = f"{notification.user.username} ({notification.user.role})"
            if user_key not in notifications_by_user:
                notifications_by_user[user_key] = []
            notifications_by_user[user_key].append(notification)
        
        for user_key, user_notifications in notifications_by_user.items():
            print(f"- {user_key}: {len(user_notifications)} notifications")
            for notif in user_notifications[:3]:  # Show first 3
                print(f"  * {notif.type}: {notif.title}")
            if len(user_notifications) > 3:
                print(f"  ... and {len(user_notifications) - 3} more")
        
        # Test notification creation logic
        print("\n=== TESTING NOTIFICATION LOGIC ===")
        
        # Simulate the notification creation logic
        from apps.clients.views import ClientViewSet
        viewset = ClientViewSet()
        
        # Create a mock client for testing
        mock_client = Client(
            first_name="Test",
            last_name="Customer",
            tenant=tenant,
            store=store
        )
        
        # Get a test user
        test_user = User.objects.filter(tenant=tenant, is_active=True).first()
        if test_user:
            print(f"Using test user: {test_user.username} (role: {test_user.role})")
            
            # Test the notification creation method
            try:
                viewset.create_customer_notifications(mock_client, test_user)
                print("Notification creation test completed successfully")
            except Exception as e:
                print(f"Error in notification creation test: {e}")
                import traceback
                print(f"Traceback: {traceback.format_exc()}")
        else:
            print("No active users found for testing")
            
    except Exception as e:
        print(f"Error in debug script: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")

if __name__ == "__main__":
    debug_notification_creation()
