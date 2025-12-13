# Gen AI Examples — Clinical Document Analyzer

A full-stack example app that uploads clinical documents (PDF/TIFF), extracts text (PDF parsing + TIFF OCR), classifies the document type, generates a summary using a local LLM (Ollama), and persists results to SQLite.

## What’s included

- **Backend**: FastAPI + SQLAlchemy + SQLite
  - `POST /documents/analyze`: upload a PDF/TIFF and get `{ type, summary, text_length }`
  - `GET /documents?limit=20`: list recent analyses
  - Local LLM via **Ollama** (`OLLAMA_MODEL` defaults to `mistral`)
  - TIFF OCR via **Tesseract** (`pytesseract`)
- **Frontend**: Next.js (App Router) + NextAuth (Credentials) + shadcn/ui
  - `/login` (no sidebar)
  - Protected area with sidebar + breadcrumb + route loading skeleton
  - Pages: Dashboard, Upload & summarize, Recent documents

## Prerequisites

- **Python**: 3.12+
- **Node.js**: current LTS recommended
- **Ollama**: installed and running (default: `http://localhost:11434`)
  - Pull the model once: `ollama pull mistral`
- **Tesseract OCR** (required for TIFF): install on Windows and ensure `tesseract.exe` is on `PATH`

## Quickstart

### 1) Backend (FastAPI)

From the repo root:

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -e .
uvicorn app.main:app --reload --port 8000
```

- Swagger: http://127.0.0.1:8000/docs

**Config (optional):**

- `OLLAMA_BASE_URL` (default `http://localhost:11434`)
- `OLLAMA_MODEL` (default `mistral`)

SQLite DB file is created at `backend/documents.db`.

### 2) Frontend (Next.js)

From the repo root:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Auth (NextAuth Credentials)

Admin credentials default to:

- Username: `admin`
- Password: `admin123`

You can override via environment variables in `frontend/.env.local` (start from `frontend/.env.example`):

```dotenv
NEXTAUTH_ADMIN_USERNAME=admin
NEXTAUTH_ADMIN_PASSWORD=admin123
```

## Notes

- The upload page currently calls the backend at `http://localhost:8000/documents/analyze`.
- If OCR isn’t installed/configured, PDF uploads still work, but TIFF uploads will fail.

## Repo structure

- `backend/` FastAPI API + OCR + Ollama + SQLite persistence
- `frontend/` Next.js UI + login + sidebar
- `docs/` documentation scratchpad
