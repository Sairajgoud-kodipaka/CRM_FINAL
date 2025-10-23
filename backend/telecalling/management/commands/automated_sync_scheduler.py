"""
Automated Google Sheets Sync Scheduler
=====================================

This module provides automated scheduling for Google Sheets synchronization.
It integrates with the existing automation system and runs sync tasks automatically.

Features:
- Automatic scheduling every 5 minutes
- Background task execution
- Error handling and retry logic
- Integration with existing automation models
- Email notifications on failure
"""

import os
import sys
import logging
from datetime import datetime, timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from django.db import transaction

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(backend_dir)

from unified_google_sheets_sync import UnifiedGoogleSheetsSync
from apps.automation.models import ScheduledTask, TaskExecution
from apps.tenants.models import Tenant

logger = logging.getLogger(__name__)


class GoogleSheetsScheduler:
    """Automated scheduler for Google Sheets sync"""
    
    def __init__(self):
        self.sync_service = UnifiedGoogleSheetsSync()
    
    def setup_automated_sync(self) -> bool:
        """Set up automated Google Sheets sync task"""
        try:
            # Get the first tenant (assuming single tenant)
            tenant = Tenant.objects.first()
            if not tenant:
                logger.error("No tenant found. Please create a tenant first.")
                return False
            
            # Create or update the automated sync task
            sync_task, created = ScheduledTask.objects.get_or_create(
                name='Google Sheets Automated Sync',
                tenant=tenant,
                defaults={
                    'description': 'Automatically sync leads from Google Sheets every 5 minutes',
                    'task_type': 'data_sync',
                    'frequency': 'minutely',  # We'll use custom schedule for 5-minute intervals
                    'schedule_config': {
                        'interval_minutes': 5,
                        'start_time': '09:00',
                        'end_time': '18:00',
                        'days_of_week': [1, 2, 3, 4, 5],  # Monday to Friday
                        'timezone': 'Asia/Kolkata'
                    },
                    'task_config': {
                        'service': 'google_sheets',
                        'auto_assign': True,
                        'notify_on_success': False,
                        'notify_on_failure': True,
                        'max_leads_per_sync': 1000,
                        'skip_duplicates': True
                    },
                    'status': 'active',
                    'is_enabled': True,
                    'max_retries': 3,
                    'retry_delay_minutes': 5,
                    'next_execution': timezone.now() + timedelta(minutes=30)
                }
            )
            
            if created:
                logger.info(f"✅ Created automated sync task: {sync_task.name}")
            else:
                # Update existing task
                sync_task.is_enabled = True
                sync_task.status = 'active'
                sync_task.next_execution = timezone.now() + timedelta(minutes=5)
                sync_task.save()
                logger.info(f"✅ Updated automated sync task: {sync_task.name}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error setting up automated sync: {str(e)}")
            return False
    
    def run_scheduled_sync(self) -> bool:
        """Run the scheduled Google Sheets sync"""
        try:
            # Get the sync task
            sync_task = ScheduledTask.objects.filter(
                name='Google Sheets Automated Sync',
                is_enabled=True
            ).first()
            
            if not sync_task:
                logger.error("Automated sync task not found or disabled")
                return False
            
            # Check if it's time to run
            if sync_task.next_execution and sync_task.next_execution > timezone.now():
                logger.info("Sync not due yet, skipping")
                return True
            
            # Create execution record
            execution = TaskExecution.objects.create(
                task=sync_task,
                status='running',
                started_at=timezone.now(),
                input_data={'trigger': 'scheduled'}
            )
            
            try:
                # Run the sync
                logger.info("Starting scheduled Google Sheets sync")
                result = self.sync_service.sync_leads(dry_run=False)
                
                # Update execution record
                execution.status = 'completed' if result.success else 'failed'
                execution.completed_at = timezone.now()
                execution.duration_seconds = int(result.execution_time)
                execution.output_data = {
                    'leads_found': result.leads_found,
                    'leads_assigned': result.leads_assigned,
                    'telecallers_found': result.telecallers_found,
                    'assignment_ratio': result.assignment_ratio,
                    'assignment_integrity': result.assignment_integrity,
                    'api_status': result.api_status
                }
                
                if not result.success:
                    execution.error_message = result.error_message
                
                execution.save()
                
                # Update task statistics
                sync_task.execution_count += 1
                sync_task.last_executed = timezone.now()
                
                if result.success:
                    sync_task.success_count += 1
                    logger.info("✅ Scheduled sync completed successfully")
                else:
                    sync_task.failure_count += 1
                    logger.error(f"❌ Scheduled sync failed: {result.error_message}")
                
                # Schedule next execution
                sync_task.next_execution = timezone.now() + timedelta(minutes=5)
                sync_task.save()
                
                return result.success
                
            except Exception as e:
                # Update execution record with error
                execution.status = 'failed'
                execution.completed_at = timezone.now()
                execution.error_message = str(e)
                execution.save()
                
                # Update task statistics
                sync_task.execution_count += 1
                sync_task.failure_count += 1
                sync_task.last_executed = timezone.now()
                sync_task.next_execution = timezone.now() + timedelta(minutes=5)
                sync_task.save()
                
                logger.error(f"Error during scheduled sync: {str(e)}")
                return False
                
        except Exception as e:
            logger.error(f"Error running scheduled sync: {str(e)}")
            return False
    
    def get_sync_status(self) -> dict:
        """Get current sync status and statistics"""
        try:
            sync_task = ScheduledTask.objects.filter(
                name='Google Sheets Automated Sync'
            ).first()
            
            if not sync_task:
                return {
                    'status': 'not_configured',
                    'message': 'Automated sync not configured'
                }
            
            # Get recent executions
            recent_executions = TaskExecution.objects.filter(
                task=sync_task
            ).order_by('-created_at')[:5]
            
            executions_data = []
            for exec in recent_executions:
                executions_data.append({
                    'timestamp': exec.created_at,
                    'status': exec.status,
                    'duration': exec.duration_seconds,
                    'leads_found': exec.output_data.get('leads_found', 0),
                    'leads_assigned': exec.output_data.get('leads_assigned', 0),
                    'error': exec.error_message
                })
            
            return {
                'status': 'active' if sync_task.is_enabled else 'inactive',
                'is_enabled': sync_task.is_enabled,
                'last_executed': sync_task.last_executed,
                'next_execution': sync_task.next_execution,
                'execution_count': sync_task.execution_count,
                'success_count': sync_task.success_count,
                'failure_count': sync_task.failure_count,
                'success_rate': sync_task.success_rate,
                'recent_executions': executions_data
            }
            
        except Exception as e:
            logger.error(f"Error getting sync status: {str(e)}")
            return {
                'status': 'error',
                'message': str(e)
            }


