# Arsitektur Sistem Tanyara (Phase 2 Update)

Dokumen ini menjelaskan rancangan arsitektur, batasan keamanan multi-tenant, perbaikan skema database, pipeline RAG, serta integrasi layanan eksternal (Supabase & Google Gemini) untuk platform **Tanyara**.

---

## 1. Ringkasan Arsitektur & Batas Tanggung Jawab

```
+-----------------------------------------------------------------------------------------+
|                                    KLIEN / BROWSER                                      |
|                                                                                         |
|  [ Pemilik Bisnis (Admin) ]                          [ Pelanggan Publik (Tamu) ]        |
|    - /dashboard (Auth Guard)                           - /chat/:slug                    |
|    - /dashboard/chatbots/new                           - Akses tanpa akun Tanyara       |
|    - /dashboard/chatbots/:id (Upload & Test)                                            |
+------------------------------+-------------------------------------+--------------------+
                               |                                     |
                     HTTPS / JSON REST API                  HTTPS / JSON REST API
                     (Header: Bearer JWT)                   (Unauthenticated Session)
                               |                                     |
                               v                                     v
+-----------------------------------------------------------------------------------------+
|                                  BACKEND (FastAPI)                                      |
|                                                                                         |
|  [ API Router (/api/v1) ]                                                               |
|    ├── Health Check Endpoints (/health, /api/v1/health)                                 |
|    ├── Organizations API (/api/v1/organizations)                                        |
|    ├── Chatbot Management (/api/v1/chatbots) -> Tenant Guard                            |
|    ├── Document Service (/api/v1/chatbots/:id/documents/upload) [PDF/DOCX/TXT Ingest]   |
|    └── Public Chat Service (/api/v1/public/chat/:slug/messages) [RAG Synthesis]         |
|                                                                                         |
|  [ Security & Auth Guard ]                                                              |
|    ├── Supabase JWT Validator & Token Signature Verification                            |
|    └── Cross-Tenant Validation (Verify user membership in organization_members)         |
|                                                                                         |
|  [ Services & AI Provider Abstraction ]                                                 |
|    ├── ChatbotService                                                                   |
|    ├── DocumentService (Text extraction via pypdf / python-docx + Chunking)             |
|    ├── RAGService (Vector retrieval via match_document_chunks RPC + Grounding)          |
|    └── LLMProvider (Base Class) <---> GeminiProvider (google-generativeai)              |
+------------------------------+-------------------------------------+--------------------+
                               |                                     |
               Service Role / SQL / pgvector                  Service API Key
                               v                                     v
+-----------------------------------------------+   +-------------------------------------+
|              SUPABASE (BaaS)                  |   |          GOOGLE GEMINI API          |
|                                               |   |                                     |
|  - PostgreSQL with Row-Level Security (RLS)   |   |  - gemini-1.5-flash (Text Model)    |
|  - pgvector Extension (Embedding 768 dim)     |   |  - text-embedding-004 (768 Dim)     |
|  - Supabase Storage (Private 'documents')     |   +-------------------------------------+
|  - Supabase Auth (Manajemen Pengguna Owner)   |
+-----------------------------------------------+
```

---

## 2. Perbaikan Dependensi Skema Database & Resolusi Error

### 2.1. Akar Masalah Error `42P01: relation "public.organization_members" does not exist`
Pada draf awal migrasi, fungsi keamanan pembantu `public.is_org_member()` didefinisikan sebelum tabel `public.organization_members` dibuat. Akibatnya, parser PostgreSQL menolak deklarasi fungsi karena tabel yang dirujuk belum ada dalam catalog.

