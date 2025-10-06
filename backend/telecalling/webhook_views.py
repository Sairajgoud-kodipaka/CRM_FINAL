"""
Exotel Webhook Handlers for Real-time Call Status Updates
Following the official Exotel integration guide
"""

import json
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
from django.conf import settings
from .models import CallRequest, CallLog, LeadStatusHistory
from .serializers import CallLogSerializer

logger = logging.getLogger(__name__)

# Legacy webhook function for backward compatibility
@csrf_exempt
def exotel_webhook(request):
    """
    Legacy Exotel webhook handler for backward compatibility
    Redirects to the new ExotelVoiceWebhookView
    """
    if request.method == 'POST':
        view = ExotelVoiceWebhookView()
        return view.post(request)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@method_decorator(csrf_exempt, name='dispatch')
class ExotelVoiceWebhookView(View):
    """
    Handle Exotel voice call status webhooks
    Receives JSON payloads for call events (answered, terminal)
    """
    
    def post(self, request, *args, **kwargs):
        try:
            # Parse JSON payload from Exotel
            webhook_data = json.loads(request.body)
            
            logger.info(f"Exotel webhook received: {webhook_data}")
            
            # Extract key information from webhook
            call_sid = webhook_data.get('CallSid')
            event_type = webhook_data.get('EventType')
            status = webhook_data.get('Status')
            custom_field = webhook_data.get('CustomField')
            
            if not call_sid:
                logger.error("No CallSid in webhook payload")
                return JsonResponse({'error': 'Missing CallSid'}, status=400)
            
            # Find the call request using CustomField (our CRM call_request_id)
            call_request = None
            if custom_field:
                try:
                    call_request = CallRequest.objects.get(id=custom_field)
                except CallRequest.DoesNotExist:
                    logger.error(f"CallRequest not found for CustomField: {custom_field}")
                    return JsonResponse({'error': 'CallRequest not found'}, status=404)
            
            # Handle different event types
            if event_type == 'initiated':
                self._handle_call_initiated(call_request, webhook_data)
            elif event_type == 'ringing':
                self._handle_call_ringing(call_request, webhook_data)
            elif event_type == 'answered':
                self._handle_call_answered(call_request, webhook_data)
            elif event_type == 'completed':
                self._handle_call_completed(call_request, webhook_data)
            elif event_type == 'busy':
                self._handle_call_busy(call_request, webhook_data)
            elif event_type == 'no-answer':
                self._handle_call_no_answer(call_request, webhook_data)
            elif event_type == 'failed':
                self._handle_call_failed(call_request, webhook_data)
            elif event_type == 'terminal':
                self._handle_call_terminated(call_request, webhook_data)
            else:
                logger.info(f"Unhandled event type: {event_type}")
            
            return JsonResponse({'status': 'success'}, status=200)
            
        except json.JSONDecodeError:
            logger.error("Invalid JSON in webhook payload")
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            logger.error(f"Error processing webhook: {str(e)}")
            return JsonResponse({'error': 'Internal server error'}, status=500)
    
    def _handle_call_initiated(self, call_request, webhook_data):
        """Handle call initiated event"""
        if call_request:
            call_request.status = 'initiated'
            call_request.exotel_call_id = webhook_data.get('CallSid')
            call_request.save()
            
            logger.info(f"Call initiated - CallRequest ID: {call_request.id}, CallSid: {webhook_data.get('CallSid')}")
            
            # Create call log entry
            CallLog.objects.create(
                call_request=call_request,
                lead=call_request.lead,
                telecaller=call_request.telecaller,
                call_status='initiated',
                call_time=webhook_data.get('DateCreated'),
                exotel_call_id=webhook_data.get('CallSid')
            )
    
    def _handle_call_ringing(self, call_request, webhook_data):
        """Handle call ringing event"""
        if call_request:
            call_request.status = 'ringing'
            call_request.save()
            
            logger.info(f"Call ringing - CallRequest ID: {call_request.id}, CallSid: {webhook_data.get('CallSid')}")
            
            # Update existing call log or create new one
            call_log, created = CallLog.objects.get_or_create(
                call_request=call_request,
                defaults={
                    'lead': call_request.lead,
                    'telecaller': call_request.telecaller,
                    'call_status': 'ringing',
                    'call_time': webhook_data.get('DateCreated'),
                    'exotel_call_id': webhook_data.get('CallSid')
                }
            )
            if not created:
                call_log.call_status = 'ringing'
                call_log.save()
    
    def _handle_call_answered(self, call_request, webhook_data):
        """Handle call answered event"""
        if call_request:
            call_request.status = 'answered'
            call_request.save()
            
            logger.info(f"Call answered - CallRequest ID: {call_request.id}, CallSid: {webhook_data.get('CallSid')}")
            
            # Update existing call log or create new one
            call_log, created = CallLog.objects.get_or_create(
                call_request=call_request,
                defaults={
                    'lead': call_request.lead,
                    'telecaller': call_request.telecaller,
                    'call_status': 'answered',
                    'call_time': webhook_data.get('DateCreated'),
                    'exotel_call_id': webhook_data.get('CallSid')
                }
            )
            if not created:
                call_log.call_status = 'answered'
                call_log.save()
    
    def _handle_call_completed(self, call_request, webhook_data):
        """Handle call completed event"""
        if call_request:
            call_request.status = 'completed'
            call_request.duration = webhook_data.get('ConversationDuration', 0)
            call_request.recording_url = webhook_data.get('RecordingUrl', '')
            call_request.save()
            
            logger.info(f"Call completed - CallRequest ID: {call_request.id}, Duration: {webhook_data.get('ConversationDuration')}")
            
            # Update call log
            call_log, created = CallLog.objects.get_or_create(
                call_request=call_request,
                defaults={
                    'lead': call_request.lead,
                    'telecaller': call_request.telecaller,
                    'call_status': 'completed',
                    'call_time': webhook_data.get('DateCreated'),
                    'call_duration': webhook_data.get('ConversationDuration', 0),
                    'exotel_call_id': webhook_data.get('CallSid'),
                    'recording_url': webhook_data.get('RecordingUrl', '')
                }
            )
            if not created:
                call_log.call_status = 'completed'
                call_log.call_duration = webhook_data.get('ConversationDuration', 0)
                call_log.recording_url = webhook_data.get('RecordingUrl', '')
                call_log.save()
            
            # Update lead status
            self._update_lead_status(call_request, webhook_data)
    
    def _handle_call_busy(self, call_request, webhook_data):
        """Handle call busy event"""
        if call_request:
            call_request.status = 'busy'
            call_request.save()
            
            logger.info(f"Call busy - CallRequest ID: {call_request.id}, CallSid: {webhook_data.get('CallSid')}")
            
            # Update call log
            call_log, created = CallLog.objects.get_or_create(
                call_request=call_request,
                defaults={
                    'lead': call_request.lead,
                    'telecaller': call_request.telecaller,
                    'call_status': 'busy',
                    'call_time': webhook_data.get('DateCreated'),
                    'exotel_call_id': webhook_data.get('CallSid')
                }
            )
            if not created:
                call_log.call_status = 'busy'
                call_log.save()
            
            # Update lead status
            self._update_lead_status(call_request, webhook_data)
    
    def _handle_call_no_answer(self, call_request, webhook_data):
        """Handle call no answer event"""
        if call_request:
            call_request.status = 'no-answer'
            call_request.save()
            
            logger.info(f"Call no answer - CallRequest ID: {call_request.id}, CallSid: {webhook_data.get('CallSid')}")
            
            # Update call log
            call_log, created = CallLog.objects.get_or_create(
                call_request=call_request,
                defaults={
                    'lead': call_request.lead,
                    'telecaller': call_request.telecaller,
                    'call_status': 'no-answer',
                    'call_time': webhook_data.get('DateCreated'),
                    'exotel_call_id': webhook_data.get('CallSid')
                }
            )
            if not created:
                call_log.call_status = 'no-answer'
                call_log.save()
            
            # Update lead status
            self._update_lead_status(call_request, webhook_data)
    
    def _handle_call_failed(self, call_request, webhook_data):
        """Handle call failed event"""
        if call_request:
            call_request.status = 'failed'
            call_request.save()
            
            logger.info(f"Call failed - CallRequest ID: {call_request.id}, CallSid: {webhook_data.get('CallSid')}")
            
            # Update call log
            call_log, created = CallLog.objects.get_or_create(
                call_request=call_request,
                defaults={
                    'lead': call_request.lead,
                    'telecaller': call_request.telecaller,
                    'call_status': 'failed',
                    'call_time': webhook_data.get('DateCreated'),
                    'exotel_call_id': webhook_data.get('CallSid')
                }
            )
            if not created:
                call_log.call_status = 'failed'
                call_log.save()
            
            # Update lead status
            self._update_lead_status(call_request, webhook_data)
    
    def _handle_call_terminated(self, call_request, webhook_data):
        """Handle call terminated event"""
        if call_request:
            # Update call request with final status
            call_request.status = webhook_data.get('Status', 'completed')
            call_request.duration = webhook_data.get('ConversationDuration', 0)
            call_request.recording_url = webhook_data.get('RecordingUrl', '')
            call_request.save()
            
            logger.info(f"Call terminated - CallRequest ID: {call_request.id}, Status: {webhook_data.get('Status')}, Duration: {webhook_data.get('ConversationDuration')}")
            
            # Create final call log entry
            call_log = CallLog.objects.create(
                call_request=call_request,
                lead=call_request.lead,
                telecaller=call_request.telecaller,
                call_status=webhook_data.get('Status', 'completed'),
                call_time=webhook_data.get('DateCreated'),
                call_duration=webhook_data.get('ConversationDuration', 0),
                exotel_call_id=webhook_data.get('CallSid'),
                recording_url=webhook_data.get('RecordingUrl', '')
            )
            
            # Update lead status based on call outcome
            self._update_lead_status(call_request, webhook_data)
            
            # Download recording if available (implement this based on your storage solution)
            if webhook_data.get('RecordingUrl'):
                self._download_recording(call_request, webhook_data.get('RecordingUrl'))
    
    def _update_lead_status(self, call_request, webhook_data):
        """Update lead status based on call outcome"""
        try:
            lead = call_request.lead
            status = webhook_data.get('Status', call_request.status)
            
            # Map Exotel status to CRM status
            status_mapping = {
                'completed': 'contacted',
                'answered': 'contacted',
                'no-answer': 'no_answer',
                'busy': 'busy',
                'failed': 'failed',
                'initiated': 'calling',
                'ringing': 'calling'
            }
            
            new_status = status_mapping.get(status, 'contacted')
            
            # Create status history entry
            LeadStatusHistory.objects.create(
                lead=lead,
                old_status=lead.status,
                new_status=new_status,
                changed_by=call_request.telecaller,
                notes=f"Call {status} - Duration: {webhook_data.get('ConversationDuration', 0)}s",
                call_duration=webhook_data.get('ConversationDuration', 0),
                call_outcome=status
            )
            
            # Update lead status
            lead.status = new_status
            lead.save()
            
            logger.info(f"Lead status updated - Lead ID: {lead.id}, New Status: {new_status}")
            
        except Exception as e:
            logger.error(f"Error updating lead status: {str(e)}")
    
    def _download_recording(self, call_request, recording_url):
        """Download and store call recording"""
        try:
            # TODO: Implement recording download and storage
            # This should download the recording from Exotel's S3 bucket
            # and store it in your own secure storage (e.g., AWS S3, Google Cloud Storage)
            
            logger.info(f"Recording available for CallRequest {call_request.id}: {recording_url}")
            
            # Example implementation:
            # 1. Download recording from Exotel URL
            # 2. Upload to your storage solution
            # 3. Update call_request.recording_url with your storage URL
            # 4. Delete from Exotel (request auto-purging)
            
        except Exception as e:
            logger.error(f"Error downloading recording: {str(e)}")


@method_decorator(csrf_exempt, name='dispatch')
class ExotelWhatsAppWebhookView(View):
    """
    Handle Exotel WhatsApp message status webhooks
    For future WhatsApp integration
    """
    
    def post(self, request, *args, **kwargs):
        try:
            webhook_data = json.loads(request.body)
            logger.info(f"WhatsApp webhook received: {webhook_data}")
            
            # TODO: Implement WhatsApp webhook handling
            # Handle message status updates (sent, delivered, read)
            
            return JsonResponse({'status': 'success'}, status=200)
            
        except Exception as e:
            logger.error(f"Error processing WhatsApp webhook: {str(e)}")
            return JsonResponse({'error': 'Internal server error'}, status=500)