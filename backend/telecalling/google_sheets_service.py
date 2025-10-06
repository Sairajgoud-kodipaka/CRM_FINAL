import os
import json
import logging
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from .models import Lead, WebhookLog
from django.contrib.auth import get_user_model
from django.db import transaction

logger = logging.getLogger(__name__)

User = get_user_model()


class GoogleSheetsService:
    """Service for Google Sheets integration"""
    
    def __init__(self):
        self.credentials = None
        self.service = None
        self.spreadsheet_id = None
        self._initialize_service()
    
    def _initialize_service(self):
        """Initialize Google Sheets service"""
        try:
            # Path to the service account key file
            key_file_path = os.path.join(settings.BASE_DIR.parent, 'jewellery-crm', 'mangatrai-6bc45a711bae.json')
            
            if not os.path.exists(key_file_path):
                logger.error(f"Google Sheets credentials file not found: {key_file_path}")
                return
            
            # Load credentials
            self.credentials = service_account.Credentials.from_service_account_file(
                key_file_path,
                scopes=['https://www.googleapis.com/auth/spreadsheets.readonly']
            )
            
            # Build service
            self.service = build('sheets', 'v4', credentials=self.credentials)
            
            # Get spreadsheet ID from settings or environment
            self.spreadsheet_id = getattr(settings, 'GOOGLE_SHEETS_ID', None)
            if not self.spreadsheet_id:
                logger.warning("GOOGLE_SHEETS_ID not configured")
            
        except Exception as e:
            logger.error(f"Failed to initialize Google Sheets service: {str(e)}")
    
    def _get_telecallers(self):
        """Get all active telecallers for round-robin assignment"""
        return User.objects.filter(role='tele_calling', is_active=True).order_by('id')
    
    def _assign_lead_round_robin(self, lead, telecallers):
        """Assign lead to telecaller using round-robin algorithm"""
        if not telecallers.exists():
            logger.warning("No active telecallers found for assignment")
            return None
        
        # Get the last assigned telecaller ID
        last_assigned = Lead.objects.filter(assigned_to__isnull=False).order_by('-assigned_at').first()
        
        if last_assigned and last_assigned.assigned_to:
            # Find next telecaller in round-robin
            telecaller_list = list(telecallers)
            try:
                current_index = next(i for i, t in enumerate(telecaller_list) if t.id == last_assigned.assigned_to.id)
                next_index = (current_index + 1) % len(telecaller_list)
                assigned_telecaller = telecaller_list[next_index]
            except StopIteration:
                # If last assigned telecaller is not in current list, start from first
                assigned_telecaller = telecaller_list[0]
        else:
            # First assignment, start with first telecaller
            assigned_telecaller = telecallers.first()
        
        return assigned_telecaller
    
    def sync_leads_from_sheets(self):
        """Sync leads from Google Sheets"""
        if not self.service or not self.spreadsheet_id:
            logger.error("Google Sheets service not initialized")
            return False
        
        try:
            # Log sync start
            webhook_log = WebhookLog.objects.create(
                webhook_type='google_sheets',
                payload={'action': 'sync_started'},
                status='received'
            )
            
            # Get data from sheets
            range_name = "Sheet1!A:Z"  # Adjust range as needed
            result = self.service.spreadsheets().values().get(
                spreadsheetId=self.spreadsheet_id,
                range=range_name
            ).execute()
            
            rows = result.get('values', [])
            if not rows:
                logger.warning("No data found in Google Sheets")
                webhook_log.status = 'failed'
                webhook_log.error_message = 'No data found'
                webhook_log.save()
                return False
            
            headers = rows[0] if rows else []
            logger.info(f"Found {len(rows)} rows in Google Sheets")
            
            # Get telecallers for assignment
            telecallers = self._get_telecallers()
            
            # Process each row with transaction
            leads_created = 0
            leads_updated = 0
            
            with transaction.atomic():
                for row in rows[1:]:  # Skip header
                    try:
                        # Create dictionary from row data
                        lead_data = dict(zip(headers, row))
                        
                        # Extract required fields
                        source_id = lead_data.get('created_time', '')  # Use created_time as unique ID
                        name = lead_data.get('full_name', '')
                        phone = lead_data.get('phone_number', '')
                        email = lead_data.get('Email', '')  # Not present in current data
                        city = lead_data.get('City', '')  # Not present in current data
                        source = lead_data.get('campaign_name', 'facebook_ads')  # Use campaign as source
                        
                        if not source_id or not name or not phone:
                            logger.warning(f"Skipping row with missing required fields: {lead_data}")
                            continue
                        
                        # Create or update lead with provenance
                        lead, created = Lead.objects.update_or_create(
                            source_id=source_id,
                            defaults={
                                'name': name,
                                'phone': phone,
                                'email': email,
                                'city': city,
                                'source': source,
                                'source_system': 'google_sheets',
                                'fetched_at': timezone.now(),
                                'raw_data': lead_data
                            }
                        )
                        
                        # Assign lead to telecaller if newly created
                        if created and telecallers.exists():
                            assigned_telecaller = self._assign_lead_round_robin(lead, telecallers)
                            if assigned_telecaller:
                                lead.assigned_to = assigned_telecaller
                                lead.assigned_at = timezone.now()
                                lead.save()
                                logger.info(f"Assigned lead {lead.name} to telecaller {assigned_telecaller.username}")
                        
                        if created:
                            leads_created += 1
                            logger.info(f"Created new lead: {name} ({phone})")
                        else:
                            leads_updated += 1
                            logger.info(f"Updated existing lead: {name} ({phone})")
                    
                    except Exception as e:
                        logger.error(f"Error processing row {row}: {str(e)}")
                        continue
            
            # Log successful sync
            webhook_log.status = 'processed'
            webhook_log.processed_at = timezone.now()
            webhook_log.save()
            
            logger.info(f"Sync completed: {leads_created} created, {leads_updated} updated")
            return True
            
        except HttpError as e:
            logger.error(f"Google Sheets API error: {str(e)}")
            webhook_log.status = 'failed'
            webhook_log.error_message = str(e)
            webhook_log.save()
            return False
        except Exception as e:
            logger.error(f"Unexpected error during sync: {str(e)}")
            webhook_log.status = 'failed'
            webhook_log.error_message = str(e)
            webhook_log.save()
            return False
    
    def get_sheet_data(self, range_name="Sheet1!A:Z"):
        """Get raw data from Google Sheets"""
        if not self.service or not self.spreadsheet_id:
            return None
        
        try:
            result = self.service.spreadsheets().values().get(
                spreadsheetId=self.spreadsheet_id,
                range=range_name
            ).execute()
            
            return result.get('values', [])
        except Exception as e:
            logger.error(f"Error getting sheet data: {str(e)}")
            return None
    
    def test_connection(self):
        """Test connection to Google Sheets"""
        if not self.service or not self.spreadsheet_id:
            return False
        
        try:
            # Try to get spreadsheet metadata
            result = self.service.spreadsheets().get(
                spreadsheetId=self.spreadsheet_id
            ).execute()
            
            logger.info(f"Connected to spreadsheet: {result.get('properties', {}).get('title', 'Unknown')}")
            return True
        except Exception as e:
            logger.error(f"Connection test failed: {str(e)}")
            return False


# Global instance
google_sheets_service = GoogleSheetsService()


def sync_leads_from_sheets():
    """Convenience function for syncing leads"""
    return google_sheets_service.sync_leads_from_sheets()


def test_google_sheets_connection():
    """Convenience function for testing connection"""
    return google_sheets_service.test_connection()
