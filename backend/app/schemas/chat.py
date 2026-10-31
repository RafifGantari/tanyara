from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="Visitor query or message")
    conversation_id: Optional[str] = Field(None, description="Existing conversation ID if ongoing session")
    visitor_session_id: Optional[str] = Field(None, max_length=100, description="Client-side session fingerprint")


class ChatMessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str = Field(..., description="assistant | user | system")
    content: str
    sources: Optional[List[str]] = Field(default=[], description="Referenced document snippets or titles")
    created_at: datetime


class ConversationResponse(BaseModel):
    id: str
    chatbot_id: str
    visitor_session_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
