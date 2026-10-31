from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Header
from backend.app.schemas.document import DocumentResponse, DocumentCreate
from backend.app.services.document_service import document_service
from backend.app.services.chatbot_service import chatbot_service
from backend.app.api.dependencies import get_current_user, verify_org_membership, AuthUser

router = APIRouter(tags=["Documents"])


@router.get("/chatbots/{chatbot_id}/documents", response_model=List[DocumentResponse], summary="List documents for a chatbot")
async def list_documents(
    chatbot_id: str,
    current_user: AuthUser = Depends(get_current_user),
    x_organization_id: Optional[str] = Header(None, alias="X-Organization-Id"),
):
    """Retrieve indexed documents for the specified chatbot."""
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
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chatbot tidak ditemukan atau tidak berada di organisasi Anda."
        )

    return await document_service.list_documents(chatbot_id)


@router.post("/chatbots/{chatbot_id}/documents/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED, summary="Upload document directly")
async def upload_document(
    chatbot_id: str,
    file: UploadFile = File(...),
    current_user: AuthUser = Depends(get_current_user),
    x_organization_id: Optional[str] = Header(None, alias="X-Organization-Id"),
):
    """
    Direct upload & RAG ingestion endpoint for knowledge base files.
    Accepts PDF, DOCX, and TXT files (up to 10MB).
    Extracts text, creates semantic chunks, generates embeddings, and saves to vector store.
    """
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
            status_code=status.HTTP_403_FORBIDDEN,
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


@router.delete("/chatbots/{chatbot_id}/documents/{document_id}", summary="Delete document and chunks")
async def delete_document(
    chatbot_id: str,
    document_id: str,
    current_user: AuthUser = Depends(get_current_user),
    x_organization_id: Optional[str] = Header(None, alias="X-Organization-Id"),
):
    """Delete a document and its indexed vector embeddings."""
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
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chatbot tidak ditemukan atau tidak berada di organisasi Anda."
        )

    success = await document_service.delete_document(chatbot_id=chatbot_id, document_id=document_id)
    return {"success": success, "message": "Dokumen berhasil dihapus."}
