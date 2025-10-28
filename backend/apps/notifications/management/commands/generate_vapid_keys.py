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
            
            # py_vapid 1.9.0 returns keys as strings directly
            # Just convert to string if needed (shouldn't need to, but safe)
            public_key_str = str(vapid.public_key) if not isinstance(vapid.public_key, str) else vapid.public_key
            private_key_str = str(vapid.private_key) if not isinstance(vapid.private_key, str) else vapid.private_key
            
            self.stdout.write(
                self.style.SUCCESS(f'VAPID_PUBLIC_KEY={public_key_str}')
            )
            self.stdout.write(
                self.style.SUCCESS(f'VAPID_PRIVATE_KEY={private_key_str}')
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

