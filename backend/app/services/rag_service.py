import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from backend.app.schemas.chat import ChatMessageRequest, ChatMessageResponse
from backend.app.services.llm.base import LLMMessage
from backend.app.services.llm.gemini import GeminiProvider
from backend.app.core.config import settings
from backend.app.db.supabase import get_supabase_client

logger = logging.getLogger(__name__)


class RAGService:
    """
    RAG (Retrieval-Augmented Generation) Orchestrator.
    Retrieves vector chunks from Supabase pgvector and synthesizes grounded answers with Gemini.
    """

    def __init__(self):
        self._llm_provider: Optional[GeminiProvider] = None

    @property
    def llm_provider(self) -> Optional[GeminiProvider]:
        if self._llm_provider is None and settings.is_gemini_configured:
            self._llm_provider = GeminiProvider()
        return self._llm_provider

    async def retrieve_relevant_chunks(
        self,
        chatbot_id: str,
        query: str,
        threshold: float = 0.4,
        limit: int = 4,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top relevant chunks from pgvector using match_document_chunks RPC.
        Strictly filtered by chatbot_id.
        """
        client = get_supabase_client()
        if not client or not self.llm_provider:
            return []

        try:
            query_embeddings = await self.llm_provider.generate_embeddings([query])
            if not query_embeddings or len(query_embeddings) == 0:
                return []

            query_vector = query_embeddings[0]

            res = client.rpc(
                "match_document_chunks",
                {
                    "query_embedding": query_vector,
                    "filter_chatbot_id": chatbot_id,
                    "match_threshold": threshold,
                    "match_count": limit,
                }
            ).execute()

            return res.data or []
        except Exception as e:
            logger.error(f"Error executing vector retrieval RPC: {e}")
            return []

    async def log_usage(
        self,
        organization_id: Optional[str],
        chatbot_id: str,
        event_type: str,
        prompt_tokens: int,
        completion_tokens: int,
        total_tokens: int,
    ) -> None:
        """Records token accounting and cost in usage_logs table."""
        client = get_supabase_client()
        if not client or not organization_id:
            return

        try:
            client.table("usage_logs").insert({
                "id": str(uuid.uuid4()),
                "organization_id": organization_id,
                "chatbot_id": chatbot_id,
                "event_type": event_type,
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": total_tokens,
                "cost_cents": 0,
                "metadata": {"model": settings.GEMINI_MODEL},
                "created_at": datetime.now(timezone.utc).isoformat()
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to record usage log: {e}")

    async def generate_chat_response(
        self,
        chatbot_id: str,
        system_prompt: Optional[str],
        organization_id: Optional[str],
        request: ChatMessageRequest,
        conversation_history: Optional[List[LLMMessage]] = None,
    ) -> ChatMessageResponse:
        """
        Processes visitor query, searches document knowledge base, and queries Gemini.
        """
        conversation_id = request.conversation_id or f"conv-{uuid.uuid4().hex[:8]}"
        user_query = request.message.strip()

        # Offline / Unconfigured AI Provider notice
        if not settings.is_gemini_configured or self.llm_provider is None:
            return ChatMessageResponse(
                id=f"msg-{uuid.uuid4().hex[:8]}",
                conversation_id=conversation_id,
                role="assistant",
                content=(
                    "[Sistem Tanyara]: Penyedia AI (Gemini API) belum dikonfigurasi pada server ini. "
                    "Harap tambahkan GEMINI_API_KEY pada backend/.env untuk mengaktifkan jawaban AI langsung."
                ),
                sources=[],
                created_at=datetime.now(timezone.utc),
            )

        # 1. Retrieve Knowledge Chunks
        chunks = await self.retrieve_relevant_chunks(chatbot_id, user_query)
        sources: List[str] = []
        context_parts: List[str] = []

        for c in chunks:
            content = c.get("content", "").strip()
            meta = c.get("metadata") or {}
            src = meta.get("source") or "Dokumen Pengetahuan"
            if src not in sources:
                sources.append(src)
            context_parts.append(f"[{src}]: {content}")

        context_text = "\n\n".join(context_parts)

        # 2. Build Guarded System Instruction
        base_instruction = (
            system_prompt
            or "Anda adalah asisten AI ramah dan profesional yang mewakili bisnis ini."
        )

        if context_text:
            augmented_instruction = (
                f"{base_instruction}\n\n"
                "Pedoman Menjawab:\n"
                "1. Jawab pertanyaan pengunjung menggunakan informasi dari KONTEKS DOKUMEN di bawah.\n"
                "2. Jika jawaban ada di dalam dokumen, berikan penjelasan yang ramah, sopan, dan akurat.\n"
                "3. Jangan mengarang informasi atau berhalusinasi di luar dokumen yang disediakan.\n\n"
                f"--- KONTEKS DOKUMEN BISNIS ---\n{context_text}\n--- AKHIR KONTEKS ---"
            )
        else:
            augmented_instruction = (
                f"{base_instruction}\n\n"
                "Perhatian: Saat ini tidak ditemukan potongan dokumen yang secara langsung berkaitan dengan pertanyaan pengunjung. "
                "Jawab dengan ramah bahwa informasi tersebut belum tercantum dalam dokumen resmi bisnis, "
                "dan sarankan pengunjung untuk menghubungi pemilik toko atau staf secara langsung."
            )

        # 3. Assemble message list
        messages: List[LLMMessage] = []
        if conversation_history:
            messages.extend(conversation_history)
        messages.append(LLMMessage(role="user", content=user_query))

        try:
            llm_res = await self.llm_provider.generate_response(
                messages=messages,
                system_instruction=augmented_instruction,
            )

            # 4. Record token usage
            await self.log_usage(
                organization_id=organization_id,
                chatbot_id=chatbot_id,
                event_type="chat_completion",
                prompt_tokens=llm_res.prompt_tokens,
                completion_tokens=llm_res.completion_tokens,
                total_tokens=llm_res.total_tokens,
            )

            return ChatMessageResponse(
                id=f"msg-{uuid.uuid4().hex[:8]}",
                conversation_id=conversation_id,
                role="assistant",
                content=llm_res.content,
                sources=sources,
                created_at=datetime.now(timezone.utc),
            )

        except Exception as e:
            logger.error(f"Error during RAG generation: {e}")
            return ChatMessageResponse(
                id=f"msg-{uuid.uuid4().hex[:8]}",
                conversation_id=conversation_id,
                role="assistant",
                content="Mohon maaf, terjadi kendala saat memproses jawaban asisten. Silakan coba kembali beberapa saat lagi.",
                sources=[],
                created_at=datetime.now(timezone.utc),
            )


rag_service = RAGService()
