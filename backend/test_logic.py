#!/usr/bin/env python3
"""
Test Business Dashboard Logic
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

def test_logic():
    # Simulate the exact API call
    start_date = datetime(2024, 12, 31, 18, 30, 0).replace(tzinfo=timezone.utc)
    end_date = datetime(2025, 1, 30, 18, 30, 0).replace(tzinfo=timezone.utc)
    
    # Get user and tenant
    user = User.objects.first()
    tenant = user.tenant
    
    print(f'User: {user.username}, Role: {user.role}')
    print(f'Tenant: {tenant.name if tenant else "None"}')
    
    # Base filters
    base_sales_filter = {'tenant': tenant}
    base_pipeline_filter = {'tenant': tenant}
    
    # Check if there's any actual data for this period
    sales_exist = Sale.objects.filter(**base_sales_filter, created_at__gte=start_date, created_at__lte=end_date).exists()
    pipelines_exist = SalesPipeline.objects.filter(**base_pipeline_filter, actual_close_date__gte=start_date.date(), actual_close_date__lte=end_date.date()).exists()
    
    has_any_data = sales_exist or pipelines_exist
    
    print(f'Sales exist: {sales_exist}')
    print(f'Pipelines exist: {pipelines_exist}')
    print(f'Has any data: {has_any_data}')
    
    if not has_any_data:
        print('✅ Should return zero data')
    else:
        print('❌ Should return actual data')
        # Check what data exists
        sales = Sale.objects.filter(**base_sales_filter, created_at__gte=start_date, created_at__lte=end_date)
        pipelines = SalesPipeline.objects.filter(**base_pipeline_filter, actual_close_date__gte=start_date.date(), actual_close_date__lte=end_date.date())
        print(f'Found {sales.count()} sales and {pipelines.count()} pipelines')

if __name__ == "__main__":
    test_logic()
