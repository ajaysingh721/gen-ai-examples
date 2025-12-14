# Gen AI Examples — Clinical Document Analyzer

A full-stack example app that uploads clinical documents (PDF/TIFF), extracts text (PDF parsing + TIFF OCR), classifies the document type, generates a summary using a local LLM (Ollama), and persists results to SQLite.

## What’s included

- **Backend**: FastAPI + SQLAlchemy + SQLite
  - `POST /api/v1/documents/analyze`: upload a PDF/TIFF and get `{ type, summary, text_length }`
  - `GET /api/v1/documents?limit=20`: list recent analyses
  - `DELETE /api/v1/documents/{id}`: delete an analysis
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

### Installing Tesseract (Windows)

TIFF OCR requires the **Tesseract** binary (Python `pytesseract` is only a wrapper).

1. Install Tesseract OCR for Windows (commonly via the UB Mannheim build)
2. Ensure the install folder is on your `PATH` (so `tesseract.exe` is discoverable)
3. Verify in a new terminal:

```powershell
tesseract --version
```

If you cannot (or don’t want to) modify `PATH`, you can point the backend directly to the executable:

```powershell
$env:TESSERACT_CMD = "C:\Program Files\Tesseract-OCR\tesseract.exe"
```

Then start the backend from the same terminal.

### OCR for scanned PDFs (optional)

Some PDFs are image-only (scanned) and contain no embedded text. In that case, normal PDF text extraction can return empty.

You can enable an **optional PDF OCR fallback** (slower) by setting:

```powershell
$env:PDF_OCR_ENABLED = "1"
```

Optional tuning:

- `PDF_OCR_MAX_PAGES` (default `5`)
- `PDF_OCR_DPI` (default `200`)

This requires Tesseract to be installed (same requirement as TIFF OCR).

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

### 3) Frontend tests (Jest)

From the repo root:

```bash
cd frontend
npm test
```

Notes:

- The Jest setup file is required by config: `frontend/jest.config.js` loads `frontend/jest.setup.ts` via `setupFilesAfterEnv`.
- Watch mode: `npm run test:watch`

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

You should also set `NEXTAUTH_SECRET` in `frontend/.env.local` for stable auth sessions.

## Notes

- The upload page currently calls the backend at `http://localhost:8000/api/v1/documents/analyze`.
- If OCR isn’t installed/configured, PDF uploads still work, but TIFF uploads will fail.

## Documentation

📚 **Comprehensive Wiki Documentation Available!**

For detailed documentation, please visit the `wiki/` directory or set up the GitHub Wiki:

- **[Home](wiki/Home.md)** - Overview and navigation
- **[Getting Started](wiki/Getting-Started.md)** - Installation and setup guide
- **[Backend Architecture](wiki/Backend-Architecture.md)** - FastAPI backend details
- **[Frontend Architecture](wiki/Frontend-Architecture.md)** - Next.js frontend details
- **[API Documentation](wiki/API-Documentation.md)** - Complete API reference
- **[Authentication](wiki/Authentication.md)** - NextAuth configuration
- **[Configuration](wiki/Configuration.md)** - Environment variables and settings
- **[Troubleshooting](wiki/Troubleshooting.md)** - Common issues and solutions
- **[Development Guide](wiki/Development-Guide.md)** - Development workflow and best practices

See [wiki/README.md](wiki/README.md) for instructions on setting up the GitHub Wiki.

## Repo structure

- `backend/` FastAPI API + OCR + Ollama + SQLite persistence
- `frontend/` Next.js UI + login + sidebar
- `docs/` documentation scratchpad
- `wiki/` comprehensive wiki documentation
