# Water Billing System - Django REST Framework API

A modern, RESTful API for managing water billing operations, consumer accounts, meter readings, and SMS notifications.

## New Features

### ✨ Django REST Framework Integration
- Full REST API for all operations
- JSON-based communication
- Browsable API interface
- Comprehensive error handling
- Pagination and filtering support

### 🔐 Improved Security
- Better permission classes
- Custom exception handlers
- CORS support for frontend integration
- Session-based authentication

### 📚 Better Code Organization
- Separated serializers (`serializers.py`)
- API views in dedicated module (`views_api.py`)
- Custom permissions module (`permissions.py`)
- Custom exception handler (`exceptions.py`)
- Dedicated API URLs configuration (`api_urls.py`)

### 🧹 Code Cleanup
- Removed deprecated `crispy_forms`
- Removed template-based views (replaced with API)
- Improved validation and error handling
- Better code documentation with docstrings

## Installation & Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run Migrations
```bash
python manage.py migrate
```

### 3. Create Superuser
```bash
python manage.py createsuperuser
```

### 4. Run Development Server
```bash
python manage.py runserver
```

The API will be available at: `http://localhost:8000/api/`

## API Structure

```
/api/
├── auth/
│   ├── login/          (POST)
│   ├── logout/         (POST)
│   └── register/       (POST)
├── consumers/          (GET, POST, PUT, DELETE)
│   ├── {id}/           (GET, PUT, DELETE)
│   ├── {id}/bills/     (GET)
│   ├── {id}/unpaid_bills/  (GET)
│   ├── active/         (GET)
│   └── disconnected/   (GET)
├── meter-readings/     (GET, POST, PUT, DELETE)
│   ├── {id}/           (GET, PUT, DELETE)
│   ├── by_consumer/    (GET)
│   └── latest/         (GET)
├── bills/              (GET, POST, PUT, DELETE)
│   ├── {id}/           (GET, PUT, DELETE)
│   ├── generate/       (POST)
│   ├── {id}/mark_paid/ (POST)
│   ├── unpaid/         (GET)
│   ├── paid/           (GET)
│   ├── by_period/      (GET)
│   └── overdue/        (GET)
├── notifications/      (GET)
│   ├── {id}/           (GET)
│   ├── send_bulk/      (POST)
│   └── by_bill/        (GET)
└── dashboard/          (GET)
```

## Quick Start Examples

### Authentication

#### Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

#### Register
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username":"newuser",
    "password":"secure123",
    "email":"user@example.com",
    "first_name":"John",
    "last_name":"Doe",
    "user_type":"staff"
  }'
```

### Consumer Management

#### List All Consumers
```bash
curl http://localhost:8000/api/consumers/ \
  -H "Cookie: sessionid=YOUR_SESSION_ID"
```

#### Create Consumer
```bash
curl -X POST http://localhost:8000/api/consumers/ \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionid=YOUR_SESSION_ID" \
  -d '{
    "first_name":"Juan",
    "middle_initial":"D",
    "last_name":"Dela Cruz",
    "contact_number":"09123456789",
    "address":"123 Main St",
    "meter_number":"MTR-001",
    "account_status":"active"
  }'
```

#### Get Unpaid Bills for Consumer
```bash
curl http://localhost:8000/api/consumers/1/unpaid_bills/ \
  -H "Cookie: sessionid=YOUR_SESSION_ID"
```

### Billing Operations

#### Generate Bill
```bash
curl -X POST http://localhost:8000/api/bills/generate/ \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionid=YOUR_SESSION_ID" \
  -d '{
    "consumer":1,
    "current_reading":1065.3,
    "previous_reading":1050.5,
    "billing_period":"2024-12",
    "due_date":"2025-01-10"
  }'
```

#### Get Unpaid Bills
```bash
curl http://localhost:8000/api/bills/unpaid/ \
  -H "Cookie: sessionid=YOUR_SESSION_ID"
```

#### Mark Bill as Paid
```bash
curl -X POST http://localhost:8000/api/bills/1/mark_paid/ \
  -H "Cookie: sessionid=YOUR_SESSION_ID"
```

### Dashboard

#### Get Statistics
```bash
curl http://localhost:8000/api/dashboard/ \
  -H "Cookie: sessionid=YOUR_SESSION_ID"
```

## Configuration

### Settings (`water_billing_system/settings.py`)

#### REST Framework Configuration
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}
```

#### CORS Configuration
```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:8000',
]
```

