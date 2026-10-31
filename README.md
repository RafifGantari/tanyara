# Tanyara (tanyara.id) - Phase 2

> **Ubah Dokumen Menjadi Asisten AI untuk Bisnis Anda.**

Tanyara adalah platform SaaS AI Chatbot multi-tenant yang dirancang khusus untuk pelaku bisnis, UMKM, dan organisasi di Indonesia. Platform ini memungkinkan pemilik usaha mengunggah dokumen pengetahuan bisnis (seperti katalog menu, SOP layanan, daftar harga, dan dokumen FAQ), membuat chatbot asisten virtual pintar, dan mempublikasikannya ke pelanggan umum melalui tautan web publik unik (contoh: `https://tanyara-orcin.vercel.app/chat/[nama-toko]/[namachatbot]`).

Pelanggan dan tamu dapat langsung mengakses dan berkonsultasi dengan chatbot tanpa perlu membuat akun atau mendaftar di Tanyara.

---

## 1. Arsitektur Sistem & Pembaruan Phase 2

Tanyara mengadopsi struktur monorepo terpadu dengan batasan tanggung jawab yang jelas antara Frontend, Backend, dan Database:

- **Frontend (`frontend/`)**: Dibangun dengan **Next.js 15 (App Router)**, **TypeScript**, dan **Tailwind CSS**. Mengelola landing page, otentikasi pemilik usaha via Supabase Auth, dashboard manajemen chatbot, pengunggahan berkas dokumen asli (PDF, DOCX, TXT), simulator pengujian (*playground*), dan halaman chat publik bagi tamu.
- **Backend (`backend/`)**: Layanan API berbasis **FastAPI (Python 3.12)** dan **Pydantic v2**. Mengatur validasi permintaan, otentikasi multi-tenant dengan verifikasi token Supabase Auth, routing versioning `/api/v1`, isolasi penyedia model AI (Google Gemini `gemini-1.5-flash`), pemrosesan dokumen (ekstraksi via `pypdf`/`python-docx`, pemotongan semantik, dan pembuatan vektor embedding 768 dimensi via `models/text-embedding-004`), pencarian kemiripan kosinus via pgvector, dan pencatatan audit biaya pada `usage_logs`.
- **Database & Infrastruktur (`supabase/`)**: **Supabase PostgreSQL** dengan ekstensi **pgvector** untuk pencarian kemiripan vektor 768 dimensi, **Row-Level Security (RLS)** bebas rekursi untuk isolasi data antar organisasi, Supabase Storage bucket privat `documents` untuk berkas asli, dan Supabase Auth untuk identitas pemilik usaha.

Untuk detail teknis arsitektur lengkap, silakan lihat [docs/architecture.md](docs/architecture.md).

---

## 2. Struktur Repositori

```
tanyara/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI pipeline
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/          # health.py, organizations.py, chatbots.py, documents.py, chat.py
│   │   │   ├── dependencies.py  # Supabase Auth validator & tenant guard
│   │   │   └── router.py        # Agregasi rute /api/v1
│   │   ├── core/
│   │   │   ├── config.py        # Pengaturan Pydantic & CORS
│   │   │   └── security.py      # Verifikasi token JWT
│   │   ├── db/
│   │   │   └── supabase.py      # Inisialisasi klien Supabase admin & user client
│   │   ├── schemas/             # common.py, organization.py, chatbot.py, document.py, chat.py
│   │   ├── services/
│   │   │   ├── llm/             # base.py (LLMProvider ABC) & gemini.py (Gemini 1.5 & text-embedding-004)
│   │   │   ├── chatbot_service.py
│   │   │   ├── document_service.py (Ekstraksi PDF/DOCX/TXT & Chunking)
│   │   │   └── rag_service.py (Retrieval vector & grounding prompt)
│   │   └── main.py              # Inisialisasi FastAPI, middleware CORS, error handler
│   ├── tests/                   # Pytest test suite (19 test cases)
│   ├── .env.example             # Variabel lingkungan backend
│   └── requirements.txt         # Dependensi Python
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/login/    # Halaman masuk
│   │   │   ├── (auth)/register/ # Halaman pendaftaran
│   │   │   ├── dashboard/       # Dashboard & manajemen chatbot
│   │   │   ├── chat/[slug]/     # Halaman publik tamu
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx         # Landing page
│   │   │   └── globals.css
│   │   ├── components/          # UI primitives & komponen navigasi
│   │   ├── lib/                 # api.ts, supabase.ts, utils.ts
│   │   └── types/               # Antarmuka TypeScript
│   ├── .env.example             # Variabel lingkungan frontend
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── docs/
│   └── architecture.md          # Dokumentasi teknis & keamanan sistem
├── supabase/
│   └── migrations/
│       ├── 20261031000000_initial_schema.sql    # Skema DB lengkap & RLS non-rekursif
│       └── 20261031000001_repair_and_storage.sql # Skrip idempoten perbaikan & storage
├── .gitignore
├── pytest.ini
└── README.md
```

