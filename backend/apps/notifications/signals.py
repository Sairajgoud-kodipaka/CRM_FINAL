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
    """Broadcast notification via WebSocket when created"""
    if not created:
        return
    
    try:
        # Get channel layer
        channel_layer = get_channel_layer()
        
        # Determine priority-based delivery
        if instance.priority in ['high', 'urgent']:
            # Immediate broadcast for high priority notifications
            serializer = NotificationSerializer(instance)
            notification_data = serializer.data
            
            # Broadcast to user-specific room
            async_to_sync(channel_layer.group_send)(
                f'notifications_user_{instance.user.id}',
                {
                    'type': 'new_notification',
                    'notification': notification_data
                }
            )
            
            # Also send Web Push for background delivery
            if instance.priority == 'urgent':
                send_web_push(
                    user_id=instance.user.id,
                    title=instance.title,
                    message=instance.message,
                    action_url=instance.action_url,
                    notification_id=instance.id,
                    metadata=instance.metadata if hasattr(instance, 'metadata') else {}
                )
            
            logger.info(f"Broadcast immediate notification to user {instance.user.id}: {instance.title}")
        
        elif instance.priority == 'medium':
            # Medium priority can be batched (handled by management command)
            # Still broadcast immediately for now
            serializer = NotificationSerializer(instance)
            notification_data = serializer.data
            
            async_to_sync(channel_layer.group_send)(
                f'notifications_user_{instance.user.id}',
                {
                    'type': 'new_notification',
                    'notification': notification_data
                }
            )
            
            logger.info(f"Broadcast medium priority notification to user {instance.user.id}: {instance.title}")
        
        # Low priority notifications will be batched by management command
        
    except Exception as e:
        logger.error(f"Error broadcasting notification {instance.id}: {e}")


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

