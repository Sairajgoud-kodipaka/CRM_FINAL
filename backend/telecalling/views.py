from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Count, Avg, F
from django.utils import timezone
from datetime import datetime, timedelta
from django.contrib.auth import get_user_model

User = get_user_model()
from .models import (
    CustomerVisit, Assignment, CallLog, FollowUp, 
    CustomerProfile, Notification, Analytics, Lead, LeadTransfer
)
from .serializers import (
    CustomerVisitSerializer, AssignmentSerializer, CallLogSerializer, FollowUpSerializer,
    CustomerProfileSerializer, NotificationSerializer, AnalyticsSerializer,
    BulkAssignmentSerializer, AssignmentStatsSerializer, DashboardDataSerializer,
    LeadSerializer, LeadDetailSerializer, LeadTransferSerializer, LeadTransferCreateSerializer
)

class CustomerVisitViewSet(viewsets.ModelViewSet):
    """Step 1: In-House Sales Rep records customer visit info"""
    queryset = CustomerVisit.objects.all()
    serializer_class = CustomerVisitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'inhouse_sales':
            # Sales reps see only their own visits
            return CustomerVisit.objects.filter(sales_rep=user)
        elif user.role == 'manager':
            # Managers see all visits from today
            today = timezone.now().date()
            return CustomerVisit.objects.filter(
                visit_timestamp__date=today,
                assigned_to_telecaller=False
            )
        elif user.role == 'tele_calling':
            # Telecallers see visits assigned to them
            return CustomerVisit.objects.filter(
                assignments__telecaller=user
            ).distinct()
        return CustomerVisit.objects.none()

    def perform_create(self, serializer):
        serializer.save(sales_rep=self.request.user)

    @action(detail=False, methods=['get'])
    def today_leads(self, request):
        """Get today's leads for manager assignment"""
        if request.user.role != 'manager':
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        today = timezone.now().date()
        leads = CustomerVisit.objects.filter(
            visit_timestamp__date=today,
            assigned_to_telecaller=False
        )
        serializer = self.get_serializer(leads, many=True)
        return Response(serializer.data)