### 2.2. Urutan Dependensi SQL yang Benar
Urutan pembuatan objek pada migrasi [`supabase/migrations/20261031000000_initial_schema.sql`](file:///c:/Users/PREDATOR/Documents/Competition/Hackathon/gdgocITB/tanyara/supabase/migrations/20261031000000_initial_schema.sql) telah ditata ulang secara ketat:

1. **Ekstensi PostgreSQL**: `uuid-ossp` dan `vector` (`pgvector`).
2. **Tabel Induk Organisasi**: `public.organizations`.
3. **Tabel Keanggotaan Organisasi**: `public.organization_members`.
4. **Fungsi Keamanan Pembantu (Non-Recursive)**:
   - `public.get_user_organization_ids()`: Mengambil ID organisasi milik caller via `auth.uid()`.
   - `public.is_org_member(UUID)`: Memverifikasi keanggotaan pengguna.
   - `public.is_org_owner_or_admin(UUID)`: Memverifikasi peran admin/owner.
5. **Tabel Chatbot**: `public.chatbots`.
6. **Tabel Dokumen**: `public.documents`.
7. **Tabel Chunks Vektor**: `public.document_chunks` (menggunakan kolom `vector(768)`).
8. **Tabel Percakapan**: `public.conversations`.
9. **Tabel Pesan**: `public.messages`.
10. **Tabel Catatan Biaya & Token**: `public.usage_logs`.
11. **Fungsi RPC Pencarian Kemiripan Vektor**: `public.match_document_chunks(vector(768), UUID, float, int)`.
12. **Aktivasi RLS & Kebijakan Bebas Rekursi**:
   - Seluruh tabel mengaktifkan `ROW LEVEL SECURITY`.
   - Kebijakan `organization_members` menggunakan `get_user_organization_ids()` dengan hak `SECURITY DEFINER` sehingga evaluasi tidak memicu query berulang yang rekursif.
13. **Konfigurasi Supabase Storage**:
   - Pendaftaran bucket privat `'documents'` dengan batas 10MB dan pembatasan MIME type (`.pdf`, `.docx`, `.txt`).

---

## 3. Pipeline Ingestion Dokumen & RAG

```
[ Berkas PDF/DOCX/TXT ] 
       │
       ▼ (POST /api/v1/chatbots/:id/documents/upload)
[ Validasi Ekstensi & MIME & Size (<10MB) ]
       │
       ├─► [ Simpan Berkas Asli ] ──► Supabase Storage (Bucket privat: 'documents')
       │
       ▼
[ Ekstraksi Teks ] ──► pypdf (PDF) / python-docx (DOCX) / utf-8 (TXT)
       │
       ▼
[ Text Chunking ] ──► 600 Karakter dengan 100 Karakter Overlap (Batas Kata)
       │
       ▼
[ Gemini Embeddings ] ──► models/text-embedding-004 (Vektor 768 Dimensi)
       │
       ▼
[ Simpan ke Database ] ──► PostgreSQL document_chunks (embedding vector(768))
       │
       ▼
[ Update Status Dokumen ] ──► status = 'indexed', chunk_count = N
```

### Alur Pencarian & Dialog Tamu (`/chat/[slug]`):
1. Tamu mengirim pertanyaan ke `POST /api/v1/public/chat/:slug/messages`.
2. Backend memvalidasi ketersediaan dan status aktif bot (`is_active = true`).
3. Backend menghitung vektor embedding dari teks pertanyaan via Gemini `text-embedding-004`.
4. Memanggil fungsi database `match_document_chunks` dengan filter ketat `filter_chatbot_id`.
5. Jika konteks ditemukan, teks dokumen disisipkan ke dalam instruksi prompt sistem.
6. Jika tidak ada konteks relevan, sistem memberikan respon jujur (*grounded fallback*) bahwa informasi belum tercantum di dokumen panduan toko, mencegah halusinasi.
7. Konsumsi token dicatat ke tabel `usage_logs`.

---

## 4. Keamanan Multi-Tenant & Kebijakan Akses

1. **Pemisahan Kunci Supabase**:
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Hanya di frontend, dibatasi oleh RLS.
   - `SUPABASE_SECRET_KEY`: Khusus backend, tidak pernah bocor ke frontend.
2. **Validasi JWT Server-Side**:
   - Token pada header `Authorization: Bearer <token>` divalidasi ke Supabase Auth API (`client.auth.get_user(token)`) atau diverifikasi menggunakan tanda tangan kriptografis. Token palsu atau kedaluwarsa langsung ditolak dengan status HTTP 401.
3. **Pemeriksaan Keanggotaan Organisasi**:
   - Permintaan ke endpoint privat memvalidasi bahwa `user_id` caller benar-benar tercatat pada `organization_members` untuk organisasi terkait. Organisasi A tidak dapat membaca atau memodifikasi data organisasi B.
4. **Perlindungan Akses Publik**:
   - Endpoint publik `/api/v1/public/chatbots/{slug}` menyaring dan tidak membocorkan `system_prompt` maupun `organization_id`.
   - Pengunjung publik tidak memiliki akses SELECT pada dokumen privat atau tabel chunk embedding.
