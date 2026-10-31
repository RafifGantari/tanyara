import io
import re
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from fastapi import UploadFile, HTTPException, status

from backend.app.schemas.document import DocumentResponse, DocumentCreate
from backend.app.db.supabase import get_supabase_client
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# Allowed file types and limits
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/octet-stream", # Some browsers send this for docx/pdf
}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

STORAGE_BUCKET_NAME = "documents"

_DEV_DOCUMENTS = [
    {
        "id": "doc-demo-001",
        "chatbot_id": "cb-demo-001",
        "name": "Buku_Menu_Kopi_Nusantara.pdf",
        "mime_type": "application/pdf",
        "file_size_bytes": 1048576,
        "storage_path": "chatbots/cb-demo-001/Buku_Menu_Kopi_Nusantara.pdf",
        "status": "indexed",
        "error_message": None,
        "chunk_count": 8,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    },
    {
        "id": "doc-demo-002",
        "chatbot_id": "cb-demo-001",
        "name": "FAQ_dan_Jam_Operasional.pdf",
        "mime_type": "application/pdf",
        "file_size_bytes": 524288,
        "storage_path": "chatbots/cb-demo-001/FAQ_dan_Jam_Operasional.pdf",
        "status": "indexed",
        "error_message": None,
        "chunk_count": 4,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
]


def sanitize_filename(filename: str) -> str:
    """Sanitizes filename to prevent directory traversal and invalid characters."""
    import os
    base = os.path.basename(filename.strip().replace("\\", "/"))
    clean = re.sub(r"[^a-zA-Z0-9_.-]", "_", base)
    clean = clean.lstrip(".")
    return clean or f"doc_{uuid.uuid4().hex[:6]}"


def extract_text_from_file(content_bytes: bytes, filename: str) -> str:
    """
    Extracts plain text from PDF, DOCX, or TXT file contents.
    """
    ext = filename.lower().split(".")[-1] if "." in filename else ""

    if ext == "pdf":
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(content_bytes))
            text_parts = []
            for idx, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    text_parts.append(page_text.strip())
            return "\n\n".join(text_parts)
        except Exception as e:
            logger.error(f"Error parsing PDF file: {e}")
            raise ValueError(f"Gagal membaca berkas PDF: {e}")

    elif ext == "docx":
        try:
            import docx
            doc = docx.Document(io.BytesIO(content_bytes))
            text_parts = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
            for table in doc.tables:
                for row in table.rows:
                    row_text = " | ".join([cell.text.strip() for cell in row.cells if cell.text.strip()])
                    if row_text:
                        text_parts.append(row_text)
            return "\n\n".join(text_parts)
        except Exception as e:
            logger.error(f"Error parsing DOCX file: {e}")
            raise ValueError(f"Gagal membaca berkas DOCX: {e}")

    elif ext == "txt":
        try:
            return content_bytes.decode("utf-8")
        except UnicodeDecodeError:
            return content_bytes.decode("latin-1")

    raise ValueError(f"Format berkas .{ext} tidak didukung. Hanya PDF, DOCX, dan TXT yang didukung.")


def chunk_text(text: str, chunk_size: int = 600, chunk_overlap: int = 100) -> List[str]:
    """
    Splits document text into overlapping chunks suitable for embedding and retrieval.
    """
    if not text or not text.strip():
        return []

    clean_text = re.sub(r"\s+", " ", text).strip()
    if len(clean_text) <= chunk_size:
        return [clean_text]

    chunks: List[str] = []
    start = 0
    text_len = len(clean_text)

    while start < text_len:
        end = start + chunk_size
        chunk = clean_text[start:end]

        # Break at word boundary if possible
        if end < text_len:
            last_space = chunk.rfind(" ")
            if last_space > chunk_size // 2:
                chunk = chunk[:last_space]
                start += last_space + 1
            else:
                start += chunk_size - chunk_overlap
        else:
            start = text_len

        clean_chunk = chunk.strip()
        if clean_chunk:
            chunks.append(clean_chunk)

    return chunks


