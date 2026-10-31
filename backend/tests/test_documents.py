import io
import pytest
import httpx
from backend.app.services.document_service import chunk_text, extract_text_from_file, sanitize_filename


def test_sanitize_filename():
    assert sanitize_filename("Buku Menu 2026!?.pdf") == "Buku_Menu_2026__.pdf"
    assert sanitize_filename("../../etc/passwd.pdf") == "passwd.pdf"
    assert sanitize_filename("") != ""


def test_chunk_text():
    sample_text = (
        "Kedai Kopi Nusantara menyajikan aneka kopi pilihan dari seluruh nusantara. "
        "Mulai dari kopi Aceh Gayo, Mandailing, Toraja, hingga Kintamani Bali. "
        "Kami buka setiap hari mulai pukul 08.00 pagi sampai 22.00 malam. "
        "Fasilitas lengkap mencakup WiFi berkecepatan tinggi, area merokok luar ruangan, "
        "dan mushola bersih."
    )
    chunks = chunk_text(sample_text, chunk_size=80, chunk_overlap=20)
    assert len(chunks) >= 2
    assert all(len(c) > 0 for c in chunks)


def test_extract_text_txt():
    content = "Menu Spesial: Es Kopi Susu Gula Aren seharga Rp 18.000.".encode("utf-8")
    extracted = extract_text_from_file(content, "menu.txt")
    assert "Es Kopi Susu Gula Aren" in extracted


def test_extract_text_unsupported():
    with pytest.raises(ValueError, match="tidak didukung"):
        extract_text_from_file(b"PK0304zipcontent", "archive.zip")


@pytest.mark.asyncio
async def test_upload_unsupported_file_extension(async_client: httpx.AsyncClient):
    files = {"file": ("malicious.exe", b"MZexecutabledata", "application/octet-stream")}
    response = await async_client.post("/api/v1/chatbots/cb-demo-001/documents/upload", files=files)
    assert response.status_code == 400
    data = response.json()
    assert "tidak didukung" in data["detail"]
