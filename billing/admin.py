from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Consumer, Bill, Notification, MeterReading

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'user_type', 'contact_number')
    list_filter = ('user_type', 'is_active', 'is_staff')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('username',)
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email', 'contact_number')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('User Type', {'fields': ('user_type',)}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2', 'user_type', 'is_staff', 'is_active'),
        }),
    )

class ConsumerAdmin(admin.ModelAdmin):
    list_display = ('consumer_id', 'get_full_name', 'contact_number', 'meter_number', 'account_status')
    list_filter = ('account_status', 'created_at')
    search_fields = ('first_name', 'last_name', 'meter_number', 'contact_number')
    ordering = ('last_name', 'first_name')

class MeterReadingAdmin(admin.ModelAdmin):
    list_display = ('reading_id', 'consumer', 'reading_date', 'previous_reading', 'current_reading', 'consumption')
    list_filter = ('reading_date', 'created_at')
    search_fields = ('consumer__first_name', 'consumer__last_name')
    ordering = ('-reading_date',)
    readonly_fields = ('consumption',)

class BillAdmin(admin.ModelAdmin):
    list_display = ('bill_id', 'consumer', 'billing_period', 'meter_reading', 'amount', 'due_date', 'status')
    list_filter = ('status', 'billing_period', 'due_date')
    search_fields = ('bill_id', 'consumer__first_name', 'consumer__last_name')
    ordering = ('-billing_period',)
    readonly_fields = ('amount',)

class NotificationAdmin(admin.ModelAdmin):
    list_display = ('bill', 'notification_type', 'sent_at', 'sent_successfully')
    list_filter = ('notification_type', 'sent_successfully', 'sent_at')
    search_fields = ('bill__consumer__first_name', 'bill__consumer__last_name', 'message')
    ordering = ('-sent_at',)

admin.site.register(User, CustomUserAdmin)
admin.site.register(Consumer, ConsumerAdmin)
admin.site.register(Bill, BillAdmin)
admin.site.register(Notification, NotificationAdmin)
admin.site.register(MeterReading, MeterReadingAdmin)
