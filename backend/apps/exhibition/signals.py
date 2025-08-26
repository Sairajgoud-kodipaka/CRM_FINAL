from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.utils import timezone
from apps.clients.models import Client, AuditLog


@receiver(pre_save, sender=Client)
def set_exhibition_status(sender, instance, **kwargs):
    """
    Automatically set status to 'exhibition' when lead_source is 'exhibition'
    """
    if instance.lead_source == 'exhibition' and not instance.status:
        instance.status = 'exhibition'


@receiver(post_save, sender=Client)
def log_exhibition_status_change(sender, instance, created, **kwargs):
    """
    Log status changes for exhibition leads
    """
    if created and instance.lead_source == 'exhibition':
        # Log the creation of an exhibition lead
        AuditLog.objects.create(
            client=instance,
            action='create',
            user=getattr(instance, 'created_by', None),
            after={
                'status': instance.status,
                'lead_source': instance.lead_source,
                'created_at': instance.created_at.isoformat()
            },
            timestamp=timezone.now()
        )


@receiver(post_save, sender=Client)
def log_exhibition_promotion(sender, instance, **kwargs):
    """
    Log when an exhibition lead is promoted to main customer system
    """
    if hasattr(instance, '_state') and not instance._state.adding:
        # This is an update, not a creation
        try:
            old_instance = Client.objects.get(pk=instance.pk)
            if (old_instance.status == 'exhibition' and 
                instance.status == 'lead' and 
                instance.lead_source == 'exhibition'):
                
                # Log the promotion
                AuditLog.objects.create(
                    client=instance,
                    action='update',
                    user=getattr(instance, 'updated_by', None),
                    before={'status': 'exhibition'},
                    after={'status': 'lead'},
                    timestamp=timezone.now()
                )
        except Client.DoesNotExist:
            pass
