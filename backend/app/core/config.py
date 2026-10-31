import os
from pathlib import Path
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
ROOT_DIR = BACKEND_DIR.parent


class Settings(BaseSettings):
    PROJECT_NAME: str = "Tanyara API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # CORS
    ALLOWED_ORIGINS: Union[List[str], str] = "http://localhost:3000,http://127.0.0.1:3000"

    # Supabase (Optional in local development / health check)
    SUPABASE_URL: str = ""
    SUPABASE_SECRET_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""

    # Google Gemini AI
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.8-flash"

    @field_validator("SUPABASE_URL", mode="after")
    @classmethod
    def clean_supabase_url(cls, v: str) -> str:
        if not v:
            return ""
        clean = v.strip()
        # Automatically strip /rest/v1 or trailing slashes if user copied the PostgREST URL
        if "/rest/v1" in clean:
            clean = clean.split("/rest/v1")[0]
        return clean.rstrip("/")

    @property
    def cors_origins(self) -> List[str]:
        if isinstance(self.ALLOWED_ORIGINS, list):
            return self.ALLOWED_ORIGINS
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def is_supabase_configured(self) -> bool:
        return bool(self.SUPABASE_URL and self.SUPABASE_SECRET_KEY)

    @property
    def is_gemini_configured(self) -> bool:
        return bool(self.GEMINI_API_KEY)

    model_config = SettingsConfigDict(
        env_file=[
            str(BACKEND_DIR / ".env"),
            str(ROOT_DIR / ".env"),
            ".env",
            "backend/.env",
        ],
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True
    )


settings = Settings()
