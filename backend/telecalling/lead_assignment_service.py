#!/usr/bin/env python3
"""
Advanced Lead Assignment Service
===============================

This service provides intelligent lead assignment using multiple algorithms:
- Round-robin with state persistence
- Workload balancing
- Priority-based assignment
- Telecaller availability consideration
- Performance tracking

Features:
- Persistent round-robin state
- Real-time workload monitoring
- Priority-based lead distribution
- Telecaller performance tracking
- Assignment analytics
"""

import os
import sys
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Avg
from django.core.cache import cache

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from telecalling.models import Lead, LeadAssignmentState, TelecallerPerformance

User = get_user_model()
logger = logging.getLogger(__name__)


@dataclass
class AssignmentResult:
    """Result of lead assignment operation"""
    success: bool
    leads_assigned: int
    assignment_method: str
    telecaller_distribution: Dict[int, int]
    execution_time: float
    error_message: Optional[str] = None


@dataclass
class TelecallerWorkload:
    """Telecaller workload information"""
    telecaller_id: int
    telecaller_name: str
    active_leads: int
    pending_calls: int
    completed_today: int
    conversion_rate: float
    avg_call_duration: float
    is_available: bool
    last_assignment: Optional[datetime]


class AdvancedLeadAssignmentService:
    """Advanced lead assignment service with multiple algorithms"""
    
    def __init__(self):
        self.cache_key_prefix = "lead_assignment"
        self.cache_timeout = 300  # 5 minutes
    
    def get_active_telecallers(self) -> List[User]:
        """Get all active telecallers with their current status"""
        return list(User.objects.filter(
            role='tele_calling',
            is_active=True
        ).order_by('id'))
    
    def get_telecaller_workloads(self) -> List[TelecallerWorkload]:
        """Get detailed workload information for all telecallers"""
        telecallers = self.get_active_telecallers()
        workloads = []
        
        for telecaller in telecallers:
            # Get current active leads
            active_leads = Lead.objects.filter(
                assigned_to=telecaller,
                status__in=['new', 'contacted', 'qualified']
            ).count()
            
            # Get pending calls
            pending_calls = Lead.objects.filter(
                assigned_to=telecaller,
                status='new',
                call_attempts=0
            ).count()
            
            # Get today's completed calls
            today = timezone.now().date()
            completed_today = Lead.objects.filter(
                assigned_to=telecaller,
                status__in=['contacted', 'qualified', 'appointment_set'],
                last_interaction__date=today
            ).count()
            
            # Get conversion rate (last 30 days)
            thirty_days_ago = timezone.now() - timedelta(days=30)
            conversions = Lead.objects.filter(
                assigned_to=telecaller,
                status='converted',
                last_interaction__gte=thirty_days_ago
            ).count()
            
            total_calls = Lead.objects.filter(
                assigned_to=telecaller,
                last_interaction__gte=thirty_days_ago
            ).count()
            
            conversion_rate = (conversions / total_calls * 100) if total_calls > 0 else 0
            
            # Get average call duration
            avg_duration = Lead.objects.filter(
                assigned_to=telecaller,
                last_interaction__gte=thirty_days_ago
            ).aggregate(avg_duration=Avg('call_attempts'))['avg_duration'] or 0
            
            # Check availability (not overloaded)
            is_available = active_leads < 50  # Max 50 active leads per telecaller
            
            # Get last assignment time
            last_assignment = Lead.objects.filter(
                assigned_to=telecaller
            ).order_by('-assigned_at').first()
            
            workload = TelecallerWorkload(
                telecaller_id=telecaller.id,
                telecaller_name=telecaller.get_full_name() or telecaller.username,
                active_leads=active_leads,
                pending_calls=pending_calls,
                completed_today=completed_today,
                conversion_rate=conversion_rate,
                avg_call_duration=avg_duration,
                is_available=is_available,
                last_assignment=last_assignment.assigned_at if last_assignment else None
            )
            workloads.append(workload)
        
        return workloads
    
    def assign_leads_round_robin(self, leads_data: List[Dict]) -> AssignmentResult:
        """
        Assign leads using persistent round-robin algorithm
        
        This method maintains state across syncs to ensure fair distribution
        """
        start_time = timezone.now()
        
        try:
            telecallers = self.get_active_telecallers()
            if not telecallers:
                return AssignmentResult(
                    success=False,
                    leads_assigned=0,
                    assignment_method='round_robin',
                    telecaller_distribution={},
                    execution_time=(timezone.now() - start_time).total_seconds(),
                    error_message="No active telecallers found"
                )
            
            # Get or create assignment state
            state, created = LeadAssignmentState.objects.get_or_create(
                assignment_type='round_robin',
                defaults={
                    'last_assigned_telecaller_id': None,
                    'assignment_count': 0
                }
            )
            
            # Get current round-robin position
            current_index = 0
            if state.last_assigned_telecaller_id:
                try:
                    current_index = next(
                        i for i, t in enumerate(telecallers) 
                        if t.id == state.last_assigned_telecaller_id
                    )
                    current_index = (current_index + 1) % len(telecallers)
                except StopIteration:
                    current_index = 0
            
            assigned_count = 0
            telecaller_distribution = {t.id: 0 for t in telecallers}
            
            with transaction.atomic():
                # Get existing leads to avoid duplicates - check by phone number
                existing_phones = set(Lead.objects.filter(
                    source_system='google_sheets'
                ).values_list('phone', flat=True))
                
                leads_to_create = []
                
                for lead_data in leads_data:
                    try:
                        # Extract lead information
                        source_id = self._extract_source_id(lead_data)
                        name = self._extract_name(lead_data)
                        phone = self._extract_phone(lead_data)
                        
                        if not source_id or not name or not phone:
                            continue
                        
                        # Skip if already exists (check by phone)
                        if phone in existing_phones:
                            continue
                        
                        # Assign to next telecaller in round-robin
                        assigned_telecaller = telecallers[current_index]
                        current_index = (current_index + 1) % len(telecallers)
                        
                        # Prepare lead data
                        lead_fields = {
                            'name': name,
                            'phone': phone,
                            'email': self._extract_email(lead_data),
                            'city': self._extract_city(lead_data),
                            'source': self._extract_source(lead_data),
                            'source_system': 'google_sheets',
                            'source_id': source_id,
                            'fetched_at': timezone.now(),
                            'raw_data': lead_data,
                            'assigned_to': assigned_telecaller,
                            'assigned_at': timezone.now(),
                            'priority': self._determine_priority(lead_data)
                        }
                        
                        leads_to_create.append(Lead(**lead_fields))
                        telecaller_distribution[assigned_telecaller.id] += 1
                        
                    except Exception as e:
                        logger.error(f"Error processing lead: {str(e)}")
                        continue
                
                # Bulk create leads
                if leads_to_create:
                    Lead.objects.bulk_create(leads_to_create, batch_size=100)
                    assigned_count = len(leads_to_create)
                    
                    # Update assignment state
                    state.last_assigned_telecaller_id = telecallers[(current_index - 1) % len(telecallers)].id
                    state.assignment_count += assigned_count
                    state.save()
                    
                    logger.info(f"Round-robin assignment: {assigned_count} leads assigned")
            
            return AssignmentResult(
                success=True,
                leads_assigned=assigned_count,
                assignment_method='round_robin',
                telecaller_distribution=telecaller_distribution,
                execution_time=(timezone.now() - start_time).total_seconds()
            )
            
        except Exception as e:
            logger.error(f"Error in round-robin assignment: {str(e)}")
            return AssignmentResult(
                success=False,
                leads_assigned=0,
                assignment_method='round_robin',
                telecaller_distribution={},
                execution_time=(timezone.now() - start_time).total_seconds(),
                error_message=str(e)
            )
    
    def assign_leads_workload_balance(self, leads_data: List[Dict]) -> AssignmentResult:
        """
        Assign leads using workload balancing algorithm
        
        Assigns leads to telecallers with the least current workload
        """
        start_time = timezone.now()
        
        try:
            workloads = self.get_telecaller_workloads()
            available_telecallers = [w for w in workloads if w.is_available]
            
            if not available_telecallers:
                return AssignmentResult(
                    success=False,
                    leads_assigned=0,
                    assignment_method='workload_balance',
                    telecaller_distribution={},
                    execution_time=(timezone.now() - start_time).total_seconds(),
                    error_message="No available telecallers found"
                )
            
            assigned_count = 0
            telecaller_distribution = {w.telecaller_id: 0 for w in workloads}
            
            with transaction.atomic():
                # Get existing leads to avoid duplicates - check by phone number
                existing_phones = set(Lead.objects.filter(
                    source_system='google_sheets'
                ).values_list('phone', flat=True))
                
                leads_to_create = []
                
                for lead_data in leads_data:
                    try:
                        # Extract lead information
                        source_id = self._extract_source_id(lead_data)
                        name = self._extract_name(lead_data)
                        phone = self._extract_phone(lead_data)
                        
                        if not source_id or not name or not phone:
                            continue
                        
                        # Skip if already exists (check by phone)
                        if phone in existing_phones:
                            continue
                        
                        # Find telecaller with least workload
                        min_workload_telecaller = min(
                            available_telecallers, 
                            key=lambda w: w.active_leads
                        )
                        
                        # Prepare lead data
                        lead_fields = {
                            'name': name,
                            'phone': phone,
                            'email': self._extract_email(lead_data),
                            'city': self._extract_city(lead_data),
                            'source': self._extract_source(lead_data),
                            'source_system': 'google_sheets',
                            'source_id': source_id,
                            'fetched_at': timezone.now(),
                            'raw_data': lead_data,
                            'assigned_to_id': min_workload_telecaller.telecaller_id,
                            'assigned_at': timezone.now(),
                            'priority': self._determine_priority(lead_data)
                        }
                        
                        leads_to_create.append(Lead(**lead_fields))
                        telecaller_distribution[min_workload_telecaller.telecaller_id] += 1
                        
                        # Update workload count
                        min_workload_telecaller.active_leads += 1
                        
                    except Exception as e:
                        logger.error(f"Error processing lead: {str(e)}")
                        continue
                
                # Bulk create leads
                if leads_to_create:
                    Lead.objects.bulk_create(leads_to_create, batch_size=100)
                    assigned_count = len(leads_to_create)
                    
                    logger.info(f"Workload balance assignment: {assigned_count} leads assigned")
            
            return AssignmentResult(
                success=True,
                leads_assigned=assigned_count,
                assignment_method='workload_balance',
                telecaller_distribution=telecaller_distribution,
                execution_time=(timezone.now() - start_time).total_seconds()
            )
            
        except Exception as e:
            logger.error(f"Error in workload balance assignment: {str(e)}")
            return AssignmentResult(
                success=False,
                leads_assigned=0,
                assignment_method='workload_balance',
                telecaller_distribution={},
                execution_time=(timezone.now() - start_time).total_seconds(),
                error_message=str(e)
            )
    
    def assign_leads_priority_based(self, leads_data: List[Dict]) -> AssignmentResult:
        """
        Assign leads using priority-based algorithm
        
        High priority leads go to best performing telecallers
        """
        start_time = timezone.now()
        
        try:
            workloads = self.get_telecaller_workloads()
            available_telecallers = [w for w in workloads if w.is_available]
            
            if not available_telecallers:
                return AssignmentResult(
                    success=False,
                    leads_assigned=0,
                    assignment_method='priority_based',
                    telecaller_distribution={},
                    execution_time=(timezone.now() - start_time).total_seconds(),
                    error_message="No available telecallers found"
                )
            
            # Sort telecallers by performance (conversion rate)
            sorted_telecallers = sorted(
                available_telecallers, 
                key=lambda w: w.conversion_rate, 
                reverse=True
            )
            
            assigned_count = 0
            telecaller_distribution = {w.telecaller_id: 0 for w in workloads}
            
            with transaction.atomic():
                # Get existing leads to avoid duplicates - check by phone number
                existing_phones = set(Lead.objects.filter(
                    source_system='google_sheets'
                ).values_list('phone', flat=True))
                
                # Group leads by priority
                high_priority_leads = []
                medium_priority_leads = []
                low_priority_leads = []
                
                for lead_data in leads_data:
                    try:
                        source_id = self._extract_source_id(lead_data)
                        name = self._extract_name(lead_data)
                        phone = self._extract_phone(lead_data)
                        
                        if not source_id or not name or not phone:
                            continue
                        
                        if source_id in existing_source_ids:
                            continue
                        
                        priority = self._determine_priority(lead_data)
                        lead_data['_priority'] = priority
                        
                        if priority == 'high':
                            high_priority_leads.append(lead_data)
                        elif priority == 'medium':
                            medium_priority_leads.append(lead_data)
                        else:
                            low_priority_leads.append(lead_data)
                            
                    except Exception as e:
                        logger.error(f"Error processing lead: {str(e)}")
                        continue
                
                # Assign high priority leads to best telecallers
                leads_to_create = []
                current_telecaller_index = 0
                
                for priority_group in [high_priority_leads, medium_priority_leads, low_priority_leads]:
                    for lead_data in priority_group:
                        try:
                            assigned_telecaller = sorted_telecallers[current_telecaller_index % len(sorted_telecallers)]
                            current_telecaller_index += 1
                            
                            # Prepare lead data
                            lead_fields = {
                                'name': self._extract_name(lead_data),
                                'phone': self._extract_phone(lead_data),
                                'email': self._extract_email(lead_data),
                                'city': self._extract_city(lead_data),
                                'source': self._extract_source(lead_data),
                                'source_system': 'google_sheets',
                                'source_id': self._extract_source_id(lead_data),
                                'fetched_at': timezone.now(),
                                'raw_data': lead_data,
                                'assigned_to_id': assigned_telecaller.telecaller_id,
                                'assigned_at': timezone.now(),
                                'priority': lead_data['_priority']
                            }
                            
                            leads_to_create.append(Lead(**lead_fields))
                            telecaller_distribution[assigned_telecaller.telecaller_id] += 1
                            
                        except Exception as e:
                            logger.error(f"Error processing lead: {str(e)}")
                            continue
                
                # Bulk create leads
                if leads_to_create:
                    Lead.objects.bulk_create(leads_to_create, batch_size=100)
                    assigned_count = len(leads_to_create)
                    
                    logger.info(f"Priority-based assignment: {assigned_count} leads assigned")
            
            return AssignmentResult(
                success=True,
                leads_assigned=assigned_count,
                assignment_method='priority_based',
                telecaller_distribution=telecaller_distribution,
                execution_time=(timezone.now() - start_time).total_seconds()
            )
            
        except Exception as e:
            logger.error(f"Error in priority-based assignment: {str(e)}")
            return AssignmentResult(
                success=False,
                leads_assigned=0,
                assignment_method='priority_based',
                telecaller_distribution={},
                execution_time=(timezone.now() - start_time).total_seconds(),
                error_message=str(e)
            )
    
    def get_assignment_analytics(self) -> Dict:
        """Get comprehensive assignment analytics"""
        try:
            # Get telecaller workloads
            workloads = self.get_telecaller_workloads()
            
            # Get assignment state
            round_robin_state = LeadAssignmentState.objects.filter(
                assignment_type='round_robin'
            ).first()
            
            # Get recent assignment statistics
            last_24_hours = timezone.now() - timedelta(hours=24)
            recent_assignments = Lead.objects.filter(
                assigned_at__gte=last_24_hours
            ).values('assigned_to').annotate(
                count=Count('id')
            ).order_by('-count')
            
            analytics = {
                'total_telecallers': len(workloads),
                'available_telecallers': len([w for w in workloads if w.is_available]),
                'total_active_leads': sum(w.active_leads for w in workloads),
                'round_robin_state': {
                    'last_assigned_telecaller_id': round_robin_state.last_assigned_telecaller_id if round_robin_state else None,
                    'total_assignments': round_robin_state.assignment_count if round_robin_state else 0,
                    'last_assignment_time': round_robin_state.last_assignment_time if round_robin_state else None
                },
                'telecaller_workloads': [
                    {
                        'id': w.telecaller_id,
                        'name': w.telecaller_name,
                        'active_leads': w.active_leads,
                        'pending_calls': w.pending_calls,
                        'conversion_rate': w.conversion_rate,
                        'is_available': w.is_available
                    }
                    for w in workloads
                ],
                'recent_assignments': list(recent_assignments),
                'generated_at': timezone.now()
            }
            
            return analytics
            
        except Exception as e:
            logger.error(f"Error getting assignment analytics: {str(e)}")
            return {'error': str(e)}
    
    def _extract_source_id(self, lead_data: Dict) -> str:
        """Extract source ID from lead data - use phone number for better duplicate detection"""
        phone = self._extract_phone(lead_data)
        name = self._extract_name(lead_data)
        
        # Create a more stable source ID based on phone and name
        # This helps prevent duplicates when the same person appears multiple times
        stable_id = f"sheet_{phone}_{name}".replace(' ', '_').lower()
        
        return stable_id
    
    def _extract_name(self, lead_data: Dict) -> str:
        """Extract name from lead data"""
        return (
            lead_data.get('full_name', '') or 
            lead_data.get('name', '') or 
            lead_data.get('customer_name', '') or
            lead_data.get('Name', '') or
            lead_data.get('Full Name', '') or
            lead_data.get('ad_name', '') or
            f"Lead from {lead_data.get('campaign_name', 'Campaign')}"
        )
    
    def _extract_phone(self, lead_data: Dict) -> str:
        """Extract phone from lead data"""
        return (
            lead_data.get('phone_number', '') or 
            lead_data.get('phone', '') or 
            lead_data.get('mobile', '') or
            lead_data.get('Phone', '') or
            lead_data.get('Phone Number', '') or
            lead_data.get('Mobile', '') or
            f"9999{str(hash(self._extract_source_id(lead_data)))[-6:]}"
        )
    
    def _extract_email(self, lead_data: Dict) -> str:
        """Extract email from lead data"""
        return (
            lead_data.get('Email', '') or 
            lead_data.get('email', '') or 
            lead_data.get('Email Address', '')
        )
    
    def _extract_city(self, lead_data: Dict) -> str:
        """Extract city from lead data"""
        return (
            lead_data.get('City', '') or 
            lead_data.get('city', '') or 
            lead_data.get('location', '') or
            lead_data.get('Timeline', '') or
            'Unknown'
        )
    
    def _extract_source(self, lead_data: Dict) -> str:
        """Extract source from lead data"""
        return (
            lead_data.get('campaign_name', '') or 
            lead_data.get('source', '') or 
            lead_data.get('campaign', '') or
            lead_data.get('adset_name', '') or
            'google_sheets'
        )
    
    def _determine_priority(self, lead_data: Dict) -> str:
        """Determine lead priority based on data"""
        # High priority indicators
        if any(keyword in str(lead_data).lower() for keyword in ['urgent', 'hot', 'premium', 'vip']):
            return 'high'
        
        # Medium priority indicators
        if any(keyword in str(lead_data).lower() for keyword in ['interested', 'follow', 'callback']):
            return 'medium'
        
        # Default to low priority
        return 'low'


