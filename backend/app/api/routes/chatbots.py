from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from backend.app.schemas.chatbot import (
    ChatbotCreate,
    ChatbotUpdate,
    ChatbotResponse,
    ChatbotPublicResponse,
)
from backend.app.services.chatbot_service import chatbot_service
from backend.app.api.dependencies import get_current_user, get_current_org_id, AuthUser

router = APIRouter(tags=["Chatbots"])


@router.get("/chatbots", response_model=List[ChatbotResponse], summary="List organization chatbots")
async def list_chatbots(
    org_id: str = Depends(get_current_org_id),
    current_user: AuthUser = Depends(get_current_user),
):
    """List all chatbots belonging to the caller's organization."""
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
    org_id: str = Depends(get_current_org_id),
    current_user: AuthUser = Depends(get_current_user),
):
    """Retrieve chatbot management information for owner."""
    cb = await chatbot_service.get_chatbot_by_id(chatbot_id)
    if not cb or cb.organization_id != org_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chatbot tidak ditemukan atau tidak berada di organisasi Anda."
        )
    return cb


@router.patch("/chatbots/{chatbot_id}", response_model=ChatbotResponse, summary="Update chatbot configuration")
async def update_chatbot(
    chatbot_id: str,
    payload: ChatbotUpdate,
    org_id: str = Depends(get_current_org_id),
    current_user: AuthUser = Depends(get_current_user),
):
    """Update existing chatbot configuration (prompt, name, message, status)."""
    updated = await chatbot_service.update_chatbot(chatbot_id, payload, organization_id=org_id)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chatbot tidak ditemukan atau Anda tidak memiliki izin untuk mengubahnya."
        )
    return updated


@router.get("/public/chatbots/{slug}", response_model=ChatbotPublicResponse, summary="Public chatbot profile for visitors")
async def get_public_chatbot(slug: str):
    """
    Publicly accessible endpoint for customers chatting via /chat/{slug}.
    Exposes only safe non-sensitive metadata (name, welcome message, status).
    Never exposes internal system_prompt or organization_id.
    """
    cb = await chatbot_service.get_public_chatbot_by_slug(slug)
    if not cb or not cb.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chatbot tidak ditemukan atau sedang tidak aktif."
        )
    return cb
