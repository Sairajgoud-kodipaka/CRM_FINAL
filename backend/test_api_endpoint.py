#!/usr/bin/env python
"""
Test the actual API endpoint to see what's being returned
"""
import os
import sys
import django
from datetime import datetime, timedelta
from django.utils import timezone
from decimal import Decimal
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.tenants.views import BusinessDashboardView
from apps.users.models import User
from apps.tenants.models import Tenant
from django.test import RequestFactory

def test_api_endpoint():
    print("=" * 80)
    print("API ENDPOINT TEST")
    print("=" * 80)
    
    # Create a test request
    factory = RequestFactory()
    
    # September 2025 dates
    start_date_param = "2025-09-01T00:00:00.000Z"
    end_date_param = "2025-09-30T23:59:59.999Z"
    
    # Create request with query parameters
    request = factory.get(f'/tenants/dashboard/', {
        'start_date': start_date_param,
        'end_date': end_date_param,
        'filter_type': 'today'
    })
    
    # Get a business admin user
    try:
        user = User.objects.filter(role='business_admin').first()
        if not user:
            print("❌ No business admin user found!")
            return
        
        tenant = Tenant.objects.first()
        if not tenant:
            print("❌ No tenant found!")
            return
            
        print(f"✅ Using user: {user.username} (role: {user.role})")
        print(f"✅ Using tenant: {tenant.name}")
        
        # Set user on request
        request.user = user
        
        # Create view instance
        view = BusinessDashboardView()
        
        # Call the view
        response = view.get(request)
        
        print(f"\n📊 API Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.data
            print(f"\n📈 Dashboard Data:")
            print(f"  Monthly Sales Count: {data.get('monthly_sales', {}).get('count', 'N/A')}")
            print(f"  Monthly Sales Revenue: ₹{data.get('monthly_sales', {}).get('revenue', 'N/A')}")
            print(f"  Total Sales Period: ₹{data.get('total_sales', {}).get('period', 'N/A')}")
            print(f"  Total Sales Count: {data.get('total_sales', {}).get('period_count', 'N/A')}")
            
            store_performance = data.get('store_performance', [])
            print(f"\n🏪 Store Performance:")
            for store in store_performance:
                print(f"  {store.get('name', 'Unknown')}: ₹{store.get('revenue', 0)} revenue, {store.get('sales_count', 0)} sales")
            
            # Check if data is correct for September
            monthly_revenue = data.get('monthly_sales', {}).get('revenue', 0)
            monthly_count = data.get('monthly_sales', {}).get('count', 0)
            
            if monthly_revenue == 0 and monthly_count == 0:
                print(f"\n✅ CORRECT: September 2025 shows 0 data")
            else:
                print(f"\n❌ INCORRECT: September 2025 shows data when it shouldn't!")
                print(f"   Expected: 0 revenue, 0 sales")
                print(f"   Actual: ₹{monthly_revenue} revenue, {monthly_count} sales")
                
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.data}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 80)
    print("API TEST COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    test_api_endpoint()
