from django.shortcuts import render, get_object_or_404, redirect
from .models import Consumer, MeterReading, Bill, Payment
from .forms import ConsumerForm
from django.utils import timezone
from django.urls import reverse
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from datetime import datetime
from django.http import JsonResponse
from django.views.decorators.http import require_GET

def landing_view(request):
    return render(request, 'billing_app/landing_page.html')

def login_view(request):
    if request.user.is_authenticated:
        if request.user.is_superuser:
            return redirect('admin')
        return redirect('dashboard')

    if request.method == 'POST':
        user = authenticate(request,
                            username=request.POST['username'],
                            password=request.POST['password'])
        if user:
            login(request, user)
            return redirect('admin' if user.is_superuser else 'dashboard')
        return render(request, 'billing_app/login.html', {
            'error': 'Invalid username or password'
        })

    return render(request, 'billing_app/login.html')

@login_required(login_url='login')
def dashboard(request):
    return render(request, 'billing_app/dashboard.html')

def logout_view(request):
    logout(request)
    return redirect('landing_page')

def list_consumers(request):
    search_query = request.GET.get('search', '')
    consumers = Consumer.objects.all()
    if search_query:
        consumers = consumers.filter(name__icontains=search_query)

    consumer_data = []
    for c in consumers:
        latest = c.meterreading_set.order_by('-reading_date').first()
        consumer_data.append({'consumer': c, 'latest_reading': latest})

    paginator = Paginator(consumer_data, 5)
    page_obj = paginator.get_page(request.GET.get('page'))

    # Calculate empty rows for pagination consistency
    empty_rows = 5 - len(page_obj.object_list)
    if empty_rows < 0:
        empty_rows = 0

    return render(request, 'billing_app/list_consumers.html', {
        'page_obj': page_obj,
        'search_query': search_query,
        'empty_rows': range(empty_rows),
    })

def create_consumer(request):
    if request.method == 'POST':
        form = ConsumerForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Consumer created successfully!")
            return redirect('dashboard')
        messages.error(request, "All fields are required or there is an error in the form.")
    else:
        form = ConsumerForm()
    return render(request, 'billing_app/create_consumer.html', {'form': form})

def edit_consumer(request, consumer_id):
    consumer = get_object_or_404(Consumer, id=consumer_id)
    if request.method == 'POST':
        form = ConsumerForm(request.POST, instance=consumer)
        if form.is_valid():
            form.save()
            messages.success(request, f"{consumer.name}'s information updated successfully.")
            return redirect('dashboard')
        messages.error(request, "Error updating the information.")
    else:
        form = ConsumerForm(instance=consumer)
    return render(request, 'billing_app/edit_consumer.html', {'form': form})

def consumer_records(request, consumer_id):
    consumer = get_object_or_404(Consumer, id=consumer_id)
    bills = Bill.objects.filter(consumer=consumer).order_by('-billing_period')
    return render(request, 'billing_app/consumer_records.html', {
        'consumer': consumer,
        'bills': bills
    })

from django.core.paginator import Paginator
from django.shortcuts import render
from .models import Bill, MeterReading

def bill_list(request):
    bills = (Bill.objects
             .select_related('consumer')
             .filter(status='Unpaid')
             .order_by('-generated_at'))

    for bill in bills:
        prev = (MeterReading.objects
                .filter(consumer=bill.consumer,
                        reading_date__lt=bill.billing_period)
                .order_by('-reading_date')
                .first())
        bill.reading = prev
        bill.consumption = (
            (bill.reading.current_reading - bill.reading.previous_reading)
            if bill.reading else "N/A"
        )

    page_obj = Paginator(bills, 5).get_page(request.GET.get('page'))

    # Calculate how many empty rows to display
    empty_rows = 5 - len(page_obj.object_list)
    if empty_rows < 0:
        empty_rows = 0

    return render(request, 'billing_app/bill_list.html', {
        'page_obj': page_obj,
        'empty_rows': range(empty_rows)
    })

def mark_bill_paid(request, bill_id):
    bill = get_object_or_404(Bill, id=bill_id)
    bill.mark_as_paid()
    messages.success(request, f"Bill for {bill.consumer.name} marked as paid.")
    return redirect('bill_list')

