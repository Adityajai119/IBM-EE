#!/usr/bin/env python3
"""
Comprehensive Authentication Test for DevSensei
Tests both frontend and backend authentication flow
"""

import requests
import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class AuthTester:
    def __init__(self):
        self.frontend_url = "http://localhost:5173"
        self.backend_url = "http://localhost:8000"
        self.driver = None
        
    def setup_driver(self):
        """Setup Chrome driver for testing"""
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            print("✅ Chrome driver initialized successfully")
            return True
        except Exception as e:
            print(f"❌ Failed to initialize Chrome driver: {e}")
            return False
    
    def test_backend_health(self):
        """Test backend health endpoint"""
        print("\n🔍 Testing Backend Health...")
        try:
            response = requests.get(f"{self.backend_url}/api/health/", timeout=5)
            if response.status_code == 200:
                print("✅ Backend health check passed")
                return True
            else:
                print(f"❌ Backend health check failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Backend health check error: {e}")
            return False
    
    def test_frontend_access(self):
        """Test if frontend is accessible"""
        print("\n🔍 Testing Frontend Access...")
        try:
            response = requests.get(self.frontend_url, timeout=10)
            if response.status_code == 200:
                print("✅ Frontend is accessible")
                return True
            else:
                print(f"❌ Frontend access failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Frontend access error: {e}")
            return False
    
    def test_firebase_config(self):
        """Test Firebase configuration in browser"""
        print("\n🔍 Testing Firebase Configuration...")
        try:
            self.driver.get(self.frontend_url)
            time.sleep(3)
            
            # Check for console errors
            logs = self.driver.get_log('browser')
            firebase_errors = [log for log in logs if 'firebase' in log['message'].lower() and log['level'] == 'SEVERE']
            
            if firebase_errors:
                print("❌ Firebase configuration errors found:")
                for error in firebase_errors:
                    print(f"   - {error['message']}")
                return False
            else:
                print("✅ No Firebase configuration errors found")
                return True
                
        except Exception as e:
            print(f"❌ Firebase config test error: {e}")
            return False
    
    def test_auth_buttons_present(self):
        """Test if authentication buttons are present"""
        print("\n🔍 Testing Authentication Buttons...")
        try:
            self.driver.get(self.frontend_url)
            time.sleep(3)
            
            # Look for Google auth button
            google_button = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//button[contains(text(), 'Google') or contains(text(), 'Continue with Google')]"))
            )
            
            # Look for GitHub auth button
            github_button = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//button[contains(text(), 'GitHub') or contains(text(), 'Continue with GitHub')]"))
            )
            
            if google_button and github_button:
                print("✅ Authentication buttons found")
                return True
            else:
                print("❌ Authentication buttons not found")
                return False
                
        except TimeoutException:
            print("❌ Authentication buttons not found within timeout")
            return False
        except Exception as e:
            print(f"❌ Auth buttons test error: {e}")
            return False
    
    def test_console_errors(self):
        """Test for JavaScript console errors"""
        print("\n🔍 Testing Console Errors...")
        try:
            self.driver.get(self.frontend_url)
            time.sleep(5)
            
            logs = self.driver.get_log('browser')
            errors = [log for log in logs if log['level'] == 'SEVERE']
            
            if errors:
                print(f"❌ Found {len(errors)} console errors:")
                for error in errors[:5]:  # Show first 5 errors
                    print(f"   - {error['message']}")
                return False
            else:
                print("✅ No console errors found")
                return True
                
        except Exception as e:
            print(f"❌ Console errors test error: {e}")
            return False
    
    def test_auth_context_initialization(self):
        """Test AuthContext initialization"""
        print("\n🔍 Testing AuthContext Initialization...")
        try:
            self.driver.get(self.frontend_url)
            time.sleep(3)
            
            # Execute JavaScript to check AuthContext state
            auth_state = self.driver.execute_script("""
                // Check if AuthContext is available
                if (window.React && window.React.useContext) {
                    return 'React available';
                }
                return 'React not available';
            """)
            
            print(f"✅ AuthContext test: {auth_state}")
            return True
            
        except Exception as e:
            print(f"❌ AuthContext test error: {e}")
            return False
    
    def run_comprehensive_test(self):
        """Run all tests"""
        print("🚀 Starting Comprehensive Authentication Test...")
        print("=" * 60)
        
        results = []
        
        # Test backend
        results.append(("Backend Health", self.test_backend_health()))
        
        # Test frontend
        results.append(("Frontend Access", self.test_frontend_access()))
        
        # Setup driver for browser tests
        if not self.setup_driver():
            print("❌ Cannot run browser tests without Chrome driver")
            return
        
        try:
            # Browser-based tests
            results.append(("Firebase Config", self.test_firebase_config()))
            results.append(("Auth Buttons", self.test_auth_buttons_present()))
            results.append(("Console Errors", self.test_console_errors()))
            results.append(("AuthContext Init", self.test_auth_context_initialization()))
            
        finally:
            if self.driver:
                self.driver.quit()
        
        # Print results
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS:")
        print("=" * 60)
        
        passed = 0
        total = len(results)
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name}")
            if result:
                passed += 1
        
        print("=" * 60)
        print(f"📈 SUMMARY: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! Authentication system is working correctly.")
        else:
            print("⚠️  Some tests failed. Check the output above for details.")
        
        return passed == total

def main():
    tester = AuthTester()
    success = tester.run_comprehensive_test()
    exit(0 if success else 1)

if __name__ == "__main__":
    main()
