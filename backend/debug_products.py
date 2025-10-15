#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append('/path/to/backend')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.products.models import Product
from apps.users.models import User
from apps.stores.models import Store
from apps.tenants.models import Tenant

def debug_products():
    print("🔍 Product Debug Information")
    print("=" * 50)
    
    # Check tenants
    tenants = Tenant.objects.all()
    print(f"Total tenants: {tenants.count()}")
    for tenant in tenants:
        print(f"  - {tenant.name} (ID: {tenant.id})")
    
    # Check stores
    stores = Store.objects.all()
    print(f"\nTotal stores: {stores.count()}")
    for store in stores:
        print(f"  - {store.name} (ID: {store.id}, Tenant: {store.tenant.name})")
    
    # Check users
    users = User.objects.all()
    print(f"\nTotal users: {users.count()}")
    for user in users:
        store_name = user.store.name if user.store else "No store"
        print(f"  - {user.username} (Role: {user.role}, Store: {store_name}, Tenant: {user.tenant.name if user.tenant else 'No tenant'})")
    
    # Check products
    products = Product.objects.all()
    print(f"\nTotal products: {products.count()}")
    
    if products.count() > 0:
        print("\nProduct details:")
        for product in products:
            store_name = product.store.name if product.store else "No store"
            print(f"  - {product.name} (SKU: {product.sku}, Scope: {product.scope}, Store: {store_name}, Tenant: {product.tenant.name if product.tenant else 'No tenant'})")
    else:
        print("\n❌ No products found in the database!")
        print("This explains why sales users can't see any products.")
        
        # Check if we need to create sample products
        print("\n💡 Suggestion: Create some sample products with different scopes:")
        print("  - Global products (scope='global')")
        print("  - Store-specific products (scope='store')")

if __name__ == "__main__":
    debug_products()