---

## 3. Prasyarat Sistem

Sebelum menjalankan proyek, pastikan sistem Anda telah terpasang:
- **Node.js**: Versi 20.x atau 22.x LTS (disarankan v22+)
- **Python**: Versi 3.11 atau 3.12 (disarankan v3.12+)
- **Git**

---

## 4. Panduan Menjalankan Lingkungan Lokal

### 4.1. Persiapan Backend (FastAPI)

1. Buka terminal di direktori root `tanyara`:
   ```bash
   # Buat virtual environment jika belum ada
   python -m venv backend/venv

   # Aktifkan virtual environment
   # Windows PowerShell:
   backend\venv\Scripts\Activate.ps1
   # Linux / macOS:
   source backend/venv/bin/activate
   ```

2. Pasang ketergantungan paket Python:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. Buat file konfigurasi `.env` untuk backend:
   ```bash
   cp backend/.env.example backend/.env
   ```
   *(Aplikasi tetap dapat berjalan dalam mode demo/fallback lokal meskipun nilai Supabase atau Gemini belum diisi).*

4. Jalankan server Backend FastAPI:
   ```bash
   uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

5. Verifikasi Backend:
   - Root Health: [http://localhost:8000/health](http://localhost:8000/health)
   - API v1 Health: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
   - Dokumentasi Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
   - Dokumentasi ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### 4.2. Persiapan Frontend (Next.js)

1. Buka terminal kedua di direktori `frontend`:
   ```bash
   cd frontend
   npm install
   ```

2. Siapkan file konfigurasi `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

3. Jalankan server pengembangan Next.js:
   ```bash
   npm run dev
   ```

