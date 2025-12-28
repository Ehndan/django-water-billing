from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Sum, Count, Q
from django.core.paginator import Paginator
from django.http import HttpResponse, JsonResponse, HttpResponseNotFound
from django.template.loader import render_to_string
from django.core.mail import EmailMessage
from .models import User, Consumer, Bill, Notification, MeterReading
from datetime import datetime, timedelta
import json
from twilio.rest import Client
from django.conf import settings
from django.urls import reverse
from django.db.models.functions import TruncMonth

def landing_page(request):
    return render(request, 'landing_page.html')

def track_bill(request):
    bill_id = request.GET.get('bill_id')
    if bill_id:
        try:
            bill = Bill.objects.get(bill_id=bill_id)
            consumer = bill.consumer
            bills = Bill.objects.filter(consumer=consumer).order_by('-billing_period')
            return render(request, 'track_bill.html', {
                'current_bill': bill,
                'consumer': consumer,
                'bills': bills
            })
        except Bill.DoesNotExist:
            messages.error(request, 'Invalid Bill ID. Please check and try again.')
            return render(request, 'track_bill.html')
        except Exception as e:
            messages.error(request, 'An error occurred. Please try again.')
            return render(request, 'track_bill.html')
    return render(request, 'track_bill.html')

@login_required
def dashboard(request):
    total_consumers = Consumer.objects.count()
    active_bills = Bill.objects.filter(status='unpaid').count()
    connected_meters = Consumer.objects.filter(account_status='active').count()
    total_collections = Bill.objects.filter(status='paid').aggregate(Sum('amount'))['amount__sum'] or 0

    ongoing_bills = Bill.objects.filter(status='unpaid').select_related('consumer').order_by('due_date')
    
    # Get last 6 months of collections data
    collections_data = Bill.objects.filter(
        status='paid',
        billing_period__gte=datetime.now() - timedelta(days=180)
    ).annotate(
        month=TruncMonth('billing_period')
    ).values('month').annotate(
        total=Sum('amount')
    ).order_by('month')

    # Format data for the chart
    months = []
    amounts = []
    for entry in collections_data:
        months.append(entry['month'].strftime('%b %Y'))
        amounts.append(float(entry['total']))

    return render(request, 'dashboard.html', {
        'total_consumers': total_consumers,
        'active_bills': active_bills,
        'connected_meters': connected_meters,
        'total_collections': total_collections,
        'ongoing_bills': ongoing_bills,
        'chart_labels': json.dumps(months),
        'chart_data': json.dumps(amounts),
    })

@login_required
def ongoing_bills(request):
    bills = Bill.objects.filter(status='unpaid').select_related('consumer').order_by('-billing_period')
    consumers = Consumer.objects.filter(account_status='active')
    return render(request, 'ongoing_bills.html', {'bills': bills, 'consumers': consumers})

@login_required
def bill_history(request):
    bills = Bill.objects.filter(status='paid').select_related('consumer').order_by('-billing_period')
    return render(request, 'bill_history.html', {'bills': bills})

@login_required
def consumers(request):
    consumers = Consumer.objects.all().order_by('last_name', 'first_name')
    return render(request, 'consumers.html', {'consumers': consumers})

@login_required
def add_consumer(request):
    if request.method == 'POST':
        # Process the form data and create a new consumer
        consumer = Consumer.objects.create(
            first_name=request.POST['first_name'],
            middle_initial=request.POST['middle_initial'],
            last_name=request.POST['last_name'],
            contact_number=request.POST['contact_number'],
            address=request.POST['address'],
            meter_number=request.POST['meter_number'],
            account_status=request.POST.get('account_status', 'active')
        )
        messages.success(request, 'Consumer added successfully.')
        
        # If it's an AJAX request, return JSON response
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'status': 'success',
                'message': 'Consumer added successfully.',
                'consumer': {
                    'id': consumer.consumer_id,
                    'name': consumer.get_full_name(),
                    'contact': consumer.contact_number,
                    'address': consumer.address,
                    'meter': consumer.meter_number,
                    'status': consumer.account_status
                }
            })
        return redirect('consumers')
    return redirect('consumers')

