from fastapi import APIRouter
from backend.app.schemas.common import HealthCheckResponse
from backend.app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthCheckResponse, summary="Service health check")
async def health_check():
    """
    Returns system status, environment, and external integration readiness.
    Used by container orchestrators, load balancers, and monitoring systems.
    """
    return HealthCheckResponse(
        status="healthy",
        version="1.0.0",
        environment=settings.ENVIRONMENT,
        supabase_configured=settings.is_supabase_configured,
        gemini_configured=settings.is_gemini_configured,
    )
