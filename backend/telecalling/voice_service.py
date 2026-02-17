# Voice Automation Service for Exotel
import requests
import logging
import json
from django.conf import settings
from typing import Dict, Optional, List
from datetime import datetime, timedelta
from django.utils import timezone

logger = logging.getLogger(__name__)

class ExotelVoiceService:
    """Exotel Voice Automation Service"""
    
    def __init__(self):
        self.exotel_config = getattr(settings, 'EXOTEL_CONFIG', {})
        self.base_url = f"https://api.exotel.com/v1/Accounts/{self.exotel_config.get('account_sid')}"
        
    def convert_text_to_speech(self, text: str, voice_type: str = 'female', language: str = 'en-IN') -> Dict:
        """
        Convert text to high-quality speech using Exotel's voice synthesis
        
        Args:
            text: Text to convert to speech
            voice_type: Type of voice (male, female)
            language: Language code (en-IN, hi-IN, etc.)
            
        Returns:
            Dict with TTS result
        """
        try:
            if not self.exotel_config:
                return {'success': False, 'error': 'Exotel not configured'}
            
            # Exotel TTS API endpoint
            url = f"{self.base_url}/Tts/synthesize.json"
            
            tts_data = {
                'Text': text,
                'Voice': voice_type,
                'Language': language,
                'Speed': 'normal',
                'Pitch': 'normal'
            }
            
            response = requests.post(
                url,
                data=tts_data,
                auth=(self.exotel_config['api_key'], self.exotel_config['api_token']),
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                logger.info(
                    "backend telecalling.tts.convert.success note=tts conversion successful",
                )
                return {
                    'success': True,
                    'audio_url': data.get('AudioUrl'),
                    'duration': data.get('Duration'),
                    'text': text,
                    'voice_type': voice_type
                }
            else:
                logger.error(
                    "backend telecalling.tts.api_error status=%s note=tts api returned non-200 status",
                    response.status_code,
                )
                return {
                    'success': False,
                    'error': f'TTS API error: {response.status_code}',
                    'response': response.text
                }
                
        except Exception as e:
            logger.error(f"Error converting text to speech: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def send_voice_message(self, phone: str, text: str, voice_type: str = 'female') -> Dict:
        """
        Send voice message to phone number
        
        Args:
            phone: Recipient phone number
            text: Text to convert and send as voice
            voice_type: Type of voice to use
            
        Returns:
            Dict with voice message result
        """
        try:
            # First convert text to speech
            tts_result = self.convert_text_to_speech(text, voice_type)
            
            if not tts_result['success']:
                return tts_result
            
            # Then initiate call with voice message
            url = f"{self.base_url}/Calls/connect.json"
            
            call_data = {
                'From': self.exotel_config.get('caller_id'),
                'To': phone,
                'CallerId': self.exotel_config.get('caller_id'),
                'Url': tts_result['audio_url'],  # Play the generated audio
                'TimeLimit': 300,  # 5 minutes max for voice messages
                'Record': 'false'
            }
            
            response = requests.post(
                url,
                data=call_data,
                auth=(self.exotel_config['api_key'], self.exotel_config['api_token']),
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Voice message sent to {phone}")
                return {
                    'success': True,
                    'call_sid': data.get('Call', {}).get('Sid'),
                    'audio_url': tts_result['audio_url'],
                    'duration': tts_result['duration'],
                    'phone': phone
                }
            else:
                logger.error(f"Voice message API error: {response.status_code}")
                return {
                    'success': False,
                    'error': f'Voice message API error: {response.status_code}'
                }
                
        except Exception as e:
            logger.error(f"Error sending voice message: {str(e)}")
            return {'success': False, 'error': str(e)}

class VoiceAutomationService:
    """High-level voice automation service"""
    
    def __init__(self):
        self.voice_service = ExotelVoiceService()
        
    def send_appointment_reminder_voice(self, phone: str, name: str, appointment_time: datetime) -> Dict:
        """
        Send appointment reminder as voice message
        
        Args:
            phone: Customer phone number
            name: Customer name
            appointment_time: Scheduled appointment time
            
        Returns:
            Dict with voice message result
        """
        formatted_time = appointment_time.strftime("%B %d, %Y at %I:%M %p")
        
        message = f"""
        Hello {name}, this is a reminder from Jewelry Store. 
        Your jewelry consultation appointment is scheduled for {formatted_time}. 
        We look forward to meeting you. 
        If you need to reschedule, please call us back. 
        Thank you and have a great day!
        """
        
        return self.voice_service.send_voice_message(phone, message.strip())
    
    def send_follow_up_voice(self, phone: str, name: str, call_outcome: str) -> Dict:
        """
        Send follow-up voice message based on call outcome
        
        Args:
            phone: Customer phone number
            name: Customer name
            call_outcome: Result of previous call
            
        Returns:
            Dict with voice message result
        """
        messages = {
            'positive': f"""
            Hello {name}, thank you for your interest in our jewelry collection. 
            We're excited to show you our latest designs. 
            We'll be in touch soon with more details. 
            Have a wonderful day!
            """,
            'neutral': f"""
            Hello {name}, thank you for your time today. 
            We have some beautiful jewelry pieces that might interest you. 
            We'll follow up with more information soon. 
            Thank you!
            """,
            'negative': f"""
            Hello {name}, we understand you're not interested right now. 
            We'll keep you updated about our special offers and new collections. 
            Thank you for your time. Have a great day!
            """
        }
        
        message = messages.get(call_outcome, messages['neutral'])
        return self.voice_service.send_voice_message(phone, message.strip())
    
    def send_special_offer_voice(self, phone: str, name: str, offer_details: Dict) -> Dict:
        """
        Send special offer as voice message
        
        Args:
            phone: Customer phone number
            name: Customer name
            offer_details: Offer information
            
        Returns:
            Dict with voice message result
        """
        discount = offer_details.get('discount', '20')
        expiry_date = offer_details.get('expiry_date', 'this week')
        
        message = f"""
        Hello {name}, we have an exclusive offer for you! 
        Get {discount} percent off on our premium jewelry collection. 
        This offer is valid until {expiry_date}. 
        Don't miss out on this amazing deal! 
        Call us now to know more. Thank you!
        """
        
        return self.voice_service.send_voice_message(phone, message.strip())
    
    def send_birthday_wish_voice(self, phone: str, name: str) -> Dict:
        """
        Send birthday wish as voice message
        
        Args:
            phone: Customer phone number
            name: Customer name
            
        Returns:
            Dict with voice message result
        """
        message = f"""
        Hello {name}, happy birthday! 
        We hope you have a wonderful day filled with joy and happiness. 
        As a special birthday gift, enjoy 15 percent off on your favorite jewelry today. 
        Visit our store or call us to redeem this offer. 
        Once again, happy birthday!
        """
        
        return self.voice_service.send_voice_message(phone, message.strip())
    
    def send_payment_reminder_voice(self, phone: str, name: str, amount: float, due_date: datetime) -> Dict:
        """
        Send payment reminder as voice message
        
        Args:
            phone: Customer phone number
            name: Customer name
            amount: Outstanding amount
            due_date: Payment due date
            
        Returns:
            Dict with voice message result
        """
        formatted_date = due_date.strftime("%B %d, %Y")
        
        message = f"""
        Hello {name}, this is a friendly reminder from Jewelry Store. 
        You have an outstanding payment of {amount} rupees due on {formatted_date}. 
        Please make the payment at your earliest convenience. 
        If you have already made the payment, please ignore this message. 
        Thank you for your business!
        """
        
        return self.voice_service.send_voice_message(phone, message.strip())
    
    def send_survey_voice(self, phone: str, name: str) -> Dict:
        """
        Send customer satisfaction survey as voice message
        
        Args:
            phone: Customer phone number
            name: Customer name
            
        Returns:
            Dict with voice message result
        """
        message = f"""
        Hello {name}, we hope you're doing well. 
        We would love to get your feedback about our jewelry and service. 
        Please take a moment to rate us on a scale of 1 to 5. 
        Press 1 for excellent, 2 for good, 3 for average, 4 for poor, or 5 for very poor. 
        Your feedback helps us serve you better. Thank you!
        """
        
        return self.voice_service.send_voice_message(phone, message.strip())
    
    def send_bulk_voice_messages(self, recipients: List[Dict], message_template: str, voice_type: str = 'female') -> Dict:
        """
        Send bulk voice messages
        
        Args:
            recipients: List of dicts with 'phone' and 'name' keys
            message_template: Voice message template with {name} placeholder
            voice_type: Type of voice to use
            
        Returns:
            Dict with bulk sending results
        """
        results = []
        success_count = 0
        
        for recipient in recipients:
            personalized_message = message_template.format(name=recipient['name'])
            result = self.voice_service.send_voice_message(
                recipient['phone'], 
                personalized_message, 
                voice_type
            )
            results.append({
                'phone': recipient['phone'],
                'name': recipient['name'],
                'success': result['success'],
                'error': result.get('error'),
                'call_sid': result.get('call_sid')
            })
            if result['success']:
                success_count += 1
        
        return {
            'success': success_count > 0,
            'total_sent': success_count,
            'total_recipients': len(recipients),
            'results': results
        }

# Voice Templates
VOICE_TEMPLATES = {
    'appointment_reminder': """
    Hello {name}, this is a reminder from Jewelry Store. 
    Your jewelry consultation appointment is scheduled for {appointment_time}. 
    We look forward to meeting you. 
    If you need to reschedule, please call us back. 
    Thank you and have a great day!
    """,
    'follow_up_positive': """
    Hello {name}, thank you for your interest in our jewelry collection. 
    We're excited to show you our latest designs. 
    We'll be in touch soon with more details. 
    Have a wonderful day!
    """,
    'follow_up_neutral': """
    Hello {name}, thank you for your time today. 
    We have some beautiful jewelry pieces that might interest you. 
    We'll follow up with more information soon. 
    Thank you!
    """,
    'special_offer': """
    Hello {name}, we have an exclusive offer for you! 
    Get {discount} percent off on our premium jewelry collection. 
    This offer is valid until {expiry_date}. 
    Don't miss out on this amazing deal! 
    Call us now to know more. Thank you!
    """,
    'birthday_wish': """
    Hello {name}, happy birthday! 
    We hope you have a wonderful day filled with joy and happiness. 
    As a special birthday gift, enjoy 15 percent off on your favorite jewelry today. 
    Visit our store or call us to redeem this offer. 
    Once again, happy birthday!
    """,
    'payment_reminder': """
    Hello {name}, this is a friendly reminder from Jewelry Store. 
    You have an outstanding payment of {amount} rupees due on {due_date}. 
    Please make the payment at your earliest convenience. 
    If you have already made the payment, please ignore this message. 
    Thank you for your business!
    """,
    'customer_survey': """
    Hello {name}, we hope you're doing well. 
    We would love to get your feedback about our jewelry and service. 
    Please take a moment to rate us on a scale of 1 to 5. 
    Press 1 for excellent, 2 for good, 3 for average, 4 for poor, or 5 for very poor. 
    Your feedback helps us serve you better. Thank you!
    """
}

# Initialize voice service
voice_service = ExotelVoiceService()
voice_automation_service = VoiceAutomationService()

