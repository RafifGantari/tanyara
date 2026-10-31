from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class DocumentBase(BaseModel):
    name: str = Field(..., max_length=255, description="Original filename or document title")
    mime_type: Optional[str] = Field(None, max_length=100)
    file_size_bytes: Optional[int] = Field(None, ge=0)


class DocumentCreate(DocumentBase):
    chatbot_id: str
    storage_path: str = Field(..., description="Supabase storage path")


class DocumentResponse(DocumentBase):
    id: str
    chatbot_id: str
    status: str = Field(default="pending", description="pending | processing | indexed | failed")
    error_message: Optional[str] = None
    chunk_count: int = Field(default=0)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
