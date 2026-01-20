from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from django.db.models import Q
from django.conf import settings
from apps.users.middleware import ScopedVisibilityMiddleware
from .models import Notification, NotificationSettings, PushSubscription
from .serializers import (
    NotificationSerializer, NotificationSettingsSerializer,
    NotificationCreateSerializer, NotificationUpdateSerializer
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
            print(f"🔔 Notification query for business_admin {user.username}: {queryset.count()} notifications")
            return queryset
        
        # Store users (managers, inhouse_sales, etc.) can see their store's notifications and their own
        if user.store:
            # IMPORTANT: Use Q(user=user) to ensure users see notifications created FOR THEM
            # Also include store notifications for visibility
            queryset = base_queryset.filter(
                Q(tenant=user.tenant) &
                (Q(user=user) | Q(store=user.store))
            )
            print(f"🔔 Notification query for {user.role} {user.username} (store: {user.store.id}): {queryset.count()} notifications")
            print(f"   Query: tenant={user.tenant.id}, (user={user.id} OR store={user.store.id})")
            print(f"   Date range: last {days_back} days (from {date_start})")
            # Debug: show what notifications match
            matching_notifications = list(queryset.values('id', 'type', 'user__id', 'user__username', 'user__role', 'store__id', 'store__name', 'created_at')[:10])
            if matching_notifications:
                print(f"   Matching notifications (first 10): {matching_notifications}")
                # Show breakdown by user
                for notif in matching_notifications:
                    print(f"      - Notification {notif['id']}: user={notif['user__id']} ({notif['user__username']}, {notif['user__role']}), store={notif['store__id']}")
            else:
                print(f"   ⚠️  No matching notifications found!")
                # Debug: check if any notifications exist for this user at all
                all_user_notifications = Notification.objects.filter(user=user, tenant=user.tenant).count()
                all_store_notifications = Notification.objects.filter(store=user.store, tenant=user.tenant).count()
                print(f"   Debug: Total notifications for user {user.id}: {all_user_notifications}")
                print(f"   Debug: Total notifications for store {user.store.id}: {all_store_notifications}")
            return queryset
        
        # Users without store can only see their own notifications
        queryset = base_queryset.filter(
            Q(tenant=user.tenant) & Q(user=user)
        )
        print(f"🔔 Notification query for {user.role} {user.username} (no store): {queryset.count()} notifications")
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return NotificationCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return NotificationUpdateSerializer
        return NotificationSerializer
    
    def perform_create(self, serializer):
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
        
        try:
            # Use update_or_create to handle duplicates
            subscription, created = PushSubscription.objects.update_or_create(
                user=request.user,
                endpoint=subscription_info['endpoint'],
                defaults={
                    'tenant': request.user.tenant,
                    'p256dh': subscription_info['keys']['p256dh'],
                    'auth': subscription_info['keys']['auth']
                }
            )
            
            # Clean up any other duplicate subscriptions for this user with same endpoint
            # (shouldn't happen, but just in case)
            PushSubscription.objects.filter(
                user=request.user,
                endpoint=subscription_info['endpoint']
            ).exclude(id=subscription.id).delete()
            
            return Response({'status': 'subscribed'})
        except KeyError as e:
            return Response({'error': f'Invalid subscription format: {e}'}, status=status.HTTP_400_BAD_REQUEST)
    
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
        """Get VAPID public key for push subscription"""
        public_key = getattr(settings, 'VAPID_PUBLIC_KEY', None)
        
        if not public_key:
            return Response(
                {'error': 'VAPID public key not configured'},
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


 