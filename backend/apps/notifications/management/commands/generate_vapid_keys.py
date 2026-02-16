from django.core.management.base import BaseCommand
import base64


class Command(BaseCommand):
    help = 'Generate VAPID keys for Web Push notifications'

    def handle(self, *args, **options):
        try:
            from py_vapid import Vapid
            from cryptography.hazmat.primitives import serialization
            from cryptography.hazmat.backends import default_backend
            
            # Generate VAPID keys
            vapid = Vapid()
            vapid.generate_keys()
            
            self.stdout.write(self.style.SUCCESS('\n✓ VAPID Keys Generated Successfully!\n'))
            self.stdout.write(self.style.WARNING('Add these to your .env file (backend):\n'))
            
            # Public key: output as single line so .env gets the full key (no truncation)
            public_key_pem = vapid.public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            ).decode('utf-8').strip()
            public_key_one_line = public_key_pem.replace('-----BEGIN PUBLIC KEY-----', '').replace('-----END PUBLIC KEY-----', '').replace('\n', '').strip()
            
            # Private key: single line for .env
            private_key_pem = vapid.private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ).decode('utf-8').strip()
            private_key_one_line = private_key_pem.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace('\n', '').strip()
            
            self.stdout.write(self.style.SUCCESS('VAPID_PUBLIC_KEY=' + public_key_one_line))
            self.stdout.write(self.style.SUCCESS('VAPID_PRIVATE_KEY=' + private_key_one_line))
            self.stdout.write(
                self.style.SUCCESS('VAPID_CLAIMS_EMAIL=mailto:admin@jewelrycrm.com')
            )
            
            self.stdout.write(
                self.style.WARNING('\nThe email above is used as contact info for VAPID.\n')
            )
            self.stdout.write(
                self.style.WARNING('You can change "admin@jewelrycrm.com" to your actual contact email.\n')
            )
            
        except ImportError as e:
            self.stdout.write(
                self.style.ERROR(
                    f'Error: py_vapid is not installed. Install it with: pip install py-vapid'
                )
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(
                    f'Error generating VAPID keys: {e}'
                )
            )

