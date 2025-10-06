from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.db import transaction
import json
import logging
import hmac
import hashlib
from datetime import datetime

from .models import CallRequest, Lead, AuditLog, WebhookLog
from .utils import log_audit_action, verify_exotel_signature
from .consumers import send_call_status_update, send_call_ended, send_call_started
from django.conf import settings

logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["POST"])
def exotel_webhook(request):
    """Handle Exotel webhook events"""
    try:
        # Log webhook for debugging
        webhook_log = WebhookLog.objects.create(
            webhook_type='exotel',
            payload=request.body.decode('utf-8'),
            status='processing'
        )

        # Verify webhook signature
        signature = request.headers.get('X-Exotel-Signature')
        if not verify_exotel_signature(request.body, signature):
            webhook_log.status = 'failed'
            webhook_log.error_message = 'Invalid signature'
            webhook_log.save()
            logger.warning("Invalid Exotel webhook signature")
            return HttpResponse(status=401)

        # Parse webhook data
        data = json.loads(request.body)
        call_sid = data.get('CallSid')
        call_status = data.get('CallStatus')
        
        if not call_sid or not call_status:
            webhook_log.status = 'failed'
            webhook_log.error_message = 'Missing CallSid or CallStatus'
            webhook_log.save()
            return HttpResponse(status=400)

        # Process webhook based on call status
        with transaction.atomic():
            # Find call request by Exotel call ID
            try:
                call_request = CallRequest.objects.get(exotel_call_id=call_sid)
            except CallRequest.DoesNotExist:
                logger.warning(f"Call request not found for Exotel call ID: {call_sid}")
                webhook_log.status = 'failed'
                webhook_log.error_message = 'Call request not found'
                webhook_log.save()
                return HttpResponse(status=404)

            # Update call request based on status
            previous_status = call_request.status
            
            if call_status == 'ringing':
                call_request.status = 'ringing'
                call_request.save()
                
                # Send WebSocket notification (async call will be handled by background task)
                # await send_call_started(str(call_request.id), 'ringing')
                
                # Log audit action
                log_audit_action(
                    actor=call_request.telecaller,
                    action='CALL_RINGING',
                    target_type='call',
                    target_id=str(call_request.id),
                    metadata={
                        'lead_id': str(call_request.lead.id),
                        'exotel_call_id': call_sid
                    }
                )

            elif call_status == 'answered':
                call_request.status = 'answered'
                call_request.answered_at = timezone.now()
                call_request.save()
                
                # Send WebSocket notification (async call will be handled by background task)
                # await send_call_status_update(str(call_request.id), 'answered')
                
                # Log audit action
                log_audit_action(
                    actor=call_request.telecaller,
                    action='CALL_ANSWERED',
                    target_type='call',
                    target_id=str(call_request.id),
                    metadata={
                        'lead_id': str(call_request.lead.id),
                        'exotel_call_id': call_sid
                    }
                )

            elif call_status in ['completed', 'failed', 'busy', 'no-answer']:
                # Calculate duration
                duration = 0
                if call_request.answered_at:
                    end_time = timezone.now()
                    duration = int((end_time - call_request.answered_at).total_seconds())
                
                call_request.status = 'completed' if call_status == 'completed' else 'failed'
                call_request.completed_at = timezone.now()
                call_request.duration = duration
                call_request.disposition = call_status
                
                # Handle recording URL
                recording_url = data.get('RecordingUrl')
                if recording_url:
                    call_request.recording_url = recording_url
                
                call_request.save()
                
                # Send WebSocket notification (async call will be handled by background task)
                # await send_call_ended(str(call_request.id), duration, recording_url, call_status)
                
                # Update lead's call attempts
                call_request.lead.call_attempts += 1
                call_request.lead.last_interaction = timezone.now()
                call_request.lead.save()
                
                # Log audit action
                log_audit_action(
                    actor=call_request.telecaller,
                    action='CALL_COMPLETED',
                    target_type='call',
                    target_id=str(call_request.id),
                    metadata={
                        'lead_id': str(call_request.lead.id),
                        'exotel_call_id': call_sid,
                        'duration': duration,
                        'disposition': call_status,
                        'recording_url': recording_url
                    }
                )

            # Update webhook log
            webhook_log.status = 'processed'
            webhook_log.processed_at = timezone.now()
            webhook_log.save()

            # Trigger post-call automation
            if call_status == 'completed' and call_request:
                _trigger_post_call_automation(call_request)

            logger.info(f"Processed Exotel webhook: {call_sid} - {call_status}")

        return HttpResponse(status=200)

    except json.JSONDecodeError:
        logger.error("Invalid JSON in Exotel webhook")
        return HttpResponse(status=400)
    except Exception as e:
        logger.error(f"Error processing Exotel webhook: {str(e)}")
        
        # Update webhook log with error
        try:
            webhook_log.status = 'failed'
            webhook_log.error_message = str(e)
            webhook_log.save()
        except:
            pass
            
        return HttpResponse(status=500)

def _trigger_post_call_automation(call_request):
    """Trigger post-call automation workflows"""
    try:
        from .sms_service import sms_service
        from .automation_service import automation_service, rules_engine
        from .voice_service import voice_automation_service
        
        lead = call_request.lead
        
        # 1. Send post-call SMS based on sentiment
        if call_request.sentiment:
            sms_result = sms_service.send_post_call_sms(
                lead.phone, 
                lead.name, 
                call_request.sentiment
            )
            logger.info(f"Post-call SMS sent: {sms_result.get('success', False)}")
        
        # 2. Trigger automation rules
        automation_result = rules_engine.execute_automation_rules(str(lead.id))
        logger.info(f"Automation rules executed: {automation_result.get('automations_executed', 0)}")
        
        # 3. Schedule follow-up if needed
        if call_request.follow_up_required:
            follow_up_time = timezone.now() + timedelta(days=1)
            automation_service.schedule_follow_up_call(
                str(lead.id), 
                follow_up_time, 
                'follow_up'
            )
            logger.info(f"Follow-up call scheduled for {lead.name}")
        
        # 4. Send voice message for high-priority leads
        if lead.priority == 'high' and call_request.sentiment == 'positive':
            voice_result = voice_automation_service.send_follow_up_voice(
                lead.phone, 
                lead.name, 
                call_request.sentiment
            )
            logger.info(f"Follow-up voice message sent: {voice_result.get('success', False)}")
        
    except Exception as e:
        logger.error(f"Error in post-call automation: {str(e)}")

def verify_exotel_signature(payload, signature):
    """Verify Exotel webhook signature"""
    try:
        exotel_config = getattr(settings, 'EXOTEL_CONFIG', {})
        webhook_secret = exotel_config.get('webhook_secret')
        
        if not webhook_secret:
            logger.warning("Exotel webhook secret not configured")
            return True  # Allow in development
        
        # Calculate expected signature
        expected_signature = hmac.new(
            webhook_secret.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        # Compare signatures
        return hmac.compare_digest(signature, expected_signature)
        
    except Exception as e:
        logger.error(f"Error verifying Exotel signature: {str(e)}")
        return False
