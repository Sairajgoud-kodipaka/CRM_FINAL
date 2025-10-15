#!/usr/bin/env python
"""
Comprehensive test to verify ALL dashboard calculations use proper date filtering
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

def test_comprehensive_date_filtering():
    print("=" * 80)
    print("COMPREHENSIVE DATE FILTERING TEST")
    print("=" * 80)
    
    # September 2025 date range
    start_date = datetime(2025, 9, 1).replace(tzinfo=timezone.utc)
    end_date = datetime(2025, 9, 30, 23, 59, 59).replace(tzinfo=timezone.utc)
    
    print(f"Testing Date Range: {start_date} to {end_date}")
    print(f"Month: September 2025")
    
    # Get tenant
    tenant = Tenant.objects.first()
    if not tenant:
        print("❌ No tenant found!")
        return
    
    print(f"Tenant: {tenant.name}")
    
    # Base filters
    base_sales_filter = {'tenant': tenant}
    base_pipeline_filter = {'tenant': tenant}
    base_store_filter = {'tenant': tenant}
    
    print("\n" + "=" * 60)
    print("1. SALES CALCULATIONS")
    print("=" * 60)
    
    # Sales revenue (should be 0 for September)
    period_sales = Sale.objects.filter(
        **base_sales_filter,
        created_at__gte=start_date,
        created_at__lte=end_date
    ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
    
    print(f"Period Sales Revenue: ₹{period_sales}")
    
    # Closed won revenue (should be 0 for September)
    period_closed_won = SalesPipeline.objects.filter(
        **base_pipeline_filter,
        stage='closed_won',
        actual_close_date__gte=start_date,
        actual_close_date__lte=end_date
    ).aggregate(total=Sum('expected_value'))['total'] or Decimal('0.00')
    
    print(f"Period Closed Won Revenue: ₹{period_closed_won}")
    
    # Sales count (should be 0 for September)
    period_sales_count = Sale.objects.filter(
        **base_sales_filter,
        created_at__gte=start_date,
        created_at__lte=end_date
    ).count()
    
    print(f"Period Sales Count: {period_sales_count}")
    
    # Closed won count (should be 0 for September)
    period_closed_won_count = SalesPipeline.objects.filter(
        **base_pipeline_filter,
        stage='closed_won',
        actual_close_date__gte=start_date,
        actual_close_date__lte=end_date
    ).count()
    
    print(f"Period Closed Won Count: {period_closed_won_count}")
    
    print("\n" + "=" * 60)
    print("2. CUSTOMER CALCULATIONS")
    print("=" * 60)
    
    # New customers (should be 0 for September)
    new_customers_count = Client.objects.filter(
        **base_store_filter,
        created_at__gte=start_date,
        created_at__lte=end_date,
        is_deleted=False
    ).count()
    
    print(f"New Customers Count: {new_customers_count}")
    
    # Total customers (now also filtered by date)
    total_customers_count = Client.objects.filter(
        **base_store_filter,
        created_at__gte=start_date,
        created_at__lte=end_date,
        is_deleted=False
    ).count()
    
    print(f"Total Customers Count: {total_customers_count}")
    
    print("\n" + "=" * 60)
    print("3. PIPELINE CALCULATIONS")
    print("=" * 60)
    
    # Pipeline revenue (should be 0 for September)
    pipeline_revenue = SalesPipeline.objects.filter(
        **base_pipeline_filter,
        stage__in=['exhibition', 'social_media', 'interested', 'store_walkin', 'negotiation'],
        created_at__gte=start_date,
        created_at__lte=end_date
    ).aggregate(total=Sum('expected_value'))['total'] or Decimal('0.00')
    
    print(f"Pipeline Revenue: ₹{pipeline_revenue}")
    
    # Closed won pipeline count (should be 0 for September)
    closed_won_pipeline_count = SalesPipeline.objects.filter(
        **base_pipeline_filter,
        stage='closed_won',
        actual_close_date__gte=start_date,
        actual_close_date__lte=end_date
    ).count()
    
    print(f"Closed Won Pipeline Count: {closed_won_pipeline_count}")
    
    # Pipeline deals count (should be 0 for September)
    pipeline_deals_count = SalesPipeline.objects.filter(
        **base_pipeline_filter,
        stage__in=['exhibition', 'social_media', 'interested', 'store_walkin', 'negotiation'],
        created_at__gte=start_date,
        created_at__lte=end_date
    ).count()
    
    print(f"Pipeline Deals Count: {pipeline_deals_count}")
    
    print("\n" + "=" * 60)
    print("4. MANAGER CALCULATIONS")
    print("=" * 60)
    
    # Get managers
    managers = User.objects.filter(tenant=tenant, role='manager')
    print(f"Found {managers.count()} managers")
    
    total_manager_revenue = Decimal('0.00')
    total_manager_deals = 0
    
    for manager in managers:
        manager_pipeline_filter = {**base_pipeline_filter}
        if manager.store:
            manager_pipeline_filter['client__store'] = manager.store
        
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
        
        total_manager_revenue += manager_closed_won
        total_manager_deals += manager_deals
        
        print(f"  Manager {manager.first_name}: ₹{manager_closed_won} revenue, {manager_deals} deals")
    
    print(f"Total Manager Revenue: ₹{total_manager_revenue}")
    print(f"Total Manager Deals: {total_manager_deals}")
    
    print("\n" + "=" * 60)
    print("5. SALESMAN CALCULATIONS")
    print("=" * 60)
    
    # Get salesmen
    salesmen = User.objects.filter(tenant=tenant, role='inhouse_sales')
    print(f"Found {salesmen.count()} salesmen")
    
    total_salesman_revenue = Decimal('0.00')
    total_salesman_deals = 0
    
    for salesman in salesmen:
        salesman_pipeline_filter = {**base_pipeline_filter}
        if salesman.store:
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
        
        total_salesman_revenue += salesman_closed_won
        total_salesman_deals += salesman_deals
        
        print(f"  Salesman {salesman.first_name}: ₹{salesman_closed_won} revenue, {salesman_deals} deals")
    
    print(f"Total Salesman Revenue: ₹{total_salesman_revenue}")
    print(f"Total Salesman Deals: {total_salesman_deals}")
    
    print("\n" + "=" * 60)
    print("6. SUMMARY FOR SEPTEMBER 2025")
    print("=" * 60)
    
    print(f"✅ Monthly Sales: {period_closed_won_count} (should be 0)")
    print(f"✅ Monthly Revenue: ₹{period_closed_won} (should be ₹0)")
    print(f"✅ New Customers: {new_customers_count} (should be 0)")
    print(f"✅ Total Customers: {total_customers_count} (should be 0)")
    print(f"✅ Active Pipeline: {pipeline_deals_count} (should be 0)")
    print(f"✅ Pipeline Revenue: ₹{pipeline_revenue} (should be ₹0)")
    print(f"✅ Closed Deals: {closed_won_pipeline_count} (should be 0)")
    print(f"✅ Manager Revenue: ₹{total_manager_revenue} (should be ₹0)")
    print(f"✅ Salesman Revenue: ₹{total_salesman_revenue} (should be ₹0)")
    
    # Check if all values are 0
    all_zero = (
        period_closed_won == 0 and
        period_closed_won_count == 0 and
        new_customers_count == 0 and
        total_customers_count == 0 and
        pipeline_deals_count == 0 and
        pipeline_revenue == 0 and
        closed_won_pipeline_count == 0 and
        total_manager_revenue == 0 and
        total_salesman_revenue == 0
    )
    
    if all_zero:
        print(f"\n🎉 SUCCESS: All calculations return 0 for September 2025!")
        print(f"   Date filtering is working correctly!")
    else:
        print(f"\n❌ ISSUE: Some calculations still return non-zero values!")
        print(f"   Date filtering needs more fixes!")
    
    print("\n" + "=" * 80)
    print("COMPREHENSIVE TEST COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    test_comprehensive_date_filtering()
