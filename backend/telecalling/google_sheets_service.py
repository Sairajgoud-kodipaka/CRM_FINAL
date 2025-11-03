import os
import json
import logging
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
from decouple import config
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
        """
        Initialize Google Sheets service with secure credential loading.
        
        Priority order (most secure first):
        1. GOOGLE_SHEETS_CREDENTIALS_JSON environment variable (production - recommended)
        2. File-based credentials in /etc/secrets/ (production server)
        3. Local development file paths (development only)
        
        Security Note: Credential files are gitignored and should NEVER be committed.
        """
        try:
            # Priority 1: Try environment variable first (production - most secure)
            google_credentials_json = config('GOOGLE_SHEETS_CREDENTIALS_JSON', default=None)
            
            if google_credentials_json:
                try:
                    # Use credentials from environment variable (production best practice)
                    credentials_info = json.loads(google_credentials_json)
                    self.credentials = service_account.Credentials.from_service_account_info(
                        credentials_info,
                        scopes=['https://www.googleapis.com/auth/spreadsheets.readonly']
                    )
                    logger.info("Google Sheets credentials loaded from environment variable (GOOGLE_SHEETS_CREDENTIALS_JSON)")
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse GOOGLE_SHEETS_CREDENTIALS_JSON: {str(e)}")
                    return
                except Exception as e:
                    logger.error(f"Failed to load credentials from environment variable: {str(e)}")
                    return
            else:
                # Priority 2 & 3: Fallback to file-based credentials (development or server-specific)
                # Check production server secrets path first
                render_secret_path = '/etc/secrets/mangatrai-6bc45a711bae.json'
                
                if os.path.exists(render_secret_path):
                    key_file_path = render_secret_path
                    logger.info(f"Using production secrets path: {render_secret_path}")
                else:
                    # Priority 3: Local development paths (gitignored - safe for local dev)
                    new_json_path = os.path.join(settings.BASE_DIR.parent, 'crmsales-475507-247bd72ab136.json')
                    old_json_path = os.path.join(settings.BASE_DIR.parent, 'jewellery-crm', 'mangatrai-6bc45a711bae.json')
                    
                    if os.path.exists(new_json_path):
                        key_file_path = new_json_path
                        logger.info(f"Using local development credentials: {new_json_path}")
                    elif os.path.exists(old_json_path):
                        key_file_path = old_json_path
                        logger.info(f"Using local development credentials: {old_json_path}")
                    else:
                        # File doesn't exist - log warning but don't fail immediately
                        logger.warning(
                            f"Google Sheets credentials not found. Tried:\n"
                            f"  - Environment variable: GOOGLE_SHEETS_CREDENTIALS_JSON\n"
                            f"  - Production path: {render_secret_path}\n"
                            f"  - Local paths: {new_json_path}, {old_json_path}\n"
                            f"Google Sheets integration will be disabled. "
                            f"For production, set GOOGLE_SHEETS_CREDENTIALS_JSON environment variable. "
                            f"For development, place credentials file at one of the paths above (file is gitignored)."
                        )
                        return
                
                # Verify file exists and is readable before attempting to load
                if not os.path.exists(key_file_path):
                    logger.error(f"Credentials file not found: {key_file_path}")
                    return
                
                if not os.access(key_file_path, os.R_OK):
                    logger.error(f"Credentials file is not readable: {key_file_path}")
                    return
                
                try:
                    # Load credentials from file
                    self.credentials = service_account.Credentials.from_service_account_file(
                        key_file_path,
                        scopes=['https://www.googleapis.com/auth/spreadsheets.readonly']
                    )
                    logger.info(f"Google Sheets credentials loaded from file: {key_file_path}")
                except Exception as e:
                    logger.error(f"Failed to load credentials from file {key_file_path}: {str(e)}")
                    return
            
            # Build Google Sheets API service
            if not self.credentials:
                logger.error("No valid credentials available for Google Sheets service")
                return
                
            self.service = build('sheets', 'v4', credentials=self.credentials)
            
            # Get spreadsheet ID from settings or environment
            self.spreadsheet_id = getattr(settings, 'GOOGLE_SHEETS_ID', None)
            self.spreadsheet_ids = getattr(settings, 'GOOGLE_SHEETS_IDS', [])
            
            if not self.spreadsheet_id and not self.spreadsheet_ids:
                logger.warning("GOOGLE_SHEETS_ID not configured - Google Sheets sync will not work")
            elif self.spreadsheet_ids and not self.spreadsheet_id:
                # Use the first sheet ID if multiple are configured
                self.spreadsheet_id = self.spreadsheet_ids[0]
                logger.info(f"Using first spreadsheet ID from GOOGLE_SHEETS_IDS: {self.spreadsheet_id}")
            
            logger.info("Google Sheets service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Google Sheets service: {str(e)}", exc_info=True)
    
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
    
    def sync_leads_from_sheets(self, sheet_id=None):
        """Sync leads from Google Sheets (OPTIMIZED VERSION)"""
        if not self.service:
            logger.error("Google Sheets service not initialized")
            return False
        
        # Use provided sheet_id or default to configured one
        target_sheet_id = sheet_id or self.spreadsheet_id
        if not target_sheet_id:
            logger.error("No Google Sheet ID configured")
            return False
        
        try:
            # Log sync start
            webhook_log = WebhookLog.objects.create(
                webhook_type='google_sheets',
                payload={'action': 'sync_started'},
                status='received',
                error_message=''
            )
            
            # Get data from sheets with full range to include customer data
            # Try different range formats to handle various sheet structures
            range_formats = [
                "A:Z",  # Without sheet name (working format)
                "A1:Z100",  # Without sheet name, with row numbers
                "Sheet1!A:J",  # Original format
                "Sheet1!A:Z",  # Wider range
                "Sheet1!A1:Z100",  # With explicit row numbers
            ]
            
            result = None
            working_range = None
            
            for range_name in range_formats:
                try:
                    result = self.service.spreadsheets().values().get(
                        spreadsheetId=target_sheet_id,
                        range=range_name
                    ).execute()
                    working_range = range_name
                    logger.info(f"Successfully accessed sheet with range: {range_name}")
                    break
                except Exception as e:
                    logger.warning(f"Range {range_name} failed: {str(e)}")
                    continue
            
            if not result:
                logger.error("All range formats failed. Please check your sheet structure.")
                webhook_log.status = 'failed'
                webhook_log.error_message = 'Unable to access sheet with any range format'
                webhook_log.save()
                return False
            
            rows = result.get('values', [])
            if not rows:
                logger.warning("No data found in Google Sheets")
                webhook_log.status = 'failed'
                webhook_log.error_message = 'No data found'
                webhook_log.save()
                return False
            
            headers = rows[0] if rows else []
            logger.info(f"Found {len(rows)} rows in Google Sheets")
            logger.info(f"Headers found: {headers}")
            
            # Debug: Log first few rows to understand data structure
            for i, row in enumerate(rows[:3]):  # Log first 3 rows
                logger.info(f"Row {i}: {row}")
            
            # Get telecallers for assignment (cache this)
            telecallers = self._get_telecallers()
            telecaller_list = list(telecallers) if telecallers.exists() else []
            
            # Get existing leads to avoid duplicate queries
            existing_source_ids = set(Lead.objects.filter(
                source_system='google_sheets'
            ).values_list('source_id', flat=True))
            
            # Prepare batch data
            leads_to_create = []
            leads_to_update = []
            current_telecaller_index = 0
            
            # Process data in memory first
            for row in rows[1:]:  # Skip header
                try:
                    # Create dictionary from row data
                    lead_data = dict(zip(headers, row))
                    
                    # Extract required fields with flexible column name matching
                    # Try different possible column names for each field
                    source_id = (
                        lead_data.get('created_time', '') or 
                        lead_data.get('timestamp', '') or 
                        lead_data.get('id', '') or
                        str(timezone.now().timestamp())  # Fallback to current timestamp
                    )
                    
                    # Extract actual customer data from Google Sheets
                    # Prioritize full_name from Google Sheets
                    name = (
                        lead_data.get('full_name', '') or 
                        lead_data.get('name', '') or 
                        lead_data.get('customer_name', '') or
                        lead_data.get('Name', '') or
                        lead_data.get('Full Name', '') or
                        lead_data.get('ad_name', '') or  # Use ad name as fallback
                        f"Lead from {lead_data.get('campaign_name', 'Campaign')}"  # Create synthetic name
                    )
                    
                    phone = (
                        lead_data.get('phone_number', '') or 
                        lead_data.get('phone', '') or 
                        lead_data.get('mobile', '') or
                        lead_data.get('Phone', '') or
                        lead_data.get('Phone Number', '') or
                        lead_data.get('Mobile', '') or
                        f"9999{str(hash(source_id))[-6:]}"  # Generate synthetic phone number
                    )
                    
                    email = (
                        lead_data.get('Email', '') or 
                        lead_data.get('email', '') or 
                        lead_data.get('Email Address', '')
                    )
                    
                    city = (
                        lead_data.get('City', '') or 
                        lead_data.get('city', '') or 
                        lead_data.get('location', '') or
                        lead_data.get('Timeline', '') or  # Use Timeline as city fallback
                        'Unknown'
                    )
                    
                    source = (
                        lead_data.get('campaign_name', '') or 
                        lead_data.get('source', '') or 
                        lead_data.get('campaign', '') or
                        lead_data.get('adset_name', '') or  # Use adset name as source
                        'google_sheets'  # Default source
                    )
                    
                    # Debug logging
                    logger.info(f"Processing lead: name='{name}', phone='{phone}', source_id='{source_id}'")
                    logger.info(f"Available columns: {list(lead_data.keys())}")
                    
                    if not source_id or not name or not phone:
                        logger.warning(f"Skipping row due to missing required fields: source_id='{source_id}', name='{name}', phone='{phone}'")
                        continue
                    
                    # Prepare lead data
                    lead_fields = {
                        'name': name,
                        'phone': phone,
                        'email': email,
                        'city': city,
                        'source': source,
                        'source_system': 'google_sheets',
                        'fetched_at': timezone.now(),
                        'raw_data': lead_data
                    }
                    
                    if source_id in existing_source_ids:
                        # Update existing lead
                        leads_to_update.append({
                            'source_id': source_id,
                            'fields': lead_fields
                        })
                    else:
                        # Create new lead with assignment
                        if telecaller_list:
                            assigned_telecaller = telecaller_list[current_telecaller_index % len(telecaller_list)]
                            current_telecaller_index += 1
                            lead_fields['assigned_to'] = assigned_telecaller
                            lead_fields['assigned_at'] = timezone.now()
                        
                        leads_to_create.append({
                            'source_id': source_id,
                            'fields': lead_fields
                        })
                
                except Exception as e:
                    logger.error(f"Error processing row {row}: {str(e)}")
                    continue
            
            # Batch create/update leads
            leads_created = 0
            leads_updated = 0
            
            with transaction.atomic():
                # Batch create new leads
                if leads_to_create:
                    lead_objects = []
                    for lead_data in leads_to_create:
                        lead_objects.append(Lead(
                            source_id=lead_data['source_id'],
                            **lead_data['fields']
                        ))
                    
                    Lead.objects.bulk_create(lead_objects, batch_size=100)
                    leads_created = len(lead_objects)
                
                # Batch update existing leads
                if leads_to_update:
                    for lead_data in leads_to_update:
                        Lead.objects.filter(source_id=lead_data['source_id']).update(
                            **lead_data['fields']
                        )
                    leads_updated = len(leads_to_update)
            
            # Log successful sync
            webhook_log.status = 'processed'
            webhook_log.processed_at = timezone.now()
            webhook_log.save()
            
            logger.info(f"OPTIMIZED Sync completed: {leads_created} created, {leads_updated} updated")
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
        """Test connection to Google Sheets and show sample data"""
        if not self.service or not self.spreadsheet_id:
            return False
        
        try:
            # Try to get spreadsheet metadata
            result = self.service.spreadsheets().get(
                spreadsheetId=self.spreadsheet_id
            ).execute()
            
            logger.info(f"Connected to spreadsheet: {result.get('properties', {}).get('title', 'Unknown')}")
            
            # Also get sample data to help debug - try different range formats
            range_formats = [
                "Sheet1!A:Z",  # Wider range
                "Sheet1!A1:Z100",  # With explicit row numbers
                "A:Z",  # Without sheet name
                "A1:Z100",  # Without sheet name, with row numbers
            ]
            
            data_result = None
            working_range = None
            
            for range_name in range_formats:
                try:
                    data_result = self.service.spreadsheets().values().get(
                        spreadsheetId=self.spreadsheet_id,
                        range=range_name
                    ).execute()
                    working_range = range_name
                    logger.info(f"Successfully accessed sheet data with range: {range_name}")
                    break
                except Exception as e:
                    logger.warning(f"Range {range_name} failed: {str(e)}")
                    continue
            
            if not data_result:
                logger.warning("Could not access sheet data with any range format")
                return True  # Connection is still successful, just can't read data
            
            rows = data_result.get('values', [])
            if rows:
                logger.info(f"Sample data from Google Sheets:")
                logger.info(f"Headers: {rows[0] if rows else 'No headers'}")
                logger.info(f"First data row: {rows[1] if len(rows) > 1 else 'No data rows'}")
                logger.info(f"Total rows: {len(rows)}")
            
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
