# Generated manually for NOTIFICATION_TEMPLATES implementation

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0003_notification_metadata_pushsubscription'),
    ]

    operations = [
        migrations.AlterField(
            model_name='notification',
            name='type',
            field=models.CharField(
                choices=[
                    ('appointment_reminder', 'Appointment Reminder'),
                    ('appointment_updated', 'Appointment Updated'),
                    ('appointment_cancelled', 'Appointment Cancelled'),
                    ('appointment_rescheduled', 'Appointment Rescheduled'),
                    ('appointment_confirmed', 'Appointment Confirmed'),
                    ('appointment_completed', 'Appointment Completed'),
                    ('order_status', 'Order Status'),
                    ('inventory_alert', 'Inventory Alert'),
                    ('new_customer', 'New Customer'),
                    ('customer_updated', 'Customer Updated'),
                    ('customer_deleted', 'Customer Deleted'),
                    ('deal_update', 'Deal Update'),
                    ('payment_received', 'Payment Received'),
                    ('task_reminder', 'Task Reminder'),
                    ('announcement', 'Announcement'),
                    ('escalation', 'Escalation'),
                    ('marketing_campaign', 'Marketing Campaign'),
                    ('stock_transfer_request', 'Stock Transfer Request'),
                    ('stock_transfer_approved', 'Stock Transfer Approved'),
                    ('stock_transfer_completed', 'Stock Transfer Completed'),
                    ('stock_transfer_cancelled', 'Stock Transfer Cancelled'),
                    ('stock_transfer_rejected', 'Stock Transfer Rejected'),
                ],
                max_length=50,
            ),
        ),
    ]
