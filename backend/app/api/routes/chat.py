import logging
from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.chat import ChatMessageRequest, ChatMessageResponse
from backend.app.services.chatbot_service import chatbot_service
from backend.app.services.rag_service import rag_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Public Chat"])


@router.post(
    "/public/chat/{slug}/messages",
    response_model=ChatMessageResponse,
    summary="Send message to public chatbot"
)
async def send_chat_message(slug: str, request: ChatMessageRequest):
    """
    Public customer interaction endpoint for /chat/{slug}.
    No authentication required for visitors.
    Validates active chatbot status, retrieves grounded context from RAG,
    and returns verified AI response without exposing internal secrets.
    """
    # 1. Look up public chatbot by slug
    pub_bot = await chatbot_service.get_public_chatbot_by_slug(slug)
    if not pub_bot or not pub_bot.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chatbot tidak ditemukan atau sedang dinonaktifkan oleh pemilik bisnis."
        )

    # 2. Retrieve internal details (system prompt, organization_id)
    full_bot = await chatbot_service.get_chatbot_by_id(pub_bot.id)
    system_prompt = full_bot.system_prompt if full_bot else None
    org_id = full_bot.organization_id if full_bot else None

    # 3. Generate grounded RAG response
    response = await rag_service.generate_chat_response(
        chatbot_id=pub_bot.id,
        system_prompt=system_prompt,
        organization_id=org_id,
        request=request,
    )

    return response
