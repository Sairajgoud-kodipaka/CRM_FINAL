import hashlib
import hmac
import json
from datetime import datetime, timedelta
from django.utils import timezone
from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.http import HttpRequest
from .models import AuditLog


def mask_phone(phone):
    """Mask phone number for display"""
    if not phone or len(phone) < 4:
        return phone
    return phone[:-4] + "****"


def mask_email(email):
    """Mask email address for display"""
    if not email or '@' not in email:
        return email
    local, domain = email.split('@', 1)
    if len(local) <= 2:
        return f"{local[0]}***@{domain}"
    return f"{local[0]}***{local[-1]}@{domain}"


def log_audit_action(actor, action, target_type, target_id, metadata=None, request=None):
    """Log an audit action"""
    ip_address = get_client_ip(request) if request else '127.0.0.1'
    user_agent = get_user_agent(request) if request else ''
    
    AuditLog.objects.create(
        actor=actor,
        action=action,
        target_type=target_type,
        target_id=target_id,
        metadata=metadata or {},
        ip_address=ip_address,
        user_agent=user_agent
    )


def verify_exotel_signature(payload, signature):
    """Verify Exotel webhook signature"""
    # TODO: Implement Exotel signature verification
    # This requires the Exotel webhook secret
    return True  # Placeholder


def generate_signed_url(url, expires_in=3600):
    """Generate signed URL for recording access"""
    # TODO: Implement signed URL generation
    # This would typically use AWS S3 or similar service
    return url  # Placeholder


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_user_agent(request):
    """Get user agent from request"""
    return request.META.get('HTTP_USER_AGENT', '')


def check_dnd_compliance(phone_number):
    """Check DND compliance for phone number"""
    # TODO: Implement DND compliance check
    # This would typically integrate with DND registry APIs
    return True  # Placeholder


def check_consent_status(lead_id):
    """Check consent status for lead"""
    # TODO: Implement consent checking
    # This would check against consent management system
    return True  # Placeholder


def get_recording_url(call_log_id, user):
    """Get signed URL for recording with access control"""
    from .models import CallRequest
    
    try:
        call_log = CallRequest.objects.get(id=call_log_id)
        
        # Check permissions
        if user.role == 'tele_calling' and call_log.telecaller != user:
            raise PermissionDenied("Access denied to this recording")
        
        # Check consent
        if not check_consent_status(call_log.lead.id):
            raise PermissionDenied("Recording consent not available")
        
        # Generate signed URL (expires in 1 hour)
        return generate_signed_url(call_log.recording_url, expires_in=3600)
        
    except CallRequest.DoesNotExist:
        raise PermissionDenied("Recording not found")


def calculate_engagement_score(call_log):
    """Calculate engagement score based on call outcome and sentiment"""
    base_score = 50
    
    if call_log.status == 'answered':
        base_score += 30
    elif call_log.status == 'busy':
        base_score += 20
    elif call_log.status == 'no_answer':
        base_score += 10
    
    if call_log.sentiment == 'positive':
        base_score += 20
    elif call_log.sentiment == 'neutral':
        base_score += 10
    elif call_log.sentiment == 'negative':
        base_score -= 20
        
    return max(0, min(100, base_score))


def calculate_conversion_likelihood(call_log):
    """Calculate conversion likelihood based on call outcome"""
    if call_log.status == 'answered' and call_log.sentiment == 'positive':
        return 'very_high'
    elif call_log.status == 'answered' and call_log.sentiment == 'neutral':
        return 'high'
    elif call_log.status == 'busy':
        return 'medium'
    elif call_log.status == 'no_answer':
        return 'low'
    else:
        return 'very_low'


def round_robin_assignment(leads, telecallers):
    """Round-robin assignment algorithm"""
    assignments = []
    telecaller_count = len(telecallers)
    
    for i, lead in enumerate(leads):
        telecaller = telecallers[i % telecaller_count]
        assignments.append({
            'lead': lead,
            'telecaller': telecaller
        })
    
    return assignments


def workload_balance_assignment(leads, telecallers):
    """Workload balancing assignment algorithm"""
    from django.db.models import Count
    
    # Get current workload for each telecaller
    workloads = {}
    for telecaller in telecallers:
        current_assignments = lead.assigned_to.count()
        workloads[telecaller.id] = current_assignments
    
    assignments = []
    for lead in leads:
        # Assign to telecaller with least workload
        min_workload_telecaller = min(workloads.items(), key=lambda x: x[1])[0]
        telecaller = next(t for t in telecallers if t.id == min_workload_telecaller)
        
        assignments.append({
            'lead': lead,
            'telecaller': telecaller
        })
        
        # Update workload count
        workloads[telecaller.id] += 1
    
    return assignments


def segment_priority_assignment(leads, telecallers, segment_filters=None):
    """Segment-based priority assignment algorithm"""
    assignments = []
    
    # Group leads by priority
    high_priority_leads = [lead for lead in leads if lead.priority == 'high']
    medium_priority_leads = [lead for lead in leads if lead.priority == 'medium']
    low_priority_leads = [lead for lead in leads if lead.priority == 'low']
    
    # Assign high priority leads first
    for i, lead in enumerate(high_priority_leads):
        telecaller = telecallers[i % len(telecallers)]
        assignments.append({
            'lead': lead,
            'telecaller': telecaller
        })
    
    # Then medium priority
    for i, lead in enumerate(medium_priority_leads):
        telecaller = telecallers[i % len(telecallers)]
        assignments.append({
            'lead': lead,
            'telecaller': telecaller
        })
    
    # Finally low priority
    for i, lead in enumerate(low_priority_leads):
        telecaller = telecallers[i % len(telecallers)]
        assignments.append({
            'lead': lead,
            'telecaller': telecaller
        })
    
    return assignments
