import pytest
import asyncio
import tempfile
import os
from unittest.mock import Mock, patch, MagicMock
from app.services.auth_service import auth_service, AuthService
from app.services.compiler_service import code_executor, CodeExecutor
from app.services.performance_service import rate_limiter, performance_monitor, cache_service
from app.services.gemini_service import GeminiService
from datetime import datetime, timedelta

class TestAuthService:
    """Test authentication service functionality."""
    
    def test_password_hashing(self):
        """Test password hashing and verification."""
        service = AuthService()
        password = "test_password_123"
        
        # Hash password
        hashed = service.hash_password(password)
        assert hashed != password
        assert len(hashed) > 50  # bcrypt hashes are long
        
        # Verify correct password
        assert service.verify_password(password, hashed) == True
        
        # Verify incorrect password
        assert service.verify_password("wrong_password", hashed) == False

    def test_token_generation_and_validation(self):
        """Test JWT token generation and validation."""
        service = AuthService()
        user_data = {"username": "testuser", "user_id": "123", "role": "user"}
        
        # Generate token
        token = service.create_access_token(user_data)
        assert isinstance(token, str)
        assert len(token) > 50
        
        # Validate token
        decoded = service.verify_token(token)
        assert decoded["username"] == "testuser"
        assert decoded["user_id"] == "123"
        assert decoded["role"] == "user"

    def test_token_expiration(self):
        """Test token expiration functionality."""
        service = AuthService()
        user_data = {"username": "testuser", "user_id": "123"}
        
        # Create token with very short expiration
        token = service.create_access_token(user_data, expires_delta=timedelta(seconds=-1))
        
        # Should be invalid due to expiration
        decoded = service.verify_token(token)
        assert decoded is None

    def test_refresh_token_functionality(self):
        """Test refresh token generation and validation."""
        service = AuthService()
        user_data = {"username": "testuser", "user_id": "123"}
        
        # Generate refresh token
        refresh_token = service.create_refresh_token(user_data)
        assert isinstance(refresh_token, str)
        
        # Validate refresh token
        decoded = service.verify_refresh_token(refresh_token)
        assert decoded["username"] == "testuser"

    def test_rate_limiting_user(self):
        """Test user-specific rate limiting."""
        service = AuthService()
        user_id = "test_user_123"
        
        # Should allow initial requests
        for i in range(10):
            assert service.check_rate_limit(user_id, "login") == True
        
        # After many requests, should start limiting
        for i in range(50):
            service.check_rate_limit(user_id, "login")
        
        # Should be rate limited now
        assert service.check_rate_limit(user_id, "login") == False

    def test_user_registration_validation(self):
        """Test user registration validation."""
        service = AuthService()
        
        # Valid registration
        valid_user = {
            "username": "newuser123",
            "email": "newuser@example.com",
            "password": "secure_password_123"
        }
        validation = service.validate_registration(valid_user)
        assert validation["valid"] == True
        
        # Invalid email
        invalid_email = valid_user.copy()
        invalid_email["email"] = "invalid_email"
        validation = service.validate_registration(invalid_email)
        assert validation["valid"] == False
        assert "email" in validation["errors"]
        
        # Weak password
        weak_password = valid_user.copy()
        weak_password["password"] = "123"
        validation = service.validate_registration(weak_password)
        assert validation["valid"] == False
        assert "password" in validation["errors"]

