# Quick Start Guide - Water Billing API

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Run Migrations
```bash
python manage.py migrate
```

### Step 3: Create Admin Account
```bash
python manage.py createsuperuser
# Enter username, email, password when prompted
```

### Step 4: Start Development Server
```bash
python manage.py runserver
```

### Step 5: Access API
Open browser: `http://localhost:8000/api/`

---

## 📖 API Quick Reference

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"yourpassword"}'
```

### List Consumers
```bash
curl http://localhost:8000/api/consumers/ \
  -H "Cookie: sessionid=YOUR_SESSION_ID"
```

### Create Consumer
```bash
curl -X POST http://localhost:8000/api/consumers/ \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionid=YOUR_SESSION_ID" \
  -d '{
    "first_name":"Juan",
    "last_name":"Dela Cruz",
    "contact_number":"09123456789",
    "address":"123 Main St",
    "meter_number":"MTR-001",
    "account_status":"active"
  }'
```

### Generate Bill
```bash
curl -X POST http://localhost:8000/api/bills/generate/ \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionid=YOUR_SESSION_ID" \
  -d '{
    "consumer":1,
    "current_reading":1065.5,
    "previous_reading":1050.0,
    "billing_period":"2024-12",
    "due_date":"2025-01-10"
  }'
```

### Get Dashboard Stats
```bash
curl http://localhost:8000/api/dashboard/ \
  -H "Cookie: sessionid=YOUR_SESSION_ID"
```

---

## 📱 Using Postman or Insomnia

1. **Create Collection** for "Water Billing API"
2. **Set Base URL** to `http://localhost:8000/api`
3. **Add Requests:**
   - POST `/auth/login/` - Login first
   - GET `/consumers/` - List consumers
   - POST `/consumers/` - Create consumer
   - POST `/bills/generate/` - Generate bill
   - POST `/bills/{id}/mark_paid/` - Mark paid
   - GET `/dashboard/` - Stats

---

## 🧪 Automated Testing

Run the test script:
```bash
python test_api.py
```

---

## 📚 Full Documentation

- **API Endpoints:** See `API_DOCUMENTATION.md`
- **Setup Details:** See `DRF_SETUP.md`
- **Conversion Info:** See `CONVERSION_SUMMARY.md`

---

## 🔧 Environment Configuration

Create `.env` file (or copy from `.env.example`):
```
DEBUG=True
TWILIO_ACCOUNT_SID=your_id
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 💡 Common Tasks

### Add New Consumer
1. Login at `/api/auth/login/`
2. POST to `/api/consumers/` with consumer data

### Create Bills
1. Ensure consumer exists
2. Add meter readings via `/api/meter-readings/`
3. Generate bill via `/api/bills/generate/`

### Send Notifications
1. POST to `/api/notifications/send_bulk/` with:
   - `billing_period`: "2024-12"
   - `notification_type`: "bill" | "reminder" | "disconnection"

### Check Unpaid Bills
```
GET /api/bills/unpaid/
```

### Mark Bill as Paid
```
POST /api/bills/{bill_id}/mark_paid/
```

---

## 🐛 Troubleshooting

### "ModuleNotFoundError" errors
```bash
pip install -r requirements.txt
```

### Database errors
```bash
python manage.py migrate
```

### "Permission denied" errors
- Ensure logged in with admin account
- Check user has `admin` or `staff` role

### Twilio SMS not sending
- Verify credentials in `.env` or settings
- Check consumer contact numbers are valid
- Verify Twilio account has credits

---

## 📞 Support

For detailed information, see the documentation files:
- `API_DOCUMENTATION.md` - Complete API reference
- `DRF_SETUP.md` - Setup and configuration
- `CONVERSION_SUMMARY.md` - What was changed

---

## ✨ What's New

✅ Full REST API at `/api/`
✅ 40+ endpoints for all operations
✅ Better error handling and validation
✅ Permission-based access control
✅ Comprehensive documentation
✅ Automated testing script
✅ CORS support for frontend integration
✅ Cleaner, more maintainable code

---

**You're all set! 🎉 Start building amazing things with the Water Billing API!**
