from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from backend.app.schemas.document import DocumentResponse, DocumentCreate
from backend.app.services.document_service import document_service
from backend.app.services.chatbot_service import chatbot_service
from backend.app.api.dependencies import get_current_user, get_current_org_id, AuthUser

router = APIRouter(tags=["Documents"])


@router.get("/chatbots/{chatbot_id}/documents", response_model=List[DocumentResponse], summary="List documents for a chatbot")
async def list_documents(
    chatbot_id: str,
    org_id: str = Depends(get_current_org_id),
    current_user: AuthUser = Depends(get_current_user),
):
    """Retrieve indexed documents for the specified chatbot."""
    cb = await chatbot_service.get_chatbot_by_id(chatbot_id)
    if not cb or cb.organization_id != org_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chatbot tidak ditemukan atau tidak berada di organisasi Anda."
        )

    return await document_service.list_documents(chatbot_id)


@router.post("/chatbots/{chatbot_id}/documents/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED, summary="Upload document directly")
async def upload_document(
    chatbot_id: str,
    file: UploadFile = File(...),
    org_id: str = Depends(get_current_org_id),
    current_user: AuthUser = Depends(get_current_user),
):
    """
    Direct upload & RAG ingestion endpoint for knowledge base files.
    Accepts PDF, DOCX, and TXT files (up to 10MB).
    Extracts text, creates semantic chunks, generates embeddings, and saves to vector store.
    """
    cb = await chatbot_service.get_chatbot_by_id(chatbot_id)
    if not cb or cb.organization_id != org_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chatbot tidak ditemukan atau tidak berada di organisasi Anda."
        )

    content_bytes = await file.read()
    if not content_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Berkas kosong atau tidak dapat dibaca."
        )

    return await document_service.process_and_index_document(
        chatbot_id=chatbot_id,
        filename=file.filename or "dokumen",
        content_bytes=content_bytes,
        mime_type=file.content_type or "application/octet-stream"
    )
