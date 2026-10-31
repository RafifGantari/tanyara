from fastapi import APIRouter
from backend.app.api.routes import health, chatbots, documents, chat, organizations

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(organizations.router)
api_router.include_router(chatbots.router)
api_router.include_router(documents.router)
api_router.include_router(chat.router)