@login_required
def get_consumer_data(request, consumer_id):
    consumer = get_object_or_404(Consumer, consumer_id=consumer_id)
    return JsonResponse({
        'first_name': consumer.first_name,
        'middle_initial': consumer.middle_initial,
        'last_name': consumer.last_name,
        'contact_number': consumer.contact_number,
        'address': consumer.address,
        'meter_number': consumer.meter_number,
        'account_status': consumer.account_status
    })

@login_required
def edit_consumer(request, consumer_id):
    # Check if user is superuser or admin
    if not request.user.is_superuser and request.user.user_type != 'admin':
        messages.error(request, 'You do not have permission to edit consumers.')
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'status': 'error',
                'message': 'Permission denied'
            }, status=403)
        return redirect('consumers')

    consumer = get_object_or_404(Consumer, consumer_id=consumer_id)
    if request.method == 'POST':
        consumer.first_name = request.POST['first_name']
        consumer.middle_initial = request.POST['middle_initial']
        consumer.last_name = request.POST['last_name']
        consumer.contact_number = request.POST['contact_number']
        consumer.address = request.POST['address']
        consumer.meter_number = request.POST['meter_number']
        consumer.account_status = request.POST['account_status']
        consumer.save()
        messages.success(request, 'Consumer updated successfully.')
        
        # If it's an AJAX request, return JSON response
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'status': 'success',
                'message': 'Consumer updated successfully.',
                'consumer': {
                    'id': consumer.consumer_id,
                    'name': consumer.get_full_name(),
                    'contact': consumer.contact_number,
                    'address': consumer.address,
                    'meter': consumer.meter_number,
                    'status': consumer.account_status
                }
            })
        return redirect('consumers')
    return render(request, 'edit_consumer.html', {'consumer': consumer})

@login_required
def delete_consumer(request, consumer_id):
    # Check if user is superuser or admin
    if not request.user.is_superuser and request.user.user_type != 'admin':
        messages.error(request, 'You do not have permission to delete consumers.')
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'status': 'error',
                'message': 'Permission denied'
            }, status=403)
        return redirect('consumers')

    consumer = get_object_or_404(Consumer, consumer_id=consumer_id)
    
    try:
        # Store consumer name for message
        consumer_name = consumer.get_full_name()
        
        # Delete the consumer (this will also delete related bills due to CASCADE)
        consumer.delete()
        
        messages.success(request, f'Consumer {consumer_name} has been deleted successfully.')
        
        # If it's an AJAX request, return JSON response
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'status': 'success',
                'message': f'Consumer {consumer_name} has been deleted successfully.'
            })
            
    except Exception as e:
        messages.error(request, 'An error occurred while deleting the consumer. Please try again.')
        
        # If it's an AJAX request, return JSON response
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'status': 'error',
                'message': 'An error occurred while deleting the consumer. Please try again.'
            }, status=500)
    
    return redirect('consumers')

