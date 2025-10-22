from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid

class CustomerVisit(models.Model):
    """Step 1: In-House Sales Rep records customer visit info"""
    sales_rep = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='customer_visits')
    customer_name = models.CharField(max_length=255)
    customer_phone = models.CharField(max_length=20)
    customer_email = models.EmailField(blank=True, null=True)
    interests = models.JSONField(default=list, help_text="List of product interests")
    visit_timestamp = models.DateTimeField(default=timezone.now)
    notes = models.TextField(blank=True)
    lead_quality = models.CharField(max_length=20, choices=[
        ('hot', 'Hot Lead'),
        ('warm', 'Warm Lead'),
        ('cold', 'Cold Lead'),
    ], default='warm')
    assigned_to_telecaller = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Visit by {self.customer_name} - {self.visit_timestamp.strftime('%Y-%m-%d %H:%M')}"

class Assignment(models.Model):
    """Step 2: Manager assigns leads to telecallers"""
    telecaller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='telecalling_assignments')
    customer_visit = models.ForeignKey(CustomerVisit, on_delete=models.CASCADE, related_name='assignments')
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='assigned_assignments')
    status = models.CharField(max_length=50, choices=[
        ('new_uncontacted', 'New / Uncontacted'),
        ('attempted_contact', 'Attempted Contact'),
        ('missed_call_outbound', 'Missed Call (Outbound)'),
        ('missed_call_inbound', 'Missed Call (Inbound)'),
        ('contacted_in_progress', 'Contacted / In Progress'),
        ('follow_up_scheduled', 'Follow-up Scheduled'),
        ('interested_warm', 'Interested / Warm'),
        ('qualified', 'Qualified'),
        ('not_interested', 'Not Interested'),
        ('converted_closed_won', 'Converted / Closed Won'),
        ('lost_closed_lost', 'Lost / Closed Lost'),
    ], default='new_uncontacted')
    priority = models.CharField(max_length=20, choices=[
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ], default='medium')
    scheduled_time = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    outcome = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Assignment {self.id} - {self.customer_visit.customer_name} to {self.telecaller.get_full_name()}"

class CallLog(models.Model):
    """Step 3: Telecaller logs call details and feedback"""
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='call_logs', null=True, blank=True)
    call_status = models.CharField(max_length=32, choices=[
        ('connected', 'Connected'),
        ('no_answer', 'No Answer'),
        ('busy', 'Busy'),
        ('wrong_number', 'Wrong Number'),
        ('not_interested', 'Not Interested'),
        ('call_back', 'Call Back Later'),
    ])
    call_duration = models.IntegerField(help_text="Duration in seconds", default=0)
    feedback = models.TextField(blank=True)
    customer_sentiment = models.CharField(max_length=20, choices=[
        ('positive', 'Positive'),
        ('neutral', 'Neutral'),
        ('negative', 'Negative'),
    ], default='neutral')
    revisit_required = models.BooleanField(default=False)
    revisit_notes = models.TextField(blank=True)
    recording_url = models.URLField(blank=True, null=True)
    disposition_code = models.CharField(max_length=64, blank=True, null=True)
    call_time = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"CallLog {self.id} for Assignment {self.assignment_id}"

class SimpleCallLog(models.Model):
    """Simple call log for manual call tracking without assignments"""
    telecaller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='simple_call_logs')
    customer_name = models.CharField(max_length=255)
    customer_phone = models.CharField(max_length=20)
    call_status = models.CharField(max_length=32, choices=[
        ('connected', 'Connected'),
        ('no_answer', 'No Answer'),
        ('busy', 'Busy'),
        ('wrong_number', 'Wrong Number'),
        ('not_interested', 'Not Interested'),
        ('call_back', 'Call Back Later'),
    ])
    call_duration = models.IntegerField(help_text="Duration in seconds", default=0)
    customer_sentiment = models.CharField(max_length=20, choices=[
        ('positive', 'Positive'),
        ('neutral', 'Neutral'),
        ('negative', 'Negative'),
    ], default='neutral')
    notes = models.TextField(blank=True)
    call_time = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-call_time']

    def __str__(self):
        return f"SimpleCallLog {self.id} - {self.customer_name} by {self.telecaller.get_full_name()}"

