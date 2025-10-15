#!/usr/bin/env python3
"""
Script to analyze the data pattern in the CRM dashboard
This will help understand why certain months show data while others show zeros
"""

import os
import sys
import django
from datetime import datetime, date
from decimal import Decimal

# Add the backend directory to Python path
sys.path.append('/path/to/backend')  # Update this path

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.sales.models import SalesPipeline, Sale
from apps.clients.models import Client
from apps.users.models import User
from apps.tenants.models import Tenant

def analyze_data_pattern():
    """Analyze the data pattern across different months"""
    
    print("🔍 Analyzing Data Pattern in CRM Dashboard")
    print("=" * 50)
    
    # Get all sales pipelines
    pipelines = SalesPipeline.objects.all()
    print(f"📊 Total Sales Pipelines: {pipelines.count()}")
    
    # Analyze by actual_close_date
    print("\n📅 Sales Pipelines by Actual Close Date:")
    print("-" * 40)
    
    closed_won_pipelines = pipelines.filter(stage='closed_won')
    print(f"Closed Won Pipelines: {closed_won_pipelines.count()}")
    
    for pipeline in closed_won_pipelines:
        print(f"  - ID: {pipeline.id}, Title: {pipeline.title}")
        print(f"    Expected Value: ₹{pipeline.expected_value}")
        print(f"    Created At: {pipeline.created_at}")
        print(f"    Actual Close Date: {pipeline.actual_close_date}")
        print(f"    Client: {pipeline.client.full_name if pipeline.client else 'No Client'}")
        print()
    
    # Analyze by created_at date
    print("\n📅 Sales Pipelines by Created Date:")
    print("-" * 40)
    
    for pipeline in pipelines:
        print(f"  - ID: {pipeline.id}, Stage: {pipeline.stage}")
        print(f"    Created At: {pipeline.created_at}")
        print(f"    Actual Close Date: {pipeline.actual_close_date}")
        print(f"    Expected Value: ₹{pipeline.expected_value}")
        print()
    
    # Check specific months mentioned by user
    print("\n🎯 Checking Specific Months:")
    print("-" * 40)
    
    months_to_check = [
        ('October 2025', date(2025, 10, 1), date(2025, 10, 31)),
        ('November 2025', date(2025, 11, 1), date(2025, 11, 30)),
        ('December 2025', date(2025, 12, 1), date(2025, 12, 31)),
        ('January 2026', date(2026, 1, 1), date(2026, 1, 31)),
        ('December 2024', date(2024, 12, 1), date(2024, 12, 31)),
        ('January 2025', date(2025, 1, 1), date(2025, 1, 31)),
    ]
    
    for month_name, start_date, end_date in months_to_check:
        # Check by actual_close_date (what the dashboard uses)
        actual_close_count = closed_won_pipelines.filter(
            actual_close_date__gte=start_date,
            actual_close_date__lte=end_date
        ).count()
        
        actual_close_revenue = closed_won_pipelines.filter(
            actual_close_date__gte=start_date,
            actual_close_date__lte=end_date
        ).aggregate(total=models.Sum('expected_value'))['total'] or Decimal('0.00')
        
        # Check by created_at date
        created_count = pipelines.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).count()
        
        print(f"{month_name}:")
        print(f"  - By Actual Close Date: {actual_close_count} pipelines, ₹{actual_close_revenue}")
        print(f"  - By Created Date: {created_count} pipelines")
        print()
    
    # Check customers
    print("\n👥 Customer Analysis:")
    print("-" * 40)
    
    customers = Client.objects.all()
    print(f"Total Customers: {customers.count()}")
    
    for customer in customers:
        print(f"  - ID: {customer.id}, Name: {customer.full_name}")
        print(f"    Created At: {customer.created_at}")
        print(f"    Store: {customer.store.name if customer.store else 'No Store'}")
        print()

if __name__ == "__main__":
    try:
        analyze_data_pattern()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

