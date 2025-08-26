# Generated manually for exhibition lead management system

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clients', '0024_client_created_by_alter_customerinterest_category_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='client',
            name='status',
            field=models.CharField(
                choices=[
                    ('lead', 'Lead'),
                    ('prospect', 'Prospect'),
                    ('customer', 'Customer'),
                    ('inactive', 'Inactive'),
                    ('exhibition', 'Exhibition')
                ],
                default='lead',
                max_length=20
            ),
        ),
        migrations.AlterField(
            model_name='client',
            name='lead_source',
            field=models.CharField(
                blank=True,
                choices=[
                    ('website', 'Website'),
                    ('referral', 'Referral'),
                    ('social_media', 'Social Media'),
                    ('advertising', 'Advertising'),
                    ('cold_call', 'Cold Call'),
                    ('exhibition', 'Exhibition'),
                    ('other', 'Other')
                ],
                max_length=50,
                null=True
            ),
        ),
    ]
