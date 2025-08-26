from django.db import migrations

def populate_created_by(apps, schema_editor):
    """
    Populate the created_by field for existing customers.
    Assign them to the first available user or create a default user.
    """
    Client = apps.get_model('clients', 'Client')
    User = apps.get_model('users', 'User')
    
    # Get the first available user
    try:
        first_user = User.objects.first()
        if first_user:
            # Update all customers without created_by
            updated_count = Client.objects.filter(created_by__isnull=True).update(created_by=first_user)
            print(f"Updated {updated_count} customers with created_by: {first_user.username}")
        else:
            print("No users found in database")
    except Exception as e:
        print(f"Error updating customers: {e}")

def reverse_populate_created_by(apps, schema_editor):
    """
    Reverse the migration by setting created_by to None for all customers.
    """
    Client = apps.get_model('clients', 'Client')
    Client.objects.all().update(created_by=None)

class Migration(migrations.Migration):
    dependencies = [
        ('clients', '0014_client_store'),
    ]

    operations = [
        migrations.RunPython(populate_created_by, reverse_populate_created_by),
    ]
