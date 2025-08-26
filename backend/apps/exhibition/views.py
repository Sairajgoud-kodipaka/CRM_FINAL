from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count
from django.utils import timezone
from apps.clients.models import Client
from apps.clients.serializers import ClientSerializer
from apps.users.permissions import IsRoleAllowed
from apps.users.middleware import ScopedVisibilityMixin


class ExhibitionLeadViewSet(viewsets.ModelViewSet, ScopedVisibilityMixin):
    """
    ViewSet for managing exhibition leads.
    Provides specialized endpoints for exhibition lead management.
    """
    serializer_class = ClientSerializer
    permission_classes = [IsRoleAllowed.for_roles(['manager', 'business_admin', 'inhouse_sales', 'tele_calling'])]
    
    def get_queryset(self):
        """Filter clients by exhibition status and user scope"""
        queryset = self.get_scoped_queryset(Client, is_deleted=False)
        
        # Filter for exhibition leads (only those with status='exhibition')
        # This ensures promoted leads don't appear in the list
        queryset = queryset.filter(status='exhibition')
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get exhibition lead statistics"""
        # Get base queryset for user scope
        base_queryset = self.get_scoped_queryset(Client, is_deleted=False)
        
        # Count exhibition leads (ready to promote)
        exhibition_count = base_queryset.filter(status='exhibition').count()
        
        # Count promoted leads (were exhibition leads, now have status='lead' and lead_source='exhibition')
        promoted_count = base_queryset.filter(
            status='lead', 
            lead_source='exhibition'
        ).count()
        
        # Total is sum of both
        total_count = exhibition_count + promoted_count
        
        # Recent leads (within 7 days)
        recent_leads = base_queryset.filter(
            Q(status='exhibition') | Q(lead_source='exhibition'),
            created_at__gte=timezone.now() - timezone.timedelta(days=7)
        ).count()
        
        stats = {
            'total': total_count,
            'exhibition': exhibition_count,
            'promoted': promoted_count,
            'recent_leads': recent_leads,
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def promoted_leads(self, request):
        """Get leads that were promoted from exhibition status"""
        base_queryset = self.get_scoped_queryset(Client, is_deleted=False)
        
        # Get promoted leads (were exhibition leads, now have status='lead' and lead_source='exhibition')
        queryset = base_queryset.filter(
            status='lead', 
            lead_source='exhibition'
        )
        
        # Apply search if provided
        search = request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(phone__icontains=search) |
                Q(email__icontains=search)
            )
        
        # Order by creation date (newest first)
        queryset = queryset.order_by('-created_at')
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def ready_to_promote(self, request):
        """Get leads ready to be promoted to main customer system"""
        queryset = self.get_queryset().filter(status='exhibition')
        
        # Apply search if provided
        search = request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(phone__icontains=search) |
                Q(email__icontains=search)
            )
        
        # Apply filters
        status_filter = request.query_params.get('status', '')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Order by creation date (newest first)
        queryset = queryset.order_by('-created_at')
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def promote(self, request, pk=None):
        """Promote an exhibition lead to main customer system"""
        try:
            client = self.get_object()
            
            if client.status != 'exhibition':
                return Response(
                    {'error': 'Only exhibition leads can be promoted'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update status to 'lead'
            client.status = 'lead'
            client.save()
            
            # Log the promotion action
            from apps.clients.models import AuditLog
            AuditLog.objects.create(
                client=client,
                action='update',
                user=request.user,
                before={'status': 'exhibition'},
                after={'status': 'lead'},
                timestamp=timezone.now()
            )
            
            serializer = self.get_serializer(client)
            return Response({
                'message': 'Lead promoted successfully',
                'client': serializer.data
            })
            
        except Client.DoesNotExist:
            return Response(
                {'error': 'Client not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def bulk_promote(self, request):
        """Promote multiple exhibition leads at once"""
        client_ids = request.data.get('client_ids', [])
        
        if not client_ids:
            return Response(
                {'error': 'No client IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            promoted_count = 0
            failed_count = 0
            results = []
            
            for client_id in client_ids:
                try:
                    client = Client.objects.get(
                        id=client_id,
                        status='exhibition',
                        is_deleted=False
                    )
                    
                    # Check if user has access to this client
                    if not self.has_access_to_client(request.user, client):
                        failed_count += 1
                        results.append({
                            'client_id': client_id,
                            'status': 'failed',
                            'error': 'Access denied'
                        })
                        continue
                    
                    # Update status
                    client.status = 'lead'
                    client.save()
                    
                    # Log the promotion
                    from apps.clients.models import AuditLog
                    AuditLog.objects.create(
                        client=client,
                        action='update',
                        user=request.user,
                        before={'status': 'exhibition'},
                        after={'status': 'lead'},
                        timestamp=timezone.now()
                    )
                    
                    promoted_count += 1
                    results.append({
                        'client_id': client_id,
                        'status': 'success',
                        'message': 'Promoted successfully'
                    })
                    
                except Client.DoesNotExist:
                    failed_count += 1
                    results.append({
                        'client_id': client_id,
                        'status': 'failed',
                        'error': 'Client not found'
                    })
                except Exception as e:
                    failed_count += 1
                    results.append({
                        'client_id': client_id,
                        'status': 'failed',
                        'error': str(e)
                    })
            
            return Response({
                'message': f'Bulk promotion completed. {promoted_count} promoted, {failed_count} failed.',
                'promoted_count': promoted_count,
                'failed_count': failed_count,
                'results': results
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def has_access_to_client(self, user, client):
        """Check if user has access to a specific client"""
        # This is a simplified check - you might want to implement more sophisticated access control
        if user.role in ['platform_admin', 'business_admin']:
            return True
        
        if user.role in ['manager', 'inhouse_sales', 'tele_calling']:
            # Managers, inhouse_sales, and tele_calling can access clients in their store/tenant
            if hasattr(user, 'store') and user.store:
                return client.store == user.store
            if hasattr(user, 'tenant') and user.tenant:
                return client.tenant == user.tenant
        
        return False
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export exhibition leads to CSV"""
        from django.http import HttpResponse
        import csv
        
        queryset = self.get_queryset()
        
        # Create the HttpResponse object with CSV header
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="exhibition_leads.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'ID', 'First Name', 'Last Name', 'Email', 'Phone', 'City', 
            'Status', 'Lead Source', 'Summary Notes', 'Created Date'
        ])
        
        for client in queryset:
            writer.writerow([
                client.id,
                client.first_name or '',
                client.last_name or '',
                client.email or '',
                client.phone or '',
                client.city or '',
                client.status,
                client.lead_source or '',
                client.summary_notes or '',
                client.created_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        return response
