#!/usr/bin/env python3
"""
Simple Authentication Test for DevSensei
Tests backend and frontend without browser automation
"""

import requests
import time
import json

class SimpleAuthTester:
    def __init__(self):
        self.frontend_url = "http://localhost:5174"
        self.backend_url = "http://localhost:8000"
        
    def test_backend_health(self):
        """Test backend health endpoint"""
        print("🔍 Testing Backend Health...")
        try:
            response = requests.get(f"{self.backend_url}/api/health/", timeout=5)
            if response.status_code == 200:
                print("✅ Backend health check passed")
                print(f"   Response: {response.json()}")
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
                print(f"   Content length: {len(response.text)} characters")
                return True
            else:
                print(f"❌ Frontend access failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Frontend access error: {e}")
            return False
    
    def test_backend_auth_endpoints(self):
        """Test backend authentication endpoints"""
        print("\n🔍 Testing Backend Auth Endpoints...")
        
        endpoints = [
            "/api/auth/health",
            "/api/auth/firebase/verify",
            "/api/auth/me"
        ]
        
        results = []
        for endpoint in endpoints:
            try:
                if endpoint == "/api/auth/health":
                    response = requests.get(f"{self.backend_url}{endpoint}", timeout=5)
                else:
                    response = requests.post(f"{self.backend_url}{endpoint}", 
                                           json={"test": "data"}, timeout=5)
                
                print(f"   {endpoint}: {response.status_code}")
                results.append(response.status_code in [200, 401, 422])  # 401/422 expected for auth endpoints
                
            except Exception as e:
                print(f"   {endpoint}: Error - {e}")
                results.append(False)
        
        success = all(results)
        if success:
            print("✅ Backend auth endpoints are responding")
        else:
            print("❌ Some backend auth endpoints failed")
        
        return success
    
    def test_frontend_build(self):
        """Test if frontend build is working"""
        print("\n🔍 Testing Frontend Build...")
        try:
            response = requests.get(self.frontend_url, timeout=10)
            content = response.text
            
            # Check for common build indicators
            build_indicators = [
                "vite",
                "react",
                "main.js",
                "index.html"
            ]
            
            found_indicators = [indicator for indicator in build_indicators if indicator in content.lower()]
            
            if len(found_indicators) >= 2:
                print(f"✅ Frontend build appears working (found: {found_indicators})")
                return True
            else:
                print(f"❌ Frontend build may have issues (found: {found_indicators})")
                return False
                
        except Exception as e:
            print(f"❌ Frontend build test error: {e}")
            return False
    
    def test_cors_configuration(self):
        """Test CORS configuration"""
        print("\n🔍 Testing CORS Configuration...")
        try:
            # Test preflight request
            headers = {
                'Origin': self.frontend_url,
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type,Authorization'
            }
            
            response = requests.options(f"{self.backend_url}/api/auth/firebase/verify", 
                                      headers=headers, timeout=5)
            
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            }
            
            print(f"   CORS Headers: {cors_headers}")
            
            if response.status_code in [200, 204]:
                print("✅ CORS preflight request successful")
                return True
            else:
                print(f"❌ CORS preflight failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ CORS test error: {e}")
            return False
    
    def run_simple_test(self):
        """Run all simple tests"""
        print("🚀 Starting Simple Authentication Test...")
        print("=" * 60)
        
        results = []
        
        # Test backend
        results.append(("Backend Health", self.test_backend_health()))
        results.append(("Backend Auth Endpoints", self.test_backend_auth_endpoints()))
        results.append(("CORS Configuration", self.test_cors_configuration()))
        
        # Test frontend
        results.append(("Frontend Access", self.test_frontend_access()))
        results.append(("Frontend Build", self.test_frontend_build()))
        
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
            print("🎉 All basic tests passed! Authentication system is ready.")
        else:
            print("⚠️  Some tests failed. Check the output above for details.")
        
        return passed == total

def main():
    tester = SimpleAuthTester()
    success = tester.run_simple_test()
    exit(0 if success else 1)

if __name__ == "__main__":
    main()
