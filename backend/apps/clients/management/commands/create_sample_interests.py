from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.clients.models import Client, CustomerInterest
from apps.products.models import Category, Product
from apps.tenants.models import Tenant

User = get_user_model()

class Command(BaseCommand):
    help = 'Create sample customer interests for testing'

    def handle(self, *args, **options):
        # Get the first tenant
        tenant = Tenant.objects.first()
        if not tenant:
            self.stdout.write(self.style.ERROR('No tenant found. Please create a tenant first.'))
            return

        # Get the first user
        user = User.objects.filter(tenant=tenant).first()
        if not user:
            self.stdout.write(self.style.ERROR('No user found for tenant. Please create a user first.'))
            return

        # Get or create sample categories
        gold_category, _ = Category.objects.get_or_create(
            name='Gold Jewellery',
            tenant=tenant,
            defaults={'description': 'Gold jewellery items'}
        )
        
        silver_category, _ = Category.objects.get_or_create(
            name='Silver Jewellery',
            tenant=tenant,
            defaults={'description': 'Silver jewellery items'}
        )

        # Get or create sample products
        gold_ring, _ = Product.objects.get_or_create(
            name='Gold Ring',
            sku='GR001',
            tenant=tenant,
            defaults={
                'category': gold_category,
                'cost_price': 5000,
                'selling_price': 8000,
                'quantity': 10,
                'description': 'Beautiful gold ring'
            }
        )

        silver_necklace, _ = Product.objects.get_or_create(
            name='Silver Necklace',
            sku='SN001',
            tenant=tenant,
            defaults={
                'category': silver_category,
                'cost_price': 2000,
                'selling_price': 3500,
                'quantity': 15,
                'description': 'Elegant silver necklace'
            }
        )

        # Get the first client
        clients = Client.objects.filter(tenant=tenant)
        self.stdout.write(f'Found {clients.count()} clients for tenant {tenant.name}')
        
        if clients.count() == 0:
            self.stdout.write(self.style.ERROR('No clients found for tenant. Please create a client first.'))
            return

        client = clients.first()
        self.stdout.write(f'Using client: {client.full_name}')

        # Create sample interests
        interest1, created1 = CustomerInterest.objects.get_or_create(
            client=client,
            category=gold_category,
            product=gold_ring,
            tenant=tenant,
            defaults={
                'revenue': 8000,
                'notes': 'Customer is interested in gold rings for wedding'
            }
        )

        interest2, created2 = CustomerInterest.objects.get_or_create(
            client=client,
            category=silver_category,
            product=silver_necklace,
            tenant=tenant,
            defaults={
                'revenue': 3500,
                'notes': 'Customer likes silver necklaces for daily wear'
            }
        )

        if created1:
            self.stdout.write(self.style.SUCCESS(f'Created interest 1: {interest1}'))
        else:
            self.stdout.write(self.style.WARNING(f'Interest 1 already exists: {interest1}'))

        if created2:
            self.stdout.write(self.style.SUCCESS(f'Created interest 2: {interest2}'))
        else:
            self.stdout.write(self.style.WARNING(f'Interest 2 already exists: {interest2}'))

        self.stdout.write(self.style.SUCCESS('Sample customer interests created successfully!'))
