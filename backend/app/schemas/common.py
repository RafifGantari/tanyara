from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel, Field

DataT = TypeVar("DataT")


class HealthCheckResponse(BaseModel):
    status: str = Field(default="healthy", description="Application health status")
    version: str = Field(default="1.0.0", description="API version")
    environment: str = Field(default="development", description="Current running environment")
    supabase_configured: bool = Field(default=False, description="Whether Supabase client is configured")
    gemini_configured: bool = Field(default=False, description="Whether Gemini AI client is configured")


class ApiResponse(BaseModel, Generic[DataT]):
    success: bool = True
    message: Optional[str] = None
    data: Optional[DataT] = None


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: Optional[Any] = None
