"""
URL configuration for Jewelry CRM project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def health_check(request):
    return JsonResponse({"status": "healthy", "service": "jewellery-crm-backend"})

urlpatterns = [
    path('admin/', admin.site.urls),
    

    
    # API Routes
    path('api/', include('apps.users.urls')),  # Combined users and auth endpoints
    path('api/team-members/', include('apps.users.urls')),  # Direct team-members access
    path('api/tenants/', include('apps.tenants.urls')),
    path('api/clients/', include('apps.clients.urls')),  # Enable clients module
    path('api/', include('apps.stores.urls')),  # Fixed: removed duplicate 'stores/'
    path('api/telecalling/', include('telecalling.urls')),
    path('api/tasks/', include('apps.tasks.urls')),
    path('api/escalation/', include('apps.escalation.urls')),
    path('api/feedback/', include('apps.feedback.urls')),
    path('api/announcements/', include('apps.announcements.urls')),
    path('api/sales/', include('apps.sales.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/integrations/', include('apps.integrations.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/automation/', include('apps.automation.urls')),
    path('api/marketing/', include('apps.marketing.urls')),
    path('api/support/', include('apps.support.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/exhibition/', include('apps.exhibition.urls')),
    
    # Health Check
    path('api/health/', health_check, name='health_check'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
