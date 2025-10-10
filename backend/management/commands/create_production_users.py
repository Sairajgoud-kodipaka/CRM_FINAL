from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

class Command(BaseCommand):
    help = 'Create production users for Jewellery CRM'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force creation even if users exist',
        )

    def handle(self, *args, **options):
        force = options['force']
        
        users_to_create = [
            {
                'username': 'admin',
                'email': 'admin@jewellerycrm.com',
                'password': 'JewelleryCRM2024!',
                'is_superuser': True,
                'is_staff': True,
                'description': 'System Administrator'
            },
            {
                'username': 'business_admin',
                'email': 'business@jewellerycrm.com',
                'password': 'BusinessAdmin2024!',
                'is_superuser': False,
                'is_staff': True,
                'description': 'Business Administrator'
            },
            {
                'username': 'manager',
                'email': 'manager@jewellerycrm.com',
                'password': 'Manager2024!',
                'is_superuser': False,
                'is_staff': True,
                'description': 'Store Manager'
            },
            {
                'username': 'sales',
                'email': 'sales@jewellerycrm.com',
                'password': 'Sales2024!',
                'is_superuser': False,
                'is_staff': True,
                'description': 'Sales Representative'
            },
            {
                'username': 'telecaller',
                'email': 'telecaller@jewellerycrm.com',
                'password': 'Telecaller2024!',
                'is_superuser': False,
                'is_staff': True,
                'description': 'Telecaller'
            }
        ]

        with transaction.atomic():
            for user_data in users_to_create:
                username = user_data['username']
                email = user_data['email']
                password = user_data['password']
                is_superuser = user_data['is_superuser']
                is_staff = user_data['is_staff']
                description = user_data['description']

                # Check if user already exists
                if User.objects.filter(username=username).exists():
                    if force:
                        self.stdout.write(
                            self.style.WARNING(f'Updating existing user: {username}')
                        )
                        user = User.objects.get(username=username)
                        user.email = email
                        user.set_password(password)
                        user.is_superuser = is_superuser
                        user.is_staff = is_staff
                        user.is_active = True
                        user.save()
                        self.stdout.write(
                            self.style.SUCCESS(f'Updated user: {username} ({description})')
                        )
                    else:
                        self.stdout.write(
                            self.style.WARNING(f'User {username} already exists. Use --force to update.')
                        )
                else:
                    # Create new user
                    if is_superuser:
                        user = User.objects.create_superuser(
                            username=username,
                            email=email,
                            password=password
                        )
                    else:
                        user = User.objects.create_user(
                            username=username,
                            email=email,
                            password=password,
                            is_staff=is_staff,
                            is_active=True
                        )
                    
                    self.stdout.write(
                        self.style.SUCCESS(f'Created user: {username} ({description})')
                    )

        self.stdout.write(
            self.style.SUCCESS('\n🎉 Production users setup completed!')
        )
        
        self.stdout.write('\n📋 User Credentials:')
        self.stdout.write('=' * 50)
        for user_data in users_to_create:
            username = user_data['username']
            password = user_data['password']
            description = user_data['description']
            self.stdout.write(f'{description}:')
            self.stdout.write(f'  Username: {username}')
            self.stdout.write(f'  Password: {password}')
            self.stdout.write('')
        
        self.stdout.write('🔗 Admin Panel: https://crm-final-tj4n.onrender.com/admin/')
