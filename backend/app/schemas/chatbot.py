from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator, ConfigDict
import re


class ChatbotBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Chatbot name")
    description: Optional[str] = Field(None, max_length=500, description="Short description of the chatbot")
    welcome_message: str = Field(
        default="Halo! Ada yang bisa saya bantu hari ini?",
        max_length=500,
        description="Initial greeting message shown to visitors"
    )
    system_prompt: Optional[str] = Field(
        default="Anda adalah asisten AI yang ramah, profesional, dan membantu pelanggan dengan informasi akurat berdasarkan dokumen bisnis yang disediakan.",
        max_length=2000,
        description="System instruction guidance for the bot"
    )
    is_active: bool = Field(default=True, description="Whether the chatbot is publicly active")


class ChatbotCreate(ChatbotBase):
    slug: str = Field(..., min_length=3, max_length=50, description="Unique URL slug (e.g. asisten-toko)")
    organization_id: Optional[str] = Field(None, description="Target organization ID")

    @field_validator("slug")
    def validate_slug(cls, v: str) -> str:
        clean_slug = v.strip().lower()
        if not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", clean_slug):
            raise ValueError("Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (-)")
        return clean_slug


class ChatbotUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    welcome_message: Optional[str] = Field(None, max_length=500)
    system_prompt: Optional[str] = Field(None, max_length=2000)
    is_active: Optional[bool] = None


class ChatbotResponse(ChatbotBase):
    id: str
    organization_id: str
    organization_slug: Optional[str] = None
    organization_name: Optional[str] = None
    slug: str
    document_count: int = Field(default=0, description="Total documents attached")
    conversation_count: int = Field(default=0, description="Total customer conversations")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatbotPublicResponse(BaseModel):
    """Safe schema for unauthenticated public visitors accessing /chat/[nama-toko]/[namachatbot]."""
    id: str
    name: str
    description: Optional[str] = None
    welcome_message: str
    slug: str
    organization_slug: Optional[str] = None
    organization_name: Optional[str] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
