from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Count, Avg, F
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Lead, CallRequest, FollowUpRequest, AuditLog
from .serializers import (
    LeadSerializer, LeadDetailSerializer, CallRequestSerializer, 
    FollowUpRequestSerializer, TelecallerDashboardSerializer,
    PerformanceAnalyticsSerializer, AuditLogSerializer
)
from django.contrib.auth import get_user_model

User = get_user_model()

class LeadPagination(PageNumberPagination):
    """Custom pagination for leads"""
    page_size = 15
    page_size_query_param = 'limit'
    max_page_size = 100

class LeadViewSet(viewsets.ModelViewSet):
    """Lead management for telecalling system"""
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = LeadPagination

    def get_queryset(self):
        user = self.request.user
        if user.role == 'tele_calling':
            # Telecallers see only assigned leads
            return Lead.objects.filter(assigned_to=user)
        elif user.role in ['manager', 'admin']:
            # Managers and admins see all leads
            return Lead.objects.all()
        return Lead.objects.none()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return LeadDetailSerializer
        return LeadSerializer

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update lead status"""
        lead = self.get_object()
        serializer = self.get_serializer(lead, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def assigned_to_me(self, request):
        """Get leads assigned to current user"""
        if request.user.role != 'tele_calling':
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        leads = Lead.objects.filter(assigned_to=request.user)
        serializer = self.get_serializer(leads, many=True)
        return Response(serializer.data)

class CallRequestViewSet(viewsets.ModelViewSet):
    """Call request management"""
    queryset = CallRequest.objects.all()
    serializer_class = CallRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = LeadPagination

    def get_queryset(self):
        user = self.request.user
        if user.role == 'tele_calling':
            return CallRequest.objects.filter(telecaller=user)
        elif user.role in ['manager', 'admin']:
            return CallRequest.objects.all()
        return CallRequest.objects.none()

    @action(detail=False, methods=['get'])
    def logs(self, request):
        """Get call logs with filters"""
        queryset = self.get_queryset()
        
        # Apply filters
        disposition = request.query_params.get('disposition')
        if disposition:
            queryset = queryset.filter(disposition=disposition)
        
        date_from = request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(initiated_at__date__gte=date_from)
        
        date_to = request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(initiated_at__date__lte=date_to)
        
        duration_min = request.query_params.get('duration_min')
        if duration_min:
            queryset = queryset.filter(duration__gte=int(duration_min))
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get call statistics"""
        queryset = self.get_queryset()
        
        total_calls = queryset.count()
        connected_calls = queryset.filter(status='completed').count()
        avg_duration = queryset.filter(status='completed').aggregate(
            avg_duration=Avg('duration')
        )['avg_duration'] or 0
        
        conversion_rate = (connected_calls / total_calls * 100) if total_calls > 0 else 0
        
        return Response({
            'total_calls': total_calls,
            'connected_calls': connected_calls,
            'avg_duration': round(avg_duration, 2),
            'conversion_rate': round(conversion_rate, 2)
        })

class FollowUpRequestViewSet(viewsets.ModelViewSet):
    """Follow-up request management"""
    queryset = FollowUpRequest.objects.all()
    serializer_class = FollowUpRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = LeadPagination

    def get_queryset(self):
        user = self.request.user
        if user.role == 'tele_calling':
            return FollowUpRequest.objects.filter(telecaller=user)
        elif user.role in ['manager', 'admin']:
            return FollowUpRequest.objects.all()
        return FollowUpRequest.objects.none()

    @action(detail=False, methods=['post'])
    def create_followup(self, request):
        """Create a new follow-up request"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save(telecaller=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def due_today(self, request):
        """Get follow-ups due today"""
        today = timezone.now().date()
        followups = self.get_queryset().filter(
            due_at__date=today,
            status='pending'
        )
        serializer = self.get_serializer(followups, many=True)
        return Response(serializer.data)

class TelecallerDashboardView(APIView):
    """Telecaller dashboard data"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'tele_calling':
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        user = request.user
        today = timezone.now().date()
        
        # Calculate metrics
        calls_today = CallRequest.objects.filter(
            telecaller=user,
            initiated_at__date=today
        ).count()
        
        connected_calls = CallRequest.objects.filter(
            telecaller=user,
            initiated_at__date=today,
            status='completed'
        ).count()
        
        connected_rate = (connected_calls / calls_today * 100) if calls_today > 0 else 0
        
        appointments_set = CallRequest.objects.filter(
            telecaller=user,
            initiated_at__date=today,
            sentiment='positive'
        ).count()
        
        follow_ups_due = FollowUpRequest.objects.filter(
            telecaller=user,
            due_at__date=today,
            status='pending'
        ).count()
        
        assigned_leads = Lead.objects.filter(assigned_to=user).count()
        
        overdue_calls = FollowUpRequest.objects.filter(
            telecaller=user,
            due_at__lt=timezone.now(),
            status='pending'
        ).count()
        
        # Calculate performance trend (simplified)
        yesterday = today - timedelta(days=1)
        calls_yesterday = CallRequest.objects.filter(
            telecaller=user,
            initiated_at__date=yesterday
        ).count()
        
        performance_trend = 'stable'
        if calls_today > calls_yesterday:
            performance_trend = 'up'
        elif calls_today < calls_yesterday:
            performance_trend = 'down'
        
        dashboard_data = {
            'calls_today': calls_today,
            'connected_rate': connected_rate,
            'appointments_set': appointments_set,
            'follow_ups_due': follow_ups_due,
            'assigned_leads': assigned_leads,
            'overdue_calls': overdue_calls,
            'performance_trend': performance_trend
        }
        
        serializer = TelecallerDashboardSerializer(dashboard_data)
        return Response(serializer.data)