4. Buka aplikasi di peramban:
   - **Landing Page**: [http://localhost:3000](http://localhost:3000)
   - **Login**: [http://localhost:3000/login](http://localhost:3000/login)
   - **Registrasi**: [http://localhost:3000/register](http://localhost:3000/register)
   - **Owner Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
   - **Buat Chatbot Baru**: [http://localhost:3000/dashboard/chatbots/new](http://localhost:3000/dashboard/chatbots/new)
   - **Detail Chatbot Demo**: [http://localhost:3000/dashboard/chatbots/cb-demo-001](http://localhost:3000/dashboard/chatbots/cb-demo-001)
   - **Halaman Tamu Publik**: [http://localhost:3000/chat/toko-demo/cs-toko](http://localhost:3000/chat/toko-demo/cs-toko)

---

## 5. Konfigurasi Variabel Lingkungan

### 5.1. Backend (`backend/.env`)

| Variabel | Deskripsi | Default / Contoh |
| :--- | :--- | :--- |
| `PROJECT_NAME` | Nama proyek pada OpenAPI docs | `"Tanyara API"` |
| `ENVIRONMENT` | Lingkungan runtime | `"development"` |
| `DEBUG` | Mode debug | `true` |
| `API_V1_PREFIX` | Prefix rute API versi 1 | `"/api/v1"` |
| `ALLOWED_ORIGINS` | Daftar origin CORS (dipisahkan koma) | `"http://localhost:3000,http://127.0.0.1:3000"` |
| `SUPABASE_URL` | URL endpoint proyek Supabase | `https://xxxx.supabase.co` |
| `SUPABASE_SECRET_KEY` | Service role key Supabase (**Server-only**) | `eyJh...` |
| `SUPABASE_JWT_SECRET` | Kunci rahasia JWT Supabase (opsional) | `your-supabase-jwt-secret` |
| `GEMINI_API_KEY` | Kunci API Google Gemini (**Server-only**) | `AIzaSy...` |
| `GEMINI_MODEL` | Model generasi teks yang digunakan | `"gemini-1.5-flash"` |

### 5.2. Frontend (`frontend/.env.local`)

| Variabel | Deskripsi | Contoh |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL endpoint proyek Supabase | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable Anon key Supabase (Aman di browser) | `eyJh...` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Alias kompatibel untuk publishable key | `eyJh...` |
| `NEXT_PUBLIC_API_BASE_URL` | URL dasar server backend FastAPI | `http://localhost:8000` |
| `NEXT_PUBLIC_APP_URL` | URL dasar aplikasi untuk generator link publik | `http://localhost:3000` |

---

## 6. Prosedur Penerapan Migrasi SQL & Troubleshooting

### 6.1. Penyebab Error `42P01: relation "public.organization_members" does not exist`
Error ini terjadi pada draf sebelumnya karena fungsi `public.is_org_member()` dipanggil sebelum tabel `public.organization_members` dibuat.

### 6.2. Cara Menerapkan Skema ke Supabase
1. Masuk ke [Supabase Dashboard](https://supabase.com) dan buka proyek Anda.
2. Navigasi ke menu **SQL Editor**.
3. Buka file [supabase/migrations/20261031000000_initial_schema.sql](supabase/migrations/20261031000000_initial_schema.sql).
4. Salin seluruh konten file tersebut ke SQL Editor dan klik tombol **Run**.
5. Jika database Anda sebelumnya sempat mengeksekusi sebagian tabel, Anda juga dapat menjalankan [supabase/migrations/20261031000001_repair_and_storage.sql](supabase/migrations/20261031000001_repair_and_storage.sql) yang bersifat idempoten dan aman.

Skrip migrasi ini:
- Mengaktifkan ekstensi `uuid-ossp` dan `vector` (`pgvector`).
- Membuat 8 tabel multi-tenant dengan urutan dependensi yang benar: `organizations` -> `organization_members` -> helper functions -> `chatbots` -> `documents` -> `document_chunks` -> `conversations` -> `messages` -> `usage_logs`.
- Mengimplementasikan helper function `get_user_organization_ids()` dengan hak `SECURITY DEFINER` untuk mencegah rekursi kebijakan RLS pada `organization_members`.
- Membuat fungsi pencarian kemiripan vektor `match_document_chunks` dengan dimensi 768 (sesuai Gemini `text-embedding-004`).
- Mengonfigurasi bucket privat `documents` di Supabase Storage (ukuran maksimal 10MB, tipe PDF, DOCX, TXT).

---

## 7. Menjalankan Pengujian (Testing)

### 7.1. Pengujian Backend (Pytest)

Suite pengujian mencakup 19 test case yang mencakup verifikasi endpoint kesehatan, konfigurasi, urutan migrasi SQL, sanitasi file, chunking teks, isolasi tenant, penolakan token palsu, dan fallback RAG:

```bash
# Jalankan suite pengujian pytest dari root repository
backend\venv\Scripts\pytest -v
```

Hasil pengujian:
```
backend/tests/test_auth_and_isolation.py::test_invalid_bearer_token_rejected PASSED [  5%]
backend/tests/test_auth_and_isolation.py::test_tenant_isolation_mismatched_org PASSED [ 10%]
backend/tests/test_chatbots.py::test_list_chatbots PASSED                [ 15%]
backend/tests/test_chatbots.py::test_get_public_chatbot_by_slug PASSED   [ 21%]
backend/tests/test_chatbots.py::test_get_public_chatbot_not_found PASSED [ 26%]
backend/tests/test_chatbots.py::test_create_chatbot_invalid_slug PASSED  [ 31%]
backend/tests/test_chatbots.py::test_update_chatbot PASSED               [ 36%]
backend/tests/test_config.py::test_settings_cors_parsing PASSED          [ 42%]
backend/tests/test_config.py::test_settings_defaults PASSED              [ 47%]
backend/tests/test_database_migration.py::test_migration_order_and_dependencies PASSED [ 52%]
backend/tests/test_documents.py::test_sanitize_filename PASSED           [ 57%]
backend/tests/test_documents.py::test_chunk_text PASSED                  [ 63%]
backend/tests/test_documents.py::test_extract_text_txt PASSED            [ 68%]
backend/tests/test_documents.py::test_extract_text_unsupported PASSED    [ 73%]
backend/tests/test_documents.py::test_upload_unsupported_file_extension PASSED [ 78%]
backend/tests/test_health.py::test_root_health_endpoint PASSED           [ 84%]
backend/tests/test_health.py::test_api_v1_health_endpoint PASSED         [ 89%]
backend/tests/test_rag.py::test_public_chat_message_fallback_when_gemini_unconfigured PASSED [ 94%]
backend/tests/test_rag.py::test_public_chat_inactive_bot_rejected PASSED [100%]
======================== 19 passed in 0.12s ========================
```

### 7.2. Pengecekan Type-Check & Build Frontend (Next.js)

```bash
# Verifikasi TypeScript
npm --prefix frontend run type-check

# Verifikasi Production Build
npm --prefix frontend run build
```

Hasil build Next.js:
```
Route (app)                              Size     First Load JS
┌ ○ /                                    172 B           109 kB
├ ○ /_not-found                          979 B           106 kB
├ ƒ /chat/[slug]                         4.94 kB         191 kB
├ ○ /dashboard                           4.93 kB         191 kB
├ ƒ /dashboard/chatbots/[id]             6.72 kB         193 kB
├ ○ /dashboard/chatbots/new              4.2 kB          190 kB
├ ○ /login                               3.2 kB          189 kB
└ ○ /register                            3.28 kB         189 kB
+ First Load JS shared by all            105 kB
```

---

## 8. Status Implementasi Phase 2

| Komponen / Fitur | Status | Keterangan |
| :--- | :---: | :--- |
| **Urutan Dependensi Migrasi SQL** | Selesai (Fixed) | `organizations` -> `members` -> helper functions -> `chatbots` -> `documents` |
| **Pencegahan Rekursi RLS** | Selesai | Menggunakan `get_user_organization_ids()` SECURITY DEFINER bebas rekursi |
| **Dimensi Vektor Embedding** | Selesai | Kolom `embedding vector(768)` dan RPC selaras dengan `text-embedding-004` |
| **Storage Privat 'documents'** | Selesai | Definisi SQL bucket privat 10MB + sanitasi nama berkas & upload handling |
| **Otentikasi & Tenant Guard** | Selesai | Verifikasi token Supabase Auth server-side + penolakan akses lintas tenant |
| **Ekstraksi Dokumen** | Selesai | Parser teks teruji untuk format PDF (`pypdf`), DOCX (`python-docx`), dan TXT |
| **Pemecahan Teks (Chunking)** | Selesai | Chunking 600 karakter dengan 100 karakter overlap berbasis batas kata |
| **RAG Vector Search & Grounding** | Selesai | Pemanggilan RPC `match_document_chunks` + prompt grounding + fallback jujur |
| **Frontend Form Upload Nyata** | Selesai | Form upload file PDF/DOCX/TXT terhubung langsung ke backend multipart API |
| **Frontend Auth Guard** | Selesai | Proteksi sesi dashboard dengan fallback mode offline yang transparan |

---

## 9. Lisensi

Hak Cipta © 2026 Tanyara. Dikembangkan untuk kemajuan ekosistem bisnis dan UMKM di Indonesia.