#### Twilio Configuration
Add to your `.env` file or settings:
```python
TWILIO_ACCOUNT_SID = 'your_account_sid'
TWILIO_AUTH_TOKEN = 'your_auth_token'
TWILIO_PHONE_NUMBER = '+1234567890'
```

## Features

### User Management
- ✅ User registration and login
- ✅ Role-based access (admin/staff)
- ✅ User profile management
- ✅ Session authentication

### Consumer Management
- ✅ Add/edit/delete consumers
- ✅ View consumer bills
- ✅ Filter by account status (active/disconnected)
- ✅ Contact number validation

### Meter Readings
- ✅ Record meter readings
- ✅ Automatic consumption calculation
- ✅ Query readings by consumer
- ✅ Get latest reading

### Billing
- ✅ Automatic bill generation
- ✅ Tiered pricing calculation
- ✅ Payment tracking
- ✅ Overdue bill identification
- ✅ Bill status management

### Notifications
- ✅ SMS notifications via Twilio
- ✅ Bulk notification sending
- ✅ Multiple notification types (bill, reminder, disconnection)
- ✅ Notification tracking and logging

### Dashboard
- ✅ Real-time statistics
- ✅ Collections tracking
- ✅ Monthly revenue charts
- ✅ Consumer and bill summaries

## Permissions

### Public Endpoints (No Auth Required)
- POST `/api/auth/login/`
- POST `/api/auth/register/`

### Authenticated User Endpoints (Any Logged-in User)
- GET `/api/consumers/`
- GET `/api/bills/`
- GET `/api/meter-readings/`
- GET `/api/notifications/`
- GET `/api/dashboard/`

### Admin/Staff Only Endpoints
- POST/PUT/DELETE `/api/consumers/`
- POST/PUT/DELETE `/api/bills/`
- POST/PUT/DELETE `/api/meter-readings/`
- POST `/api/notifications/send_bulk/`

## Error Handling

All errors follow a consistent format:

```json
{
    "success": false,
    "error": "Description of the error",
    "status_code": 400
}
```

Common error scenarios:
- Missing required fields: `400 Bad Request`
- Invalid credentials: `401 Unauthorized`
- Permission denied: `403 Forbidden`
- Resource not found: `404 Not Found`
- Server errors: `500 Internal Server Error`

## Database Models

### User
- Custom user model extending Django's AbstractUser
- Fields: username, email, first_name, last_name, user_type, contact_number

### Consumer
- consumer_id, first_name, middle_initial, last_name
- contact_number, address, meter_number (unique)
- account_status (active/disconnected)

### MeterReading
- reading_id, consumer, reading_date
- previous_reading, current_reading, consumption (auto-calculated)
- created_by, last_modified_by (audit fields)

### Bill
- bill_id, consumer, meter_reading
- billing_period, amount (auto-calculated), due_date
- status (unpaid/paid)
- created_by, last_modified_by (audit fields)

### Notification
- bill, notification_type (bill/reminder/disconnection)
- message, sent_at, sent_successfully

## Pricing Calculation

Water consumption is calculated as:
```
consumption = current_reading - previous_reading
```

Bill amount is calculated as:
```
if consumption <= 10 cubic meters:
    amount = ₱100 (base rate)
else:
    excess = consumption - 10
    amount = ₱100 + (excess * ₱10)
```

## Migration from Old System

If migrating from the old template-based views:

1. The old views in `billing/views.py` are still present for reference
2. New API views are in `billing/views_api.py`
3. All client applications should migrate to use `/api/` endpoints
4. Session authentication remains the same
5. Database schema is unchanged

## Future Enhancements

- [ ] Token-based authentication (JWT)
- [ ] Advanced filtering and search
- [ ] Export functionality (PDF, CSV)
- [ ] Payment gateway integration
- [ ] Real-time notifications (WebSockets)
- [ ] Rate limiting
- [ ] API versioning

## Troubleshooting

### Twilio Errors
If notifications fail to send:
1. Verify Twilio credentials in settings
2. Ensure consumer contact numbers are valid
3. Check Twilio account balance
4. Review notification logs in admin panel

### Authentication Issues
1. Ensure session cookie is being sent with requests
2. Verify user is logged in with correct credentials
3. Check user has appropriate role (admin/staff)

### Database Errors
1. Run migrations: `python manage.py migrate`
2. Check database is not locked
3. Verify database permissions

## Support & Documentation

- Full API documentation: See `API_DOCUMENTATION.md`
- Django REST Framework: https://www.django-rest-framework.org/
- Django Documentation: https://docs.djangoproject.com/
- Twilio Documentation: https://www.twilio.com/docs/

## License

This project is part of a Software Engineering course project.