class Command(BaseCommand):
    """Django management command for automated sync"""
    
    help = 'Run automated Google Sheets sync scheduler'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--setup',
            action='store_true',
            help='Set up automated sync task'
        )
        parser.add_argument(
            '--run',
            action='store_true',
            help='Run scheduled sync now'
        )
        parser.add_argument(
            '--status',
            action='store_true',
            help='Show sync status'
        )
        parser.add_argument(
            '--enable',
            action='store_true',
            help='Enable automated sync'
        )
        parser.add_argument(
            '--disable',
            action='store_true',
            help='Disable automated sync'
        )
    
    def handle(self, *args, **options):
        scheduler = GoogleSheetsScheduler()
        
        if options['setup']:
            self.stdout.write('Setting up automated Google Sheets sync...')
            if scheduler.setup_automated_sync():
                self.stdout.write(
                    self.style.SUCCESS('✅ Automated sync setup completed!')
                )
            else:
                self.stdout.write(
                    self.style.ERROR('❌ Failed to setup automated sync')
                )
        
        elif options['run']:
            self.stdout.write('Running scheduled Google Sheets sync...')
            if scheduler.run_scheduled_sync():
                self.stdout.write(
                    self.style.SUCCESS('✅ Scheduled sync completed successfully!')
                )
            else:
                self.stdout.write(
                    self.style.ERROR('❌ Scheduled sync failed')
                )
        
        elif options['status']:
            status = scheduler.get_sync_status()
            self.stdout.write('Google Sheets Sync Status:')
            self.stdout.write(f"Status: {status.get('status', 'unknown')}")
            self.stdout.write(f"Enabled: {status.get('is_enabled', False)}")
            self.stdout.write(f"Last Executed: {status.get('last_executed', 'Never')}")
            self.stdout.write(f"Next Execution: {status.get('next_execution', 'Not scheduled')}")
            self.stdout.write(f"Success Rate: {status.get('success_rate', 0):.1f}%")
            self.stdout.write(f"Total Executions: {status.get('execution_count', 0)}")
        
        elif options['enable']:
            try:
                sync_task = ScheduledTask.objects.filter(
                    name='Google Sheets Automated Sync'
                ).first()
                if sync_task:
                    sync_task.is_enabled = True
                    sync_task.status = 'active'
                    sync_task.save()
                    self.stdout.write(
                        self.style.SUCCESS('✅ Automated sync enabled!')
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR('❌ Sync task not found. Run --setup first.')
                    )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Error enabling sync: {str(e)}')
                )
        
        elif options['disable']:
            try:
                sync_task = ScheduledTask.objects.filter(
                    name='Google Sheets Automated Sync'
                ).first()
                if sync_task:
                    sync_task.is_enabled = False
                    sync_task.status = 'inactive'
                    sync_task.save()
                    self.stdout.write(
                        self.style.SUCCESS('✅ Automated sync disabled!')
                    )
                else:
                    self.stdout.write(
                        self.style.ERROR('❌ Sync task not found.')
                    )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Error disabling sync: {str(e)}')
                )
        
        else:
            self.stdout.write('Please specify an action: --setup, --run, --status, --enable, or --disable')