# Convenience functions for backward compatibility
def assign_leads_round_robin(leads_data: List[Dict]) -> AssignmentResult:
    """Convenience function for round-robin assignment"""
    service = AdvancedLeadAssignmentService()
    return service.assign_leads_round_robin(leads_data)


def assign_leads_workload_balance(leads_data: List[Dict]) -> AssignmentResult:
    """Convenience function for workload balance assignment"""
    service = AdvancedLeadAssignmentService()
    return service.assign_leads_workload_balance(leads_data)


def assign_leads_priority_based(leads_data: List[Dict]) -> AssignmentResult:
    """Convenience function for priority-based assignment"""
    service = AdvancedLeadAssignmentService()
    return service.assign_leads_priority_based(leads_data)


def get_assignment_analytics() -> Dict:
    """Convenience function for getting assignment analytics"""
    service = AdvancedLeadAssignmentService()
    return service.get_assignment_analytics()


if __name__ == '__main__':
    # Test the service
    service = AdvancedLeadAssignmentService()
    
    # Test analytics
    analytics = service.get_assignment_analytics()
    print("Assignment Analytics:")
    print(f"Total Telecallers: {analytics.get('total_telecallers', 0)}")
    print(f"Available Telecallers: {analytics.get('available_telecallers', 0)}")
    print(f"Total Active Leads: {analytics.get('total_active_leads', 0)}")
    
    # Test workloads
    workloads = service.get_telecaller_workloads()
    print("\nTelecaller Workloads:")
    for workload in workloads:
        print(f"- {workload.telecaller_name}: {workload.active_leads} active leads, {workload.conversion_rate:.1f}% conversion rate")
