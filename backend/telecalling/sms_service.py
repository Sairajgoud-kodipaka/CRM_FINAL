# SMS Service for Exotel Integration
import requests
import logging
from django.conf import settings
from typing import Dict, Optional, List
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class ExotelSMSService:
    """Exotel SMS API integration service"""
    
    def __init__(self):
        self.exotel_config = getattr(settings, 'EXOTEL_CONFIG', {})
        self.base_url = f"https://api.exotel.com/v1/Accounts/{self.exotel_config.get('account_sid')}"
        
    def send_sms(self, to: str, message: str, from_number: Optional[str] = None) -> Dict:
        """
        Send SMS via Exotel API
        
        Args:
            to: Recipient phone number
            message: SMS message content
            from_number: Sender number (defaults to caller_id)
            
        Returns:
            Dict with success status and response data
        """
        try:
            if not self.exotel_config:
                return {'success': False, 'error': 'Exotel not configured'}
                
            url = f"{self.base_url}/Sms/send.json"
            
            sms_data = {
                'From': from_number or self.exotel_config.get('caller_id'),
                'To': to,
                'Body': message
            }
            
            response = requests.post(
                url,
                data=sms_data,
                auth=(self.exotel_config['api_key'], self.exotel_config['api_token']),
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"SMS sent successfully to {to}")
                return {
                    'success': True,
                    'sms_sid': data.get('SmsMessage', {}).get('Sid'),
                    'status': data.get('SmsMessage', {}).get('Status'),
                    'data': data
                }
            else:
                logger.error(f"SMS API error: {response.status_code} - {response.text}")
                return {
                    'success': False,
                    'error': f'SMS API error: {response.status_code}',
                    'response': response.text
                }
                
        except Exception as e:
            logger.error(f"Error sending SMS: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def send_post_call_sms(self, lead_phone: str, lead_name: str, call_outcome: str) -> Dict:
        """
        Send automated SMS after call completion
        
        Args:
            lead_phone: Customer phone number
            lead_name: Customer name
            call_outcome: Result of the call (positive, neutral, negative)
            
        Returns:
            Dict with SMS sending result
        """
        messages = {
            'positive': f"Hi {lead_name}! Thank you for your interest in our jewelry. We'll send you our latest collection details shortly. - Jewelry Store",
            'neutral': f"Hi {lead_name}! Thank you for your time today. We'll follow up with more information about our jewelry collection. - Jewelry Store",
            'negative': f"Hi {lead_name}! We understand you're not interested right now. We'll keep you updated about our special offers. - Jewelry Store"
        }
        
        message = messages.get(call_outcome, messages['neutral'])
        return self.send_sms(lead_phone, message)
    
    def send_appointment_reminder(self, phone: str, name: str, appointment_time: datetime) -> Dict:
        """
        Send appointment reminder SMS
        
        Args:
            phone: Customer phone number
            name: Customer name
            appointment_time: Scheduled appointment time
            
        Returns:
            Dict with SMS sending result
        """
        formatted_time = appointment_time.strftime("%B %d, %Y at %I:%M %p")
        message = f"Hi {name}! Reminder: Your jewelry consultation is scheduled for {formatted_time}. We look forward to meeting you! - Jewelry Store"
        
        return self.send_sms(phone, message)
    
    def send_follow_up_sms(self, phone: str, name: str, days_since_call: int) -> Dict:
        """
        Send follow-up SMS based on days since last call
        
        Args:
            phone: Customer phone number
            name: Customer name
            days_since_call: Number of days since last interaction
            
        Returns:
            Dict with SMS sending result
        """
        if days_since_call == 1:
            message = f"Hi {name}! Hope you had a chance to think about our jewelry collection. Any questions? We're here to help! - Jewelry Store"
        elif days_since_call == 3:
            message = f"Hi {name}! We have some exciting new jewelry pieces that might interest you. Would you like to see them? - Jewelry Store"
        elif days_since_call == 7:
            message = f"Hi {name}! We're offering a special discount on our jewelry collection this week. Don't miss out! - Jewelry Store"
        else:
            message = f"Hi {name}! We hope you're doing well. We have some beautiful new jewelry pieces. Would you like to know more? - Jewelry Store"
        
        return self.send_sms(phone, message)
    
    def send_bulk_sms(self, recipients: List[Dict], message_template: str) -> Dict:
        """
        Send bulk SMS to multiple recipients
        
        Args:
            recipients: List of dicts with 'phone' and 'name' keys
            message_template: SMS template with {name} placeholder
            
        Returns:
            Dict with bulk sending results
        """
        results = []
        success_count = 0
        
        for recipient in recipients:
            personalized_message = message_template.format(name=recipient['name'])
            result = self.send_sms(recipient['phone'], personalized_message)
            results.append({
                'phone': recipient['phone'],
                'name': recipient['name'],
                'success': result['success'],
                'error': result.get('error')
            })
            if result['success']:
                success_count += 1
        
        return {
            'success': success_count > 0,
            'total_sent': success_count,
            'total_recipients': len(recipients),
            'results': results
        }
    
    def get_sms_status(self, sms_sid: str) -> Dict:
        """
        Get SMS delivery status
        
        Args:
            sms_sid: SMS message ID from Exotel
            
        Returns:
            Dict with SMS status information
        """
        try:
            url = f"{self.base_url}/Sms/{sms_sid}.json"
            
            response = requests.get(
                url,
                auth=(self.exotel_config['api_key'], self.exotel_config['api_token']),
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'success': True,
                    'status': data.get('Status'),
                    'data': data
                }
            else:
                return {
                    'success': False,
                    'error': f'Status API error: {response.status_code}'
                }
                
        except Exception as e:
            logger.error(f"Error getting SMS status: {str(e)}")
            return {'success': False, 'error': str(e)}

# SMS Templates for different scenarios
SMS_TEMPLATES = {
    'post_call_positive': "Hi {name}! Thank you for your interest in our jewelry. We'll send you our latest collection details shortly. - Jewelry Store",
    'post_call_neutral': "Hi {name}! Thank you for your time today. We'll follow up with more information about our jewelry collection. - Jewelry Store",
    'post_call_negative': "Hi {name}! We understand you're not interested right now. We'll keep you updated about our special offers. - Jewelry Store",
    'appointment_reminder': "Hi {name}! Reminder: Your jewelry consultation is scheduled for {appointment_time}. We look forward to meeting you! - Jewelry Store",
    'follow_up_1_day': "Hi {name}! Hope you had a chance to think about our jewelry collection. Any questions? We're here to help! - Jewelry Store",
    'follow_up_3_days': "Hi {name}! We have some exciting new jewelry pieces that might interest you. Would you like to see them? - Jewelry Store",
    'follow_up_7_days': "Hi {name}! We're offering a special discount on our jewelry collection this week. Don't miss out! - Jewelry Store",
    'special_offer': "Hi {name}! Exclusive offer: 20% off on our premium jewelry collection. Valid until {expiry_date}. - Jewelry Store",
    'new_collection': "Hi {name}! Our new jewelry collection is here! Check out our latest designs. - Jewelry Store",
    'birthday_wish': "Hi {name}! Happy Birthday! Enjoy 15% off on your favorite jewelry today. - Jewelry Store"
}

# Initialize SMS service
sms_service = ExotelSMSService()

