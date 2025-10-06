from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.automation.models import ScheduledTask
from apps.tenants.models import Tenant
from telecalling.google_sheets_service import sync_leads_from_sheets, test_google_sheets_connection
from telecalling.models import WebhookLog
from apps.notifications.models import Notification
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class Command(BaseCommand):
    help = 'Create automated Google Sheets sync task and connection monitoring'

    def handle(self, *args, **options):
        self.stdout.write('Setting up automated Google Sheets sync...')
        
        # Get the first tenant (assuming single tenant for now)
        tenant = Tenant.objects.first()
        if not tenant:
            self.stdout.write(
                self.style.ERROR('No tenant found. Please create a tenant first.')
            )
            return
        
        # Create scheduled task for Google Sheets sync
        sync_task, created = ScheduledTask.objects.get_or_create(
            name='Google Sheets Lead Sync',
            tenant=tenant,
            defaults={
                'description': 'Automatically sync leads from Google Sheets and assign to telecallers',
                'task_type': 'data_sync',
                'frequency': 'hourly',  # Sync every hour
                'task_config': {
                    'service': 'google_sheets',
                    'auto_assign': True,
                    'notify_on_success': True,
                    'notify_on_failure': True,
                },
                'status': 'active',
                'is_enabled': True,
                'max_retries': 3,
                'retry_delay_minutes': 5,
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'✓ Created scheduled task: {sync_task.name}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'⚠ Scheduled task already exists: {sync_task.name}')
            )
        
        # Create connection monitoring task
        monitor_task, created = ScheduledTask.objects.get_or_create(
            name='Google Sheets Connection Monitor',
            tenant=tenant,
            defaults={
                'description': 'Monitor Google Sheets connection health and send alerts',
                'task_type': 'notification',
                'frequency': 'daily',  # Check daily
                'task_config': {
                    'service': 'google_sheets',
                    'check_connection': True,
                    'alert_on_failure': True,
                },
                'status': 'active',
                'is_enabled': True,
                'max_retries': 2,
                'retry_delay_minutes': 10,
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'✓ Created monitoring task: {monitor_task.name}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'⚠ Monitoring task already exists: {monitor_task.name}')
            )
        
        # Test current connection
        self.stdout.write('Testing Google Sheets connection...')
        if test_google_sheets_connection():
            self.stdout.write(
                self.style.SUCCESS('✓ Google Sheets connection is working')
            )
            
            # Send success notification to managers
            managers = User.objects.filter(role='manager')
            for manager in managers:
                Notification.objects.create(
                    recipient=manager,
                    title="Google Sheets Integration Active",
                    message="Automated Google Sheets sync has been set up successfully. Leads will be synced hourly and auto-assigned to telecallers.",
                    notification_type='system'
                )
        else:
            self.stdout.write(
                self.style.ERROR('✗ Google Sheets connection failed')
            )
            
            # Send failure notification to managers
            managers = User.objects.filter(role='manager')
            for manager in managers:
                Notification.objects.create(
                    recipient=manager,
                    title="Google Sheets Integration Issue",
                    message="There was an issue with the Google Sheets connection. Please check the configuration.",
                    notification_type='system'
                )
        
        self.stdout.write(
            self.style.SUCCESS('✓ Automated Google Sheets sync setup completed!')
        )
