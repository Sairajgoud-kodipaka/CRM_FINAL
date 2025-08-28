from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model
from apps.products.models import Category, Product, ProductInventory
from apps.tenants.models import Tenant
from apps.stores.models import Store
from decimal import Decimal
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Populate database with realistic jewelry products and categories'

    def add_arguments(self, parser):
        parser.add_argument(
            '--tenant-id',
            type=int,
            help='Tenant ID to populate data for',
        )
        parser.add_argument(
            '--store-id',
            type=int,
            help='Store ID to populate data for',
        )
        parser.add_argument(
            '--clear-existing',
            action='store_true',
            help='Clear existing products and categories before populating',
        )

    def handle(self, *args, **options):
        tenant_id = options.get('tenant_id')
        store_id = options.get('store_id')
        clear_existing = options.get('clear_existing')

        # Get or create tenant
        if tenant_id:
            try:
                tenant = Tenant.objects.get(id=tenant_id)
            except Tenant.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Tenant with ID {tenant_id} does not exist')
                )
                return
        else:
            tenant = Tenant.objects.first()
            if not tenant:
                self.stdout.write(
                    self.style.ERROR('No tenant found. Please create a tenant first.')
                )
                return

        # Get or create store
        if store_id:
            try:
                store = Store.objects.get(id=store_id, tenant=tenant)
            except Store.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Store with ID {store_id} does not exist for tenant {tenant.id}')
                )
                return
        else:
            store = Store.objects.filter(tenant=tenant).first()
            if not store:
                self.stdout.write(
                    self.style.ERROR('No store found. Please create a store first.')
                )
                return

        self.stdout.write(
            self.style.SUCCESS(f'Populating data for Tenant: {tenant.name}, Store: {store.name}')
        )

        if clear_existing:
            self.stdout.write('Clearing existing products and categories...')
            Product.objects.filter(tenant=tenant).delete()
            Category.objects.filter(tenant=tenant).delete()

        # Create categories
        categories = self.create_categories(tenant, store)
        
        # Create products
        products = self.create_products(tenant, store, categories)
        
        # Create inventory
        self.create_inventory(tenant, store, products)

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {len(categories)} categories and {len(products)} products'
            )
        )

    def create_categories(self, tenant, store):
        """Create jewelry categories"""
        categories_data = [
            # Main Categories
            {
                'name': 'Rings',
                'description': 'Elegant rings for all occasions including engagement, wedding, and fashion rings',
                'parent': None,
                'scope': 'global'
            },
            {
                'name': 'Necklaces',
                'description': 'Beautiful necklaces including chains, pendants, and statement pieces',
                'parent': None,
                'scope': 'global'
            },
            {
                'name': 'Earrings',
                'description': 'Stylish earrings including studs, hoops, and drop earrings',
                'parent': None,
                'scope': 'global'
            },
            {
                'name': 'Bracelets',
                'description': 'Elegant bracelets including bangles, chains, and charm bracelets',
                'parent': None,
                'scope': 'global'
            },
            {
                'name': 'Pendants',
                'description': 'Beautiful pendants for necklaces and chains',
                'parent': None,
                'scope': 'global'
            },
            {
                'name': 'Anklets',
                'description': 'Delicate anklets for a touch of elegance',
                'parent': None,
                'scope': 'global'
            },
            {
                'name': 'Nose Pins',
                'description': 'Traditional and modern nose pins',
                'parent': None,
                'scope': 'global'
            },
            {
                'name': 'Mangalsutra',
                'description': 'Traditional mangalsutra for married women',
                'parent': None,
                'scope': 'global'
            },
            {
                'name': 'Toe Rings',
                'description': 'Traditional toe rings for married women',
                'parent': None,
                'scope': 'global'
            },
            {
                'name': 'Temple Jewellery',
                'description': 'Traditional temple jewellery for special occasions',
                'parent': None,
                'scope': 'global'
            },
        ]

        # Subcategories for Rings
        ring_subcategories = [
            {'name': 'Engagement Rings', 'description': 'Beautiful engagement rings'},
            {'name': 'Wedding Rings', 'description': 'Elegant wedding bands'},
            {'name': 'Fashion Rings', 'description': 'Trendy fashion rings'},
            {'name': 'Solitaire Rings', 'description': 'Classic solitaire rings'},
            {'name': 'Diamond Rings', 'description': 'Premium diamond rings'},
            {'name': 'Gold Rings', 'description': 'Traditional gold rings'},
            {'name': 'Silver Rings', 'description': 'Elegant silver rings'},
            {'name': 'Platinum Rings', 'description': 'Premium platinum rings'},
        ]

        # Subcategories for Necklaces
        necklace_subcategories = [
            {'name': 'Gold Chains', 'description': 'Traditional gold chains'},
            {'name': 'Diamond Necklaces', 'description': 'Luxury diamond necklaces'},
            {'name': 'Pearl Necklaces', 'description': 'Elegant pearl necklaces'},
            {'name': 'Silver Necklaces', 'description': 'Beautiful silver necklaces'},
            {'name': 'Platinum Necklaces', 'description': 'Premium platinum necklaces'},
            {'name': 'Kundan Necklaces', 'description': 'Traditional kundan necklaces'},
            {'name': 'Polki Necklaces', 'description': 'Traditional polki necklaces'},
        ]

        # Subcategories for Earrings
        earring_subcategories = [
            {'name': 'Gold Studs', 'description': 'Classic gold studs'},
            {'name': 'Diamond Studs', 'description': 'Luxury diamond studs'},
            {'name': 'Pearl Earrings', 'description': 'Elegant pearl earrings'},
            {'name': 'Silver Earrings', 'description': 'Beautiful silver earrings'},
            {'name': 'Jhumka Earrings', 'description': 'Traditional jhumka earrings'},
            {'name': 'Hoops', 'description': 'Stylish hoop earrings'},
            {'name': 'Drop Earrings', 'description': 'Elegant drop earrings'},
        ]

        categories = {}
        
        with transaction.atomic():
            # Create main categories
            for cat_data in categories_data:
                category = Category.objects.create(
                    tenant=tenant,
                    store=None,  # Global categories
                    **cat_data
                )
                categories[cat_data['name']] = category
                self.stdout.write(f'Created category: {category.name}')

            # Create subcategories for Rings
            rings_category = categories['Rings']
            for subcat_data in ring_subcategories:
                subcategory = Category.objects.create(
                    tenant=tenant,
                    store=None,
                    parent=rings_category,
                    **subcat_data
                )
                categories[f"Rings - {subcat_data['name']}"] = subcategory
                self.stdout.write(f'Created subcategory: {subcategory.name} under {rings_category.name}')

            # Create subcategories for Necklaces
            necklaces_category = categories['Necklaces']
            for subcat_data in necklace_subcategories:
                subcategory = Category.objects.create(
                    tenant=tenant,
                    store=None,
                    parent=necklaces_category,
                    **subcat_data
                )
                categories[f"Necklaces - {subcat_data['name']}"] = subcategory
                self.stdout.write(f'Created subcategory: {subcategory.name} under {necklaces_category.name}')

            # Create subcategories for Earrings
            earrings_category = categories['Earrings']
            for subcat_data in earring_subcategories:
                subcategory = Category.objects.create(
                    tenant=tenant,
                    store=None,
                    parent=earrings_category,
                    **subcat_data
                )
                categories[f"Earrings - {subcat_data['name']}"] = subcategory
                self.stdout.write(f'Created subcategory: {subcategory.name} under {earrings_category.name}')

        return categories

    def create_products(self, tenant, store, categories):
        """Create jewelry products"""
        products = []
        
        # Product data with realistic jewelry information
        products_data = [
            # Engagement Rings
            {
                'name': 'Classic Solitaire Diamond Engagement Ring',
                'sku': 'ER001',
                'description': 'Beautiful 1.5 carat solitaire diamond engagement ring in 18K white gold setting',
                'category': categories.get('Rings - Solitaire Rings'),
                'brand': 'Luxury Jewels',
                'cost_price': Decimal('45000.00'),
                'selling_price': Decimal('75000.00'),
                'discount_price': Decimal('67500.00'),
                'quantity': 5,
                'weight': Decimal('3.2'),
                'material': '18K White Gold',
                'color': 'White',
                'is_featured': True,
                'is_bestseller': True,
                'tags': ['engagement', 'diamond', 'solitaire', 'white gold']
            },
            {
                'name': 'Rose Gold Halo Engagement Ring',
                'sku': 'ER002',
                'description': 'Elegant halo engagement ring with center diamond surrounded by smaller diamonds in rose gold',
                'category': categories.get('Rings - Engagement Rings'),
                'brand': 'Elegance Collection',
                'cost_price': Decimal('38000.00'),
                'selling_price': Decimal('62000.00'),
                'quantity': 8,
                'weight': Decimal('2.8'),
                'material': '18K Rose Gold',
                'color': 'Rose Gold',
                'is_featured': True,
                'tags': ['engagement', 'halo', 'rose gold', 'diamond']
            },
            {
                'name': 'Vintage Style Emerald Cut Ring',
                'sku': 'ER003',
                'description': 'Vintage-inspired emerald cut diamond ring with intricate filigree details',
                'category': categories.get('Rings - Fashion Rings'),
                'brand': 'Heritage Jewels',
                'cost_price': Decimal('52000.00'),
                'selling_price': Decimal('85000.00'),
                'quantity': 3,
                'weight': Decimal('4.1'),
                'material': '18K Yellow Gold',
                'color': 'Yellow',
                'is_featured': False,
                'tags': ['vintage', 'emerald cut', 'filigree', 'yellow gold']
            },

            # Wedding Rings
            {
                'name': 'Classic Wedding Band',
                'sku': 'WR001',
                'description': 'Simple and elegant 18K gold wedding band for everyday wear',
                'category': categories.get('Rings - Wedding Rings'),
                'brand': 'Classic Collection',
                'cost_price': Decimal('12000.00'),
                'selling_price': Decimal('18000.00'),
                'quantity': 15,
                'weight': Decimal('2.5'),
                'material': '18K Yellow Gold',
                'color': 'Yellow',
                'is_featured': False,
                'tags': ['wedding', 'band', 'classic', 'yellow gold']
            },
            {
                'name': 'Diamond Wedding Band',
                'sku': 'WR002',
                'description': 'Elegant wedding band with small diamonds set in platinum',
                'category': categories.get('Rings - Wedding Rings'),
                'brand': 'Luxury Jewels',
                'cost_price': Decimal('28000.00'),
                'selling_price': Decimal('42000.00'),
                'quantity': 10,
                'weight': Decimal('3.0'),
                'material': 'Platinum',
                'color': 'White',
                'is_featured': True,
                'tags': ['wedding', 'diamond', 'platinum', 'elegant']
            },

            # Necklaces
            {
                'name': 'Diamond Pendant Necklace',
                'sku': 'NC001',
                'description': 'Beautiful diamond pendant on 18K gold chain, perfect for everyday wear',
                'category': categories.get('Necklaces - Diamond Necklaces'),
                'brand': 'Elegance Collection',
                'cost_price': Decimal('22000.00'),
                'selling_price': Decimal('35000.00'),
                'quantity': 12,
                'weight': Decimal('2.8'),
                'material': '18K Gold',
                'color': 'Yellow',
                'is_featured': True,
                'tags': ['necklace', 'diamond', 'pendant', 'everyday']
            },
            {
                'name': 'Pearl Strand Necklace',
                'sku': 'NC002',
                'description': 'Classic freshwater pearl strand necklace with 18K gold clasp',
                'category': categories.get('Necklaces - Pearl Necklaces'),
                'brand': 'Classic Collection',
                'cost_price': Decimal('15000.00'),
                'selling_price': Decimal('25000.00'),
                'quantity': 20,
                'weight': Decimal('1.5'),
                'material': 'Freshwater Pearls, 18K Gold',
                'color': 'White',
                'is_featured': False,
                'tags': ['necklace', 'pearl', 'classic', 'elegant']
            },
            {
                'name': 'Gold Chain Necklace',
                'sku': 'NC003',
                'description': 'Traditional 22K gold chain necklace, perfect for traditional occasions',
                'category': categories.get('Necklaces - Gold Chains'),
                'brand': 'Heritage Jewels',
                'cost_price': Decimal('18000.00'),
                'selling_price': Decimal('28000.00'),
                'quantity': 25,
                'weight': Decimal('8.5'),
                'material': '22K Gold',
                'color': 'Yellow',
                'is_featured': False,
                'tags': ['necklace', 'gold', 'traditional', '22K']
            },

            # Earrings
            {
                'name': 'Diamond Stud Earrings',
                'sku': 'EE001',
                'description': 'Classic 1 carat total weight diamond stud earrings in 18K white gold',
                'category': categories.get('Earrings - Diamond Studs'),
                'brand': 'Luxury Jewels',
                'cost_price': Decimal('32000.00'),
                'selling_price': Decimal('52000.00'),
                'quantity': 8,
                'weight': Decimal('2.2'),
                'material': '18K White Gold',
                'color': 'White',
                'is_featured': True,
                'is_bestseller': True,
                'tags': ['earrings', 'diamond', 'studs', 'classic']
            },
            {
                'name': 'Pearl Drop Earrings',
                'sku': 'EE002',
                'description': 'Elegant freshwater pearl drop earrings with 18K gold accents',
                'category': categories.get('Earrings - Pearl Earrings'),
                'brand': 'Elegance Collection',
                'cost_price': Decimal('12000.00'),
                'selling_price': Decimal('20000.00'),
                'quantity': 15,
                'weight': Decimal('1.8'),
                'material': 'Freshwater Pearls, 18K Gold',
                'color': 'White',
                'is_featured': False,
                'tags': ['earrings', 'pearl', 'drop', 'elegant']
            },
            {
                'name': 'Traditional Jhumka Earrings',
                'sku': 'EE003',
                'description': 'Beautiful traditional jhumka earrings in 22K gold with kundan work',
                'category': categories.get('Earrings - Jhumka Earrings'),
                'brand': 'Heritage Jewels',
                'cost_price': Decimal('25000.00'),
                'selling_price': Decimal('38000.00'),
                'quantity': 6,
                'weight': Decimal('12.5'),
                'material': '22K Gold, Kundan',
                'color': 'Yellow',
                'is_featured': True,
                'tags': ['earrings', 'jhumka', 'traditional', 'kundan']
            },

            # Bracelets
            {
                'name': 'Diamond Tennis Bracelet',
                'sku': 'BR001',
                'description': 'Elegant diamond tennis bracelet with 3 carat total weight in 18K white gold',
                'category': categories.get('Bracelets'),
                'brand': 'Luxury Jewels',
                'cost_price': Decimal('45000.00'),
                'selling_price': Decimal('72000.00'),
                'quantity': 4,
                'weight': Decimal('4.8'),
                'material': '18K White Gold',
                'color': 'White',
                'is_featured': True,
                'is_bestseller': True,
                'tags': ['bracelet', 'diamond', 'tennis', 'elegant']
            },
            {
                'name': 'Gold Bangle Set',
                'sku': 'BR002',
                'description': 'Traditional 22K gold bangle set with traditional designs',
                'category': categories.get('Bracelets'),
                'brand': 'Heritage Jewels',
                'cost_price': Decimal('28000.00'),
                'selling_price': Decimal('42000.00'),
                'quantity': 10,
                'weight': Decimal('15.2'),
                'material': '22K Gold',
                'color': 'Yellow',
                'is_featured': False,
                'tags': ['bracelet', 'bangle', 'traditional', '22K']
            },

            # Pendants
            {
                'name': 'Om Pendant',
                'sku': 'PD001',
                'description': 'Beautiful Om symbol pendant in 18K gold, perfect for spiritual occasions',
                'category': categories.get('Pendants'),
                'brand': 'Spiritual Collection',
                'cost_price': Decimal('8000.00'),
                'selling_price': Decimal('12000.00'),
                'quantity': 18,
                'weight': Decimal('2.1'),
                'material': '18K Gold',
                'color': 'Yellow',
                'is_featured': False,
                'tags': ['pendant', 'om', 'spiritual', 'gold']
            },
            {
                'name': 'Diamond Heart Pendant',
                'sku': 'PD002',
                'description': 'Romantic heart-shaped diamond pendant in 18K rose gold',
                'category': categories.get('Pendants'),
                'brand': 'Elegance Collection',
                'cost_price': Decimal('18000.00'),
                'selling_price': Decimal('28000.00'),
                'quantity': 12,
                'weight': Decimal('1.8'),
                'material': '18K Rose Gold',
                'color': 'Rose Gold',
                'is_featured': True,
                'tags': ['pendant', 'heart', 'diamond', 'romantic']
            },

            # Mangalsutra
            {
                'name': 'Traditional Mangalsutra',
                'sku': 'MG001',
                'description': 'Traditional black beads mangalsutra with 22K gold pendant',
                'category': categories.get('Mangalsutra'),
                'brand': 'Heritage Jewels',
                'cost_price': Decimal('12000.00'),
                'selling_price': Decimal('18000.00'),
                'quantity': 25,
                'weight': Decimal('3.5'),
                'material': '22K Gold, Black Beads',
                'color': 'Black and Gold',
                'is_featured': False,
                'tags': ['mangalsutra', 'traditional', 'black beads', 'gold']
            },

            # Temple Jewellery
            {
                'name': 'Traditional Temple Necklace Set',
                'sku': 'TJ001',
                'description': 'Complete temple jewellery set including necklace, earrings, and bangles',
                'category': categories.get('Temple Jewellery'),
                'brand': 'Heritage Jewels',
                'cost_price': Decimal('45000.00'),
                'selling_price': Decimal('68000.00'),
                'quantity': 3,
                'weight': Decimal('25.8'),
                'material': '22K Gold, Kundan, Polki',
                'color': 'Yellow',
                'is_featured': True,
                'tags': ['temple', 'traditional', 'set', 'kundan', 'polki']
            },
        ]

        with transaction.atomic():
            for product_data in products_data:
                # Set default values for missing fields
                product_data.setdefault('min_quantity', 2)
                product_data.setdefault('max_quantity', 50)
                product_data.setdefault('status', 'active')
                product_data.setdefault('scope', 'global')
                product_data.setdefault('store', None)
                product_data.setdefault('dimensions', 'Standard')
                product_data.setdefault('meta_title', product_data['name'])
                product_data.setdefault('meta_description', product_data['description'])
                product_data.setdefault('additional_images', [])

                product = Product.objects.create(
                    tenant=tenant,
                    **product_data
                )
                products.append(product)
                self.stdout.write(f'Created product: {product.name} ({product.sku})')

        return products

    def create_inventory(self, tenant, store, products):
        """Create inventory records for products"""
        with transaction.atomic():
            for product in products:
                # Create inventory record for the store
                inventory, created = ProductInventory.objects.get_or_create(
                    product=product,
                    store=store,
                    defaults={
                        'quantity': product.quantity,
                        'reserved_quantity': 0,
                        'reorder_point': max(2, product.quantity // 4),
                        'max_stock': product.max_quantity,
                        'location': 'Main Display'
                    }
                )
                
                if created:
                    self.stdout.write(f'Created inventory for {product.name}: {inventory.quantity} units')
                else:
                    self.stdout.write(f'Updated inventory for {product.name}: {inventory.quantity} units')
