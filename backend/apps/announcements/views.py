from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import Announcement, AnnouncementRead, TeamMessage, MessageRead
from .serializers import (
    AnnouncementSerializer, AnnouncementCreateSerializer, AnnouncementUpdateSerializer,
    TeamMessageSerializer, TeamMessageCreateSerializer, TeamMessageUpdateSerializer,
    AnnouncementReadCreateSerializer, MessageReadCreateSerializer,
    UserSerializer
)

User = get_user_model()


class AnnouncementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing announcements.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['announcement_type', 'priority', 'is_pinned', 'is_active', 'author']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'updated_at', 'priority', 'is_pinned']
    ordering = ['-is_pinned', '-priority', '-created_at']

    def get_queryset(self):
        """Filter announcements based on user's access level and targeting."""
        user = self.request.user
        
        print(f"🔍 DEBUG: get_queryset called for user {user.username} (role: {user.role}, store: {user.store})")
        
        # Base queryset - show all active announcements for the user's tenant
        queryset = Announcement.objects.filter(is_active=True)
        print(f"🔍 DEBUG: Base queryset count: {queryset.count()}")
        
        # Filter by tenant
        if user.tenant:
            queryset = queryset.filter(tenant=user.tenant)
            print(f"🔍 DEBUG: After tenant filter count: {queryset.count()}")
        
        # Filter by store - show announcements for user's store or store-specific announcements
        if user.store:
            # Show announcements that are either:
            # 1. System-wide announcements (no target_stores)
            # 2. Store-specific announcements targeting this user's store
            # 3. Team-specific announcements created by users from the same store
            queryset = queryset.filter(
                Q(target_stores__isnull=True) |  # System-wide
                Q(target_stores=user.store) |    # Store-specific
                Q(author__store=user.store)      # Created by same store members
            ).distinct()
            print(f"🔍 DEBUG: After store filter count: {queryset.count()}")
        else:
            # If user has no store, show all announcements for the tenant
            print(f"🔍 DEBUG: User has no store, showing all tenant announcements")
            pass
        
        # Filter by publish date and expiration
        now = timezone.now()
        queryset = queryset.filter(
            Q(publish_at__lte=now) &
            (Q(expires_at__isnull=True) | Q(expires_at__gt=now))
        )
        print(f"🔍 DEBUG: After date filter count: {queryset.count()}")
        
        # Debug: Show what announcements are being returned
        for ann in queryset[:3]:  # Show first 3
            print(f"🔍 DEBUG: Announcement: {ann.title} (type: {ann.announcement_type}, store: {ann.author.store if ann.author.store else 'None'})")
        
        return queryset.distinct()

    def get_serializer_class(self):
        if self.action == 'create':
            return AnnouncementCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return AnnouncementUpdateSerializer
        return AnnouncementSerializer

    def perform_create(self, serializer):
        print(f"🔍 DEBUG: perform_create called")
        # Automatically set the user's store as target for team-specific announcements
        announcement = serializer.save(author=self.request.user, tenant=self.request.user.tenant)
        print(f"🔍 DEBUG: Announcement created with ID: {announcement.id}")
        
        # If it's a team-specific announcement and user has a store, add the store as target
        if (announcement.announcement_type == 'team_specific' and 
            self.request.user.store and 
            not announcement.target_stores.exists()):
            announcement.target_stores.add(self.request.user.store)
            print(f"🔍 DEBUG: Added store {self.request.user.store} to target_stores")
        
        return announcement

    def list(self, request, *args, **kwargs):
        """Custom list method with debugging."""
        print(f"🔍 DEBUG: list method called")
        queryset = self.filter_queryset(self.get_queryset())
        print(f"🔍 DEBUG: Filtered queryset count: {queryset.count()}")
        
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        print(f"🔍 DEBUG: Serialized data count: {len(data)}")
        print(f"🔍 DEBUG: First announcement data: {data[0] if data else 'No data'}")
        
        return Response(data)

    def create(self, request, *args, **kwargs):
        """Custom create method with debugging."""
        print(f"🔍 DEBUG: create method called")
        print(f"🔍 DEBUG: Request data: {request.data}")
        
        serializer = self.get_serializer(data=request.data)
        print(f"🔍 DEBUG: Serializer valid: {serializer.is_valid()}")
        if not serializer.is_valid():
            print(f"🔍 DEBUG: Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        announcement = self.perform_create(serializer)
        print(f"🔍 DEBUG: Announcement created: {announcement.id}")
        
        # Return the created announcement using the full serializer
        full_serializer = AnnouncementSerializer(announcement, context={'request': request})
        return Response(full_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark an announcement as read by the current user."""
        announcement = self.get_object()
        user = request.user
        
        # Check if already read
        read_record, created = AnnouncementRead.objects.get_or_create(
            announcement=announcement,
            user=user,
            defaults={'acknowledged': False}
        )
        
        if not created:
            # Update read timestamp
            read_record.save()
        
        return Response({'status': 'marked as read'})

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """Acknowledge an announcement."""
        announcement = self.get_object()
        user = request.user
        
        if not announcement.requires_acknowledgment:
            return Response(
                {'error': 'This announcement does not require acknowledgment'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        read_record, created = AnnouncementRead.objects.get_or_create(
            announcement=announcement,
            user=user
        )
        
        read_record.acknowledged = True
        read_record.save()
        
        return Response({'status': 'acknowledged'})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread announcements for current user."""
        user = request.user
        read_announcements = AnnouncementRead.objects.filter(user=user).values_list('announcement_id', flat=True)
        
        unread_count = self.get_queryset().exclude(id__in=read_announcements).count()
        
        return Response({'unread_count': unread_count})

    @action(detail=False, methods=['get'])
    def pinned(self, request):
        """Get pinned announcements."""
        pinned_announcements = self.get_queryset().filter(is_pinned=True)
        serializer = self.get_serializer(pinned_announcements, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def urgent(self, request):
        """Get urgent announcements."""
        urgent_announcements = self.get_queryset().filter(priority='urgent')
        serializer = self.get_serializer(urgent_announcements, many=True)
        return Response(serializer.data)


class TeamMessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing team messages.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['message_type', 'is_urgent', 'requires_response', 'sender']
    search_fields = ['subject', 'content']
    ordering_fields = ['created_at', 'updated_at', 'is_urgent']
    ordering = ['-is_urgent', '-created_at']

    def get_queryset(self):
        """Filter messages based on user's access."""
        user = self.request.user
        
        # Base queryset - messages sent by user or where user is recipient
        queryset = TeamMessage.objects.filter(
            Q(sender=user) | Q(recipients=user)
        )
        
        # Filter by tenant
        if user.tenant:
            queryset = queryset.filter(tenant=user.tenant)
        
        # Filter by store - show messages from user's store
        if user.store:
            queryset = queryset.filter(store=user.store)
        
        return queryset.distinct()

    def get_serializer_class(self):
        if self.action == 'create':
            return TeamMessageCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return TeamMessageUpdateSerializer
        return TeamMessageSerializer

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user, store=self.request.user.store, tenant=self.request.user.tenant)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark a message as read by the current user."""
        message = self.get_object()
        user = request.user
        
        # Check if user is a recipient
        if user not in message.recipients.all():
            return Response(
                {'error': 'You are not a recipient of this message'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        read_record, created = MessageRead.objects.get_or_create(
            message=message,
            user=user,
            defaults={'responded': False}
        )
        
        if not created:
            # Update read timestamp
            read_record.save()
        
        return Response({'status': 'marked as read'})

    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        """Mark a message as responded to."""
        message = self.get_object()
        user = request.user
        
        if not message.requires_response:
            return Response(
                {'error': 'This message does not require a response'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        read_record, created = MessageRead.objects.get_or_create(
            message=message,
            user=user
        )
        
        read_record.responded = True
        read_record.save()
        
        return Response({'status': 'responded'})

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        """Create a reply to a message."""
        parent_message = self.get_object()
        user = request.user
        
        # Check if user can reply (sender or recipient)
        if user != parent_message.sender and user not in parent_message.recipients.all():
            return Response(
                {'error': 'You cannot reply to this message'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create reply
        reply_data = request.data.copy()
        reply_data['parent_message'] = parent_message.id
        reply_data['recipients'] = [parent_message.sender.id] + list(parent_message.recipients.values_list('id', flat=True))
        
        serializer = TeamMessageCreateSerializer(data=reply_data, context={'request': request})
        if serializer.is_valid():
            reply = serializer.save()
            return Response(TeamMessageSerializer(reply, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread messages for current user."""
        user = request.user
        read_messages = MessageRead.objects.filter(user=user).values_list('message_id', flat=True)
        
        unread_count = self.get_queryset().filter(recipients=user).exclude(id__in=read_messages).count()
        
        return Response({'unread_count': unread_count})

    @action(detail=False, methods=['get'])
    def urgent(self, request):
        """Get urgent messages."""
        urgent_messages = self.get_queryset().filter(is_urgent=True)
        serializer = self.get_serializer(urgent_messages, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def threads(self, request):
        """Get message threads (parent messages with replies)."""
        threads = self.get_queryset().filter(parent_message__isnull=True).annotate(
            reply_count=Count('replies')
        ).order_by('-reply_count', '-created_at')
        
        serializer = self.get_serializer(threads, many=True)
        return Response(serializer.data)


class AnnouncementReadViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing announcement read tracking.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = AnnouncementReadCreateSerializer

    def get_queryset(self):
        return AnnouncementRead.objects.filter(user=self.request.user)


class MessageReadViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing message read tracking.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = MessageReadCreateSerializer

    def get_queryset(self):
        return MessageRead.objects.filter(user=self.request.user) 