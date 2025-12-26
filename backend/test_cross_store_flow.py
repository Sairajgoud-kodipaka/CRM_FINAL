"""
Test Script: Cross-Store Customer Flow
======================================

This script tests and demonstrates:
1. Cross-store customer visibility
2. Interest tracking with store information
3. Sales rep collection from multiple stores
4. Auto-tagging with "Visited N stores"
5. Store name display on interests

Run this script to verify the implementation:
    python manage.py shell < test_cross_store_flow.py
    OR
    python manage.py shell
    >>> exec(open('test_cross_store_flow.py').read())
"""

from apps.clients.models import Client, CustomerInterest
from apps.sales.models import SalesPipeline
from apps.users.models import User
from apps.stores.models import Store
from apps.tenants.models import Tenant
from apps.clients.models import CustomerTag
from django.utils import timezone
from datetime import timedelta

print("=" * 80)
print("CROSS-STORE CUSTOMER FLOW TEST")
print("=" * 80)

# Get or create test data
tenant = Tenant.objects.first()
if not tenant:
    print("❌ No tenant found. Please create a tenant first.")
    exit()

print(f"\n✅ Using Tenant: {tenant.name}")

# Get stores
stores = Store.objects.filter(tenant=tenant)[:2]
if stores.count() < 2:
    print("❌ Need at least 2 stores. Please create stores first.")
    exit()

store_a = stores[0]
store_b = stores[1]
print(f"✅ Store A: {store_a.name}")
print(f"✅ Store B: {store_b.name}")

# Get sales reps
sales_rep_a = User.objects.filter(store=store_a, tenant=tenant).first()
sales_rep_b = User.objects.filter(store=store_b, tenant=tenant).first()

if not sales_rep_a or not sales_rep_b:
    print("❌ Need sales reps in both stores. Please create users first.")
    exit()

print(f"✅ Sales Rep A: {sales_rep_a.get_full_name() or sales_rep_a.username} (Store: {store_a.name})")
print(f"✅ Sales Rep B: {sales_rep_b.get_full_name() or sales_rep_b.username} (Store: {store_b.name})")

# Test customer (create or get existing)
test_phone = "+919876543210"
customer = Client.objects.filter(phone=test_phone, tenant=tenant).first()

if not customer:
    print(f"\n📝 Creating test customer with phone: {test_phone}")
    customer = Client.objects.create(
        first_name="Test",
        last_name="Customer",
        phone=test_phone,
        tenant=tenant,
        store=store_a,  # Original store
        city="Test City",
        state="Test State",
        country="India"
    )
    print(f"✅ Created customer: {customer.full_name} (ID: {customer.id})")
else:
    print(f"\n✅ Using existing customer: {customer.full_name} (ID: {customer.id})")

print("\n" + "=" * 80)
print("STEP 1: Store A Visit - Add Interests")
print("=" * 80)

# Create pipeline entry for Store A visit
pipeline_a = SalesPipeline.objects.create(
    client=customer,
    title=f"Store Visit - {timezone.now().strftime('%m/%d/%Y')}",
    sales_representative=sales_rep_a,
    stage="interested",
    probability=20,
    expected_value=50000.00,
    notes="First visit to Store A",
    tenant=tenant
)
print(f"✅ Created Pipeline Entry A:")
print(f"   - Store: {store_a.name}")
print(f"   - Sales Rep: {sales_rep_a.get_full_name() or sales_rep_a.username}")
print(f"   - Stage: {pipeline_a.stage}")

# Create interests for Store A (simulate)
from apps.products.models import Category, Product
category = Category.objects.filter(tenant=tenant).first()
product = Product.objects.filter(tenant=tenant).first()

if category and product:
    interest_a1 = CustomerInterest.objects.create(
        client=customer,
        category=category,
        product=product,
        revenue=25000.00,
        tenant=tenant,
        notes="Category: Test Category. Design Number: DG-001. Images: []"
    )
    print(f"✅ Created Interest 1:")
    print(f"   - Category: {category.name}")
    print(f"   - Product: {product.name}")
    print(f"   - Revenue: ₹{interest_a1.revenue}")
    print(f"   - Created at: {interest_a1.created_at}")

print("\n" + "=" * 80)
print("STEP 2: Store B Visit - Add More Interests (Cross-Store)")
print("=" * 80)

# Create pipeline entry for Store B visit (cross-store)
pipeline_b = SalesPipeline.objects.create(
    client=customer,
    title=f"Store Visit - {timezone.now().strftime('%m/%d/%Y')}",
    sales_representative=sales_rep_b,
    stage="interested",
    probability=30,
    expected_value=75000.00,
    notes="Second visit to Store B (cross-store)",
    tenant=tenant
)
print(f"✅ Created Pipeline Entry B:")
print(f"   - Store: {store_b.name}")
print(f"   - Sales Rep: {sales_rep_b.get_full_name() or sales_rep_b.username}")
print(f"   - Stage: {pipeline_b.stage}")

if category and product:
    interest_b1 = CustomerInterest.objects.create(
        client=customer,
        category=category,
        product=product,
        revenue=40000.00,
        tenant=tenant,
        notes="Category: Test Category. Design Number: DG-002. Images: []"
    )
    print(f"✅ Created Interest 2:")
    print(f"   - Category: {category.name}")
    print(f"   - Product: {product.name}")
    print(f"   - Revenue: ₹{interest_b1.revenue}")
    print(f"   - Created at: {interest_b1.created_at}")