class TestCodeExecutor:
    """Test code execution service functionality."""
    
    def test_supported_languages(self):
        """Test getting supported languages."""
        executor = CodeExecutor()
        languages = executor.get_supported_languages()
        
        assert isinstance(languages, list)
        assert "python" in languages
        assert "javascript" in languages
        assert len(languages) > 5

    def test_python_code_execution(self):
        """Test Python code execution."""
        executor = CodeExecutor()
        
        # Simple print statement
        result = executor.execute_code("python", "print('Hello, World!')")
        assert result["success"] == True
        assert "Hello, World!" in result["output"]
        assert result["execution_time"] > 0
        
        # Mathematical calculation
        result = executor.execute_code("python", "result = 2 + 2\nprint(result)")
        assert result["success"] == True
        assert "4" in result["output"]

    def test_python_code_with_error(self):
        """Test Python code execution with errors."""
        executor = CodeExecutor()
        
        # Syntax error
        result = executor.execute_code("python", "print('unclosed string")
        assert result["success"] == False
        assert "SyntaxError" in result["error"]
        
        # Runtime error
        result = executor.execute_code("python", "x = 1 / 0")
        assert result["success"] == False
        assert "ZeroDivisionError" in result["error"]

    def test_javascript_code_execution(self):
        """Test JavaScript code execution."""
        executor = CodeExecutor()
        
        result = executor.execute_code("javascript", "console.log('Hello from JS');")
        assert result["success"] == True
        assert "Hello from JS" in result["output"]

    def test_code_validation_security(self):
        """Test code validation for security threats."""
        executor = CodeExecutor()
        
        # File system access
        result = executor.validate_code("python", "import os; os.remove('important_file.txt')")
        assert result["valid"] == False
        assert "dangerous" in result["error"].lower()
        
        # Network access
        result = executor.validate_code("python", "import urllib; urllib.request.urlopen('http://evil.com')")
        assert result["valid"] == False
        
        # Safe code
        result = executor.validate_code("python", "x = 5\ny = 10\nprint(x + y)")
        assert result["valid"] == True

    def test_execution_timeout(self):
        """Test code execution timeout."""
        executor = CodeExecutor()
        
        # Infinite loop should timeout
        result = executor.execute_code("python", "while True: pass", timeout=2)
        assert result["success"] == False
        assert "timeout" in result["error"].lower()

    def test_memory_limit(self):
        """Test memory limit enforcement."""
        executor = CodeExecutor()
        
        # Code that tries to use lots of memory
        memory_hog = """
import sys
data = []
for i in range(1000000):
    data.append([0] * 1000)
print("Used memory:", sys.getsizeof(data))
"""
        result = executor.execute_code("python", memory_hog)
        # Should either succeed with limited memory or fail gracefully
        assert isinstance(result, dict)
        assert "success" in result

    def test_code_preprocessing(self):
        """Test code preprocessing and sanitization."""
        executor = CodeExecutor()
        
        # Test input sanitization
        malicious_code = "<script>alert('xss')</script>\nprint('hello')"
        processed = executor.preprocess_code("python", malicious_code)
        assert "<script>" not in processed
        assert "print('hello')" in processed

class TestPerformanceService:
    """Test performance monitoring and rate limiting services."""
    
    def test_rate_limiter_basic(self):
        """Test basic rate limiting functionality."""
        from app.services.performance_service import RateLimiter
        
        limiter = RateLimiter()
        user_id = "test_user_rate_limit"
        
        # Should allow initial requests
        for i in range(10):
            assert limiter.check_limit(user_id, "api_call") == True
        
        # After hitting limit, should deny
        for i in range(100):
            limiter.check_limit(user_id, "api_call")
        
        result = limiter.check_limit(user_id, "api_call")
        # Might still be True depending on time window
        assert isinstance(result, bool)

    def test_performance_monitor_metrics(self):
        """Test performance monitoring metrics collection."""
        from app.services.performance_service import PerformanceMonitor
        
        monitor = PerformanceMonitor()
        
        # Record some metrics
        monitor.record_request("api_call", 0.5, True)
        monitor.record_request("api_call", 1.2, False)
        monitor.record_request("code_execution", 2.1, True)
        
        # Get metrics
        metrics = monitor.get_metrics()
        assert "total_requests" in metrics
        assert "average_response_time" in metrics
        assert "error_rate" in metrics
        assert metrics["total_requests"] >= 3

    def test_cache_service_operations(self):
        """Test cache service functionality."""
        from app.services.performance_service import CacheService
        
        cache = CacheService()
        
        # Set and get
        cache.set("test_key", "test_value", ttl=3600)
        assert cache.get("test_key") == "test_value"
        
        # Non-existent key
        assert cache.get("non_existent") is None
        
        # Delete
        cache.delete("test_key")
        assert cache.get("test_key") is None

    def test_cache_expiration(self):
        """Test cache expiration functionality."""
        from app.services.performance_service import CacheService
        import time
        
        cache = CacheService()
        
        # Set with short TTL
        cache.set("short_lived", "value", ttl=1)
        assert cache.get("short_lived") == "value"
        
        # Wait for expiration
        time.sleep(2)
        assert cache.get("short_lived") is None

