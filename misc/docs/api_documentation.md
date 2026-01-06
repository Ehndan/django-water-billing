# Water Billing System API Documentation

## Overview
The Water Billing System provides a comprehensive RESTful API for managing water billing operations, consumer accounts, meter readings, and notifications.

## Base URL
```
http://localhost:8000/api/
```

## Authentication
All endpoints (except login/register) require authentication using Django Session Authentication.

### Authentication Endpoints

#### Login
```
POST /api/auth/login/
```
**Request:**
```json
{
    "username": "your_username",
    "password": "your_password"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Logged in successfully",
    "user": {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "first_name": "Admin",
        "last_name": "User",
        "user_type": "admin",
        "contact_number": "09123456789",
        "is_active": true,
        "is_staff": true,
        "date_joined": "2024-12-21T00:00:00Z"
    }
}
```

#### Register
```
POST /api/auth/register/
```
**Request:**
```json
{
    "username": "new_user",
    "password": "secure_password",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "user_type": "staff",
    "contact_number": "09123456789"
}
```

#### Logout
```
POST /api/auth/logout/
```

---

## Consumer Endpoints

### List All Consumers
```
GET /api/consumers/
```
**Query Parameters:**
- `search`: Search by first_name, last_name, meter_number, contact_number
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)

**Response:**
```json
{
    "count": 50,
    "next": "http://localhost:8000/api/consumers/?page=2",
    "previous": null,
    "results": [
        {
            "consumer_id": 1,
            "first_name": "Juan",
            "middle_initial": "D",
            "last_name": "Dela Cruz",
            "full_name": "Juan D. Dela Cruz",
            "contact_number": "09123456789",
            "address": "123 Main St, Barangay",
            "meter_number": "MTR-001",
            "account_status": "active",
            "bills_count": 12,
            "unpaid_bills_count": 2,
            "created_at": "2024-12-21T00:00:00Z",
            "updated_at": "2024-12-21T00:00:00Z"
        }
    ]
}
```

### Get Consumer Details
```
GET /api/consumers/{consumer_id}/
```

### Create Consumer
```
POST /api/consumers/
```
**Request:**
```json
{
    "first_name": "Maria",
    "middle_initial": "S",
    "last_name": "Santos",
    "contact_number": "09987654321",
    "address": "456 Oak St, Barangay",
    "meter_number": "MTR-002",
    "account_status": "active"
}
```

### Update Consumer
```
PUT /api/consumers/{consumer_id}/
PATCH /api/consumers/{consumer_id}/
```

### Delete Consumer
```
DELETE /api/consumers/{consumer_id}/
```
*Admin only*

### Get Consumer's Bills
```
GET /api/consumers/{consumer_id}/bills/
```

### Get Consumer's Unpaid Bills
```
GET /api/consumers/{consumer_id}/unpaid_bills/
```

### Get Active Consumers
```
GET /api/consumers/active/
```

### Get Disconnected Consumers
```
GET /api/consumers/disconnected/
```

---

## Meter Reading Endpoints

### List All Meter Readings
```
GET /api/meter-readings/
```

### Get Meter Reading Details
```
GET /api/meter-readings/{reading_id}/
```

### Create Meter Reading
```
POST /api/meter-readings/
```
**Request:**
```json
{
    "consumer": 1,
    "reading_date": "2024-12-21",
    "previous_reading": 1050.5,
    "current_reading": 1065.3
}
```

### Update Meter Reading
```
PUT /api/meter-readings/{reading_id}/
PATCH /api/meter-readings/{reading_id}/
```

### Get Readings for Specific Consumer
```
GET /api/meter-readings/by_consumer/?consumer_id=1
```

### Get Latest Reading for Consumer
```
GET /api/meter-readings/latest/?consumer_id=1
```

---

## Bill Endpoints

### List All Bills
```
GET /api/bills/
```

### Get Bill Details
```
GET /api/bills/{bill_id}/
```

### Generate New Bill
```
POST /api/bills/generate/
```
**Request:**
```json
{
    "consumer": 1,
    "current_reading": 1065.3,
    "previous_reading": 1050.5,
    "billing_period": "2024-12",
    "due_date": "2025-01-10"
}
```

### Mark Bill as Paid
```
POST /api/bills/{bill_id}/mark_paid/
```

### Get Unpaid Bills
```
GET /api/bills/unpaid/
```

### Get Paid Bills
```
GET /api/bills/paid/
```

### Get Bills by Period
```
GET /api/bills/by_period/?period=2024-12
```

### Get Overdue Bills
```
GET /api/bills/overdue/
```

### Update Bill
```
PUT /api/bills/{bill_id}/
PATCH /api/bills/{bill_id}/
```
*Admin only*

### Delete Bill
```
DELETE /api/bills/{bill_id}/
```
*Admin only*

---

## Notification Endpoints

### List All Notifications
```
GET /api/notifications/
```

### Get Notification Details
```
GET /api/notifications/{notification_id}/
```

### Send Bulk Notifications
```
POST /api/notifications/send_bulk/
```
**Request:**
```json
{
    "billing_period": "2024-12",
    "notification_type": "bill"
}
```
**Notification Types:**
- `bill`: New bill notification
- `reminder`: Payment reminder
- `disconnection`: Disconnection notice

**Response:**
```json
{
    "success": true,
    "message": "Notifications sent. Success: 45, Failed: 2",
    "sent_count": 45,
    "failed_count": 2
}
```

### Get Notifications for Specific Bill
```
GET /api/notifications/by_bill/?bill_id=1
```

---

## Dashboard Endpoint

### Get Dashboard Statistics
```
GET /api/dashboard/
```

**Response:**
```json
{
    "success": true,
    "total_consumers": 500,
    "active_bills": 145,
    "connected_meters": 480,
    "total_collections": 125450.50,
    "monthly_collections": [
        {
            "month": "Oct 2024",
            "total": 40250.75
        },
        {
            "month": "Nov 2024",
            "total": 42800.25
        },
        {
            "month": "Dec 2024",
            "total": 42399.50
        }
    ]
}
```

---

## Error Responses

### Standard Error Format
```json
{
    "success": false,
    "error": "Error message describing what went wrong",
    "status_code": 400
}
```

### Common HTTP Status Codes
- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Pagination

List endpoints support pagination with the following parameters:
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)

**Response includes:**
- `count`: Total number of results
- `next`: URL to next page
- `previous`: URL to previous page
- `results`: Array of results

---

## Filtering & Searching

### Search
Use the `search` parameter to filter by multiple fields:
```
GET /api/consumers/?search=juan
```

### Ordering
Use the `ordering` parameter to sort results:
```
GET /api/bills/?ordering=-billing_period
```

Use `-` prefix for descending order.

---

## Rate Limiting
Currently no rate limiting is applied. This may be added in future versions.

---

## API Version
Current Version: 1.0.0

## Support
For issues or questions, please contact the development team.
