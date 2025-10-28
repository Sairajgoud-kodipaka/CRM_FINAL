from django.core.management.base import BaseCommand
import base64


class Command(BaseCommand):
    help = 'Generate VAPID keys for Web Push notifications'

    def handle(self, *args, **options):
        try:
            from py_vapid import Vapid
            
            # Generate VAPID keys
            vapid = Vapid()
            vapid.generate_keys()
            
            self.stdout.write(self.style.SUCCESS('\n✓ VAPID Keys Generated Successfully!\n'))
            self.stdout.write(self.style.WARNING('Add these to your .env file (backend):\n'))
            
            self.stdout.write(
                self.style.SUCCESS(f'VAPID_PUBLIC_KEY={vapid.public_key.decode()}')
            )
            self.stdout.write(
                self.style.SUCCESS(f'VAPID_PRIVATE_KEY={vapid.private_key.decode()}')
            )
            self.stdout.write(
                self.style.SUCCESS('VAPID_CLAIMS_EMAIL=mailto:your-email@example.com')
            )
            
            self.stdout.write(
                self.style.WARNING('\nReplace "your-email@example.com" with your actual email address.\n')
            )
            
        except ImportError:
            self.stdout.write(
                self.style.ERROR(
                    'Error: py_vapid is not installed. Install it with: pip install py-vapid'
                )
            )