class ExotelWebhookView(APIView):
    """Exotel webhook handler"""
    permission_classes = []  # No authentication for webhooks
    
    def post(self, request):
        # This will be handled by the webhook_views.py file
        from .webhook_views import exotel_webhook
        return exotel_webhook(request)

class PerformanceAnalyticsView(APIView):
    """Performance analytics for telecallers"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        telecaller_id = request.query_params.get('telecaller_id', 'me')
        range_days = int(request.query_params.get('range', 7))
        
        if telecaller_id == 'me':
            if request.user.role != 'tele_calling':
                return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            user = request.user
        else:
            if request.user.role not in ['manager', 'admin']:
                return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            try:
                user = User.objects.get(id=telecaller_id)
            except User.DoesNotExist:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=range_days)
        
        # Calculate analytics
        calls_made = CallRequest.objects.filter(
            telecaller=user,
            initiated_at__date__range=[start_date, end_date]
        ).count()
        
        connected_calls = CallRequest.objects.filter(
            telecaller=user,
            initiated_at__date__range=[start_date, end_date],
            status='completed'
        ).count()
        
        connected_rate = (connected_calls / calls_made * 100) if calls_made > 0 else 0
        
        avg_duration = CallRequest.objects.filter(
            telecaller=user,
            initiated_at__date__range=[start_date, end_date],
            status='completed'
        ).aggregate(avg_duration=Avg('duration'))['avg_duration'] or 0
        
        appointments_set = CallRequest.objects.filter(
            telecaller=user,
            initiated_at__date__range=[start_date, end_date],
            sentiment='positive'
        ).count()
        
        follow_up_completed = FollowUpRequest.objects.filter(
            telecaller=user,
            due_at__date__range=[start_date, end_date],
            status='completed'
        ).count()
        
        follow_up_total = FollowUpRequest.objects.filter(
            telecaller=user,
            due_at__date__range=[start_date, end_date]
        ).count()
        
        follow_up_completion_rate = (follow_up_completed / follow_up_total * 100) if follow_up_total > 0 else 0
        
        conversion_rate = (appointments_set / calls_made * 100) if calls_made > 0 else 0
        
        # Daily breakdown
        daily_breakdown = []
        for i in range(range_days):
            date = start_date + timedelta(days=i)
            daily_calls = CallRequest.objects.filter(
                telecaller=user,
                initiated_at__date=date
            ).count()
            daily_connected = CallRequest.objects.filter(
                telecaller=user,
                initiated_at__date=date,
                status='completed'
            ).count()
            
            daily_breakdown.append({
                'date': date.isoformat(),
                'calls': daily_calls,
                'connected': daily_connected
            })
        
        analytics_data = {
            'calls_made': calls_made,
            'connected_rate': connected_rate,
            'avg_duration': avg_duration,
            'appointments_set': appointments_set,
            'follow_up_completion_rate': follow_up_completion_rate,
            'conversion_rate': conversion_rate,
            'daily_breakdown': daily_breakdown
        }
        
        serializer = PerformanceAnalyticsSerializer(analytics_data)
        return Response(serializer.data)

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Audit log viewing"""
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'tele_calling':
            # Telecallers see only their own audit logs
            return AuditLog.objects.filter(actor=user)
        elif user.role in ['manager', 'admin']:
            # Managers and admins see all audit logs
            return AuditLog.objects.all()
        return AuditLog.objects.none()