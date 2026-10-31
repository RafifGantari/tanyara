import logging
from typing import Optional
from fastapi import Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.app.core.config import settings
from backend.app.core.security import AuthUser, verify_supabase_token
from backend.app.db.supabase import get_supabase_client

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> AuthUser:
    """
    Validates Supabase JWT Bearer token and returns verified authenticated user.
    Rejects tampered or unverified tokens.
    """
    if credentials and credentials.credentials:
        token = credentials.credentials
        user = await verify_supabase_token(token)
        if user:
            return user

        # Invalid token provided
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token autentikasi tidak valid atau telah kedaluwarsa.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # If no token provided:
    if settings.DEBUG:
        # Development fallback user
        return AuthUser(
            user_id="user-dev-local-001",
            email="owner@bisnis-tanyara.id",
            role="authenticated",
            raw_claims={"app_metadata": {"org_id": "org-demo-001"}},
            is_dev_fallback=True,
        )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Header autentikasi Bearer token diperlukan.",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def verify_org_membership(
    org_id: str,
    user_id: str,
    required_role: Optional[str] = None
) -> bool:
    """
    Validates that user_id has an active membership record in org_id.
    """
    client = get_supabase_client()
    if not client:
        return True  # Dev mode fallback

    try:
        query = client.table("organization_members").select("role").eq("organization_id", org_id).eq("user_id", user_id)
        if required_role:
            query = query.eq("role", required_role)
        res = query.execute()
        return bool(res.data and len(res.data) > 0)
    except Exception as e:
        logger.error(f"Error checking organization membership: {e}")
        return False


async def get_current_org_id(
    current_user: AuthUser = Depends(get_current_user),
    x_organization_id: Optional[str] = Header(None, alias="X-Organization-Id")
) -> str:
    """
    Enforces tenant isolation by resolving and authorizing the caller's organization ID.
    Rejects any unverified organization ID provided by the client.
    """
    if current_user.is_dev_fallback:
        return x_organization_id or "org-demo-001"

    client = get_supabase_client()
    if not client:
        return "org-demo-001"

    try:
        # If client explicitly specifies an organization, verify their membership in it
        if x_organization_id:
            is_member = await verify_org_membership(x_organization_id, current_user.user_id)
            if not is_member:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Akses ditolak: Anda bukan anggota dari organisasi ini."
                )
            return x_organization_id

        # Otherwise resolve primary organization for user
        res = client.table("organization_members").select("organization_id").eq("user_id", current_user.user_id).limit(1).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]["organization_id"]

        # If authenticated user has no organization yet, auto-provision their initial organization
        meta = current_user.raw_claims or {}
        business_name = (
            meta.get("business_name")
            or meta.get("user_metadata", {}).get("business_name")
        )
        if not business_name and current_user.email:
            name_part = current_user.email.split("@")[0].replace(".", " ").replace("-", " ").title()
            business_name = f"Bisnis {name_part}"
        if not business_name:
            business_name = "Bisnis Saya"

        import re, uuid
        base_slug = re.sub(r'[^a-z0-9]+', '-', business_name.lower()).strip('-') or "bisnis"
        unique_slug = f"{base_slug}-{uuid.uuid4().hex[:6]}"

        org_insert = client.table("organizations").insert({
            "name": business_name,
            "slug": unique_slug,
            "plan": "free"
        }).execute()

        if org_insert.data and len(org_insert.data) > 0:
            new_org_id = org_insert.data[0]["id"]
            client.table("organization_members").insert({
                "organization_id": new_org_id,
                "user_id": current_user.user_id,
                "role": "owner"
            }).execute()
            logger.info(f"Auto-provisioned organization {new_org_id} ('{business_name}') for user {current_user.user_id}")
            return new_org_id

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Pengguna belum terdaftar dalam organisasi mana pun."
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resolving organization ID: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gagal memverifikasi keanggotaan organisasi."
        )
