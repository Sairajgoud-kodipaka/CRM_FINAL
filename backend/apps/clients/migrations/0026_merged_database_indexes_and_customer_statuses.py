# Generated manually for merging database indexes and customer status updates

from django.db import migrations, models


def update_customer_statuses(apps, schema_editor):
    """Update existing customer statuses to new values"""
    Client = apps.get_model('clients', 'Client')
    
    # Update existing statuses to new values
    # Map old statuses to new ones
    status_mapping = {
        'lead': 'general',
        'prospect': 'general', 
        'customer': 'vip',
        'inactive': 'general',
        'exhibition': 'general',
    }
    
    # Update all clients with old statuses
    for old_status, new_status in status_mapping.items():
        Client.objects.filter(status=old_status).update(status=new_status)


def reverse_update_customer_statuses(apps, schema_editor):
    """Reverse the status updates"""
    Client = apps.get_model('clients', 'Client')
    
    # Reverse mapping
    reverse_mapping = {
        'general': 'lead',
        'vip': 'customer',
        'vvip': 'customer',
    }
    
    # Update back to old statuses
    for new_status, old_status in reverse_mapping.items():
        Client.objects.filter(status=new_status).update(status=old_status)


class Migration(migrations.Migration):

    dependencies = [
        ('clients', '0025_add_exhibition_status'),
    ]

    operations = [
        # First update the existing customer statuses
        migrations.RunPython(update_customer_statuses, reverse_update_customer_statuses),
        
        # Then update the model field choices
        migrations.AlterField(
            model_name='client',
            name='status',
            field=models.CharField(
                choices=[
                    ('vvip', 'VVIP'),
                    ('vip', 'VIP'),
                    ('general', 'General')
                ],
                default='general',
                max_length=20
            ),
        ),
        
        # Client model indexes
        migrations.AddIndex(
            model_name='client',
            index=models.Index(fields=['tenant', 'is_deleted'], name='clients_cli_tenant_deleted_idx'),
        ),
        migrations.AddIndex(
            model_name='client',
            index=models.Index(fields=['email', 'tenant', 'is_deleted'], name='clients_cli_email_tenant_deleted_idx'),
        ),
        migrations.AddIndex(
            model_name='client',
            index=models.Index(fields=['phone', 'tenant', 'is_deleted'], name='clients_cli_phone_tenant_deleted_idx'),
        ),
        migrations.AddIndex(
            model_name='client',
            index=models.Index(fields=['status'], name='clients_cli_status_idx'),
        ),
        migrations.AddIndex(
            model_name='client',
            index=models.Index(fields=['assigned_to'], name='clients_cli_assigned_to_idx'),
        ),
        migrations.AddIndex(
            model_name='client',
            index=models.Index(fields=['created_at'], name='clients_cli_created_at_idx'),
        ),
        migrations.AddIndex(
            model_name='client',
            index=models.Index(fields=['next_follow_up'], name='clients_cli_next_follow_up_idx'),
        ),
        
        # Appointment model indexes
        migrations.AddIndex(
            model_name='appointment',
            index=models.Index(fields=['tenant', 'is_deleted'], name='clients_app_tenant_deleted_idx'),
        ),
        migrations.AddIndex(
            model_name='appointment',
            index=models.Index(fields=['client', 'tenant'], name='clients_app_client_tenant_idx'),
        ),
        migrations.AddIndex(
            model_name='appointment',
            index=models.Index(fields=['date'], name='clients_app_date_idx'),
        ),
        migrations.AddIndex(
            model_name='appointment',
            index=models.Index(fields=['date', 'status'], name='clients_app_date_status_idx'),
        ),
        migrations.AddIndex(
            model_name='appointment',
            index=models.Index(fields=['assigned_to'], name='clients_app_assigned_to_idx'),
        ),
        migrations.AddIndex(
            model_name='appointment',
            index=models.Index(fields=['created_at'], name='clients_app_created_at_idx'),
        ),
        
        # FollowUp model indexes
        migrations.AddIndex(
            model_name='followup',
            index=models.Index(fields=['tenant', 'is_deleted'], name='clients_fol_tenant_deleted_idx'),
        ),
        migrations.AddIndex(
            model_name='followup',
            index=models.Index(fields=['client', 'tenant'], name='clients_fol_client_tenant_idx'),
        ),
        migrations.AddIndex(
            model_name='followup',
            index=models.Index(fields=['due_date'], name='clients_fol_due_date_idx'),
        ),
        migrations.AddIndex(
            model_name='followup',
            index=models.Index(fields=['due_date', 'status'], name='clients_fol_due_date_status_idx'),
        ),
        migrations.AddIndex(
            model_name='followup',
            index=models.Index(fields=['status'], name='clients_fol_status_idx'),
        ),
        migrations.AddIndex(
            model_name='followup',
            index=models.Index(fields=['assigned_to'], name='clients_fol_assigned_to_idx'),
        ),
        migrations.AddIndex(
            model_name='followup',
            index=models.Index(fields=['created_at'], name='clients_fol_created_at_idx'),
        ),
        
        # ClientInteraction model indexes
        migrations.AddIndex(
            model_name='clientinteraction',
            index=models.Index(fields=['client'], name='clients_cli_inter_client_idx'),
        ),
        migrations.AddIndex(
            model_name='clientinteraction',
            index=models.Index(fields=['interaction_type'], name='clients_cli_inter_type_idx'),
        ),
        migrations.AddIndex(
            model_name='clientinteraction',
            index=models.Index(fields=['created_at'], name='clients_cli_inter_created_at_idx'),
        ),
        migrations.AddIndex(
            model_name='clientinteraction',
            index=models.Index(fields=['follow_up_date'], name='clients_cli_inter_follow_up_idx'),
        ),
        migrations.AddIndex(
            model_name='clientinteraction',
            index=models.Index(fields=['user'], name='clients_cli_inter_user_idx'),
        ),
        
        # CustomerTag model indexes
        migrations.AddIndex(
            model_name='customertag',
            index=models.Index(fields=['is_active'], name='clients_cust_tag_active_idx'),
        ),
        migrations.AddIndex(
            model_name='customertag',
            index=models.Index(fields=['category'], name='clients_cust_tag_category_idx'),
        ),
        migrations.AddIndex(
            model_name='customertag',
            index=models.Index(fields=['category', 'is_active'], name='clients_cust_tag_cat_active_idx'),
        ),
    ]
