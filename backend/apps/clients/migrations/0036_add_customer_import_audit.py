# Generated manually for CustomerImportAudit model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0001_initial"),
        ("clients", "0035_add_interest_purchase_tracking"),
    ]

    operations = [
        migrations.CreateModel(
            name="CustomerImportAudit",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("action", models.CharField(choices=[("validated", "Validated"), ("imported", "Imported")], max_length=20)),
                ("total_rows", models.PositiveIntegerField(default=0)),
                ("valid_count", models.PositiveIntegerField(default=0)),
                ("invalid_count", models.PositiveIntegerField(default=0)),
                ("needs_attention_count", models.PositiveIntegerField(default=0, help_text="Rows with e.g. salesperson not found")),
                ("imported_count", models.PositiveIntegerField(blank=True, default=0, null=True)),
                ("failed_count", models.PositiveIntegerField(blank=True, default=0, null=True)),
                ("details", models.JSONField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="customer_import_audits", to="users.user")),
            ],
            options={
                "ordering": ["-created_at"],
                "verbose_name": "Customer import audit",
                "verbose_name_plural": "Customer import audits",
            },
        ),
    ]
