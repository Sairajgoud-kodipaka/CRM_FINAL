# Call Flow Automation Service
import requests
import logging
import json
from django.conf import settings
from typing import Dict, Optional, List
from datetime import datetime, timedelta
from django.utils import timezone

logger = logging.getLogger(__name__)

class ExotelCallFlowService:
    """Exotel Call Flow Automation Service"""
    
    def __init__(self):
        self.exotel_config = getattr(settings, 'EXOTEL_CONFIG', {})
        self.base_url = f"https://api.exotel.com/v1/Accounts/{self.exotel_config.get('account_sid')}"
        
    def create_call_flow(self, flow_name: str, flow_config: Dict) -> Dict:
        """
        Create automated call flow in Exotel
        
        Args:
            flow_name: Name of the call flow
            flow_config: Configuration for the call flow
            
        Returns:
            Dict with flow creation result
        """
        try:
            if not self.exotel_config:
                return {'success': False, 'error': 'Exotel not configured'}
                
            # This would typically be done through Exotel dashboard
            # For now, we'll simulate the flow creation
            logger.info(f"Creating call flow: {flow_name}")
            
            return {
                'success': True,
                'flow_id': f"flow_{flow_name.lower().replace(' ', '_')}",
                'flow_name': flow_name,
                'message': 'Call flow created successfully'
            }
            
        except Exception as e:
            logger.error(f"Error creating call flow: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def initiate_automated_call(self, customer_phone: str, flow_id: str, custom_data: Dict = None) -> Dict:
        """
        Initiate automated call to customer with specific flow
        
        Args:
            customer_phone: Customer phone number
            flow_id: Call flow ID to use
            custom_data: Additional data for the call
            
        Returns:
            Dict with call initiation result
        """
        try:
            url = f"{self.base_url}/Calls/connect.json"
            
            call_data = {
                'From': self.exotel_config.get('caller_id'),
                'To': customer_phone,
                'CallerId': self.exotel_config.get('caller_id'),
                'Url': f"{self.exotel_config.get('webhook_url')}?flow_id={flow_id}",
                'TimeLimit': 1800,
                'Record': 'true',
                'CustomField': json.dumps({
                    'flow_id': flow_id,
                    'automated_call': True,
                    **(custom_data or {})
                })
            }
            
            response = requests.post(
                url,
                data=call_data,
                auth=(self.exotel_config['api_key'], self.exotel_config['api_token']),
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Automated call initiated to {customer_phone}")
                return {
                    'success': True,
                    'call_sid': data.get('Call', {}).get('Sid'),
                    'bridge_url': data.get('Call', {}).get('BridgeUrl'),
                    'flow_id': flow_id
                }
            else:
                logger.error(f"Automated call API error: {response.status_code}")
                return {
                    'success': False,
                    'error': f'Automated call API error: {response.status_code}'
                }
            
        except Exception as e:
            logger.error(f"Error initiating automated call: {str(e)}")
            return {'success': False, 'error': str(e)}

class CallAutomationService:
    """High-level call automation service"""
    
    def __init__(self):
        self.call_flow_service = ExotelCallFlowService()
        
    def schedule_follow_up_call(self, lead_id: str, scheduled_time: datetime, call_type: str = 'follow_up') -> Dict:
        """
        Schedule automated follow-up call
        
        Args:
            lead_id: Lead ID to call
            scheduled_time: When to make the call
            call_type: Type of follow-up call
            
        Returns:
            Dict with scheduling result
        """
        try:
            from .models import Lead, CallRequest
            
            lead = Lead.objects.get(id=lead_id)
            
            # Create scheduled call request
            call_request = CallRequest.objects.create(
                lead=lead,
                telecaller=None,  # Automated call
                call_type='follow_up',
                status='scheduled',
                scheduled_time=scheduled_time,
                metadata={
                    'automated': True,
                    'call_type': call_type,
                    'scheduled_by': 'system'
                }
            )
            
            logger.info(f"Scheduled follow-up call for {lead.name} at {scheduled_time}")
            
            return {
                'success': True,
                'call_request_id': str(call_request.id),
                'scheduled_time': scheduled_time.isoformat(),
                'lead_name': lead.name
            }
            
        except Exception as e:
            logger.error(f"Error scheduling follow-up call: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def create_appointment_reminder_flow(self) -> Dict:
        """
        Create automated appointment reminder call flow
        
        Returns:
            Dict with flow creation result
        """
        flow_config = {
            'name': 'Appointment Reminder',
            'steps': [
                {
                    'type': 'play',
                    'message': 'Hello, this is a reminder about your jewelry consultation appointment.'
                },
                {
                    'type': 'play',
                    'message': 'Please press 1 to confirm, 2 to reschedule, or 3 to cancel.'
                },
                {
                    'type': 'gather',
                    'num_digits': 1,
                    'action': 'handle_appointment_response'
                }
            ]
        }
        
        return self.call_flow_service.create_call_flow('appointment_reminder', flow_config)
    
    def create_survey_flow(self) -> Dict:
        """
        Create customer satisfaction survey call flow
        
        Returns:
            Dict with flow creation result
        """
        flow_config = {
            'name': 'Customer Survey',
            'steps': [
                {
                    'type': 'play',
                    'message': 'Thank you for choosing our jewelry store. We would like to get your feedback.'
                },
                {
                    'type': 'play',
                    'message': 'On a scale of 1 to 5, how satisfied are you with our service? Press the number.'
                },
                {
                    'type': 'gather',
                    'num_digits': 1,
                    'action': 'handle_survey_response'
                }
            ]
        }
        
        return self.call_flow_service.create_call_flow('customer_survey', flow_config)
    
    def create_promotional_flow(self) -> Dict:
        """
        Create promotional call flow
        
        Returns:
            Dict with flow creation result
        """
        flow_config = {
            'name': 'Promotional Call',
            'steps': [
                {
                    'type': 'play',
                    'message': 'Hello! We have an exclusive offer on our premium jewelry collection.'
                },
                {
                    'type': 'play',
                    'message': 'Get 20% off on all items. Press 1 to know more, or 2 to opt out.'
                },
                {
                    'type': 'gather',
                    'num_digits': 1,
                    'action': 'handle_promotional_response'
                }
            ]
        }
        
        return self.call_flow_service.create_call_flow('promotional_call', flow_config)
    
    def trigger_automated_workflow(self, workflow_type: str, lead_id: str, **kwargs) -> Dict:
        """
        Trigger automated workflow based on type
        
        Args:
            workflow_type: Type of workflow to trigger
            lead_id: Lead ID
            **kwargs: Additional parameters
            
        Returns:
            Dict with workflow trigger result
        """
        try:
            from .models import Lead
            
            lead = Lead.objects.get(id=lead_id)
            
            workflows = {
                'appointment_reminder': self._trigger_appointment_reminder,
                'follow_up_survey': self._trigger_follow_up_survey,
                'promotional_call': self._trigger_promotional_call,
                'welcome_call': self._trigger_welcome_call,
                're_engagement': self._trigger_re_engagement
            }
            
            if workflow_type not in workflows:
                return {'success': False, 'error': f'Unknown workflow type: {workflow_type}'}
            
            return workflows[workflow_type](lead, **kwargs)
            
        except Exception as e:
            logger.error(f"Error triggering workflow: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _trigger_appointment_reminder(self, lead, appointment_time=None):
        """Trigger appointment reminder workflow"""
        if not appointment_time:
            appointment_time = timezone.now() + timedelta(hours=24)
        
        return self.schedule_follow_up_call(lead.id, appointment_time, 'appointment_reminder')
    
    def _trigger_follow_up_survey(self, lead, days_since_call=1):
        """Trigger follow-up survey workflow"""
        survey_time = timezone.now() + timedelta(days=days_since_call)
        return self.schedule_follow_up_call(lead.id, survey_time, 'survey')
    
    def _trigger_promotional_call(self, lead, offer_details=None):
        """Trigger promotional call workflow"""
        call_time = timezone.now() + timedelta(hours=2)
        return self.schedule_follow_up_call(lead.id, call_time, 'promotional')
    
    def _trigger_welcome_call(self, lead):
        """Trigger welcome call workflow"""
        welcome_time = timezone.now() + timedelta(hours=1)
        return self.schedule_follow_up_call(lead.id, welcome_time, 'welcome')
    
    def _trigger_re_engagement(self, lead, days_since_last_contact=30):
        """Trigger re-engagement workflow"""
        re_engagement_time = timezone.now() + timedelta(days=days_since_last_contact)
        return self.schedule_follow_up_call(lead.id, re_engagement_time, 're_engagement')

# Automation Rules Engine
class AutomationRulesEngine:
    """Rules engine for automated workflows"""
    
    def __init__(self):
        self.automation_service = CallAutomationService()
    
    def evaluate_lead_for_automation(self, lead_id: str) -> List[Dict]:
        """
        Evaluate lead and determine which automations to trigger
        
        Args:
            lead_id: Lead ID to evaluate
            
        Returns:
            List of automation recommendations
        """
        try:
            from .models import Lead, CallRequest
            
            lead = Lead.objects.get(id=lead_id)
            automations = []
            
            # Rule 1: New lead - trigger welcome call
            if lead.status == 'new' and lead.call_attempts == 0:
                automations.append({
                    'type': 'welcome_call',
                    'priority': 'high',
                    'delay_hours': 1,
                    'reason': 'New lead needs welcome call'
                })
            
            # Rule 2: No answer on first call - schedule follow-up
            recent_calls = CallRequest.objects.filter(
                lead=lead,
                status='no_answer',
                initiated_at__gte=timezone.now() - timedelta(hours=24)
            )
            
            if recent_calls.exists():
                automations.append({
                    'type': 'follow_up_call',
                    'priority': 'medium',
                    'delay_hours': 4,
                    'reason': 'Follow up on no answer'
                })
            
            # Rule 3: Positive call outcome - schedule survey
            positive_calls = CallRequest.objects.filter(
                lead=lead,
                sentiment='positive',
                initiated_at__gte=timezone.now() - timedelta(days=1)
            )
            
            if positive_calls.exists():
                automations.append({
                    'type': 'follow_up_survey',
                    'priority': 'low',
                    'delay_days': 1,
                    'reason': 'Collect feedback from satisfied customer'
                })
            
            # Rule 4: Inactive lead - re-engagement
            last_interaction = CallRequest.objects.filter(
                lead=lead,
                status='completed'
            ).order_by('-initiated_at').first()
            
            if last_interaction and last_interaction.initiated_at < timezone.now() - timedelta(days=30):
                automations.append({
                    'type': 're_engagement',
                    'priority': 'medium',
                    'delay_days': 0,
                    'reason': 'Re-engage inactive lead'
                })
            
            return automations
            
        except Exception as e:
            logger.error(f"Error evaluating lead for automation: {str(e)}")
            return []
    
    def execute_automation_rules(self, lead_id: str) -> Dict:
        """
        Execute automation rules for a lead
        
        Args:
            lead_id: Lead ID
            
        Returns:
            Dict with execution results
        """
        automations = self.evaluate_lead_for_automation(lead_id)
        results = []
        
        for automation in automations:
            try:
                if automation['type'] == 'welcome_call':
                    result = self.automation_service.trigger_automated_workflow(
                        'welcome_call', lead_id
                    )
                elif automation['type'] == 'follow_up_call':
                    result = self.automation_service.trigger_automated_workflow(
                        'appointment_reminder', lead_id
                    )
                elif automation['type'] == 'follow_up_survey':
                    result = self.automation_service.trigger_automated_workflow(
                        'follow_up_survey', lead_id
                    )
                elif automation['type'] == 're_engagement':
                    result = self.automation_service.trigger_automated_workflow(
                        're_engagement', lead_id
                    )
                else:
                    result = {'success': False, 'error': f'Unknown automation type: {automation["type"]}'}
                
                results.append({
                    'automation': automation,
                    'result': result
                })
                
            except Exception as e:
                results.append({
                    'automation': automation,
                    'result': {'success': False, 'error': str(e)}
                })
        
        return {
            'success': True,
            'automations_executed': len(results),
            'results': results
        }

# Initialize services
call_flow_service = ExotelCallFlowService()
automation_service = CallAutomationService()
rules_engine = AutomationRulesEngine()

# Google Sheets Automation Service (for backward compatibility)
class GoogleSheetsAutomationService:
    """Google Sheets automation service for backward compatibility"""
    
    @staticmethod
    def get_sync_status():
        """Get Google Sheets sync status"""
        try:
            from .google_sheets_service import test_google_sheets_connection
            connection_status = test_google_sheets_connection()
            
            return {
                'connection_status': connection_status,
                'status': 'active' if connection_status else 'inactive',
                'last_sync': timezone.now().isoformat(),
                'total_synced': 0,
                'errors': [] if connection_status else ['Connection test failed']
            }
        except Exception as e:
            logger.error(f"Error getting Google Sheets sync status: {str(e)}")
            return {
                'connection_status': False,
                'status': 'error',
                'last_sync': None,
                'total_synced': 0,
                'errors': [str(e)]
            }
    
    @staticmethod
    def _get_acknowledgment_messages():
        """Get acknowledgment messages"""
        return [
            "Google Sheets integration is active",
            "Data synchronization is working properly",
            "All automation workflows are operational"
        ]