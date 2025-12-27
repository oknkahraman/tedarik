#!/usr/bin/env python3
"""
ProManufakt File Upload API Test
Tests the new file upload functionality for technical drawings and documents
"""

import requests
import sys
import json
import tempfile
import os
from datetime import datetime, timezone, timedelta

class FileUploadTester:
    def __init__(self, base_url="https://prodplan-9.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.project_id = None
        self.part_id = None

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, data=None, files=None, headers=None) -> tuple:
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        if headers is None:
            headers = {}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files, headers=headers, timeout=10)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=10)
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

    def setup_test_data(self):
        """Create test project and part for file upload testing"""
        print("\n" + "="*50)
        print("SETTING UP TEST DATA")
        print("="*50)
        
        # Create test project
        project_data = {
            "name": "File Upload Test Project",
            "customer_name": "Test Customer",
            "start_date": datetime.now(timezone.utc).isoformat(),
            "end_date": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            "notes": "Test project for file upload testing"
        }
        
        success, project = self.run_test("Create Test Project", "POST", "projects", 200, project_data)
        if success and project:
            self.project_id = project['id']
            print(f"   Created project: {project.get('code')} - {project.get('name')}")
            
            # Create test part
            part_data = {
                "project_id": self.project_id,
                "name": "Test Part for File Upload",
                "code": "FILE-TEST-001",
                "quantity": 1,
                "material": "S355",
                "form_type": "silindirik",
                "dimensions": {
                    "diameter": 50.0,
                    "length": 200.0
                },
                "manufacturing_methods": ["3001"],
                "notes": "Test part for file upload testing"
            }
            
            success, part = self.run_test("Create Test Part", "POST", "parts", 200, part_data)
            if success and part:
                self.part_id = part['id']
                print(f"   Created part: {part.get('code')} - {part.get('name')}")
                return True
        
        return False

    def create_test_files(self):
        """Create temporary test files for upload"""
        # Create a test PDF file
        pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF"
        
        # Create a test text file
        txt_content = b"This is a test document for ProManufakt file upload testing.\nCreated for API testing purposes."
        
        # Create temporary files
        pdf_file = tempfile.NamedTemporaryFile(suffix='.pdf', delete=False)
        pdf_file.write(pdf_content)
        pdf_file.close()
        
        txt_file = tempfile.NamedTemporaryFile(suffix='.txt', delete=False)
        txt_file.write(txt_content)
        txt_file.close()
        
        return pdf_file.name, txt_file.name

    def test_technical_drawing_upload(self):
        """Test technical drawing upload functionality"""
        print("\n" + "="*50)
        print("TESTING TECHNICAL DRAWING UPLOAD")
        print("="*50)
        
        if not self.part_id:
            print("❌ No part available for testing")
            return False
        
        pdf_file, txt_file = self.create_test_files()
        
        try:
            # Test uploading technical drawing (PDF)
            with open(pdf_file, 'rb') as f:
                files = {'file': ('test_drawing.pdf', f, 'application/pdf')}
                success, result = self.run_test(
                    "Upload Technical Drawing (PDF)", 
                    "POST", 
                    f"upload/technical-drawing/{self.part_id}", 
                    200, 
                    files=files
                )
                if success:
                    print(f"   Uploaded file: {result.get('filename')}")
                    self.uploaded_drawing_filename = result.get('filename')
            
            # Test uploading invalid file type
            with open(txt_file, 'rb') as f:
                files = {'file': ('test_invalid.txt', f, 'text/plain')}
                success, result = self.run_test(
                    "Upload Invalid File Type", 
                    "POST", 
                    f"upload/technical-drawing/{self.part_id}", 
                    400, 
                    files=files
                )
                if success:
                    print("   ✅ Correctly rejected invalid file type")
            
            # Test uploading to non-existent part
            with open(pdf_file, 'rb') as f:
                files = {'file': ('test_drawing2.pdf', f, 'application/pdf')}
                success, result = self.run_test(
                    "Upload to Non-existent Part", 
                    "POST", 
                    "upload/technical-drawing/non-existent-id", 
                    404, 
                    files=files
                )
                if success:
                    print("   ✅ Correctly returned 404 for non-existent part")
            
        finally:
            # Clean up temporary files
            os.unlink(pdf_file)
            os.unlink(txt_file)

    def test_document_upload(self):
        """Test additional document upload functionality"""
        print("\n" + "="*50)
        print("TESTING ADDITIONAL DOCUMENT UPLOAD")
        print("="*50)
        
        if not self.part_id:
            print("❌ No part available for testing")
            return False
        
        pdf_file, txt_file = self.create_test_files()
        
        try:
            # Test uploading additional document (PDF)
            with open(pdf_file, 'rb') as f:
                files = {'file': ('test_document.pdf', f, 'application/pdf')}
                success, result = self.run_test(
                    "Upload Additional Document (PDF)", 
                    "POST", 
                    f"upload/document/{self.part_id}", 
                    200, 
                    files=files
                )
                if success:
                    print(f"   Uploaded document: {result.get('document', {}).get('filename')}")
                    self.uploaded_doc_filename = result.get('document', {}).get('filename')
            
            # Test uploading another document
            with open(txt_file, 'rb') as f:
                files = {'file': ('test_document.txt', f, 'text/plain')}
                success, result = self.run_test(
                    "Upload Additional Document (TXT)", 
                    "POST", 
                    f"upload/document/{self.part_id}", 
                    400,  # Should fail for txt files
                    files=files
                )
                if success:
                    print("   ✅ Correctly rejected TXT file type")
            
        finally:
            # Clean up temporary files
            os.unlink(pdf_file)
            os.unlink(txt_file)

    def test_file_download(self):
        """Test file download functionality"""
        print("\n" + "="*50)
        print("TESTING FILE DOWNLOAD")
        print("="*50)
        
        # Test downloading uploaded files
        if hasattr(self, 'uploaded_drawing_filename'):
            success, result = self.run_test(
                "Download Technical Drawing", 
                "GET", 
                f"files/{self.uploaded_drawing_filename}", 
                200
            )
            if success:
                print("   ✅ Technical drawing download working")
        
        if hasattr(self, 'uploaded_doc_filename'):
            success, result = self.run_test(
                "Download Additional Document", 
                "GET", 
                f"files/{self.uploaded_doc_filename}", 
                200
            )
            if success:
                print("   ✅ Additional document download working")
        
        # Test downloading non-existent file
        success, result = self.run_test(
            "Download Non-existent File", 
            "GET", 
            "files/non-existent-file.pdf", 
            404
        )
        if success:
            print("   ✅ Correctly returned 404 for non-existent file")

    def test_file_deletion(self):
        """Test file deletion functionality"""
        print("\n" + "="*50)
        print("TESTING FILE DELETION")
        print("="*50)
        
        if not self.part_id:
            print("❌ No part available for testing")
            return False
        
        # Test deleting technical drawing
        if hasattr(self, 'uploaded_drawing_filename'):
            success, result = self.run_test(
                "Delete Technical Drawing", 
                "DELETE", 
                f"files/{self.part_id}/{self.uploaded_drawing_filename}", 
                200
            )
            if success:
                print("   ✅ Technical drawing deletion working")
        
        # Test deleting additional document
        if hasattr(self, 'uploaded_doc_filename'):
            success, result = self.run_test(
                "Delete Additional Document", 
                "DELETE", 
                f"files/{self.part_id}/{self.uploaded_doc_filename}", 
                200
            )
            if success:
                print("   ✅ Additional document deletion working")
        
        # Test deleting non-existent file
        success, result = self.run_test(
            "Delete Non-existent File", 
            "DELETE", 
            f"files/{self.part_id}/non-existent-file.pdf", 
            404
        )
        if success:
            print("   ✅ Correctly returned 404 for non-existent file")
        
        # Test deleting from non-existent part
        success, result = self.run_test(
            "Delete from Non-existent Part", 
            "DELETE", 
            "files/non-existent-part/some-file.pdf", 
            404
        )
        if success:
            print("   ✅ Correctly returned 404 for non-existent part")

    def test_part_with_files(self):
        """Test getting part data with file information"""
        print("\n" + "="*50)
        print("TESTING PART WITH FILE INFORMATION")
        print("="*50)
        
        if not self.part_id:
            print("❌ No part available for testing")
            return False
        
        # Get part data to check file information
        success, part = self.run_test(
            "Get Part with File Info", 
            "GET", 
            f"parts/{self.part_id}", 
            200
        )
        if success:
            print(f"   Part name: {part.get('name')}")
            print(f"   Technical drawing: {part.get('technical_drawing_filename', 'None')}")
            print(f"   Additional documents: {len(part.get('additional_documents', []))}")

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n" + "="*50)
        print("CLEANING UP TEST DATA")
        print("="*50)
        
        if self.part_id:
            self.run_test(f"Delete Test Part", "DELETE", f"parts/{self.part_id}", 200)
        
        if self.project_id:
            self.run_test(f"Delete Test Project", "DELETE", f"projects/{self.project_id}", 200)

    def run_all_tests(self):
        """Run all file upload tests"""
        print("🚀 Starting ProManufakt File Upload Test Suite")
        print(f"Testing against: {self.base_url}")
        print("="*70)
        
        try:
            # Setup test data
            if not self.setup_test_data():
                print("❌ Failed to setup test data. Aborting tests.")
                return False
            
            # Run file upload tests
            self.test_technical_drawing_upload()
            self.test_document_upload()
            self.test_file_download()
            self.test_part_with_files()
            self.test_file_deletion()
            
            # Clean up
            self.cleanup_test_data()
            
            return True
            
        except Exception as e:
            print(f"❌ Test suite failed with error: {str(e)}")
            return False

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*70)
        print("FILE UPLOAD TEST SUMMARY")
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
    tester = FileUploadTester()
    
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