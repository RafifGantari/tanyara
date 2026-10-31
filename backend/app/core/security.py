import logging
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status
from fastapi.security import HTTPBearer
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

security_bearer = HTTPBearer(auto_error=False)


class AuthUser:
    """Authenticated user context verified through Supabase Auth."""
    def __init__(
        self,
        user_id: str,
        email: Optional[str] = None,
        role: str = "authenticated",
        raw_claims: Optional[Dict[str, Any]] = None,
        is_dev_fallback: bool = False,
    ):
        self.user_id = user_id
        self.email = email
        self.role = role
        self.raw_claims = raw_claims or {}
        self.is_dev_fallback = is_dev_fallback

    def __repr__(self) -> str:
        return f"<AuthUser id={self.user_id} email={self.email} role={self.role}>"


async def verify_supabase_token(token: str) -> Optional[AuthUser]:
    """
    Cryptographically verifies a Supabase access token.
    1. If Supabase client is configured, validates via Supabase Auth API `client.auth.get_user(token)`.
    2. If SUPABASE_JWT_SECRET is provided, validates signature with PyJWT.
    Never accepts unverified tokens simply by decoding payload.
    """
    if not token or not token.strip():
        return None

    # Method 1: Cryptographic verification with Supabase JWT Secret if provided
    if settings.SUPABASE_JWT_SECRET:
        try:
            import jwt
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
                options={"verify_exp": True}
            )
            user_id = payload.get("sub") or payload.get("user_id")
            if user_id:
                return AuthUser(
                    user_id=user_id,
                    email=payload.get("email"),
                    role=payload.get("role", "authenticated"),
                    raw_claims=payload,
                    is_dev_fallback=False
                )
        except Exception as e:
            logger.warning(f"JWT signature verification failed: {type(e).__name__}")
            return None

    # Method 2: Validation via Supabase Auth API
    if settings.is_supabase_configured:
        try:
            from backend.app.db.supabase import get_supabase_client
            client = get_supabase_client()
            if client:
                user_res = client.auth.get_user(token)
                if user_res and user_res.user:
                    u = user_res.user
                    return AuthUser(
                        user_id=u.id,
                        email=u.email,
                        role=u.role or "authenticated",
                        raw_claims=u.user_metadata or {},
                        is_dev_fallback=False
                    )
        except Exception as e:
            logger.warning(f"Supabase Auth token verification failed: {type(e).__name__}")
            return None

    return None
