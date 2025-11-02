# Generated manually to fix email unique constraint issue

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('clients', '0029_alter_client_email'),
    ]

    operations = [
        # First, convert any empty string emails to NULL for consistency
        migrations.RunSQL(
            sql="""
                UPDATE clients_client SET email = NULL WHERE email = '' OR TRIM(email) = '';
            """,
            reverse_sql="""
                -- No reverse needed as we're just normalizing data
            """,
        ),
        # Remove the unique_together constraint from Meta
        migrations.AlterUniqueTogether(
            name='client',
            unique_together=set(),
        ),
        # Create a partial unique index that excludes NULL emails
        migrations.RunSQL(
            sql="""
                CREATE UNIQUE INDEX IF NOT EXISTS clients_client_unique_email_tenant 
                ON clients_client (tenant_id, email) 
                WHERE email IS NOT NULL;
            """,
            reverse_sql="""
                DROP INDEX IF EXISTS clients_client_unique_email_tenant;
            """,
        ),
    ]

