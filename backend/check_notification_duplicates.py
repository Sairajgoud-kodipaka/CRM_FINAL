#!/usr/bin/env python
"""
Script to analyze duplicate notifications in the database.
Run this from Django shell or as a management command.
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.notifications.models import Notification
from apps.clients.models import Client
from django.utils import timezone
from collections import Counter

def analyze_notifications():
    """Analyze notification duplicates."""
    
    # Get all new_customer notifications
    notifications = Notification.objects.filter(type='new_customer').order_by('created_at')
    
    print("=" * 80)
    print("NOTIFICATION DUPLICATE ANALYSIS")
    print("=" * 80)
    print(f"\nTotal 'new_customer' notifications: {notifications.count()}")
    
    # Group by customer name (extracted from message)
    customer_names = []
    notification_details = []
    
    for notif in notifications:
        # Extract customer name from message
        # Format: "{first_name} {last_name} has been registered..."
        message = notif.message
        if "has been registered" in message:
            customer_name = message.split(" has been registered")[0].strip()
            customer_names.append(customer_name)
            notification_details.append({
                'id': notif.id,
                'customer_name': customer_name,
                'user': notif.user.username,
                'created_at': notif.created_at,
                'tenant': notif.tenant.name if notif.tenant else None,
                'store': notif.store.name if notif.store else None,
            })
    
    # Count occurrences
    name_counts = Counter(customer_names)
    
    print(f"\nUnique customer names: {len(name_counts)}")
    print(f"\nDuplicate customer names (created multiple times):")
    print("-" * 80)
    
    duplicates_found = False
    for name, count in name_counts.most_common():
        if count > 1:
            duplicates_found = True
            print(f"\n  {name}: {count} notifications")
            
            # Show details for this customer
            for detail in notification_details:
                if detail['customer_name'] == name:
                    print(f"    - ID: {detail['id']}, User: {detail['user']}, "
                          f"Created: {detail['created_at']}, "
                          f"Tenant: {detail['tenant']}, Store: {detail['store']}")
    
    if not duplicates_found:
        print("  No duplicates found! Each notification is for a different user.")
        print("\n  Note: Multiple notifications for the same customer name is EXPECTED")
        print("  if multiple users should be notified (e.g., creator, business admin, manager).")
    
    # Check for actual duplicate notifications (same user, same customer, same time)
    print("\n" + "=" * 80)
    print("CHECKING FOR ACTUAL DUPLICATES (same user, same customer, same time)")
    print("=" * 80)
    
    actual_duplicates = {}
    for i, detail1 in enumerate(notification_details):
        key = (detail1['customer_name'], detail1['user'], 
               detail1['created_at'].strftime('%Y-%m-%d %H:%M:%S'))
        if key not in actual_duplicates:
            actual_duplicates[key] = []
        actual_duplicates[key].append(detail1['id'])
    
    duplicate_count = 0
    for key, ids in actual_duplicates.items():
        if len(ids) > 1:
            duplicate_count += 1
            customer_name, user, created_at = key
            print(f"\n⚠️  DUPLICATE FOUND:")
            print(f"   Customer: {customer_name}")
            print(f"   User: {user}")
            print(f"   Created: {created_at}")
            print(f"   Notification IDs: {ids}")
            print(f"   Count: {len(ids)}")
    
    if duplicate_count == 0:
        print("\n✅ No actual duplicates found!")
        print("   All notifications are unique (different users or different times).")
    else:
        print(f"\n⚠️  Found {duplicate_count} sets of actual duplicates!")
        print("   These should be investigated and cleaned up.")
    
    # Check clients vs notifications
    print("\n" + "=" * 80)
    print("CLIENTS vs NOTIFICATIONS COMPARISON")
    print("=" * 80)
    
    total_clients = Client.objects.count()
    total_notifications = notifications.count()
    
    print(f"Total Clients: {total_clients}")
    print(f"Total 'new_customer' Notifications: {total_notifications}")
    
    if total_notifications > total_clients:
        avg_notifications_per_client = total_notifications / total_clients
        print(f"\n⚠️  More notifications than clients!")
        print(f"   Average: {avg_notifications_per_client:.2f} notifications per client")
        print(f"   This is expected if multiple users are notified per customer.")
    else:
        print(f"\n✅ Notification count is reasonable.")
    
    print("\n" + "=" * 80)
    print("RECOMMENDATIONS")
    print("=" * 80)
    
    if duplicate_count > 0:
        print("\n1. ⚠️  Investigate duplicate notifications - some users are receiving")
        print("   multiple notifications for the same customer creation.")
        print("\n2. Check if create_customer_notifications() is being called multiple times")
        print("   (e.g., from signals or multiple save() calls)")
        print("\n3. Consider adding a check to prevent duplicate notifications:")
        print("   - Check if notification already exists before creating")
        print("   - Use get_or_create with unique constraints")
    else:
        print("\n✅ No duplicate notifications detected!")
        print("   The multiple notifications per customer are expected behavior")
        print("   (different users receiving notifications).")
    
    print("\n" + "=" * 80)

if __name__ == '__main__':
    analyze_notifications()