@login_required
def generate_bill(request):
    if request.method == 'POST':
        try:
            consumer = get_object_or_404(Consumer, consumer_id=request.POST['consumer'])
            current_reading = float(request.POST['current_reading'])
            previous_reading = float(request.POST['previous_reading'])
            
            # Handle month-only billing period (format: YYYY-MM)
            billing_period = request.POST['billing_period']
            # Add day to make it first day of the month
            billing_period = f"{billing_period}-01"
            billing_date = datetime.strptime(billing_period, '%Y-%m-%d').date()
            
            due_date = datetime.strptime(request.POST['due_date'], '%Y-%m-%d').date()

            # Check if there's a more recent bill for this consumer
            latest_bill = Bill.objects.filter(
                consumer=consumer
            ).order_by('-billing_period').first()
            
            if latest_bill and billing_date < latest_bill.billing_period:
                raise ValueError(f"Cannot create a bill for {billing_date.strftime('%B %Y')} as there is a more recent bill for {latest_bill.billing_period.strftime('%B %Y')}")

            # Check if a bill already exists for this consumer in this month
            existing_bill = Bill.objects.filter(
                consumer=consumer,
                billing_period__year=billing_date.year,
                billing_period__month=billing_date.month
            ).first()
            
            if existing_bill:
                raise ValueError(f"A bill already exists for {consumer.get_full_name()} for {billing_date.strftime('%B %Y')}")

            # Validate readings
            if current_reading <= previous_reading:
                raise ValueError("Current reading must be greater than previous reading")

            # Validate due date
            if due_date <= billing_date:
                raise ValueError("Due date must be after the billing period")

            # Create meter reading first
            meter_reading = MeterReading.objects.create(
                consumer=consumer,
                reading_date=billing_date,
                previous_reading=previous_reading,
                current_reading=current_reading,
                created_by=request.user,
                last_modified_by=request.user
            )

            # Create bill and link it to the meter reading
            bill = Bill.objects.create(
                consumer=consumer,
                meter_reading=meter_reading,
                billing_period=billing_date,
                due_date=due_date,
                created_by=request.user,
                last_modified_by=request.user
            )
            
            # Save again to ensure amount is calculated correctly
            bill.save()

            messages.success(request, 'Bill generated successfully.')
            
            # If it's an AJAX request, return JSON response
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'success',
                    'message': 'Bill generated successfully.',
                    'redirect': reverse('ongoing_bills')
                })
            return redirect('ongoing_bills')
            
        except ValueError as e:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'error',
                    'message': str(e)
                }, status=400)
            messages.error(request, str(e))
            return redirect('ongoing_bills')
            
        except Exception as e:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'error',
                    'message': 'An error occurred while generating the bill. Please try again.'
                }, status=500)
            messages.error(request, 'An error occurred while generating the bill. Please try again.')
            return redirect('ongoing_bills')

    # This route should only handle POST requests now
    return redirect('ongoing_bills')

@login_required
def mark_bill_paid(request, bill_id):
    bill = get_object_or_404(Bill, bill_id=bill_id)
    if request.method == 'POST':
        bill.status = 'paid'
        bill.last_modified_by = request.user
        bill.save()
        messages.success(request, 'Bill marked as paid successfully.')
        
        # If it's an AJAX request, return JSON response
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'status': 'success',
                'message': 'Bill marked as paid successfully.',
                'bill': {
                    'id': bill.bill_id,
                    'consumer': bill.consumer.get_full_name(),
                    'amount': str(bill.amount),
                    'status': bill.status
                }
            })
        return redirect('ongoing_bills')
    return render(request, 'mark_bill_paid.html', {'bill': bill})

