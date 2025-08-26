from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Store, StoreUserMap
from .serializers import StoreSerializer, StoreUserMapSerializer
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import timedelta

# Create your views here.

class StoreViewSet(viewsets.ModelViewSet):
    serializer_class = StoreSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Store.objects.all()
        if hasattr(user, 'is_platform_admin') and user.is_platform_admin:
            return queryset
        # All users (including business admins) only see their tenant's stores
        if user.tenant:
            return queryset.filter(tenant=user.tenant)
        return queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        print("DEBUG: Creating store for user", user, "tenant", user.tenant)
        if not user.tenant:
            raise ValidationError({"detail": "Your user account is not assigned to a tenant. Please contact your administrator."})
        # Only platform admin can set tenant explicitly
        if hasattr(user, 'is_platform_admin') and user.is_platform_admin:
            serializer.save()
        else:
            serializer.save(tenant=user.tenant)

    @action(detail=True, methods=['get'], url_path='performance')
    def performance(self, request, pk=None):
        """Get store performance metrics and KPIs"""
        store = self.get_object()
        
        # Get date ranges
        today = timezone.now().date()
        this_month_start = today.replace(day=1)
        this_month_end = today
        
        # Import models here to avoid circular imports
        from apps.sales.models import Sale, SaleItem, SalesPipeline
        from apps.clients.models import Client
        from apps.products.models import Product
        from apps.users.models import User
        
        # Get all users assigned to this store
        store_users = User.objects.filter(store=store)
        
        # Today's sales - filter by both sales_representative store AND client store
        today_sales = Sale.objects.filter(
            Q(sales_representative__store=store) | Q(client__store=store),
            created_at__date=today
        ).aggregate(
            count=Count('id'),
            revenue=Sum('total_amount')
        )
        
        # This month's sales
        this_month_sales = Sale.objects.filter(
            Q(sales_representative__store=store) | Q(client__store=store),
            created_at__date__gte=this_month_start,
            created_at__date__lte=this_month_end
        ).aggregate(
            count=Count('id'),
            revenue=Sum('total_amount')
        )
        
        # All time sales
        all_time_sales = Sale.objects.filter(
            Q(sales_representative__store=store) | Q(client__store=store)
        ).aggregate(
            count=Count('id'),
            revenue=Sum('total_amount')
        )
        
        # Customer metrics - count customers assigned to this store
        total_customers = Client.objects.filter(
            Q(store=store) | Q(assigned_to__store=store)
        ).count()
        
        # Active deals (sales in progress + pipeline deals)
        active_deals = Sale.objects.filter(
            Q(sales_representative__store=store) | Q(client__store=store),
            status__in=['pending', 'confirmed', 'processing']
        ).count()
        
        # Add pipeline deals
        pipeline_deals = SalesPipeline.objects.filter(
            Q(client__store=store) | Q(sales_representative__store=store),
            stage__in=['interested', 'negotiation', 'store_walkin']
        ).count()
        
        active_deals += pipeline_deals
        
        # Closed won deals
        closed_won_deals = Sale.objects.filter(
            Q(sales_representative__store=store) | Q(client__store=store),
            status='delivered'
        ).count()
        
        # Add closed won pipeline deals
        pipeline_closed = SalesPipeline.objects.filter(
            Q(client__store=store) | Q(sales_representative__store=store),
            stage='closed_won'
        ).count()
        
        closed_won_deals += pipeline_closed
        
        # Staff count - both direct store users and StoreUserMap
        staff_count = store_users.count()
        store_user_map_count = StoreUserMap.objects.filter(store=store).count()
        total_staff = max(staff_count, store_user_map_count)
        
        # Inventory value - calculate from products in this store
        try:
            inventory_value = Product.objects.filter(
                store=store,
                status='active'  # Use the correct status field
            ).aggregate(
                total_value=Sum('selling_price')
            )['total_value'] or 0
        except Exception as e:
            inventory_value = 0
        
        response_data = {
            'store_id': store.id,
            'store_name': store.name,
            'total_sales': all_time_sales['count'] or 0,  # Changed from total_revenue to total_sales
            'today_sales': float(today_sales['revenue'] or 0),
            'this_month_sales': float(this_month_sales['revenue'] or 0),
            'total_customers': total_customers,
            'active_deals': active_deals,
            'closed_won_deals': closed_won_deals,
            'inventory_value': float(inventory_value),
            'staff_count': total_staff,
            'today_sales_count': today_sales['count'] or 0,
            'this_month_sales_count': this_month_sales['count'] or 0,
            'all_time_sales_count': all_time_sales['count'] or 0
        }
        
        return Response(response_data)

    @action(detail=True, methods=['get'], url_path='staff')
    def staff(self, request, pk=None):
        """Get store staff information and roles"""
        store = self.get_object()
        
        # Get staff members through both direct store assignment and StoreUserMap
        from apps.users.models import User
        
        # Direct store users
        direct_users = User.objects.filter(store=store)
        
        # StoreUserMap users
        store_user_maps = StoreUserMap.objects.filter(store=store)
        
        staff_data = []
        processed_user_ids = set()
        
        # Process direct store users first
        for user in direct_users:
            if user.id not in processed_user_ids:
                # Calculate sales and deals for this month
                from apps.sales.models import Sale, SalesPipeline
                this_month = timezone.now().date().replace(day=1)
                
                # Sales this month
                sales_this_month = Sale.objects.filter(
                    Q(sales_representative=user) | Q(client__store=store),
                    created_at__date__gte=this_month
                ).aggregate(
                    count=Count('id'),
                    revenue=Sum('total_amount')
                )
                
                # Deals closed this month
                deals_closed = SalesPipeline.objects.filter(
                    Q(sales_representative=user) | Q(client__store=store),
                    stage='closed_won',
                    actual_close_date__gte=this_month
                ).count()
                
                staff_data.append({
                    'id': user.id,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': user.role,
                    'email': user.email,
                    'phone': user.phone,
                    'is_active': user.is_active,
                    'sales_this_month': float(sales_this_month['revenue'] or 0),
                    'deals_closed': deals_closed,
                    'sales_count': sales_this_month['count'] or 0
                })
                processed_user_ids.add(user.id)
        
        # Process StoreUserMap users
        for staff_member in store_user_maps:
            user = staff_member.user
            if user.id not in processed_user_ids:
                # Calculate sales and deals for this month
                from apps.sales.models import Sale, SalesPipeline
                this_month = timezone.now().date().replace(day=1)
                
                # Sales this month
                sales_this_month = Sale.objects.filter(
                    Q(sales_representative=user) | Q(client__store=store),
                    created_at__date__gte=this_month
                ).aggregate(
                    count=Count('id'),
                    revenue=Sum('total_amount')
                )
                
                # Deals closed this month
                deals_closed = SalesPipeline.objects.filter(
                    Q(sales_representative=user) | Q(client__store=store),
                    stage='closed_won',
                    actual_close_date__gte=this_month
                ).count()
                
                staff_data.append({
                    'id': user.id,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': staff_member.role,  # Use role from StoreUserMap
                    'email': user.email,
                    'phone': user.phone,
                    'is_active': user.is_active,
                    'sales_this_month': float(sales_this_month['revenue'] or 0),
                    'deals_closed': deals_closed,
                    'sales_count': sales_this_month['count'] or 0
                })
                processed_user_ids.add(user.id)
        
        # Calculate role distribution
        role_distribution = {}
        for member in staff_data:
            role = member['role']
            role_distribution[role] = role_distribution.get(role, 0) + 1
        
        return Response({
            'store_id': store.id,
            'store_name': store.name,
            'total_staff': len(staff_data),
            'role_distribution': role_distribution,
            'staff_members': staff_data
        })

    @action(detail=True, methods=['get'], url_path='recent-sales')
    def recent_sales(self, request, pk=None):
        """Get recent sales for the store"""
        store = self.get_object()
        
        # Get limit from query params (default 10)
        limit = int(request.query_params.get('limit', 10))
        
        # Import Sale model here to avoid circular imports
        from apps.sales.models import Sale
        
        # Get recent sales for staff in this store OR clients from this store
        recent_sales = Sale.objects.filter(
            Q(sales_representative__store=store) | Q(client__store=store)
        ).select_related(
            'client', 
            'sales_representative'
        ).order_by('-created_at')[:limit]
        
        sales_data = []
        for sale in recent_sales:
            sales_data.append({
                'id': sale.id,
                'order_number': sale.order_number,
                'client_name': sale.client.full_name if hasattr(sale.client, 'full_name') else f"{sale.client.first_name} {sale.client.last_name}",
                'client_id': sale.client.id,
                'sales_rep_name': f"{sale.sales_representative.first_name} {sale.sales_representative.last_name}",
                'sales_rep_id': sale.sales_representative.id,
                'status': sale.status,
                'payment_status': sale.payment_status,
                'total_amount': float(sale.total_amount),
                'paid_amount': float(sale.paid_amount),
                'order_date': sale.order_date.isoformat(),
                'delivery_date': sale.delivery_date.isoformat() if sale.delivery_date else None,
                'shipping_method': sale.shipping_method,
                'tracking_number': sale.tracking_number
            })
        
        return Response({
            'store_id': store.id,
            'store_name': store.name,
            'sales_count': len(sales_data),
            'sales': sales_data
        })

    @action(detail=True, methods=['patch'], url_path='assign-team')
    def assign_team(self, request, pk=None):
        store = self.get_object()
        assignments = request.data.get('assignments', [])
        # Only allow users from the same tenant to be assigned
        for assignment in assignments:
            user_id = assignment.get('user')
            role = assignment.get('role')
            can_view_all = assignment.get('can_view_all', False)
            if not user_id or not role:
                continue
            # Check user belongs to the same tenant
            from apps.users.models import User
            try:
                user = User.objects.get(id=user_id, tenant=store.tenant)
            except User.DoesNotExist:
                continue
            StoreUserMap.objects.update_or_create(
                user=user, store=store, role=role,
                defaults={'can_view_all': can_view_all}
            )
        return Response({'status': 'team assigned'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='team')
    def get_team(self, request, pk=None):
        store = self.get_object()
        team = StoreUserMap.objects.filter(store=store)
        serializer = StoreUserMapSerializer(team, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='dashboard')
    def dashboard(self, request, pk=None):
        store = self.get_object()
        # Example KPIs: customer count, sales count, etc.
        from apps.clients.models import Client
        from apps.sales.models import Sale
        customer_count = Client.objects.filter(assigned_to__managed_stores=store).count()
        sales_count = Sale.objects.filter(sales_representative__managed_stores=store).count()
        # Add more KPIs as needed
        return Response({
            'customer_count': customer_count,
            'sales_count': sales_count,
        })

class StoreUserMapViewSet(viewsets.ModelViewSet):
    queryset = StoreUserMap.objects.all()
    serializer_class = StoreUserMapSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['user', 'store']
