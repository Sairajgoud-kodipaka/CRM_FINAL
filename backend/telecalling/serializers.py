from rest_framework import serializers
from .models import (
    CustomerVisit, Assignment, CallLog, FollowUp, 
    CustomerProfile, Notification, Analytics,
    Lead, LeadTransfer, CallRequest, FollowUpRequest, AuditLog, WebhookLog,
    SimpleCallLog
)
from django.contrib.auth import get_user_model

User = get_user_model()

class UserMiniSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'full_name']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

class CustomerVisitSerializer(serializers.ModelSerializer):
    sales_rep_details = UserMiniSerializer(source='sales_rep', read_only=True)
    
    # Add raw Google Sheets data
    raw_sheets_data = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomerVisit
        fields = [
            'id', 'sales_rep', 'sales_rep_details', 'customer_name', 'customer_phone',
            'customer_email', 'interests', 'visit_timestamp', 'notes', 'lead_quality',
            'assigned_to_telecaller', 'raw_sheets_data', 'created_at', 'updated_at'
        ]
        read_only_fields = ['sales_rep', 'created_at', 'updated_at']
    
    def get_raw_sheets_data(self, obj):
        """Get raw Google Sheets data for this customer visit"""
        try:
            # Try to find the corresponding Lead by name and phone
            lead = Lead.objects.filter(
                name=obj.customer_name,
                phone=obj.customer_phone
            ).first()
            
            if lead and lead.raw_data:
                return lead.raw_data
            return None
        except Exception:
            return None

class CallLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = CallLog
        fields = [
            'id', 'assignment', 'call_status', 'call_duration', 'feedback',
            'customer_sentiment', 'revisit_required', 'revisit_notes', 'recording_url',
            'disposition_code', 'call_time', 'created_at', 'updated_at'
        ]
        read_only_fields = ['call_time', 'created_at', 'updated_at']

