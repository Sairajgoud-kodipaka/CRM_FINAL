#!/usr/bin/env python3
"""
BRUTAL HARDCORE TESTING - Google Sheets Automation Reality Check
This will brutally expose what actually works vs what's just fake promises
"""

import os
import sys
import django
from pathlib import Path
from datetime import datetime, timedelta
from django.utils import timezone
from django.db import transaction

# Add the backend directory to Python path
backend_path = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_path))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from telecalling.google_sheets_service import sync_leads_from_sheets, google_sheets_service
from telecalling.models import Lead, WebhookLog
from apps.automation.models import ScheduledTask, TaskExecution
from apps.users.models import User
from apps.tenants.models import Tenant
from django.contrib.auth import get_user_model
import logging
import json

logger = logging.getLogger(__name__)
User = get_user_model()

class BrutalAutomationTester:
    """BRUTAL TESTER - No mercy, no lies, only hard facts"""
    
    def __init__(self):
        self.test_results = []
        self.critical_failures = []
        self.fake_promises = []
    
    def test_1_scheduled_tasks_reality(self):
        """TEST 1: Do scheduled tasks actually exist and are they real?"""
        print("🔥 BRUTAL TEST 1: SCHEDULED TASKS REALITY CHECK")
        print("=" * 60)
        
        try:
            # Check if tasks exist
            tasks = ScheduledTask.objects.filter(task_config__service='google_sheets')
            print(f"📊 Found {tasks.count()} Google Sheets tasks in database")
            
            if tasks.count() == 0:
                self.critical_failures.append("NO SCHEDULED TASKS FOUND - AUTOMATION IS FAKE!")
                print("❌ CRITICAL FAILURE: No scheduled tasks found!")
                return False
            
            # Check each task
            for task in tasks:
                print(f"\n🔍 Analyzing task: {task.name}")
                print(f"   Status: {task.status}")
                print(f"   Enabled: {task.is_enabled}")
                print(f"   Next execution: {task.next_execution}")
                print(f"   Frequency: {task.frequency}")
                print(f"   Execution count: {task.execution_count}")
                print(f"   Success count: {task.success_count}")
                print(f"   Failure count: {task.failure_count}")
                
                # BRUTAL CHECKS
                if not task.is_enabled:
                    self.critical_failures.append(f"Task '{task.name}' is DISABLED!")
                    print("   ❌ CRITICAL: Task is DISABLED!")
                
                if task.next_execution is None:
                    self.critical_failures.append(f"Task '{task.name}' has NO NEXT EXECUTION!")
                    print("   ❌ CRITICAL: No next execution scheduled!")
                
                if task.execution_count == 0:
                    self.fake_promises.append(f"Task '{task.name}' has NEVER RUN!")
                    print("   ⚠️ WARNING: Task has never executed!")
                
                if task.failure_count > task.success_count:
                    self.critical_failures.append(f"Task '{task.name}' FAILS MORE THAN IT SUCCEEDS!")
                    print("   ❌ CRITICAL: More failures than successes!")
            
            print(f"\n📋 BRUTAL SUMMARY:")
            print(f"   Total tasks: {tasks.count()}")
            print(f"   Critical failures: {len(self.critical_failures)}")
            print(f"   Fake promises: {len(self.fake_promises)}")
            
            return len(self.critical_failures) == 0
            
        except Exception as e:
            self.critical_failures.append(f"SCHEDULED TASKS TEST FAILED: {str(e)}")
            print(f"❌ CRITICAL ERROR: {str(e)}")
            return False
    
    def test_2_actual_automation_execution(self):
        """TEST 2: Do the tasks actually execute automatically?"""
        print("\n🔥 BRUTAL TEST 2: AUTOMATION EXECUTION REALITY")
        print("=" * 60)
        
        try:
            # Check if there's any automation execution logic
            print("🔍 Looking for actual automation execution code...")
            
            # Check for Celery tasks
            celery_tasks_found = False
            try:
                from celery import Celery
                celery_tasks_found = True
                print("✅ Celery found - background tasks possible")
            except ImportError:
                print("❌ Celery NOT FOUND - no background task execution!")
                self.critical_failures.append("NO CELERY - NO BACKGROUND AUTOMATION!")
            
            # Check for cron jobs or scheduled execution
            print("🔍 Checking for scheduled execution mechanisms...")
            
            # Check if there's a management command that actually runs these tasks
            print("🔍 Looking for management commands that execute automation...")
            
            # BRUTAL REALITY CHECK
            print("\n💀 BRUTAL REALITY CHECK:")
            print("   ❓ Are these ScheduledTask objects just database records?")
            print("   ❓ Is there ANY code that actually reads and executes them?")
            print("   ❓ Is there a cron job, Celery worker, or any execution mechanism?")
            print("   ❓ Or are they just fake promises sitting in the database?")
            
            # Check for actual execution logs
            executions = TaskExecution.objects.filter(
                task__task_config__service='google_sheets'
            )
            print(f"\n📊 Task executions found: {executions.count()}")
            
            if executions.count() == 0:
                self.critical_failures.append("NO TASK EXECUTIONS FOUND - AUTOMATION IS DEAD!")
                print("❌ CRITICAL: No task executions found!")
                return False
            
            # Check recent executions
            recent_executions = executions.filter(
                created_at__gte=timezone.now() - timedelta(hours=24)
            )
            print(f"📊 Recent executions (24h): {recent_executions.count()}")
            
            if recent_executions.count() == 0:
                self.fake_promises.append("NO RECENT EXECUTIONS - AUTOMATION IS BROKEN!")
                print("⚠️ WARNING: No recent executions!")
            
            return len(self.critical_failures) == 0
            
        except Exception as e:
            self.critical_failures.append(f"AUTOMATION EXECUTION TEST FAILED: {str(e)}")
            print(f"❌ CRITICAL ERROR: {str(e)}")
            return False
    
    def test_3_lead_assignment_reality(self):
        """TEST 3: Does automatic lead assignment actually work?"""
        print("\n🔥 BRUTAL TEST 3: LEAD ASSIGNMENT REALITY")
        print("=" * 60)
        
        try:
            # Check current lead assignment status
            total_leads = Lead.objects.count()
            unassigned_leads = Lead.objects.filter(assigned_to__isnull=True).count()
            assigned_leads = total_leads - unassigned_leads
            
            print(f"📊 Lead Assignment Status:")
            print(f"   Total leads: {total_leads}")
            print(f"   Assigned leads: {assigned_leads}")
            print(f"   Unassigned leads: {unassigned_leads}")
            print(f"   Assignment rate: {(assigned_leads/total_leads*100):.1f}%" if total_leads > 0 else "   Assignment rate: 0%")
            
            # Check telecallers
            telecallers = User.objects.filter(role='tele_calling', is_active=True)
            print(f"\n👥 Telecallers:")
            print(f"   Active telecallers: {telecallers.count()}")
            
            if telecallers.count() == 0:
                self.critical_failures.append("NO ACTIVE TELECALLERS - ASSIGNMENT IMPOSSIBLE!")
                print("❌ CRITICAL: No active telecallers!")
                return False
            
            # Check assignment distribution
            print(f"\n📊 Assignment Distribution:")
            for tc in telecallers:
                tc_leads = Lead.objects.filter(assigned_to=tc).count()
                print(f"   {tc.get_full_name()}: {tc_leads} leads")
            
            # BRUTAL CHECKS
            if unassigned_leads > 0:
                self.fake_promises.append(f"{unassigned_leads} LEADS UNASSIGNED - AUTOMATION FAILED!")
                print(f"❌ CRITICAL: {unassigned_leads} leads are unassigned!")
            
            # Check if assignment is actually automatic or manual
            print(f"\n🔍 Checking assignment automation...")
            
            # Look for recent assignment activity
            recent_assignments = Lead.objects.filter(
                assigned_at__gte=timezone.now() - timedelta(hours=1)
            )
            print(f"📊 Recent assignments (1h): {recent_assignments.count()}")
            
            if recent_assignments.count() == 0:
                self.fake_promises.append("NO RECENT ASSIGNMENTS - AUTOMATION IS DEAD!")
                print("⚠️ WARNING: No recent assignments!")
            
            return len(self.critical_failures) == 0
            
        except Exception as e:
            self.critical_failures.append(f"LEAD ASSIGNMENT TEST FAILED: {str(e)}")
            print(f"❌ CRITICAL ERROR: {str(e)}")
            return False
    
    def test_4_google_sheets_sync_reality(self):
        """TEST 4: Does Google Sheets sync actually work automatically?"""
        print("\n🔥 BRUTAL TEST 4: GOOGLE SHEETS SYNC REALITY")
        print("=" * 60)
        
        try:
            # Check sync history
            sync_logs = WebhookLog.objects.filter(webhook_type='google_sheets')
            print(f"📊 Sync History:")
            print(f"   Total syncs: {sync_logs.count()}")
            
            successful_syncs = sync_logs.filter(status='processed').count()
            failed_syncs = sync_logs.filter(status='failed').count()
            
            print(f"   Successful: {successful_syncs}")
            print(f"   Failed: {failed_syncs}")
            print(f"   Success rate: {(successful_syncs/sync_logs.count()*100):.1f}%" if sync_logs.count() > 0 else "   Success rate: 0%")
            
            # Check recent sync activity
            recent_syncs = sync_logs.filter(
                created_at__gte=timezone.now() - timedelta(hours=2)
            )
            print(f"   Recent syncs (2h): {recent_syncs.count()}")
            
            # BRUTAL CHECKS
            if recent_syncs.count() == 0:
                self.fake_promises.append("NO RECENT SYNC ACTIVITY - AUTOMATION IS BROKEN!")
                print("❌ CRITICAL: No recent sync activity!")
            
            if failed_syncs > successful_syncs:
                self.critical_failures.append("MORE FAILURES THAN SUCCESSES - SYNC IS BROKEN!")
                print("❌ CRITICAL: More failures than successes!")
            
            # Test actual sync functionality
            print(f"\n🧪 Testing sync functionality...")
            initial_count = Lead.objects.count()
            sync_result = sync_leads_from_sheets()
            final_count = Lead.objects.count()
            
            print(f"   Initial leads: {initial_count}")
            print(f"   Final leads: {final_count}")
            print(f"   Sync result: {'SUCCESS' if sync_result else 'FAILED'}")
            
            if not sync_result:
                self.critical_failures.append("MANUAL SYNC TEST FAILED!")
                print("❌ CRITICAL: Manual sync test failed!")
            
            return len(self.critical_failures) == 0
            
        except Exception as e:
            self.critical_failures.append(f"GOOGLE SHEETS SYNC TEST FAILED: {str(e)}")
            print(f"❌ CRITICAL ERROR: {str(e)}")
            return False
    
    def test_5_automation_infrastructure(self):
        """TEST 5: Is there actual automation infrastructure?"""
        print("\n🔥 BRUTAL TEST 5: AUTOMATION INFRASTRUCTURE")
        print("=" * 60)
        
        try:
            print("🔍 Checking for automation infrastructure...")
            
            # Check for Celery
            celery_found = False
            try:
                from celery import Celery
                celery_found = True
                print("✅ Celery found")
            except ImportError:
                print("❌ Celery NOT FOUND")
                self.critical_failures.append("NO CELERY - NO BACKGROUND AUTOMATION!")
            
            # Check for Redis (Celery broker)
            redis_found = False
            try:
                import redis
                redis_found = True
                print("✅ Redis found")
            except ImportError:
                print("❌ Redis NOT FOUND")
                self.critical_failures.append("NO REDIS - NO CELERY BROKER!")
            
            # Check for cron jobs or scheduled tasks
            print("🔍 Checking for scheduled execution...")
            
            # Check Django settings for Celery
            celery_settings = getattr(settings, 'CELERY_BROKER_URL', None)
            if celery_settings:
                print(f"✅ Celery broker configured: {celery_settings}")
            else:
                print("❌ Celery broker NOT configured")
                self.critical_failures.append("CELERY BROKER NOT CONFIGURED!")
            
            # BRUTAL REALITY CHECK
            print(f"\n💀 BRUTAL REALITY CHECK:")
            if not celery_found or not redis_found or not celery_settings:
                print("   ❌ NO AUTOMATION INFRASTRUCTURE!")
                print("   ❌ ScheduledTask objects are just database records!")
                print("   ❌ There's NO mechanism to execute them!")
                print("   ❌ This is FAKE AUTOMATION!")
                self.critical_failures.append("FAKE AUTOMATION - NO INFRASTRUCTURE!")
            else:
                print("   ✅ Automation infrastructure exists")
            
            return len(self.critical_failures) == 0
            
        except Exception as e:
            self.critical_failures.append(f"AUTOMATION INFRASTRUCTURE TEST FAILED: {str(e)}")
            print(f"❌ CRITICAL ERROR: {str(e)}")
            return False
    
    def generate_brutal_report(self):
        """Generate brutal honest report"""
        print("\n" + "=" * 80)
        print("💀 BRUTAL HONEST REPORT - NO MERCY, NO LIES")
        print("=" * 80)
        
        print(f"📊 TEST RESULTS SUMMARY:")
        print(f"   Total tests: 5")
        print(f"   Critical failures: {len(self.critical_failures)}")
        print(f"   Fake promises: {len(self.fake_promises)}")
        
        if self.critical_failures:
            print(f"\n❌ CRITICAL FAILURES:")
            for i, failure in enumerate(self.critical_failures, 1):
                print(f"   {i}. {failure}")
        
        if self.fake_promises:
            print(f"\n⚠️ FAKE PROMISES:")
            for i, promise in enumerate(self.fake_promises, 1):
                print(f"   {i}. {promise}")
        
        # BRUTAL CONCLUSION
        print(f"\n💀 BRUTAL CONCLUSION:")
        if len(self.critical_failures) == 0 and len(self.fake_promises) == 0:
            print("   ✅ AUTOMATION IS REAL AND WORKING!")
            print("   ✅ All promises are kept!")
            print("   ✅ System is genuinely automated!")
        elif len(self.critical_failures) > 0:
            print("   ❌ AUTOMATION IS FAKE!")
            print("   ❌ Critical failures detected!")
            print("   ❌ System is NOT automated!")
            print("   ❌ Manual intervention required!")
        else:
            print("   ⚠️ AUTOMATION IS PARTIALLY WORKING!")
            print("   ⚠️ Some promises are fake!")
            print("   ⚠️ System needs improvement!")
        
        return len(self.critical_failures) == 0
    
    def run_all_brutal_tests(self):
        """Run all brutal tests"""
        print("💀 STARTING BRUTAL HARDCORE TESTING")
        print("=" * 80)
        print("🎯 GOAL: Expose the truth about automation")
        print("🔥 METHOD: No mercy, no lies, only hard facts")
        print("=" * 80)
        
        tests = [
            self.test_1_scheduled_tasks_reality,
            self.test_2_actual_automation_execution,
            self.test_3_lead_assignment_reality,
            self.test_4_google_sheets_sync_reality,
            self.test_5_automation_infrastructure,
        ]
        
        for i, test in enumerate(tests, 1):
            try:
                test()
            except Exception as e:
                self.critical_failures.append(f"TEST {i} CRASHED: {str(e)}")
                print(f"❌ TEST {i} CRASHED: {str(e)}")
        
        return self.generate_brutal_report()

def main():
    """Main execution"""
    tester = BrutalAutomationTester()
    success = tester.run_all_brutal_tests()
    
    if success:
        print("\n🎉 AUTOMATION IS REAL!")
    else:
        print("\n💀 AUTOMATION IS FAKE!")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)


