"""
API Views for Water Billing System using Django REST Framework.

Handles all API endpoints for User, Consumer, MeterReading, Bill, and Notification models.
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Q
from django.db.models.functions import TruncMonth
from datetime import datetime, timedelta
from twilio.rest import Client
from django.conf import settings

from .models import User, Consumer, MeterReading, Bill, Notification
from .serializers import (
    UserSerializer, LoginSerializer, ConsumerSerializer,
    MeterReadingSerializer, BillSerializer, NotificationSerializer,
    DashboardStatsSerializer
)
from .permissions import IsAdmin, IsAdminOrReadOnly


class AuthViewSet(APIView):
    """Handle user authentication endpoints."""
    permission_classes = [permissions.AllowAny]

    def post(self, request, action_type):
        """Handle login/logout/register."""
        if action_type == 'login':
            return self.login(request)
        elif action_type == 'logout':
            return self.logout(request)
        elif action_type == 'register':
            return self.register(request)
        return Response(
            {'error': 'Invalid action'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    def login(self, request):
        """Login user and return token."""
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        login(request, user)
        return Response({
            'success': True,
            'message': 'Logged in successfully',
            'user': UserSerializer(user).data
        })

    def logout(self, request):
        """Logout user."""
        logout(request)
        return Response({
            'success': True,
            'message': 'Logged out successfully'
        })

    def register(self, request):
        """Register a new user."""
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'success': True,
            'message': 'User registered successfully',
            'user': serializer.data
        }, status=status.HTTP_201_CREATED)


class ConsumerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Consumer management.

    Provides CRUD operations for water consumers.
    """
    queryset = Consumer.objects.all().order_by('last_name', 'first_name')
    serializer_class = ConsumerSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
    search_fields = ['first_name', 'last_name', 'meter_number', 'contact_number']
    ordering_fields = ['created_at', 'last_name', 'first_name']

    @action(detail=True, methods=['get'])
    def bills(self, request, pk=None):
        """Get all bills for a consumer."""
        consumer = self.get_object()
        bills = consumer.bills.all().order_by('-billing_period')
        serializer = BillSerializer(bills, many=True)
        return Response({
            'consumer': ConsumerSerializer(consumer).data,
            'bills': serializer.data
        })

    @action(detail=True, methods=['get'])
    def unpaid_bills(self, request, pk=None):
        """Get unpaid bills for a consumer."""
        consumer = self.get_object()
        bills = consumer.bills.filter(status='unpaid').order_by('due_date')
        serializer = BillSerializer(bills, many=True)
        return Response({
            'consumer': ConsumerSerializer(consumer).data,
            'unpaid_bills': serializer.data,
            'total_unpaid': sum(float(bill.amount) for bill in bills)
        })

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active consumers."""
        consumers = self.queryset.filter(account_status='active')
        serializer = self.get_serializer(consumers, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def disconnected(self, request):
        """Get all disconnected consumers."""
        consumers = self.queryset.filter(account_status='disconnected')
        serializer = self.get_serializer(consumers, many=True)
        return Response(serializer.data)


class MeterReadingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for MeterReading management.

    Provides CRUD operations for meter readings.
    """
    queryset = MeterReading.objects.all().order_by('-reading_date')
    serializer_class = MeterReadingSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
    search_fields = ['consumer__first_name', 'consumer__last_name']
    ordering_fields = ['reading_date', 'consumer']

    def perform_create(self, serializer):
        """Set created_by user on creation."""
        serializer.save(
            created_by=self.request.user,
            last_modified_by=self.request.user
        )

    def perform_update(self, serializer):
        """Set last_modified_by user on update."""
        serializer.save(last_modified_by=self.request.user)

    @action(detail=False, methods=['get'])
    def by_consumer(self, request):
        """Get meter readings for a specific consumer."""
        consumer_id = request.query_params.get('consumer_id')
        if not consumer_id:
            return Response(
                {'error': 'consumer_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        readings = self.queryset.filter(consumer_id=consumer_id)
        serializer = self.get_serializer(readings, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get latest meter reading for each consumer."""
        consumer_id = request.query_params.get('consumer_id')
        if not consumer_id:
            return Response(
                {'error': 'consumer_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reading = self.queryset.filter(consumer_id=consumer_id).first()
        if not reading:
            return Response(
                {'error': 'No readings found for this consumer'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = self.get_serializer(reading)
        return Response(serializer.data)


class BillViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Bill management.

    Provides CRUD operations for bills and billing operations.
    """
    queryset = Bill.objects.all().order_by('-billing_period')
    serializer_class = BillSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
    search_fields = ['consumer__first_name', 'consumer__last_name', 'bill_id']
    ordering_fields = ['billing_period', 'due_date', 'amount', 'status']

    def perform_create(self, serializer):
        """Set created_by user on creation."""
        serializer.save(
            created_by=self.request.user,
            last_modified_by=self.request.user
        )

    def perform_update(self, serializer):
        """Set last_modified_by user on update."""
        serializer.save(last_modified_by=self.request.user)

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate a new bill."""
        try:
            consumer_id = request.data.get('consumer')
            current_reading = float(request.data.get('current_reading'))
            previous_reading = float(request.data.get('previous_reading'))
            billing_period = request.data.get('billing_period')
            due_date = request.data.get('due_date')

            if not all([consumer_id, billing_period, due_date]):
                return Response(
                    {'error': 'Missing required fields'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            consumer = get_object_or_404(Consumer, consumer_id=consumer_id)

            # Validate readings
            if current_reading <= previous_reading:
                return Response(
                    {'error': 'Current reading must be greater than previous reading'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Parse dates
            billing_date = datetime.strptime(f"{billing_period}-01", '%Y-%m-%d').date()
            due_date_obj = datetime.strptime(due_date, '%Y-%m-%d').date()

            # Validate due date
            if due_date_obj <= billing_date:
                return Response(
                    {'error': 'Due date must be after billing period'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check for existing bill
            existing_bill = Bill.objects.filter(
                consumer=consumer,
                billing_period__year=billing_date.year,
                billing_period__month=billing_date.month
            ).first()

            if existing_bill:
                return Response(
                    {'error': f'Bill already exists for {billing_date.strftime("%B %Y")}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create meter reading
            meter_reading = MeterReading.objects.create(
                consumer=consumer,
                reading_date=billing_date,
                previous_reading=previous_reading,
                current_reading=current_reading,
                created_by=request.user,
                last_modified_by=request.user
            )

            # Create bill
            bill = Bill.objects.create(
                consumer=consumer,
                meter_reading=meter_reading,
                billing_period=billing_date,
                due_date=due_date_obj,
                created_by=request.user,
                last_modified_by=request.user
            )

            return Response({
                'success': True,
                'message': 'Bill generated successfully',
                'bill': BillSerializer(bill).data
            }, status=status.HTTP_201_CREATED)

        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': 'An error occurred while generating the bill'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark a bill as paid."""
        bill = self.get_object()
        bill.status = 'paid'
        bill.last_modified_by = request.user
        bill.save()
        return Response({
            'success': True,
            'message': 'Bill marked as paid',
            'bill': BillSerializer(bill).data
        })

    @action(detail=False, methods=['get'])
    def unpaid(self, request):
        """Get all unpaid bills."""
        bills = self.queryset.filter(status='unpaid').order_by('due_date')
        serializer = self.get_serializer(bills, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def paid(self, request):
        """Get all paid bills."""
        bills = self.queryset.filter(status='paid').order_by('-billing_period')
        serializer = self.get_serializer(bills, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_period(self, request):
        """Get bills for a specific period."""
        period = request.query_params.get('period')
        if not period:
            return Response(
                {'error': 'period query parameter is required (format: YYYY-MM)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            billing_date = datetime.strptime(f"{period}-01", '%Y-%m-%d').date()
            bills = self.queryset.filter(
                billing_period__year=billing_date.year,
                billing_period__month=billing_date.month
            )
            serializer = self.get_serializer(bills, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {'error': 'Invalid period format. Use YYYY-MM'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get all overdue bills."""
        from datetime import date
        bills = self.queryset.filter(
            status='unpaid',
            due_date__lt=date.today()
        ).order_by('due_date')
        serializer = self.get_serializer(bills, many=True)
        return Response(serializer.data)


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Notification management.

    Provides read operations for notifications and sending capabilities.
    """
    queryset = Notification.objects.all().order_by('-sent_at')
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['bill__consumer__first_name', 'bill__consumer__last_name']
    ordering_fields = ['sent_at', 'notification_type']

    @action(detail=False, methods=['post'])
    def send_bulk(self, request):
        """Send notifications to multiple consumers."""
        try:
            billing_period = request.data.get('billing_period')
            notification_type = request.data.get('notification_type')

            if not all([billing_period, notification_type]):
                return Response(
                    {'error': 'billing_period and notification_type are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Parse billing period
            billing_date = datetime.strptime(f"{billing_period}-01", '%Y-%m-%d').date()

            # Get unpaid bills for the period
            bills = Bill.objects.filter(
                billing_period__year=billing_date.year,
                billing_period__month=billing_date.month,
                status='unpaid'
            ).select_related('consumer')

            if not bills.exists():
                return Response(
                    {'error': 'No unpaid bills found for this period'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Initialize Twilio client
            try:
                client = Client(
                    settings.TWILIO_ACCOUNT_SID,
                    settings.TWILIO_AUTH_TOKEN
                )
            except Exception:
                return Response(
                    {'error': 'Twilio credentials not configured'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            sent_count = 0
            failed_count = 0

            for bill in bills:
                if not bill.consumer.contact_number:
                    failed_count += 1
                    continue

                message = self._build_message(bill, notification_type)

                try:
                    client.messages.create(
                        body=message,
                        from_=settings.TWILIO_PHONE_NUMBER,
                        to=bill.consumer.contact_number
                    )

                    Notification.objects.create(
                        bill=bill,
                        notification_type=notification_type,
                        message=message,
                        sent_successfully=True
                    )
                    sent_count += 1

                except Exception as e:
                    Notification.objects.create(
                        bill=bill,
                        notification_type=notification_type,
                        message=str(e),
                        sent_successfully=False
                    )
                    failed_count += 1

            return Response({
                'success': True,
                'message': f'Notifications sent. Success: {sent_count}, Failed: {failed_count}',
                'sent_count': sent_count,
                'failed_count': failed_count
            })

        except Exception as e:
            return Response(
                {'error': 'An error occurred while sending notifications'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _build_message(self, bill, notification_type):
        """Build SMS message based on notification type."""
        consumer_name = bill.consumer.get_full_name()
        amount = bill.amount
        due_date = bill.due_date.strftime('%B %d, %Y')

        if notification_type == 'bill':
            return (f"Dear {consumer_name}, Your water bill for "
                   f"{bill.billing_period.strftime('%B %Y')} is ₱{amount}. "
                   f"Due date: {due_date}.")
        elif notification_type == 'reminder':
            return (f"Dear {consumer_name}, This is a reminder that your water bill "
                   f"of ₱{amount} is due on {due_date}.")
        elif notification_type == 'disconnection':
            return (f"Dear {consumer_name}, Your water bill of ₱{amount} is overdue. "
                   f"Please settle immediately to avoid disconnection.")
        else:
            return f"Dear {consumer_name}, {amount}"

    @action(detail=False, methods=['get'])
    def by_bill(self, request):
        """Get notifications for a specific bill."""
        bill_id = request.query_params.get('bill_id')
        if not bill_id:
            return Response(
                {'error': 'bill_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        notifications = self.queryset.filter(bill_id=bill_id)
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)


class DashboardAPIView(APIView):
    """API endpoint for dashboard statistics."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get dashboard statistics."""
        total_consumers = Consumer.objects.count()
        active_bills = Bill.objects.filter(status='unpaid').count()
        connected_meters = Consumer.objects.filter(account_status='active').count()
        total_collections = Bill.objects.filter(status='paid').aggregate(
            total=Sum('amount')
        )['total'] or 0

        # Get last 6 months of collections
        collections_data = Bill.objects.filter(
            status='paid',
            billing_period__gte=datetime.now() - timedelta(days=180)
        ).annotate(
            month=TruncMonth('billing_period')
        ).values('month').annotate(
            total=Sum('amount')
        ).order_by('month')

        monthly_collections = [
            {
                'month': entry['month'].strftime('%b %Y'),
                'total': float(entry['total'])
            }
            for entry in collections_data
        ]

        return Response({
            'success': True,
            'total_consumers': total_consumers,
            'active_bills': active_bills,
            'connected_meters': connected_meters,
            'total_collections': float(total_collections),
            'monthly_collections': monthly_collections
        })