class AssignmentViewSet(viewsets.ModelViewSet):
    """Step 2: Manager assigns leads to telecallers"""
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'manager':
            # Managers see all assignments
            return Assignment.objects.all()
        elif user.role == 'tele_calling':
            # Telecallers see only their assignments
            return Assignment.objects.filter(telecaller=user)
        return Assignment.objects.none()

    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)
        # Mark customer visit as assigned
        customer_visit = serializer.instance.customer_visit
        customer_visit.assigned_to_telecaller = True
        customer_visit.save()
        
        # Create notification for telecaller
        Notification.objects.create(
            recipient=serializer.instance.telecaller,
            title="New Assignment",
            message=f"You have been assigned to call {customer_visit.customer_name}",
            notification_type='assignment',
            related_assignment=serializer.instance
        )

    @action(detail=False, methods=['post'])
    def bulk_assign(self, request):
        """Bulk assign leads to telecallers"""
        if request.user.role != 'manager':
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = BulkAssignmentSerializer(data=request.data)
        if serializer.is_valid():
            telecaller_ids = serializer.validated_data['telecaller_ids']
            customer_visit_ids = serializer.validated_data['customer_visit_ids']
            priority = serializer.validated_data['priority']
            notes = serializer.validated_data.get('notes', '')
            
            assignments_created = []
            for i, visit_id in enumerate(customer_visit_ids):
                telecaller_id = telecaller_ids[i % len(telecaller_ids)]
                try:
                    assignment = Assignment.objects.create(
                        telecaller_id=telecaller_id,
                        customer_visit_id=visit_id,
                        assigned_by=request.user,
                        priority=priority,
                        notes=notes
                    )
                    assignments_created.append(assignment)
                    
                    # Mark customer visit as assigned
                    customer_visit = assignment.customer_visit
                    customer_visit.assigned_to_telecaller = True
                    customer_visit.save()
                    
                    # Create notification
                    Notification.objects.create(
                        recipient_id=telecaller_id,
                        title="New Assignment",
                        message=f"You have been assigned to call {customer_visit.customer_name}",
                        notification_type='assignment',
                        related_assignment=assignment
                    )
                except Exception as e:
                    return Response({'error': f'Failed to create assignment: {str(e)}'}, 
                                  status=status.HTTP_400_BAD_REQUEST)
            
            return Response({
                'message': f'Successfully created {len(assignments_created)} assignments',
                'assignments': AssignmentSerializer(assignments_created, many=True).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def detail_with_logs(self, request, pk=None):
        """Get assignment details with call logs"""
        try:
            assignment = self.get_object()
            serializer = self.get_serializer(assignment)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get assignment statistics"""
        user = request.user
        queryset = self.get_queryset()
        
        stats = {
            'total_assignments': queryset.count(),
            'completed_assignments': queryset.filter(status='completed').count(),
            'pending_assignments': queryset.filter(status='assigned').count(),
            'follow_up_assignments': queryset.filter(status='follow_up').count(),
            'total_calls': CallLog.objects.filter(assignment__in=queryset).count(),
            'conversions': CallLog.objects.filter(
                assignment__in=queryset,
                call_status='connected',
                customer_sentiment='positive'
            ).count(),
            'avg_call_duration': CallLog.objects.filter(
                assignment__in=queryset
            ).aggregate(avg=Avg('call_duration'))['avg'] or 0
        }
        
        if stats['total_calls'] > 0:
            stats['conversion_rate'] = (stats['conversions'] / stats['total_calls']) * 100
        else:
            stats['conversion_rate'] = 0
            
        return Response(stats)

class CallLogViewSet(viewsets.ModelViewSet):
    """Step 3: Telecaller logs call details and feedback"""
    queryset = CallLog.objects.all()
    serializer_class = CallLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'tele_calling':
            # Telecallers see only their call logs
            return CallLog.objects.filter(assignment__telecaller=user)
        elif user.role == 'manager':
            # Managers see all call logs
            return CallLog.objects.all()
        return CallLog.objects.none()

    def perform_create(self, serializer):
        call_log = serializer.save()
        
        # Update assignment status based on call outcome
        assignment = call_log.assignment
        if call_log.call_status == 'connected':
            assignment.status = 'completed'
        elif call_log.call_status in ['no_answer', 'busy', 'call_back']:
            assignment.status = 'follow_up'
        elif call_log.call_status == 'not_interested':
            assignment.status = 'completed'
        assignment.save()

        # Create notification for manager
        Notification.objects.create(
            recipient=assignment.assigned_by,
            title="Call Feedback Received",
            message=f"Feedback received for {assignment.customer_visit.customer_name}",
            notification_type='feedback',
            related_assignment=assignment
        )
        
        # Update customer profile
        self.update_customer_profile(call_log)

    def update_customer_profile(self, call_log):
        """Update customer profile with telecaller feedback"""
        assignment = call_log.assignment
        customer_visit = assignment.customer_visit
        
        profile, created = CustomerProfile.objects.get_or_create(
            customer_visit=customer_visit,
            defaults={
                'original_notes': customer_visit.notes,
                'telecaller_feedback': call_log.feedback,
                'last_contact_date': call_log.call_time,
                'engagement_score': self.calculate_engagement_score(call_log),
                'conversion_likelihood': self.calculate_conversion_likelihood(call_log)
            }
        )
        
        if not created:
            profile.telecaller_feedback = call_log.feedback
            profile.last_contact_date = call_log.call_time
            profile.engagement_score = self.calculate_engagement_score(call_log)
            profile.conversion_likelihood = self.calculate_conversion_likelihood(call_log)
            profile.save()

    def calculate_engagement_score(self, call_log):
        """Calculate engagement score based on call outcome and sentiment"""
        base_score = 50
        
        if call_log.call_status == 'connected':
            base_score += 30
        elif call_log.call_status == 'call_back':
            base_score += 20
        elif call_log.call_status == 'no_answer':
            base_score += 10
        
        if call_log.customer_sentiment == 'positive':
            base_score += 20
        elif call_log.customer_sentiment == 'neutral':
            base_score += 10
        elif call_log.customer_sentiment == 'negative':
            base_score -= 20
            
        return max(0, min(100, base_score))

    def calculate_conversion_likelihood(self, call_log):
        """Calculate conversion likelihood based on call outcome"""
        if call_log.call_status == 'connected' and call_log.customer_sentiment == 'positive':
            return 'very_high'
        elif call_log.call_status == 'connected' and call_log.customer_sentiment == 'neutral':
            return 'high'
        elif call_log.call_status == 'call_back':
            return 'medium'
        elif call_log.call_status == 'not_interested':
            return 'very_low'
        else:
            return 'low'

class FollowUpViewSet(viewsets.ModelViewSet):
    """Step 4: Manager monitors and creates follow-ups"""
    queryset = FollowUp.objects.all()
    serializer_class = FollowUpSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'manager':
            # Managers see all follow-ups
            return FollowUp.objects.all()
        elif user.role == 'tele_calling':
            # Telecallers see follow-ups for their assignments
            return FollowUp.objects.filter(assignment__telecaller=user)
        return FollowUp.objects.none()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
        
        # Create notification for telecaller
        follow_up = serializer.instance
        Notification.objects.create(
            recipient=follow_up.assignment.telecaller,
            title="Follow-up Scheduled",
            message=f"Follow-up scheduled for {follow_up.assignment.customer_visit.customer_name}",
            notification_type='follow_up',
            related_assignment=follow_up.assignment
        )

    @action(detail=False, methods=['get'])
    def high_potential_leads(self, request):
        """Get high potential leads for follow-up"""
        if request.user.role != 'manager':
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get assignments with positive sentiment but no conversion
        high_potential = Assignment.objects.filter(
            call_logs__customer_sentiment='positive',
            call_logs__call_status='connected',
            status='follow_up'
        ).distinct()
        
        serializer = AssignmentSerializer(high_potential, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def unconnected_calls(self, request):
        """Get unconnected calls for follow-up"""
        if request.user.role != 'manager':
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        unconnected = Assignment.objects.filter(
            call_logs__call_status__in=['no_answer', 'busy', 'call_back']
        ).distinct()
        
        serializer = AssignmentSerializer(unconnected, many=True)
        return Response(serializer.data)

class CustomerProfileViewSet(viewsets.ModelViewSet):
    """Step 5: Enhanced customer profile with sales rep notes + telecaller feedback"""
    queryset = CustomerProfile.objects.all()
    serializer_class = CustomerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'inhouse_sales':
            # Sales reps see profiles for their visits
            return CustomerProfile.objects.filter(customer_visit__sales_rep=user)
        elif user.role == 'manager':
            # Managers see all profiles
            return CustomerProfile.objects.all()
        elif user.role == 'tele_calling':
            # Telecallers see profiles for their assignments
            return CustomerProfile.objects.filter(
                customer_visit__assignments__telecaller=user
            ).distinct()
        return CustomerProfile.objects.none()

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get customer profile analytics"""
        user = request.user
        queryset = self.get_queryset()
        
        analytics = {
            'total_profiles': queryset.count(),
            'high_engagement': queryset.filter(engagement_score__gte=80).count(),
            'medium_engagement': queryset.filter(
                engagement_score__gte=50, engagement_score__lt=80
            ).count(),
            'low_engagement': queryset.filter(engagement_score__lt=50).count(),
            'avg_engagement_score': queryset.aggregate(avg=Avg('engagement_score'))['avg'] or 0,
            'conversion_likelihood_distribution': {
                'very_high': queryset.filter(conversion_likelihood='very_high').count(),
                'high': queryset.filter(conversion_likelihood='high').count(),
                'medium': queryset.filter(conversion_likelihood='medium').count(),
                'low': queryset.filter(conversion_likelihood='low').count(),
                'very_low': queryset.filter(conversion_likelihood='very_low').count(),
            }
        }
        
        return Response(analytics)

class NotificationViewSet(viewsets.ModelViewSet):
    """Notification system for assignments and feedback alerts"""
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        self.get_queryset().update(is_read=True)
        return Response({'status': 'all marked as read'})

class AnalyticsViewSet(viewsets.ModelViewSet):
    """Analytics tracking for conversion rates and performance metrics"""
    queryset = Analytics.objects.all()
    serializer_class = AnalyticsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['manager', 'tele_calling']:
            return Analytics.objects.all()
        return Analytics.objects.none()

    @action(detail=False, methods=['get'])
    def dashboard_data(self, request):
        """Get dashboard data for different roles"""
        user = request.user
        
        if user.role == 'manager':
            today = timezone.now().date()
            data = {
                'today_leads': CustomerVisit.objects.filter(
                    visit_timestamp__date=today
                ).count(),
                'pending_assignments': Assignment.objects.filter(
                    status='assigned'
                ).count(),
                'completed_calls': CallLog.objects.filter(
                    call_status='connected'
                ).count(),
                'high_potential_leads': Assignment.objects.filter(
                    call_logs__customer_sentiment='positive',
                    status='follow_up'
                ).distinct().count(),
                'unconnected_calls': CallLog.objects.filter(
                    call_status__in=['no_answer', 'busy', 'call_back']
                ).count(),
                'recent_activities': self.get_recent_activities(),
                'performance_metrics': self.get_performance_metrics()
            }
        elif user.role == 'tele_calling':
            data = {
                'my_assignments': Assignment.objects.filter(telecaller=user).count(),
                'completed_calls': CallLog.objects.filter(
                    assignment__telecaller=user,
                    call_status='connected'
                ).count(),
                'pending_followups': FollowUp.objects.filter(
                    assignment__telecaller=user,
                    status='pending'
                ).count(),
                'conversion_rate': self.calculate_telecaller_conversion_rate(user),
                'recent_activities': self.get_telecaller_activities(user)
            }
        else:
            data = {}
        
        return Response(data)

    def get_recent_activities(self):
        """Get recent activities for manager dashboard"""
        activities = []
        
        # Recent assignments
        recent_assignments = Assignment.objects.select_related(
            'telecaller', 'customer_visit'
        ).order_by('-created_at')[:5]
        
        for assignment in recent_assignments:
            activities.append({
                'type': 'assignment',
                'description': f"Assigned {assignment.customer_visit.customer_name} to {assignment.telecaller.get_full_name()}",
                'timestamp': assignment.created_at,
                'user': assignment.assigned_by.get_full_name()
            })
        
        # Recent call logs
        recent_calls = CallLog.objects.select_related(
            'assignment__telecaller', 'assignment__customer_visit'
        ).order_by('-call_time')[:5]
        
        for call in recent_calls:
            activities.append({
                'type': 'call',
                'description': f"Call to {call.assignment.customer_visit.customer_name} - {call.call_status}",
                'timestamp': call.call_time,
                'user': call.assignment.telecaller.get_full_name()
            })
        
        # Sort by timestamp and return top 10
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        return activities[:10]

    def get_performance_metrics(self):
        """Get performance metrics for manager dashboard"""
        today = timezone.now().date()
        
        return {
            'total_leads_today': CustomerVisit.objects.filter(
                visit_timestamp__date=today
            ).count(),
            'assigned_leads_today': Assignment.objects.filter(
                created_at__date=today
            ).count(),
            'conversion_rate': self.calculate_overall_conversion_rate(),
            'avg_call_duration': CallLog.objects.aggregate(
                avg=Avg('call_duration')
            )['avg'] or 0
        }

    def calculate_overall_conversion_rate(self):
        """Calculate overall conversion rate"""
        total_calls = CallLog.objects.filter(call_status='connected').count()
        conversions = CallLog.objects.filter(
            call_status='connected',
            customer_sentiment='positive'
        ).count()
        
        if total_calls > 0:
            return (conversions / total_calls) * 100
        return 0

    def calculate_telecaller_conversion_rate(self, telecaller):
        """Calculate conversion rate for specific telecaller"""
        total_calls = CallLog.objects.filter(
            assignment__telecaller=telecaller,
            call_status='connected'
        ).count()
        
        conversions = CallLog.objects.filter(
            assignment__telecaller=telecaller,
            call_status='connected',
            customer_sentiment='positive'
        ).count()
        
        if total_calls > 0:
            return (conversions / total_calls) * 100
        return 0

    def get_telecaller_activities(self, telecaller):
        """Get recent activities for telecaller"""
        activities = []
        
        # Recent call logs
        recent_calls = CallLog.objects.filter(
            assignment__telecaller=telecaller
        ).select_related('assignment__customer_visit').order_by('-call_time')[:5]
        
        for call in recent_calls:
            activities.append({
                'type': 'call',
                'description': f"Call to {call.assignment.customer_visit.customer_name} - {call.call_status}",
                'timestamp': call.call_time
            })
        
        return activities


class TelecallerDashboardLegacyView(APIView):
    """Telecaller dashboard data using existing models"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Allow telecallers, managers, and admins to view dashboard data
        if request.user.role not in ['tele_calling', 'manager', 'business_admin', 'platform_admin']:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        today = timezone.now().date()
        
        # Get assignments for user (or all assignments for managers/admins)
        if request.user.role == 'tele_calling':
            assignments_query = Assignment.objects.filter(telecaller=request.user)
            call_logs_query = CallLog.objects.filter(assignment__telecaller=request.user)
            followups_query = FollowUp.objects.filter(assignment__telecaller=request.user)
        else:
            assignments_query = Assignment.objects.all()
            call_logs_query = CallLog.objects.all()
            followups_query = FollowUp.objects.all()
        
        # Get today's calls
        calls_today = call_logs_query.filter(call_time__date=today).count()
        
        # Calculate connected rate
        total_calls = call_logs_query.count()
        connected_calls = call_logs_query.filter(call_status='connected').count()
        connected_rate = (connected_calls / total_calls * 100) if total_calls > 0 else 0
        
        # Get appointments set (assuming this comes from assignment status)
        appointments_set = assignments_query.filter(status='completed').count()
        
        # Get follow-ups due
        follow_ups_due = followups_query.filter(
            scheduled_time__date=today,
            status='pending'
        ).count()
        
        # Get assigned leads
        assigned_leads = assignments_query.count()
        
        # Get overdue calls (assignments not completed in 24 hours)
        overdue_time = timezone.now() - timedelta(hours=24)
        overdue_calls = assignments_query.filter(
            status='assigned',
            created_at__lt=overdue_time
        ).count()
        
        # Calculate performance trend (simplified)
        yesterday_calls = call_logs_query.filter(
            call_time__date=today - timedelta(days=1)
        ).count()
        
        if calls_today > yesterday_calls:
            performance_trend = 'up'
        elif calls_today < yesterday_calls:
            performance_trend = 'down'
        else:
            performance_trend = 'stable'
        
        data = {
            'calls_today': calls_today,
            'connected_rate': round(connected_rate, 2),
            'appointments_set': appointments_set,
            'follow_ups_due': follow_ups_due,
            'assigned_leads': assigned_leads,
            'overdue_calls': overdue_calls,
            'performance_trend': performance_trend
        }
        
        return Response(data)


class LeadTransferViewSet(viewsets.ModelViewSet):
    """ViewSet for managing lead transfers from telecallers to sales personnel"""
    queryset = LeadTransfer.objects.all()
    serializer_class = LeadTransferSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'manager':
            # Managers can see all transfers in their tenant
            return LeadTransfer.objects.filter(
                lead__assigned_to__tenant=user.tenant
            )
        elif user.role == 'tele_calling':
            # Telecallers can see transfers they sent or received
            return LeadTransfer.objects.filter(
                Q(from_user=user) | Q(to_user=user)
            )
        elif user.role == 'inhouse_sales':
            # Sales people can see transfers sent to them
            return LeadTransfer.objects.filter(to_user=user)
        return LeadTransfer.objects.none()

    @action(detail=False, methods=['post'])
    def transfer_lead(self, request):
        """Transfer a lead to a sales person"""
        serializer = LeadTransferCreateSerializer(data=request.data)
        if serializer.is_valid():
            lead_id = serializer.validated_data['lead_id']
            to_user_id = serializer.validated_data['to_user_id']
            transfer_reason = serializer.validated_data.get('transfer_reason', '')
            
            try:
                lead = Lead.objects.get(id=lead_id)
                to_user = User.objects.get(id=to_user_id)
                
                # Check if user has permission to transfer this lead
                if request.user.role not in ['tele_calling', 'manager']:
                    return Response(
                        {'error': 'Only telecallers and managers can transfer leads'}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                # Check if lead belongs to the same tenant
                if lead.assigned_to and lead.assigned_to.tenant != to_user.tenant:
                    return Response(
                        {'error': 'Cannot transfer lead to user from different tenant'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Create transfer record
                transfer = LeadTransfer.objects.create(
                    lead=lead,
                    from_user=request.user,
                    to_user=to_user,
                    transfer_reason=transfer_reason
                )
                
                # Update lead assignment
                lead.assigned_to = to_user
                lead.assigned_at = timezone.now()
                lead.status = 'qualified'  # Mark as qualified when transferred to sales
                lead.save()
                
                # Create a Client record for the sales person to see
                from apps.clients.models import Client
                from apps.tenants.models import Tenant
                
                # Check if client already exists for this lead
                existing_client = Client.objects.filter(
                    phone=lead.phone,
                    tenant=to_user.tenant
                ).first()
                
                if not existing_client:
                    # Create new client from lead data
                    client_data = {
                        'first_name': lead.name.split(' ')[0] if lead.name else '',
                        'last_name': ' '.join(lead.name.split(' ')[1:]) if lead.name and len(lead.name.split(' ')) > 1 else '',
                        'email': lead.email or f"{lead.phone}@example.com",  # Use phone as email if no email
                        'phone': lead.phone,
                        'lead_source': lead.source,
                        'assigned_to': to_user,
                        'created_by': request.user,
                        'tenant': to_user.tenant,
                        'store': to_user.store,
                        'status': 'GENERAL',
                        'notes': f"Transferred from telecalling lead. Original source: {lead.source}",
                    }
                    
                    # Add city if available
                    if lead.city:
                        client_data['catchment_area'] = lead.city
                    
                    # Add tags if available
                    if lead.tags:
                        client_data['notes'] += f"\nOriginal tags: {', '.join(lead.tags)}"
                    
                    client = Client.objects.create(**client_data)
                    print(f"✅ Created client {client.id} for transferred lead {lead.name}")
                else:
                    # Update existing client assignment
                    existing_client.assigned_to = to_user
                    existing_client.save()
                    print(f"✅ Updated existing client {existing_client.id} assignment for transferred lead {lead.name}")
                
                return Response({
                    'message': 'Lead transferred successfully',
                    'transfer_id': transfer.id
                }, status=status.HTTP_201_CREATED)
                
            except Lead.DoesNotExist:
                return Response(
                    {'error': 'Lead not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            except User.DoesNotExist:
                return Response(
                    {'error': 'Target user not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def accept_transfer(self, request, pk=None):
        """Accept a lead transfer"""
        transfer = self.get_object()
        
        if transfer.to_user != request.user:
            return Response(
                {'error': 'You can only accept transfers sent to you'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if transfer.status != 'pending':
            return Response(
                {'error': 'Transfer is not pending'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        transfer.status = 'accepted'
        transfer.save()
        
        # Create notification for the sender
        Notification.objects.create(
            recipient=transfer.from_user,
            title="Transfer Accepted",
            message=f"Your transfer of {transfer.lead.name} has been accepted",
            notification_type='transfer_accepted',
            related_transfer=transfer
        )
        
        return Response({'message': 'Transfer accepted successfully'})

    @action(detail=True, methods=['post'])
    def reject_transfer(self, request, pk=None):
        """Reject a lead transfer"""
        transfer = self.get_object()
        
        if transfer.to_user != request.user:
            return Response(
                {'error': 'You can only reject transfers sent to you'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if transfer.status != 'pending':
            return Response(
                {'error': 'Transfer is not pending'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        transfer.status = 'rejected'
        transfer.save()
        
        # Revert lead assignment
        lead = transfer.lead
        lead.assigned_to = transfer.from_user
        lead.status = 'contacted'  # Revert to contacted status
        lead.save()
        
        # Create notification for the sender
        Notification.objects.create(
            recipient=transfer.from_user,
            title="Transfer Rejected",
            message=f"Your transfer of {transfer.lead.name} has been rejected",
            notification_type='transfer_rejected',
            related_transfer=transfer
        )
        
        return Response({'message': 'Transfer rejected successfully'})


class SalesPersonListView(APIView):
    """API view to get list of sales persons for transfer dropdown"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Only telecallers and managers can see sales persons
        if user.role not in ['tele_calling', 'manager']:
            return Response(
                {'error': 'Access denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get sales persons from the same tenant
        sales_persons = User.objects.filter(
            role=User.Role.INHOUSE_SALES,
            tenant=user.tenant,
            is_active=True
        ).values('id', 'first_name', 'last_name', 'email', 'username')
        
        # Format the response
        sales_list = []
        for person in sales_persons:
            sales_list.append({
                'id': person['id'],
                'name': f"{person['first_name'] or ''} {person['last_name'] or ''}".strip() or person['username'],
                'email': person['email'],
                'username': person['username']
            })
        
        return Response(sales_list)