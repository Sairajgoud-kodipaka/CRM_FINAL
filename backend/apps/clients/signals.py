from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Client, CustomerTag
from apps.sales.models import Sale, SalesPipeline
from datetime import date

@receiver(post_save, sender=Sale)
def update_customer_status_on_sale(sender, instance, created, **kwargs):
    """Automatically update customer status when a sale is created or updated."""
    if instance.client:
        # Update customer status based on their behavior
        status_message = instance.client.update_status_based_on_behavior()
        print(f"Customer {instance.client.full_name}: {status_message}")

@receiver(post_save, sender=SalesPipeline)
def update_customer_status_on_pipeline_change(sender, instance, created, **kwargs):
    """Automatically update customer status when pipeline stage changes."""
    if instance.client:
        # Update customer status based on their behavior (including pipeline activity)
        status_message = instance.client.update_status_based_on_behavior()
        print(f"Customer {instance.client.full_name} pipeline stage changed to {instance.stage}: {status_message}")
        
        # If pipeline is closed won, automatically create a sale
        if instance.stage == 'closed_won' and not created:  # Only for updates, not new creation
            try:
                from apps.sales.models import Sale
                from django.utils import timezone
                
                # Check if sale already exists for this pipeline (by checking recent sales)
                recent_sales = Sale.objects.filter(
                    client=instance.client,
                    total_amount=instance.expected_value,
                    created_at__gte=timezone.now() - timezone.timedelta(minutes=5)  # Within last 5 minutes
                )
                
                if not recent_sales.exists():
                    # Create a new sale
                    sale = Sale.objects.create(
                        client=instance.client,
                        sales_representative=instance.sales_representative,
                        order_number=f"PIPELINE-{instance.id}-{int(timezone.now().timestamp())}",
                        subtotal=instance.expected_value,
                        tax_amount=0,
                        discount_amount=0,
                        total_amount=instance.expected_value,
                        paid_amount=instance.expected_value,
                        status='confirmed',
                        payment_status='paid',
                        order_date=timezone.now(),
                        notes=f"Auto-generated from pipeline: {instance.title}",
                        tenant=instance.tenant
                    )
                    print(f"✅ Automatically created sale for {instance.client.full_name}: ₹{instance.expected_value}")
                    
                    # Update customer status again after sale creation
                    status_message = instance.client.update_status_based_on_behavior()
                    print(f"Customer status updated after sale: {status_message}")
                else:
                    print(f"Sale already exists for pipeline {instance.id}")
                    
            except Exception as e:
                print(f"❌ Error creating sale for pipeline {instance.id}: {e}")

