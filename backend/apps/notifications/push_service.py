import json
import logging
from django.conf import settings
from .models import PushSubscription

try:
    from pywebpush import webpush, WebPushException
    PUSH_ENABLED = True
except ImportError:
    PUSH_ENABLED = False

logger = logging.getLogger(__name__)


def send_web_push(user_id: int, title: str, message: str, action_url: str = None, notification_id: int = None):
    """Send web push notification using Web Push API (VAPID)"""
    if not PUSH_ENABLED:
        logger.warning("Web Push not enabled: pywebpush not installed")
        return
    
    if not hasattr(settings, 'VAPID_PRIVATE_KEY') or not settings.VAPID_PRIVATE_KEY:
        logger.warning("Web Push not configured: VAPID keys missing")
        return
    
    try:
        # Get user's push subscriptions
        subscriptions = PushSubscription.objects.filter(user_id=user_id)
        
        if not subscriptions.exists():
            logger.debug(f"No push subscriptions found for user {user_id}")
            return
        
        # Deduplicate subscriptions by endpoint (keep only one per endpoint)
        seen_endpoints = set()
        unique_subscriptions = []
        for subscription in subscriptions:
            if subscription.endpoint not in seen_endpoints:
                seen_endpoints.add(subscription.endpoint)
                unique_subscriptions.append(subscription)
        
        if not unique_subscriptions:
            logger.debug(f"No unique push subscriptions found for user {user_id}")
            return
        
        # Prepare payload
        payload = json.dumps({
            'title': title,
            'message': message,
            'action_url': action_url or '/',
            'notification_id': notification_id
        })
        
        # Prepare VAPID claims
        vapid_claims = {
            "sub": getattr(settings, 'VAPID_CLAIMS_EMAIL', 'mailto:admin@example.com')
        }
        
        # Send to unique subscriptions only (one per endpoint)
        success_count = 0
        for subscription in unique_subscriptions:
            try:
                webpush(
                    subscription_info={
                        "endpoint": subscription.endpoint,
                        "keys": {
                            "p256dh": subscription.p256dh,
                            "auth": subscription.auth
                        }
                    },
                    data=payload,
                    vapid_private_key=settings.VAPID_PRIVATE_KEY,
                    vapid_claims=vapid_claims
                )
                success_count += 1
                logger.info(f"Sent web push to user {user_id} via endpoint {subscription.endpoint[:50]}...")
            except WebPushException as e:
                logger.error(f"Web Push failed for user {user_id}: {e}")
                
                # If subscription is invalid (404, 410), delete it
                if hasattr(e, 'response') and e.response is not None:
                    status_code = getattr(e.response, 'status_code', None)
                    if status_code in [404, 410]:
                        logger.info(f"Deleting invalid subscription for user {user_id}")
                        subscription.delete()
        
        logger.info(f"Sent {success_count}/{len(unique_subscriptions)} push notifications to user {user_id} (deduplicated from {subscriptions.count()} total subscriptions)")
        
    except Exception as e:
        logger.error(f"Error sending web push to user {user_id}: {e}")

