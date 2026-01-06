"""
URL configuration for water_billing_system project.

API endpoints: /api/
Website: /
Admin: /admin/
Authentication: /api/auth/
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth import views as auth_views
from django.contrib.messages.views import SuccessMessageMixin
from django.contrib.auth.views import LogoutView

class CustomLogoutView(SuccessMessageMixin, LogoutView):
    success_message = "You have been successfully logged out."

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('billing.api_urls')),
    path('api/auth/login/', auth_views.LoginView.as_view(template_name='login.html'), name='login'),
    path('api-auth/', include('rest_framework.urls')),
    path('login/', auth_views.LoginView.as_view(template_name='login.html'), name='login'),
    path('logout/', CustomLogoutView.as_view(), name='logout'),
    path('', include('billing.urls')),  # Website routes
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

