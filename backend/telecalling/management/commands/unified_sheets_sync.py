from django.core.management.base import BaseCommand
from django.utils import timezone
import sys
import os

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.append(backend_dir)

from unified_google_sheets_sync import UnifiedGoogleSheetsSync
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Unified Google Sheets sync with comprehensive logging'

    def add_arguments(self, parser):
        parser.add_argument(
            '--test-connection',
            action='store_true',
            help='Test Google Sheets connection only',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run sync without creating leads',
        )

    def handle(self, *args, **options):
        # Initialize sync service
        sync_service = UnifiedGoogleSheetsSync()
        
        if options['test_connection']:
            # Test connection only
            self.stdout.write('Testing Google Sheets connection...')
            connected, message = sync_service.sheets_reader.test_connection()
            
            if connected:
                self.stdout.write(
                    self.style.SUCCESS(f'✅ {message}')
                )
            else:
                self.stdout.write(
                    self.style.ERROR(f'❌ {message}')
                )
            return
        
        # Run sync
        self.stdout.write('Starting Google Sheets sync...')
        result = sync_service.sync_leads(dry_run=options['dry_run'])
        
        # Print report
        sync_service.print_sync_report(result)
        
        # Django-style output
        if result.success:
            self.stdout.write(
                self.style.SUCCESS('✓ Google Sheets sync completed successfully')
            )
        else:
            self.stdout.write(
                self.style.ERROR('✗ Google Sheets sync failed')
            )


