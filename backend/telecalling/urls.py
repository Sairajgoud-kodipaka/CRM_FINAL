from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomerVisitViewSet, AssignmentViewSet, CallLogViewSet, FollowUpViewSet,
    CustomerProfileViewSet, NotificationViewSet, AnalyticsViewSet, TelecallerDashboardLegacyView,
    LeadTransferViewSet, SalesPersonListView, SimpleCallLogViewSet, GoogleSheetsCustomerNamesView
)
from .new_views import (
    LeadViewSet, CallRequestViewSet, FollowUpRequestViewSet,
    TelecallerDashboardView, PerformanceAnalyticsView,
    AuditLogViewSet
)
from .call_views import CallRequestViewSet as CallControlViewSet
from .status_views import google_sheets_status, test_connection, manual_sync

router = DefaultRouter()
router.register(r'customer-visits', CustomerVisitViewSet)
router.register(r'assignments', AssignmentViewSet)
router.register(r'call-logs', CallLogViewSet)
router.register(r'followups', FollowUpViewSet)
router.register(r'customer-profiles', CustomerProfileViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'analytics', AnalyticsViewSet)

# New API endpoints according to the directive
router.register(r'leads', LeadViewSet)
router.register(r'call-requests', CallControlViewSet)  # Use call control viewset
router.register(r'followup-requests', FollowUpRequestViewSet)
router.register(r'audit-logs', AuditLogViewSet)

# Lead transfer endpoints
router.register(r'lead-transfers', LeadTransferViewSet)

# Simple call logging endpoints
router.register(r'simple-call-logs', SimpleCallLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # Dashboard endpoint using existing models
    path('dashboard/me/', TelecallerDashboardLegacyView.as_view(), name='telecaller-dashboard-legacy'),
    
    # Google Sheets status and management endpoints
    path('google-sheets/status/', google_sheets_status, name='google-sheets-status'),
    path('google-sheets/test-connection/', test_connection, name='test-connection'),
    path('google-sheets/manual-sync/', manual_sync, name='manual-sync'),
    path('customer-names/', GoogleSheetsCustomerNamesView.as_view(), name='customer-names'),
    
    # Sales person list for transfers
    path('sales-persons/', SalesPersonListView.as_view(), name='sales-persons-list'),
    
    # New API endpoints (commented out until models are created)
    # path('dashboard/me/', TelecallerDashboardView.as_view(), name='telecaller-dashboard'),
    # path('performance/', PerformanceAnalyticsView.as_view(), name='performance-analytics'),
] 