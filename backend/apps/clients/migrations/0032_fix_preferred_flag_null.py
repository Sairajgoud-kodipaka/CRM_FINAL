# Generated manually to fix NULL preferred_flag values

from django.db import migrations


def fix_null_preferred_flags(apps, schema_editor):
    """Set all NULL preferred_flag values to False"""
    Client = apps.get_model('clients', 'Client')
    Client.objects.filter(preferred_flag__isnull=True).update(preferred_flag=False)


def reverse_fix(apps, schema_editor):
    """Reverse migration - no action needed"""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('clients', '0031_add_import_transaction_fields'),
    ]

    operations = [
        migrations.RunPython(fix_null_preferred_flags, reverse_fix),
    ]

