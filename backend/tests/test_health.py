import pytest
import httpx


@pytest.mark.asyncio
async def test_root_health_endpoint(async_client: httpx.AsyncClient):
    response = await async_client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == "1.0.0"
    assert "supabase_configured" in data
    assert "gemini_configured" in data


@pytest.mark.asyncio
async def test_api_v1_health_endpoint(async_client: httpx.AsyncClient):
    response = await async_client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == "1.0.0"
