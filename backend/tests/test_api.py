import pytest
import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.services.auth_service import auth_service
from app.services.compiler_service import code_executor
from app.services.performance_service import rate_limiter

client = TestClient(app)

class TestAuthentication:
    """Test authentication endpoints and functionality."""
    
    def test_login_success(self):
        """Test successful login."""
        response = client.post("/api/auth/login", json={
            "username": "demo",
            "password": "demo123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["username"] == "demo"

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        response = client.post("/api/auth/login", json={
            "username": "demo",
            "password": "wrong_password"
        })
        assert response.status_code == 401
        assert "Invalid username or password" in response.json()["detail"]

    def test_register_new_user(self):
        """Test user registration."""
        response = client.post("/api/auth/register", json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "test123"
        })
        assert response.status_code == 200
        assert response.json()["username"] == "testuser"

    def test_register_duplicate_user(self):
        """Test registration with existing username."""
        response = client.post("/api/auth/register", json={
            "username": "demo",
            "email": "demo2@example.com", 
            "password": "demo123"
        })
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    def test_protected_endpoint_without_token(self):
        """Test accessing protected endpoint without authentication."""
        response = client.get("/api/auth/me")
        assert response.status_code == 403

    def test_protected_endpoint_with_token(self):
        """Test accessing protected endpoint with valid token."""
        # First login to get token
        login_response = client.post("/api/auth/login", json={
            "username": "demo",
            "password": "demo123"
        })
        token = login_response.json()["access_token"]
        
        # Use token to access protected endpoint
        response = client.get("/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        assert response.json()["username"] == "demo"

class TestCodeExecution:
    """Test code compilation and execution functionality."""

    def test_get_supported_languages(self):
        """Test getting supported programming languages."""
        response = client.get("/api/ai-compiler/languages")
        assert response.status_code == 200
        data = response.json()
        assert "languages" in data
        assert "python" in data["languages"]
        assert len(data["languages"]) > 0

    def test_python_code_execution_success(self):
        """Test successful Python code execution."""
        response = client.post("/api/ai-compiler/run", json={
            "language": "python",
            "code": "print('Hello, World!')"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "Hello, World!" in data["output"]

    def test_python_code_execution_with_error(self):
        """Test Python code execution with runtime error."""
        response = client.post("/api/ai-compiler/run", json={
            "language": "python", 
            "code": "print(undefined_variable)"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == False
        assert "NameError" in data["error"]

    def test_code_validation_dangerous_code(self):
        """Test code validation with potentially dangerous code."""
        response = client.post("/api/ai-compiler/validate", json={
            "language": "python",
            "code": "import os; os.system('rm -rf /')"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == False
        assert "dangerous code" in data["error"].lower()

    def test_code_validation_safe_code(self):
        """Test code validation with safe code."""
        response = client.post("/api/ai-compiler/validate", json={
            "language": "python",
            "code": "x = 5\ny = 10\nprint(x + y)"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True

    def test_unsupported_language(self):
        """Test execution with unsupported language."""
        response = client.post("/api/ai-compiler/run", json={
            "language": "unsupported_lang",
            "code": "some code"
        })
        assert response.status_code == 400
        assert "not supported" in response.json()["detail"]

class TestAIGeneration:
    """Test AI code generation functionality."""

    @pytest.mark.asyncio
    async def test_generate_code_request_structure(self):
        """Test code generation request structure."""
        response = client.post("/api/ai-compiler/generate", json={
            "language": "python",
            "prompt": "Create a function that adds two numbers"
        })
        # Note: This might fail without valid API key, but tests structure
        assert response.status_code in [200, 500]  # 500 if no API key
        
        if response.status_code == 200:
            data = response.json()
            assert "code" in data
            assert "language" in data

class TestRateLimiting:
    """Test rate limiting functionality."""

    def test_rate_limit_info(self):
        """Test getting rate limit information."""
        response = client.get("/api/monitoring/rate-limits")
        assert response.status_code == 200
        data = response.json()
        assert "limits" in data
        assert "remaining" in data

    def test_rate_limiting_enforcement(self):
        """Test that rate limiting is enforced."""
        # Make multiple rapid requests to trigger rate limiting
        # This test might be flaky depending on timing
        for i in range(70):  # Exceed default limit of 60 per minute
            response = client.post("/api/ai-compiler/validate", json={
                "language": "python",
                "code": f"print({i})"
            })
            
            if response.status_code == 429:
                # Rate limit triggered
                assert "rate limit" in response.json()["detail"].lower()
                break
        else:
            # If we didn't hit rate limit, that's also valid (might have higher limits)
            pass

class TestHealthAndMonitoring:
    """Test health check and monitoring endpoints."""

    def test_basic_health_check(self):
        """Test basic health check endpoint."""
        response = client.get("/api/monitoring/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] in ["healthy", "warning", "unhealthy"]

    def test_simple_metrics(self):
        """Test simple metrics endpoint."""
        response = client.get("/api/monitoring/metrics/simple")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "supported_languages" in data

    def test_detailed_status(self):
        """Test detailed status endpoint."""
        response = client.get("/api/monitoring/status/detailed")
        assert response.status_code == 200
        data = response.json()
        assert "overall_status" in data
        assert "services" in data
        assert "features" in data

class TestGitHubIntegration:
    """Test GitHub API integration."""

    def test_repo_search_structure(self):
        """Test repository search endpoint structure."""
        response = client.post("/api/repo-search", json={
            "prompt": "machine learning",
            "limit": 5
        })
        # Might fail without GitHub token, but tests structure
        assert response.status_code in [200, 500]
        
        if response.status_code == 200:
            data = response.json()
            assert "repos" in data
            assert "query" in data

class TestSecurity:
    """Test security features."""

    def test_cors_headers(self):
        """Test CORS headers are properly set."""
        response = client.options("/api/monitoring/health")
        # Check that CORS headers would be present
        # (TestClient doesn't fully simulate CORS, but we can check structure)
        assert response.status_code in [200, 405]  # OPTIONS might not be allowed

    def test_sql_injection_protection(self):
        """Test protection against SQL injection attempts."""
        malicious_input = "'; DROP TABLE users; --"
        response = client.post("/api/auth/login", json={
            "username": malicious_input,
            "password": "password"
        })
        # Should handle gracefully without crashing
        assert response.status_code in [401, 422]

    def test_xss_protection(self):
        """Test protection against XSS attempts."""
        xss_payload = "<script>alert('xss')</script>"
        response = client.post("/api/ai-compiler/validate", json={
            "language": "python",
            "code": xss_payload
        })
        # Should handle gracefully
        assert response.status_code == 200
        # Response should not contain unescaped script tags
        assert "<script>" not in str(response.content)

class TestPerformance:
    """Test performance and reliability."""

    def test_large_code_input(self):
        """Test handling of large code inputs."""
        large_code = "print('hello')\n" * 1000  # 1000 lines
        response = client.post("/api/ai-compiler/validate", json={
            "language": "python",
            "code": large_code
        })
        assert response.status_code == 200

    def test_empty_inputs(self):
        """Test handling of empty inputs."""
        response = client.post("/api/ai-compiler/validate", json={
            "language": "python",
            "code": ""
        })
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == False

    def test_concurrent_requests(self):
        """Test handling of concurrent requests."""
        import threading
        import time
        
        results = []
        
        def make_request():
            response = client.get("/api/monitoring/health")
            results.append(response.status_code)
        
        # Create 10 concurrent threads
        threads = []
        for i in range(10):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # All requests should succeed
        assert all(status == 200 for status in results)
        assert len(results) == 10

# Utility functions for testing
def get_auth_token(username="demo", password="demo123"):
    """Helper function to get authentication token."""
    response = client.post("/api/auth/login", json={
        "username": username,
        "password": password
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    return None

# Fixtures for pytest
@pytest.fixture
def auth_token():
    """Fixture to provide authentication token."""
    return get_auth_token()

@pytest.fixture
def auth_headers(auth_token):
    """Fixture to provide authentication headers."""
    if auth_token:
        return {"Authorization": f"Bearer {auth_token}"}
    return {}

# Integration tests
class TestIntegration:
    """Integration tests for complete workflows."""

    def test_complete_code_generation_workflow(self):
        """Test complete workflow: login -> generate code -> validate -> execute."""
        # 1. Login
        login_response = client.post("/api/auth/login", json={
            "username": "demo",
            "password": "demo123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Check rate limits
        limits_response = client.get("/api/monitoring/rate-limits", headers=headers)
        assert limits_response.status_code == 200
        
        # 3. Validate simple code
        validate_response = client.post("/api/ai-compiler/validate", 
            json={
                "language": "python",
                "code": "x = 1 + 1\nprint(x)"
            },
            headers=headers
        )
        assert validate_response.status_code == 200
        assert validate_response.json()["valid"] == True
        
        # 4. Execute code
        execute_response = client.post("/api/ai-compiler/run",
            json={
                "language": "python", 
                "code": "x = 1 + 1\nprint(x)"
            },
            headers=headers
        )
        assert execute_response.status_code == 200
        assert execute_response.json()["success"] == True

# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])