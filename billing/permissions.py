"""
Custom permissions for Water Billing System API.

Defines permission classes for different API endpoints and operations.
"""

from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Allow admins to edit, but others can only read.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_superuser or request.user.user_type == 'admin'


class IsAdmin(permissions.BasePermission):
    """
    Only allow admins.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            (request.user.is_superuser or request.user.user_type == 'admin')
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Allow users to edit their own objects or admins to edit any object.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser or request.user.user_type == 'admin':
            return True
        return obj.created_by == request.user
