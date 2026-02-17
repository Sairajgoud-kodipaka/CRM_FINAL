import base64
import re
import logging

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from django.db import IntegrityError
from django.db.models import Q
from django.conf import settings
from apps.users.middleware import ScopedVisibilityMiddleware
from .models import Notification, NotificationSettings, PushSubscription
from .serializers import (
    NotificationSerializer, NotificationSettingsSerializer,
    NotificationCreateSerializer, NotificationUpdateSerializer
)


def _vapid_public_key_to_base64url(key_value: str) -> str:
    """Convert VAPID public key from PEM/SPKI or raw base64 to raw 65-byte base64url for browser PushManager.
    Returns a string safe to pass as applicationServerKey (unpadded base64url)."""
    key_value = key_value.strip().replace("\n", "").replace("\r", "").rstrip(">")
    if not key_value:
        raise ValueError("VAPID public key is empty")
    # Decode base64 once to detect format (standard base64: +/; base64url: -_)
    padding = 4 - (len(key_value) % 4)
    if padding != 4:
        key_value_b64 = key_value + ("=" * padding)
    else:
        key_value_b64 = key_value
    decoded = base64.b64decode(key_value_b64.replace("-", "+").replace("_", "/"), validate=False)
    # Already raw 65-byte P-256 key (0x04 || x || y)
    if len(decoded) == 65 and decoded[0] == 0x04:
        return base64.urlsafe_b64encode(decoded).decode("ascii").rstrip("=")
    # 66 bytes: some envs store raw key with one extra byte; use first 65 if leading byte is 0x04
    if len(decoded) == 66 and decoded[0] == 0x04:
        return base64.urlsafe_b64encode(decoded[:65]).decode("ascii").rstrip("=")
    # Full SPKI (91 bytes for P-256) or PEM
    if "BEGIN" in key_value.upper():
        from cryptography.hazmat.primitives.serialization import (
            load_pem_public_key,
            Encoding,
            PublicFormat,
        )
        from cryptography.hazmat.backends import default_backend
        if "-----" in key_value and "\n" not in key_value:
            parts = re.split(r"-{5}", key_value)
            if len(parts) >= 3:
                key_value = f"-----BEGIN PUBLIC KEY-----\n{parts[2].strip()}\n-----END PUBLIC KEY-----"
            else:
                key_value = key_value.replace("-----BEGIN PUBLIC KEY-----", "-----BEGIN PUBLIC KEY-----\n").replace("-----END PUBLIC KEY-----", "\n-----END PUBLIC KEY-----")
        elif "-----" not in key_value:
            key_value = f"-----BEGIN PUBLIC KEY-----\n{key_value}\n-----END PUBLIC KEY-----"
        key = load_pem_public_key(key_value.encode(), default_backend())
        raw_bytes = key.public_bytes(Encoding.X962, PublicFormat.UncompressedPoint)
        if len(raw_bytes) != 65:
            raise ValueError(f"Expected 65-byte raw key from PEM, got {len(raw_bytes)}")
        return base64.urlsafe_b64encode(raw_bytes).decode("ascii").rstrip("=")
    # Truncated SPKI (e.g. only first line of PEM pasted): decoded is 66 bytes, starts with 0x30
    if len(decoded) == 66 and decoded[0] == 0x30:
        raise ValueError(
            "VAPID public key is truncated (only first line was pasted). "
            "Run: python manage.py generate_vapid_keys and paste the FULL single line for VAPID_PUBLIC_KEY into .env, then restart the backend."
        )
    try:
        from cryptography.hazmat.primitives.serialization import load_der_public_key, Encoding, PublicFormat
        from cryptography.hazmat.backends import default_backend
        key = load_der_public_key(decoded, default_backend())
        raw_bytes = key.public_bytes(Encoding.X962, PublicFormat.UncompressedPoint)
        if len(raw_bytes) != 65:
            raise ValueError(f"Expected 65-byte raw key from DER, got {len(raw_bytes)}")
        return base64.urlsafe_b64encode(raw_bytes).decode("ascii").rstrip("=")
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(
            f"VAPID public key invalid or truncated (decoded {len(decoded)} bytes). "
            "Regenerate with: python manage.py generate_vapid_keys and paste the full VAPID_PUBLIC_KEY into .env. "
            f"Error: {e}"
        )


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter notifications based on user's tenant and store access"""
        from django.utils import timezone
        from datetime import timedelta
        
        user = self.request.user
        
        if not user.is_authenticated:
            return Notification.objects.none()
        
        # Get last 7 days of notifications (more reasonable than just today)
        days_back = 7
        date_start = timezone.now() - timedelta(days=days_back)
        
        # Base queryset with date filter (last 7 days)
        base_queryset = Notification.objects.filter(
            created_at__gte=date_start
        ).order_by('-created_at')
        
        # Business admin can see all notifications in their tenant
        if user.role == 'business_admin':
            queryset = base_queryset.filter(tenant=user.tenant)
            return queryset
        
        # Store users (managers, inhouse_sales, etc.) can see their store's notifications and their own
        if user.store:
            # IMPORTANT: Use Q(user=user) to ensure users see notifications created FOR THEM
            # Also include store notifications for visibility
            queryset = base_queryset.filter(
                Q(tenant=user.tenant) &
                (Q(user=user) | Q(store=user.store))
            )
            return queryset
        
        # Users without store can only see their own notifications
        queryset = base_queryset.filter(
            Q(tenant=user.tenant) & Q(user=user)
        )
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return NotificationCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return NotificationUpdateSerializer
        return NotificationSerializer
    
    def perform_create(self, serializer):
        if not getattr(self.request.user, 'tenant_id', None) or not getattr(self.request.user, 'tenant', None):
            from rest_framework.exceptions import ValidationError
            raise ValidationError('User must have a tenant to create notifications.')
        serializer.save(
            user=self.request.user,
            tenant=self.request.user.tenant
        )
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.mark_as_read()
        return Response({'status': 'success'})
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        queryset = self.get_queryset()
        queryset.filter(status='unread').update(
            status='read',
            read_at=timezone.now()
        )
        return Response({'status': 'success'})
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        queryset = self.get_queryset()
        count = queryset.filter(status='unread').count()
        return Response({'count': count})
    
    @action(detail=False, methods=['get'])
    def test_endpoint(self, request):
        """Test endpoint to debug authentication issues"""
        return Response({
            'message': 'Test endpoint working',
            'user': str(request.user) if request.user.is_authenticated else 'Anonymous',
            'auth_header': request.headers.get('Authorization', 'No auth header'),
            'total_notifications': Notification.objects.count()
        })
    
    @action(detail=False, methods=['post'])
    def subscribe_push(self, request):
        """Subscribe to push notifications"""
        subscription_info = request.data.get('subscription')

        if not subscription_info:
            return Response({'error': 'Subscription info required'}, status=status.HTTP_400_BAD_REQUEST)
        if not getattr(request.user, 'tenant_id', None) or not getattr(request.user, 'tenant', None):
            return Response(
                {'error': 'User must have a tenant to subscribe to push notifications.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate expected keys
        try:
            endpoint = subscription_info['endpoint']
            keys = subscription_info['keys']
            p256dh = keys['p256dh']
            auth = keys['auth']
        except KeyError as e:
            return Response({'error': f'Invalid subscription format: missing {e}'}, status=status.HTTP_400_BAD_REQUEST)

        # Because endpoint is globally unique, always upsert by endpoint and update user/tenant
        try:
            subscription, created = PushSubscription.objects.update_or_create(
                endpoint=endpoint,
                defaults={
                    'user': request.user,
                    'tenant': request.user.tenant,
                    'p256dh': p256dh,
                    'auth': auth,
                },
            )
        except IntegrityError:
            # If another process created the same endpoint concurrently, treat as success
            try:
                subscription = PushSubscription.objects.get(endpoint=endpoint)
            except PushSubscription.DoesNotExist:
                return Response({'error': 'Could not register push subscription'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Minimal log for subscription event
        logger = logging.getLogger('crm')
        logger.info(
            'push.subscribe notifications.subscribe_push user=%s',
            getattr(request.user, 'username', 'anonymous'),
        )
        return Response({'status': 'subscribed'})
    
    @action(detail=False, methods=['post'])
    def unsubscribe_push(self, request):
        """Unsubscribe from push notifications"""
        endpoint = request.data.get('endpoint')
        if not endpoint:
            return Response({'error': 'Endpoint required'}, status=status.HTTP_400_BAD_REQUEST)
        
        PushSubscription.objects.filter(user=request.user, endpoint=endpoint).delete()
        return Response({'status': 'unsubscribed'})
    
    @action(detail=False, methods=['get'])
    def vapid_public_key(self, request):
        """Get VAPID public key for push subscription in browser format: raw 65-byte key, base64url (unpadded).
        PushManager.subscribe(applicationServerKey) requires this format; PEM/SPKI from env is converted here."""
        raw = getattr(settings, 'VAPID_PUBLIC_KEY', None) or ''
        if not raw:
            return Response(
                {'error': 'VAPID public key not configured'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        # Sanitize: strip whitespace/newlines and trailing artifacts (e.g. copy-paste ">")
        public_key = raw.strip().replace('\n', '').replace('\r', '').rstrip('>')
        if not public_key:
            return Response(
                {'error': 'VAPID public key is empty after sanitization'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        # Convert PEM/SPKI to raw 65-byte base64url if needed (browser expects raw key, not SPKI)
        try:
            public_key = _vapid_public_key_to_base64url(public_key)
        except Exception as e:
            return Response(
                {'error': f'VAPID public key conversion failed: {e}'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        return Response({'public_key': public_key})


class NotificationSettingsViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSettingsSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return NotificationSettings.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user,
            tenant=self.request.user.tenant
        )
    
    @action(detail=False, methods=['get'])
    def my_settings(self, request):
        settings, created = NotificationSettings.objects.get_or_create(
            user=request.user,
            defaults={
                'tenant': request.user.tenant,
                'email_enabled': True,
                'push_enabled': True,
                'in_app_enabled': True,
                'email_types': ['appointment_reminder', 'deal_update', 'inventory_alert'],
                'push_types': ['appointment_reminder', 'deal_update', 'inventory_alert'],
                'in_app_types': ['appointment_reminder', 'deal_update', 'inventory_alert'],
                'appointment_reminders': True,
                'deal_updates': True,
                'order_notifications': True,
                'inventory_alerts': True,
                'task_reminders': True,
                'announcements': True,
                'escalations': True,
                'marketing_updates': False,
            }
        )
        serializer = self.get_serializer(settings)
        return Response(serializer.data)


 
 
