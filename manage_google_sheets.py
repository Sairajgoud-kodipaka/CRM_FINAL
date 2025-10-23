#!/usr/bin/env python3
"""
Google Sheets Integration Management Command
Provides ongoing management and monitoring capabilities
"""

import os
import sys
import django
from pathlib import Path
from datetime import datetime, timedelta
from django.utils import timezone

# Add the backend directory to Python path
backend_path = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_path))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from telecalling.google_sheets_service import sync_leads_from_sheets, google_sheets_service
from telecalling.models import Lead, WebhookLog
from apps.automation.models import ScheduledTask
from apps.users.models import User
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class GoogleSheetsManager:
    """Google Sheets Integration Manager for ongoing operations"""
    
    def status_report(self):
        """Generate comprehensive status report"""
        print("=" * 80)
        print("📊 GOOGLE SHEETS INTEGRATION - STATUS REPORT")
        print("=" * 80)
        print(f"📅 Generated: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Connection Status
        print(f"\n🔗 CONNECTION STATUS:")
        print("-" * 40)
        connection_ok = google_sheets_service.test_connection()
        print(f"   Google Sheets API: {'✅ Connected' if connection_ok else '❌ Disconnected'}")
        
        # Data Statistics
        print(f"\n📈 DATA STATISTICS:")
        print("-" * 40)
        total_leads = Lead.objects.count()
        recent_leads = Lead.objects.filter(created_at__gte=timezone.now() - timedelta(days=7)).count()
        assigned_leads = Lead.objects.exclude(assigned_to__isnull=True).count()
        
        print(f"   Total leads: {total_leads:,}")
        print(f"   Recent leads (7 days): {recent_leads:,}")
        print(f"   Assigned leads: {assigned_leads:,}")
        print(f"   Assignment rate: {(assigned_leads/total_leads*100):.1f}%" if total_leads > 0 else "   Assignment rate: 0.0%")
        
        # Sync Performance
        print(f"\n🔄 SYNC PERFORMANCE:")
        print("-" * 40)
        total_syncs = WebhookLog.objects.filter(webhook_type='google_sheets').count()
        successful_syncs = WebhookLog.objects.filter(
            webhook_type='google_sheets',
            status='processed'
        ).count()
        recent_syncs = WebhookLog.objects.filter(
            webhook_type='google_sheets',
            created_at__gte=timezone.now() - timedelta(days=1)
        ).count()
        
        success_rate = (successful_syncs / total_syncs * 100) if total_syncs > 0 else 0
        print(f"   Total syncs: {total_syncs}")
        print(f"   Successful syncs: {successful_syncs}")
        print(f"   Success rate: {success_rate:.1f}%")
        print(f"   Recent syncs (24h): {recent_syncs}")
        
        # Automation Status
        print(f"\n⚙️ AUTOMATION STATUS:")
        print("-" * 40)
        tasks = ScheduledTask.objects.filter(
            task_config__service='google_sheets'
        )
        
        for task in tasks:
            status_emoji = "✅" if task.is_enabled else "❌"
            overdue_emoji = "⚠️" if task.is_overdue else ""
            print(f"   {status_emoji} {task.name}")
            print(f"      Frequency: {task.get_frequency_display()}")
            print(f"      Status: {task.get_status_display()}")
            print(f"      Next run: {task.next_execution.strftime('%Y-%m-%d %H:%M') if task.next_execution else 'Not scheduled'}")
            print(f"      Success rate: {task.success_rate:.1f}%")
            if overdue_emoji:
                print(f"      {overdue_emoji} OVERDUE!")
        
        # Telecaller Assignment
        print(f"\n👥 TELECALLER ASSIGNMENTS:")
        print("-" * 40)
        telecallers = User.objects.filter(role='tele_calling', is_active=True)
        
        if telecallers.exists():
            for tc in telecallers:
                assigned_count = Lead.objects.filter(assigned_to=tc).count()
                recent_assigned = Lead.objects.filter(
                    assigned_to=tc,
                    assigned_at__gte=timezone.now() - timedelta(days=7)
                ).count()
                print(f"   👤 {tc.get_full_name()}")
                print(f"      Total assigned: {assigned_count}")
                print(f"      Recent (7 days): {recent_assigned}")
        else:
            print("   ❌ No active telecallers found")
        
        # Recent Activity
        print(f"\n📝 RECENT ACTIVITY:")
        print("-" * 40)
        recent_logs = WebhookLog.objects.filter(
            webhook_type='google_sheets'
        ).order_by('-created_at')[:5]
        
        for log in recent_logs:
            status_emoji = "✅" if log.status == 'processed' else "❌"
            print(f"   {status_emoji} {log.created_at.strftime('%Y-%m-%d %H:%M')} - {log.status}")
            if log.error_message:
                print(f"      Error: {log.error_message[:100]}...")
        
        print("\n" + "=" * 80)
        print("📊 STATUS REPORT COMPLETE")
        print("=" * 80)
    
    def manual_sync(self):
        """Run manual sync"""
        print("🔄 Running manual Google Sheets sync...")
        
        initial_count = Lead.objects.count()
        result = sync_leads_from_sheets()
        final_count = Lead.objects.count()
        
        if result:
            new_leads = final_count - initial_count
            print(f"✅ Sync completed successfully!")
            print(f"📈 New leads imported: {new_leads}")
            print(f"📊 Total leads now: {final_count}")
        else:
            print("❌ Sync failed!")
        
        return result
    
    def check_health(self):
        """Check system health"""
        print("🏥 Checking Google Sheets integration health...")
        
        issues = []
        
        # Check connection
        if not google_sheets_service.test_connection():
            issues.append("Google Sheets API connection failed")
        
        # Check recent syncs
        recent_syncs = WebhookLog.objects.filter(
            webhook_type='google_sheets',
            created_at__gte=timezone.now() - timedelta(hours=2)
        )
        
        if not recent_syncs.exists():
            issues.append("No recent syncs in the last 2 hours")
        
        # Check failed syncs
        failed_syncs = WebhookLog.objects.filter(
            webhook_type='google_sheets',
            status='failed',
            created_at__gte=timezone.now() - timedelta(hours=24)
        )
        
        if failed_syncs.count() > 3:
            issues.append(f"Too many failed syncs: {failed_syncs.count()} in last 24h")
        
        # Check automation tasks
        overdue_tasks = ScheduledTask.objects.filter(
            task_config__service='google_sheets',
            is_enabled=True,
            next_execution__lt=timezone.now()
        )
        
        if overdue_tasks.exists():
            issues.append(f"Overdue automation tasks: {overdue_tasks.count()}")
        
        if issues:
            print("⚠️ Health issues detected:")
            for issue in issues:
                print(f"   - {issue}")
            return False
        else:
            print("✅ All health checks passed!")
            return True
    
    def reassign_leads(self):
        """Reassign unassigned leads"""
        print("👥 Reassigning unassigned leads...")
        
        unassigned_leads = Lead.objects.filter(assigned_to__isnull=True)
        telecallers = User.objects.filter(role='tele_calling', is_active=True)
        
        if not telecallers.exists():
            print("❌ No active telecallers found!")
            return False
        
        if not unassigned_leads.exists():
            print("✅ All leads are already assigned!")
            return True
        
        print(f"📋 Found {unassigned_leads.count()} unassigned leads")
        print(f"👥 Found {telecallers.count()} active telecallers")
        
        # Round-robin assignment
        telecaller_list = list(telecallers)
        current_index = 0
        
        for lead in unassigned_leads:
            assigned_telecaller = telecaller_list[current_index % len(telecaller_list)]
            lead.assigned_to = assigned_telecaller
            lead.assigned_at = timezone.now()
            lead.save()
            current_index += 1
        
        print(f"✅ Successfully reassigned {unassigned_leads.count()} leads")
        return True

def main():
    """Main function with command line interface"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Google Sheets Integration Manager')
    parser.add_argument('action', choices=['status', 'sync', 'health', 'reassign'], 
                       help='Action to perform')
    
    args = parser.parse_args()
    
    manager = GoogleSheetsManager()
    
    if args.action == 'status':
        manager.status_report()
    elif args.action == 'sync':
        manager.manual_sync()
    elif args.action == 'health':
        manager.check_health()
    elif args.action == 'reassign':
        manager.reassign_leads()

if __name__ == "__main__":
    main()

