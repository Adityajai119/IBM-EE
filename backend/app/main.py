import os
# Disable ChromaDB telemetry warnings
os.environ["CHROMA_TELEMETRY_ENABLED"] = "FALSE"
os.environ["ANONYMIZED_TELEMETRY"] = "FALSE"

# Suppress additional telemetry warnings
import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="chromadb")
warnings.filterwarnings("ignore", message=".*telemetry.*")

# Configure logging
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Suppress specific loggers
logging.getLogger("chromadb").setLevel(logging.ERROR)
logging.getLogger("urllib3").setLevel(logging.WARNING)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api import repo_search, interact_repo, ai_compiler, frontend_playground, ai, github, documentation, code
from app.api import auth, monitoring, health  # Add new API modules

app = FastAPI(
    title="DevSensei API",
    description="""
    # DevSensei - Advanced AI-Powered Development Assistant

    ## Overview
    DevSensei is a comprehensive development platform that combines AI-powered code generation, 
    multi-language code execution, repository analysis, and advanced developer tools.

    ## Key Features
    
    ### 🤖 AI Code Generation
    - **Multi-language Support**: Generate code in 12+ programming languages
    - **Context-aware Generation**: Intelligent code suggestions based on project context
    - **Code Explanation**: Get detailed explanations of complex code snippets
    - **Best Practices**: AI-generated code follows industry standards and best practices

    ### 🔒 Security & Authentication
    - **JWT Authentication**: Secure token-based authentication system
    - **Role-based Access Control**: Different permission levels for users and admins
    - **Rate Limiting**: Intelligent rate limiting to prevent abuse
    - **Input Validation**: Comprehensive validation and sanitization of all inputs

    ### ⚡ Code Execution Engine
    - **Sandboxed Execution**: Safe code execution in isolated environments
    - **Multi-language Runtime**: Support for Python, JavaScript, TypeScript, Java, C++, Go, Rust, and more
    - **Resource Management**: Memory and CPU limits to ensure system stability
    - **Real-time Results**: Instant feedback with execution results and error handling

    ### 📊 Performance Monitoring
    - **Real-time Metrics**: Live monitoring of system performance and usage
    - **Health Checks**: Comprehensive health monitoring for all services
    - **Performance Analytics**: Detailed insights into system performance and optimization opportunities
    - **Error Tracking**: Advanced error tracking and debugging capabilities

    ### 🔍 Repository Intelligence
    - **GitHub Integration**: Seamless integration with GitHub repositories
    - **Code Analysis**: Intelligent analysis of repository structure and dependencies
    - **Search & Discovery**: Advanced search capabilities for finding relevant code and repositories
    - **Documentation Generation**: Automatic generation of technical documentation

    ## Authentication
    
    Most endpoints require authentication. Obtain a JWT token by calling the `/api/auth/login` endpoint:
    
    ```python
    import requests
    
    response = requests.post("http://localhost:8000/api/auth/login", json={
        "username": "your_username",
        "password": "your_password"
    })
    token = response.json()["access_token"]
    
    # Use the token in subsequent requests
    headers = {"Authorization": f"Bearer {token}"}
    ```

    ## Rate Limits
    - **Standard Users**: 60 requests per minute per endpoint
    - **Premium Users**: 200 requests per minute per endpoint
    - **Admin Users**: 1000 requests per minute per endpoint
    
    Rate limit headers are included in all responses:
    - `X-RateLimit-Limit`: Maximum requests allowed
    - `X-RateLimit-Remaining`: Remaining requests in current window
    - `X-RateLimit-Reset`: Time when rate limit resets

    ## Error Handling
    
    The API uses standard HTTP status codes and returns detailed error information:
    
    ```json
    {
        "detail": "Error description",
        "error_code": "SPECIFIC_ERROR_CODE",
        "timestamp": "2024-01-15T10:30:00Z",
        "request_id": "unique-request-id"
    }
    ```

    ## Support
    - **Documentation**: Comprehensive API documentation available at `/docs`
    - **Status Page**: System status and uptime information at `/api/monitoring/health`
    - **GitHub**: Source code and issues at [GitHub Repository](https://github.com/your-repo/devsensei)
    """,
    version="2.0.0",
    contact={
        "name": "DevSensei Support",
        "url": "https://devsensei.dev/support", 
        "email": "support@devsensei.dev"
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT"
    },
    servers=[
        {
            "url": "http://localhost:8000",
            "description": "Development server"
        },
        {
            "url": "https://api.devsensei.dev",
            "description": "Production server"
        }
    ],
    openapi_tags=[
        {
            "name": "Authentication",
            "description": "User authentication and authorization endpoints"
        },
        {
            "name": "AI Code Generation", 
            "description": "AI-powered code generation and explanation"
        },
        {
            "name": "Code Execution",
            "description": "Multi-language code compilation and execution"
        },
        {
            "name": "Repository Management",
            "description": "GitHub repository analysis and management"
        },
        {
            "name": "Monitoring",
            "description": "System health and performance monitoring"
        },
        {
            "name": "Documentation",
            "description": "Automatic documentation generation"
        }
    ]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use absolute path for static directory
static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Authentication, monitoring and health routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(monitoring.router, prefix="/api/monitoring", tags=["Monitoring"])
app.include_router(health.router, prefix="/api/health", tags=["Health"])

# Legacy routes (keeping for backward compatibility)
app.include_router(repo_search.router, prefix="/api/repo-search", tags=["Repository Management"])
app.include_router(interact_repo.router, prefix="/api/interact-repo", tags=["Repository Management"])
app.include_router(ai_compiler.router, prefix="/api/ai-compiler", tags=["Code Execution"])
app.include_router(frontend_playground.router, prefix="/api/frontend-playground", tags=["Frontend Playground"])

# New API routes matching frontend expectations
app.include_router(ai.router, prefix="/api/ai", tags=["AI Code Generation"])
app.include_router(github.router, prefix="/api/github", tags=["Repository Management"])
app.include_router(documentation.router, prefix="/api/documentation", tags=["Documentation"])
app.include_router(code.router, prefix="/api/code", tags=["Code Execution"]) 