from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, NotificationSettingsViewSet

router = DefaultRouter()
# Register settings FIRST so it doesn't get matched as a detail route
router.register(r'settings', NotificationSettingsViewSet, basename='notification-settings')
# Register notifications viewset (this will match detail routes like /api/notifications/123/)
router.register(r'', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
] 