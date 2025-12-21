"""
Serializers for Water Billing System API.

Handles serialization/deserialization of User, Consumer, MeterReading, Bill, and Notification models.
"""

from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Consumer, MeterReading, Bill, Notification


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'user_type',
                  'contact_number', 'is_active', 'is_staff', 'password', 'date_joined')
        read_only_fields = ('id', 'date_joined')

    def create(self, validated_data):
        """Create a new user with hashed password."""
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        """Update user instance."""
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        """Authenticate user credentials."""
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            raise serializers.ValidationError('Username and password are required.')

        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError('Invalid credentials.')

        data['user'] = user
        return data


class ConsumerSerializer(serializers.ModelSerializer):
    """Serializer for Consumer model."""
    full_name = serializers.SerializerMethodField(read_only=True)
    bills_count = serializers.SerializerMethodField(read_only=True)
    unpaid_bills_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Consumer
        fields = ('consumer_id', 'first_name', 'middle_initial', 'last_name', 'full_name',
                  'contact_number', 'address', 'meter_number', 'account_status',
                  'bills_count', 'unpaid_bills_count', 'created_at', 'updated_at')
        read_only_fields = ('consumer_id', 'created_at', 'updated_at')

    def get_full_name(self, obj):
        """Get full name of consumer."""
        return obj.get_full_name()

    def get_bills_count(self, obj):
        """Get total bills count."""
        return obj.bills.count()

    def get_unpaid_bills_count(self, obj):
        """Get unpaid bills count."""
        return obj.bills.filter(status='unpaid').count()


class MeterReadingSerializer(serializers.ModelSerializer):
    """Serializer for MeterReading model."""
    consumer_name = serializers.CharField(source='consumer.get_full_name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = MeterReading
        fields = ('reading_id', 'consumer', 'consumer_name', 'reading_date',
                  'previous_reading', 'current_reading', 'consumption',
                  'created_by', 'created_by_username', 'last_modified_by',
                  'created_at', 'updated_at')
        read_only_fields = ('reading_id', 'consumption', 'created_at', 'updated_at')

    def validate(self, data):
        """Validate meter reading data."""
        if data['current_reading'] <= data['previous_reading']:
            raise serializers.ValidationError(
                'Current reading must be greater than previous reading.'
            )
        return data


class BillSerializer(serializers.ModelSerializer):
    """Serializer for Bill model."""
    consumer_name = serializers.CharField(source='consumer.get_full_name', read_only=True)
    meter_reading_data = MeterReadingSerializer(source='meter_reading', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    is_overdue = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Bill
        fields = ('bill_id', 'consumer', 'consumer_name', 'meter_reading',
                  'meter_reading_data', 'billing_period', 'amount', 'due_date',
                  'status', 'is_overdue', 'created_by', 'created_by_username',
                  'last_modified_by', 'created_at', 'updated_at')
        read_only_fields = ('bill_id', 'amount', 'created_at', 'updated_at')

    def get_is_overdue(self, obj):
        """Check if bill is overdue."""
        from datetime import date
        return obj.status == 'unpaid' and obj.due_date < date.today()


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model."""
    bill_info = BillSerializer(source='bill', read_only=True)

    class Meta:
        model = Notification
        fields = ('id', 'bill', 'bill_info', 'notification_type',
                  'message', 'sent_at', 'sent_successfully')
        read_only_fields = ('id', 'sent_at')


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics."""
    total_consumers = serializers.IntegerField()
    active_bills = serializers.IntegerField()
    connected_meters = serializers.IntegerField()
    total_collections = serializers.DecimalField(max_digits=15, decimal_places=2)
    monthly_collections = serializers.ListField(
        child=serializers.DictField()
    )
