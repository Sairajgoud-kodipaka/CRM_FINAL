#!/usr/bin/env python3
"""
Delete Demo Users from Jewellery CRM
This script removes all demo users created for testing purposes.
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

def delete_demo_users():
    """Delete all demo users created for testing"""
    
    print("🗑️  Deleting Demo Users...")
    
    # List of demo usernames to delete
    demo_usernames = [
        'admin',
        'business_admin', 
        'manager',
        'salesperson',
        'telecaller'
    ]
    
    deleted_users = []
    skipped_users = []
    
    for username in demo_usernames:
        try:
            # Check if user exists
            if User.objects.filter(username=username).exists():
                user = User.objects.get(username=username)
                
                # Check if this is actually a demo user (by role)
                if user.role in ['platform_admin', 'business_admin', 'manager', 'inhouse_sales', 'tele_calling']:
                    # Delete the user
                    user.delete()
                    print(f"✅ Deleted demo user: {username} ({user.role})")
                    deleted_users.append(username)
                else:
                    print(f"⚠️  Skipped user {username} - not a demo user (role: {user.role})")
                    skipped_users.append(username)
            else:
                print(f"ℹ️  User {username} not found - already deleted")
                
        except Exception as e:
            print(f"❌ Error deleting user {username}: {e}")
    
    # Try to delete demo tenant and store if they exist
    try:
        # Delete demo store
        demo_store = Store.objects.filter(name="Main Store").first()
        if demo_store:
            demo_store.delete()
            print("✅ Deleted demo store: Main Store")
        else:
            print("ℹ️  Demo store not found - already deleted")
            
        # Delete demo tenant
        demo_tenant = Tenant.objects.filter(name="Demo Jewellery Store").first()
        if demo_tenant:
            demo_tenant.delete()
            print("✅ Deleted demo tenant: Demo Jewellery Store")
        else:
            print("ℹ️  Demo tenant not found - already deleted")
            
    except Exception as e:
        print(f"❌ Error deleting demo store/tenant: {e}")
    
    print(f"\n🏁 Demo cleanup completed!")
    print(f"Deleted {len(deleted_users)} demo users: {', '.join(deleted_users) if deleted_users else 'None'}")
    
    if skipped_users:
        print(f"Skipped {len(skipped_users)} users: {', '.join(skipped_users)}")
    
    # Show remaining users
    remaining_users = User.objects.all()
    print(f"\n📊 Remaining users in system: {remaining_users.count()}")
    
    if remaining_users.exists():
        print("Remaining users:")
        for user in remaining_users:
            print(f"  - {user.username} ({user.role}) - {user.get_full_name()}")
    
    return deleted_users

if __name__ == '__main__':
    try:
        delete_demo_users()
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
