import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder

from backend.app.core.config import settings
from backend.app.api.router import api_router
from backend.app.schemas.common import HealthCheckResponse, ErrorResponse

# Configure basic logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("tanyara")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Multi-tenant AI Chatbot Platform API for Indonesian Businesses, UMKM, and Organizations",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root health endpoint (as required: GET /health)
@app.get(
    "/health",
    response_model=HealthCheckResponse,
    tags=["Health"],
    summary="Root health status endpoint"
)
async def root_health():
    """Service health status for load balancers and container orchestrators."""
    return HealthCheckResponse(
        status="healthy",
        version="1.0.0",
        environment=settings.ENVIRONMENT,
        supabase_configured=settings.is_supabase_configured,
        gemini_configured=settings.is_gemini_configured,
    )

# Include versioned API router (/api/v1)
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


# Standard Error Handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error on {request.method} {request.url.path}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder(
            ErrorResponse(
                success=False,
                error="Validasi data gagal",
                detail=jsonable_encoder(exc.errors())
            )
        )
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=jsonable_encoder(
            ErrorResponse(
                success=False,
                error="Terjadi kesalahan internal server",
                detail=str(exc) if settings.DEBUG else None
            )
        )
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
