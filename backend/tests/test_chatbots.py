import pytest
import httpx


@pytest.mark.asyncio
async def test_list_chatbots(async_client: httpx.AsyncClient):
    response = await async_client.get("/api/v1/chatbots")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "name" in data[0]


@pytest.mark.asyncio
async def test_get_public_chatbot_by_slug(async_client: httpx.AsyncClient):
    response = await async_client.get("/api/v1/public/chatbots/cs-toko")
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "cs-toko"
    assert "name" in data
    # Internal fields must be hidden from public visitors
    assert "system_prompt" not in data
    assert "organization_id" not in data


@pytest.mark.asyncio
async def test_get_public_chatbot_not_found(async_client: httpx.AsyncClient):
    response = await async_client.get("/api/v1/public/chatbots/non-existent-bot-12345")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_chatbot_invalid_slug(async_client: httpx.AsyncClient):
    response = await async_client.post(
        "/api/v1/chatbots",
        json={
            "name": "Invalid Slug Bot",
            "slug": "INVALID SLUG WITH SPACES!",
            "welcome_message": "Halo!",
        }
    )
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert "detail" in data


@pytest.mark.asyncio
async def test_update_chatbot(async_client: httpx.AsyncClient):
    response = await async_client.patch(
        "/api/v1/chatbots/cb-demo-001",
        json={
            "description": "Deskripsi baru kedai kopi",
            "welcome_message": "Halo selamat datang di cabang baru kami!"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["description"] == "Deskripsi baru kedai kopi"
    assert data["welcome_message"] == "Halo selamat datang di cabang baru kami!"
