from django.urls import path
from django.contrib.auth.decorators import login_required
from . import views

urlpatterns = [
    path('', views.landing_view, name='landing_page'),
    path('login/', views.login_view, name='login'),
    path('dashboard/', login_required(views.dashboard), name='dashboard'),
    path('logout/', views.logout_view, name='logout'),
    path('list-consumers/', views.list_consumers, name='list_consumers'),
    path('list-consumers/edit/<int:consumer_id>/', views.edit_consumer, name='edit_consumer'),
    path('create-consumer/', views.create_consumer, name='create_consumer'),
    path('bill-list/', views.bill_list, name='bill_list'),
    path('consumer/records/<int:consumer_id>', views.consumer_records, name='consumer_records'),
    path('bill/<int:bill_id>/mark-paid/', views.mark_bill_paid, name='mark_bill_paid'),
    path('bill-history/', views.bill_history, name='bill_history'),
    path('generate-bill/', views.generate_bill, name='generate_bill'),
    path('ajax/get_prev_reading/', views.get_previous_reading, name='get_prev_reading'),
    path('billing-tracker/', views.billing_tracker, name='billing_tracker'),
    path('validate-id/', views.validate_id, name='validate_id'),
    path('track-records/', views.track_records, name='track_records'),
]
