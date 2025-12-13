# Getting Started

This guide will help you set up and run the Clinical Document Analyzer application on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Python 3.12+**

   - Download from [python.org](https://www.python.org/downloads/)
   - Verify installation: `python --version`

2. **Node.js** (Current LTS recommended)

   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version` and `npm --version`

3. **Ollama** (for local LLM)

   - Install from [ollama.ai](https://ollama.ai/)
   - Must be running at `http://localhost:11434`
   - Pull the Mistral model: `ollama pull mistral`
   - Verify: `ollama list` should show mistral

4. **Tesseract OCR** (for TIFF processing)
   - **Windows**: Download from [GitHub releases](https://github.com/UB-Mannheim/tesseract/wiki)
     - Ensure `tesseract.exe` is added to your system PATH
   - **macOS**: `brew install tesseract`
   - **Linux**: `sudo apt-get install tesseract-ocr`
   - Verify installation: `tesseract --version`

### Optional Software

- **Git**: For cloning the repository
- **VS Code**: Recommended IDE with Python and TypeScript extensions

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ajaysingh721/gen-ai-examples.git
cd gen-ai-examples
```

### 2. Backend Setup

Navigate to the backend directory and set up the Python environment:

```bash
cd backend
```

#### Create Virtual Environment

**Windows:**

```bash
python -m venv .venv
.\.venv\Scripts\activate
```

**macOS/Linux:**

```bash
python -m venv .venv
source .venv/bin/activate
```

#### Install Dependencies

```bash
pip install -e .
```

This will install all required packages including:

- FastAPI
- Uvicorn
- SQLAlchemy
- PyPDF
- Pillow
- pytesseract
- ollama
- And more...

#### Start the Backend Server

```bash
uvicorn app.main:app --reload --port 8000
```

The backend will be available at:

- **API**: http://127.0.0.1:8000
- **Swagger UI**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

#### Install Dependencies

```bash
npm install
```

This will install all required packages including:

- Next.js 16
- NextAuth
- React 19
- shadcn/ui components
- Tailwind CSS v4
- And more...

#### Configure Environment (Optional)

Create a `.env.local` file from the example:

```bash
cp .env.example .env.local
```

Edit `.env.local` to customize:

```env
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_ADMIN_USERNAME=admin
NEXTAUTH_ADMIN_PASSWORD=admin123
```

#### Start the Frontend Server

```bash
npm run dev
```

The frontend will be available at: http://localhost:3000

## First Run

### 1. Verify Backend

1. Open http://127.0.0.1:8000/docs in your browser
2. You should see the Swagger UI with available endpoints
3. Try the health check endpoint if available

### 2. Verify Frontend

1. Open http://localhost:3000 in your browser
2. You should see the login page
3. Log in with default credentials:
   - **Username**: `admin`
   - **Password**: `admin123`

### 3. Test Document Upload

1. After logging in, navigate to "Upload & Summarize" page
2. Select a PDF or TIFF clinical document
3. Upload and wait for analysis
4. View the results: document type and summary

### 4. View Document History

1. Navigate to "Recent Documents" page
2. See all previously analyzed documents
3. Each entry shows filename, type, summary, and timestamp

## Database

The SQLite database is automatically created at:

```
backend/api/v1/documents.db
```

You can view/query it using:

- SQLite Browser
- Command line: `sqlite3 backend/api/v1/documents.db`
- Python SQLAlchemy queries

## Next Steps

- Read the [Configuration Guide](Configuration.md) to customize settings
- Explore the [API Documentation](API-Documentation.md) to understand endpoints
- Check the [Development Guide](Development-Guide.md) for development best practices
- Review [Troubleshooting](Troubleshooting.md) for common issues

## Quick Reference

### Start Everything

**Terminal 1 (Backend):**

```bash
cd backend
.\.venv\Scripts\activate  # or source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 (Ollama - if not running as service):**

```bash
ollama serve
```

**Terminal 3 (Frontend):**

```bash
cd frontend
npm run dev
```

**Verify all services are running:**

- Backend: http://127.0.0.1:8000/docs should load
- Ollama: `ollama list` should work
- Frontend: http://localhost:3000 should load

### Stop Everything

- Backend: `Ctrl+C` in the backend terminal
- Ollama: `Ctrl+C` in the ollama terminal (if manually started)
- Frontend: `Ctrl+C` in the frontend terminal

## Support

If you encounter any issues during setup, check the [Troubleshooting](Troubleshooting.md) guide or open an issue in the GitHub repository.