print("\n" + "=" * 80)
print("STEP 3: Check Auto-Tagging")
print("=" * 80)

# Count unique stores from pipelines
unique_stores = set()
pipelines = SalesPipeline.objects.filter(client=customer)
for pipeline in pipelines:
    if pipeline.sales_representative and pipeline.sales_representative.store:
        unique_stores.add(pipeline.sales_representative.store.id)

store_count = len(unique_stores)
print(f"✅ Unique stores visited: {store_count}")

if store_count > 1:
    tag_slug = f"visited-{store_count}-stores"
    tag_name = f"Visited {store_count} stores"
    # CustomerTag doesn't have tenant field, so just use slug
    tag, created = CustomerTag.objects.get_or_create(
        slug=tag_slug,
        defaults={'name': tag_name, 'category': 'system'}
    )
    customer.tags.add(tag)
    print(f"✅ Auto-tagged customer with: '{tag_name}'")
    print(f"   - Tag slug: {tag.slug}")
    print(f"   - Tag name: {tag.name}")

print("\n" + "=" * 80)
print("STEP 4: Verify Store Association with Interests")
print("=" * 80)

# Check interests and their associated stores
interests = CustomerInterest.objects.filter(client=customer)
print(f"✅ Total interests: {interests.count()}")

for interest in interests:
    # Find related pipeline (within 2 hours)
    related_pipeline = SalesPipeline.objects.filter(
        client=customer,
        created_at__gte=interest.created_at - timedelta(hours=2),
        created_at__lte=interest.created_at + timedelta(hours=2)
    ).order_by('-created_at').first()
    
    if related_pipeline and related_pipeline.sales_representative:
        store_name = related_pipeline.sales_representative.store.name if related_pipeline.sales_representative.store else "No Store"
        sales_rep_name = related_pipeline.sales_representative.get_full_name() or related_pipeline.sales_representative.username
        print(f"   Interest ID {interest.id}:")
        print(f"     - Store: {store_name}")
        print(f"     - Sales Rep: {sales_rep_name}")
        print(f"     - Product: {interest.product.name if interest.product else 'N/A'}")
        print(f"     - Revenue: ₹{interest.revenue}")

print("\n" + "=" * 80)
print("STEP 5: Collect All Sales Reps")
print("=" * 80)

# Collect all unique sales reps
sales_reps_map = {}
pipelines = SalesPipeline.objects.filter(client=customer).select_related('sales_representative__store')
for pipeline in pipelines:
    if pipeline.sales_representative:
        rep_name = pipeline.sales_representative.get_full_name() or pipeline.sales_representative.username
        store_name = pipeline.sales_representative.store.name if pipeline.sales_representative.store else "No Store"
        key = f"{rep_name}_{store_name}"
        if key not in sales_reps_map:
            sales_reps_map[key] = {
                'name': rep_name,
                'store': store_name
            }

print(f"✅ All Sales Reps who dealt with this customer:")
for key, rep_info in sales_reps_map.items():
    print(f"   - {rep_info['name']} ({rep_info['store']})")

print("\n" + "=" * 80)
print("STEP 6: Test Serializer (API Response)")
print("=" * 80)

# Test the serializer to see what data is returned
from apps.clients.serializers import ClientSerializer
from rest_framework.test import APIRequestFactory
from django.contrib.auth import get_user_model

# Create a mock request
factory = APIRequestFactory()
request = factory.get('/')
request.user = sales_rep_a  # Use sales rep A as the user

serializer = ClientSerializer(customer, context={'request': request})
serialized_data = serializer.data

print("✅ Serialized Customer Data:")
print(f"   - Customer ID: {serialized_data.get('id')}")
print(f"   - Name: {serialized_data.get('first_name')} {serialized_data.get('last_name')}")
print(f"   - Phone: {serialized_data.get('phone')}")

# Check tags
tags = serialized_data.get('tags', [])
if tags:
    print(f"   - Tags: {', '.join([tag.get('name', '') if isinstance(tag, dict) else str(tag) for tag in tags])}")

# Check interests
interests_data = serialized_data.get('customer_interests', [])
print(f"   - Total Interests: {len(interests_data)}")
for idx, interest in enumerate(interests_data, 1):
    store_name = interest.get('store', 'Unknown')
    product_name = interest.get('product', {}).get('name', 'N/A') if isinstance(interest.get('product'), dict) else 'N/A'
    print(f"     Interest {idx}:")
    print(f"       - Product: {product_name}")
    print(f"       - Store: {store_name}")
    print(f"       - Revenue: ₹{interest.get('revenue', 0)}")

print("\n" + "=" * 80)
print("✅ TEST COMPLETE!")
print("=" * 80)
print("\nSummary:")
print(f"  - Customer: {customer.full_name}")
print(f"  - Stores Visited: {store_count}")
print(f"  - Total Interests: {interests.count()}")
print(f"  - Total Sales Reps: {len(sales_reps_map)}")
print(f"  - Tags: {', '.join([tag.name for tag in customer.tags.all()])}")
print("\n" + "=" * 80)

