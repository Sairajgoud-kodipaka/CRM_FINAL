from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Client, ClientInteraction, Appointment, FollowUp, Task, 
    Announcement, CustomerTag, AuditLog, Purchase, CustomerInterest
)


class CustomerStatusFilter(admin.SimpleListFilter):
    """Filter to show customers by status"""
    title = 'Customer Status'
    parameter_name = 'customer_status'
    
    def lookups(self, request, model_admin):
        return (
            ('vvip', 'VVIP Customers'),
            ('vip', 'VIP Customers'),
            ('general', 'General Customers'),
        )
    
    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(status=self.value())
        return queryset

class CustomerInterestInline(admin.TabularInline):
    model = CustomerInterest
    extra = 1
    fields = ('category', 'product', 'revenue', 'notes')
    autocomplete_fields = ['category', 'product']
    
    def get_formset(self, request, obj=None, **kwargs):
        """Filter categories and products by tenant"""
        formset = super().get_formset(request, obj, **kwargs)
        if obj and obj.tenant:
            # Filter categories and products by tenant
            formset.form.base_fields['category'].queryset = formset.form.base_fields['category'].queryset.filter(tenant=obj.tenant)
            formset.form.base_fields['product'].queryset = formset.form.base_fields['product'].queryset.filter(tenant=obj.tenant)
        elif request.user.tenant:
            # Fallback to user's tenant if client doesn't have one
            formset.form.base_fields['category'].queryset = formset.form.base_fields['category'].queryset.filter(tenant=request.user.tenant)
            formset.form.base_fields['product'].queryset = formset.form.base_fields['product'].queryset.filter(tenant=request.user.tenant)
        return formset
    
    def save_formset(self, request, form, formset, change):
        """Override to automatically set tenant for new customer interests"""
        instances = formset.save(commit=False)
        for instance in instances:
            if not instance.pk:  # New instance
                # Set tenant from the parent client
                if hasattr(form.instance, 'tenant') and form.instance.tenant:
                    instance.tenant = form.instance.tenant
                else:
                    # Fallback to user's tenant
                    instance.tenant = request.user.tenant
            else:
                # Existing instance - ensure tenant is set
                if not instance.tenant:
                    if hasattr(form.instance, 'tenant') and form.instance.tenant:
                        instance.tenant = form.instance.tenant
                    else:
                        instance.tenant = request.user.tenant
        
        # Save all instances
        formset.save()
        
        # Ensure all instances have tenant set after save
        for instance in instances:
            if not instance.tenant:
                if hasattr(form.instance, 'tenant') and form.instance.tenant:
                    instance.tenant = form.instance.tenant
                else:
                    instance.tenant = request.user.tenant
                instance.save()

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = [
        'full_name', 'email', 'phone', 'customer_status_display', 'lead_source', 'catchment_area', 
        'assigned_to', 'store', 'tenant', 'created_at', 'customer_interests_summary'
    ]
    list_filter = [
        CustomerStatusFilter,
        'lead_source', 'customer_type', 'saving_scheme', 'store', 'tenant', 
        'created_at', 'is_deleted'
    ]
    search_fields = ['first_name', 'last_name', 'email', 'phone']
    readonly_fields = ['created_at', 'updated_at', 'total_spent', 'total_purchases', 'customer_interests_display']
    inlines = [CustomerInterestInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('first_name', 'last_name', 'email', 'phone', 'customer_type')
        }),
        ('Status & Assignment', {
            'fields': ('status', 'assigned_to', 'store', 'tenant')
        }),
        ('Address', {
            'fields': ('address', 'city', 'state', 'country', 'postal_code', 'catchment_area'),
            'classes': ('collapse',)
        }),

        ('Lead Information', {
            'fields': ('lead_source', 'reason_for_visit', 'next_follow_up', 'next_follow_up_time'),
            'classes': ('collapse',)
        }),
        ('Demographics', {
            'fields': ('date_of_birth', 'anniversary_date', 'community', 'mother_tongue', 'age_of_end_user', 'saving_scheme'),
            'classes': ('collapse',)
        }),
        ('Notes', {
            'fields': ('notes', 'summary_notes'),
            'classes': ('collapse',)
        }),

        ('System', {
            'fields': ('is_deleted', 'deleted_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = [
        'mark_as_vvip', 'mark_as_vip', 'mark_as_general',
        'update_status_automatically'
    ]
    
    def mark_as_vvip(self, request, queryset):
        updated = queryset.update(status='vvip')
        self.message_user(request, f'{updated} customers marked as VVIP')
    mark_as_vvip.short_description = "Mark selected customers as VVIP"
    
    def mark_as_vip(self, request, queryset):
        updated = queryset.update(status='vip')
        self.message_user(request, f'{updated} customers marked as VIP')
    mark_as_vip.short_description = "Mark selected customers as VIP"
    
    def mark_as_general(self, request, queryset):
        updated = queryset.update(status='general')
        self.message_user(request, f'{updated} customers marked as General')
    mark_as_general.short_description = "Mark selected customers as General"
    
    def update_status_automatically(self, request, queryset):
        updated_count = 0
        for client in queryset:
            old_status = client.status
            client.update_status_based_on_behavior()
            if client.status != old_status:
                updated_count += 1
        
        self.message_user(
            request, 
            f'Automatically updated status for {updated_count} customers based on their behavior'
        )
    update_status_automatically.short_description = "Update status automatically based on behavior"
    

    
    def save_model(self, request, obj, form, change):
        """Override to ensure tenant is set and propagate to interests"""
        if not change:  # New instance
            if not obj.tenant:
                obj.tenant = request.user.tenant
        
        super().save_model(request, obj, form, change)
        
        # Ensure all related interests have the tenant set
        if obj.tenant:
            for interest in obj.interests.all():
                if not interest.tenant:
                    interest.tenant = obj.tenant
                    interest.save()
    
    def customer_interests_display(self, obj):
        """Display customer interests in a readable format"""
        print(f"=== ADMIN: customer_interests_display called for client {obj.id} ===")
        interests = obj.interests.all()
        print(f"Found {interests.count()} interests for client {obj.id}")
        print(f"Interests: {list(interests.values())}")
        
        if not interests:
            return "No product interests specified"
        
        interest_list = []
        for interest in interests:
            category_name = interest.category.name if interest.category else 'No Category'
            product_name = interest.product.name if interest.product else 'No Product'
            interest_list.append(
                f"• {category_name} - {product_name} "
                f"(₹{interest.revenue})"
            )
        
        result = format_html('<br>'.join(interest_list))
        print(f"Returning: {result}")
        return result
    customer_interests_display.short_description = "Product Interests"
    
    def customer_interests_summary(self, obj):
        """Display a summary of customer interests for list view"""
        print(f"=== ADMIN: customer_interests_summary called for client {obj.id} ===")
        interests = obj.interests.all()
        print(f"Found {interests.count()} interests for client {obj.id}")
        
        if not interests:
            return "-"
        
        count = interests.count()
        total_value = sum(interest.revenue for interest in interests)
        result = f"{count} interest(s) - ₹{total_value:,.0f}"
        print(f"Returning summary: {result}")
        return result
    customer_interests_summary.short_description = "Interests"

    def customer_status_display(self, obj):
        """Display customer status with color coding"""
        status_colors = {
            'vvip': 'purple',
            'vip': 'gold',
            'general': 'blue'
        }
        color = status_colors.get(obj.status, 'gray')
        return format_html('<span style="color: {}; font-weight: bold;">{}</span>', color, obj.get_status_display())
    
    customer_status_display.short_description = "Customer Status"
    customer_status_display.allow_tags = True

@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
    list_display = ['client', 'product_name', 'amount', 'purchase_date', 'created_at']
    list_filter = ['purchase_date', 'created_at']
    search_fields = ['client__first_name', 'client__last_name', 'product_name']
    date_hierarchy = 'purchase_date'

@admin.register(CustomerTag)
class CustomerTagAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'is_active', 'created_at']
    list_filter = ['category', 'is_active']
    search_fields = ['name', 'description']

@admin.register(ClientInteraction)
class ClientInteractionAdmin(admin.ModelAdmin):
    list_display = ['client', 'interaction_type', 'created_at']
    list_filter = ['interaction_type', 'created_at']
    search_fields = ['client__first_name', 'client__last_name']

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['client', 'date', 'time', 'status', 'created_at']
    list_filter = ['status', 'date', 'created_at']
    search_fields = ['client__first_name', 'client__last_name', 'purpose']
    date_hierarchy = 'date'

@admin.register(FollowUp)
class FollowUpAdmin(admin.ModelAdmin):
    list_display = ['client', 'title', 'due_date', 'status', 'created_at']
    list_filter = ['status', 'due_date', 'created_at']
    search_fields = ['client__first_name', 'client__last_name', 'title']
    date_hierarchy = 'due_date'

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'client', 'status', 'due_date', 'assigned_to', 'created_at']
    list_filter = ['status', 'due_date', 'created_at']
    search_fields = ['title', 'client__first_name', 'client__last_name']

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ['title', 'tenant', 'created_by', 'created_at']
    list_filter = ['created_at']
    search_fields = ['title', 'message']

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['client', 'action', 'user', 'timestamp']
    list_filter = ['action', 'timestamp']
    search_fields = ['client__first_name', 'client__last_name']
    readonly_fields = ['timestamp']


