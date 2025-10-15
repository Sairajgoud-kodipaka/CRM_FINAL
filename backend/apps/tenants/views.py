from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta, datetime
from decimal import Decimal
from .models import Tenant
from .serializers import TenantSerializer
from apps.users.permissions import IsRoleAllowed
from apps.clients.models import Client
from apps.sales.models import Sale, SalesPipeline
from apps.products.models import Product
from apps.users.models import User, TeamMember
from rest_framework.permissions import IsAuthenticated
from apps.stores.models import Store

User = get_user_model()

class TenantListView(generics.ListAPIView):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [IsRoleAllowed.for_roles(['business_admin', 'platform_admin'])]

    def get(self, request, *args, **kwargs):
        # Check if user has the required role
        if request.user.role not in ['business_admin', 'platform_admin']:
            return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get all tenants
        tenants = Tenant.objects.all()
        
        # Serialize the data
        serializer = self.get_serializer(tenants, many=True)
        data = serializer.data
        
        return Response(data)

class TenantCreateView(generics.CreateAPIView):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [IsRoleAllowed.for_roles(['business_admin', 'platform_admin'])]

    def create(self, request, *args, **kwargs):
        admin_username = request.data.get('admin_username')
        admin_email = request.data.get('admin_email')
        admin_password = request.data.get('admin_password')
      
        if not (admin_username and admin_email and admin_password):
            missing_fields = []
            if not admin_username:
                missing_fields.append('admin_username')
            if not admin_email:
                missing_fields.append('admin_email')
            if not admin_password:
                missing_fields.append('admin_password')
            return Response({
                'detail': f'Admin username, email, and password are required. Missing: {", ".join(missing_fields)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate password strength
        if len(admin_password) < 8:
            return Response({
                'detail': 'Admin password must be at least 8 characters long'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate email format
        import re
        email_regex = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
        if not email_regex.match(admin_email):
            return Response({
                'detail': 'Please enter a valid email address for the admin account'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if username or email already exists globally
        if User.objects.filter(username=admin_username).exists():
            return Response({
                'detail': 'Admin username already exists in the system'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=admin_email).exists():
            return Response({
                'detail': 'Admin email already exists in the system'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create the tenant first
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            tenant = serializer.save()
            
            # Create the admin user for this tenant
            user = User.objects.create_user(
                username=admin_username,
                email=admin_email,
                password=admin_password,
                role=User.Role.BUSINESS_ADMIN,
                tenant=tenant,
                is_active=True
            )
            
            headers = self.get_success_headers(serializer.data)
            return Response({
                'success': True,
                'message': 'Tenant and admin user created successfully',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED, headers=headers)
            
        except Exception as e:
            # If anything goes wrong, clean up the tenant
            if 'tenant' in locals():
                tenant.delete()
            return Response({
                'detail': f'Failed to create tenant: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TenantDetailView(generics.RetrieveAPIView):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [IsRoleAllowed.for_roles(['business_admin', 'platform_admin'])]

class TenantUpdateView(generics.UpdateAPIView):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [IsRoleAllowed.for_roles(['business_admin', 'platform_admin'])]
    lookup_field = 'pk'
    
    def update(self, request, *args, **kwargs):
        try:
            response = super().update(request, *args, **kwargs)
            return Response({
                'success': True,
                'message': 'Tenant updated successfully',
                'data': response.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'detail': f'Failed to update tenant: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TenantDeleteView(generics.DestroyAPIView):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [IsRoleAllowed.for_roles(['platform_admin'])]

    def perform_destroy(self, instance):
        """Perform tenant deletion with proper cleanup."""
        try:
            # Get all related data for logging
            user_count = instance.users.count()
            client_count = Client.objects.filter(tenant=instance).count()
            product_count = Product.objects.filter(tenant=instance).count()
            sale_count = Sale.objects.filter(tenant=instance).count()
            
            # Delete all related data
            # Note: This will cascade delete due to foreign key relationships
            # but we're being explicit for better control and logging
            
            # Delete sales and related data
            Sale.objects.filter(tenant=instance).delete()
            SalesPipeline.objects.filter(tenant=instance).delete()
            
            # Delete products
            Product.objects.filter(tenant=instance).delete()
            
            # Delete clients and related data
            Client.objects.filter(tenant=instance).delete()
            
            # Delete users (this will cascade to team members)
            instance.users.all().delete()
            
            # Finally delete the tenant
            instance.delete()
            
        except Exception as e:
            raise

    def destroy(self, request, *args, **kwargs):
        """Override destroy method to return proper response."""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'success': True,
            'message': 'Tenant and all associated data deleted successfully'
        }, status=status.HTTP_200_OK)


class PlatformAdminDashboardView(APIView):
    """Platform Admin Dashboard - Provides platform-wide statistics"""
    permission_classes = [IsRoleAllowed.for_roles(['platform_admin'])]

    def get(self, request):
        try:
            # Get date range for analytics (last 30 days)
            end_date = timezone.now()
            start_date = end_date - timedelta(days=30)
            
            # 1. Total Tenants
            total_tenants = Tenant.objects.count()
            active_tenants = Tenant.objects.filter(subscription_status='active').count()
            
            # 2. Total Users across all tenants
            total_users = User.objects.exclude(role=User.Role.PLATFORM_ADMIN).count()
            
            # 3. Total Sales across all tenants (last 30 days) - only closed won pipelines count as sales
            from apps.sales.models import SalesPipeline
            
            closed_won_pipelines = SalesPipeline.objects.filter(
                created_at__gte=start_date,
                created_at__lte=end_date,
                stage='closed_won'
            ).aggregate(
                total=Sum('expected_value'),
                count=Count('id')
            )
            
            sales_amount = closed_won_pipelines['total'] or Decimal('0.00')
            sales_count = closed_won_pipelines['count'] or 0
            
            # 4. Recent Tenants (last 5 created)
            recent_tenants = Tenant.objects.order_by('-created_at')[:5]
            recent_tenants_data = []
            for tenant in recent_tenants:
                recent_tenants_data.append({
                    'id': tenant.id,
                    'name': tenant.name,
                    'business_type': tenant.business_type or 'Jewelry Business',
                    'subscription_status': tenant.subscription_status,
                    'created_at': tenant.created_at.strftime('%Y-%m-%d'),
                    'user_count': tenant.users.count()
                })
            
            # 5. System Health Metrics
            system_health = {
                'uptime': '99.9%',
                'active_subscriptions': active_tenants,
                'total_revenue': float(sales_amount),
                'support_tickets': 0  # Placeholder for future implementation
            }
            
            return Response({
                'total_tenants': total_tenants,
                'active_tenants': active_tenants,
                'total_users': total_users,
                'total_sales': {
                    'amount': float(sales_amount),
                    'count': sales_count
                },
                'recent_tenants': recent_tenants_data,
                'system_health': system_health
            })
            
        except Exception as e:
            return Response(
                {'error': 'Failed to fetch platform dashboard data'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ManagerDashboardView(APIView):
    """Manager Dashboard - Provides comprehensive store-specific data with scoped visibility"""
    permission_classes = [IsRoleAllowed.for_roles(['manager', 'inhouse_sales'])]

    def get(self, request):
        user = request.user
        tenant = user.tenant
        
        if not tenant:
            return Response({'error': 'No tenant associated with user'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user.store:
            return Response({
                'success': False,
                'error': 'User not assigned to any store'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get date filter parameters from request
        filter_type = request.query_params.get('filter_type', 'today')
        start_date_param = request.query_params.get('start_date')
        end_date_param = request.query_params.get('end_date')
        
        # Additional month filter parameters
        year_param = request.query_params.get('year')
        month_param = request.query_params.get('month')
        month_name_param = request.query_params.get('month_name')
        timezone_param = request.query_params.get('timezone')
        
        print(f"🔍 Manager Dashboard Request Debug:")
        print(f"   Filter Type: {filter_type}")
        print(f"   Start Date Param: {start_date_param}")
        print(f"   End Date Param: {end_date_param}")
        print(f"   Year Param: {year_param}")
        print(f"   Month Param: {month_param}")
        print(f"   Month Name Param: {month_name_param}")
        print(f"   Timezone Param: {timezone_param}")
        print(f"   User Role: {user.role}")
        print(f"   Tenant: {tenant.name if tenant else 'None'}")
        print(f"   User Store: {user.store.name if user.store else 'None'}")
        
        # Calculate date ranges based on filter type (same as BusinessDashboardView)
        end_date = timezone.now()
        
        if start_date_param and end_date_param:
            # Custom date range from frontend
            try:
                start_date = datetime.fromisoformat(start_date_param.replace('Z', '+00:00')).replace(tzinfo=timezone.utc)
                end_date = datetime.fromisoformat(end_date_param.replace('Z', '+00:00')).replace(tzinfo=timezone.utc)
                
                # Additional validation using year/month parameters if provided
                if year_param and month_param:
                    try:
                        year = int(year_param)
                        month = int(month_param)
                        
                        # Create expected date range from year/month
                        expected_start = datetime(year, month + 1, 1).replace(tzinfo=timezone.utc)  # month is 0-indexed
                        expected_end = datetime(year, month + 2, 1).replace(tzinfo=timezone.utc) - timedelta(microseconds=1)
                        
                        print(f"🔍 Date Validation:")
                        print(f"   Expected Start: {expected_start}")
                        print(f"   Expected End: {expected_end}")
                        print(f"   Actual Start: {start_date}")
                        print(f"   Actual End: {end_date}")
                        
                        # Validate that the dates match the expected month
                        if abs((start_date - expected_start).total_seconds()) > 86400:  # More than 1 day difference
                            print(f"⚠️  WARNING: Start date doesn't match expected month!")
                        if abs((end_date - expected_end).total_seconds()) > 86400:  # More than 1 day difference
                            print(f"⚠️  WARNING: End date doesn't match expected month!")
                            
                    except (ValueError, TypeError) as e:
                        print(f"⚠️  WARNING: Could not parse year/month parameters: {e}")
                        
            except (ValueError, TypeError) as e:
                # Fallback to default if date parsing fails
                print(f"⚠️  WARNING: Date parsing failed: {e}")
                start_date = end_date - timedelta(days=30)
        else:
            # Default date ranges based on filter type
            if filter_type == 'today':
                start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
            elif filter_type == 'yesterday':
                start_date = (end_date - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = (end_date - timedelta(days=1)).replace(hour=23, minute=59, second=59, microsecond=999999)
            elif filter_type == 'last7days':
                start_date = end_date - timedelta(days=7)
                start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            elif filter_type == 'last30days':
                start_date = end_date - timedelta(days=30)
                start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            elif filter_type == 'thisWeek':
                # Start of current week (Monday)
                day_of_week = end_date.weekday()
                start_date = end_date - timedelta(days=day_of_week)
                start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            elif filter_type == 'thisMonth':
                # Start of current month
                start_date = end_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            elif filter_type == 'lastMonth':
                # Start of last month
                if end_date.month == 1:
                    start_date = end_date.replace(year=end_date.year-1, month=12, day=1, hour=0, minute=0, second=0, microsecond=0)
                else:
                    start_date = end_date.replace(month=end_date.month-1, day=1, hour=0, minute=0, second=0, microsecond=0)
                # End of last month
                if end_date.month == 1:
                    end_date = end_date.replace(year=end_date.year-1, month=12, day=31, hour=23, minute=59, second=59, microsecond=999999)
                else:
                    # Calculate the last day of the previous month
                    first_day_current_month = end_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                    last_day_previous_month = first_day_current_month - timedelta(days=1)
                    end_date = last_day_previous_month.replace(hour=23, minute=59, second=59, microsecond=999999)
            else:
                # Default to today
                start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Ensure end_date is set to end of day if not already set
        if filter_type not in ['yesterday', 'lastMonth']:
            end_date = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Special handling for monthly filter - ensure ultra-strict date boundaries
        if filter_type == 'monthly' and year_param and month_param:
            try:
                year = int(year_param)
                month = int(month_param)
                
                # Convert 0-indexed month to 1-indexed month
                month_1_indexed = month + 1
                
                # Force exact month boundaries
                start_date = datetime(year, month_1_indexed, 1).replace(tzinfo=timezone.utc)
                
                # Calculate end of month properly
                if month_1_indexed == 12:
                    # December - next month is January of next year
                    end_date = datetime(year + 1, 1, 1).replace(tzinfo=timezone.utc) - timedelta(microseconds=1)
                else:
                    # Other months - next month is month + 1
                    end_date = datetime(year, month_1_indexed + 1, 1).replace(tzinfo=timezone.utc) - timedelta(microseconds=1)
                
                print(f"🔒 ULTRA-STRICT Monthly Filter Applied:")
                print(f"   Year: {year}, Month (0-indexed): {month}, Month (1-indexed): {month_1_indexed}")
                print(f"   Forced Start: {start_date}")
                print(f"   Forced End: {end_date}")
                
            except (ValueError, TypeError) as e:
                print(f"⚠️  WARNING: Could not apply ultra-strict monthly filter: {e}")
        
        print(f"📅 Calculated Date Range:")
        print(f"   Start Date: {start_date}")
        print(f"   End Date: {end_date}")
        print(f"   Date Range: {(end_date - start_date).days + 1} days")
        
        try:
            # Base filters with scoped visibility (manager sees only their store)
            base_sales_filter = {'tenant': tenant, 'client__store': user.store}
            base_pipeline_filter = {'tenant': tenant, 'client__store': user.store}
            base_store_filter = {'tenant': tenant, 'id': user.store.id}
            
            print(f"🔧 Base Filters (Scoped to Store):")
            print(f"   base_sales_filter: {base_sales_filter}")
            print(f"   base_pipeline_filter: {base_pipeline_filter}")
            print(f"   base_store_filter: {base_store_filter}")
            
            # 1. Total Sales for the selected date range
            period_sales = Sale.objects.filter(
                **base_sales_filter,
                created_at__gte=start_date,
                created_at__lte=end_date
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
            
            # ULTRA STRICT date filtering - ONLY actual_close_date within range
            period_closed_won_query = SalesPipeline.objects.filter(
                **base_pipeline_filter,
                stage='closed_won',
                actual_close_date__gte=start_date,
                actual_close_date__lte=end_date
            )
            
            print(f"🔍 Period Closed Won Query:")
            print(f"   Query SQL: {period_closed_won_query.query}")
            print(f"   Query Count: {period_closed_won_query.count()}")
            
            period_closed_won = period_closed_won_query.aggregate(total=Sum('expected_value'))['total'] or Decimal('0.00')
            
            period_total = period_closed_won  # Only closed won revenue counts as sales
            
            print(f"💰 Revenue Calculations:")
            print(f"   Period Sales Revenue: {period_sales}")
            print(f"   Period Closed Won Revenue: {period_closed_won}")
            print(f"   Period Total Revenue: {period_total}")
            
            # Count sales for the period
            period_sales_count = Sale.objects.filter(
                **base_sales_filter,
                created_at__gte=start_date,
                created_at__lte=end_date
            ).count()
            
            # ULTRA STRICT date filtering - ONLY actual_close_date within range
            period_closed_won_count = SalesPipeline.objects.filter(
                **base_pipeline_filter,
                stage='closed_won',
                actual_close_date__gte=start_date,
                actual_close_date__lte=end_date
            ).count()
            
            period_total_sales_count = period_closed_won_count  # Only closed won count counts as sales
            
            print(f"📊 Count Calculations:")
            print(f"   Period Sales Count: {period_sales_count}")
            print(f"   Period Closed Won Count: {period_closed_won_count}")
            print(f"   Period Total Sales Count: {period_total_sales_count}")
            
            # 2. Customer counts for the period
            new_customers_count = Client.objects.filter(
                **base_store_filter,
                created_at__gte=start_date,
                created_at__lte=end_date,
                is_deleted=False
            ).count()
            
            # Total customers should also be filtered by date range for consistency
            total_customers_count = Client.objects.filter(
                **base_store_filter,
                created_at__gte=start_date,
                created_at__lte=end_date,
                is_deleted=False
            ).count()
            
            # 3. Pipeline Revenue (pending deals) - with date filtering
            pipeline_revenue = SalesPipeline.objects.filter(
                **base_pipeline_filter,
                stage__in=['exhibition', 'social_media', 'interested', 'store_walkin', 'negotiation'],
                created_at__gte=start_date,
                created_at__lte=end_date
            ).aggregate(total=Sum('expected_value'))['total'] or Decimal('0.00')
            
            # 3. Closed Won Pipeline Count - with date filtering
            closed_won_pipeline_count = SalesPipeline.objects.filter(
                **base_pipeline_filter,
                stage='closed_won',
                actual_close_date__gte=start_date,
                actual_close_date__lte=end_date
            ).count()
            
            # 4. Pipeline Deals Count (pending deals) - with date filtering
            pipeline_deals_count = SalesPipeline.objects.filter(
                **base_pipeline_filter,
                stage__in=['exhibition', 'social_media', 'interested', 'store_walkin', 'negotiation'],
                created_at__gte=start_date,
                created_at__lte=end_date
            ).count()
            
            # 5. Store Performance (for manager's store only)
            store_performance = []
            store = user.store
            if store:
                # Store closed won revenue
                store_closed_won = SalesPipeline.objects.filter(
                    **base_pipeline_filter,
                    stage='closed_won',
                    actual_close_date__gte=start_date,
                    actual_close_date__lte=end_date
                ).aggregate(total=Sum('expected_value'))['total'] or Decimal('0.00')
                
                # Store sales count
                store_sales_count = SalesPipeline.objects.filter(
                    **base_pipeline_filter,
                    stage='closed_won',
                    actual_close_date__gte=start_date,
                    actual_close_date__lte=end_date
                ).count()
                
                store_performance.append({
                    'id': store.id,
                    'name': store.name,
                    'revenue': float(store_closed_won),
                    'sales_count': store_sales_count,
                    'closed_deals': store_sales_count
                })
                
                print(f"🏪 Store Performance - {store.name}:")
                print(f"   Store Closed Won Revenue: {store_closed_won}")
                print(f"   Store Sales Count: {store_sales_count}")
            
            # 6. Team Performance (for manager's store team)
            team_performance = []
            team_members = User.objects.filter(
                tenant=tenant,
                store=user.store,
                role__in=['manager', 'inhouse_sales']
            )
            
            for member in team_members:
                member_pipeline_filter = {**base_pipeline_filter, 'sales_representative': member}
                
                member_closed_won = SalesPipeline.objects.filter(
                    **member_pipeline_filter,
                    stage='closed_won',
                    actual_close_date__gte=start_date,
                    actual_close_date__lte=end_date
                ).aggregate(total=Sum('expected_value'))['total'] or Decimal('0.00')
                
                member_deals = SalesPipeline.objects.filter(
                    **member_pipeline_filter,
                    stage='closed_won',
                    actual_close_date__gte=start_date,
                    actual_close_date__lte=end_date
                ).count()
                
                if float(member_closed_won) > 0 or member_deals > 0:
                    team_performance.append({
                        'id': member.id,
                        'name': f"{member.first_name} {member.last_name}",
                        'revenue': float(member_closed_won),
                        'deals_closed': member_deals
                    })
            
            # 7. Today's stats (if today is in the range)
            today = timezone.now().date()
            today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
            today_end = timezone.now().replace(hour=23, minute=59, second=59, microsecond=999999)
            
            today_sales = Sale.objects.filter(
                **base_sales_filter,
                created_at__gte=today_start,
                created_at__lte=today_end
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
            
            today_closed_won = SalesPipeline.objects.filter(
                **base_pipeline_filter,
                stage='closed_won',
                actual_close_date__gte=today_start,
                actual_close_date__lte=today_end
            ).aggregate(total=Sum('expected_value'))['total'] or Decimal('0.00')
            
            today_revenue = today_closed_won
            
            # New customers today
            new_today_customers = Client.objects.filter(
                tenant=tenant,
                store=user.store,
                created_at__gte=today_start,
                created_at__lte=today_end,
                is_deleted=False
            ).count()
            
            # Today's appointments
            todays_appointments = 0
            try:
                from apps.appointments.models import Appointment
                todays_appointments = Appointment.objects.filter(
                    tenant=tenant,
                    store=user.store,
                    date=today
                ).count()
            except ImportError:
                print("⚠️  WARNING: Appointments module not found, setting appointments to 0")
                todays_appointments = 0
            except Exception as e:
                print(f"⚠️  WARNING: Error fetching appointments: {e}")
                todays_appointments = 0
            
            # Prepare comprehensive dashboard data
            dashboard_data = {
                'store_name': user.store.name,
                'monthly_sales': {
                    'count': period_total_sales_count,
                    'revenue': float(period_total)
                },
                'monthly_customers': {
                    'new': new_customers_count,
                    'total': total_customers_count
                },
                'monthly_pipeline': {
                    'active': pipeline_deals_count,
                    'closed': closed_won_pipeline_count,
                    'revenue': float(pipeline_revenue)
                },
                'total_sales': {
                    'period': float(period_total),
                    'today': float(today_revenue),
                    'period_count': period_total_sales_count
                },
                'store_performance': store_performance,
                'team_performance': team_performance,
                'today_stats': {
                    'sales': float(today_sales),
                    'revenue': float(today_revenue),
                    'new_customers': new_today_customers,
                    'appointments': todays_appointments
                },
                'date_range': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat(),
                    'filter_type': filter_type
                }
            }
            
            return Response({
                'success': True,
                'data': dashboard_data
            })
            
        except Exception as e:
            print(f"❌ Error in ManagerDashboardView: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'error': 'Failed to fetch dashboard data'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BusinessDashboardView(APIView):
    """Business Admin Dashboard - Provides real data for the dashboard"""
    permission_classes = [IsRoleAllowed.for_roles(['business_admin', 'manager', 'inhouse_sales'])]

    def get(self, request):
        print(f"🎯 BUSINESS DASHBOARD API CALLED!")
        print(f"   User: {request.user.username}")
        print(f"   Role: {request.user.role}")
        print(f"   Query Params: {request.query_params}")
        
        user = request.user
        tenant = user.tenant
        
        if not tenant:
            return Response({'error': 'No tenant associated with user'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get date filter parameters from request
        filter_type = request.query_params.get('filter_type', 'today')
        start_date_param = request.query_params.get('start_date')
        end_date_param = request.query_params.get('end_date')
        
        # Additional month filter parameters
        year_param = request.query_params.get('year')
        month_param = request.query_params.get('month')
        month_name_param = request.query_params.get('month_name')
        timezone_param = request.query_params.get('timezone')
        
        print(f"🔍 Dashboard Request Debug:")
        print(f"   Filter Type: {filter_type}")
        print(f"   Start Date Param: {start_date_param}")
        print(f"   End Date Param: {end_date_param}")
        print(f"   Year Param: {year_param}")
        print(f"   Month Param: {month_param}")
        print(f"   Month Name Param: {month_name_param}")
        print(f"   Timezone Param: {timezone_param}")
        print(f"   User Role: {user.role}")
        print(f"   Tenant: {tenant.name if tenant else 'None'}")
        print(f"   Raw start_date_param: {repr(start_date_param)}")
        print(f"   Raw end_date_param: {repr(end_date_param)}")
        print(f"   User Store: {user.store.name if hasattr(user, 'store') and user.store else 'None'}")
        
        # Calculate date ranges based on filter type
        end_date = timezone.now()
        
        if start_date_param and end_date_param:
            # Custom date range
            try:
                start_date = timezone.make_aware(datetime.fromisoformat(start_date_param.replace('Z', '+00:00')))
                end_date = timezone.make_aware(datetime.fromisoformat(end_date_param.replace('Z', '+00:00')))
                
                # Additional validation using year/month parameters if provided
                if year_param and month_param:
                    try:
                        year = int(year_param)
                        month = int(month_param)
                        
                        # Create expected date range from year/month
                        expected_start = datetime(year, month + 1, 1).replace(tzinfo=timezone.utc)  # month is 0-indexed
                        expected_end = datetime(year, month + 2, 1).replace(tzinfo=timezone.utc) - timedelta(microseconds=1)
                        
                        print(f"🔍 Date Validation:")
                        print(f"   Expected Start: {expected_start}")
                        print(f"   Expected End: {expected_end}")
                        print(f"   Actual Start: {start_date}")
                        print(f"   Actual End: {end_date}")
                        
                        # Validate that the dates match the expected month
                        if abs((start_date - expected_start).total_seconds()) > 86400:  # More than 1 day difference
                            print(f"⚠️  WARNING: Start date doesn't match expected month!")
                        if abs((end_date - expected_end).total_seconds()) > 86400:  # More than 1 day difference
                            print(f"⚠️  WARNING: End date doesn't match expected month!")
                            
                    except (ValueError, TypeError) as e:
                        print(f"⚠️  WARNING: Could not parse year/month parameters: {e}")
                        
            except (ValueError, TypeError) as e:
                # Fallback to default if date parsing fails
                print(f"⚠️  WARNING: Date parsing failed: {e}")
                start_date = end_date - timedelta(days=30)
        else:
            # Default date ranges based on filter type
            if filter_type == 'today':
                start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
            elif filter_type == 'yesterday':
                start_date = (end_date - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
                end_date = (end_date - timedelta(days=1)).replace(hour=23, minute=59, second=59, microsecond=999999)
            elif filter_type == 'last7days':
                start_date = end_date - timedelta(days=7)
                start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            elif filter_type == 'last30days':
                start_date = end_date - timedelta(days=30)
                start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            elif filter_type == 'thisWeek':
                # Start of current week (Monday)
                day_of_week = end_date.weekday()
                start_date = end_date - timedelta(days=day_of_week)
                start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            elif filter_type == 'thisMonth':
                # Start of current month
                start_date = end_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            elif filter_type == 'lastMonth':
                # Start of last month
                if end_date.month == 1:
                    start_date = end_date.replace(year=end_date.year-1, month=12, day=1, hour=0, minute=0, second=0, microsecond=0)
                else:
                    start_date = end_date.replace(month=end_date.month-1, day=1, hour=0, minute=0, second=0, microsecond=0)
                # End of last month
                if end_date.month == 1:
                    end_date = end_date.replace(year=end_date.year-1, month=12, day=31, hour=23, minute=59, second=59, microsecond=999999)
                else:
                    # Calculate the last day of the previous month
                    first_day_current_month = end_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                    last_day_previous_month = first_day_current_month - timedelta(days=1)
                    end_date = last_day_previous_month.replace(hour=23, minute=59, second=59, microsecond=999999)
            else:
                # Default to today
                start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Ensure end_date is set to end of day if not already set
        if filter_type not in ['yesterday', 'lastMonth']:
            end_date = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Special handling for monthly filter - ensure ultra-strict date boundaries
        if filter_type == 'monthly' and year_param and month_param:
            try:
                year = int(year_param)
                month = int(month_param)
                
                # Convert 0-indexed month to 1-indexed month
                month_1_indexed = month + 1
                
                # Force exact month boundaries
                start_date = datetime(year, month_1_indexed, 1).replace(tzinfo=timezone.utc)
                
                # Calculate end of month properly
                if month_1_indexed == 12:
                    # December - next month is January of next year
                    end_date = datetime(year + 1, 1, 1).replace(tzinfo=timezone.utc) - timedelta(microseconds=1)
                else:
                    # Other months - next month is month + 1
                    end_date = datetime(year, month_1_indexed + 1, 1).replace(tzinfo=timezone.utc) - timedelta(microseconds=1)
                
                print(f"🔒 ULTRA-STRICT Monthly Filter Applied:")
                print(f"   Year: {year}, Month (0-indexed): {month}, Month (1-indexed): {month_1_indexed}")
                print(f"   Forced Start: {start_date}")
                print(f"   Forced End: {end_date}")
                
            except (ValueError, TypeError) as e:
                print(f"⚠️  WARNING: Could not apply ultra-strict monthly filter: {e}")
        
        print(f"📅 Calculated Date Range:")
        print(f"   Start Date: {start_date}")
        print(f"   End Date: {end_date}")
        print(f"   Date Range: {(end_date - start_date).days + 1} days")
        print(f"   Start Date ISO: {start_date.isoformat()}")
        print(f"   End Date ISO: {end_date.isoformat()}")
        
        try:
            # Base filters based on user role
            base_sales_filter = {'tenant': tenant}
            base_pipeline_filter = {'tenant': tenant}
            base_store_filter = {'tenant': tenant}
            
            print(f"🔧 Base Filters:")
            print(f"   base_sales_filter: {base_sales_filter}")
            print(f"   base_pipeline_filter: {base_pipeline_filter}")
            print(f"   base_store_filter: {base_store_filter}")
            
            # Role-based filtering
            if user.role == 'business_admin':
                # Business admin sees all data across all stores
                pass
            elif user.role == 'manager':
                # Manager sees only their store data
                if user.store:
                    base_sales_filter['client__store'] = user.store
                    base_pipeline_filter['client__store'] = user.store
                    base_store_filter['id'] = user.store.id
            elif user.role == 'inhouse_sales':
                # In-house sales sees only their store data
                if user.store:
                    base_sales_filter['client__store'] = user.store
                    base_pipeline_filter['client__store'] = user.store
                    base_store_filter['id'] = user.store.id
            
            # Check if there's any actual data for this period
            sales_exist = Sale.objects.filter(**base_sales_filter, created_at__gte=start_date, created_at__lte=end_date).exists()
            pipelines_exist = SalesPipeline.objects.filter(**base_pipeline_filter, actual_close_date__gte=start_date.date(), actual_close_date__lte=end_date.date()).exists()
            has_any_data = sales_exist or pipelines_exist
            
            print(f"🔍 Data Check Debug:")
            print(f"   Sales exist: {sales_exist}")
            print(f"   Pipelines exist: {pipelines_exist}")
            print(f"   Has any data: {has_any_data}")
            print(f"   Start date: {start_date.date()}")
            print(f"   End date: {end_date.date()}")
            
            if not has_any_data:
                print("=" * 80)
                print("🚨🚨🚨 ZERO DATA RESPONSE TRIGGERED 🚨🚨🚨")
                print(f"⚠️ No data found for period {start_date.date()} to {end_date.date()}")
                print(f"🚀 Returning ZERO data for January 2025")
                print("=" * 80)
                return Response({
                    'success': True,
                    'data': {
                        'monthly_sales': {'count': 0, 'revenue': 0},
                        'monthly_customers': {'new': 0, 'total': 0},
                        'monthly_pipeline': {'active': 0, 'closed': 0, 'revenue': 0},
                        'store_performance': [],
                        'top_performers': []
                    },
                    'debug_info': {
                        'has_data': False,
                        'period': f"{start_date.date()} to {end_date.date()}",
                        'timestamp': timezone.now().isoformat()
                    }
                })
            
            # 1. Total Sales for the selected date range
            period_sales = Sale.objects.filter(
                **base_sales_filter,
                created_at__gte=start_date,
                created_at__lte=end_date
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
            
            # Debug: Check what closed-won pipelines exist and their dates
            all_closed_won = SalesPipeline.objects.filter(
                **base_pipeline_filter,
                stage='closed_won'
            )
            
            print(f"🔍 All Closed Won Pipelines:")
            for pipeline in all_closed_won:
                print(f"   Pipeline ID: {pipeline.id}")
                print(f"   Created At: {pipeline.created_at}")
                print(f"   Updated At: {pipeline.updated_at}")
                print(f"   Actual Close Date: {pipeline.actual_close_date}")
                print(f"   Expected Value: {pipeline.expected_value}")
                print(f"   ---")
            
            # ULTRA STRICT date filtering - ONLY actual_close_date within range
            period_closed_won_query = SalesPipeline.objects.filter(
                **base_pipeline_filter,
                stage='closed_won',
                actual_close_date__gte=start_date,
                actual_close_date__lte=end_date
            )
            
            print(f"🔍 Period Closed Won Query:")
            print(f"   Query SQL: {period_closed_won_query.query}")
            print(f"   Query Count: {period_closed_won_query.count()}")
            
            period_closed_won = period_closed_won_query.aggregate(total=Sum('expected_value'))['total'] or Decimal('0.00')
            
            period_total = period_closed_won  # Only closed won revenue counts as sales
            
            print(f"💰 Revenue Calculations:")
            print(f"   Period Sales Revenue: {period_sales}")
            print(f"   Period Closed Won Revenue: {period_closed_won}")
            print(f"   Period Total Revenue: {period_total}")
            
            # Count sales for the period
            period_sales_count = Sale.objects.filter(
                **base_sales_filter,
                created_at__gte=start_date,
                created_at__lte=end_date
            ).count()
            
            # ULTRA STRICT date filtering - ONLY actual_close_date within range
            period_closed_won_count = SalesPipeline.objects.filter(
                **base_pipeline_filter,
                stage='closed_won',
                actual_close_date__gte=start_date,
                actual_close_date__lte=end_date
            ).count()
            
            period_total_sales_count = period_closed_won_count  # Only closed won count counts as sales
            
            print(f"📊 Count Calculations:")
            print(f"   Period Sales Count: {period_sales_count}")
            print(f"   Period Closed Won Count: {period_closed_won_count}")
            print(f"   Period Total Sales Count: {period_total_sales_count}")
            
            # For backward compatibility, also calculate today, week, month
            today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
            week_start = timezone.now() - timedelta(days=7)
            month_start = timezone.now() - timedelta(days=30)
            
            today_sales = Sale.objects.filter(
                **base_sales_filter,
                created_at__gte=today_start,
                created_at__lte=timezone.now()
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
            
            today_closed_won = SalesPipeline.objects.filter(
                **base_pipeline_filter,
                stage='closed_won'
            ).filter(
                Q(actual_close_date__gte=today_start, actual_close_date__lte=timezone.now()) |
                Q(actual_close_date__isnull=True, updated_at__gte=today_start, updated_at__lte=timezone.now())
            ).aggregate(total=Sum('expected_value'))['total'] or Decimal('0.00')
            
            today_total = today_closed_won  # Only closed won revenue counts as sales
            
            week_sales = Sale.objects.filter(
                **base_sales_filter,
                created_at__gte=week_start,
                created_at__lte=timezone.now()
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
            
            week_closed_won = SalesPipeline.objects.filter(
                **base_pipeline_filter,
                stage='closed_won'
            ).filter(
                Q(actual_close_date__gte=week_start, actual_close_date__lte=timezone.now()) |
                Q(actual_close_date__isnull=True, updated_at__gte=week_start, updated_at__lte=timezone.now())
            ).aggregate(total=Sum('expected_value'))['total'] or Decimal('0.00')
            
            week_total = week_closed_won  # Only closed won revenue counts as sales
            
            month_sales = Sale.objects.filter(
                **base_sales_filter,
                created_at__gte=month_start,
                created_at__lte=timezone.now()
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
            
            month_closed_won = SalesPipeline.objects.filter(
                **base_pipeline_filter,
                stage='closed_won'
            ).filter(
                Q(actual_close_date__gte=month_start, actual_close_date__lte=timezone.now()) |
                Q(actual_close_date__isnull=True, updated_at__gte=month_start, updated_at__lte=timezone.now())
            ).aggregate(total=Sum('expected_value'))['total'] or Decimal('0.00')
            
            month_total = month_closed_won  # Only closed won revenue counts as sales
            
            # Count sales for today, week, month
            today_sales_count = Sale.objects.filter(
                **base_sales_filter,
                created_at__gte=today_start,
                created_at__lte=timezone.now()
            ).count()
            
            today_closed_won_count = SalesPipeline.objects.filter(
                **base_pipeline_filter,
                stage='closed_won'
            ).filter(
                Q(actual_close_date__gte=today_start, actual_close_date__lte=timezone.now()) |
                Q(actual_close_date__isnull=True, updated_at__gte=today_start, updated_at__lte=timezone.now())
            ).count()
            
            today_total_sales_count = today_closed_won_count  # Only closed won count counts as sales
            
            week_sales_count = Sale.objects.filter(
                **base_sales_filter,
                created_at__gte=week_start,
                created_at__lte=timezone.now()
            ).count()
            
            week_closed_won_count = SalesPipeline.objects.filter(
                **base_pipeline_filter,
                stage='closed_won'
            ).filter(
                Q(actual_close_date__gte=week_start, actual_close_date__lte=timezone.now()) |
                Q(actual_close_date__isnull=True, updated_at__gte=week_start, updated_at__lte=timezone.now())
            ).count()
            
            week_total_sales_count = week_closed_won_count  # Only closed won count counts as sales
            
            month_sales_count = Sale.objects.filter(
                **base_sales_filter,
                created_at__gte=month_start,
                created_at__lte=timezone.now()
            ).count()
            
            month_closed_won_count = SalesPipeline.objects.filter(
                **base_pipeline_filter,
                stage='closed_won'
            ).filter(
                Q(actual_close_date__gte=month_start, actual_close_date__lte=timezone.now()) |
                Q(actual_close_date__isnull=True, updated_at__gte=month_start, updated_at__lte=timezone.now())
            ).count()
            
            month_total_sales_count = month_closed_won_count  # Only closed won count counts as sales
            
            # 2. Customer counts for the period
            new_customers_count = Client.objects.filter(
                **base_store_filter,
                created_at__gte=start_date,
                created_at__lte=end_date,
                is_deleted=False
            ).count()
            
            # Total customers should also be filtered by date range for consistency
            total_customers_count = Client.objects.filter(
                **base_store_filter,
                created_at__gte=start_date,
                created_at__lte=end_date,
                is_deleted=False
            ).count()
            
            # 3. Pipeline Revenue (pending deals) - with date filtering
            pipeline_revenue = SalesPipeline.objects.filter(
                **base_pipeline_filter,
                stage__in=['exhibition', 'social_media', 'interested', 'store_walkin', 'negotiation'],
                created_at__gte=start_date,
                created_at__lte=end_date
            ).aggregate(total=Sum('expected_value'))['total'] or Decimal('0.00')
            
            # 3. Closed Won Pipeline Count - with date filtering
            closed_won_pipeline_count = SalesPipeline.objects.filter(
                **base_pipeline_filter,
                stage='closed_won',
                actual_close_date__gte=start_date,
                actual_close_date__lte=end_date
            ).count()
            
            # 4. Pipeline Deals Count (pending deals) - with date filtering
            pipeline_deals_count = SalesPipeline.objects.filter(
                **base_pipeline_filter,
                stage__in=['exhibition', 'social_media', 'interested', 'store_walkin', 'negotiation'],
                created_at__gte=start_date,
                created_at__lte=end_date
            ).count()
            
            # 5. Store Performance
            stores = Store.objects.filter(**base_store_filter)
            store_performance = []
            
            for store in stores:
                # For business admin, we need to filter by the specific store
                # For manager/inhouse_sales, they already have store filter applied
                store_sales_filter = {**base_sales_filter}
                store_pipeline_filter = {**base_pipeline_filter}
                
                if user.role == 'business_admin':
                    # Business admin sees all stores, so filter by specific store
                    store_sales_filter['client__store'] = store
                    store_pipeline_filter['client__store'] = store
                elif user.role in ['manager', 'inhouse_sales'] and user.store:
                    # Manager/sales already have store filter, but ensure it's the right store
                    if user.store.id == store.id:
                        store_sales_filter['client__store'] = store
                        store_pipeline_filter['client__store'] = store
                    else:
                        # Skip stores that don't match user's store
                        continue
                
                store_sales = Sale.objects.filter(
                    **store_sales_filter,
                    created_at__gte=start_date,
                    created_at__lte=end_date
                )
                

                all_time_sales = Sale.objects.filter(**store_sales_filter).count()
                all_time_pipeline = SalesPipeline.objects.filter(**store_pipeline_filter, stage='closed_won').count()
                
                store_revenue = store_sales.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
                
                # More strict date filtering - only include if actual_close_date is within range
                store_closed_won = SalesPipeline.objects.filter(
                    **store_pipeline_filter,
                    stage='closed_won',
                    actual_close_date__gte=start_date,
                    actual_close_date__lte=end_date
                ).aggregate(total=Sum('expected_value'))['total'] or Decimal('0.00')
                
                # Total store revenue = only closed won pipeline (since sales == closed won)
                store_total_revenue = store_closed_won
                
                # More strict date filtering - only include if actual_close_date is within range
                store_sales_count = SalesPipeline.objects.filter(
                    **store_pipeline_filter,
                    stage='closed_won',
                    actual_close_date__gte=start_date,
                    actual_close_date__lte=end_date
                ).count()
                
                print(f"🏪 Store Performance - {store.name}:")
                print(f"   Store Closed Won Revenue: {store_closed_won}")
                print(f"   Store Sales Count: {store_sales_count}")
                print(f"   Store Total Revenue: {store_total_revenue}")
                
                store_performance.append({
                    'id': store.id,
                    'name': store.name,
                    'revenue': float(store_total_revenue),
                    'sales_count': store_sales_count,  # Frontend expects this field
                    'closed_deals': store_sales_count,  # Frontend expects this field (same as sales_count since sales == closed won)
                    'purchased_revenue': float(store_closed_won)  # Keep for backward compatibility
                })
            
            # 6. Top Performing Managers (only for business admin and manager roles)
            top_managers = []
            if user.role in ['business_admin', 'manager']:
                # For business admin, show managers from all stores with store info
                # For manager, show only managers from their store
                if user.role == 'business_admin':
                    managers = User.objects.filter(
                        tenant=tenant,
                        role__in=['business_admin', 'manager'],
                        is_active=True
                    )
                else:
                    # Manager role - only show managers from their store
                    managers = User.objects.filter(
                        tenant=tenant,
                        role__in=['business_admin', 'manager'],
                        is_active=True,
                        store=user.store
                    )
                
                for manager in managers:
                    # Filter sales and pipelines specific to this manager
                    manager_sales_filter = {**base_sales_filter, 'sales_representative': manager}
                    
                    # If business admin, also filter by manager's store for accurate location-specific data
                    if user.role == 'business_admin' and manager.store:
                        manager_sales_filter['client__store'] = manager.store
                    
                    # Get all-time sales for this manager (not just last 30 days)
                    manager_all_time_sales = Sale.objects.filter(
                        **manager_sales_filter
                    ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
                    
                    # Get recent sales (last 30 days)
                    manager_recent_sales = Sale.objects.filter(
                        **manager_sales_filter,
                        created_at__gte=start_date,
                        created_at__lte=end_date
                    ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
                    
                    manager_pipeline_filter = {**base_pipeline_filter, 'sales_representative': manager}
                    
                    # If business admin, also filter by manager's store for accurate location-specific data
                    if user.role == 'business_admin' and manager.store:
                        manager_pipeline_filter['client__store'] = manager.store
                    
                    # Get closed won pipelines for the selected date range
                    manager_closed_won = SalesPipeline.objects.filter(
                        **manager_pipeline_filter,
                        stage='closed_won',
                        actual_close_date__gte=start_date,
                        actual_close_date__lte=end_date
                    ).aggregate(total=Sum('expected_value'))['total'] or Decimal('0.00')
                    
                    manager_deals = SalesPipeline.objects.filter(
                        **manager_pipeline_filter,
                        stage='closed_won',
                        actual_close_date__gte=start_date,
                        actual_close_date__lte=end_date
                    ).count()
                    
                    # Total manager revenue = only closed won pipeline for the period (since sales == closed won)
                    manager_total_revenue = manager_closed_won
                    
                    # Include managers with any revenue or deals (even if 0 recent activity)
                    if float(manager_total_revenue) > 0 or manager_deals > 0:
                        manager_data = {
                            'id': manager.id,
                            'name': f"{manager.first_name} {manager.last_name}",
                            'revenue': float(manager_total_revenue),
                            'deals_closed': manager_deals,
                            'recent_revenue': float(manager_recent_sales)
                        }
                        
                        # Add store information for business admin to show location
                        if user.role == 'business_admin' and manager.store:
                            manager_data['store_name'] = manager.store.name
                            manager_data['store_location'] = manager.store.location if hasattr(manager.store, 'location') else ''
                        
                        top_managers.append(manager_data)
                    
                # If no managers with sales found, show all managers for debugging
                if not top_managers:
                    for manager in managers:
                        manager_data = {
                            'id': manager.id,
                            'name': f"{manager.first_name} {manager.last_name}",
                            'revenue': 0.0,
                            'deals_closed': 0,
                            'recent_revenue': 0.0
                        }
                        
                        # Add store information for business admin to show location
                        if user.role == 'business_admin' and manager.store:
                            manager_data['store_name'] = manager.store.name
                            manager_data['store_location'] = manager.store.location if hasattr(manager.store, 'location') else ''
                        
                        top_managers.append(manager_data)
                
                # Sort managers by revenue
                top_managers.sort(key=lambda x: x['revenue'], reverse=True)
                top_managers = top_managers[:5]  # Top 5 managers
            
            # 7. Top Performing Salesmen
            salesmen = User.objects.filter(
                tenant=tenant,
                role='inhouse_sales',
                is_active=True
            )
            top_salesmen = []
            
            for salesman in salesmen:
                salesman_sales_filter = {**base_sales_filter}
                if user.role in ['manager', 'inhouse_sales'] and user.store:
                    salesman_sales_filter['client__store'] = user.store
                
                # If business admin, also filter by salesman's store for accurate location-specific data
                if user.role == 'business_admin' and salesman.store:
                    salesman_sales_filter['client__store'] = salesman.store
                
                salesman_sales = Sale.objects.filter(
                    **salesman_sales_filter,
                    sales_representative=salesman,
                    created_at__gte=start_date,
                    created_at__lte=end_date
                ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
                
                salesman_pipeline_filter = {**base_pipeline_filter}
                if user.role in ['manager', 'inhouse_sales'] and user.store:
                    salesman_pipeline_filter['client__store'] = user.store
                
                # If business admin, also filter by salesman's store for accurate location-specific data
                if user.role == 'business_admin' and salesman.store:
                    salesman_pipeline_filter['client__store'] = salesman.store
                
                salesman_closed_won = SalesPipeline.objects.filter(
                    **salesman_pipeline_filter,
                    sales_representative=salesman,
                    stage='closed_won',
                    actual_close_date__gte=start_date,
                    actual_close_date__lte=end_date
                ).aggregate(total=Sum('expected_value'))['total'] or Decimal('0.00')
                
                salesman_deals = SalesPipeline.objects.filter(
                    **salesman_pipeline_filter,
                    sales_representative=salesman,
                    stage='closed_won',
                    actual_close_date__gte=start_date,
                    actual_close_date__lte=end_date
                ).count()
                
                # Total salesman revenue = only closed won pipeline (since sales == closed won)
                salesman_total_revenue = salesman_closed_won
                
                if float(salesman_total_revenue) > 0:
                    salesman_data = {
                        'id': salesman.id,
                        'name': f"{salesman.first_name} {salesman.last_name}",
                        'revenue': float(salesman_total_revenue),
                        'deals_closed': salesman_deals
                    }
                    
                    # Add store information for business admin to show location
                    if user.role == 'business_admin' and salesman.store:
                        salesman_data['store_name'] = salesman.store.name
                        salesman_data['store_location'] = salesman.store.location if hasattr(salesman.store, 'location') else ''
                    
                    top_salesmen.append(salesman_data)
            
            # Sort salesmen by revenue
            top_salesmen.sort(key=lambda x: x['revenue'], reverse=True)
            top_salesmen = top_salesmen[:5]  # Top 5 salesmen
            
            # Prepare response data
            dashboard_data = {
                'monthly_sales': {
                    'count': period_total_sales_count,  # Frontend expects this field
                    'revenue': float(period_total)  # Frontend expects this field
                },
                'monthly_customers': {
                    'new': new_customers_count,  # Frontend expects this field
                    'total': total_customers_count  # Frontend expects this field
                },
                'monthly_pipeline': {
                    'active': pipeline_deals_count,  # Frontend expects this field
                    'closed': closed_won_pipeline_count,  # Frontend expects this field
                    'revenue': float(pipeline_revenue)  # Frontend expects this field
                },
                'total_sales': {
                    'period': float(period_total),
                    'today': float(today_total),
                    'week': float(week_total),
                    'month': float(month_total),
                    'period_count': period_total_sales_count,
                    'today_count': today_total_sales_count,
                    'week_count': week_total_sales_count,
                    'month_count': month_total_sales_count
                },
                'pipeline_revenue': float(pipeline_revenue),
                'purchased_pipeline_count': closed_won_pipeline_count,  # Fixed: match frontend expectation
                'pipeline_deals_count': pipeline_deals_count,
                'store_performance': store_performance,
                'top_managers': top_managers,
                'top_salesmen': top_salesmen,
                'date_range': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'filter_type': filter_type
                }
            }
            
            # Add debugging information
            print(f"🔍 Dashboard API Debug:")
            print(f"   Filter Type: {filter_type}")
            print(f"   Start Date: {start_date}")
            print(f"   End Date: {end_date}")
            print(f"   Period Sales: {period_total}")
            print(f"   Period Count: {period_total_sales_count}")
            print(f"   Today Sales: {today_total}")
            print(f"   Month Sales: {month_total}")
            
            return Response({
                'success': True,
                'data': dashboard_data,
                'message': f'Dashboard data for {filter_type} filter'
            })
            
        except Exception as e:
            print(f"❌ Dashboard API Error: {str(e)}")
            return Response({
                'success': False,
                'error': f'Failed to load dashboard data: {str(e)}',
                'data': {
                    'total_sales': {
                        'period': 0,
                        'today': 0,
                        'week': 0,
                        'month': 0,
                        'period_count': 0,
                        'today_count': 0,
                        'week_count': 0,
                        'month_count': 0
                    },
                    'pipeline_revenue': 0,
                    'purchased_pipeline_count': 0,
                    'pipeline_deals_count': 0,
                    'store_performance': [],
                    'top_managers': [],
                    'top_salesmen': []
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