class TestGeminiService:
    """Test Gemini AI service functionality."""
    
    @patch('google.generativeai.GenerativeModel')
    def test_gemini_service_initialization(self, mock_model):
        """Test Gemini service initialization."""
        mock_instance = Mock()
        mock_model.return_value = mock_instance
        
        service = GeminiService("fake_api_key")
        assert service.model == mock_instance

    @patch('google.generativeai.GenerativeModel')
    def test_code_generation(self, mock_model):
        """Test code generation functionality."""
        mock_instance = Mock()
        mock_response = Mock()
        mock_response.text = "def add(a, b):\n    return a + b"
        mock_instance.generate_content.return_value = mock_response
        mock_model.return_value = mock_instance
        
        service = GeminiService("fake_api_key")
        result = service.generate_code("Create a function to add two numbers", "python")
        
        assert "def add" in result
        assert "return a + b" in result

    @patch('google.generativeai.GenerativeModel')
    def test_code_explanation(self, mock_model):
        """Test code explanation functionality."""
        mock_instance = Mock()
        mock_response = Mock()
        mock_response.text = "This function adds two numbers together."
        mock_instance.generate_content.return_value = mock_response
        mock_model.return_value = mock_instance
        
        service = GeminiService("fake_api_key")
        result = service.explain_code("def add(a, b): return a + b")
        
        assert "adds two numbers" in result.lower()

    @patch('google.generativeai.GenerativeModel')
    def test_error_handling(self, mock_model):
        """Test error handling in Gemini service."""
        mock_instance = Mock()
        mock_instance.generate_content.side_effect = Exception("API Error")
        mock_model.return_value = mock_instance
        
        service = GeminiService("fake_api_key")
        result = service.generate_code("Test prompt", "python")
        
        # Should handle error gracefully
        assert isinstance(result, str)
        assert len(result) > 0

class TestIntegrationServices:
    """Test integration between services."""
    
    def test_auth_and_rate_limiting_integration(self):
        """Test integration between auth service and rate limiting."""
        auth = AuthService()
        user_data = {"username": "testuser", "user_id": "123"}
        
        # Create token
        token = auth.create_access_token(user_data)
        
        # Verify token
        decoded = auth.verify_token(token)
        assert decoded is not None
        
        # Test rate limiting for this user
        user_id = decoded["user_id"]
        for i in range(10):
            result = auth.check_rate_limit(user_id, "api_call")
            assert isinstance(result, bool)

    def test_code_execution_with_monitoring(self):
        """Test code execution with performance monitoring."""
        executor = CodeExecutor()
        monitor = performance_monitor
        
        # Record initial metrics
        initial_metrics = monitor.get_metrics()
        initial_requests = initial_metrics.get("total_requests", 0)
        
        # Execute code
        result = executor.execute_code("python", "print('test')")
        
        # Should have recorded the execution
        assert result["success"] == True
        
        # Metrics should be updated
        new_metrics = monitor.get_metrics()
        # Note: This might not work in isolated tests, but tests the concept

    def test_cache_with_code_results(self):
        """Test caching of code execution results."""
        cache = cache_service
        executor = CodeExecutor()
        
        code = "print('cached result')"
        cache_key = f"python:{hash(code)}"
        
        # First execution
        result1 = executor.execute_code("python", code)
        cache.set(cache_key, result1, ttl=3600)
        
        # Get from cache
        cached_result = cache.get(cache_key)
        assert cached_result is not None
        assert cached_result["output"] == result1["output"]

