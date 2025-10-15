#!/usr/bin/env python3
"""
Debug script to test Business Dashboard API logic
"""
import os
import sys
import django
from datetime import datetime
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.sales.models import SalesPipeline, Sale
from apps.users.models import User
from django.db.models import Sum
from decimal import Decimal

def test_business_dashboard_logic():
    print("🔍 Testing Business Dashboard Logic")
    print("=" * 50)
    
    # Simulate the exact API call from the log
    start_date = datetime(2024, 12, 31, 18, 30, 0).replace(tzinfo=timezone.utc)
    end_date = datetime(2025, 1, 30, 18, 30, 0).replace(tzinfo=timezone.utc)
    
    print(f"Date Range: {start_date} to {end_date}")
    print(f"Start Date: {start_date.date()}")
    print(f"End Date: {end_date.date()}")
    
    # Get user and tenant
    user = User.objects.first()
    tenant = user.tenant
    
    print(f"\nUser: {user.username}, Role: {user.role}")
    print(f"Tenant: {tenant.name if tenant else 'None'}")
    
    # Base filters
    base_sales_filter = {'tenant': tenant}
    base_pipeline_filter = {'tenant': tenant}
    
    print(f"\nBase sales filter: {base_sales_filter}")
    print(f"Base pipeline filter: {base_pipeline_filter}")
    
    # Check if there's any actual data for this period
    sales_exist = Sale.objects.filter(**base_sales_filter, created_at__gte=start_date, created_at__lte=end_date).exists()
    pipelines_exist = SalesPipeline.objects.filter(**base_pipeline_filter, actual_close_date__gte=start_date.date(), actual_close_date__lte=end_date.date()).exists()
    
    has_any_data = sales_exist or pipelines_exist
    
    print(f"\nSales exist: {sales_exist}")
    print(f"Pipelines exist: {pipelines_exist}")
    print(f"Has any data: {has_any_data}")
    
    if not has_any_data:
        print("\n✅ Should return zero data")
        return {
            'monthly_sales': {'count': 0, 'revenue': 0},
            'monthly_customers': {'new': 0, 'total': 0},
            'monthly_pipeline': {'active': 0, 'closed': 0, 'revenue': 0},
            'store_performance': [],
            'top_performers': []
        }
    else:
        print("\n❌ Should return actual data")
        # Continue with normal processing
        period_sales = Sale.objects.filter(
            **base_sales_filter,
            created_at__gte=start_date,
            created_at__lte=end_date
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        
        print(f"Period sales: {period_sales}")
        return {'monthly_sales': {'count': 1, 'revenue': float(period_sales)}}

if __name__ == "__main__":
    result = test_business_dashboard_logic()
    print(f"\nResult: {result}")
