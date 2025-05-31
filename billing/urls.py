from django.urls import path
from . import views

urlpatterns = [
    path('', views.landing_page, name='landing_page'),
    path('track-bill/', views.track_bill, name='track_bill'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('bills/ongoing/', views.ongoing_bills, name='ongoing_bills'),
    path('bills/history/', views.bill_history, name='bill_history'),
    path('consumers/', views.consumers, name='consumers'),
    path('consumers/add/', views.add_consumer, name='add_consumer'),
    path('consumers/edit/<int:consumer_id>/', views.edit_consumer, name='edit_consumer'),
    path('consumers/delete/<int:consumer_id>/', views.delete_consumer, name='delete_consumer'),
    path('consumers/<int:consumer_id>/get_data/', views.get_consumer_data, name='get_consumer_data'),
    path('bills/generate/', views.generate_bill, name='generate_bill'),
    path('bills/mark-paid/<int:bill_id>/', views.mark_bill_paid, name='mark_bill_paid'),
    path('bills/edit/<int:bill_id>/', views.edit_bill, name='edit_bill'),
    path('bills/delete/<int:bill_id>/', views.delete_bill, name='delete_bill'),
    path('bills/last-reading/<int:consumer_id>/', views.get_last_reading, name='get_last_reading'),
    path('bills/print/', views.print_bills, name='print_bills'),
    path('notifications/send/', views.send_notifications, name='send_notifications'),
] 