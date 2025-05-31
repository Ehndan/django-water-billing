from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator

class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('admin', 'Barangay Admin'),
        ('staff', 'Barangay Staff'),
    )
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES)
    contact_number = models.CharField(max_length=11, blank=True)

    def __str__(self):
        return f"{self.get_full_name()} ({self.user_type})"

class Consumer(models.Model):
    ACCOUNT_STATUS_CHOICES = (
        ('active', 'Active'),
        ('disconnected', 'Disconnected'),
    )
    
    consumer_id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=100)
    middle_initial = models.CharField(max_length=1, blank=True)
    last_name = models.CharField(max_length=100)
    contact_number = models.CharField(
        max_length=11,
        validators=[RegexValidator(regex=r'^\d{11}$', message='Contact number must be 11 digits')]
    )
    address = models.TextField()
    meter_number = models.CharField(max_length=50, unique=True)
    account_status = models.CharField(max_length=20, choices=ACCOUNT_STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.middle_initial}. {self.last_name}"

    def get_full_name(self):
        if self.middle_initial:
            return f"{self.first_name} {self.middle_initial}. {self.last_name}"
        return f"{self.first_name} {self.last_name}"

class MeterReading(models.Model):
    reading_id = models.AutoField(primary_key=True)
    consumer = models.ForeignKey(Consumer, on_delete=models.CASCADE, related_name='meter_readings')
    reading_date = models.DateField()
    previous_reading = models.DecimalField(max_digits=10, decimal_places=1)
    current_reading = models.DecimalField(max_digits=10, decimal_places=1)
    consumption = models.DecimalField(max_digits=10, decimal_places=1, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='readings_created')
    last_modified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='readings_modified')

    def save(self, *args, **kwargs):
        # Calculate consumption
        self.consumption = self.current_reading - self.previous_reading
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Reading for {self.consumer.get_full_name()} on {self.reading_date}"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['consumer', 'reading_date'],
                name='unique_consumer_reading_date'
            )
        ]

class Bill(models.Model):
    BILL_STATUS_CHOICES = (
        ('unpaid', 'Unpaid'),
        ('paid', 'Paid'),
    )
    
    bill_id = models.AutoField(primary_key=True)
    consumer = models.ForeignKey(Consumer, on_delete=models.CASCADE, related_name='bills')
    meter_reading = models.OneToOneField(MeterReading, on_delete=models.PROTECT, related_name='bill', null=True)
    billing_period = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    status = models.CharField(max_length=10, choices=BILL_STATUS_CHOICES, default='unpaid')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='bills_created')
    last_modified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='bills_modified')

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['consumer', 'billing_period'],
                name='unique_consumer_billing_period'
            )
        ]

    def save(self, *args, **kwargs):
        # Calculate amount based on meter reading consumption
        if self.meter_reading:
            consumption = self.meter_reading.consumption
            if consumption <= 10:
                self.amount = 100
            else:
                excess = consumption - 10
                self.amount = 100 + (excess * 10)  # 1 peso per 0.1 cubic meter excess
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Bill #{self.bill_id} - {self.consumer.get_full_name()}"

class Notification(models.Model):
    NOTIFICATION_TYPE_CHOICES = (
        ('bill', 'New Bill'),
        ('reminder', 'Payment Reminder'),
        ('disconnection', 'Disconnection Notice'),
    )
    
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPE_CHOICES)
    message = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    sent_successfully = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.notification_type} - Bill #{self.bill.bill_id}"