@login_required
def edit_bill(request, bill_id):
    # Check if user is superuser or admin
    if not request.user.is_superuser and request.user.user_type != 'admin':
        messages.error(request, 'You do not have permission to edit bills.')
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'status': 'error',
                'message': 'Permission denied'
            }, status=403)
        return redirect('bill_history')

    bill = get_object_or_404(Bill, bill_id=bill_id)
    
    if request.method == 'POST':
        try:
            current_reading = float(request.POST['current_reading'])
            previous_reading = float(request.POST['previous_reading'])
            due_date = datetime.strptime(request.POST['due_date'], '%Y-%m-%d').date()
            status = request.POST['status']
            
            # Validate readings
            if current_reading <= previous_reading:
                raise ValueError("Current reading must be greater than previous reading")

            # Update or create meter reading
            if bill.meter_reading:
                meter_reading = bill.meter_reading
                meter_reading.previous_reading = previous_reading
                meter_reading.current_reading = current_reading
                meter_reading.last_modified_by = request.user
                meter_reading.save()
            else:
                meter_reading = MeterReading.objects.create(
                    consumer=bill.consumer,
                    reading_date=bill.billing_period,
                    previous_reading=previous_reading,
                    current_reading=current_reading,
                    created_by=request.user,
                    last_modified_by=request.user
                )
                bill.meter_reading = meter_reading

            # Update bill
            bill.due_date = due_date
            bill.status = status
            bill.last_modified_by = request.user
            bill.save()
            
            messages.success(request, 'Bill updated successfully.')
            
            # If it's an AJAX request, return JSON response
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'success',
                    'message': 'Bill updated successfully.',
                    'bill': {
                        'id': bill.bill_id,
                        'consumer': bill.consumer.get_full_name(),
                        'current_reading': str(bill.meter_reading.current_reading),
                        'previous_reading': str(bill.meter_reading.previous_reading),
                        'consumption': str(bill.meter_reading.consumption),
                        'amount': str(bill.amount),
                        'due_date': bill.due_date.strftime('%Y-%m-%d'),
                        'status': bill.status
                    }
                })
            return redirect('bill_history')
            
        except ValueError as e:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'error',
                    'message': str(e)
                }, status=400)
            messages.error(request, str(e))
            return redirect('bill_history')
            
        except Exception as e:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'error',
                    'message': 'An error occurred while updating the bill. Please try again.'
                }, status=500)
            messages.error(request, 'An error occurred while updating the bill. Please try again.')
            return redirect('bill_history')
    
    # Return bill data for AJAX requests
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({
            'bill': {
                'id': bill.bill_id,
                'consumer': bill.consumer.get_full_name(),
                'current_reading': str(bill.meter_reading.current_reading if bill.meter_reading else ''),
                'previous_reading': str(bill.meter_reading.previous_reading if bill.meter_reading else ''),
                'consumption': str(bill.meter_reading.consumption if bill.meter_reading else ''),
                'amount': str(bill.amount),
                'due_date': bill.due_date.strftime('%Y-%m-%d'),
                'status': bill.status
            }
        })
    
    return render(request, 'bill_history.html', {'bill': bill})

@login_required
def delete_bill(request, bill_id):
    # Check if user is superuser or admin
    if not request.user.is_superuser and request.user.user_type != 'admin':
        messages.error(request, 'You do not have permission to delete bills.')
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'status': 'error',
                'message': 'Permission denied'
            }, status=403)
        return redirect('bill_history')

    bill = get_object_or_404(Bill, bill_id=bill_id)
    
    try:
        # Store consumer info for message
        consumer_name = bill.consumer.get_full_name()
        billing_period = bill.billing_period.strftime('%B %Y')
        
        # Store meter reading to delete
        meter_reading = bill.meter_reading
        
        # Delete the bill first (due to foreign key relationship)
        bill.delete()
        
        # Delete the associated meter reading if it exists
        if meter_reading:
            meter_reading.delete()
        
        messages.success(request, f'Bill for {consumer_name} ({billing_period}) has been deleted successfully.')
        
        # If it's an AJAX request, return JSON response
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'status': 'success',
                'message': f'Bill for {consumer_name} ({billing_period}) has been deleted successfully.'
            })
            
    except Exception as e:
        messages.error(request, 'An error occurred while deleting the bill. Please try again.')
        
        # If it's an AJAX request, return JSON response
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'status': 'error',
                'message': 'An error occurred while deleting the bill. Please try again.'
            }, status=500)
    
    return redirect('bill_history')

