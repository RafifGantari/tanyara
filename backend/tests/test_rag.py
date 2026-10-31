from unittest.mock import AsyncMock, patch
import pytest
import httpx
from backend.app.services.rag_service import rag_service
from backend.app.services.llm.base import LLMResponse


@pytest.mark.asyncio
async def test_public_chat_message_flow(async_client: httpx.AsyncClient):
    with patch("backend.app.services.rag_service.rag_service.retrieve_relevant_chunks", new_callable=AsyncMock) as mock_chunks:
        mock_chunks.return_value = [{"content": "Kopi Aceh Gayo tersedia mulai Rp 28.000", "metadata": {"source": "menu.pdf"}}]
        
        # Mock LLM generation to avoid network blocking
        if rag_service.llm_provider:
            with patch.object(rag_service.llm_provider, "generate_response", new_callable=AsyncMock) as mock_llm:
                mock_llm.return_value = LLMResponse(content="Tersedia kopi Aceh Gayo seharga Rp 28.000.")
                response = await async_client.post(
                    "/api/v1/public/chat/cs-toko/messages",
                    json={"message": "Apakah ada promo hari ini?"}
                )
                assert response.status_code == 200
                data = response.json()
                assert data["role"] == "assistant"
        else:
            response = await async_client.post(
                "/api/v1/public/chat/cs-toko/messages",
                json={"message": "Apakah ada promo hari ini?"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["role"] == "assistant"


@pytest.mark.asyncio
async def test_public_chat_inactive_bot_rejected(async_client: httpx.AsyncClient):
    response = await async_client.post(
        "/api/v1/public/chat/non-existent-bot-slug-999/messages",
        json={"message": "Halo"}
    )
    assert response.status_code == 404
