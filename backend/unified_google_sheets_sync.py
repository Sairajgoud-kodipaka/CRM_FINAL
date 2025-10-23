#!/usr/bin/env python3
"""
Unified Google Sheets Integration Script
========================================

This script provides a clean, read-only integration with Google Sheets for CRM lead management.
It fetches leads from Google Sheets and assigns them to telecallers using balanced algorithms.

Features:
- Read-only Google Sheets access
- Balanced lead assignment
- Comprehensive logging
- Assignment integrity checking
- No write operations to Google Sheets

Usage:
    python unified_google_sheets_sync.py [--test-connection] [--dry-run]
"""

import os
import sys
import json
import logging
import argparse
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from django.conf import settings
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model
from decouple import config
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Import models
from telecalling.models import Lead, WebhookLog
from telecalling.lead_assignment_service import AdvancedLeadAssignmentService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('google_sheets_sync.log')
    ]
)
logger = logging.getLogger(__name__)

User = get_user_model()


@dataclass
class SyncResult:
    """Result of a sync operation"""
    success: bool
    leads_found: int
    telecallers_found: int
    leads_assigned: int
    assignment_ratio: float
    assignment_integrity: str
    api_status: str
    error_message: Optional[str] = None
    execution_time: float = 0.0


class GoogleSheetsReader:
    """Read-only Google Sheets service"""
    
    def __init__(self):
        self.service = None
        self.spreadsheet_id = None
        self._initialize_service()
    
    def _initialize_service(self) -> bool:
        """Initialize Google Sheets service with read-only credentials"""
        try:
            # Try environment variable first (production)
            google_credentials_json = config('GOOGLE_SHEETS_CREDENTIALS_JSON', default=None)
            
            if google_credentials_json:
                credentials_info = json.loads(google_credentials_json)
                self.credentials = service_account.Credentials.from_service_account_info(
                    credentials_info,
                    scopes=['https://www.googleapis.com/auth/spreadsheets.readonly']
                )
            else:
                # Fallback to file-based credentials (development)
                credential_paths = [
                    '/etc/secrets/mangatrai-6bc45a711bae.json',
                    os.path.join(settings.BASE_DIR.parent, 'crmsales-475507-247bd72ab136.json'),
                    os.path.join(settings.BASE_DIR.parent, 'jewellery-crm', 'mangatrai-6bc45a711bae.json')
                ]
                
                key_file_path = None
                for path in credential_paths:
                    if os.path.exists(path):
                        key_file_path = path
                        break
                
                if not key_file_path:
                    logger.error("Google Sheets credentials not found")
                    return False
                
                self.credentials = service_account.Credentials.from_service_account_file(
                    key_file_path,
                    scopes=['https://www.googleapis.com/auth/spreadsheets.readonly']
                )
            
            # Build service
            self.service = build('sheets', 'v4', credentials=self.credentials)
            
            # Get spreadsheet ID
            self.spreadsheet_id = getattr(settings, 'GOOGLE_SHEETS_ID', None)
            if not self.spreadsheet_id:
                logger.warning("GOOGLE_SHEETS_ID not configured")
                return False
            
            logger.info("Google Sheets service initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize Google Sheets service: {str(e)}")
            return False
    
    def test_connection(self) -> Tuple[bool, str]:
        """Test connection to Google Sheets"""
        if not self.service or not self.spreadsheet_id:
            return False, "Service not initialized"
        
        try:
            # Test with metadata request
            result = self.service.spreadsheets().get(
                spreadsheetId=self.spreadsheet_id
            ).execute()
            
            title = result.get('properties', {}).get('title', 'Unknown')
            logger.info(f"Connected to spreadsheet: {title}")
            return True, f"Connected to '{title}'"
            
        except HttpError as e:
            error_msg = f"Google Sheets API error: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
        except Exception as e:
            error_msg = f"Connection test failed: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
    
    def fetch_leads_data(self) -> Tuple[bool, List[Dict], str]:
        """Fetch leads data from Google Sheets"""
        if not self.service or not self.spreadsheet_id:
            return False, [], "Service not initialized"
        
        try:
            # Try different range formats
            range_formats = [
                "A:Z",  # Full range without sheet name
                "Sheet1!A:Z",  # With sheet name
                "A1:Z1000",  # With explicit rows
                "Sheet1!A1:Z1000"  # With sheet name and rows
            ]
            
            result = None
            working_range = None
            
            for range_name in range_formats:
                try:
                    result = self.service.spreadsheets().values().get(
                        spreadsheetId=self.spreadsheet_id,
                        range=range_name
                    ).execute()
                    working_range = range_name
                    logger.info(f"Successfully accessed sheet with range: {range_name}")
                    break
                except Exception as e:
                    logger.warning(f"Range {range_name} failed: {str(e)}")
                    continue
            
            if not result:
                return False, [], "Unable to access sheet with any range format"
            
            rows = result.get('values', [])
            if not rows:
                return False, [], "No data found in Google Sheets"
            
            # Convert to list of dictionaries
            headers = rows[0] if rows else []
            leads_data = []
            
            for row in rows[1:]:  # Skip header
                if len(row) > 0:  # Skip empty rows
                    lead_data = dict(zip(headers, row))
                    leads_data.append(lead_data)
            
            logger.info(f"Fetched {len(leads_data)} leads from Google Sheets")
            return True, leads_data, f"Successfully fetched {len(leads_data)} leads"
            
        except HttpError as e:
            error_msg = f"Google Sheets API error: {str(e)}"
            logger.error(error_msg)
            return False, [], error_msg
        except Exception as e:
            error_msg = f"Error fetching leads: {str(e)}"
            logger.error(error_msg)
            return False, [], error_msg


