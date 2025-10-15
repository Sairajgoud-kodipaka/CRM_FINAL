#!/usr/bin/env python
"""
Test script to analyze dashboard data flow and date filtering
"""
import os
import sys
import django
from datetime import datetime, timedelta
from django.utils import timezone
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.sales.models import SalesPipeline, Sale
from apps.clients.models import Client
from apps.users.models import User
from apps.tenants.models import Tenant
from django.db.models import Sum, Count, Q

def test_dashboard_flow():
    print("=" * 80)
    print("DASHBOARD DATA FLOW ANALYSIS")
    print("=" * 80)
    
    # 1. Check all data in database
    print("\n1. DATABASE OVERVIEW")
    print("-" * 40)
    
    total_pipelines = SalesPipeline.objects.count()
    closed_won_pipelines = SalesPipeline.objects.filter(stage='closed_won').count()
    total_sales = Sale.objects.count()
    total_clients = Client.objects.count()
    
    print(f"Total SalesPipeline records: {total_pipelines}")
    print(f"Closed Won Pipelines: {closed_won_pipelines}")
    print(f"Total Sale records: {total_sales}")
    print(f"Total Client records: {total_clients}")
    
    # 2. Check all closed-won pipelines with details
    print("\n2. ALL CLOSED-WON PIPELINES")
    print("-" * 40)
    
    closed_won = SalesPipeline.objects.filter(stage='closed_won')
    for i, pipeline in enumerate(closed_won, 1):
        print(f"\nPipeline #{i}:")
        print(f"  ID: {pipeline.id}")
        print(f"  Stage: {pipeline.stage}")
        print(f"  Created At: {pipeline.created_at}")
        print(f"  Updated At: {pipeline.updated_at}")
        print(f"  Actual Close Date: {pipeline.actual_close_date}")
        print(f"  Expected Value: {pipeline.expected_value}")
        print(f"  Client: {pipeline.client.first_name if pipeline.client else 'None'} {pipeline.client.last_name if pipeline.client else ''}")
        print(f"  Tenant: {pipeline.tenant.name if pipeline.tenant else 'None'}")
    
    # 3. Test September 2025 date range
    print("\n3. SEPTEMBER 2025 DATE RANGE TEST")
    print("-" * 40)
    
    # Frontend date calculation simulation
    current_month = {'year': 2025, 'month': 8}  # September is month 8 (0-indexed)
    start_of_month = datetime(current_month['year'], current_month['month'], 1)
    # End of month calculation
    if current_month['month'] == 11:  # December
        end_of_month = datetime(current_month['year'] + 1, 1, 1) - timedelta(days=1)
    else:
        end_of_month = datetime(current_month['year'], current_month['month'] + 2, 1) - timedelta(days=1)
    
    print(f"Frontend calculated dates:")
    print(f"  Start of Month: {start_of_month}")
    print(f"  End of Month: {end_of_month}")
    print(f"  Start ISO: {start_of_month.isoformat()}Z")
    print(f"  End ISO: {end_of_month.isoformat()}Z")
    
    # Backend date processing simulation
    start_date_param = start_of_month.isoformat() + 'Z'
    end_date_param = end_of_month.isoformat() + 'Z'
    
    print(f"\nBackend date processing:")
    print(f"  Start Date Param: {start_date_param}")
    print(f"  End Date Param: {end_date_param}")
    
    # Parse dates like backend does
    start_date = datetime.fromisoformat(start_date_param.replace('Z', '+00:00')).replace(tzinfo=timezone.utc)
    end_date = datetime.fromisoformat(end_date_param.replace('Z', '+00:00')).replace(tzinfo=timezone.utc)
    end_date = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    print(f"  Parsed Start Date: {start_date}")
    print(f"  Parsed End Date: {end_date}")
    
    # 4. Test different query approaches
    print("\n4. QUERY TESTING")
    print("-" * 40)
    
    # Test 1: Only actual_close_date
    query1 = SalesPipeline.objects.filter(
        stage='closed_won',
        actual_close_date__gte=start_date,
        actual_close_date__lte=end_date
    )
    print(f"Query 1 (actual_close_date only): {query1.count()} results")
    for p in query1:
        print(f"  Pipeline {p.id}: actual_close_date={p.actual_close_date}, value={p.expected_value}")
    
    # Test 2: Only updated_at
    query2 = SalesPipeline.objects.filter(
        stage='closed_won',
        updated_at__gte=start_date,
        updated_at__lte=end_date
    )
    print(f"\nQuery 2 (updated_at only): {query2.count()} results")
    for p in query2:
        print(f"  Pipeline {p.id}: updated_at={p.updated_at}, value={p.expected_value}")
    
    # Test 3: Only created_at
    query3 = SalesPipeline.objects.filter(
        stage='closed_won',
        created_at__gte=start_date,
        created_at__lte=end_date
    )
    print(f"\nQuery 3 (created_at only): {query3.count()} results")
    for p in query3:
        print(f"  Pipeline {p.id}: created_at={p.created_at}, value={p.expected_value}")
    
    # Test 4: Combined query (current backend logic)
    query4 = SalesPipeline.objects.filter(
        stage='closed_won'
    ).filter(
        Q(actual_close_date__gte=start_date, actual_close_date__lte=end_date) |
        Q(actual_close_date__isnull=True, updated_at__gte=start_date, updated_at__lte=end_date)
    )
    print(f"\nQuery 4 (combined logic): {query4.count()} results")
    for p in query4:
        print(f"  Pipeline {p.id}: actual_close_date={p.actual_close_date}, updated_at={p.updated_at}, value={p.expected_value}")
    
    # 5. Revenue calculations
    print("\n5. REVENUE CALCULATIONS")
    print("-" * 40)
    
    revenue1 = query1.aggregate(total=Sum('expected_value'))['total'] or Decimal('0.00')
    revenue2 = query2.aggregate(total=Sum('expected_value'))['total'] or Decimal('0.00')
    revenue3 = query3.aggregate(total=Sum('expected_value'))['total'] or Decimal('0.00')
    revenue4 = query4.aggregate(total=Sum('expected_value'))['total'] or Decimal('0.00')
    
    print(f"Revenue Query 1 (actual_close_date): ₹{revenue1}")
    print(f"Revenue Query 2 (updated_at): ₹{revenue2}")
    print(f"Revenue Query 3 (created_at): ₹{revenue3}")
    print(f"Revenue Query 4 (combined): ₹{revenue4}")
    
    # 6. Test October 2025 for comparison
    print("\n6. OCTOBER 2025 COMPARISON")
    print("-" * 40)
    
    oct_start = datetime(2025, 10, 1).replace(tzinfo=timezone.utc)
    oct_end = datetime(2025, 10, 31, 23, 59, 59).replace(tzinfo=timezone.utc)
    
    oct_query = SalesPipeline.objects.filter(
        stage='closed_won'
    ).filter(
        Q(actual_close_date__gte=oct_start, actual_close_date__lte=oct_end) |
        Q(actual_close_date__isnull=True, updated_at__gte=oct_start, updated_at__lte=oct_end)
    )
    
    oct_revenue = oct_query.aggregate(total=Sum('expected_value'))['total'] or Decimal('0.00')
    
    print(f"October 2025 range: {oct_start} to {oct_end}")
    print(f"October pipelines: {oct_query.count()}")
    print(f"October revenue: ₹{oct_revenue}")
    
    for p in oct_query:
        print(f"  Pipeline {p.id}: actual_close_date={p.actual_close_date}, updated_at={p.updated_at}, value={p.expected_value}")
    
    # 7. Recommendations
    print("\n7. RECOMMENDATIONS")
    print("-" * 40)
    
    if query1.count() == 0 and query4.count() > 0:
        print("❌ ISSUE FOUND: Pipelines have actual_close_date=None but updated_at in range")
        print("   SOLUTION: Use only actual_close_date or set proper close dates")
    elif query2.count() > 0:
        print("❌ ISSUE FOUND: Pipelines were updated in September but closed in October")
        print("   SOLUTION: Use actual_close_date instead of updated_at")
    elif query3.count() > 0:
        print("❌ ISSUE FOUND: Pipelines were created in September but closed later")
        print("   SOLUTION: Use actual_close_date instead of created_at")
    else:
        print("✅ No obvious issues found in date filtering")
    
    print("\n" + "=" * 80)
    print("ANALYSIS COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    test_dashboard_flow()
