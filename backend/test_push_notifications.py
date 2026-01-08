#!/usr/bin/env python3
"""
Test Push Notifications Script

This script tests the push notification setup:
1. Checks VAPID configuration
2. Checks pywebpush installation
3. Sends a test notification to a user

Usage:
    python manage.py shell < test_push_notifications.py
    OR
    python manage.py shell
    >>> exec(open('test_push_notifications.py').read())
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.conf import settings
from apps.users.models import User
from apps.notifications.push_service import send_web_push
from apps.notifications.models import PushSubscription

print("=" * 80)
print("PUSH NOTIFICATIONS TEST")
print("=" * 80)
print()

# Test 1: Check VAPID Configuration
print("1. Checking VAPID Configuration...")
print("-" * 80)

if hasattr(settings, 'VAPID_PRIVATE_KEY') and settings.VAPID_PRIVATE_KEY:
    print(f"✅ VAPID_PRIVATE_KEY: {settings.VAPID_PRIVATE_KEY[:30]}...")
else:
    print("❌ VAPID_PRIVATE_KEY: NOT SET")

if hasattr(settings, 'VAPID_PUBLIC_KEY') and settings.VAPID_PUBLIC_KEY:
    print(f"✅ VAPID_PUBLIC_KEY: {settings.VAPID_PUBLIC_KEY[:30]}...")
else:
    print("❌ VAPID_PUBLIC_KEY: NOT SET")

if hasattr(settings, 'VAPID_CLAIMS_EMAIL') and settings.VAPID_CLAIMS_EMAIL:
    print(f"✅ VAPID_CLAIMS_EMAIL: {settings.VAPID_CLAIMS_EMAIL}")
else:
    print("❌ VAPID_CLAIMS_EMAIL: NOT SET")

print()

# Test 2: Check pywebpush Installation
print("2. Checking pywebpush Installation...")
print("-" * 80)

try:
    from pywebpush import webpush, WebPushException
    print("✅ pywebpush is installed")
    PUSH_ENABLED = True
except ImportError:
    print("❌ pywebpush is NOT installed")
    print("   Install it with: pip install pywebpush")
    PUSH_ENABLED = False

print()

# Test 3: Check Push Subscriptions
print("3. Checking Push Subscriptions...")
print("-" * 80)

subscriptions = PushSubscription.objects.all()
print(f"Total push subscriptions: {subscriptions.count()}")

if subscriptions.exists():
    for sub in subscriptions[:5]:  # Show first 5
        print(f"  - User: {sub.user.username} (ID: {sub.user.id})")
        print(f"    Endpoint: {sub.endpoint[:50]}...")
        print(f"    Created: {sub.created_at}")
else:
    print("⚠️  No push subscriptions found")
    print("   Users need to grant notification permission in the browser")

print()

# Test 4: Send Test Notification
if PUSH_ENABLED and subscriptions.exists():
    print("4. Sending Test Notification...")
    print("-" * 80)
    
    # Get first user with subscription
    test_user = subscriptions.first().user
    
    print(f"Sending test notification to: {test_user.username} (ID: {test_user.id})")
    
    try:
        send_web_push(
            user_id=test_user.id,
            title="🧪 Test Push Notification",
            message="This is a test notification from the backend. If you see this, push notifications are working!",
            action_url="/customers",
            notification_id=None
        )
        print("✅ Test notification sent successfully!")
        print("   Check the browser - you should see a notification popup")
    except Exception as e:
        print(f"❌ Error sending notification: {e}")
        print("   Check backend logs for more details")
else:
    print("4. Skipping Test Notification...")
    print("-" * 80)
    if not PUSH_ENABLED:
        print("⚠️  Cannot send test - pywebpush not installed")
    if not subscriptions.exists():
        print("⚠️  Cannot send test - no push subscriptions found")
        print("   Users need to:")
        print("   1. Log in to the application")
        print("   2. Grant notification permission")
        print("   3. Wait for automatic subscription")

print()
print("=" * 80)
print("TEST COMPLETE")
print("=" * 80)
print()
print("Next Steps:")
print("1. If all checks pass ✅, push notifications are configured correctly")
print("2. Log in to the frontend and grant notification permission")
print("3. Send a test notification using the code above")
print("4. Check browser console for any errors")
print()

