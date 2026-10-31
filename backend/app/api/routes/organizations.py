import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from backend.app.schemas.organization import OrganizationCreate, OrganizationResponse
from backend.app.api.dependencies import get_current_user, AuthUser
from backend.app.db.supabase import get_supabase_client

router = APIRouter(tags=["Organizations"])

_DEV_ORGS = [
    {
        "id": "org-demo-001",
        "name": "Bisnis Toko Demo",
        "slug": "bisnis-toko-demo",
        "plan": "free",
        "role": "owner",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
]


@router.get("/organizations", response_model=List[OrganizationResponse], summary="List user's organizations")
async def list_user_organizations(current_user: AuthUser = Depends(get_current_user)):
    """Returns organizations where the authenticated caller is a member."""
    client = get_supabase_client()
    if client and not current_user.is_dev_fallback:
        res = client.table("organization_members").select("role, organizations(*)").eq("user_id", current_user.user_id).execute()
        results = []
        for row in res.data:
            org = row.get("organizations")
            if org:
                results.append(OrganizationResponse(
                    id=org["id"],
                    name=org["name"],
                    slug=org["slug"],
                    plan=org.get("plan", "free"),
                    role=row.get("role", "member"),
                    created_at=org["created_at"],
                    updated_at=org["updated_at"],
                ))
        return results

    return [OrganizationResponse(**o) for o in _DEV_ORGS]


@router.post("/organizations", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED, summary="Create a new organization")
async def create_organization(
    payload: OrganizationCreate,
    current_user: AuthUser = Depends(get_current_user),
):
    """
    Creates a new business organization and establishes caller as the owner.
    """
    org_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    client = get_supabase_client()

    if client and not current_user.is_dev_fallback:
        # 1. Insert organization
        org_res = client.table("organizations").insert({
            "id": org_id,
            "name": payload.name,
            "slug": payload.slug.strip().lower(),
            "plan": payload.plan,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }).execute()

        if not org_res.data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Gagal membuat organisasi.")

        # 2. Insert owner membership
        client.table("organization_members").insert({
            "id": str(uuid.uuid4()),
            "organization_id": org_id,
            "user_id": current_user.user_id,
            "role": "owner",
            "created_at": now.isoformat()
        }).execute()

        return OrganizationResponse(
            id=org_id,
            name=payload.name,
            slug=payload.slug.strip().lower(),
            plan=payload.plan,
            role="owner",
            created_at=now,
            updated_at=now
        )

    # Dev fallback
    new_org = {
        "id": org_id,
        "name": payload.name,
        "slug": payload.slug.strip().lower(),
        "plan": payload.plan,
        "role": "owner",
        "created_at": now,
        "updated_at": now
    }
    _DEV_ORGS.append(new_org)
    return OrganizationResponse(**new_org)
