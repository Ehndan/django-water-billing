"""
Simple API test script to verify all endpoints are working.

Run this script after starting the development server:
python manage.py runserver

Then in another terminal:
python test_api.py
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = 'http://localhost:8000/api'
SESSION = requests.Session()

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'
BLUE = '\033[94m'


def print_section(title):
    """Print section header."""
    print(f"\n{BLUE}{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}{RESET}\n")


def print_result(test_name, success, message=''):
    """Print test result."""
    status = f"{GREEN}✓ PASS{RESET}" if success else f"{RED}✗ FAIL{RESET}"
    print(f"[{status}] {test_name}")
    if message:
        print(f"      {YELLOW}{message}{RESET}")


def test_authentication():
    """Test authentication endpoints."""
    print_section("Testing Authentication")
    
    # Test login
    login_data = {
        'username': 'admin',
        'password': 'admin'  # Change this to actual password
    }
    
    response = SESSION.post(
        f'{BASE_URL}/auth/login/',
        json=login_data
    )
    
    success = response.status_code == 200
    print_result("Login", success, f"Status: {response.status_code}")
    
    if not success:
        print(f"      {RED}Error: {response.text}{RESET}")
        return False
    
    return True


def test_consumers(authenticated=True):
    """Test consumer endpoints."""
    print_section("Testing Consumer Endpoints")
    
    if not authenticated:
        print_result("List Consumers", False, "Not authenticated")
        return
    
    # Test list consumers
    response = SESSION.get(f'{BASE_URL}/consumers/')
    success = response.status_code == 200
    print_result("List Consumers", success, f"Status: {response.status_code}")
    
    if success:
        data = response.json()
        print(f"      Found {data.get('count', 0)} consumers")
    
    # Test get active consumers
    response = SESSION.get(f'{BASE_URL}/consumers/active/')
    success = response.status_code == 200
    print_result("Get Active Consumers", success, f"Status: {response.status_code}")
    
    # Test create consumer (if authenticated as admin)
    consumer_data = {
        'first_name': 'Test',
        'middle_initial': 'T',
        'last_name': 'User',
        'contact_number': '09123456789',
        'address': '123 Test Street',
        'meter_number': f'TST-{datetime.now().timestamp()}',
        'account_status': 'active'
    }
    
    response = SESSION.post(
        f'{BASE_URL}/consumers/',
        json=consumer_data
    )
    success = response.status_code in [200, 201]
    print_result("Create Consumer", success, f"Status: {response.status_code}")
    
    if success:
        consumer = response.json()
        print(f"      Created consumer ID: {consumer.get('consumer_id')}")
        return consumer.get('consumer_id')
    
    return None


def test_bills(consumer_id=None):
    """Test bill endpoints."""
    print_section("Testing Bill Endpoints")
    
    if not consumer_id:
        print(f"{YELLOW}Skipping bill tests - no consumer ID{RESET}")
        return
    
    # Test list bills
    response = SESSION.get(f'{BASE_URL}/bills/')
    success = response.status_code == 200
    print_result("List Bills", success, f"Status: {response.status_code}")
    
    # Test get unpaid bills
    response = SESSION.get(f'{BASE_URL}/bills/unpaid/')
    success = response.status_code == 200
    print_result("Get Unpaid Bills", success, f"Status: {response.status_code}")
    
    # Test generate bill
    billing_period = datetime.now().strftime('%Y-%m')
    due_date = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
    
    bill_data = {
        'consumer': consumer_id,
        'current_reading': 1065.5,
        'previous_reading': 1050.0,
        'billing_period': billing_period,
        'due_date': due_date
    }
    
    response = SESSION.post(
        f'{BASE_URL}/bills/generate/',
        json=bill_data
    )
    success = response.status_code in [200, 201]
    print_result("Generate Bill", success, f"Status: {response.status_code}")
    
    if success:
        bill = response.json().get('bill', {})
        print(f"      Created bill ID: {bill.get('bill_id')}")
        return bill.get('bill_id')
    
    return None


def test_meter_readings(consumer_id=None):
    """Test meter reading endpoints."""
    print_section("Testing Meter Reading Endpoints")
    
    if not consumer_id:
        print(f"{YELLOW}Skipping meter reading tests - no consumer ID{RESET}")
        return
    
    # Test list meter readings
    response = SESSION.get(f'{BASE_URL}/meter-readings/')
    success = response.status_code == 200
    print_result("List Meter Readings", success, f"Status: {response.status_code}")
    
    # Test create meter reading
    reading_data = {
        'consumer': consumer_id,
        'reading_date': datetime.now().strftime('%Y-%m-%d'),
        'previous_reading': 1000.0,
        'current_reading': 1015.5
    }
    
    response = SESSION.post(
        f'{BASE_URL}/meter-readings/',
        json=reading_data
    )
    success = response.status_code in [200, 201]
    print_result("Create Meter Reading", success, f"Status: {response.status_code}")
    
    # Test get latest reading for consumer
    response = SESSION.get(
        f'{BASE_URL}/meter-readings/latest/?consumer_id={consumer_id}'
    )
    success = response.status_code == 200
    print_result("Get Latest Reading", success, f"Status: {response.status_code}")


def test_dashboard():
    """Test dashboard endpoint."""
    print_section("Testing Dashboard")
    
    response = SESSION.get(f'{BASE_URL}/dashboard/')
    success = response.status_code == 200
    print_result("Get Dashboard Stats", success, f"Status: {response.status_code}")
    
    if success:
        data = response.json()
        print(f"      Total Consumers: {data.get('total_consumers')}")
        print(f"      Active Bills: {data.get('active_bills')}")
        print(f"      Total Collections: ₱{data.get('total_collections')}")


def test_notifications():
    """Test notification endpoints."""
    print_section("Testing Notification Endpoints")
    
    response = SESSION.get(f'{BASE_URL}/notifications/')
    success = response.status_code == 200
    print_result("List Notifications", success, f"Status: {response.status_code}")


def main():
    """Run all tests."""
    print(f"\n{BLUE}{'='*60}")
    print("  Water Billing System - API Test Suite")
    print(f"{'='*60}{RESET}")
    print(f"Base URL: {BASE_URL}")
    
    # Test authentication
    authenticated = test_authentication()
    
    if not authenticated:
        print(f"\n{RED}Authentication failed. Cannot proceed with other tests.{RESET}")
        print("Make sure the development server is running and credentials are correct.")
        return
    
    # Test other endpoints
    consumer_id = test_consumers(authenticated)
    bill_id = test_bills(consumer_id)
    test_meter_readings(consumer_id)
    test_dashboard()
    test_notifications()
    
    print_section("Test Summary")
    print(f"{GREEN}All available endpoints tested!{RESET}\n")
    print("Note: Some tests may fail if:")
    print("  1. No admin account exists (create with: python manage.py createsuperuser)")
    print("  2. Database is not migrated (run: python manage.py migrate)")
    print("  3. Development server is not running (python manage.py runserver)")


if __name__ == '__main__':
    main()
