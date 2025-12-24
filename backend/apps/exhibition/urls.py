from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExhibitionLeadViewSet, ExhibitionViewSet, ExhibitionTagViewSet

router = DefaultRouter()
router.register(r'exhibition-leads', ExhibitionLeadViewSet, basename='exhibition-lead')
router.register(r'exhibitions', ExhibitionViewSet, basename='exhibition')
router.register(r'exhibition-tags', ExhibitionTagViewSet, basename='exhibition-tag')

urlpatterns = [
    path('', include(router.urls)),
]
