"""
Custom exception handler for DRF API responses.

Provides consistent error response formatting across all API endpoints.
"""

from rest_framework.views import exception_handler
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns consistent error responses.

    Args:
        exc: The exception instance.
        context: The context dict passed to the exception handler.

    Returns:
        A tuple of (response, status_code).
    """
    response = exception_handler(exc, context)

    if response is not None:
        # Add custom fields to error response
        if 'detail' in response.data:
            response.data = {
                'success': False,
                'error': str(response.data['detail']),
                'status_code': response.status_code,
            }
        else:
            response.data = {
                'success': False,
                'errors': response.data,
                'status_code': response.status_code,
            }

    return response
