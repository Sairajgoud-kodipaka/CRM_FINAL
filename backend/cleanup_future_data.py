#!/usr/bin/env python3
"""
Script to clean up future sales data that shouldn't exist
This will fix the issue where future months show sales data
"""

import os
import sys
import django
from datetime import datetime, date
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.sales.models import SalesPipeline, Sale
from apps.clients.models import Client

def cleanup_future_data():
    """Clean up any sales data with future dates"""
    
    print("🧹 CLEANING UP FUTURE SALES DATA")
    print("=" * 50)
    
    current_date = timezone.now().date()
    print(f"Current Date: {current_date}")
    
    # 1. Find SalesPipeline records with future actual_close_date
    print("\n🔍 Checking SalesPipeline records...")
    future_pipelines = SalesPipeline.objects.filter(
        actual_close_date__gt=current_date
    )
    
    print(f"Found {future_pipelines.count()} pipelines with future actual_close_date")
    
    for pipeline in future_pipelines:
        print(f"  - ID: {pipeline.id}, Title: {pipeline.title}")
        print(f"    Actual Close Date: {pipeline.actual_close_date}")
        print(f"    Expected Value: ₹{pipeline.expected_value}")
        print(f"    Stage: {pipeline.stage}")
        print()
    
    # 2. Find Sale records with future created_at
    print("\n🔍 Checking Sale records...")
    future_sales = Sale.objects.filter(
        created_at__date__gt=current_date
    )
    
    print(f"Found {future_sales.count()} sales with future created_at")
    
    for sale in future_sales:
        print(f"  - ID: {sale.id}")
        print(f"    Created At: {sale.created_at}")
        print(f"    Total Amount: ₹{sale.total_amount}")
        print()
    
    # 3. Ask for confirmation before cleanup
    if future_pipelines.count() > 0 or future_sales.count() > 0:
        print("\n⚠️  FUTURE DATA FOUND!")
        print("This data should not exist because:")
        print("  - Sales cannot be closed in the future")
        print("  - Revenue cannot be received in the future")
        print("  - This breaks business logic")
        
        response = input("\nDo you want to clean up this future data? (y/N): ")
        
        if response.lower() == 'y':
            print("\n🧹 Cleaning up future data...")
            
            # Option 1: Delete future pipelines
            deleted_pipelines = future_pipelines.count()
            future_pipelines.delete()
            print(f"✅ Deleted {deleted_pipelines} future pipeline records")
            
            # Option 2: Delete future sales
            deleted_sales = future_sales.count()
            future_sales.delete()
            print(f"✅ Deleted {deleted_sales} future sale records")
            
            print("\n✅ Cleanup complete!")
            print("Future months should now show 0 data as expected.")
            
        else:
            print("\n❌ Cleanup cancelled.")
            print("Future data will continue to show incorrect results.")
    else:
        print("\n✅ No future data found!")
        print("Your database is clean.")
    
    # 4. Show current data distribution
    print("\n📊 Current Data Distribution:")
    print("-" * 40)
    
    # Show pipelines by year
    from django.db.models import Count
    pipelines_by_year = SalesPipeline.objects.filter(
        stage='closed_won',
        actual_close_date__isnull=False
    ).extra(
        select={'year': 'EXTRACT(year FROM actual_close_date)'}
    ).values('year').annotate(count=Count('id')).order_by('year')
    
    print("Closed Won Pipelines by Year:")
    for item in pipelines_by_year:
        year = int(item['year'])
        count = item['count']
        print(f"  {year}: {count} pipelines")
    
    print("\n" + "=" * 50)
    print("ANALYSIS COMPLETE")
    print("=" * 50)

if __name__ == "__main__":
    cleanup_future_data()