@receiver(post_save, sender=Client)
def auto_apply_tags(sender, instance, created, **kwargs):
    tags_to_add = set()
    print(f"[DEBUG] Auto-tagging for client: {instance.id} - {instance.full_name}")

    # 1. Purchase Intent / Visit Reason (case-insensitive, trimmed)
    if instance.reason_for_visit:
        mapping = {
            'wedding': 'wedding-buyer',
            'gifting': 'gifting',
            'self-purchase': 'self-purchase',
            'repair': 'repair-customer',
            'browse': 'browsing-prospect',
        }
        reason = instance.reason_for_visit.strip().lower()
        slug = mapping.get(reason)
        print(f"[DEBUG] Reason for visit: '{reason}' -> Tag: {slug}")
        if slug:
            tags_to_add.add(slug)

    # 2. Product Interest (handle array of objects with category)
    if hasattr(instance, 'interests') and instance.interests.exists():
        for interest in instance.interests.all():
            category = None
            if hasattr(interest, 'category') and interest.category:
                category = interest.category.name.strip().lower()
            print(f"[DEBUG] Product interest: '{category}'")
            if category == 'diamond':
                tags_to_add.add('diamond-interested')
            elif category == 'gold':
                tags_to_add.add('gold-interested')
            elif category == 'polki':
                tags_to_add.add('polki-interested')
        if instance.interests.count() > 1:
            tags_to_add.add('mixed-buyer')

    # 3. Revenue-Based Segmentation (assume total_spend is a property or field)
    if hasattr(instance, 'total_spend'):
        print(f"[DEBUG] Total spend: {getattr(instance, 'total_spend', None)}")
        if instance.total_spend and instance.total_spend > 100000:
            tags_to_add.add('high-value')
        elif instance.total_spend and instance.total_spend > 30000:
            tags_to_add.add('mid-value')

    # 4. Demographic + Age
    if instance.date_of_birth:
        today = date.today()
        age = today.year - instance.date_of_birth.year - ((today.month, today.day) < (instance.date_of_birth.month, instance.date_of_birth.day))
        print(f"[DEBUG] Calculated age: {age}")
        if 18 <= age <= 25:
            tags_to_add.add('young-adult')
        elif 26 <= age <= 35:
            tags_to_add.add('millennial-shopper')
        elif 36 <= age <= 45:
            tags_to_add.add('middle-age-shopper')
        elif age > 46:
            tags_to_add.add('senior-shopper')

    # 5. Lead Source Tags (case-insensitive, trimmed)
    if instance.lead_source:
        mapping = {
            'instagram': 'social-lead',
            'facebook': 'facebook-lead',
            'google': 'google-lead',
            'referral': 'referral',
            'walk-in': 'walk-in',
            'other': 'other-source',
        }
        source = instance.lead_source.strip().lower()
        slug = mapping.get(source)
        print(f"[DEBUG] Lead source: '{source}' -> Tag: {slug}")
        if slug:
            tags_to_add.add(slug)

    # 6. CRM-Status Tags (case-insensitive)
    if hasattr(instance, 'status'):
        status_map = {
            'customer': 'converted-customer',
            'prospect': 'interested-lead',
            'inactive': 'not-interested',
        }
        status = str(instance.status).strip().lower()
        slug = status_map.get(status)
        print(f"[DEBUG] CRM status: '{status}' -> Tag: {slug}")
        if slug:
            tags_to_add.add(slug)
    if instance.next_follow_up:
        print(f"[DEBUG] Next follow up present, adding 'needs-follow-up'")
        tags_to_add.add('needs-follow-up')

    # 7. Community / Relationship Tags (case-insensitive, trimmed)
    if instance.community:
        mapping = {
            'hindu': 'hindu',
            'muslim': 'muslim',
            'jain': 'jain',
            'parsi': 'parsi',
            'buddhist': 'buddhist',
            'cross community': 'cross-community',
        }
        community = instance.community.strip().lower()
        slug = mapping.get(community)
        print(f"[DEBUG] Community: '{community}' -> Tag: {slug}")
        if slug:
            tags_to_add.add(slug)

    # 8. Event-Driven Tags (Birthday, Anniversary)
    today = date.today()
    if instance.date_of_birth and instance.date_of_birth.month == today.month and abs(instance.date_of_birth.day - today.day) <= 7:
        print(f"[DEBUG] Birthday this week, adding 'birthday-week'")
        tags_to_add.add('birthday-week')
    if instance.anniversary_date and instance.anniversary_date.month == today.month and abs(instance.anniversary_date.day - today.day) <= 7:
        print(f"[DEBUG] Anniversary this week, adding 'anniversary-week'")
        tags_to_add.add('anniversary-week')

    print(f"[DEBUG] Tags to add for client {instance.id}: {tags_to_add}")
    tag_objs = CustomerTag.objects.filter(slug__in=tags_to_add)
    print(f"[DEBUG] Tag objects found: {[t.slug for t in tag_objs]}")
    if tag_objs.exists():
        instance.tags.add(*tag_objs)
        print(f"[DEBUG] Tags assigned to client {instance.id}")
    else:
        print(f"[DEBUG] No tags assigned to client {instance.id}") 