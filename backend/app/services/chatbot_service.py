import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from backend.app.schemas.chatbot import ChatbotCreate, ChatbotUpdate, ChatbotResponse, ChatbotPublicResponse
from backend.app.db.supabase import get_supabase_client

logger = logging.getLogger(__name__)

_DEV_CHATBOTS = [
    {
        "id": "cb-demo-001",
        "organization_id": "org-demo-001",
        "name": "Asisten Kedai Kopi Nusantara",
        "slug": "kedai-kopi-nusantara",
        "description": "Asisten virtual untuk info menu, jam buka, dan pemesanan meja kopi lokal nusantara.",
        "welcome_message": "Selamat datang di Kedai Kopi Nusantara! Ada yang bisa kami bantu seputar menu biji kopi pilihan atau reservasi?",
        "system_prompt": "Anda adalah asisten ramah Kedai Kopi Nusantara. Jawab pertanyaan seputar menu, harga, dan lokasi berdasarkan informasi toko.",
        "is_active": True,
        "document_count": 2,
        "conversation_count": 14,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
]


class ChatbotService:
    def __init__(self):
        pass

    async def list_chatbots(self, organization_id: Optional[str] = None) -> List[ChatbotResponse]:
        """List all chatbots belonging to an organization."""
        client = get_supabase_client()
        if client:
            try:
                query = client.table("chatbots").select("*, documents(count), conversations(count)")
                if organization_id:
                    query = query.eq("organization_id", organization_id)
                res = query.execute()
                if res.data and len(res.data) > 0:
                    items = []
                    for row in res.data:
                        items.append(ChatbotResponse(
                            id=row["id"],
                            organization_id=row["organization_id"],
                            name=row["name"],
                            slug=row["slug"],
                            description=row.get("description"),
                            welcome_message=row.get("welcome_message", "Halo! Ada yang bisa saya bantu?"),
                            system_prompt=row.get("system_prompt"),
                            is_active=row.get("is_active", True),
                            document_count=row.get("documents", [{}])[0].get("count", 0) if isinstance(row.get("documents"), list) and len(row.get("documents", [])) > 0 else 0,
                            conversation_count=row.get("conversations", [{}])[0].get("count", 0) if isinstance(row.get("conversations"), list) and len(row.get("conversations", [])) > 0 else 0,
                            created_at=row.get("created_at"),
                            updated_at=row.get("updated_at")
                        ))
                    return items
            except Exception as e:
                logger.warning(f"Failed to list chatbots from Supabase: {e}")

        # Fallback to dev chatbots
        return [ChatbotResponse(**cb) for cb in _DEV_CHATBOTS]

    async def get_chatbot_by_id(self, chatbot_id: str) -> Optional[ChatbotResponse]:
        """Get chatbot details by internal ID for owner management."""
        client = get_supabase_client()
        if client:
            try:
                res = client.table("chatbots").select("*, documents(count), conversations(count)").eq("id", chatbot_id).limit(1).execute()
                if res.data and len(res.data) > 0:
                    row = res.data[0]
                    return ChatbotResponse(
                        id=row["id"],
                        organization_id=row["organization_id"],
                        name=row["name"],
                        slug=row["slug"],
                        description=row.get("description"),
                        welcome_message=row.get("welcome_message", "Halo! Ada yang bisa saya bantu?"),
                        system_prompt=row.get("system_prompt"),
                        is_active=row.get("is_active", True),
                        document_count=row.get("documents", [{}])[0].get("count", 0) if isinstance(row.get("documents"), list) and len(row.get("documents", [])) > 0 else 0,
                        conversation_count=row.get("conversations", [{}])[0].get("count", 0) if isinstance(row.get("conversations"), list) and len(row.get("conversations", [])) > 0 else 0,
                        created_at=row.get("created_at"),
                        updated_at=row.get("updated_at")
                    )
            except Exception as e:
                logger.warning(f"Error fetching chatbot {chatbot_id} from Supabase: {e}")

        for cb in _DEV_CHATBOTS:
            if cb["id"] == chatbot_id:
                return ChatbotResponse(**cb)
        return None

    async def get_public_chatbot_by_slug(self, slug: str) -> Optional[ChatbotPublicResponse]:
        """Get safe public chatbot information by unique slug for visitors."""
        client = get_supabase_client()
        if client:
            try:
                res = client.table("chatbots").select("id, name, description, welcome_message, slug, is_active").eq("slug", slug).eq("is_active", True).limit(1).execute()
                if res.data and len(res.data) > 0:
                    return ChatbotPublicResponse(**res.data[0])
            except Exception as e:
                logger.warning(f"Error fetching public chatbot {slug} from Supabase: {e}")

        for cb in _DEV_CHATBOTS:
            if cb["slug"] == slug and cb["is_active"]:
                return ChatbotPublicResponse(
                    id=cb["id"],
                    name=cb["name"],
                    description=cb["description"],
                    welcome_message=cb["welcome_message"],
                    slug=cb["slug"],
                    is_active=cb["is_active"]
                )
        return None

    async def create_chatbot(self, data: ChatbotCreate, organization_id: str) -> ChatbotResponse:
        """Create a new chatbot isolated within the user's organization."""
        now = datetime.now(timezone.utc)
        record = {
            "id": str(uuid.uuid4()),
            "organization_id": organization_id,
            "name": data.name,
            "slug": data.slug,
            "description": data.description,
            "welcome_message": data.welcome_message,
            "system_prompt": data.system_prompt,
            "is_active": data.is_active,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }

        client = get_supabase_client()
        if client:
            try:
                res = client.table("chatbots").insert(record).execute()
                if res.data and len(res.data) > 0:
                    return ChatbotResponse(
                        document_count=0,
                        conversation_count=0,
                        **res.data[0]
                    )
            except Exception as e:
                logger.warning(f"Failed to insert chatbot into Supabase: {e}")

        new_cb = {
            **record,
            "created_at": now,
            "updated_at": now,
            "document_count": 0,
            "conversation_count": 0
        }
        _DEV_CHATBOTS.append(new_cb)
        return ChatbotResponse(**new_cb)

    async def update_chatbot(self, chatbot_id: str, data: ChatbotUpdate, organization_id: str) -> Optional[ChatbotResponse]:
        """Update existing chatbot configuration."""
        client = get_supabase_client()
        update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items()}
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

        if client:
            try:
                res = client.table("chatbots").update(update_data).eq("id", chatbot_id).eq("organization_id", organization_id).execute()
                if res.data and len(res.data) > 0:
                    return await self.get_chatbot_by_id(chatbot_id)
            except Exception as e:
                logger.warning(f"Failed to update chatbot in Supabase: {e}")

        for cb in _DEV_CHATBOTS:
            if cb["id"] == chatbot_id and cb["organization_id"] == organization_id:
                cb.update(update_data)
                return ChatbotResponse(**cb)
        return None


chatbot_service = ChatbotService()