class FollowUp(models.Model):
    """Step 4: Manager monitors and creates follow-ups"""
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='followups')
    scheduled_time = models.DateTimeField()
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=32, choices=[
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ], default='pending')
    priority = models.CharField(max_length=20, choices=[
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ], default='medium')
    completed_time = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_followups')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"FollowUp {self.id} for Assignment {self.assignment_id}"

class CustomerProfile(models.Model):
    """Step 5: Enhanced customer profile with sales rep notes + telecaller feedback"""
    customer_visit = models.OneToOneField(CustomerVisit, on_delete=models.CASCADE, related_name='profile')
    original_notes = models.TextField(blank=True)
    telecaller_feedback = models.TextField(blank=True)
    engagement_score = models.IntegerField(default=0, help_text="0-100 score based on interactions")
    conversion_likelihood = models.CharField(max_length=20, choices=[
        ('very_high', 'Very High'),
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
        ('very_low', 'Very Low'),
    ], default='medium')
    last_contact_date = models.DateTimeField(null=True, blank=True)
    next_follow_up_date = models.DateTimeField(null=True, blank=True)
    tags = models.JSONField(default=list, help_text="Customer tags for segmentation")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile for {self.customer_visit.customer_name}"

class Notification(models.Model):
    """Notification system for assignments and feedback alerts"""
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=32, choices=[
        ('assignment', 'New Assignment'),
        ('feedback', 'Feedback Received'),
        ('follow_up', 'Follow-up Reminder'),
        ('high_potential', 'High Potential Lead'),
        ('system', 'System Notification'),
    ])
    related_assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.recipient.get_full_name()} - {self.title}"

class Analytics(models.Model):
    """Analytics tracking for conversion rates and performance metrics"""
    date = models.DateField()
    total_leads = models.IntegerField(default=0)
    assigned_leads = models.IntegerField(default=0)
    connected_calls = models.IntegerField(default=0)
    conversions = models.IntegerField(default=0)
    avg_call_duration = models.FloatField(default=0)
    engagement_score_avg = models.FloatField(default=0)
    conversion_rate = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['date']

    def __str__(self):
        return f"Analytics for {self.date}"


