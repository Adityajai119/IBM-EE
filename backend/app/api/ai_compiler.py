from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from app.services.gemini_service import gemini_service
from app.services.compiler_service import code_executor
from app.services.auth_service import optional_auth
from app.services.performance_service import rate_limiter, performance_monitor
import time

router = APIRouter()

class GenerateCodeRequest(BaseModel):
    language: str
    prompt: str
    context: Optional[str] = None

class RunCodeRequest(BaseModel):
    language: str
    code: str
    stdin: Optional[str] = None

class ValidateCodeRequest(BaseModel):
    language: str
    code: str

@router.post("/generate")
async def generate_code_endpoint(
    request: GenerateCodeRequest,
    user = Depends(optional_auth)
):
    """Generate code using AI with rate limiting and security."""
    start_time = time.time()
    
    try:
        # Determine user type for rate limiting
        user_type = user.get("username", "default") if user else "default"
        user_id = user.get("username", "anonymous") if user else "anonymous"
        
        # Rate limiting
        if not rate_limiter.is_allowed(user_id, "ai_requests_per_minute", user_type):
            remaining = rate_limiter.get_remaining_requests(user_id, "ai_requests_per_minute", user_type)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"AI request rate limit exceeded. Remaining: {remaining}"
            )
        
        # Validate language support
        if request.language.lower() not in code_executor.get_supported_languages():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Language '{request.language}' is not supported. Supported: {', '.join(code_executor.get_supported_languages())}"
            )
        
        # Generate code
        code = await gemini_service.generate_code(request.prompt, request.language, request.context)
        
        # Record metrics
        execution_time = time.time() - start_time
        performance_monitor.record_request(execution_time, 200)
        
        return {
            "code": code,
            "language": request.language,
            "generated_at": time.time(),
            "user_type": user_type
        }
        
    except HTTPException:
        execution_time = time.time() - start_time
        performance_monitor.record_request(execution_time, 429)
        raise
    except Exception as e:
        execution_time = time.time() - start_time
        performance_monitor.record_request(execution_time, 500)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Code generation failed: {str(e)}"
        )

@router.post("/run")
async def run_code_endpoint(
    request: RunCodeRequest,
    user = Depends(optional_auth)
):
    """Run code with enhanced security and monitoring."""
    start_time = time.time()
    
    try:
        # Determine user type for rate limiting
        user_type = user.get("username", "default") if user else "default"
        user_id = user.get("username", "anonymous") if user else "anonymous"
        
        # Rate limiting for code execution
        if not rate_limiter.is_allowed(user_id, "code_executions_per_minute", user_type):
            remaining = rate_limiter.get_remaining_requests(user_id, "code_executions_per_minute", user_type)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Code execution rate limit exceeded. Remaining: {remaining}"
            )
        
        # Validate code before execution
        validation_result = code_executor.validate_code(request.language, request.code)
        if not validation_result["valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Code validation failed: {validation_result['error']}"
            )
        
        # Execute code
        result = code_executor.run_code(request.language, request.code, request.stdin)
        
        # Record metrics
        execution_time = time.time() - start_time
        performance_monitor.record_request(execution_time, 200)
        
        return {
            **result,
            "executed_at": time.time(),
            "user_type": user_type
        }
        
    except HTTPException:
        execution_time = time.time() - start_time
        performance_monitor.record_request(execution_time, 400)
        raise
    except Exception as e:
        execution_time = time.time() - start_time
        performance_monitor.record_request(execution_time, 500)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Code execution failed: {str(e)}"
        )

@router.post("/validate")
async def validate_code_endpoint(request: ValidateCodeRequest):
    """Validate code without executing it."""
    try:
        result = code_executor.validate_code(request.language, request.code)
        return {
            "language": request.language,
            "valid": result["valid"],
            "error": result.get("error"),
            "validated_at": time.time()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Code validation failed: {str(e)}"
        )

@router.get("/languages")
async def get_supported_languages():
    """Get list of supported programming languages."""
    return {
        "languages": code_executor.get_supported_languages(),
        "total": len(code_executor.get_supported_languages()),
        "details": {
            lang: {
                "extension": code_executor.supported_languages[lang]["extension"],
                "command": " ".join(code_executor.supported_languages[lang]["command"])
            }
            for lang in code_executor.get_supported_languages()
        }
    }

@router.get("/limits")
async def get_execution_limits(user = Depends(optional_auth)):
    """Get execution limits for current user."""
    user_type = user.get("username", "default") if user else "default"
    
    return {
        "user_type": user_type,
        "limits": {
            "max_execution_time": f"{code_executor.max_execution_time}s",
            "max_memory": f"{code_executor.max_memory // (1024*1024)}MB",
            "max_output_size": f"{code_executor.max_output_size // 1024}KB"
        },
        "rate_limits": rate_limiter.user_limits.get(user_type, rate_limiter.default_limits)
    } 