def bill_history(request):
    paid = Bill.objects.filter(status='Paid').order_by('consumer', '-generated_at')
    page_obj = Paginator(paid, 5).get_page(request.GET.get('page'))

    empty_rows = 5 - len(page_obj.object_list)
    if empty_rows < 0:
        empty_rows = 0

    return render(request, 'billing_app/bill_history.html', {
        'page_obj': page_obj,
        'empty_rows': range(empty_rows),
    })

@login_required(login_url='login')
def generate_bill(request):
    if request.method == "POST":
        consumer_name = request.POST.get('consumer_name')
        raw_period    = request.POST.get('billing_period')   # "YYYY-MM"
        due_date      = request.POST.get('due_date')
        current_read  = request.POST.get('current_reading')
        meter_number  = request.POST.get('meter_number')

        try:
            consumer      = Consumer.objects.get(name=consumer_name)
            period_date   = datetime.strptime(raw_period, '%Y-%m')
            billing_period = period_date.date()

            if due_date < raw_period:
                messages.error(request, "Due date cannot be earlier than the billing period.")
                return redirect('generate_bill')

            if Bill.objects.filter(consumer=consumer, billing_period=billing_period).exists():
                messages.warning(request, f"Bill for {billing_period} already exists for {consumer.name}.")
                return redirect('generate_bill')

            if not current_read or not meter_number:
                messages.error(request, "Please input the current reading and meter number.")
                return redirect('generate_bill')

            current_value = float(current_read)

            # get truly last reading by date _and_ id
            prev_obj = (MeterReading.objects
                        .filter(consumer=consumer)
                        .order_by('-reading_date', '-id')
                        .first())
            prev_val = prev_obj.current_reading if prev_obj else 0.0

            consumption = current_value - prev_val
            if consumption < 0:
                messages.error(request, "Current reading cannot be less than previous reading.")
                return redirect('generate_bill')

            amount_due = 100 + max(consumption - 10, 0) * 10
            Bill.objects.create(
                consumer=consumer,
                billing_period=billing_period,
                amount_due=amount_due,
                due_date=due_date,
                status="Unpaid",
                generated_at=timezone.now()
            )
            MeterReading.objects.create(
                consumer=consumer,
                meter_number=meter_number,
                current_reading=current_value,
                previous_reading=prev_val,
                reading_date=timezone.now()
            )

            messages.success(request, f"Bill generated for {consumer.name}. Amount due: ₱{amount_due}")
            return redirect('dashboard')  # Redirect to dashboard

        except Consumer.DoesNotExist:
            messages.error(request, "Consumer not found!")
            return redirect('generate_bill')

    # GET
    consumers = Consumer.objects.all()
    return render(request, 'billing_app/generate_bill.html', {
        'consumers': consumers,
        'initial_consumer': request.GET.get('consumer_name', ''),
        'initial_period':   request.GET.get('billing_period', ''),
    })

@require_GET
@login_required
def get_previous_reading(request):
    name = request.GET.get('consumer_name', '').strip()
    if not name:
        return JsonResponse({'previous_reading': 0.0})

    try:
        consumer = Consumer.objects.get(name=name)
    except Consumer.DoesNotExist:
        return JsonResponse({'previous_reading': 0.0})

    last = (MeterReading.objects
            .filter(consumer=consumer)
            .order_by('-reading_date', '-id')
            .first())

    return JsonResponse({'previous_reading': last.current_reading if last else 0.0})

def billing_tracker(request):
    return render(request, 'billing_app/bill_track.html')

@require_GET
def validate_id(request):
    user_id = request.GET.get('id')
    try:
        consumer = Consumer.objects.get(id=user_id)
        bills = Bill.objects.filter(consumer=consumer).order_by('-billing_period')
        data = {
            'name': consumer.name,
            'address': consumer.address,
            'status': consumer.status,
            'bills': [{
                'billing_period': b.billing_period.strftime('%B %Y'),
                'amount_due': float(b.amount_due),
                'due_date': b.due_date.strftime('%Y-%m-%d'),
                'status': b.status,
            } for b in bills]
        }
        return JsonResponse({'success': True, 'data': data})
    except Consumer.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Consumer not found'})

def track_records(request):
    return render(request, 'billing_app/track_records.html')