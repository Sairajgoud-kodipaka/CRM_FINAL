# Advanced Call Routing Service
import logging
from django.conf import settings
from typing import Dict, Optional, List, Tuple
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Q, Count, Avg, F
import random

logger = logging.getLogger(__name__)

class AdvancedCallRouter:
    """Advanced call routing and distribution service"""
    
    def __init__(self):
        self.routing_strategies = {
            'round_robin': self._round_robin_routing,
            'skill_based': self._skill_based_routing,
            'workload_based': self._workload_based_routing,
            'performance_based': self._performance_based_routing,
            'geographic': self._geographic_routing,
            'time_based': self._time_based_routing,
            'priority_based': self._priority_based_routing
        }
    
    def route_call(self, lead_id: str, routing_strategy: str = 'skill_based', **kwargs) -> Dict:
        """
        Route call to best available agent based on strategy
        
        Args:
            lead_id: Lead ID to route
            routing_strategy: Routing strategy to use
            **kwargs: Additional routing parameters
            
        Returns:
            Dict with routing result
        """
        try:
            from .models import Lead, CallRequest
            from django.contrib.auth import get_user_model
            
            User = get_user_model()
            lead = Lead.objects.get(id=lead_id)
            
            # Get available agents
            available_agents = self._get_available_agents()
            
            if not available_agents:
                return {
                    'success': False,
                    'error': 'No available agents',
                    'suggestion': 'Try again later or schedule callback'
                }
            
            # Apply routing strategy
            if routing_strategy not in self.routing_strategies:
                routing_strategy = 'skill_based'  # Default fallback
            
            selected_agent = self.routing_strategies[routing_strategy](
                lead, available_agents, **kwargs
            )
            
            if not selected_agent:
                return {
                    'success': False,
                    'error': 'No suitable agent found',
                    'available_agents': len(available_agents)
                }
            
            # Create call request
            call_request = CallRequest.objects.create(
                lead=lead,
                telecaller=selected_agent,
                call_type='outbound',
                status='initiated',
                metadata={
                    'routing_strategy': routing_strategy,
                    'routing_timestamp': timezone.now().isoformat(),
                    'agent_workload': self._get_agent_workload(selected_agent),
                    **kwargs
                }
            )
            
            logger.info(f"Call routed to {selected_agent.username} using {routing_strategy} strategy")
            
            return {
                'success': True,
                'agent_id': selected_agent.id,
                'agent_name': selected_agent.get_full_name(),
                'call_request_id': str(call_request.id),
                'routing_strategy': routing_strategy,
                'agent_workload': self._get_agent_workload(selected_agent)
            }
            
        except Exception as e:
            logger.error(f"Error routing call: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _get_available_agents(self) -> List:
        """Get list of available agents"""
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        # Get agents who are online and not in active calls
        active_calls = CallRequest.objects.filter(
            status__in=['initiated', 'ringing', 'answered'],
            initiated_at__gte=timezone.now() - timedelta(hours=1)
        ).values_list('telecaller_id', flat=True)
        
        available_agents = User.objects.filter(
            role='telecaller',
            is_active=True
        ).exclude(
            id__in=active_calls
        ).annotate(
            active_calls_count=Count('call_requests', filter=Q(
                call_requests__status__in=['initiated', 'ringing', 'answered'],
                call_requests__initiated_at__gte=timezone.now() - timedelta(hours=1)
            ))
        ).filter(active_calls_count=0)
        
        return list(available_agents)
    
    def _round_robin_routing(self, lead, available_agents, **kwargs):
        """Round-robin routing strategy"""
        if not available_agents:
            return None
        
        # Get last assigned agent for round-robin
        last_assignment = CallRequest.objects.filter(
            telecaller__in=available_agents
        ).order_by('-initiated_at').first()
        
        if last_assignment:
            last_agent_index = list(available_agents).index(last_assignment.telecaller)
            next_agent_index = (last_agent_index + 1) % len(available_agents)
            return available_agents[next_agent_index]
        else:
            return available_agents[0]
    
    def _skill_based_routing(self, lead, available_agents, **kwargs):
        """Skill-based routing strategy"""
        if not available_agents:
            return None
        
        # Define skill requirements based on lead characteristics
        lead_skills = self._get_lead_skill_requirements(lead)
        
        # Score agents based on skills
        agent_scores = []
        for agent in available_agents:
            score = self._calculate_agent_skill_score(agent, lead_skills)
            agent_scores.append((agent, score))
        
        # Sort by score (highest first)
        agent_scores.sort(key=lambda x: x[1], reverse=True)
        
        # Return highest scoring agent
        return agent_scores[0][0] if agent_scores else None
    
    def _workload_based_routing(self, lead, available_agents, **kwargs):
        """Workload-based routing strategy"""
        if not available_agents:
            return None
        
        # Calculate workload for each agent
        agent_workloads = []
        for agent in available_agents:
            workload = self._get_agent_workload(agent)
            agent_workloads.append((agent, workload))
        
        # Sort by workload (lowest first)
        agent_workloads.sort(key=lambda x: x[1])
        
        return agent_workloads[0][0] if agent_workloads else None
    
    def _performance_based_routing(self, lead, available_agents, **kwargs):
        """Performance-based routing strategy"""
        if not available_agents:
            return None
        
        # Calculate performance metrics for each agent
        agent_performances = []
        for agent in available_agents:
            performance = self._get_agent_performance(agent)
            agent_performances.append((agent, performance))
        
        # Sort by performance (highest first)
        agent_performances.sort(key=lambda x: x[1], reverse=True)
        
        return agent_performances[0][0] if agent_performances else None
    
    def _geographic_routing(self, lead, available_agents, **kwargs):
        """Geographic routing strategy"""
        if not available_agents:
            return None
        
        lead_city = lead.city.lower() if lead.city else 'unknown'
        
        # Find agents from same city or region
        same_city_agents = [
            agent for agent in available_agents
            if hasattr(agent, 'city') and agent.city and agent.city.lower() == lead_city
        ]
        
        if same_city_agents:
            return random.choice(same_city_agents)
        
        # Fallback to any available agent
        return available_agents[0] if available_agents else None
    
    def _time_based_routing(self, lead, available_agents, **kwargs):
        """Time-based routing strategy"""
        if not available_agents:
            return None
        
        current_hour = timezone.now().hour
        
        # Route based on time of day
        if 9 <= current_hour <= 17:  # Business hours
            # Prefer experienced agents during business hours
            experienced_agents = [
                agent for agent in available_agents
                if self._get_agent_experience(agent) > 6  # 6+ months experience
            ]
            if experienced_agents:
                return random.choice(experienced_agents)
        
        # Fallback to any available agent
        return available_agents[0] if available_agents else None
    
    def _priority_based_routing(self, lead, available_agents, **kwargs):
        """Priority-based routing strategy"""
        if not available_agents:
            return None
        
        # High priority leads get best agents
        if lead.priority == 'high':
            best_agents = [
                agent for agent in available_agents
                if self._get_agent_performance(agent) > 0.8  # Top performers
            ]
            if best_agents:
                return random.choice(best_agents)
        
        # Medium priority leads get good agents
        elif lead.priority == 'medium':
            good_agents = [
                agent for agent in available_agents
                if self._get_agent_performance(agent) > 0.6  # Above average performers
            ]
            if good_agents:
                return random.choice(good_agents)
        
        # Low priority leads get any available agent
        return available_agents[0] if available_agents else None
    
    def _get_lead_skill_requirements(self, lead) -> Dict:
        """Get skill requirements for a lead"""
        skills = {
            'product_knowledge': 'medium',
            'communication': 'high',
            'persuasion': 'medium',
            'technical': 'low'
        }
        
        # Adjust based on lead characteristics
        if lead.source == 'exhibition':
            skills['product_knowledge'] = 'high'
        elif lead.source == 'website':
            skills['technical'] = 'medium'
        
        if lead.priority == 'high':
            skills['communication'] = 'high'
            skills['persuasion'] = 'high'
        
        return skills
    
    def _calculate_agent_skill_score(self, agent, required_skills: Dict) -> float:
        """Calculate agent skill score based on requirements"""
        # This would typically come from agent profiles/skills database
        # For now, we'll use a simplified scoring system
        
        agent_skills = {
            'product_knowledge': random.uniform(0.6, 0.9),
            'communication': random.uniform(0.7, 0.95),
            'persuasion': random.uniform(0.5, 0.8),
            'technical': random.uniform(0.4, 0.7)
        }
        
        total_score = 0
        for skill, requirement in required_skills.items():
            agent_skill_level = agent_skills.get(skill, 0.5)
            
            if requirement == 'high':
                total_score += agent_skill_level * 3
            elif requirement == 'medium':
                total_score += agent_skill_level * 2
            else:  # low
                total_score += agent_skill_level * 1
        
        return total_score
    
    def _get_agent_workload(self, agent) -> int:
        """Get current workload for an agent"""
        today = timezone.now().date()
        
        # Count active calls
        active_calls = CallRequest.objects.filter(
            telecaller=agent,
            status__in=['initiated', 'ringing', 'answered'],
            initiated_at__date=today
        ).count()
        
        # Count completed calls today
        completed_calls = CallRequest.objects.filter(
            telecaller=agent,
            status='completed',
            initiated_at__date=today
        ).count()
        
        # Count pending follow-ups
        pending_followups = CallRequest.objects.filter(
            telecaller=agent,
            call_type='follow_up',
            status='scheduled',
            scheduled_time__gte=timezone.now()
        ).count()
        
        return active_calls + (completed_calls * 0.1) + pending_followups
    
    def _get_agent_performance(self, agent) -> float:
        """Get agent performance score"""
        # Calculate performance metrics
        total_calls = CallRequest.objects.filter(
            telecaller=agent,
            status='completed',
            initiated_at__gte=timezone.now() - timedelta(days=30)
        ).count()
        
        if total_calls == 0:
            return 0.5  # Default score for new agents
        
        # Calculate conversion rate
        positive_calls = CallRequest.objects.filter(
            telecaller=agent,
            sentiment='positive',
            initiated_at__gte=timezone.now() - timedelta(days=30)
        ).count()
        
        conversion_rate = positive_calls / total_calls if total_calls > 0 else 0
        
        # Calculate average call duration (normalized)
        avg_duration = CallRequest.objects.filter(
            telecaller=agent,
            status='completed',
            initiated_at__gte=timezone.now() - timedelta(days=30)
        ).aggregate(avg_duration=Avg('duration'))['avg_duration'] or 0
        
        # Normalize duration (assume 3 minutes is optimal)
        duration_score = min(avg_duration / 180, 1.0)  # 180 seconds = 3 minutes
        
        # Combine metrics
        performance_score = (conversion_rate * 0.7) + (duration_score * 0.3)
        
        return min(performance_score, 1.0)
    
    def _get_agent_experience(self, agent) -> int:
        """Get agent experience in months"""
        # This would typically come from agent profile
        # For now, we'll use a simplified calculation
        
        first_call = CallRequest.objects.filter(
            telecaller=agent
        ).order_by('initiated_at').first()
        
        if first_call:
            experience_days = (timezone.now() - first_call.initiated_at).days
            return experience_days // 30  # Convert to months
        
        return 0  # New agent

class CallDistributionService:
    """Call distribution and load balancing service"""
    
    def __init__(self):
        self.router = AdvancedCallRouter()
    
    def distribute_calls(self, leads: List[str], strategy: str = 'balanced') -> Dict:
        """
        Distribute multiple calls across available agents
        
        Args:
            leads: List of lead IDs to distribute
            strategy: Distribution strategy
            
        Returns:
            Dict with distribution results
        """
        try:
            available_agents = self.router._get_available_agents()
            
            if not available_agents:
                return {
                    'success': False,
                    'error': 'No available agents',
                    'leads_distributed': 0
                }
            
            distribution_results = []
            
            if strategy == 'balanced':
                # Distribute calls evenly across agents
                calls_per_agent = len(leads) // len(available_agents)
                remainder = len(leads) % len(available_agents)
                
                agent_index = 0
                for i, lead_id in enumerate(leads):
                    if i >= (agent_index + 1) * calls_per_agent + min(remainder, agent_index + 1):
                        agent_index += 1
                    
                    agent = available_agents[agent_index]
                    result = self.router.route_call(lead_id, 'workload_based')
                    distribution_results.append(result)
            
            elif strategy == 'priority':
                # Distribute high priority leads to best agents first
                from .models import Lead
                
                # Sort leads by priority
                lead_objects = Lead.objects.filter(id__in=leads).order_by('-priority')
                
                for lead in lead_objects:
                    if lead.priority == 'high':
                        result = self.router.route_call(str(lead.id), 'priority_based')
                    else:
                        result = self.router.route_call(str(lead.id), 'round_robin')
                    distribution_results.append(result)
            
            else:  # Default to round-robin
                for lead_id in leads:
                    result = self.router.route_call(lead_id, 'round_robin')
                    distribution_results.append(result)
            
            successful_distributions = sum(1 for r in distribution_results if r.get('success'))
            
            return {
                'success': True,
                'leads_distributed': successful_distributions,
                'total_leads': len(leads),
                'available_agents': len(available_agents),
                'strategy': strategy,
                'results': distribution_results
            }
            
        except Exception as e:
            logger.error(f"Error distributing calls: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_routing_analytics(self) -> Dict:
        """Get routing analytics and performance metrics"""
        try:
            from .models import CallRequest
            
            # Get routing statistics
            routing_stats = CallRequest.objects.filter(
                initiated_at__gte=timezone.now() - timedelta(days=30)
            ).values('metadata__routing_strategy').annotate(
                count=Count('id'),
                avg_duration=Avg('duration'),
                success_rate=Count('id', filter=Q(status='completed')) * 100.0 / Count('id')
            )
            
            # Get agent performance
            agent_performance = CallRequest.objects.filter(
                initiated_at__gte=timezone.now() - timedelta(days=30),
                status='completed'
            ).values('telecaller__username').annotate(
                total_calls=Count('id'),
                avg_duration=Avg('duration'),
                positive_calls=Count('id', filter=Q(sentiment='positive')),
                conversion_rate=F('positive_calls') * 100.0 / F('total_calls')
            )
            
            return {
                'success': True,
                'routing_strategies': list(routing_stats),
                'agent_performance': list(agent_performance),
                'period_days': 30
            }
            
        except Exception as e:
            logger.error(f"Error getting routing analytics: {str(e)}")
            return {'success': False, 'error': str(e)}

# Initialize services
call_router = AdvancedCallRouter()
distribution_service = CallDistributionService()
