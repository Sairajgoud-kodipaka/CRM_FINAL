import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

User = get_user_model()
logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.user_room = None
        self.tenant_room = None
        self.store_room = None

    async def connect(self):
        # Get token from query string
        query_string = self.scope.get('query_string', b'').decode()
        token = None
        
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=')[1]
                break
        
        # Authenticate user via JWT token
        if not token:
            await self.close()
            logger.warning("WebSocket connection rejected: No token provided")
            return
        
        try:
            # Verify token
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            self.user = await self.get_user(user_id)
            
            if not self.user or not self.user.is_authenticated:
                await self.close()
                logger.warning(f"WebSocket connection rejected: Invalid user")
                return
            
            # Store user info
            self.scope['user'] = self.user
            
            # Join user-specific room
            self.user_room = f'notifications_user_{self.user.id}'
            await self.channel_layer.group_add(self.user_room, self.channel_name)
            
            # Join tenant room (for business admin broadcasts)
            if self.user.tenant:
                self.tenant_room = f'notifications_tenant_{self.user.tenant.id}'
                await self.channel_layer.group_add(self.tenant_room, self.channel_name)
            
            # Join store room (for store-specific broadcasts)
            if self.user.store:
                self.store_room = f'notifications_store_{self.user.store.id}'
                await self.channel_layer.group_add(self.store_room, self.channel_name)
            
            await self.accept()
            logger.info(f"WebSocket connected: user={self.user.username}, rooms={[self.user_room, self.tenant_room, self.store_room]}")
            
        except (TokenError, InvalidToken) as e:
            await self.close()
            logger.warning(f"WebSocket connection rejected: Invalid token - {e}")
        except Exception as e:
            logger.error(f"WebSocket connection error: {e}")
            await self.close()

    async def disconnect(self, close_code):
        # Leave all rooms
        if self.user_room:
            await self.channel_layer.group_discard(self.user_room, self.channel_name)
        if self.tenant_room:
            await self.channel_layer.group_discard(self.tenant_room, self.channel_name)
        if self.store_room:
            await self.channel_layer.group_discard(self.store_room, self.channel_name)
        
        logger.info(f"WebSocket disconnected: {self.user.username if self.user else 'Unknown'}")

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            
            # Handle different message types if needed
            if message_type == 'ping':
                # Respond to keep-alive ping
                await self.send(text_data=json.dumps({'type': 'pong'}))
            
        except json.JSONDecodeError:
            logger.error("Invalid JSON in WebSocket message")
        except Exception as e:
            logger.error(f"Error processing WebSocket message: {e}")

    # Handler for new notification event
    async def new_notification(self, event):
        """Receive new notification from group"""
        await self.send(text_data=json.dumps({
            'type': 'new_notification',
            'notification': event['notification']
        }))

    # Handler for notification batch event
    async def notification_batch(self, event):
        """Receive batch of notifications"""
        await self.send(text_data=json.dumps({
            'type': 'notification_batch',
            'notifications': event['notifications']
        }))

    # Handler for notification read event
    async def notification_read(self, event):
        """Receive notification read update"""
        await self.send(text_data=json.dumps({
            'type': 'notification_read',
            'notification_id': event['notification_id']
        }))

    @database_sync_to_async
    def get_user(self, user_id):
        """Get user from database"""
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

