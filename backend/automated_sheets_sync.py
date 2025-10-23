#!/usr/bin/env python3
"""
Automated Google Sheets Sync Script
==================================

This script is designed to be run as a scheduled task (cron job, Windows Task Scheduler, etc.)
for automated Google Sheets synchronization.

It provides:
- Automated lead fetching from Google Sheets
- Balanced assignment to telecallers
- Comprehensive logging
- Error handling and retry logic
- Email notifications on failure

Usage:
    python automated_sheets_sync.py [--notify-on-error] [--max-retries=3]
"""

import os
import sys
import logging
import argparse
from datetime import datetime
from typing import Optional

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_dir)

from unified_google_sheets_sync import UnifiedGoogleSheetsSync

# Configure logging for automation
log_filename = f'automated_sync_{datetime.now().strftime("%Y%m%d")}.log'
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_filename),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class AutomatedSyncService:
    """Service for automated Google Sheets synchronization"""
    
    def __init__(self, max_retries: int = 3, notify_on_error: bool = True):
        self.max_retries = max_retries
        self.notify_on_error = notify_on_error
        self.sync_service = UnifiedGoogleSheetsSync()
    
    def run_automated_sync(self) -> bool:
        """
        Run automated sync with retry logic and error handling
        
        Returns:
            bool: True if sync was successful, False otherwise
        """
        logger.info("Starting automated Google Sheets sync")
        
        for attempt in range(1, self.max_retries + 1):
            try:
                logger.info(f"Sync attempt {attempt}/{self.max_retries}")
                
                # Run the sync
                result = self.sync_service.sync_leads(dry_run=False)
                
                if result.success:
                    logger.info("Automated sync completed successfully")
                    self._log_sync_summary(result)
                    return True
                else:
                    logger.error(f"Sync failed on attempt {attempt}: {result.error_message}")
                    
                    if attempt < self.max_retries:
                        logger.info(f"Retrying in 30 seconds...")
                        import time
                        time.sleep(30)
                    else:
                        logger.error("All sync attempts failed")
                        if self.notify_on_error:
                            self._send_error_notification(result)
                        return False
                        
            except Exception as e:
                logger.error(f"Unexpected error on attempt {attempt}: {str(e)}")
                
                if attempt < self.max_retries:
                    logger.info(f"Retrying in 30 seconds...")
                    import time
                    time.sleep(30)
                else:
                    logger.error("All sync attempts failed due to unexpected errors")
                    if self.notify_on_error:
                        self._send_error_notification(None, str(e))
                    return False
        
        return False
    
    def _log_sync_summary(self, result):
        """Log detailed sync summary"""
        logger.info("="*50)
        logger.info("AUTOMATED SYNC SUMMARY")
        logger.info("="*50)
        logger.info(f"API Status: {result.api_status}")
        logger.info(f"Leads Found: {result.leads_found}")
        logger.info(f"Telecallers Found: {result.telecallers_found}")
        logger.info(f"Leads Assigned: {result.leads_assigned}")
        logger.info(f"Assignment Ratio: {result.assignment_ratio:.2f}")
        logger.info(f"Assignment Integrity: {result.assignment_integrity}")
        logger.info(f"Execution Time: {result.execution_time:.2f} seconds")
        logger.info("="*50)
    
    def _send_error_notification(self, result=None, error_message=None):
        """Send error notification email"""
        try:
            subject = "Google Sheets Sync Failed - Automated Alert"
            
            if result:
                message = f"""
Automated Google Sheets sync has failed after {self.max_retries} attempts.

Error Details:
- API Status: {result.api_status}
- Error: {result.error_message}
- Leads Found: {result.leads_found}
- Telecallers Found: {result.telecallers_found}
- Assignment Integrity: {result.assignment_integrity}

Please check the logs and resolve the issue.
Log file: {log_filename}
                """
            else:
                message = f"""
Automated Google Sheets sync has failed due to an unexpected error.

Error: {error_message}

Please check the logs and resolve the issue.
Log file: {log_filename}
                """
            
            # Send to configured email addresses
            recipient_list = getattr(settings, 'SYNC_ERROR_EMAILS', [])
            if not recipient_list:
                # Fallback to admin emails
                recipient_list = [admin[1] for admin in settings.ADMINS]
            
            if recipient_list:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=recipient_list,
                    fail_silently=False
                )
                logger.info(f"Error notification sent to {recipient_list}")
            else:
                logger.warning("No email addresses configured for error notifications")
                
        except Exception as e:
            logger.error(f"Failed to send error notification: {str(e)}")


def main():
    """Main entry point for automated sync"""
    parser = argparse.ArgumentParser(description='Automated Google Sheets Sync')
    parser.add_argument('--notify-on-error', action='store_true', default=True,
                       help='Send email notifications on error')
    parser.add_argument('--max-retries', type=int, default=3,
                       help='Maximum number of retry attempts')
    
    args = parser.parse_args()
    
    # Initialize automated sync service
    sync_service = AutomatedSyncService(
        max_retries=args.max_retries,
        notify_on_error=args.notify_on_error
    )
    
    # Run automated sync
    success = sync_service.run_automated_sync()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
