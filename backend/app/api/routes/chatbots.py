from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from backend.app.schemas.chatbot import (
    ChatbotCreate,
    ChatbotUpdate,
    ChatbotResponse,
    ChatbotPublicResponse,
)
from backend.app.services.chatbot_service import chatbot_service
from backend.app.api.dependencies import get_current_user, get_current_org_id, verify_org_membership, AuthUser
from backend.app.db.supabase import get_supabase_client

router = APIRouter(tags=["Chatbots"])


@router.get("/chatbots", response_model=List[ChatbotResponse], summary="List organization chatbots")
async def list_chatbots(
    current_user: AuthUser = Depends(get_current_user),
    org_id: str = Depends(get_current_org_id),
):
    """List all chatbots belonging to the caller's organization(s)."""
    client = get_supabase_client()
    if client and not current_user.is_dev_fallback:
        res = client.table("organization_members").select("organization_id").eq("user_id", current_user.user_id).execute()
        if res.data and len(res.data) > 0:
            all_bots = []
            seen_ids = set()
            for row in res.data:
                o_id = row.get("organization_id")
                bots = await chatbot_service.list_chatbots(organization_id=o_id)
                for b in bots:
                    if b.id not in seen_ids:
                        seen_ids.add(b.id)
                        all_bots.append(b)
            return all_bots
    return await chatbot_service.list_chatbots(organization_id=org_id)


@router.post("/chatbots", response_model=ChatbotResponse, status_code=status.HTTP_201_CREATED, summary="Create a new chatbot")
async def create_chatbot(
    payload: ChatbotCreate,
    org_id: str = Depends(get_current_org_id),
    current_user: AuthUser = Depends(get_current_user),
):
    """Creates a new chatbot strictly isolated within the user's organization."""
    return await chatbot_service.create_chatbot(data=payload, organization_id=org_id)


@router.get("/chatbots/{chatbot_id}", response_model=ChatbotResponse, summary="Get chatbot details")
async def get_chatbot(
    chatbot_id: str,
    current_user: AuthUser = Depends(get_current_user),
    x_organization_id: Optional[str] = Header(None, alias="X-Organization-Id"),
):
    """Retrieve chatbot management information for owner."""
    cb = await chatbot_service.get_chatbot_by_id(chatbot_id)
    if not cb:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chatbot tidak ditemukan."
        )

    if x_organization_id and cb.organization_id != x_organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chatbot tidak ditemukan atau tidak berada di organisasi Anda."
        )

    is_member = await verify_org_membership(cb.organization_id, current_user.user_id)
    if not is_member and not current_user.is_dev_fallback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chatbot tidak ditemukan atau tidak berada di organisasi Anda."
        )
    return cb


@router.patch("/chatbots/{chatbot_id}", response_model=ChatbotResponse, summary="Update chatbot configuration")
async def update_chatbot(
    chatbot_id: str,
    payload: ChatbotUpdate,
    current_user: AuthUser = Depends(get_current_user),
    x_organization_id: Optional[str] = Header(None, alias="X-Organization-Id"),
):
    """Update existing chatbot configuration (prompt, name, message, status)."""
    cb = await chatbot_service.get_chatbot_by_id(chatbot_id)
    if not cb:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chatbot tidak ditemukan."
        )

    if x_organization_id and cb.organization_id != x_organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chatbot tidak ditemukan atau tidak berada di organisasi Anda."
        )

    is_member = await verify_org_membership(cb.organization_id, current_user.user_id)
    if not is_member and not current_user.is_dev_fallback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chatbot tidak ditemukan atau Anda tidak memiliki izin untuk mengubahnya."
        )

    updated = await chatbot_service.update_chatbot(chatbot_id, payload, organization_id=cb.organization_id)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chatbot tidak ditemukan atau Anda tidak memiliki izin untuk mengubahnya."
        )
    return updated


@router.get("/public/chatbots/{slug}", response_model=ChatbotPublicResponse, summary="Public chatbot profile for visitors")
@router.get("/public/chatbots/{org_slug}/{slug}", response_model=ChatbotPublicResponse, summary="Public chatbot profile by store and bot slug")
async def get_public_chatbot(slug: str, org_slug: str = None):
    """
    Publicly accessible endpoint for customers chatting via /chat/[nama-toko]/[namachatbot].
    Exposes only safe non-sensitive metadata (name, welcome message, status, organization).
    Never exposes internal system_prompt or organization_id.
    """
    cb = await chatbot_service.get_public_chatbot_by_slug(slug, org_slug=org_slug)
    if not cb or not cb.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chatbot tidak ditemukan atau sedang tidak aktif."
        )
    return cb
