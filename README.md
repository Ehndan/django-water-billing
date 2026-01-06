# Barangay Mahayahay Water Billing System

## Overview

The **Barangay Mahayahay Water Billing System** is a comprehensive web-based application designed to streamline water utility billing, consumer management, and payment tracking for the barangay's water distribution system. Built with Django and modern web technologies, the system provides an intuitive interface for administrators and staff to manage consumers, generate bills, and send notifications.

## Features

### Consumer Management
- **Add/Edit/Delete Consumers** – Manage consumer profiles with contact information and meter numbers
- **Account Status Tracking** – Mark accounts as active or disconnected
- **Search & Filter** – Quickly locate consumers by name
- **Sortable Table** – Sort consumers by ID, name, contact, or status

### Billing System
- **Automated Bill Generation** – Create bills based on meter readings with tiered pricing
  - Base rate: ₱100 for first 10m³
  - ₱10 per additional 0.1m³
- **Billing History** – View and manage paid/unpaid bills
- **Bill Editing** – Modify readings, due dates, and status (admin only)
- **Bill Deletion** – Remove erroneous bills with cascade cleanup
- **Unique Constraints** – Prevent duplicate bills for the same consumer/period

### Payment Management
- **Mark Bills as Paid** – Update bill status with confirmation modal
- **Payment Tracking** – Monitor outstanding and paid amounts
- **Status Badges** – Visual indicators for paid/unpaid status

### Reporting & Analytics
- **Dashboard** – Real-time statistics on:
  - Total consumers and active connections
  - Outstanding bill count and total collections
  - 6-month revenue trend chart
- **Bill History Reports** – Track all paid transactions
- **Ongoing Bills View** – Monitor unpaid bills by due date

### Printing & Notifications
- **Batch Print** – Print multiple bills for a selected billing period
- **Individual Print** – Print specific customer bills
- **SMS Simulation** – Send notifications via Twilio API
- **Notification Types:**
  - New Bill Notice
  - Payment Reminder
  - Disconnection Notice

### User Authentication
- **Role-Based Access** – Admin and Staff user types
- **Login/Logout** – Secure session management
- **Protected Routes** – Login-required for all protected pages
- **Permissions** – Admin-only actions for sensitive operations

## Technology Stack

- **Backend:** Django 4.2 (Python)
- **Database:** SQLite (development) / PostgreSQL (recommended for production)
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Icons:** Font Awesome 6
- **Responsive Design:** Mobile-friendly CSS Grid & Flexbox

## Installation & Setup

### Prerequisites
- Python 3.8+
- pip or conda
- Git

### Steps

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd django-water-billing-master
   ```

2. **Create Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Settings**
   - Edit `water_billing_system/settings.py`:
     - Set `DEBUG = False` for production
     - Update `ALLOWED_HOSTS`
     - Configure email backend (optional for notifications)

5. **Run Migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Create Superuser**
   ```bash
   python manage.py createsuperuser
   ```

7. **Run Development Server**
   ```bash
   python manage.py runserver
   ```
   Access at `http://127.0.0.1:8000`

## Usage Guide

### For Administrators
1. **Login** with admin credentials
2. **Manage Consumers** – Add, edit, or delete consumer accounts
3. **Generate Bills** – Create monthly bills with meter readings
4. **Track Payments** – Mark bills as paid, monitor collections
5. **Send Notifications** – Bulk email/SMS to unpaid accounts
6. **View Reports** – Check dashboard for trends and statistics

### For Staff
1. **Login** with staff credentials
2. **View Bills** – Access ongoing and historical bills
3. **Print Bills** – Generate batch or individual bill printouts
4. **Consumer Info** – Look up consumer details and billing history
5. **Track Status** – Monitor outstanding bills (read-only for most operations)

## SMS Configuration

   **For Twilio SMS (if budget available):**
   ```python
   TWILIO_ACCOUNT_SID = 'your-account-sid'
   TWILIO_AUTH_TOKEN = 'your-auth-token'
   TWILIO_PHONE_NUMBER = '+1234567890'
   ```

## File Structure

```
django-water-billing-master/
├── billing/                    # Main Django app
│   ├── models.py              # Database models
│   ├── views.py               # Business logic
│   ├── urls.py                # URL routing
│   ├── admin.py               # Django admin config
│   ├── migrations/            # Database migrations
│   └── templatetags/          # Custom template filters
├── templates/                  # HTML templates
│   ├── base.html              # Base layout
│   ├── dashboard.html         # Admin dashboard
│   ├── ongoing_bills.html     # Unpaid bills management
│   ├── bill_history.html      # Paid bills archive
│   ├── consumers.html         # Consumer management
│   ├── send_notifications.html # Bulk notification form
│   └── ...
├── static/                     # Static files
│   ├── css/                   # Stylesheets
│   ├── js/                    # JavaScript files
│   └── images/                # Logo & assets
├── water_billing_system/      # Django settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── manage.py                  # Django CLI
├── requirements.txt           # Python dependencies
└── README.md                  # This file
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/dashboard/` | GET | Admin dashboard |
| `/bills/ongoing/` | GET | Unpaid bills list |
| `/bills/history/` | GET | Paid bills archive |
| `/consumers/` | GET | Consumer list |
| `/consumers/add/` | POST | Create consumer |
| `/consumers/edit/<id>/` | POST | Update consumer |
| `/consumers/delete/<id>/` | POST | Delete consumer |
| `/bills/generate/` | POST | Create bill |
| `/bills/mark-paid/<id>/` | POST | Mark bill as paid |
| `/bills/print/` | POST/GET | Print bills |
| `/notifications/send/` | POST | Send bulk notifications |

## Troubleshooting

### Bills Not Appearing
- Verify consumer exists and has active status
- Check billing period matches the month
- Ensure meter readings have valid current > previous

### Notifications Not Sending
- Check email backend configuration in `settings.py`
- For console mode: check Django runserver terminal output
- Verify consumer contact numbers are valid

### Permission Denied Errors
- Ensure user is logged in with admin/superuser role
- Check admin/staff status in user profile

## Support & Maintenance

For issues, bugs, or feature requests, contact the development team or file an issue in the repository.

---

**Developed for:** Barangay Mahayahay
**Version:** 1.0.0
**Last Updated:** December 2025