class LeadAssignmentService:
    """Service for assigning leads to telecallers using advanced algorithms"""
    
    def __init__(self):
        self.advanced_service = AdvancedLeadAssignmentService()
        self.telecallers = self._get_active_telecallers()
    
    def _get_active_telecallers(self) -> List[User]:
        """Get all active telecallers"""
        return list(User.objects.filter(
            role='tele_calling', 
            is_active=True
        ).order_by('id'))
    
    def get_telecallers_count(self) -> int:
        """Get count of active telecallers"""
        return len(self.telecallers)
    
    def assign_leads_balanced(self, leads_data: List[Dict]) -> Tuple[int, str]:
        """
        Assign leads to telecallers using advanced round-robin algorithm
        
        Returns:
            Tuple of (assigned_count, integrity_status)
        """
        if not self.telecallers:
            logger.warning("No active telecallers found")
            return 0, "no_telecallers"
        
        if not leads_data:
            logger.warning("No leads data to assign")
            return 0, "no_leads"
        
        try:
            # Use advanced round-robin assignment
            result = self.advanced_service.assign_leads_round_robin(leads_data)
            
            if result.success:
                logger.info(f"Advanced assignment completed: {result.leads_assigned} leads assigned using {result.assignment_method}")
                
                # Log assignment distribution
                for telecaller_id, count in result.telecaller_distribution.items():
                    if count > 0:
                        logger.info(f"Telecaller {telecaller_id}: {count} leads assigned")
                
                # Determine integrity status
                if result.leads_assigned == len(leads_data):
                    integrity_status = "perfect"
                elif result.leads_assigned > 0:
                    integrity_status = "partial"
                else:
                    integrity_status = "no_assignments"
                
                return result.leads_assigned, integrity_status
            else:
                logger.error(f"Advanced assignment failed: {result.error_message}")
                return 0, "assignment_error"
                
        except Exception as e:
            logger.error(f"Error in advanced lead assignment: {str(e)}")
            return 0, "error"
    


