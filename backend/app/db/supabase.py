import logging
from typing import Optional
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

_supabase_admin_client = None


def get_supabase_client():
    """
    Returns the Supabase admin client initialized with service_role secret key.
    Used exclusively in backend for privileged administrative operations.
    Returns None if credentials are not configured in environment.
    """
    global _supabase_admin_client
    if _supabase_admin_client is not None:
        return _supabase_admin_client

    if not settings.is_supabase_configured:
        logger.info("Supabase credentials not configured. Running in offline/dev fallback mode.")
        return None

    try:
        from supabase import create_client, Client
        _supabase_admin_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY)
        return _supabase_admin_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None


def get_supabase_user_client(access_token: str):
    """
    Returns a Supabase client scoped to an authenticated user's access token.
    This ensures RLS policies apply under the user's identity.
    """
    if not settings.is_supabase_configured or not access_token:
        return None

    try:
        from supabase import create_client, ClientOptions
        client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SECRET_KEY,
            options=ClientOptions(
                headers={"Authorization": f"Bearer {access_token}"}
            )
        )
        return client
    except Exception as e:
        logger.error(f"Failed to initialize user-scoped Supabase client: {e}")
        return None
