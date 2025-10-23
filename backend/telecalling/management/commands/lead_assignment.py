"""
Lead Assignment Management Command
==================================

This command provides comprehensive lead assignment management and analytics.
"""

import os
import sys
from django.core.management.base import BaseCommand
from django.utils import timezone
from telecalling.lead_assignment_service import AdvancedLeadAssignmentService
from telecalling.models import Lead, LeadAssignmentState
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    """Management command for lead assignment operations"""
    
    help = 'Manage lead assignments and view analytics'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--analytics',
            action='store_true',
            help='Show assignment analytics'
        )
        parser.add_argument(
            '--workloads',
            action='store_true',
            help='Show telecaller workloads'
        )
        parser.add_argument(
            '--reset-state',
            action='store_true',
            help='Reset round-robin assignment state'
        )
        parser.add_argument(
            '--method',
            type=str,
            choices=['round_robin', 'workload_balance', 'priority_based'],
            default='round_robin',
            help='Assignment method to use'
        )
        parser.add_argument(
            '--test-assignment',
            action='store_true',
            help='Test assignment with sample data'
        )
    
    def handle(self, *args, **options):
        service = AdvancedLeadAssignmentService()
        
        if options['analytics']:
            self.show_analytics(service)
        
        elif options['workloads']:
            self.show_workloads(service)
        
        elif options['reset_state']:
            self.reset_assignment_state()
        
        elif options['test_assignment']:
            self.test_assignment(service, options['method'])
        
        else:
            self.show_help()
    
    def show_analytics(self, service):
        """Show comprehensive assignment analytics"""
        self.stdout.write(self.style.SUCCESS('📊 LEAD ASSIGNMENT ANALYTICS'))
        self.stdout.write('=' * 50)
        
        analytics = service.get_assignment_analytics()
        
        # Basic stats
        self.stdout.write(f"Total Telecallers: {analytics['total_telecallers']}")
        self.stdout.write(f"Available Telecallers: {analytics['available_telecallers']}")
        self.stdout.write(f"Total Active Leads: {analytics['total_active_leads']}")
        
        # Round-robin state
        rr_state = analytics['round_robin_state']
        self.stdout.write(f"\n🔄 Round-Robin State:")
        self.stdout.write(f"  Last Assigned Telecaller ID: {rr_state['last_assigned_telecaller_id']}")
        self.stdout.write(f"  Total Assignments: {rr_state['total_assignments']}")
        self.stdout.write(f"  Last Assignment: {rr_state['last_assignment_time']}")
        
        # Telecaller workloads
        self.stdout.write(f"\n👥 Telecaller Workloads:")
        for workload in analytics['telecaller_workloads']:
            status = "✅ Available" if workload['is_available'] else "❌ Overloaded"
            self.stdout.write(f"  {workload['name']} (ID: {workload['id']}):")
            self.stdout.write(f"    Active Leads: {workload['active_leads']}")
            self.stdout.write(f"    Pending Calls: {workload['pending_calls']}")
            self.stdout.write(f"    Conversion Rate: {workload['conversion_rate']:.1f}%")
            self.stdout.write(f"    Status: {status}")
        
        # Recent assignments
        self.stdout.write(f"\n📈 Recent Assignments (24h):")
        for assignment in analytics['recent_assignments']:
            telecaller = User.objects.get(id=assignment['assigned_to'])
            self.stdout.write(f"  {telecaller.get_full_name()}: {assignment['count']} leads")
    
    def show_workloads(self, service):
        """Show detailed telecaller workloads"""
        self.stdout.write(self.style.SUCCESS('⚖️  TELECALLER WORKLOADS'))
        self.stdout.write('=' * 50)
        
        workloads = service.get_telecaller_workloads()
        
        for workload in workloads:
            self.stdout.write(f"\n👤 {workload.telecaller_name} (ID: {workload.telecaller_id})")
            self.stdout.write(f"  Active Leads: {workload.active_leads}")
            self.stdout.write(f"  Pending Calls: {workload.pending_calls}")
            self.stdout.write(f"  Completed Today: {workload.completed_today}")
            self.stdout.write(f"  Conversion Rate: {workload.conversion_rate:.1f}%")
            self.stdout.write(f"  Avg Call Duration: {workload.avg_call_duration:.1f}s")
            self.stdout.write(f"  Available: {'✅ Yes' if workload.is_available else '❌ No (overloaded)'}")
            if workload.last_assignment:
                self.stdout.write(f"  Last Assignment: {workload.last_assignment}")
    
    def reset_assignment_state(self):
        """Reset round-robin assignment state"""
        try:
            state = LeadAssignmentState.objects.filter(assignment_type='round_robin').first()
            if state:
                state.last_assigned_telecaller_id = None
                state.assignment_count = 0
                state.save()
                self.stdout.write(self.style.SUCCESS('✅ Round-robin state reset successfully'))
            else:
                self.stdout.write(self.style.WARNING('⚠️  No round-robin state found'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error resetting state: {str(e)}'))
    
    def test_assignment(self, service, method):
        """Test assignment with sample data"""
        self.stdout.write(self.style.SUCCESS(f'🧪 TESTING {method.upper()} ASSIGNMENT'))
        self.stdout.write('=' * 50)
        
        # Create sample lead data
        sample_leads = [
            {
                'name': 'Test Lead 1',
                'phone': '9999999991',
                'email': 'test1@example.com',
                'city': 'Mumbai',
                'source': 'website',
                'created_time': '2025-10-23T10:00:00Z'
            },
            {
                'name': 'Test Lead 2',
                'phone': '9999999992',
                'email': 'test2@example.com',
                'city': 'Delhi',
                'source': 'social_media',
                'created_time': '2025-10-23T10:01:00Z'
            },
            {
                'name': 'Test Lead 3',
                'phone': '9999999993',
                'email': 'test3@example.com',
                'city': 'Bangalore',
                'source': 'referral',
                'created_time': '2025-10-23T10:02:00Z'
            }
        ]
        
        try:
            if method == 'round_robin':
                result = service.assign_leads_round_robin(sample_leads)
            elif method == 'workload_balance':
                result = service.assign_leads_workload_balance(sample_leads)
            elif method == 'priority_based':
                result = service.assign_leads_priority_based(sample_leads)
            
            if result.success:
                self.stdout.write(f"✅ Assignment successful!")
                self.stdout.write(f"  Method: {result.assignment_method}")
                self.stdout.write(f"  Leads Assigned: {result.leads_assigned}")
                self.stdout.write(f"  Execution Time: {result.execution_time:.2f}s")
                
                self.stdout.write(f"\n📊 Distribution:")
                for telecaller_id, count in result.telecaller_distribution.items():
                    if count > 0:
                        telecaller = User.objects.get(id=telecaller_id)
                        self.stdout.write(f"  {telecaller.get_full_name()}: {count} leads")
            else:
                self.stdout.write(self.style.ERROR(f"❌ Assignment failed: {result.error_message}"))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Test failed: {str(e)}"))
    
    def show_help(self):
        """Show help information"""
        self.stdout.write(self.style.SUCCESS('🎯 LEAD ASSIGNMENT MANAGEMENT'))
        self.stdout.write('=' * 50)
        self.stdout.write('Available commands:')
        self.stdout.write('  --analytics     Show comprehensive assignment analytics')
        self.stdout.write('  --workloads     Show detailed telecaller workloads')
        self.stdout.write('  --reset-state   Reset round-robin assignment state')
        self.stdout.write('  --test-assignment  Test assignment with sample data')
        self.stdout.write('  --method METHOD Choose assignment method (round_robin, workload_balance, priority_based)')
        self.stdout.write('\nExamples:')
        self.stdout.write('  python manage.py lead_assignment --analytics')
        self.stdout.write('  python manage.py lead_assignment --workloads')
        self.stdout.write('  python manage.py lead_assignment --test-assignment --method workload_balance')
