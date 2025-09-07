from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any, List
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from datetime import datetime, timedelta
import secrets
import json
import os
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer()

class FirebaseAuthService:
    def __init__(self):
        # Initialize Firebase Admin SDK
        self.firebase_app = self._initialize_firebase()
        
        # User roles and permissions storage (in production, use database)
        self.user_roles = {
            # Example: "firebase_uid": {"roles": ["admin", "user"], "permissions": [...]}
        }
        
        # Rate limiting storage
        self.rate_limit_store = {}
        self.failed_attempts = {}
        
        # Default role assignments
        self.default_role = "user"
        self.admin_emails = [
            "admin@devsensei.com",
            "owner@devsensei.dev"
        ]

    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK."""
        try:
            # Try to get existing app
            return firebase_admin.get_app()
        except ValueError:
            # App doesn't exist, create new one
            try:
                # Try to load from service account file
                cred_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH')
                if cred_path and os.path.exists(cred_path):
                    cred = credentials.Certificate(cred_path)
                else:
                    # Try to load from environment variable (JSON string)
                    cred_json = os.getenv('FIREBASE_SERVICE_ACCOUNT_JSON')
                    if cred_json:
                        cred_dict = json.loads(cred_json)
                        cred = credentials.Certificate(cred_dict)
                    else:
                        # Use default credentials (for development)
                        cred = credentials.ApplicationDefault()
                
                return firebase_admin.initialize_app(cred)
            except Exception as e:
                logger.warning(f"Firebase initialization failed: {e}")
                logger.info("Continuing without Firebase - authentication will be limited")
                return None

    async def verify_firebase_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify Firebase ID token and return user info."""
        try:
            # First check if it's a demo token
            demo_user = self._development_fallback(token)
            if demo_user:
                return demo_user
            
            if not self.firebase_app:
                # No Firebase configured and not a demo token
                return None
            
            # Verify the Firebase ID token
            decoded_token = firebase_auth.verify_id_token(token)
            
            # Extract user information
            user_info = {
                "uid": decoded_token.get('uid'),
                "email": decoded_token.get('email'),
                "name": decoded_token.get('name'),
                "picture": decoded_token.get('picture'),
                "email_verified": decoded_token.get('email_verified', False),
                "provider": decoded_token.get('firebase', {}).get('sign_in_provider', 'unknown')
            }
            
            # Assign roles based on email or existing assignments
            user_info['roles'] = self._get_user_roles(user_info['uid'], user_info['email'])
            
            return user_info
            
        except firebase_auth.InvalidIdTokenError:
            return None
        except firebase_auth.ExpiredIdTokenError:
            return None
        except Exception as e:
            logger.error(f"Firebase token verification error: {e}")
            return None

    def _development_fallback(self, token: str) -> Optional[Dict[str, Any]]:
        """Development fallback when Firebase is not configured."""
        # For development, accept demo tokens
        demo_tokens = {
            "demo_user_token": {
                "uid": "demo_user_123",
                "email": "demo@devsensei.com",
                "name": "Demo User",
                "picture": None,
                "email_verified": True,
                "provider": "demo"
            },
            "admin_user_token": {
                "uid": "admin_user_456", 
                "email": "admin@devsensei.com",
                "name": "Admin User",
                "picture": None,
                "email_verified": True,
                "provider": "demo"
            }
        }
        
        user_info = demo_tokens.get(token)
        if user_info:
            user_info['roles'] = self._get_user_roles(user_info['uid'], user_info['email'])
            return user_info
        return None

    def _get_user_roles(self, uid: str, email: str) -> List[str]:
        """Get user roles based on UID and email."""
        # Check if user already has assigned roles
        if uid in self.user_roles:
            return self.user_roles[uid]['roles']
        
        # Assign admin role to admin emails
        roles = ['user']  # Default role
        if email in self.admin_emails:
            roles.append('admin')
        
        # Store role assignment
        self.user_roles[uid] = {
            'roles': roles,
            'email': email,
            'assigned_at': datetime.utcnow().isoformat()
        }
        
        return roles

    def has_permission(self, user_roles: List[str], required_role: str) -> bool:
        """Check if user has required permission."""
        role_hierarchy = {
            'user': 1,
            'premium': 2, 
            'admin': 3
        }
        
        user_level = max([role_hierarchy.get(role, 0) for role in user_roles])
        required_level = role_hierarchy.get(required_role, 0)
        
        return user_level >= required_level

    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user information by email from Firebase."""
        try:
            if not self.firebase_app:
                return None
                
            user_record = firebase_auth.get_user_by_email(email)
            return {
                'uid': user_record.uid,
                'email': user_record.email,
                'name': user_record.display_name,
                'picture': user_record.photo_url,
                'email_verified': user_record.email_verified,
                'roles': self._get_user_roles(user_record.uid, user_record.email)
            }
        except firebase_auth.UserNotFoundError:
            return None
        except Exception as e:
            logger.error(f"Error getting user by email: {e}")
            return None

    async def get_current_user(self, credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
        """Get current authenticated user from Firebase token."""
        if not credentials:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication credentials required"
            )
        
        token = credentials.credentials
        user_info = await self.verify_firebase_token(token)
        
        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token"
            )
        
        return user_info

    def require_role(self, required_role: str):
        """Dependency to require specific role."""
        async def role_checker(current_user: Dict[str, Any] = Depends(self.get_current_user)) -> Dict[str, Any]:
            if not self.has_permission(current_user.get('roles', []), required_role):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions. Required role: {required_role}"
                )
            return current_user
        return role_checker

    def require_admin(self):
        """Dependency to require admin role."""
        return self.require_role("admin")

    def require_premium(self):
        """Dependency to require premium or higher role."""
        return self.require_role("premium")

    def _is_rate_limited(self, uid: str) -> bool:
        """Check if user is rate limited due to failed attempts."""
        failed_count = self.failed_attempts.get(uid, {}).get("count", 0)
        last_attempt = self.failed_attempts.get(uid, {}).get("last_attempt")
        
        if failed_count >= 5:  # Max 5 failed attempts
            if last_attempt and datetime.utcnow() - last_attempt < timedelta(minutes=15):
                return True
            else:
                # Reset after 15 minutes
                self.failed_attempts.pop(uid, None)
        
        return False

    def _record_failed_attempt(self, uid: str):
        """Record a failed authentication attempt."""
        if uid not in self.failed_attempts:
            self.failed_attempts[uid] = {"count": 0, "last_attempt": None}
        
        self.failed_attempts[uid]["count"] += 1
        self.failed_attempts[uid]["last_attempt"] = datetime.utcnow()

    def generate_api_key(self, uid: str) -> str:
        """Generate API key for user (optional feature)."""
        api_key = f"devsensei_{secrets.token_urlsafe(32)}"
        # In production, store this in database with user association
        return api_key

    def validate_api_key(self, api_key: str) -> Optional[Dict[str, Any]]:
        """Validate API key and return associated user (optional feature)."""
        # In production, look up in database
        if api_key.startswith("devsensei_"):
            # Return demo user for development
            return {
                "uid": "api_user",
                "email": "api@devsensei.com",
                "name": "API User",
                "roles": ["user"]
            }
        return None

# Global instance
auth_service = FirebaseAuthService()

# Dependency functions
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency to get current authenticated user."""
    return await auth_service.get_current_user(credentials)

async def get_admin_user(current_user: Dict[str, Any] = Depends(auth_service.require_admin())):
    """Dependency to require admin role."""
    return current_user

async def get_premium_user(current_user: Dict[str, Any] = Depends(auth_service.require_premium())):
    """Dependency to require premium or higher role."""
    return current_user

async def optional_auth(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))):
    """Optional authentication - returns user if authenticated, None otherwise."""
    if credentials:
        try:
            return await auth_service.get_current_user(credentials)
        except HTTPException:
            return None
    return None