class DocumentService:
    def __init__(self):
        self.supabase = get_supabase_client()

    async def list_documents(self, chatbot_id: str) -> List[DocumentResponse]:
        """List documents associated with a chatbot."""
        client = get_supabase_client()
        if client:
            res = client.table("documents").select("*").eq("chatbot_id", chatbot_id).order("created_at", desc=True).execute()
            return [DocumentResponse(**row) for row in res.data]

        # Dev fallback
        return [DocumentResponse(**d) for d in _DEV_DOCUMENTS if d["chatbot_id"] == chatbot_id]

    async def get_document(self, document_id: str) -> Optional[DocumentResponse]:
        """Retrieve document metadata by ID."""
        client = get_supabase_client()
        if client:
            res = client.table("documents").select("*").eq("id", document_id).single().execute()
            if res.data:
                return DocumentResponse(**res.data)
            return None

        for d in _DEV_DOCUMENTS:
            if d["id"] == document_id:
                return DocumentResponse(**d)
        return None

    async def process_and_index_document(
        self,
        chatbot_id: str,
        filename: str,
        content_bytes: bytes,
        mime_type: str,
    ) -> DocumentResponse:
        """
        Full ingestion pipeline:
        1. Validates file extension, size, and mime type.
        2. Uploads file to private Supabase Storage bucket 'documents'.
        3. Creates document record in status 'processing'.
        4. Extracts text from PDF, DOCX, or TXT.
        5. Chunks text into semantic blocks.
        6. Generates vector embeddings via Gemini text-embedding-004.
        7. Saves chunks & embeddings to PostgreSQL document_chunks table.
        8. Updates document status to 'indexed'.
        """
        # 1. Validation
        ext = ("." + filename.rsplit(".", 1)[-1].lower()) if "." in filename else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Format berkas '{ext}' tidak didukung. Harap unggah berkas PDF, DOCX, atau TXT."
            )

        file_size = len(content_bytes)
        if file_size > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ukuran berkas melebihi batas maksimal 10 MB."
            )

        safe_name = sanitize_filename(filename)
        doc_id = str(uuid.uuid4())
        storage_path = f"chatbots/{chatbot_id}/{doc_id}_{safe_name}"
        now = datetime.now(timezone.utc)

        client = get_supabase_client()

        # 2. Upload to Supabase Storage if configured
        if client:
            try:
                client.storage.from_(STORAGE_BUCKET_NAME).upload(
                    path=storage_path,
                    file=content_bytes,
                    file_options={"content-type": mime_type}
                )
            except Exception as e:
                logger.warning(f"Storage upload notice (bucket may need creation): {e}")

        # 3. Create initial document record
        initial_record = {
            "id": doc_id,
            "chatbot_id": chatbot_id,
            "name": safe_name,
            "mime_type": mime_type,
            "file_size_bytes": file_size,
            "storage_path": storage_path,
            "status": "processing",
            "chunk_count": 0,
            "error_message": None,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }

        if client:
            client.table("documents").insert(initial_record).execute()

        # 4. Text Extraction
        try:
            extracted_text = extract_text_from_file(content_bytes, safe_name)
            if not extracted_text.strip():
                raise ValueError("Dokumen tidak berisi teks yang dapat diekstraksi.")

            # 5. Chunking
            chunks = chunk_text(extracted_text, chunk_size=600, chunk_overlap=100)
            if not chunks:
                raise ValueError("Tidak ada potongan teks yang valid dari dokumen.")

            # 6. Embeddings (if Gemini is configured)
            chunk_records = []
            if settings.is_gemini_configured and client:
                from backend.app.services.llm.gemini import GeminiProvider
                gemini = GeminiProvider()
                embeddings = await gemini.generate_embeddings(chunks)

                for idx, (chunk_content, emb) in enumerate(zip(chunks, embeddings)):
                    chunk_records.append({
                        "id": str(uuid.uuid4()),
                        "document_id": doc_id,
                        "chatbot_id": chatbot_id,
                        "content": chunk_content,
                        "embedding": emb,
                        "chunk_index": idx,
                        "token_count": len(chunk_content.split()),
                        "metadata": {"source": safe_name, "chunk_index": idx},
                        "created_at": now.isoformat()
                    })

                if chunk_records:
                    client.table("document_chunks").insert(chunk_records).execute()

            # 7. Update status to indexed
            final_status = "indexed"
            chunk_count = len(chunks)
            error_msg = None

            if client:
                client.table("documents").update({
                    "status": final_status,
                    "chunk_count": chunk_count,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }).eq("id", doc_id).execute()

        except Exception as e:
            logger.error(f"Document indexing failed for {safe_name}: {e}")
            final_status = "failed"
            chunk_count = 0
            error_msg = str(e)
            if client:
                client.table("documents").update({
                    "status": final_status,
                    "error_message": error_msg,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }).eq("id", doc_id).execute()

        doc_result = {
            **initial_record,
            "status": final_status,
            "chunk_count": chunk_count,
            "error_message": error_msg,
            "updated_at": datetime.now(timezone.utc),
        }

        # Offline store fallback
        _DEV_DOCUMENTS.append(doc_result)
        return DocumentResponse(**doc_result)


document_service = DocumentService()
