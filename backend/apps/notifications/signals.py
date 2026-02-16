import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification, PushSubscription
from .serializers import NotificationSerializer

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Notification)
def broadcast_notification(sender, instance, created, **kwargs):
    """Broadcast notification via WebSocket when created and send Web Push for all priorities."""
    if not created:
        return
    # Guard: avoid AttributeError if user was deleted or FK is stale
    user_id = getattr(instance, 'user_id', None)
    if not user_id or not getattr(instance, 'user', None):
        logger.warning("Notification %s has no user; skipping broadcast and push", instance.id)
        return

    try:
        serializer = NotificationSerializer(instance)
        notification_data = serializer.data
    except Exception as e:
        logger.error("Serialization failed for notification %s: %s", instance.id, e)
        return

    # WebSocket: broadcast to user (requires Redis). Don't block push if Redis is down.
    try:
        channel_layer = get_channel_layer()
        if instance.priority in ['medium', 'high', 'urgent']:
            async_to_sync(channel_layer.group_send)(
                f'notifications_user_{instance.user.id}',
                {
                    'type': 'new_notification',
                    'notification': notification_data
                }
            )
            logger.info("Broadcast notification to user %s: %s", instance.user.id, instance.title)
    except Exception as e:
        logger.warning("WebSocket broadcast failed for notification %s (Redis may be down): %s", instance.id, e)

    # Web Push: always send for every new notification (does not depend on Redis)
    try:
        logger.info("Sending web push for notification id=%s to user_id=%s: %s", instance.id, instance.user.id, instance.title)
        send_web_push(
            user_id=instance.user.id,
            title=instance.title,
            message=instance.message,
            action_url=instance.action_url,
            notification_id=instance.id,
            metadata=instance.metadata if hasattr(instance, 'metadata') else {}
        )
    except Exception as e:
        logger.error("Error sending web push for notification %s: %s", instance.id, e)


def send_web_push(user_id: int, title: str, message: str, action_url: str = None, notification_id: int = None, metadata: dict = None):
    """Send web push notification using Web Push API (VAPID)"""
    try:
        from .push_service import send_web_push as send_push
        send_push(
            user_id=user_id,
            title=title,
            message=message,
            action_url=action_url,
            notification_id=notification_id
        )
    except ImportError:
        # Push service not implemented yet, skip silently
        pass
    except Exception as e:
        logger.error(f"Error sending web push to user {user_id}: {e}")

