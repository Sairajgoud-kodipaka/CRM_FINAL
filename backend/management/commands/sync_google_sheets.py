from django.core.management.base import BaseCommand
from django.utils import timezone
from telecalling.google_sheets_service import sync_leads_from_sheets, test_google_sheets_connection
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Sync leads from Google Sheets'

    def add_arguments(self, parser):
        parser.add_argument(
            '--test-connection',
            action='store_true',
            help='Test Google Sheets connection without syncing',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force sync even if recent sync exists',
        )

    def handle(self, *args, **options):
        if options['test_connection']:
            self.stdout.write('Testing Google Sheets connection...')
            if test_google_sheets_connection():
                self.stdout.write(
                    self.style.SUCCESS('✓ Google Sheets connection successful')
                )
            else:
                self.stdout.write(
                    self.style.ERROR('✗ Google Sheets connection failed')
                )
            return

        self.stdout.write('Starting Google Sheets sync...')
        
        try:
            success = sync_leads_from_sheets()
            
            if success:
                self.stdout.write(
                    self.style.SUCCESS('✓ Google Sheets sync completed successfully')
                )
            else:
                self.stdout.write(
                    self.style.ERROR('✗ Google Sheets sync failed')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Sync failed with error: {str(e)}')
            )
            logger.error(f"Sync command failed: {str(e)}")
