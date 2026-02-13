# Generated migration for ClientVisit model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('stores', '0001_initial'),
        ('clients', '0036_add_customer_import_audit'),
    ]

    operations = [
        migrations.CreateModel(
            name='ClientVisit',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('visit_date', models.DateField(help_text='Date of this visit')),
                ('attended_by', models.CharField(blank=True, max_length=100, null=True)),
                ('notes', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('client', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='visits', to='clients.client')),
                ('store', models.ForeignKey(blank=True, help_text='Store where this visit occurred', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='client_visits', to='stores.Store')),
            ],
            options={
                'verbose_name': 'Client Visit',
                'verbose_name_plural': 'Client Visits',
                'ordering': ['-visit_date', '-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='clientvisit',
            index=models.Index(fields=['client'], name='clients_clientvisit_client_idx'),
        ),
        migrations.AddIndex(
            model_name='clientvisit',
            index=models.Index(fields=['visit_date'], name='clients_clientvisit_visit_date_idx'),
        ),
        migrations.AddIndex(
            model_name='clientvisit',
            index=models.Index(fields=['store'], name='clients_clientvisit_store_idx'),
        ),
    ]