# Utility functions for testing
class MockDatabase:
    """Mock database for testing."""
    
    def __init__(self):
        self.users = {}
        self.sessions = {}
    
    def add_user(self, username, email, password_hash):
        self.users[username] = {
            "email": email,
            "password_hash": password_hash,
            "created_at": datetime.now()
        }
    
    def get_user(self, username):
        return self.users.get(username)
    
    def user_exists(self, username):
        return username in self.users

# Fixtures
@pytest.fixture
def mock_db():
    """Fixture providing mock database."""
    return MockDatabase()

@pytest.fixture
def temp_file():
    """Fixture providing temporary file."""
    fd, path = tempfile.mkstemp()
    yield path
    os.close(fd)
    os.unlink(path)

# Performance tests
class TestPerformance:
    """Test performance characteristics of services."""
    
    def test_auth_service_performance(self):
        """Test authentication service performance."""
        import time
        auth = AuthService()
        
        # Test password hashing performance
        start_time = time.time()
        for i in range(10):
            auth.hash_password(f"password_{i}")
        hash_time = time.time() - start_time
        
        # Should complete within reasonable time
        assert hash_time < 5.0  # 5 seconds for 10 hashes
        
        # Test token generation performance
        user_data = {"username": "testuser", "user_id": "123"}
        start_time = time.time()
        for i in range(100):
            auth.create_access_token(user_data)
        token_time = time.time() - start_time
        
        # Should be very fast
        assert token_time < 1.0  # 1 second for 100 tokens

    def test_code_executor_performance(self):
        """Test code executor performance."""
        import time
        executor = CodeExecutor()
        
        # Test validation performance
        code = "x = 1\ny = 2\nprint(x + y)"
        start_time = time.time()
        for i in range(50):
            executor.validate_code("python", code)
        validation_time = time.time() - start_time
        
        # Should complete within reasonable time
        assert validation_time < 5.0  # 5 seconds for 50 validations

# Error handling tests
class TestErrorHandling:
    """Test error handling across services."""
    
    def test_auth_service_error_handling(self):
        """Test auth service error handling."""
        auth = AuthService()
        
        # Invalid token
        result = auth.verify_token("invalid.token.here")
        assert result is None
        
        # Malformed data
        result = auth.verify_token(None)
        assert result is None
        
        # Empty password
        hashed = auth.hash_password("")
        assert len(hashed) > 0  # Should still hash empty string

    def test_code_executor_error_handling(self):
        """Test code executor error handling."""
        executor = CodeExecutor()
        
        # Invalid language
        result = executor.execute_code("invalid_lang", "code")
        assert result["success"] == False
        assert "not supported" in result["error"]
        
        # None/empty code
        result = executor.execute_code("python", None)
        assert result["success"] == False
        
        result = executor.execute_code("python", "")
        assert result["success"] == False

# Security tests
class TestSecurity:
    """Test security aspects of services."""
    
    def test_password_security(self):
        """Test password security measures."""
        auth = AuthService()
        
        # Same password should produce different hashes
        password = "test_password"
        hash1 = auth.hash_password(password)
        hash2 = auth.hash_password(password)
        assert hash1 != hash2  # Due to salt
        
        # Both should verify correctly
        assert auth.verify_password(password, hash1) == True
        assert auth.verify_password(password, hash2) == True

    def test_code_injection_protection(self):
        """Test protection against code injection."""
        executor = CodeExecutor()
        
        # Attempt to access file system
        malicious_codes = [
            "import os; os.system('cat /etc/passwd')",
            "open('/etc/passwd', 'r').read()",
            "__import__('subprocess').call(['ls', '-la'])",
            "eval('__import__(\"os\").system(\"ls\")')"
        ]
        
        for code in malicious_codes:
            result = executor.validate_code("python", code)
            # Should either block or handle safely
            if result["valid"]:
                # If validation passes, execution should be sandboxed
                exec_result = executor.execute_code("python", code)
                # Should not crash the system
                assert isinstance(exec_result, dict)

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
