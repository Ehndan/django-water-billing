"""
API URL Configuration for Water Billing System.

All API endpoints are under /api/ prefix using DRF routers.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views_api import (
    AuthViewSet, ConsumerViewSet, MeterReadingViewSet,
    BillViewSet, NotificationViewSet, DashboardAPIView
)

# Create router and register viewsets
router = DefaultRouter()
router.register(r'consumers', ConsumerViewSet, basename='consumer')
router.register(r'meter-readings', MeterReadingViewSet, basename='meter-reading')
router.register(r'bills', BillViewSet, basename='bill')
router.register(r'notifications', NotificationViewSet, basename='notification')

app_name = 'api'

urlpatterns = [
    # Router URLs
    path('', include(router.urls)),
    
    # Authentication endpoints
    path('auth/login/', AuthViewSet.as_view(), {'action_type': 'login'}, name='login'),
    path('auth/logout/', AuthViewSet.as_view(), {'action_type': 'logout'}, name='logout'),
    path('auth/register/', AuthViewSet.as_view(), {'action_type': 'register'}, name='register'),
    
    # Dashboard
    path('dashboard/', DashboardAPIView.as_view(), name='dashboard'),
]
