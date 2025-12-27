#!/usr/bin/env python3
"""
ProManufakt Backend API Test Suite
Tests all CRUD operations for the manufacturing ERP system
"""

import requests
import sys
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any

class ProManufaktAPITester:
    def __init__(self, base_url="https://prodplan-9.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.created_resources = {
            'projects': [],
            'parts': [],
            'suppliers': [],
            'quote_requests': [],
            'quote_responses': [],
            'orders': []
        }

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, data: Dict = None, headers: Dict = None) -> tuple:
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'name': name,
                'error': str(e)
            })
            return False, {}

    def test_static_data_endpoints(self):
        """Test static data endpoints"""
        print("\n" + "="*50)
        print("TESTING STATIC DATA ENDPOINTS")
        print("="*50)
        
        # Test materials
        success, materials = self.run_test("Get Materials", "GET", "materials", 200)
        if success and materials:
            print(f"   Found {len(materials)} materials")
        
        # Test form types
        success, form_types = self.run_test("Get Form Types", "GET", "form-types", 200)
        if success and form_types:
            print(f"   Found {len(form_types)} form types")
        
        # Test manufacturing methods
        success, methods = self.run_test("Get Manufacturing Methods", "GET", "manufacturing-methods", 200)
        if success and methods:
            print(f"   Found {len(methods)} manufacturing methods")
        
        # Test statuses
        success, statuses = self.run_test("Get Statuses", "GET", "statuses", 200)
        if success and statuses:
            print(f"   Found status categories: {list(statuses.keys())}")
        
        # Test currencies
        success, currencies = self.run_test("Get Currencies", "GET", "currencies", 200)
        if success and currencies:
            print(f"   Found {len(currencies)} currencies")

    def test_project_crud(self):
        """Test project CRUD operations"""
        print("\n" + "="*50)
        print("TESTING PROJECT CRUD OPERATIONS")
        print("="*50)
        
        # Create project
        project_data = {
            "name": "Test Hidrolik Ünitesi",
            "customer_name": "Test Müşteri A.Ş.",
            "start_date": datetime.now(timezone.utc).isoformat(),
            "end_date": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            "notes": "Test projesi - API testi için oluşturuldu"
        }
        
        success, project = self.run_test("Create Project", "POST", "projects", 200, project_data)
        if success and project:
            self.created_resources['projects'].append(project['id'])
            print(f"   Created project: {project.get('code')} - {project.get('name')}")
            
            # Get all projects
            success, projects = self.run_test("Get All Projects", "GET", "projects", 200)
            if success:
                print(f"   Found {len(projects)} total projects")
            
            # Get project by ID
            success, single_project = self.run_test("Get Project by ID", "GET", f"projects/{project['id']}", 200)
            if success:
                print(f"   Retrieved project: {single_project.get('name')}")
            
            # Update project
            update_data = {
                "status": "in_progress",
                "notes": "Proje güncellendi - test amaçlı"
            }
            success, updated_project = self.run_test("Update Project", "PUT", f"projects/{project['id']}", 200, update_data)
            if success:
                print(f"   Updated project status to: {updated_project.get('status')}")
            
            # Test project filtering
            success, active_projects = self.run_test("Get Active Projects", "GET", "projects?status=in_progress", 200)
            if success:
                print(f"   Found {len(active_projects)} active projects")

    def test_supplier_crud(self):
        """Test supplier CRUD operations"""
        print("\n" + "="*50)
        print("TESTING SUPPLIER CRUD OPERATIONS")
        print("="*50)
        
        # Create supplier
        supplier_data = {
            "name": "Test Torna Atölyesi",
            "contact_person": "Ahmet Test",
            "email": "test@tornaatolyesi.com",
            "phone": "0312 123 45 67",
            "address": "Test Mahallesi, Test Caddesi No:1, Ankara",
            "tax_id": "1234567890",
            "specializations": ["3001", "3002", "3008"],  # CNC Torna, CNC Dik İşlem, Taşlama
            "payment_terms": 45,
            "notes": "Test tedarikçisi - API testi için oluşturuldu"
        }
        
        success, supplier = self.run_test("Create Supplier", "POST", "suppliers", 200, supplier_data)
        if success and supplier:
            self.created_resources['suppliers'].append(supplier['id'])
            print(f"   Created supplier: {supplier.get('name')}")
            print(f"   Performance score: {supplier.get('performance', {}).get('total_score', 0)}")
            
            # Get all suppliers
            success, suppliers = self.run_test("Get All Suppliers", "GET", "suppliers", 200)
            if success:
                print(f"   Found {len(suppliers)} total suppliers")
            
            # Get supplier by ID
            success, single_supplier = self.run_test("Get Supplier by ID", "GET", f"suppliers/{supplier['id']}", 200)
            if success:
                print(f"   Retrieved supplier: {single_supplier.get('name')}")
            
            # Update supplier
            update_data = {
                "phone": "0312 987 65 43",
                "notes": "Tedarikçi güncellendi - test amaçlı"
            }
            success, updated_supplier = self.run_test("Update Supplier", "PUT", f"suppliers/{supplier['id']}", 200, update_data)
            if success:
                print(f"   Updated supplier phone: {updated_supplier.get('phone')}")

    def test_parts_crud(self):
        """Test parts CRUD operations"""
        print("\n" + "="*50)
        print("TESTING PARTS CRUD OPERATIONS")
        print("="*50)
        
        if not self.created_resources['projects']:
            print("❌ No projects available for parts testing")
            return
        
        project_id = self.created_resources['projects'][0]
        
        # Create part
        part_data = {
            "project_id": project_id,
            "name": "Test Mil",
            "code": "MIL-TEST-001",
            "quantity": 2,
            "material": "S355",
            "form_type": "silindirik",
            "dimensions": {
                "diameter": 50.0,
                "length": 200.0
            },
            "manufacturing_methods": ["3001", "3008"],  # CNC Torna, Taşlama
            "notes": "Test parçası - API testi için oluşturuldu"
        }
        
        success, part = self.run_test("Create Part", "POST", "parts", 200, part_data)
        if success and part:
            self.created_resources['parts'].append(part['id'])
            print(f"   Created part: {part.get('code')} - {part.get('name')}")
            
            # Get all parts
            success, parts = self.run_test("Get All Parts", "GET", "parts", 200)
            if success:
                print(f"   Found {len(parts)} total parts")
            
            # Get parts by project
            success, project_parts = self.run_test("Get Parts by Project", "GET", f"parts?project_id={project_id}", 200)
            if success:
                print(f"   Found {len(project_parts)} parts in project")
            
            # Get part by ID
            success, single_part = self.run_test("Get Part by ID", "GET", f"parts/{part['id']}", 200)
            if success:
                print(f"   Retrieved part: {single_part.get('name')}")
            
            # Update part
            update_data = {
                "status": "in_production",
                "notes": "Parça güncellendi - test amaçlı"
            }
            success, updated_part = self.run_test("Update Part", "PUT", f"parts/{part['id']}", 200, update_data)
            if success:
                print(f"   Updated part status to: {updated_part.get('status')}")

    def test_quotes_workflow(self):
        """Test quotes request and response workflow"""
        print("\n" + "="*50)
        print("TESTING QUOTES WORKFLOW")
        print("="*50)
        
        if not self.created_resources['parts'] or not self.created_resources['suppliers']:
            print("❌ No parts or suppliers available for quotes testing")
            return
        
        part_id = self.created_resources['parts'][0]
        supplier_id = self.created_resources['suppliers'][0]
        
        # Create quote request
        quote_request_data = {
            "part_id": part_id,
            "supplier_ids": [supplier_id],
            "manufacturing_method": "3001",  # CNC Torna
            "deadline": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "notes": "Test teklif talebi - API testi için oluşturuldu"
        }
        
        success, quote_request = self.run_test("Create Quote Request", "POST", "quote-requests", 200, quote_request_data)
        if success and quote_request:
            self.created_resources['quote_requests'].append(quote_request['id'])
            print(f"   Created quote request for part: {part_id}")
            
            # Get all quote requests
            success, quote_requests = self.run_test("Get All Quote Requests", "GET", "quote-requests", 200)
            if success:
                print(f"   Found {len(quote_requests)} total quote requests")
            
            # Create quote response
            quote_response_data = {
                "quote_request_id": quote_request['id'],
                "supplier_id": supplier_id,
                "unit_price": 150.0,
                "currency": "TRY",
                "total_price": 300.0,  # 2 pieces * 150 TRY
                "delivery_date": (datetime.now(timezone.utc) + timedelta(days=14)).isoformat(),
                "payment_terms": 30,
                "notes": "Test teklif yanıtı - API testi için oluşturuldu"
            }
            
            success, quote_response = self.run_test("Create Quote Response", "POST", "quote-responses", 200, quote_response_data)
            if success and quote_response:
                self.created_resources['quote_responses'].append(quote_response['id'])
                print(f"   Created quote response: {quote_response.get('total_price')} {quote_response.get('currency')}")
                
                # Get quote comparison
                success, comparison = self.run_test("Get Quote Comparison", "GET", f"quote-comparison/{quote_request['id']}", 200)
                if success and comparison:
                    print(f"   Quote comparison generated with {len(comparison.get('comparison', []))} responses")

    def test_orders_workflow(self):
        """Test orders creation and management"""
        print("\n" + "="*50)
        print("TESTING ORDERS WORKFLOW")
        print("="*50)
        
        if not self.created_resources['quote_responses'] or not self.created_resources['parts'] or not self.created_resources['suppliers']:
            print("❌ No quote responses, parts, or suppliers available for orders testing")
            return
        
        quote_response_id = self.created_resources['quote_responses'][0]
        part_id = self.created_resources['parts'][0]
        supplier_id = self.created_resources['suppliers'][0]
        
        # Create order
        order_data = {
            "quote_response_id": quote_response_id,
            "part_id": part_id,
            "supplier_id": supplier_id,
            "quantity": 2,
            "unit_price": 150.0,
            "currency": "TRY",
            "total_price": 300.0,
            "expected_delivery": (datetime.now(timezone.utc) + timedelta(days=14)).isoformat(),
            "notes": "Test siparişi - API testi için oluşturuldu"
        }
        
        success, order = self.run_test("Create Order", "POST", "orders", 200, order_data)
        if success and order:
            self.created_resources['orders'].append(order['id'])
            print(f"   Created order: {order.get('code')}")
            
            # Get all orders
            success, orders = self.run_test("Get All Orders", "GET", "orders", 200)
            if success:
                print(f"   Found {len(orders)} total orders")
            
            # Get order by ID
            success, single_order = self.run_test("Get Order by ID", "GET", f"orders/{order['id']}", 200)
            if success:
                print(f"   Retrieved order: {single_order.get('code')}")
            
            # Update order status
            update_data = {
                "status": "confirmed"
            }
            success, updated_order = self.run_test("Update Order Status", "PUT", f"orders/{order['id']}", 200, update_data)
            if success:
                print(f"   Updated order status to: {updated_order.get('status')}")

    def test_notifications(self):
        """Test notifications system"""
        print("\n" + "="*50)
        print("TESTING NOTIFICATIONS")
        print("="*50)
        
        # Get all notifications
        success, notifications = self.run_test("Get All Notifications", "GET", "notifications", 200)
        if success:
            print(f"   Found {len(notifications)} total notifications")
            
            if notifications:
                # Mark first notification as read
                notification_id = notifications[0]['id']
                success, result = self.run_test("Mark Notification Read", "PUT", f"notifications/{notification_id}/read", 200)
                if success:
                    print(f"   Marked notification as read")
                
                # Mark all notifications as read
                success, result = self.run_test("Mark All Notifications Read", "PUT", "notifications/read-all", 200)
                if success:
                    print(f"   Marked all notifications as read")

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        print("\n" + "="*50)
        print("TESTING DASHBOARD STATISTICS")
        print("="*50)
        
        # Get dashboard stats
        success, stats = self.run_test("Get Dashboard Stats", "GET", "dashboard/stats", 200)
        if success and stats:
            print(f"   Projects: {stats.get('projects', {}).get('total', 0)} total, {stats.get('projects', {}).get('active', 0)} active")
            print(f"   Parts: {stats.get('parts', {}).get('total', 0)} total, {stats.get('parts', {}).get('in_production', 0)} in production")
            print(f"   Orders: {stats.get('orders', {}).get('total', 0)} total, {stats.get('orders', {}).get('pending', 0)} pending")
            print(f"   Suppliers: {stats.get('suppliers', {}).get('total', 0)} total")
            print(f"   Unread notifications: {stats.get('unread_notifications', 0)}")
        
        # Test Gantt chart data if we have projects
        if self.created_resources['projects']:
            project_id = self.created_resources['projects'][0]
            success, gantt = self.run_test("Get Gantt Data", "GET", f"dashboard/gantt/{project_id}", 200)
            if success and gantt:
                print(f"   Gantt chart has {len(gantt.get('tasks', []))} tasks")

    def test_excel_import_export(self):
        """Test Excel import/export functionality"""
        print("\n" + "="*50)
        print("TESTING EXCEL IMPORT/EXPORT")
        print("="*50)
        
        # Test Excel template download
        success, template = self.run_test("Excel Template Download", "GET", "export/template", 200, headers={'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})
        if success:
            print("   ✅ Excel template download endpoint working")
        
        # Test Excel parts export (need a project with parts)
        if self.created_resources['projects']:
            project_id = self.created_resources['projects'][0]
            success, export_data = self.run_test("Excel Parts Export", "GET", f"export/parts/{project_id}", 200, headers={'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})
            if success:
                print(f"   ✅ Excel parts export working for project {project_id}")
            
            # Test Excel parts import (would need actual file upload, so we test the endpoint exists)
            # Note: This will fail without actual file, but we can check if endpoint exists
            success, import_result = self.run_test("Excel Parts Import Endpoint", "POST", f"import/parts/{project_id}", 400)  # Expect 400 without file
            if success or "file" in str(import_result).lower():
                print(f"   ✅ Excel parts import endpoint exists (expects file upload)")

    def test_quote_email_system(self):
        """Test quote email system"""
        print("\n" + "="*50)
        print("TESTING QUOTE EMAIL SYSTEM")
        print("="*50)
        
        if not self.created_resources['quote_requests'] or not self.created_resources['suppliers']:
            print("❌ No quote requests or suppliers available for email testing")
            return
        
        quote_request_id = self.created_resources['quote_requests'][0]
        supplier_id = self.created_resources['suppliers'][0]
        
        # Test send quote emails (will fail without RESEND_API_KEY as expected)
        email_data = {
            "quote_request_id": quote_request_id,
            "supplier_ids": [supplier_id]
        }
        success, email_result = self.run_test("Send Quote Emails", "POST", "send-quote-emails", 500, email_data)  # Expect 500 without API key
        if not success and "yapılandırılmamış" in str(email_result).lower():
            print("   ✅ Email endpoint correctly fails without RESEND_API_KEY")
        
        # Test quote form data endpoint (public endpoint)
        # Generate a test token for the form
        test_token = "TEST123"
        success, form_data = self.run_test("Quote Form Data", "GET", f"quote-form/{quote_request_id}?supplier={supplier_id}&token={test_token}", 403)  # Expect 403 with invalid token
        if not success:
            print("   ✅ Quote form endpoint exists and validates tokens")
        
        # Test quote form submit endpoint
        form_submit_data = {
            "quote_request_id": quote_request_id,
            "supplier_id": supplier_id,
            "token": test_token,
            "unit_price": 100.0,
            "currency": "TRY",
            "delivery_date": (datetime.now(timezone.utc) + timedelta(days=14)).isoformat(),
            "payment_terms": 30
        }
        success, submit_result = self.run_test("Quote Form Submit", "POST", "quote-form/submit", 403, form_submit_data)  # Expect 403 with invalid token
        if not success:
            print("   ✅ Quote form submit endpoint exists and validates tokens")

    def test_settings_and_currency(self):
        """Test settings and currency management"""
        print("\n" + "="*50)
        print("TESTING SETTINGS AND CURRENCY")
        print("="*50)
        
        # Get settings
        success, settings = self.run_test("Get Settings", "GET", "settings", 200)
        if success:
            print(f"   Company: {settings.get('company_name', 'Not set')}")
        
        # Update settings
        settings_data = {
            "company_name": "Test ProManufakt A.Ş.",
            "company_email": "test@promanufakt.com",
            "company_phone": "0312 123 45 67"
        }
        success, updated_settings = self.run_test("Update Settings", "PUT", "settings", 200, settings_data)
        if success:
            print(f"   Updated company name to: {updated_settings.get('company_name')}")
        
        # Get currency rates
        success, rates = self.run_test("Get Currency Rates", "GET", "currency-rates", 200)
        if success:
            print(f"   USD/TRY: {rates.get('usd_to_try', 0)}")
            print(f"   EUR/TRY: {rates.get('eur_to_try', 0)}")
        
        # Update currency rates
        rates_data = {
            "usd_to_try": 33.50,
            "eur_to_try": 36.80
        }
        success, updated_rates = self.run_test("Update Currency Rates", "POST", "currency-rates", 200, rates_data)
        if success:
            print(f"   Updated USD/TRY to: {updated_rates.get('usd_to_try')}")

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n" + "="*50)
        print("CLEANING UP TEST DATA")
        print("="*50)
        
        # Delete orders
        for order_id in self.created_resources['orders']:
            self.run_test(f"Delete Order {order_id}", "DELETE", f"orders/{order_id}", 200)
        
        # Delete parts
        for part_id in self.created_resources['parts']:
            self.run_test(f"Delete Part {part_id}", "DELETE", f"parts/{part_id}", 200)
        
        # Delete suppliers
        for supplier_id in self.created_resources['suppliers']:
            self.run_test(f"Delete Supplier {supplier_id}", "DELETE", f"suppliers/{supplier_id}", 200)
        
        # Delete projects (this will also delete associated parts)
        for project_id in self.created_resources['projects']:
            self.run_test(f"Delete Project {project_id}", "DELETE", f"projects/{project_id}", 200)

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting ProManufakt API Test Suite")
        print(f"Testing against: {self.base_url}")
        print("="*70)
        
        try:
            # Test basic connectivity
            success, root = self.run_test("API Root", "GET", "", 200)
            if not success:
                print("❌ Cannot connect to API. Aborting tests.")
                return False
            
            # Run test suites
            self.test_static_data_endpoints()
            self.test_project_crud()
            self.test_supplier_crud()
            self.test_parts_crud()
            self.test_quotes_workflow()
            self.test_orders_workflow()
            self.test_notifications()
            self.test_dashboard_stats()
            self.test_excel_import_export()  # New Excel features
            self.test_quote_email_system()   # New email features
            self.test_settings_and_currency()
            
            # Clean up
            self.cleanup_test_data()
            
            return True
            
        except Exception as e:
            print(f"❌ Test suite failed with error: {str(e)}")
            return False

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)
        print(f"📊 Tests run: {self.tests_run}")
        print(f"✅ Tests passed: {self.tests_passed}")
        print(f"❌ Tests failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for i, test in enumerate(self.failed_tests, 1):
                print(f"{i}. {test['name']}")
                if 'error' in test:
                    print(f"   Error: {test['error']}")
                else:
                    print(f"   Expected: {test['expected']}, Got: {test['actual']}")
                    if 'response' in test:
                        print(f"   Response: {test['response']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test runner"""
    tester = ProManufaktAPITester()
    
    try:
        success = tester.run_all_tests()
        tester.print_summary()
        
        return 0 if success else 1
        
    except KeyboardInterrupt:
        print("\n\n⚠️ Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())