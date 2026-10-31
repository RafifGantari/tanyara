from backend.app.core.config import Settings


def test_settings_cors_parsing():
    settings = Settings(ALLOWED_ORIGINS="http://localhost:3000, https://tanyara.id")
    origins = settings.cors_origins
    assert "http://localhost:3000" in origins
    assert "https://tanyara.id" in origins
    assert len(origins) == 2


def test_settings_defaults():
    settings = Settings(SUPABASE_URL="", GEMINI_API_KEY="")
    assert settings.PROJECT_NAME == "Tanyara API"
    assert settings.API_V1_PREFIX == "/api/v1"
    assert settings.is_supabase_configured is False
    assert settings.is_gemini_configured is False


def test_settings_url_cleaning():
    settings = Settings(SUPABASE_URL="https://myproject.supabase.co/rest/v1/")
    assert settings.SUPABASE_URL == "https://myproject.supabase.co"
