#!/usr/bin/env python3
"""
Comprehensive CRM Audit Script
==============================

This script performs a complete audit of the CRM system including:
- Google Sheets Integration
- Lead Management
- Assignment Systems
- Database Integrity
- API Endpoints
- Performance Metrics
- Error Handling
"""

import os
import sys
import django
import json
import time
from datetime import datetime, timedelta
from django.db import connection
from django.core.management import call_command
from django.test import Client
from django.contrib.auth import get_user_model

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from telecalling.models import Lead, LeadAssignmentState, TelecallerPerformance, WebhookLog
from telecalling.lead_assignment_service import AdvancedLeadAssignmentService
from unified_google_sheets_sync import UnifiedGoogleSheetsSync
from apps.automation.models import ScheduledTask, TaskExecution
from django.conf import settings

User = get_user_model()

class CRMAuditor:
    """Comprehensive CRM audit system"""
    
    def __init__(self):
        self.audit_results = {
            'timestamp': datetime.now(),
            'overall_status': 'UNKNOWN',
            'components': {},
            'issues': [],
            'recommendations': [],
            'performance_metrics': {}
        }
        self.client = Client()
    
    def run_complete_audit(self):
        """Run complete CRM audit"""
        print("🔍 COMPREHENSIVE CRM AUDIT")
        print("=" * 60)
        print(f"Audit Started: {self.audit_results['timestamp']}")
        print()
        
        # Run all audit components
        self.audit_google_sheets_integration()
        self.audit_lead_management()
        self.audit_assignment_system()
        self.audit_automated_sync()
        self.audit_database_integrity()
        self.audit_api_endpoints()
        self.audit_performance_metrics()
        self.audit_error_handling()
        
        # Generate final report
        self.generate_audit_report()
        
        return self.audit_results
    
    def audit_google_sheets_integration(self):
        """Audit Google Sheets integration"""
        print("📊 AUDITING GOOGLE SHEETS INTEGRATION")
        print("-" * 40)
        
        try:
            sync_service = UnifiedGoogleSheetsSync()
            
            # Test connection
            api_connected, api_message = sync_service.sheets_reader.test_connection()
            
            # Fetch data
            fetch_success, leads_data, fetch_message = sync_service.sheets_reader.fetch_leads_data()
            
            self.audit_results['components']['google_sheets'] = {
                'status': 'PASS' if api_connected and fetch_success else 'FAIL',
                'api_connected': api_connected,
                'api_message': api_message,
                'fetch_success': fetch_success,
                'fetch_message': fetch_message,
                'leads_found': len(leads_data) if fetch_success else 0,
                'last_check': datetime.now()
            }
            
            print(f"✅ API Connection: {'PASS' if api_connected else 'FAIL'}")
            print(f"✅ Data Fetch: {'PASS' if fetch_success else 'FAIL'}")
            print(f"📈 Leads Found: {len(leads_data) if fetch_success else 0}")
            
            if not api_connected:
                self.audit_results['issues'].append("Google Sheets API connection failed")
            if not fetch_success:
                self.audit_results['issues'].append("Google Sheets data fetch failed")
                
        except Exception as e:
            self.audit_results['components']['google_sheets'] = {
                'status': 'ERROR',
                'error': str(e)
            }
            self.audit_results['issues'].append(f"Google Sheets integration error: {str(e)}")
            print(f"❌ Error: {str(e)}")
        
        print()
    
    def audit_lead_management(self):
        """Audit lead management system"""
        print("👥 AUDITING LEAD MANAGEMENT")
        print("-" * 40)
        
        try:
            # Get lead statistics
            total_leads = Lead.objects.count()
            google_sheets_leads = Lead.objects.filter(source_system='google_sheets').count()
            assigned_leads = Lead.objects.filter(assigned_to__isnull=False).count()
            unassigned_leads = Lead.objects.filter(assigned_to__isnull=True).count()
            
            # Check for duplicates
            phone_numbers = Lead.objects.filter(source_system='google_sheets').values_list('phone', flat=True)
            unique_phones = set(phone_numbers)
            duplicate_count = len(phone_numbers) - len(unique_phones)
            
            # Lead status distribution
            status_distribution = {}
            for status, _ in Lead._meta.get_field('status').choices:
                count = Lead.objects.filter(status=status).count()
                status_distribution[status] = count
            
            self.audit_results['components']['lead_management'] = {
                'status': 'PASS' if duplicate_count == 0 else 'WARNING',
                'total_leads': total_leads,
                'google_sheets_leads': google_sheets_leads,
                'assigned_leads': assigned_leads,
                'unassigned_leads': unassigned_leads,
                'duplicate_count': duplicate_count,
                'status_distribution': status_distribution,
                'last_check': datetime.now()
            }
            
            print(f"✅ Total Leads: {total_leads}")
            print(f"✅ Google Sheets Leads: {google_sheets_leads}")
            print(f"✅ Assigned Leads: {assigned_leads}")
            print(f"✅ Unassigned Leads: {unassigned_leads}")
            print(f"{'✅' if duplicate_count == 0 else '⚠️'} Duplicates: {duplicate_count}")
            
            if duplicate_count > 0:
                self.audit_results['issues'].append(f"Found {duplicate_count} duplicate leads")
            
            print("📊 Status Distribution:")
            for status, count in status_distribution.items():
                print(f"  {status}: {count}")
                
        except Exception as e:
            self.audit_results['components']['lead_management'] = {
                'status': 'ERROR',
                'error': str(e)
            }
            self.audit_results['issues'].append(f"Lead management error: {str(e)}")
            print(f"❌ Error: {str(e)}")
        
        print()
    
    def audit_assignment_system(self):
        """Audit lead assignment system"""
        print("🎯 AUDITING LEAD ASSIGNMENT SYSTEM")
        print("-" * 40)
        
        try:
            assignment_service = AdvancedLeadAssignmentService()
            
            # Get telecaller statistics
            telecallers = assignment_service.get_active_telecallers()
            workloads = assignment_service.get_telecaller_workloads()
            analytics = assignment_service.get_assignment_analytics()
            
            # Check round-robin state
            rr_state = LeadAssignmentState.objects.filter(assignment_type='round_robin').first()
            
            self.audit_results['components']['assignment_system'] = {
                'status': 'PASS',
                'total_telecallers': len(telecallers),
                'available_telecallers': len([w for w in workloads if w.is_available]),
                'total_active_leads': sum(w.active_leads for w in workloads),
                'round_robin_state': {
                    'exists': rr_state is not None,
                    'last_assigned_telecaller_id': rr_state.last_assigned_telecaller_id if rr_state else None,
                    'assignment_count': rr_state.assignment_count if rr_state else 0
                },
                'workloads': [
                    {
                        'telecaller_id': w.telecaller_id,
                        'telecaller_name': w.telecaller_name,
                        'active_leads': w.active_leads,
                        'is_available': w.is_available,
                        'conversion_rate': w.conversion_rate
                    }
                    for w in workloads
                ],
                'last_check': datetime.now()
            }
            
            print(f"✅ Total Telecallers: {len(telecallers)}")
            print(f"✅ Available Telecallers: {len([w for w in workloads if w.is_available])}")
            print(f"✅ Total Active Leads: {sum(w.active_leads for w in workloads)}")
            print(f"✅ Round-Robin State: {'EXISTS' if rr_state else 'MISSING'}")
            
            print("👥 Telecaller Workloads:")
            for workload in workloads:
                status = "✅ Available" if workload.is_available else "❌ Overloaded"
                print(f"  {workload.telecaller_name}: {workload.active_leads} leads, {workload.conversion_rate:.1f}% conversion, {status}")
            
            if len(telecallers) == 0:
                self.audit_results['issues'].append("No active telecallers found")
            if len([w for w in workloads if w.is_available]) == 0:
                self.audit_results['issues'].append("All telecallers are overloaded")
                
        except Exception as e:
            self.audit_results['components']['assignment_system'] = {
                'status': 'ERROR',
                'error': str(e)
            }
            self.audit_results['issues'].append(f"Assignment system error: {str(e)}")
            print(f"❌ Error: {str(e)}")
        
        print()
    
    def audit_automated_sync(self):
        """Audit automated sync system"""
        print("🔄 AUDITING AUTOMATED SYNC SYSTEM")
        print("-" * 40)
        
        try:
            # Check scheduled tasks
            sync_task = ScheduledTask.objects.filter(
                name='Google Sheets Automated Sync'
            ).first()
            
            if sync_task:
                # Get recent executions
                recent_executions = TaskExecution.objects.filter(
                    task=sync_task
                ).order_by('-created_at')[:10]
                
                success_count = recent_executions.filter(status='completed').count()
                failure_count = recent_executions.filter(status='failed').count()
                success_rate = (success_count / len(recent_executions) * 100) if recent_executions else 0
                
                self.audit_results['components']['automated_sync'] = {
                    'status': 'PASS' if sync_task.is_enabled else 'WARNING',
                    'is_enabled': sync_task.is_enabled,
                    'is_active': sync_task.status == 'active',
                    'last_executed': sync_task.last_executed,
                    'next_execution': sync_task.next_execution,
                    'execution_count': sync_task.execution_count,
                    'success_count': sync_task.success_count,
                    'failure_count': sync_task.failure_count,
                    'success_rate': sync_task.success_rate,
                    'recent_executions': len(recent_executions),
                    'last_check': datetime.now()
                }
                
                print(f"✅ Task Status: {'ENABLED' if sync_task.is_enabled else 'DISABLED'}")
                print(f"✅ Active Status: {sync_task.status}")
                print(f"✅ Last Executed: {sync_task.last_executed}")
                print(f"✅ Next Execution: {sync_task.next_execution}")
                print(f"✅ Success Rate: {sync_task.success_rate:.1f}%")
                print(f"✅ Total Executions: {sync_task.execution_count}")
                
                if not sync_task.is_enabled:
                    self.audit_results['issues'].append("Automated sync is disabled")
                if sync_task.success_rate < 80:
                    self.audit_results['issues'].append(f"Low success rate: {sync_task.success_rate:.1f}%")
            else:
                self.audit_results['components']['automated_sync'] = {
                    'status': 'ERROR',
                    'error': 'Sync task not found'
                }
                self.audit_results['issues'].append("Automated sync task not configured")
                print("❌ Sync task not found")
                
        except Exception as e:
            self.audit_results['components']['automated_sync'] = {
                'status': 'ERROR',
                'error': str(e)
            }
            self.audit_results['issues'].append(f"Automated sync error: {str(e)}")
            print(f"❌ Error: {str(e)}")
        
        print()
    
    def audit_database_integrity(self):
        """Audit database integrity"""
        print("🗄️ AUDITING DATABASE INTEGRITY")
        print("-" * 40)
        
        try:
            with connection.cursor() as cursor:
                # Check database connection
                cursor.execute("SELECT 1")
                db_connected = cursor.fetchone()[0] == 1
                
                # Check table existence
                cursor.execute("""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name LIKE '%lead%'
                """)
                lead_tables = [row[0] for row in cursor.fetchall()]
                
                # Check for orphaned records
                orphaned_leads = Lead.objects.filter(
                    assigned_to__isnull=False,
                    assigned_to__is_active=False
                ).count()
                
                # Check for missing required fields
                missing_name_leads = Lead.objects.filter(name__isnull=True).count()
                missing_phone_leads = Lead.objects.filter(phone__isnull=True).count()
                
                self.audit_results['components']['database_integrity'] = {
                    'status': 'PASS' if db_connected and orphaned_leads == 0 else 'WARNING',
                    'db_connected': db_connected,
                    'lead_tables': lead_tables,
                    'orphaned_leads': orphaned_leads,
                    'missing_name_leads': missing_name_leads,
                    'missing_phone_leads': missing_phone_leads,
                    'last_check': datetime.now()
                }
                
                print(f"✅ Database Connection: {'PASS' if db_connected else 'FAIL'}")
                print(f"✅ Lead Tables: {len(lead_tables)} found")
                print(f"{'✅' if orphaned_leads == 0 else '⚠️'} Orphaned Leads: {orphaned_leads}")
                print(f"{'✅' if missing_name_leads == 0 else '⚠️'} Missing Names: {missing_name_leads}")
                print(f"{'✅' if missing_phone_leads == 0 else '⚠️'} Missing Phones: {missing_phone_leads}")
                
                if orphaned_leads > 0:
                    self.audit_results['issues'].append(f"Found {orphaned_leads} orphaned leads")
                if missing_name_leads > 0:
                    self.audit_results['issues'].append(f"Found {missing_name_leads} leads with missing names")
                if missing_phone_leads > 0:
                    self.audit_results['issues'].append(f"Found {missing_phone_leads} leads with missing phones")
                    
        except Exception as e:
            self.audit_results['components']['database_integrity'] = {
                'status': 'ERROR',
                'error': str(e)
            }
            self.audit_results['issues'].append(f"Database integrity error: {str(e)}")
            print(f"❌ Error: {str(e)}")
        
        print()
    
    def audit_api_endpoints(self):
        """Audit API endpoints"""
        print("🌐 AUDITING API ENDPOINTS")
        print("-" * 40)
        
        try:
            # Test key API endpoints
            endpoints_to_test = [
                '/api/telecalling/leads/',
                '/api/telecalling/assignments/',
                '/api/telecalling/call-requests/',
                '/api/analytics/dashboard/',
            ]
            
            endpoint_results = {}
            
            for endpoint in endpoints_to_test:
                try:
                    response = self.client.get(endpoint)
                    endpoint_results[endpoint] = {
                        'status_code': response.status_code,
                        'accessible': response.status_code in [200, 401, 403]  # 401/403 are OK (auth required)
                    }
                except Exception as e:
                    endpoint_results[endpoint] = {
                        'status_code': 'ERROR',
                        'accessible': False,
                        'error': str(e)
                    }
            
            accessible_endpoints = sum(1 for ep in endpoint_results.values() if ep['accessible'])
            total_endpoints = len(endpoints_to_test)
            
            self.audit_results['components']['api_endpoints'] = {
                'status': 'PASS' if accessible_endpoints == total_endpoints else 'WARNING',
                'total_endpoints': total_endpoints,
                'accessible_endpoints': accessible_endpoints,
                'endpoint_results': endpoint_results,
                'last_check': datetime.now()
            }
            
            print(f"✅ Accessible Endpoints: {accessible_endpoints}/{total_endpoints}")
            
            for endpoint, result in endpoint_results.items():
                status = "✅" if result['accessible'] else "❌"
                print(f"  {status} {endpoint}: {result['status_code']}")
            
            if accessible_endpoints < total_endpoints:
                self.audit_results['issues'].append(f"{total_endpoints - accessible_endpoints} API endpoints are not accessible")
                
        except Exception as e:
            self.audit_results['components']['api_endpoints'] = {
                'status': 'ERROR',
                'error': str(e)
            }
            self.audit_results['issues'].append(f"API endpoints error: {str(e)}")
            print(f"❌ Error: {str(e)}")
        
        print()
    
    def audit_performance_metrics(self):
        """Audit performance metrics"""
        print("⚡ AUDITING PERFORMANCE METRICS")
        print("-" * 40)
        
        try:
            # Measure sync performance
            start_time = time.time()
            sync_service = UnifiedGoogleSheetsSync()
            result = sync_service.sync_leads(dry_run=True)
            sync_time = time.time() - start_time
            
            # Database query performance
            start_time = time.time()
            Lead.objects.all().count()
            query_time = time.time() - start_time
            
            # Assignment performance
            start_time = time.time()
            assignment_service = AdvancedLeadAssignmentService()
            analytics = assignment_service.get_assignment_analytics()
            assignment_time = time.time() - start_time
            
            self.audit_results['performance_metrics'] = {
                'sync_execution_time': sync_time,
                'database_query_time': query_time,
                'assignment_analytics_time': assignment_time,
                'sync_success': result.success,
                'sync_leads_found': result.leads_found,
                'sync_telecallers_found': result.telecallers_found,
                'last_check': datetime.now()
            }
            
            print(f"✅ Sync Execution Time: {sync_time:.2f}s")
            print(f"✅ Database Query Time: {query_time:.4f}s")
            print(f"✅ Assignment Analytics Time: {assignment_time:.4f}s")
            print(f"✅ Sync Success: {'PASS' if result.success else 'FAIL'}")
            
            if sync_time > 10:
                self.audit_results['issues'].append(f"Slow sync performance: {sync_time:.2f}s")
            if query_time > 1:
                self.audit_results['issues'].append(f"Slow database queries: {query_time:.4f}s")
                
        except Exception as e:
            self.audit_results['performance_metrics'] = {
                'error': str(e)
            }
            self.audit_results['issues'].append(f"Performance metrics error: {str(e)}")
            print(f"❌ Error: {str(e)}")
        
        print()
    
    def audit_error_handling(self):
        """Audit error handling and logging"""
        print("🚨 AUDITING ERROR HANDLING")
        print("-" * 40)
        
        try:
            # Check webhook logs for errors
            error_logs = WebhookLog.objects.filter(status='failed').count()
            total_logs = WebhookLog.objects.count()
            error_rate = (error_logs / total_logs * 100) if total_logs > 0 else 0
            
            # Check recent errors
            recent_errors = WebhookLog.objects.filter(
                status='failed',
                created_at__gte=datetime.now() - timedelta(days=7)
            ).count()
            
            # Check task execution errors
            failed_executions = TaskExecution.objects.filter(status='failed').count()
            total_executions = TaskExecution.objects.count()
            execution_error_rate = (failed_executions / total_executions * 100) if total_executions > 0 else 0
            
            self.audit_results['components']['error_handling'] = {
                'status': 'PASS' if error_rate < 10 else 'WARNING',
                'webhook_error_rate': error_rate,
                'recent_errors_7days': recent_errors,
                'execution_error_rate': execution_error_rate,
                'total_webhook_logs': total_logs,
                'failed_webhook_logs': error_logs,
                'total_executions': total_executions,
                'failed_executions': failed_executions,
                'last_check': datetime.now()
            }
            
            print(f"✅ Webhook Error Rate: {error_rate:.1f}%")
            print(f"✅ Recent Errors (7 days): {recent_errors}")
            print(f"✅ Execution Error Rate: {execution_error_rate:.1f}%")
            print(f"✅ Total Webhook Logs: {total_logs}")
            print(f"✅ Failed Executions: {failed_executions}")
            
            if error_rate > 10:
                self.audit_results['issues'].append(f"High webhook error rate: {error_rate:.1f}%")
            if execution_error_rate > 20:
                self.audit_results['issues'].append(f"High execution error rate: {execution_error_rate:.1f}%")
                
        except Exception as e:
            self.audit_results['components']['error_handling'] = {
                'status': 'ERROR',
                'error': str(e)
            }
            self.audit_results['issues'].append(f"Error handling audit error: {str(e)}")
            print(f"❌ Error: {str(e)}")
        
        print()
    
    def generate_audit_report(self):
        """Generate comprehensive audit report"""
        print("📋 GENERATING AUDIT REPORT")
        print("=" * 60)
        
        # Determine overall status
        component_statuses = [comp.get('status', 'UNKNOWN') for comp in self.audit_results['components'].values()]
        
        if all(status == 'PASS' for status in component_statuses):
            self.audit_results['overall_status'] = 'EXCELLENT'
        elif all(status in ['PASS', 'WARNING'] for status in component_statuses):
            self.audit_results['overall_status'] = 'GOOD'
        elif any(status == 'ERROR' for status in component_statuses):
            self.audit_results['overall_status'] = 'NEEDS_ATTENTION'
        else:
            self.audit_results['overall_status'] = 'UNKNOWN'
        
        # Generate recommendations
        self.generate_recommendations()
        
        # Print summary
        print(f"🎯 OVERALL STATUS: {self.audit_results['overall_status']}")
        print(f"📊 Components Audited: {len(self.audit_results['components'])}")
        print(f"🚨 Issues Found: {len(self.audit_results['issues'])}")
        print(f"💡 Recommendations: {len(self.audit_results['recommendations'])}")
        print()
        
        # Print component statuses
        print("📋 COMPONENT STATUS:")
        for component, data in self.audit_results['components'].items():
            status_icon = {
                'PASS': '✅',
                'WARNING': '⚠️',
                'ERROR': '❌',
                'UNKNOWN': '❓'
            }.get(data.get('status', 'UNKNOWN'), '❓')
            print(f"  {status_icon} {component.replace('_', ' ').title()}: {data.get('status', 'UNKNOWN')}")
        
        print()
        
        # Print issues
        if self.audit_results['issues']:
            print("🚨 ISSUES FOUND:")
            for i, issue in enumerate(self.audit_results['issues'], 1):
                print(f"  {i}. {issue}")
            print()
        
        # Print recommendations
        if self.audit_results['recommendations']:
            print("💡 RECOMMENDATIONS:")
            for i, rec in enumerate(self.audit_results['recommendations'], 1):
                print(f"  {i}. {rec}")
            print()
        
        # Save audit report
        self.save_audit_report()
    
    def generate_recommendations(self):
        """Generate recommendations based on audit findings"""
        recommendations = []
        
        # Check for common issues and generate recommendations
        components = self.audit_results['components']
        
        # Google Sheets recommendations
        if components.get('google_sheets', {}).get('status') == 'FAIL':
            recommendations.append("Fix Google Sheets API connection and credentials")
        
        # Lead management recommendations
        lead_mgmt = components.get('lead_management', {})
        if lead_mgmt.get('duplicate_count', 0) > 0:
            recommendations.append("Implement better duplicate detection for leads")
        if lead_mgmt.get('unassigned_leads', 0) > 0:
            recommendations.append("Assign unassigned leads to telecallers")
        
        # Assignment system recommendations
        assignment = components.get('assignment_system', {})
        if assignment.get('total_telecallers', 0) == 0:
            recommendations.append("Add more telecallers to handle lead volume")
        if assignment.get('available_telecallers', 0) == 0:
            recommendations.append("Reduce telecaller workload or increase capacity")
        
        # Automated sync recommendations
        sync = components.get('automated_sync', {})
        if not sync.get('is_enabled', False):
            recommendations.append("Enable automated sync scheduling")
        if sync.get('success_rate', 100) < 80:
            recommendations.append("Investigate and fix sync failures")
        
        # Performance recommendations
        perf = self.audit_results.get('performance_metrics', {})
        if perf.get('sync_execution_time', 0) > 10:
            recommendations.append("Optimize sync performance")
        
        # Error handling recommendations
        error_handling = components.get('error_handling', {})
        if error_handling.get('webhook_error_rate', 0) > 10:
            recommendations.append("Improve webhook error handling")
        
        self.audit_results['recommendations'] = recommendations
    
    def save_audit_report(self):
        """Save audit report to file"""
        try:
            report_filename = f"crm_audit_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(report_filename, 'w') as f:
                json.dump(self.audit_results, f, indent=2, default=str)
            print(f"📄 Audit report saved to: {report_filename}")
        except Exception as e:
            print(f"❌ Failed to save audit report: {str(e)}")

def main():
    """Main entry point"""
    auditor = CRMAuditor()
    results = auditor.run_complete_audit()
    
    print("\n🎉 CRM AUDIT COMPLETED!")
    print(f"Overall Status: {results['overall_status']}")
    print(f"Issues Found: {len(results['issues'])}")
    print(f"Recommendations: {len(results['recommendations'])}")

if __name__ == '__main__':
    main()
