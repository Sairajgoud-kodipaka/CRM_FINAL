import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

logger = logging.getLogger(__name__)

class CallConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'calls'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"WebSocket connected: {self.channel_name}")

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        logger.info(f"WebSocket disconnected: {self.channel_name}")

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            
            if message_type == 'subscribe_call':
                call_id = text_data_json.get('call_id')
                if call_id:
                    # Join specific call room
                    call_room = f'call_{call_id}'
                    await self.channel_layer.group_add(
                        call_room,
                        self.channel_name
                    )
                    logger.info(f"Subscribed to call: {call_id}")
            
            elif message_type == 'unsubscribe_call':
                call_id = text_data_json.get('call_id')
                if call_id:
                    # Leave specific call room
                    call_room = f'call_{call_id}'
                    await self.channel_layer.group_discard(
                        call_room,
                        self.channel_name
                    )
                    logger.info(f"Unsubscribed from call: {call_id}")
                    
        except json.JSONDecodeError:
            logger.error("Invalid JSON in WebSocket message")
        except Exception as e:
            logger.error(f"Error processing WebSocket message: {e}")

    # Receive message from room group
    async def call_status_update(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'call_status_update',
            'callId': event['call_id'],
            'status': event['status'],
            'duration': event.get('duration'),
            'recordingUrl': event.get('recording_url'),
            'disposition': event.get('disposition')
        }))

    async def call_ended(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'call_ended',
            'callId': event['call_id'],
            'duration': event.get('duration'),
            'recordingUrl': event.get('recording_url'),
            'disposition': event.get('disposition')
        }))

    async def call_started(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'call_started',
            'callId': event['call_id'],
            'status': event['status']
        }))


# Utility functions to send WebSocket messages
async def send_call_status_update(call_id: str, status: str, duration: int = None, recording_url: str = None, disposition: str = None):
    """Send call status update to WebSocket clients"""
    from channels.layers import get_channel_layer
    channel_layer = get_channel_layer()
    
    if channel_layer:
        await channel_layer.group_send(
            f'call_{call_id}',
            {
                'type': 'call_status_update',
                'call_id': call_id,
                'status': status,
                'duration': duration,
                'recording_url': recording_url,
                'disposition': disposition
            }
        )

async def send_call_ended(call_id: str, duration: int = None, recording_url: str = None, disposition: str = None):
    """Send call ended notification to WebSocket clients"""
    from channels.layers import get_channel_layer
    channel_layer = get_channel_layer()
    
    if channel_layer:
        await channel_layer.group_send(
            f'call_{call_id}',
            {
                'type': 'call_ended',
                'call_id': call_id,
                'duration': duration,
                'recording_url': recording_url,
                'disposition': disposition
            }
        )

async def send_call_started(call_id: str, status: str):
    """Send call started notification to WebSocket clients"""
    from channels.layers import get_channel_layer
    channel_layer = get_channel_layer()
    
    if channel_layer:
        await channel_layer.group_send(
            f'call_{call_id}',
            {
                'type': 'call_started',
                'call_id': call_id,
                'status': status
            }
        )