# New Telecalling Models for Google Sheets Integration and Exotel
class Lead(models.Model):
    """Lead model for Google Sheets integration"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True)
    source = models.CharField(max_length=50, choices=[
        ('exhibition', 'Exhibition'),
        ('social_media', 'Social Media'),
        ('referral', 'Referral'),
        ('website', 'Website'),
        ('walk_in', 'Walk In'),
    ], default='website')
    status = models.CharField(max_length=50, choices=[
        ('new', 'New'),
        ('contacted', 'Contacted'),
        ('qualified', 'Qualified'),
        ('appointment_set', 'Appointment Set'),
        ('not_interested', 'Not Interested'),
        ('converted', 'Converted'),
    ], default='new')
    priority = models.CharField(max_length=20, choices=[
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ], default='medium')
    
    # Google Sheets integration fields
    source_system = models.CharField(max_length=50, default='google_sheets')
    source_id = models.CharField(max_length=100, unique=True)
    fetched_at = models.DateTimeField(default=timezone.now)
    raw_data = models.JSONField(default=dict, blank=True)
    
    # Assignment fields
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_leads')
    assigned_at = models.DateTimeField(null=True, blank=True)
    last_interaction = models.DateTimeField(null=True, blank=True)
    next_followup = models.DateTimeField(null=True, blank=True)
    call_attempts = models.IntegerField(default=0)
    
    # Additional fields
    tags = models.JSONField(default=list, blank=True)
    segments = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.phone})"


class LeadTransfer(models.Model):
    """Model to track lead transfers from telecallers to sales personnel"""
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='transfers')
    from_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transfers_sent')
    to_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transfers_received')
    transfer_reason = models.TextField(blank=True, help_text="Reason for transfer")
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Lead Transfer'
        verbose_name_plural = 'Lead Transfers'
    
    def __str__(self):
        return f"Transfer {self.lead.name} from {self.from_user.get_full_name()} to {self.to_user.get_full_name()}"


class LeadStatusHistory(models.Model):
    """Track status changes and notes for leads"""
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField(max_length=50, choices=[
        ('new_uncontacted', 'New / Uncontacted'),
        ('attempted_contact', 'Attempted Contact'),
        ('missed_call_outbound', 'Missed Call (Outbound)'),
        ('missed_call_inbound', 'Missed Call (Inbound)'),
        ('contacted_in_progress', 'Contacted / In Progress'),
        ('follow_up_scheduled', 'Follow-up Scheduled'),
        ('interested_warm', 'Interested / Warm'),
        ('qualified', 'Qualified'),
        ('not_interested', 'Not Interested'),
        ('converted_closed_won', 'Converted / Closed Won'),
        ('lost_closed_lost', 'Lost / Closed Lost'),
    ])
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='status_changes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Additional metadata
    call_duration = models.IntegerField(null=True, blank=True, help_text="Call duration in seconds")
    call_outcome = models.CharField(max_length=100, blank=True, null=True)
    next_action = models.TextField(blank=True, null=True)
    next_action_date = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Lead Status History'
        verbose_name_plural = 'Lead Status Histories'
    
    def __str__(self):
        return f"{self.assignment.customer_visit.customer_name} - {self.get_status_display()} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"


class CallRequest(models.Model):
    """Call request model for Exotel integration"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='call_requests')
    telecaller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='call_requests')
    
    # Call details
    call_type = models.CharField(max_length=50, choices=[
        ('outbound', 'Outbound'),
        ('followup', 'Follow-up'),
        ('callback', 'Callback'),
    ], default='outbound')
    status = models.CharField(max_length=50, choices=[
        ('initiated', 'Initiated'),
        ('queued', 'Queued'),
        ('ringing', 'Ringing'),
        ('answered', 'Answered'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('busy', 'Busy'),
        ('no_answer', 'No Answer'),
    ], default='initiated')
    
    # Exotel integration
    exotel_call_id = models.CharField(max_length=100, blank=True)
    bridge_url = models.URLField(blank=True, null=True)
    recording_url = models.URLField(blank=True)
    
    # Call metrics
    duration = models.IntegerField(default=0, help_text="Duration in seconds")
    disposition = models.CharField(max_length=100, blank=True)
    sentiment = models.CharField(max_length=20, choices=[
        ('positive', 'Positive'),
        ('neutral', 'Neutral'),
        ('negative', 'Negative'),
    ], blank=True)
    
    # Timestamps
    initiated_at = models.DateTimeField(auto_now_add=True)
    answered_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Additional data
    notes = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-initiated_at']
    
    def __str__(self):
        return f"Call {self.id} - {self.lead.name}"


class FollowUpRequest(models.Model):
    """Follow-up request model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='followup_requests')
    telecaller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='followup_requests')
    
    due_at = models.DateTimeField()
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ], default='pending')
    
    notes = models.TextField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['due_at']
    
    def __str__(self):
        return f"Follow-up for {self.lead.name} - {self.due_at}"


class AuditLog(models.Model):
    """Audit log for all actions"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    action = models.CharField(max_length=100)
    target_type = models.CharField(max_length=50)
    target_id = models.CharField(max_length=100)
    
    # Additional context
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.action} by {self.actor} on {self.target_type}"


class WebhookLog(models.Model):
    """Webhook processing logs"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    webhook_type = models.CharField(max_length=50, choices=[
        ('exotel', 'Exotel'),
        ('google_sheets', 'Google Sheets'),
    ])
    payload = models.JSONField()
    status = models.CharField(max_length=20, choices=[
        ('received', 'Received'),
        ('processed', 'Processed'),
        ('failed', 'Failed'),
    ], default='received')
    
    error_message = models.TextField(blank=True, null=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.webhook_type} webhook - {self.status}"