@login_required
def print_bills(request):
    if request.method == 'POST':
        billing_period = request.POST.get('billing_period', '').strip()
        bill_status = request.POST.get('bill_status', 'all').strip()
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        # Validate billing period
        if not billing_period:
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': 'Please select a billing period.'}, status=400)
            return HttpResponse('Please select a billing period.', status=400)
        
        try:
            # Convert YYYY-MM to YYYY-MM-DD by adding the first day of the month
            billing_date = datetime.strptime(billing_period + '-01', '%Y-%m-%d').date()
        except (ValueError, TypeError):
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': 'Invalid billing period format. Please select a valid month.'}, status=400)
            return HttpResponse('Invalid billing period format. Please select a valid month.', status=400)
        
        try:
            # Filter bills for the entire month
            bills = Bill.objects.filter(
                billing_period__year=billing_date.year,
                billing_period__month=billing_date.month
            ).select_related('consumer', 'meter_reading')
            
            # Apply status filter if not 'all'
            if bill_status != 'all' and bill_status in ['paid', 'unpaid']:
                bills = bills.filter(status=bill_status)
            
            # Order by consumer name
            bills = bills.order_by('consumer__last_name', 'consumer__first_name')
            
            if not bills.exists():
                if is_ajax:
                    return JsonResponse({'status': 'empty', 'message': 'No bills found for the selected period and status.'}, status=404)
                return HttpResponseNotFound('No bills found for the selected period and status.')
            
            # AJAX: return rendered HTML to open in a new window via JS
            if is_ajax:
                html = render_to_string('bill_print_template.html', {
                    'bills': bills,
                    'show_form': False,
                    'single_bill': False
                }, request=request)
                return JsonResponse({'status': 'ok', 'html': html})
            
            # Non-AJAX fallback: render full page
            return render(request, 'bill_print_template.html', {'bills': bills, 'show_form': False})
        except Exception as e:
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': 'An error occurred while retrieving bills. Please try again.'}, status=500)
            return HttpResponse('An error occurred while retrieving bills. Please try again.', status=500)
    
    # Handle GET request for individual bill printing
    bill_id = request.GET.get('bill_id', '').strip()
    if bill_id:
        try:
            bill = Bill.objects.select_related('consumer', 'meter_reading').get(bill_id=bill_id)
            bills = [bill]
            return render(request, 'bill_print_template.html', {
                'bills': bills,
                'show_form': False,
                'single_bill': True
            })
        except Bill.DoesNotExist:
            return HttpResponseNotFound('Bill not found.')
        except Exception as e:
            return HttpResponse('An error occurred while retrieving the bill.', status=500)
        
    return render(request, 'bill_print_template.html', {'bills': [], 'show_form': True})

@login_required
def send_notifications(request):
    if request.method == 'POST':
        billing_period_raw = (request.POST.get('billing_period') or '').strip()
        notification_type = request.POST.get('notification_type')

        # Normalize billing period (YYYY-MM) to first day of month
        try:
            billing_date = datetime.strptime(billing_period_raw + '-01', '%Y-%m-%d').date()
        except (ValueError, TypeError):
            messages.error(request, 'Please select a valid billing period (YYYY-MM).')
            return redirect('send_notifications')

        bills = Bill.objects.filter(
            billing_period__year=billing_date.year,
            billing_period__month=billing_date.month,
            status='unpaid'
        ).select_related('consumer')

        if not bills.exists():
            messages.info(request, 'No unpaid bills found for the selected period.')
            return redirect('send_notifications')

        # Decide whether to use Twilio or email-based simulation
        twilio_enabled = all([
            getattr(settings, 'TWILIO_ACCOUNT_SID', None),
            getattr(settings, 'TWILIO_AUTH_TOKEN', None),
            getattr(settings, 'TWILIO_PHONE_NUMBER', None),
        ])

        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN) if twilio_enabled else None
        default_from = getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@example.com')

        for bill in bills:
            phone = (bill.consumer.contact_number or '').strip()
            if not phone:
                continue

            message = f"Dear {bill.consumer.get_full_name()}, "

            if notification_type == 'bill':
                message += f"Your water bill for {bill.billing_period.strftime('%B %Y')} is ₱{bill.amount}. Due date: {bill.due_date.strftime('%B %d, %Y')}."
            elif notification_type == 'reminder':
                message += f"This is a reminder that your water bill of ₱{bill.amount} is due on {bill.due_date.strftime('%B %d, %Y')}."
            elif notification_type == 'disconnection':
                message += f"Your water bill of ₱{bill.amount} is overdue. Please settle immediately to avoid disconnection."
            else:
                message += "Water billing update."

            try:
                if client:
                    client.messages.create(
                        body=message,
                        from_=settings.TWILIO_PHONE_NUMBER,
                        to=phone
                    )
                else:
                    # Simulate SMS by sending to an email endpoint (use console/file email backend in dev)
                    pseudo_email = f"{phone}@sms-sim.local"
                    email = EmailMessage(
                        subject="SMS Simulation",
                        body=message,
                        from_email=default_from,
                        to=[pseudo_email],
                    )
                    email.send(fail_silently=False)

                Notification.objects.create(
                    bill=bill,
                    notification_type=notification_type,
                    message=message,
                    sent_successfully=True
                )
            except Exception as e:
                Notification.objects.create(
                    bill=bill,
                    notification_type=notification_type,
                    message=str(e),
                    sent_successfully=False
                )

        messages.success(request, 'Notifications processed. Check logs or email backend for simulated SMS when Twilio is disabled.')
        return redirect('dashboard')

    return render(request, 'send_notifications.html')

