from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.services.auth_service import auth_service, get_current_user
from app.services.performance_service import rate_limiter

router = APIRouter()

class FirebaseTokenRequest(BaseModel):
    """Firebase ID token from frontend."""
    id_token: str

class FirebaseAuthResponse(BaseModel):
    """Response after Firebase authentication."""
    success: bool
    user: Dict[str, Any]
    message: str

class GoogleLoginRequest(BaseModel):
    """Google OAuth login request."""
    google_token: str

class GitHubLoginRequest(BaseModel):
    """GitHub OAuth login request."""
    github_code: str
    redirect_uri: Optional[str] = None

class UserProfileResponse(BaseModel):
    """User profile information."""
    uid: str
    email: str
    name: Optional[str]
    picture: Optional[str]
    roles: list
    email_verified: bool
    provider: str

@router.post("/firebase/verify", response_model=FirebaseAuthResponse)
async def verify_firebase_token(request: FirebaseTokenRequest):
    """Verify Firebase ID token and authenticate user."""
    # Rate limiting
    if not rate_limiter.is_allowed("auth:firebase", "requests_per_minute", "default"):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication attempts. Please try again later."
        )
    
    # Verify Firebase token
    user_info = await auth_service.verify_firebase_token(request.id_token)
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase token"
        )
    
    return FirebaseAuthResponse(
        success=True,
        user=user_info,
        message="Authentication successful"
    )

@router.post("/google", response_model=FirebaseAuthResponse)
async def google_login(request: GoogleLoginRequest):
    """Authenticate with Google OAuth."""
    # The frontend will handle Google OAuth and send us the Firebase token
    # This endpoint can be used for additional Google-specific processing
    return FirebaseAuthResponse(
        success=True,
        user={"message": "Please use Firebase token verification"},
        message="Use /auth/firebase/verify endpoint with your Firebase ID token"
    )

@router.post("/github", response_model=FirebaseAuthResponse)
async def github_login(request: GitHubLoginRequest):
    """Authenticate with GitHub OAuth."""
    # The frontend will handle GitHub OAuth and send us the Firebase token
    # This endpoint can be used for additional GitHub-specific processing
    return FirebaseAuthResponse(
        success=True,
        user={"message": "Please use Firebase token verification"},
        message="Use /auth/firebase/verify endpoint with your Firebase ID token"
    )

@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current user profile information."""
    return UserProfileResponse(
        uid=current_user["uid"],
        email=current_user["email"],
        name=current_user.get("name"),
        picture=current_user.get("picture"),
        roles=current_user.get("roles", ["user"]),
        email_verified=current_user.get("email_verified", False),
        provider=current_user.get("provider", "unknown")
    )

@router.post("/logout")
async def logout(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Logout user (Firebase handles token invalidation on client side)."""
    return {
        "success": True,
        "message": "Logged out successfully. Please clear Firebase token on client side."
    }

@router.get("/roles")
async def get_user_roles(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current user's roles and permissions."""
    return {
        "uid": current_user["uid"],
        "roles": current_user.get("roles", ["user"]),
        "permissions": {
            "can_execute_code": "user" in current_user.get("roles", []),
            "can_use_ai": "user" in current_user.get("roles", []),
            "can_access_admin": "admin" in current_user.get("roles", []),
            "can_use_premium_features": "premium" in current_user.get("roles", []) or "admin" in current_user.get("roles", [])
        }
    }

@router.post("/dev/demo-token")
async def get_demo_token():
    """Get demo token for development purposes."""
    return {
        "demo_user_token": "demo_user_token",
        "admin_user_token": "admin_user_token",
        "note": "Use these tokens in the Authorization header for development"
    }

@router.get("/health")
async def auth_health():
    """Health check for authentication service."""
    return {
        "status": "healthy",
        "service": "firebase_authentication",
        "firebase_configured": auth_service.firebase_app is not None,
        "supported_providers": [
            "google",
            "github", 
            "firebase_email",
            "firebase_phone"
        ]
    }