@admin.register(CustomerInterest)
class CustomerInterestAdmin(admin.ModelAdmin):
    list_display = ['client', 'category', 'product', 'revenue', 'created_at']
    list_filter = ['category', 'created_at']
    search_fields = ['client__first_name', 'client__last_name', 'product__name', 'category__name']
    readonly_fields = ['created_at', 'updated_at']
    autocomplete_fields = ['client', 'category', 'product']
    
    fieldsets = (
        ('Customer Information', {
            'fields': ('client', 'tenant')
        }),
        ('Product Interest', {
            'fields': ('category', 'product', 'revenue', 'notes')
        }),
        ('System', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Filter by tenant"""
        qs = super().get_queryset(request)
        if request.user.tenant:
            qs = qs.filter(tenant=request.user.tenant)
        return qs
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Filter foreign key fields by tenant"""
        if db_field.name in ['category', 'product'] and request.user.tenant:
            kwargs['queryset'] = db_field.related_model.objects.filter(tenant=request.user.tenant)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
    def save_model(self, request, obj, form, change):
        """Override to automatically set tenant for new customer interests"""
        if not change:  # New instance
            if not obj.tenant:
                # Set tenant from the client if available
                if obj.client and hasattr(obj.client, 'tenant') and obj.client.tenant:
                    obj.tenant = obj.client.tenant
                else:
                    # Fallback to user's tenant
                    obj.tenant = request.user.tenant
        super().save_model(request, obj, form, change)