class UnifiedGoogleSheetsSync:
    """Main unified Google Sheets sync service"""
    
    def __init__(self):
        self.sheets_reader = GoogleSheetsReader()
        self.assignment_service = LeadAssignmentService()
    
    def sync_leads(self, dry_run: bool = False) -> SyncResult:
        """
        Main sync method that fetches leads and assigns them
        
        Args:
            dry_run: If True, only test connection and count data without creating leads
            
        Returns:
            SyncResult with detailed information
        """
        start_time = timezone.now()
        
        try:
            # Test API connection
            api_connected, api_message = self.sheets_reader.test_connection()
            if not api_connected:
                return SyncResult(
                    success=False,
                    leads_found=0,
                    telecallers_found=0,
                    leads_assigned=0,
                    assignment_ratio=0.0,
                    assignment_integrity="api_error",
                    api_status=f"Failed: {api_message}",
                    error_message=api_message,
                    execution_time=(timezone.now() - start_time).total_seconds()
                )
            
            # Fetch leads data
            fetch_success, leads_data, fetch_message = self.sheets_reader.fetch_leads_data()
            if not fetch_success:
                return SyncResult(
                    success=False,
                    leads_found=0,
                    telecallers_found=self.assignment_service.get_telecallers_count(),
                    leads_assigned=0,
                    assignment_ratio=0.0,
                    assignment_integrity="fetch_error",
                    api_status="Connected",
                    error_message=fetch_message,
                    execution_time=(timezone.now() - start_time).total_seconds()
                )
            
            leads_found = len(leads_data)
            telecallers_found = self.assignment_service.get_telecallers_count()
            
            # Calculate assignment ratio
            assignment_ratio = leads_found / telecallers_found if telecallers_found > 0 else 0
            
            if dry_run:
                logger.info("DRY RUN: Would assign leads but not creating them")
                return SyncResult(
                    success=True,
                    leads_found=leads_found,
                    telecallers_found=telecallers_found,
                    leads_assigned=0,
                    assignment_ratio=assignment_ratio,
                    assignment_integrity="dry_run",
                    api_status="Connected",
                    execution_time=(timezone.now() - start_time).total_seconds()
                )
            
            # Assign leads
            leads_assigned, integrity_status = self.assignment_service.assign_leads_balanced(leads_data)
            
            # Log webhook for tracking
            WebhookLog.objects.create(
                webhook_type='google_sheets',
                payload={
                    'action': 'unified_sync',
                    'leads_found': leads_found,
                    'leads_assigned': leads_assigned,
                    'telecallers_count': telecallers_found
                },
                status='processed',
                processed_at=timezone.now(),
                error_message=''
            )
            
            execution_time = (timezone.now() - start_time).total_seconds()
            
            return SyncResult(
                success=True,
                leads_found=leads_found,
                telecallers_found=telecallers_found,
                leads_assigned=leads_assigned,
                assignment_ratio=assignment_ratio,
                assignment_integrity=integrity_status,
                api_status="Connected",
                execution_time=execution_time
            )
            
        except Exception as e:
            logger.error(f"Unexpected error during sync: {str(e)}")
            return SyncResult(
                success=False,
                leads_found=0,
                telecallers_found=0,
                leads_assigned=0,
                assignment_ratio=0.0,
                assignment_integrity="error",
                api_status="Error",
                error_message=str(e),
                execution_time=(timezone.now() - start_time).total_seconds()
            )
    
    def print_sync_report(self, result: SyncResult):
        """Print comprehensive sync report to console"""
        print("\n" + "="*60)
        print("GOOGLE SHEETS SYNC REPORT")
        print("="*60)
        
        # API Status
        print(f"API Status: {'✅ ' + result.api_status if result.success else '❌ ' + result.api_status}")
        
        # Data Counts
        print(f"Leads Found: {result.leads_found}")
        print(f"Telecallers Found: {result.telecallers_found}")
        print(f"Leads Assigned: {result.leads_assigned}")
        
        # Assignment Metrics
        print(f"Assignment Ratio: {result.assignment_ratio:.2f} leads per telecaller")
        
        # Assignment Integrity
        integrity_icons = {
            "perfect": "✅ Perfect",
            "partial": "⚠️  Partial",
            "corrupted": "❌ Corrupted",
            "no_assignments": "⚠️  No Assignments",
            "no_telecallers": "❌ No Telecallers",
            "no_leads": "⚠️  No Leads",
            "dry_run": "🔍 Dry Run",
            "api_error": "❌ API Error",
            "fetch_error": "❌ Fetch Error",
            "error": "❌ Error"
        }
        print(f"Assignment Integrity: {integrity_icons.get(result.assignment_integrity, '❓ Unknown')}")
        
        # Performance
        print(f"Execution Time: {result.execution_time:.2f} seconds")
        
        # Error Information
        if result.error_message:
            print(f"Error: {result.error_message}")
        
        # Success Status
        if result.success:
            print("\n🎉 Sync completed successfully!")
            if result.leads_assigned > 0:
                print(f"📞 {result.leads_assigned} leads assigned to telecallers")
        else:
            print("\n❌ Sync failed!")
        
        print("="*60)


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Unified Google Sheets Sync')
    parser.add_argument('--test-connection', action='store_true', 
                       help='Test Google Sheets connection only')
    parser.add_argument('--dry-run', action='store_true',
                       help='Run sync without creating leads')
    
    args = parser.parse_args()
    
    # Initialize sync service
    sync_service = UnifiedGoogleSheetsSync()
    
    if args.test_connection:
        # Test connection only
        print("Testing Google Sheets connection...")
        connected, message = sync_service.sheets_reader.test_connection()
        
        if connected:
            print(f"✅ {message}")
            sys.exit(0)
        else:
            print(f"❌ {message}")
            sys.exit(1)
    
    # Run sync
    print("Starting Google Sheets sync...")
    result = sync_service.sync_leads(dry_run=args.dry_run)
    
    # Print report
    sync_service.print_sync_report(result)
    
    # Exit with appropriate code
    sys.exit(0 if result.success else 1)


if __name__ == '__main__':
    main()
