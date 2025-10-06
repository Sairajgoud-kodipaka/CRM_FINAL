from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from apps.tenants.models import Tenant
from apps.sales.models import Sale
from apps.users.models import User
import csv
from django.http import HttpResponse


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_billing_overview(request):
    """
    Get platform billing overview for platform admin.
    """
    # Check if user is platform admin
    if request.user.role != 'platform_admin':
        return Response(
            {'error': 'Access denied. Platform admin role required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        # Calculate total revenue from all sales
        total_revenue = Sale.objects.aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        # Calculate monthly revenue (current month)
        current_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_revenue = Sale.objects.filter(
            created_at__gte=current_month_start
        ).aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        # Count active subscriptions
        active_subscriptions = Tenant.objects.filter(
            subscription_status='active'
        ).count()
        
        # Count pending payments (sales with pending payment status)
        pending_payments = Sale.objects.filter(
            payment_status='pending'
        ).count()
        
        # Calculate revenue growth (compare with last month)
        last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
        last_month_end = current_month_start - timedelta(days=1)
        
        last_month_revenue = Sale.objects.filter(
            created_at__gte=last_month_start,
            created_at__lt=current_month_start
        ).aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        revenue_growth = 0
        if last_month_revenue > 0:
            revenue_growth = ((monthly_revenue - last_month_revenue) / last_month_revenue) * 100
        
        # Get subscription plan distribution
        subscription_plans = {
            'basic': Tenant.objects.filter(subscription_plan='basic').count(),
            'professional': Tenant.objects.filter(subscription_plan='professional').count(),
            'enterprise': Tenant.objects.filter(subscription_plan='enterprise').count(),
        }
        
        # Get recent transactions (last 10 sales)
        recent_transactions = Sale.objects.select_related(
            'client', 'tenant'
        ).order_by('-created_at')[:10].values(
            'id',
            'total_amount',
            'payment_status',
            'created_at',
            'tenant__name',
            'tenant__subscription_plan'
        )
        
        # Format recent transactions
        formatted_transactions = []
        for transaction in recent_transactions:
            formatted_transactions.append({
                'id': transaction['id'],
                'tenant_name': transaction['tenant__name'],
                'amount': float(transaction['total_amount']),
                'plan': transaction['tenant__subscription_plan'].title(),
                'status': transaction['payment_status'],
                'date': transaction['created_at'].strftime('%Y-%m-%d')
            })
        
        billing_data = {
            'total_revenue': float(total_revenue),
            'monthly_revenue': float(monthly_revenue),
            'active_subscriptions': active_subscriptions,
            'pending_payments': pending_payments,
            'revenue_growth': round(revenue_growth, 2),
            'subscription_plans': subscription_plans,
            'recent_transactions': formatted_transactions
        }
        
        return Response({
            'success': True,
            'data': billing_data
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Failed to fetch billing data: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_billing_report(request):
    """
    Export billing report as CSV for platform admin.
    """
    # Check if user is platform admin
    if request.user.role != 'platform_admin':
        return Response(
            {'error': 'Access denied. Platform admin role required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        # Create HTTP response with CSV content type
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="billing_report_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        writer = csv.writer(response)
        
        # Write header
        writer.writerow([
            'Billing Report',
            f'Generated on: {timezone.now().strftime("%Y-%m-%d %H:%M:%S")}',
            '',
            ''
        ])
        
        # Calculate summary data
        total_revenue = Sale.objects.aggregate(total=Sum('total_amount'))['total'] or 0
        current_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_revenue = Sale.objects.filter(created_at__gte=current_month_start).aggregate(total=Sum('total_amount'))['total'] or 0
        active_subscriptions = Tenant.objects.filter(subscription_status='active').count()
        pending_payments = Sale.objects.filter(payment_status='pending').count()
        
        # Write summary section
        writer.writerow(['SUMMARY METRICS'])
        writer.writerow(['Total Revenue', f'₹{total_revenue:,.2f}'])
        writer.writerow(['Monthly Revenue', f'₹{monthly_revenue:,.2f}'])
        writer.writerow(['Active Subscriptions', active_subscriptions])
        writer.writerow(['Pending Payments', pending_payments])
        writer.writerow(['', ''])
        
        # Write subscription plans distribution
        writer.writerow(['SUBSCRIPTION PLANS DISTRIBUTION'])
        writer.writerow(['Plan', 'Count'])
        writer.writerow(['Basic', Tenant.objects.filter(subscription_plan='basic').count()])
        writer.writerow(['Professional', Tenant.objects.filter(subscription_plan='professional').count()])
        writer.writerow(['Enterprise', Tenant.objects.filter(subscription_plan='enterprise').count()])
        writer.writerow(['', ''])
        
        # Write tenant details
        writer.writerow(['TENANT DETAILS'])
        writer.writerow([
            'Tenant Name', 'Subscription Plan', 'Status', 'Total Sales', 
            'Total Revenue', 'Pending Payments', 'Created Date'
        ])
        
        tenants = Tenant.objects.all().order_by('name')
        for tenant in tenants:
            tenant_sales = Sale.objects.filter(tenant=tenant)
            tenant_revenue = tenant_sales.aggregate(total=Sum('total_amount'))['total'] or 0
            tenant_pending = tenant_sales.filter(payment_status='pending').count()
            sales_count = tenant_sales.count()
            
            writer.writerow([
                tenant.name,
                tenant.subscription_plan.title(),
                tenant.subscription_status.title(),
                sales_count,
                f'₹{tenant_revenue:,.2f}',
                tenant_pending,
                tenant.created_at.strftime('%Y-%m-%d')
            ])
        
        writer.writerow(['', ''])
        
        # Write recent transactions
        writer.writerow(['RECENT TRANSACTIONS (Last 50)'])
        writer.writerow([
            'Transaction ID', 'Tenant', 'Order Number', 'Amount', 
            'Payment Status', 'Order Status', 'Date'
        ])
        
        recent_sales = Sale.objects.select_related('tenant', 'client').order_by('-created_at')[:50]
        for sale in recent_sales:
            writer.writerow([
                sale.id,
                sale.tenant.name,
                sale.order_number,
                f'₹{sale.total_amount:,.2f}',
                sale.payment_status.title(),
                sale.status.title(),
                sale.created_at.strftime('%Y-%m-%d %H:%M')
            ])
        
        return response
        
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Failed to export billing report: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def toggle_tenant_status(request, tenant_id):
    """
    Toggle tenant status between active and inactive for platform admin.
    """
    # Check if user is platform admin
    if request.user.role != 'platform_admin':
        return Response(
            {'error': 'Access denied. Platform admin role required.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        tenant = Tenant.objects.get(id=tenant_id)
        
        # Toggle the status
        if tenant.subscription_status == 'active':
            tenant.subscription_status = 'inactive'
        else:
            tenant.subscription_status = 'active'
        
        tenant.save()
        
        return Response({
            'success': True,
            'data': {
                'id': tenant.id,
                'name': tenant.name,
                'subscription_status': tenant.subscription_status
            }
        })
        
    except Tenant.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Tenant not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Failed to toggle tenant status: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
