from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExhibitionLeadViewSet

router = DefaultRouter()
router.register(r'exhibition-leads', ExhibitionLeadViewSet, basename='exhibition-lead')

urlpatterns = [
    path('', include(router.urls)),
]
