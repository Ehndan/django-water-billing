from django.db import models
from django.utils import timezone

class Consumer(models.Model):
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Suspended', 'Suspended'),
        ('Disconnected', 'Disconnected'),
    ]

    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    contact_number = models.CharField(max_length=15)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Active')

    def __str__(self):
        return self.name

    def get_outstanding_bills(self):
        """Get all unpaid or overdue bills."""
        return self.bill_set.filter(status='Unpaid')

    def get_overdue_bills(self):
        """Get all overdue bills."""
        return self.bill_set.filter(status='Unpaid', due_date__lt=timezone.now())

class MeterReading(models.Model):
    consumer = models.ForeignKey(Consumer, on_delete=models.CASCADE)
    meter_number = models.CharField(max_length=50)
    current_reading = models.FloatField()
    previous_reading = models.FloatField()
    reading_date = models.DateField(auto_now_add=True)

    def calculate_consumption(self):
        """Calculate consumption based on the current and previous readings."""
        # Get the latest reading for this consumer
        latest_reading = self
        previous_reading = MeterReading.objects.filter(
            consumer=self.consumer,
            reading_date__lt=latest_reading.reading_date
        ).order_by('-reading_date').first()

        if previous_reading:
            return latest_reading.current_reading - previous_reading.current_reading
        return latest_reading.current_reading

    def __str__(self):
        return f"{self.consumer.name} - {self.meter_number} ({self.reading_date})"

class Bill(models.Model):
    consumer = models.ForeignKey(Consumer, on_delete=models.CASCADE)
    billing_period = models.DateField()  # Store as DateField for easier comparisons
    amount_due = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    status = models.CharField(max_length=50, choices=[('Unpaid', 'Unpaid'), ('Paid', 'Paid')], default='Unpaid')
    generated_at = models.DateTimeField(auto_now_add=True)
    reconnection_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)

    def __str__(self):
        return f"Bill #{self.id} for {self.consumer.name} - {self.amount_due} due on {self.due_date}"

    def calculate_late_fee(self):
        """Calculate a late fee if the bill is overdue."""
        if self.status == 'Unpaid' and self.due_date < timezone.now().date():
            # You can modify the logic of late fee calculation as per your requirements
            return 20  # Example late fee
        return 0

    def calculate_total_due(self):
        """Calculate the total amount due including late fees."""
        late_fee = self.calculate_late_fee()
        return self.amount_due + late_fee + self.reconnection_fee

    def mark_as_paid(self):
        """Mark bill as paid."""
        self.status = 'Paid'
        self.save()

    def overdue(self):
        """Check if the bill is overdue."""
        return self.due_date < timezone.now().date() and self.status == 'Unpaid'


class Payment(models.Model):
    consumer = models.ForeignKey(Consumer, on_delete=models.CASCADE)
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment for Bill #{self.bill.id} - {self.amount_paid}"

    def mark_reconnection_fee(self):
        """Mark the payment for reconnection if applicable."""
        if self.bill.consumer.status == 'Disconnected' and self.amount_paid >= self.bill.amount_due:
            self.bill.reconnection_fee = 100  # Example reconnection fee amount
            self.bill.save()

