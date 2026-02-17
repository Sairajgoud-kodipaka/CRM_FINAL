#!/usr/bin/env python3
"""
Quick notification status check script
Run: python manage.py shell < check_notifications.py
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.conf import settings
from apps.notifications.models import PushSubscription, Notification
from apps.users.models import User

import logging

logger = logging.getLogger('crm')

logger.info(
    'service.start',
    extra={
        'service': 'notification_checker',
        'event': 'service.start',
        'user': 'system',
    },
)

# VAPID Config
print("\n1. VAPID Configuration:")
print(f"   Public Key: {'✅ SET' if hasattr(settings, 'VAPID_PUBLIC_KEY') and settings.VAPID_PUBLIC_KEY else '❌ NOT SET'}")
print(f"   Private Key: {'✅ SET' if hasattr(settings, 'VAPID_PRIVATE_KEY') and settings.VAPID_PRIVATE_KEY else '❌ NOT SET'}")
print(f"   Email: {getattr(settings, 'VAPID_CLAIMS_EMAIL', 'NOT SET')}")

# Push Subscriptions
print("\n2. Push Subscriptions:")
total = PushSubscription.objects.count()
print(f"   Total subscriptions: {total}")
if total > 0:
    print("\n   Subscriptions by user:")
    from django.db.models import Count
    subs_by_user = PushSubscription.objects.values('user__username', 'user__id').annotate(count=Count('id'))
    for item in subs_by_user[:10]:
        print(f"     - {item['user__username']} (ID: {item['user__id']}): {item['count']} subscription(s)")
else:
    print("   ⚠️  No subscriptions found - users need to grant permission")

# Recent notifications
print("\n3. Recent Notifications:")
recent = Notification.objects.order_by('-created_at')[:5]
if recent.exists():
    for n in recent:
        status = "✅ Read" if n.is_read else "⏳ Unread"
        print(f"   {status} | {n.user.username}: {n.title[:50]}")
else:
    print("   No notifications found")

# CORS/CSRF
print("\n4. CORS/CSRF Configuration:")
print(f"   CORS Origins: {len(settings.CORS_ALLOWED_ORIGINS)} origin(s)")
print(f"   CSRF Origins: {len(settings.CSRF_TRUSTED_ORIGINS)} origin(s)")
print(f"   Allowed Hosts: {', '.join(settings.ALLOWED_HOSTS[:3])}...")

print("\n" + "=" * 80)
