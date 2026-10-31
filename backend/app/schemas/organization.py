from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Organization or business name")
    slug: str = Field(..., min_length=2, max_length=50, description="Unique slug for organization")
    plan: str = Field(default="free", description="Subscription plan: free | pro | enterprise")


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationResponse(OrganizationBase):
    id: str
    role: Optional[str] = Field(default="owner", description="Caller's role in this organization")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