@login_required
def get_last_reading(request, consumer_id):
    consumer = get_object_or_404(Consumer, consumer_id=consumer_id)
    last_reading = MeterReading.objects.filter(consumer=consumer).order_by('-reading_date').first()
    latest_bill = Bill.objects.filter(consumer=consumer).order_by('-billing_period').first()
    
    response_data = {
        'last_reading': float(last_reading.current_reading) if last_reading else 0.0,
        'latest_bill_period': latest_bill.billing_period.strftime('%Y-%m-%d') if latest_bill else None
    }
    
    return JsonResponse(response_data)

@login_required
def generate_monthly_report(request):
    report_month = request.GET.get('report_month', '')
    report_type = request.GET.get('report_type', 'summary')
    
    if not report_month:
        return HttpResponse('Please select a report month.', status=400)
    
    try:
        # Parse YYYY-MM to date
        report_date = datetime.strptime(report_month + '-01', '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return HttpResponse('Invalid report month format.', status=400)
    
    # Get all bills for the selected month
    bills = Bill.objects.filter(
        billing_period__year=report_date.year,
        billing_period__month=report_date.month
    ).select_related('consumer', 'meter_reading').order_by('consumer__last_name', 'consumer__first_name')
    
    # Calculate statistics
    total_bills = bills.count()
    paid_bills = bills.filter(status='paid').count()
    unpaid_bills = bills.filter(status='unpaid').count()
    total_amount = bills.aggregate(Sum('amount'))['amount__sum'] or 0
    total_paid = bills.filter(status='paid').aggregate(Sum('amount'))['amount__sum'] or 0
    total_unpaid = bills.filter(status='unpaid').aggregate(Sum('amount'))['amount__sum'] or 0
    total_consumption = sum([b.meter_reading.consumption for b in bills if b.meter_reading])
    
    # Active consumers count
    active_consumers = Consumer.objects.filter(account_status='active').count()
    
    context = {
        'report_month': report_date.strftime('%B %Y'),
        'report_date': report_date,
        'report_type': report_type,
        'bills': bills,
        'total_bills': total_bills,
        'paid_bills': paid_bills,
        'unpaid_bills': unpaid_bills,
        'total_amount': total_amount,
        'total_paid': total_paid,
        'total_unpaid': total_unpaid,
        'total_consumption': total_consumption,
        'active_consumers': active_consumers,
        'collection_rate': (paid_bills / total_bills * 100) if total_bills > 0 else 0,
    }
    
    return render(request, 'monthly_report.html', context)