class AssignmentSerializer(serializers.ModelSerializer):
    telecaller_details = UserMiniSerializer(source='telecaller', read_only=True)
    assigned_by_details = UserMiniSerializer(source='assigned_by', read_only=True)
    customer_visit_details = CustomerVisitSerializer(source='customer_visit', read_only=True)
    call_logs = CallLogSerializer(many=True, read_only=True)
    
    class Meta:
        model = Assignment
        fields = [
            'id', 'telecaller', 'telecaller_details', 'customer_visit', 'customer_visit_details',
            'assigned_by', 'assigned_by_details', 'status', 'priority', 'scheduled_time',
            'notes', 'outcome', 'call_logs', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class FollowUpSerializer(serializers.ModelSerializer):
    created_by_details = UserMiniSerializer(source='created_by', read_only=True)
    
    class Meta:
        model = FollowUp
        fields = [
            'id', 'assignment', 'scheduled_time', 'notes', 'status', 'priority',
            'completed_time', 'created_by', 'created_by_details', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class CustomerProfileSerializer(serializers.ModelSerializer):
    customer_visit_details = CustomerVisitSerializer(source='customer_visit', read_only=True)
    
    class Meta:
        model = CustomerProfile
        fields = [
            'id', 'customer_visit', 'customer_visit_details', 'original_notes',
            'telecaller_feedback', 'engagement_score', 'conversion_likelihood',
            'last_contact_date', 'next_follow_up_date', 'tags', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class NotificationSerializer(serializers.ModelSerializer):
    recipient_details = UserMiniSerializer(source='recipient', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'recipient_details', 'title', 'message', 'notification_type',
            'related_assignment', 'is_read', 'created_at'
        ]
        read_only_fields = ['created_at']

class AnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Analytics
        fields = [
            'id', 'date', 'total_leads', 'assigned_leads', 'connected_calls',
            'conversions', 'avg_call_duration', 'engagement_score_avg', 'conversion_rate',
            'created_at'
        ]
        read_only_fields = ['created_at']

# Bulk assignment serializer
class BulkAssignmentSerializer(serializers.Serializer):
    telecaller_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of telecaller user IDs"
    )
    customer_visit_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of customer visit IDs to assign"
    )
    priority = serializers.ChoiceField(
        choices=[('high', 'High'), ('medium', 'Medium'), ('low', 'Low')],
        default='medium'
    )
    notes = serializers.CharField(required=False, allow_blank=True)

# Assignment statistics serializer
class AssignmentStatsSerializer(serializers.Serializer):
    total_assignments = serializers.IntegerField()
    completed_assignments = serializers.IntegerField()
    pending_assignments = serializers.IntegerField()
    follow_up_assignments = serializers.IntegerField()
    total_calls = serializers.IntegerField()
    conversions = serializers.IntegerField()
    avg_call_duration = serializers.FloatField()
    conversion_rate = serializers.FloatField()
    engagement_score_avg = serializers.FloatField()

# Dashboard data serializer
class DashboardDataSerializer(serializers.Serializer):
    today_leads = serializers.IntegerField()
    pending_assignments = serializers.IntegerField()
    completed_calls = serializers.IntegerField()
    high_potential_leads = serializers.IntegerField()
    unconnected_calls = serializers.IntegerField()
    recent_activities = serializers.ListField()
    performance_metrics = serializers.DictField()


# New serializers according to the directive

class LeadSerializer(serializers.ModelSerializer):
    assigned_to_details = UserMiniSerializer(source='assigned_to', read_only=True)
    masked_phone = serializers.SerializerMethodField()
    masked_email = serializers.SerializerMethodField()
    
    class Meta:
        model = Lead
        fields = [
            'id', 'name', 'phone', 'masked_phone', 'email', 'masked_email',
            'city', 'source', 'status', 'priority', 'source_system', 'source_id',
            'fetched_at', 'assigned_to', 'assigned_to_details', 'assigned_at',
            'last_interaction', 'next_followup', 'call_attempts', 'tags',
            'segments', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'fetched_at']
    
    def get_masked_phone(self, obj):
        if not obj.phone or len(obj.phone) < 4:
            return obj.phone
        return obj.phone[:-4] + "****"
    
    def get_masked_email(self, obj):
        if not obj.email or '@' not in obj.email:
            return obj.email
        local, domain = obj.email.split('@', 1)
        if len(local) <= 2:
            return f"{local[0]}***@{domain}"
        return f"{local[0]}***{local[-1]}@{domain}"


class LeadDetailSerializer(serializers.ModelSerializer):
    """Serializer for lead detail view with unmasked PII"""
    assigned_to_details = UserMiniSerializer(source='assigned_to', read_only=True)
    
    class Meta:
        model = Lead
        fields = [
            'id', 'name', 'phone', 'email', 'city', 'source', 'status', 'priority',
            'source_system', 'source_id', 'fetched_at', 'raw_data', 'assigned_to', 'assigned_to_details',
            'assigned_at', 'last_interaction', 'next_followup', 'call_attempts',
            'tags', 'segments', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'fetched_at']


class CallRequestSerializer(serializers.ModelSerializer):
    lead_details = LeadSerializer(source='lead', read_only=True)
    telecaller_details = UserMiniSerializer(source='telecaller', read_only=True)
    
    class Meta:
        model = CallRequest
        fields = [
            'id', 'lead', 'lead_details', 'telecaller', 'telecaller_details',
            'call_type', 'exotel_call_sid', 'exotel_bridge_url', 'status',
            'duration', 'recording_url', 'disposition_code', 'notes', 'sentiment',
            'follow_up_required', 'initiated_at', 'started_at', 'ended_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'initiated_at']


class CallInitiationSerializer(serializers.Serializer):
    lead_id = serializers.UUIDField()
    call_type = serializers.ChoiceField(choices=['outbound', 'callback'], default='outbound')


class CallInitiationResponseSerializer(serializers.Serializer):
    call_request_id = serializers.UUIDField()
    status = serializers.ChoiceField(choices=['initiated', 'failed'])
    error_message = serializers.CharField(required=False, allow_blank=True)
    exotel_bridge_url = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class FollowUpRequestSerializer(serializers.ModelSerializer):
    lead_details = LeadSerializer(source='lead', read_only=True)
    telecaller_details = UserMiniSerializer(source='telecaller', read_only=True)
    
    class Meta:
        model = FollowUpRequest
        fields = [
            'id', 'lead', 'lead_details', 'telecaller', 'telecaller_details',
            'due_at', 'priority', 'notes', 'reminder_enabled', 'status',
            'completed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class FollowUpCreateSerializer(serializers.Serializer):
    lead_id = serializers.UUIDField()
    due_at = serializers.DateTimeField()
    priority = serializers.ChoiceField(choices=['high', 'medium', 'low'], default='medium')
    notes = serializers.CharField(required=False, allow_blank=True)
    reminder_enabled = serializers.BooleanField(default=True)


class TelecallerDashboardSerializer(serializers.Serializer):
    calls_today = serializers.IntegerField()
    connected_rate = serializers.FloatField()
    appointments_set = serializers.IntegerField()
    follow_ups_due = serializers.IntegerField()
    assigned_leads = serializers.IntegerField()
    overdue_calls = serializers.IntegerField()
    performance_trend = serializers.ChoiceField(choices=['up', 'down', 'stable'])


class LeadListSerializer(serializers.Serializer):
    leads = LeadSerializer(many=True)
    total_count = serializers.IntegerField()
    filters_applied = serializers.DictField()
    pagination = serializers.DictField()


class CallLogSerializer(serializers.ModelSerializer):
    lead_name = serializers.CharField(source='lead.name', read_only=True)
    masked_phone = serializers.SerializerMethodField()
    
    class Meta:
        model = CallRequest
        fields = [
            'id', 'lead', 'lead_name', 'masked_phone', 'initiated_at',
            'duration', 'status', 'recording_url', 'notes', 'sentiment',
            'follow_up_required'
        ]
        read_only_fields = ['id', 'initiated_at']
    
    def get_masked_phone(self, obj):
        if not obj.lead.phone or len(obj.lead.phone) < 4:
            return obj.lead.phone
        return obj.lead.phone[:-4] + "****"


class CallStatsSerializer(serializers.Serializer):
    total_calls = serializers.IntegerField()
    connected_calls = serializers.IntegerField()
    avg_duration = serializers.FloatField()
    conversion_rate = serializers.FloatField()


class CallStatusSerializer(serializers.Serializer):
    status = serializers.CharField()
    duration_seconds = serializers.IntegerField(required=False)
    recording_url = serializers.URLField(required=False)
    disposition = serializers.CharField(required=False)
    exotel_call_id = serializers.CharField(required=False)
    bridge_url = serializers.URLField(required=False)


class AppointmentSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    lead_name = serializers.CharField()
    masked_phone = serializers.CharField()
    appointment_time = serializers.DateTimeField()
    status = serializers.CharField()
    notes = serializers.CharField()


class AppointmentStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    upcoming = serializers.IntegerField()
    completed = serializers.IntegerField()
    cancelled = serializers.IntegerField()
    no_shows = serializers.IntegerField()


class AssignmentQueueSerializer(serializers.Serializer):
    unassigned = LeadSerializer(many=True)
    assigned = serializers.ListField()
    priority_segments = serializers.ListField()
    workload_balance = serializers.ListField()


class AutoAssignmentSerializer(serializers.Serializer):
    policy = serializers.ChoiceField(choices=['round_robin', 'workload_balance', 'segment_priority'])
    segment_filters = serializers.ListField(required=False)
    max_per_telecaller = serializers.IntegerField(required=False)


class PerformanceAnalyticsSerializer(serializers.Serializer):
    calls_made = serializers.IntegerField()
    connected_rate = serializers.FloatField()
    avg_duration = serializers.FloatField()
    appointments_set = serializers.IntegerField()
    follow_up_completion_rate = serializers.FloatField()
    conversion_rate = serializers.FloatField()
    daily_breakdown = serializers.ListField()


class AuditLogSerializer(serializers.ModelSerializer):
    actor_details = UserMiniSerializer(source='actor', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'actor', 'actor_details', 'action', 'target_type', 'target_id',
            'metadata', 'ip_address', 'user_agent', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class LeadTransferSerializer(serializers.ModelSerializer):
    """Serializer for lead transfer functionality"""
    from_user_details = UserMiniSerializer(source='from_user', read_only=True)
    to_user_details = UserMiniSerializer(source='to_user', read_only=True)
    lead_details = LeadSerializer(source='lead', read_only=True)
    
    class Meta:
        model = LeadTransfer
        fields = [
            'id', 'lead', 'lead_details', 'from_user', 'from_user_details',
            'to_user', 'to_user_details', 'transfer_reason', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LeadTransferCreateSerializer(serializers.Serializer):
    """Serializer for creating lead transfers"""
    lead_id = serializers.UUIDField()
    to_user_id = serializers.IntegerField()
    transfer_reason = serializers.CharField(required=False, allow_blank=True)
    
    def validate_lead_id(self, value):
        """Validate that the lead exists and belongs to the current user's tenant"""
        try:
            lead = Lead.objects.get(id=value)
            return value
        except Lead.DoesNotExist:
            raise serializers.ValidationError("Lead not found")
    
    def validate_to_user_id(self, value):
        """Validate that the target user is a sales person in the same tenant"""
        try:
            user = User.objects.get(id=value)
            if user.role != User.Role.INHOUSE_SALES:
                raise serializers.ValidationError("Target user must be a sales person")
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("Target user not found")


class WebhookLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookLog
        fields = [
            'id', 'webhook_type', 'payload', 'status', 'error_message',
            'processed_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class SimpleCallLogSerializer(serializers.ModelSerializer):
    telecaller_details = UserMiniSerializer(source='telecaller', read_only=True)
    
    class Meta:
        model = SimpleCallLog
        fields = [
            'id', 'telecaller', 'telecaller_details', 'customer_name', 'customer_phone',
            'call_status', 'call_duration', 'customer_sentiment', 'notes',
            'call_time', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'telecaller', 'call_time', 'created_at', 'updated_at'] 