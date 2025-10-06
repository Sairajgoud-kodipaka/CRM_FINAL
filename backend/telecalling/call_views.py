from rest_framework import status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django.utils import timezone
from django.db import transaction
from django.core.exceptions import PermissionDenied
import logging
import requests
import json
from datetime import datetime, timedelta

from .models import CallRequest, Lead, AuditLog, Assignment, CallLog, LeadStatusHistory
from .serializers import (
    CallRequestSerializer, CallInitiationSerializer, 
    CallInitiationResponseSerializer, CallStatusSerializer
)
from .utils import log_audit_action, verify_exotel_signature
from .sms_service import sms_service
from .automation_service import automation_service, rules_engine
from .voice_service import voice_automation_service
from .routing_service import call_router, distribution_service
from django.conf import settings

logger = logging.getLogger(__name__)

class CallRequestViewSet(ModelViewSet):
    """Call request management with Exotel integration"""
    queryset = CallRequest.objects.all()
    serializer_class = CallRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'tele_calling':
            return CallRequest.objects.filter(telecaller=user)
        elif user.role in ['manager', 'admin']:
            return CallRequest.objects.all()
        return CallRequest.objects.none()

    @action(detail=False, methods=['post'])
    def initiate(self, request):
        """Initiate a call to a lead"""
        logger.info(f"🚀 Call initiation started by user: {request.user.username}")
        try:
            # Try to get request data (DRF vs Django request)
            if hasattr(request, 'data'):
                request_data = request.data
            else:
                # For regular Django requests, try to parse JSON or use POST
                import json
                try:
                    request_data = json.loads(request.body.decode('utf-8'))
                except:
                    request_data = request.POST
            logger.info(f"📋 Request data: {request_data}")
        except Exception as e:
            logger.warning(f"⚠️ Could not log request data: {e}")
            request_data = {}
        
        serializer = CallInitiationSerializer(data=request_data)
        if not serializer.is_valid():
            logger.error(f"❌ Serializer validation failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        lead_id = serializer.validated_data['lead_id']
        call_type = serializer.validated_data.get('call_type', 'outbound')
        logger.info(f"📞 Initiating {call_type} call for lead: {lead_id}")

        try:
            with transaction.atomic():
                # Get lead and validate ownership
                logger.info(f"🔍 Looking up lead: {lead_id}")
                lead = Lead.objects.get(id=lead_id)
                logger.info(f"✅ Lead found: {lead.name} ({lead.phone})")
                
                if request.user.role == 'tele_calling':
                    logger.info(f"👤 Checking assignment for telecaller: {request.user.username}")
                    if lead.assigned_to != request.user:
                        logger.error(f"❌ Assignment mismatch: lead assigned to {lead.assigned_to}, user is {request.user}")
                        raise PermissionDenied("You can only call leads assigned to you")
                    logger.info("✅ Assignment check passed")
                
                # Check if lead is already in an active call
                active_call = CallRequest.objects.filter(
                    lead=lead,
                    status__in=['initiated', 'ringing', 'answered']
                ).first()
                
                if active_call:
                    # Check if the call is stale (older than 5 minutes)
                    from django.utils import timezone
                    from datetime import timedelta
                    
                    if active_call.created_at < timezone.now() - timedelta(minutes=5):
                        # Mark stale call as failed and allow new call
                        active_call.status = 'failed'
                        active_call.save()
                        logger.info(f"Marked stale call {active_call.id} as failed")
                    else:
                        # Return existing call info instead of blocking
                        return Response({
                            'error': 'Call already in progress',
                            'call_id': str(active_call.id),
                            'status': active_call.status,
                            'exotel_call_id': active_call.exotel_call_id,
                            'message': 'Use the existing call or end it first'
                        }, status=status.HTTP_409_CONFLICT)

                # Check DND compliance
                from .utils import check_dnd_compliance
                if not check_dnd_compliance(lead.phone):
                    return Response({
                        'error': 'DND compliance violation',
                        'message': 'Cannot call this number due to DND registry'
                    }, status=status.HTTP_403_FORBIDDEN)

                # Check consent
                from .utils import check_consent_status
                if not check_consent_status(lead.id):
                    return Response({
                        'error': 'Consent not available',
                        'message': 'Customer consent required for calling'
                    }, status=status.HTTP_403_FORBIDDEN)

                # Rate limiting check
                today = timezone.now().date()
                calls_today = CallRequest.objects.filter(
                    lead=lead,
                    initiated_at__date=today
                ).count()
                
                if calls_today >= 10:  # Increased from 3 to 10 for testing
                    return Response({
                        'error': 'Rate limit exceeded',
                        'message': 'Maximum 10 calls per lead per day'
                    }, status=status.HTTP_429_TOO_MANY_REQUESTS)

                # Create call request
                call_request = CallRequest.objects.create(
                    lead=lead,
                    telecaller=request.user,
                    call_type=call_type,
                    status='initiated'
                )

                # Initiate Exotel call
                exotel_response = self._initiate_exotel_call(call_request)
                
                if exotel_response.get('success'):
                    call_request.exotel_call_id = exotel_response.get('call_sid')
                    call_request.bridge_url = exotel_response.get('bridge_url')
                    call_request.status = 'initiated'
                    call_request.save()

                    # Log audit action
                    try:
                        log_audit_action(
                            actor=request.user,
                            action='CALL_INITIATED',
                            target_type='call',
                            target_id=str(call_request.id),
                            metadata={
                                'lead_id': str(lead.id),
                                'lead_name': lead.name,
                                'phone': lead.phone,
                                'call_type': call_type
                            },
                            request=request
                        )
                        logger.info("✅ Audit log created successfully")
                    except Exception as audit_error:
                        logger.error(f"❌ Audit logging failed: {audit_error}")
                        # Don't fail the call for audit logging issues

                    # Create response
                    logger.info("📝 Creating response...")
                    try:
                        response_serializer = CallInitiationResponseSerializer({
                            'call_request_id': call_request.id,
                            'status': 'initiated',
                            'exotel_bridge_url': call_request.bridge_url
                        })
                        logger.info(f"✅ Response serializer created: {response_serializer.data}")
                        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
                    except Exception as response_error:
                        logger.error(f"❌ Response serialization failed: {response_error}")
                        import traceback
                        logger.error(f"❌ Response traceback: {traceback.format_exc()}")
                        raise
                else:
                    call_request.status = 'failed'
                    call_request.save()
                    
                    return Response({
                        'call_request_id': str(call_request.id),
                        'status': 'failed',
                        'error_message': exotel_response.get('error', 'Failed to initiate call')
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Lead.DoesNotExist:
            logger.error(f"❌ Lead not found: {lead_id}")
            return Response({'error': 'Lead not found'}, status=status.HTTP_404_NOT_FOUND)
        except PermissionDenied as e:
            logger.error(f"❌ Permission denied: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"❌ Error initiating call: {str(e)}")
            logger.error(f"❌ Exception type: {type(e).__name__}")
            import traceback
            logger.error(f"❌ Traceback: {traceback.format_exc()}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def end(self, request, pk=None):
        """End an active call"""
        try:
            call_request = self.get_object()
            
            if call_request.status not in ['initiated', 'ringing', 'answered']:
                return Response({
                    'error': 'Call is not active',
                    'current_status': call_request.status
                }, status=status.HTTP_400_BAD_REQUEST)

            # End call via Exotel API
            exotel_response = self._end_exotel_call(call_request)
            
            if exotel_response.get('success'):
                call_request.status = 'completed'
                call_request.completed_at = timezone.now()
                call_request.save()

                # Log audit action
                log_audit_action(
                    actor=request.user,
                    action='CALL_ENDED',
                    target_type='call',
                    target_id=str(call_request.id),
                    metadata={
                        'lead_id': str(call_request.lead.id),
                        'duration': call_request.duration,
                        'manual_end': True
                    },
                    request=request
                )

                return Response({
                    'status': 'completed',
                    'message': 'Call ended successfully'
                })
            else:
                return Response({
                    'error': 'Failed to end call',
                    'message': exotel_response.get('error', 'Unknown error')
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            logger.error(f"Error ending call: {str(e)}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def real_time_status(self, request, pk=None):
        """Get real-time call status with all available information"""
        try:
            call_request = self.get_object()
            
            # Since CallLog doesn't have CallRequest relationship, we'll use CallRequest data directly
            status_data = {
                'call_request_id': str(call_request.id),
                'status': call_request.status,
                'duration_seconds': call_request.duration,
                'recording_url': call_request.recording_url,
                'disposition': call_request.disposition,
                'exotel_call_id': call_request.exotel_call_id,
                'bridge_url': call_request.bridge_url,
                'lead_name': call_request.lead.name if call_request.lead else 'Unknown',
                'lead_phone': call_request.lead.phone if call_request.lead else '',
                'telecaller_name': call_request.telecaller.name if call_request.telecaller else 'Unknown',
                'call_log_status': call_request.status,  # Use CallRequest status directly
                'call_log_duration': call_request.duration,  # Use CallRequest duration directly
                'last_updated': call_request.updated_at.isoformat() if call_request.updated_at else None
            }

            return Response(status_data)

        except Exception as e:
            logger.error(f"Error getting real-time call status: {str(e)}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def webrtc_config(self, request):
        """Get WebRTC configuration for browser calling"""
        try:
            exotel_config = settings.EXOTEL_CONFIG
            
            # Check if WebRTC is enabled
            if not exotel_config.get('webrtc_enabled', False):
                return Response({
                    'error': 'WebRTC is not enabled',
                    'message': 'Please enable WebRTC in your Exotel configuration'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if all required WebRTC fields are present
            required_fields = [
                'webrtc_client_id', 'webrtc_client_secret', 'webrtc_customer_id',
                'webrtc_app_id', 'webrtc_user_id', 'webrtc_sip_username', 'webrtc_sip_password'
            ]
            
            missing_fields = [field for field in required_fields if not exotel_config.get(field)]
            if missing_fields:
                return Response({
                    'error': 'WebRTC configuration incomplete',
                    'missing_fields': missing_fields
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Return WebRTC configuration (without sensitive data)
            webrtc_config = {
                'clientId': exotel_config['webrtc_client_id'],
                'clientSecret': exotel_config['webrtc_client_secret'],
                'customerId': exotel_config['webrtc_customer_id'],
                'appId': exotel_config['webrtc_app_id'],
                'userId': exotel_config['webrtc_user_id'],
                'sipUsername': exotel_config['webrtc_sip_username'],
                'sipPassword': exotel_config['webrtc_sip_password'],
                'environment': 'production'  # or 'sandbox' for testing
            }
            
            return Response({
                'success': True,
                'config': webrtc_config
            })
            
        except Exception as e:
            logger.error(f"Error getting WebRTC config: {str(e)}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """Get current call status"""
        try:
            call_request = self.get_object()
            
            status_serializer = CallStatusSerializer({
                'status': call_request.status,
                'duration_seconds': call_request.duration,
                'recording_url': call_request.recording_url,
                'disposition': call_request.disposition,
                'exotel_call_id': call_request.exotel_call_id,
                'bridge_url': call_request.bridge_url
            })

            return Response(status_serializer.data)

        except Exception as e:
            logger.error(f"Error getting call status: {str(e)}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def mute(self, request, pk=None):
        """Toggle mute for call (UI-only for PSTN, real control for IP SDK)"""
        try:
            call_request = self.get_object()
            
            if call_request.status != 'answered':
                return Response({
                    'error': 'Call must be answered to control audio'
                }, status=status.HTTP_400_BAD_REQUEST)

            mute_on = request.data.get('on', True)
            
            # For PSTN calls, this is UI-only
            # For IP SDK calls, implement actual mute control
            if call_request.call_type == 'ip_sdk':
                exotel_response = self._control_exotel_call(call_request, 'mute', {'muted': mute_on})
                
                if exotel_response.get('success'):
                    return Response({
                        'muted': mute_on,
                        'message': f'Audio {"muted" if mute_on else "unmuted"}'
                    })
                else:
                    return Response({
                        'error': 'Failed to control audio',
                        'message': exotel_response.get('error')
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                # PSTN - UI only
                return Response({
                    'muted': mute_on,
                    'message': 'Audio control is UI-only for PSTN calls'
                })

        except Exception as e:
            logger.error(f"Error controlling mute: {str(e)}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def send_sms(self, request):
        """Send SMS to lead"""
        try:
            lead_id = request.data.get('lead_id')
            message = request.data.get('message')
            template = request.data.get('template')
            
            if not lead_id:
                return Response({'error': 'Lead ID required'}, status=status.HTTP_400_BAD_REQUEST)
            
            lead = Lead.objects.get(id=lead_id)
            
            if template:
                # Use predefined template
                from .sms_service import SMS_TEMPLATES
                if template in SMS_TEMPLATES:
                    message = SMS_TEMPLATES[template].format(name=lead.name)
                else:
                    return Response({'error': 'Invalid template'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not message:
                return Response({'error': 'Message required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Send SMS
            result = sms_service.send_sms(lead.phone, message)
            
            if result['success']:
                # Log audit action
                log_audit_action(
                    actor=request.user,
                    action='SMS_SENT',
                    target_type='lead',
                    target_id=str(lead.id),
                    metadata={
                        'phone': lead.phone,
                        'message': message[:100],  # Truncate for logging
                        'template': template
                    },
                    request=request
                )
                
                return Response({
                    'success': True,
                    'sms_sid': result.get('sms_sid'),
                    'status': result.get('status')
                })
            else:
                return Response({
                    'success': False,
                    'error': result.get('error')
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Lead.DoesNotExist:
            return Response({'error': 'Lead not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error sending SMS: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def send_voice_message(self, request):
        """Send voice message to lead"""
        try:
            lead_id = request.data.get('lead_id')
            message = request.data.get('message')
            template = request.data.get('template')
            voice_type = request.data.get('voice_type', 'female')
            
            if not lead_id:
                return Response({'error': 'Lead ID required'}, status=status.HTTP_400_BAD_REQUEST)
            
            lead = Lead.objects.get(id=lead_id)
            
            if template:
                # Use predefined template
                from .voice_service import VOICE_TEMPLATES
                if template in VOICE_TEMPLATES:
                    message = VOICE_TEMPLATES[template].format(name=lead.name)
                else:
                    return Response({'error': 'Invalid template'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not message:
                return Response({'error': 'Message required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Send voice message
            result = voice_automation_service.voice_service.send_voice_message(
                lead.phone, message, voice_type
            )
            
            if result['success']:
                # Log audit action
                log_audit_action(
                    actor=request.user,
                    action='VOICE_MESSAGE_SENT',
                    target_type='lead',
                    target_id=str(lead.id),
                    metadata={
                        'phone': lead.phone,
                        'message': message[:100],
                        'template': template,
                        'voice_type': voice_type
                    },
                    request=request
                )
                
                return Response({
                    'success': True,
                    'call_sid': result.get('call_sid'),
                    'audio_url': result.get('audio_url'),
                    'duration': result.get('duration')
                })
            else:
                return Response({
                    'success': False,
                    'error': result.get('error')
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Lead.DoesNotExist:
            return Response({'error': 'Lead not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error sending voice message: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def route_call(self, request):
        """Route call using advanced routing"""
        try:
            lead_id = request.data.get('lead_id')
            routing_strategy = request.data.get('routing_strategy', 'skill_based')
            
            if not lead_id:
                return Response({'error': 'Lead ID required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Route call
            result = call_router.route_call(lead_id, routing_strategy)
            
            if result['success']:
                # Log audit action
                log_audit_action(
                    actor=request.user,
                    action='CALL_ROUTED',
                    target_type='lead',
                    target_id=lead_id,
                    metadata={
                        'routing_strategy': routing_strategy,
                        'agent_id': result.get('agent_id'),
                        'agent_name': result.get('agent_name')
                    },
                    request=request
                )
                
                return Response(result)
            else:
                return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logger.error(f"Error routing call: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def trigger_automation(self, request):
        """Trigger automated workflow for lead"""
        try:
            lead_id = request.data.get('lead_id')
            workflow_type = request.data.get('workflow_type')
            
            if not lead_id or not workflow_type:
                return Response({
                    'error': 'Lead ID and workflow type required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Trigger automation
            result = automation_service.trigger_automated_workflow(workflow_type, lead_id)
            
            if result['success']:
                # Log audit action
                log_audit_action(
                    actor=request.user,
                    action='AUTOMATION_TRIGGERED',
                    target_type='lead',
                    target_id=lead_id,
                    metadata={
                        'workflow_type': workflow_type,
                        'result': result
                    },
                    request=request
                )
                
                return Response(result)
            else:
                return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logger.error(f"Error triggering automation: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def routing_analytics(self, request):
        """Get routing analytics"""
        try:
            result = distribution_service.get_routing_analytics()
            return Response(result)
        except Exception as e:
            logger.error(f"Error getting routing analytics: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        """Toggle hold for call (UI-only for PSTN, real control for IP SDK)"""
        try:
            call_request = self.get_object()
            
            if call_request.status != 'answered':
                return Response({
                    'error': 'Call must be answered to control hold'
                }, status=status.HTTP_400_BAD_REQUEST)

            hold_on = request.data.get('on', True)
            
            # For PSTN calls, this is UI-only
            # For IP SDK calls, implement actual hold control
            if call_request.call_type == 'ip_sdk':
                exotel_response = self._control_exotel_call(call_request, 'hold', {'held': hold_on})
                
                if exotel_response.get('success'):
                    return Response({
                        'held': hold_on,
                        'message': f'Call {"held" if hold_on else "resumed"}'
                    })
                else:
                    return Response({
                        'error': 'Failed to control hold',
                        'message': exotel_response.get('error')
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                # PSTN - UI only
                return Response({
                    'held': hold_on,
                    'message': 'Hold control is UI-only for PSTN calls'
                })

        except Exception as e:
            logger.error(f"Error controlling hold: {str(e)}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def get_lead_notes(self, request):
        """Get notes and status history for a lead"""
        try:
            lead_id = request.query_params.get('lead_id')
            if not lead_id:
                return Response({'error': 'Lead ID required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get lead information
            try:
                lead = Lead.objects.get(id=lead_id)
            except Lead.DoesNotExist:
                return Response({'error': 'Lead not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Get assignment if exists
            assignment = None
            try:
                assignment = Assignment.objects.get(customer_visit__customer_phone=lead.phone)
            except Assignment.DoesNotExist:
                pass
            
            # Get status history
            status_history = []
            if assignment:
                status_history = LeadStatusHistory.objects.filter(assignment=assignment).order_by('-created_at')
            
            # Get call logs
            call_logs = []
            if assignment:
                call_logs = CallLog.objects.filter(assignment=assignment).order_by('-call_time')
            
            # Get call requests
            call_requests = CallRequest.objects.filter(lead=lead).order_by('-initiated_at')
            
            return Response({
                'lead': {
                    'id': str(lead.id),
                    'name': lead.name,
                    'phone': lead.phone,
                    'email': lead.email,
                    'status': lead.status,
                    'priority': lead.priority,
                    'notes': lead.notes,
                    'created_at': lead.created_at,
                    'updated_at': lead.updated_at
                },
                'assignment': {
                    'id': assignment.id if assignment else None,
                    'status': assignment.status if assignment else None,
                    'notes': assignment.notes if assignment else None,
                    'priority': assignment.priority if assignment else None
                } if assignment else None,
                'status_history': [
                    {
                        'id': str(h.id),
                        'status': h.status,
                        'notes': h.notes,
                        'created_by': h.created_by.get_full_name() if h.created_by else 'System',
                        'created_at': h.created_at,
                        'call_duration': h.call_duration,
                        'call_outcome': h.call_outcome
                    } for h in status_history
                ],
                'call_logs': [
                    {
                        'id': str(log.id),
                        'call_status': log.call_status,
                        'call_duration': log.call_duration,
                        'feedback': log.feedback,
                        'customer_sentiment': log.customer_sentiment,
                        'call_time': log.call_time,
                        'revisit_required': log.revisit_required,
                        'revisit_notes': log.revisit_notes
                    } for log in call_logs
                ],
                'call_requests': [
                    {
                        'id': str(cr.id),
                        'status': cr.status,
                        'call_type': cr.call_type,
                        'duration': cr.duration,
                        'disposition': cr.disposition,
                        'sentiment': cr.sentiment,
                        'notes': cr.notes,
                        'initiated_at': cr.initiated_at,
                        'completed_at': cr.completed_at
                    } for cr in call_requests
                ]
            })
            
        except Exception as e:
            logger.error(f"Error getting lead notes: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def add_lead_note(self, request):
        """Add a note to a lead and update status"""
        try:
            lead_id = request.data.get('lead_id')
            note = request.data.get('note')
            status = request.data.get('status')
            disposition = request.data.get('disposition')
            follow_up_required = request.data.get('follow_up_required', False)
            
            if not lead_id:
                return Response({'error': 'Lead ID required'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not note:
                return Response({'error': 'Note required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get lead
            try:
                lead = Lead.objects.get(id=lead_id)
            except Lead.DoesNotExist:
                return Response({'error': 'Lead not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Get or create assignment
            assignment = None
            try:
                assignment = Assignment.objects.get(customer_visit__customer_phone=lead.phone)
            except Assignment.DoesNotExist:
                # Create customer visit and assignment if they don't exist
                from .models import CustomerVisit
                customer_visit = CustomerVisit.objects.create(
                    sales_rep=request.user,
                    customer_name=lead.name,
                    customer_phone=lead.phone,
                    customer_email=lead.email,
                    notes=note,
                    lead_quality='warm'
                )
                assignment = Assignment.objects.create(
                    telecaller=request.user,
                    customer_visit=customer_visit,
                    assigned_by=request.user,
                    status=status or 'contacted_in_progress',
                    notes=note
                )
            
            # Update assignment notes and status
            if assignment:
                assignment.notes = note
                if status:
                    assignment.status = status
                assignment.save()
            
            # Create status history entry
            if assignment:
                LeadStatusHistory.objects.create(
                    assignment=assignment,
                    status=status or assignment.status,
                    notes=note,
                    created_by=request.user,
                    call_outcome=disposition
                )
            
            # Update lead notes and status
            lead.notes = note
            if status:
                lead.status = status
            if follow_up_required:
                from django.utils import timezone
                from datetime import timedelta
                lead.next_followup = timezone.now() + timedelta(days=1)
            lead.last_interaction = timezone.now()
            lead.save()
            
            # Log audit action
            log_audit_action(
                actor=request.user,
                action='NOTE_ADDED',
                target_type='lead',
                target_id=str(lead.id),
                metadata={
                    'note': note[:100],  # Truncate for logging
                    'status': status,
                    'disposition': disposition,
                    'follow_up_required': follow_up_required
                },
                request=request
            )
            
            return Response({
                'success': True,
                'message': 'Note added successfully',
                'lead_id': str(lead.id),
                'assignment_id': str(assignment.id) if assignment else None
            })
            
        except Exception as e:
            logger.error(f"Error adding lead note: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def update_lead_status(self, request):
        """Update lead status and create status history entry"""
        try:
            lead_id = request.data.get('lead_id')
            status = request.data.get('status')
            note = request.data.get('note', '')
            disposition = request.data.get('disposition')
            
            if not lead_id:
                return Response({'error': 'Lead ID required'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not status:
                return Response({'error': 'Status required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get lead
            try:
                lead = Lead.objects.get(id=lead_id)
            except Lead.DoesNotExist:
                return Response({'error': 'Lead not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Get assignment
            assignment = None
            try:
                assignment = Assignment.objects.get(customer_visit__customer_phone=lead.phone)
            except Assignment.DoesNotExist:
                return Response({'error': 'Assignment not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Update assignment status
            assignment.status = status
            if note:
                assignment.notes = note
            assignment.save()
            
            # Create status history entry
            LeadStatusHistory.objects.create(
                assignment=assignment,
                status=status,
                notes=note,
                created_by=request.user,
                call_outcome=disposition
            )
            
            # Update lead status
            lead.status = status
            lead.last_interaction = timezone.now()
            lead.save()
            
            # Log audit action
            log_audit_action(
                actor=request.user,
                action='STATUS_UPDATED',
                target_type='lead',
                target_id=str(lead.id),
                metadata={
                    'status': status,
                    'note': note[:100],
                    'disposition': disposition
                },
                request=request
            )
            
            return Response({
                'success': True,
                'message': 'Status updated successfully',
                'lead_id': str(lead.id),
                'assignment_id': str(assignment.id)
            })
            
        except Exception as e:
            logger.error(f"Error updating lead status: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _initiate_exotel_call(self, call_request):
        """Initiate call via Exotel API"""
        try:
            exotel_config = getattr(settings, 'EXOTEL_CONFIG', {})
            
            # Enhanced configuration validation
            required_fields = ['account_sid', 'api_key', 'api_token', 'agent_number', 'caller_id']
            missing_fields = [field for field in required_fields if not exotel_config.get(field)]
            
            if missing_fields:
                logger.error(f"Exotel configuration missing fields: {missing_fields}")
                return {'success': False, 'error': f'Exotel configuration incomplete. Missing: {missing_fields}'}

            # Log configuration (without sensitive data)
            logger.info(f"Exotel config loaded - Account SID: {exotel_config['account_sid'][:10]}..., Agent: {exotel_config['agent_number']}, Caller ID: {exotel_config['caller_id']}")

            # Get subdomain (api.exotel.com for Singapore or api.in.exotel.com for Mumbai)
            exotel_subdomain = exotel_config.get('subdomain', 'api.exotel.com')
            
            # Exotel API endpoint following official guide
            url = f"https://{exotel_subdomain}/v1/Accounts/{exotel_config['account_sid']}/Calls/connect.json"
            
            # Prepare call data according to Exotel integration guide
            call_data = {
                'From': exotel_config['agent_number'],  # Agent's number (will be called first)
                'To': call_request.lead.phone,         # Customer's number (will be called after agent answers)
                'CallerId': exotel_config['caller_id'], # Your registered ExoPhone (TRAI compliant)
                'Record': 'true',                       # Enable call recording
                'StatusCallback': exotel_config.get('webhook_url', ''),  # Webhook URL for status updates
                'StatusCallbackContentType': 'application/json',  # Request JSON webhooks
                'StatusCallbackEvents[0]': 'initiated',  # Call initiated
                'StatusCallbackEvents[1]': 'ringing',    # Call ringing
                'StatusCallbackEvents[2]': 'answered',   # Call answered
                'StatusCallbackEvents[3]': 'completed',   # Call completed
                'StatusCallbackEvents[4]': 'busy',       # Line busy
                'StatusCallbackEvents[5]': 'no-answer',  # No answer
                'StatusCallbackEvents[6]': 'failed',      # Call failed
                'CustomField': str(call_request.id)     # Track CRM record ID (simple string)
            }

            logger.info(f"Initiating Exotel call - From: {call_data['From']}, To: {call_data['To']}, CallerId: {call_data['CallerId']}")
            
            # Make API call
            response = requests.post(
                url,
                data=call_data,
                auth=(exotel_config['api_key'], exotel_config['api_token']),
                timeout=30
            )

            logger.info(f"Exotel API response - Status: {response.status_code}, Body: {response.text}")

            if response.status_code == 200:
                data = response.json()
                call_sid = data.get('Call', {}).get('Sid')
                bridge_url = data.get('Call', {}).get('BridgeUrl')
                
                logger.info(f"Exotel call initiated successfully - Call SID: {call_sid}")
                
                return {
                    'success': True,
                    'call_sid': call_sid,
                    'bridge_url': bridge_url,
                    'exotel_response': data
                }
            else:
                logger.error(f"Exotel API error: {response.status_code} - {response.text}")
                return {
                    'success': False,
                    'error': f'Exotel API error: {response.status_code} - {response.text}'
                }

        except requests.exceptions.RequestException as e:
            logger.error(f"Network error calling Exotel API: {str(e)}")
            return {'success': False, 'error': f'Network error: {str(e)}'}
        except Exception as e:
            logger.error(f"Error calling Exotel API: {str(e)}")
            return {'success': False, 'error': f'Unexpected error: {str(e)}'}

    def _end_exotel_call(self, call_request):
        """End call via Exotel API"""
        try:
            if not call_request.exotel_call_id:
                return {'success': False, 'error': 'No Exotel call ID'}

            exotel_config = getattr(settings, 'EXOTEL_CONFIG', {})
            
            if not exotel_config:
                return {'success': False, 'error': 'Exotel not configured'}

            # Exotel API endpoint
            url = f"https://api.exotel.com/v1/Accounts/{exotel_config['account_sid']}/Calls/{call_request.exotel_call_id}.json"
            
            # Make API call
            response = requests.post(
                url,
                data={'Status': 'completed'},
                auth=(exotel_config['api_key'], exotel_config['api_token']),
                timeout=30
            )

            if response.status_code == 200:
                return {'success': True}
            else:
                logger.error(f"Exotel API error: {response.status_code} - {response.text}")
                return {
                    'success': False,
                    'error': f'Exotel API error: {response.status_code}'
                }

        except Exception as e:
            logger.error(f"Error ending Exotel call: {str(e)}")
            return {'success': False, 'error': str(e)}

    def _control_exotel_call(self, call_request, action, params):
        """Control call via Exotel IP SDK (if implemented)"""
        # This would be implemented when using Exotel IP SDK
        # For now, return UI-only response
        return {
            'success': True,
            'message': f'{action} control is UI-only for PSTN calls'
        }

    @action(detail=False, methods=['post'])
    def test_exotel_config(self, request):
        """Test Exotel configuration without making actual calls"""
        try:
            exotel_config = getattr(settings, 'EXOTEL_CONFIG', {})
            
            # Check configuration
            required_fields = ['account_sid', 'api_key', 'api_token', 'agent_number', 'caller_id']
            missing_fields = [field for field in required_fields if not exotel_config.get(field)]
            
            if missing_fields:
                return Response({
                    'success': False,
                    'error': f'Exotel configuration incomplete. Missing: {missing_fields}',
                    'config_status': 'incomplete'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Test API connectivity (without making actual call)
            test_url = f"https://api.exotel.com/v1/Accounts/{exotel_config['account_sid']}/Calls.json"
            
            try:
                response = requests.get(
                    test_url,
                    auth=(exotel_config['api_key'], exotel_config['api_token']),
                    timeout=10
                )
                
                if response.status_code == 200:
                    return Response({
                        'success': True,
                        'message': 'Exotel configuration is valid and API is accessible',
                        'config_status': 'valid',
                        'account_sid': exotel_config['account_sid'][:10] + '...',
                        'agent_number': exotel_config['agent_number'],
                        'caller_id': exotel_config['caller_id']
                    })
                else:
                    return Response({
                        'success': False,
                        'error': f'Exotel API authentication failed: {response.status_code}',
                        'config_status': 'auth_failed'
                    }, status=status.HTTP_401_UNAUTHORIZED)
                    
            except requests.exceptions.RequestException as e:
                return Response({
                    'success': False,
                    'error': f'Network error connecting to Exotel: {str(e)}',
                    'config_status': 'network_error'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logger.error(f"Error testing Exotel config: {str(e)}")
            return Response({
                'success': False,
                'error': str(e),
                'config_status': 'error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
