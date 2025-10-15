#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append('/path/to/backend')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.products.models import Product, Category
from apps.stores.models import Store
from apps.tenants.models import Tenant

def create_sample_products():
    print("🔧 Creating Sample Products")
    print("=" * 50)
    
    # Get the tenant
    tenant = Tenant.objects.get(name="Mangatrai Jewels and Pearls")
    print(f"Using tenant: {tenant.name}")
    
    # Get or create categories
    rings_category, created = Category.objects.get_or_create(
        name="Rings",
        tenant=tenant,
        defaults={'description': 'Gold and silver rings'}
    )
    necklaces_category, created = Category.objects.get_or_create(
        name="Necklaces", 
        tenant=tenant,
        defaults={'description': 'Gold and silver necklaces'}
    )
    earrings_category, created = Category.objects.get_or_create(
        name="Earrings",
        tenant=tenant, 
        defaults={'description': 'Gold and silver earrings'}
    )
    
    print(f"Categories: {rings_category.name}, {necklaces_category.name}, {earrings_category.name}")
    
    # Get the store
    liberty_store = Store.objects.get(name="Mangatrai Liberty")
    print(f"Using store: {liberty_store.name}")
    
    # Create global products (visible to all users)
    global_products = [
        {
            'name': 'Classic Gold Ring',
            'sku': 'GLOBAL-RING-001',
            'description': 'Classic gold ring - available globally',
            'category': rings_category,
            'scope': 'global',
            'store': None,
            'selling_price': 25000,
            'cost_price': 20000,
            'quantity': 50,
            'status': 'active'
        },
        {
            'name': 'Elegant Silver Necklace',
            'sku': 'GLOBAL-NECK-001', 
            'description': 'Elegant silver necklace - available globally',
            'category': necklaces_category,
            'scope': 'global',
            'store': None,
            'selling_price': 15000,
            'cost_price': 12000,
            'quantity': 30,
            'status': 'active'
        },
        {
            'name': 'Diamond Stud Earrings',
            'sku': 'GLOBAL-EAR-001',
            'description': 'Diamond stud earrings - available globally', 
            'category': earrings_category,
            'scope': 'global',
            'store': None,
            'selling_price': 35000,
            'cost_price': 28000,
            'quantity': 20,
            'status': 'active'
        }
    ]
    
    # Create store-specific products
    store_products = [
        {
            'name': 'Liberty Exclusive Gold Ring',
            'sku': 'LIBERTY-RING-001',
            'description': 'Exclusive gold ring only available at Liberty store',
            'category': rings_category,
            'scope': 'store',
            'store': liberty_store,
            'selling_price': 30000,
            'cost_price': 24000,
            'quantity': 15,
            'status': 'active'
        },
        {
            'name': 'Liberty Special Necklace',
            'sku': 'LIBERTY-NECK-001',
            'description': 'Special necklace only available at Liberty store',
            'category': necklaces_category,
            'scope': 'store', 
            'store': liberty_store,
            'selling_price': 20000,
            'cost_price': 16000,
            'quantity': 10,
            'status': 'active'
        }
    ]
    
    # Create all products
    all_products = global_products + store_products
    
    created_count = 0
    for product_data in all_products:
        product, created = Product.objects.get_or_create(
            sku=product_data['sku'],
            tenant=tenant,
            defaults=product_data
        )
        if created:
            created_count += 1
            print(f"✅ Created: {product.name} ({product.scope})")
        else:
            print(f"⚠️  Already exists: {product.name}")
    
    print(f"\n📊 Summary:")
    print(f"  Created {created_count} new products")
    print(f"  Total products now: {Product.objects.filter(tenant=tenant).count()}")
    
    # Show breakdown by scope
    global_count = Product.objects.filter(tenant=tenant, scope='global').count()
    store_count = Product.objects.filter(tenant=tenant, scope='store').count()
    print(f"  Global products: {global_count}")
    print(f"  Store products: {store_count}")

if __name__ == "__main__":
    create_sample_products()



