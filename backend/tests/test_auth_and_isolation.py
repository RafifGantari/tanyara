import pytest
import httpx
from backend.app.core.config import settings


@pytest.mark.asyncio
async def test_invalid_bearer_token_rejected(async_client: httpx.AsyncClient):
    headers = {"Authorization": "Bearer invalid.fake.token12345"}
    response = await async_client.get("/api/v1/chatbots", headers=headers)
    assert response.status_code == 401
    assert "tidak valid" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_tenant_isolation_mismatched_org(async_client: httpx.AsyncClient):
    # Trying to access cb-demo-001 (which belongs to org-demo-001) under a different header org
    headers = {"X-Organization-Id": "org-other-intruder"}
    response = await async_client.get("/api/v1/chatbots/cb-demo-001", headers=headers)
    assert response.status_code == 404
    assert "tidak ditemukan" in response.json()["detail"].lower()
