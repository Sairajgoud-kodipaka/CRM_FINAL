from django.contrib import admin
from .models import Exhibition, ExhibitionTag


@admin.register(ExhibitionTag)
class ExhibitionTagAdmin(admin.ModelAdmin):
    list_display = ['name', 'tenant', 'color', 'is_active', 'created_at']
    list_filter = ['is_active', 'tenant']
    search_fields = ['name']
    ordering = ['name']


@admin.register(Exhibition)
class ExhibitionAdmin(admin.ModelAdmin):
    list_display = ['name', 'date', 'tag', 'tenant', 'is_active', 'created_at']
    list_filter = ['is_active', 'tag', 'tenant', 'date']
    search_fields = ['name', 'location', 'description']
    ordering = ['-date', '-created_at']
    date_hierarchy = 'date'
