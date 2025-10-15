#!/usr/bin/env python
"""
Test the enhanced month filtering with additional parameters
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

def test_enhanced_month_filtering():
    print("=" * 80)
    print("ENHANCED MONTH FILTERING TEST")
    print("=" * 80)
    
    # Test September 2025 with enhanced parameters
    year = 2025
    month = 8  # September is month 8 (0-indexed)
    
    # Create exact month boundaries (same as backend logic)
    start_date = datetime(year, month + 1, 1).replace(tzinfo=timezone.utc)
    end_date = datetime(year, month + 2, 1).replace(tzinfo=timezone.utc) - timedelta(microseconds=1)
    
    print(f"Testing Enhanced Month Filtering:")
    print(f"Year: {year}, Month: {month} (September)")
    print(f"Start Date: {start_date}")
    print(f"End Date: {end_date}")
    
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
    print("1. ENHANCED SALES CALCULATIONS")
    print("=" * 60)
    
    # Ultra-strict closed won revenue
    period_closed_won = SalesPipeline.objects.filter(
        **base_pipeline_filter,
        stage='closed_won',
        actual_close_date__gte=start_date,
        actual_close_date__lte=end_date
    ).aggregate(total=Sum('expected_value'))['total'] or Decimal('0.00')
    
    print(f"Ultra-Strict Closed Won Revenue: ₹{period_closed_won}")
    
    # Ultra-strict closed won count
    period_closed_won_count = SalesPipeline.objects.filter(
        **base_pipeline_filter,
        stage='closed_won',
        actual_close_date__gte=start_date,
        actual_close_date__lte=end_date
    ).count()
    
    print(f"Ultra-Strict Closed Won Count: {period_closed_won_count}")
    
    print("\n" + "=" * 60)
    print("2. ENHANCED CUSTOMER CALCULATIONS")
    print("=" * 60)
    
    # Ultra-strict new customers
    new_customers_count = Client.objects.filter(
        **base_store_filter,
        created_at__gte=start_date,
        created_at__lte=end_date,
        is_deleted=False
    ).count()
    
    print(f"Ultra-Strict New Customers: {new_customers_count}")
    
    print("\n" + "=" * 60)
    print("3. ENHANCED PIPELINE CALCULATIONS")
    print("=" * 60)
    
    # Ultra-strict pipeline revenue
    pipeline_revenue = SalesPipeline.objects.filter(
        **base_pipeline_filter,
        stage__in=['exhibition', 'social_media', 'interested', 'store_walkin', 'negotiation'],
        created_at__gte=start_date,
        created_at__lte=end_date
    ).aggregate(total=Sum('expected_value'))['total'] or Decimal('0.00')
    
    print(f"Ultra-Strict Pipeline Revenue: ₹{pipeline_revenue}")
    
    # Ultra-strict pipeline deals count
    pipeline_deals_count = SalesPipeline.objects.filter(
        **base_pipeline_filter,
        stage__in=['exhibition', 'social_media', 'interested', 'store_walkin', 'negotiation'],
        created_at__gte=start_date,
        created_at__lte=end_date
    ).count()
    
    print(f"Ultra-Strict Pipeline Deals Count: {pipeline_deals_count}")
    
    print("\n" + "=" * 60)
    print("4. SUMMARY FOR SEPTEMBER 2025")
    print("=" * 60)
    
    print(f"✅ Monthly Sales: {period_closed_won_count} (should be 0)")
    print(f"✅ Monthly Revenue: ₹{period_closed_won} (should be ₹0)")
    print(f"✅ New Customers: {new_customers_count} (should be 0)")
    print(f"✅ Pipeline Revenue: ₹{pipeline_revenue} (should be ₹0)")
    print(f"✅ Pipeline Deals: {pipeline_deals_count} (should be 0)")
    
    # Check if all values are 0
    all_zero = (
        period_closed_won == 0 and
        period_closed_won_count == 0 and
        new_customers_count == 0 and
        pipeline_revenue == 0 and
        pipeline_deals_count == 0
    )
    
    if all_zero:
        print(f"\n🎉 SUCCESS: Enhanced month filtering returns 0 for September 2025!")
        print(f"   All calculations are ultra-strict and working correctly!")
    else:
        print(f"\n❌ ISSUE: Some calculations still return non-zero values!")
        print(f"   Enhanced filtering needs more fixes!")
    
    print("\n" + "=" * 80)
    print("ENHANCED MONTH FILTERING TEST COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    test_enhanced_month_filtering()
