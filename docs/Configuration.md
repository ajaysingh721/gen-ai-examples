# Configuration

This guide covers all configuration options for the Clinical Document Analyzer application.

## Overview

The application can be configured through environment variables for both frontend and backend components.

## Frontend Configuration

### Environment File

**Location**: `frontend/.env.local`

**Example** (`frontend/.env.example`):

```env
# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Admin Credentials
NEXTAUTH_ADMIN_USERNAME=admin
NEXTAUTH_ADMIN_PASSWORD=admin123
```

### Frontend Environment Variables

#### NEXTAUTH_SECRET

**Required**: Yes  
**Description**: Secret key used to encrypt JWT tokens  
**Default**: None

**How to generate**:

```bash
openssl rand -base64 32
```

**Example**:

```env
NEXTAUTH_SECRET=AyKPvHh7Dp8QaP5Y4FNYhKrG3fW5vJ2wL6KHxT1A2Zc=
```

#### NEXTAUTH_URL

**Required**: Yes  
**Description**: Full URL where your app is hosted  
**Default**: http://localhost:3000

**Development**:

```env
NEXTAUTH_URL=http://localhost:3000
```

**Production**:

```env
NEXTAUTH_URL=https://your-app.com
```

#### NEXTAUTH_ADMIN_USERNAME

**Required**: No  
**Description**: Admin account username  
**Default**: `admin`

**Example**:

```env
NEXTAUTH_ADMIN_USERNAME=superadmin
```

#### NEXTAUTH_ADMIN_PASSWORD

**Required**: No  
**Description**: Admin account password  
**Default**: `admin123`

**Security Note**: Always change this in production!

**Example**:

```env
NEXTAUTH_ADMIN_PASSWORD=MySecurePassword123!
```

### Frontend .gitignore

Ensure `.env.local` is in `.gitignore`:

```gitignore
# Environment variables
.env.local
.env.*.local
```

## Backend Configuration

### Environment Variables

The backend can be configured via environment variables or by setting them in your shell.

#### OLLAMA_BASE_URL

**Required**: No  
**Description**: URL where Ollama server is running  
**Default**: `http://localhost:11434`

**Usage**:

```bash
# Linux/macOS
export OLLAMA_BASE_URL=http://localhost:11434

# Windows
set OLLAMA_BASE_URL=http://localhost:11434

# PowerShell
$env:OLLAMA_BASE_URL="http://localhost:11434"
```

**Remote Ollama**:

```bash
export OLLAMA_BASE_URL=http://192.168.1.100:11434
```

#### OLLAMA_MODEL

**Required**: No  
**Description**: LLM model to use for text generation  
**Default**: `mistral`

**Usage**:

```bash
export OLLAMA_MODEL=mistral
```

**Other Models**:

```bash
# Llama 2
export OLLAMA_MODEL=llama2

# CodeLlama
export OLLAMA_MODEL=codellama

# Phi-2
export OLLAMA_MODEL=phi
```

**Note**: Pull the model first:

```bash
ollama pull mistral
ollama pull llama2
# etc.
```

### Backend .env File (Optional)

You can also create a `.env` file in the `backend` directory:

**File**: `backend/.env`

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral
```

**Load with python-dotenv**:

```python
from dotenv import load_dotenv
load_dotenv()
```

## Database Configuration

### SQLite Database

**Location**: `backend/api/v1/documents.db`

**Auto-created**: Yes (on first run)

**Configuration**: None required (uses SQLite defaults)

### Changing Database Location

Edit `backend/app/core/db.py`:

```python
SQLALCHEMY_DATABASE_URL = "sqlite:///./your-custom-path.db"
```

### Using PostgreSQL (Advanced)

For production, consider PostgreSQL:

1. **Install PostgreSQL driver**:

```bash
pip install psycopg2-binary
```

2. **Update database URL**:

```python
SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/dbname"
```

3. **Environment variable**:

```bash
export DATABASE_URL=postgresql://user:password@localhost/dbname
```

## Ollama Configuration

### Installation

**Download**: https://ollama.ai/

**Verify Installation**:

```bash
ollama --version
```

### Pull Models

Before using, pull the desired model:

```bash
# Pull Mistral (default)
ollama pull mistral

# Pull Llama 2
ollama pull llama2

# List installed models
ollama list
```

### Running Ollama

#### As a Service (Recommended)

Ollama typically runs as a background service automatically.

**Check Status**:

```bash
# Linux
systemctl status ollama

# macOS
brew services list | grep ollama
```

#### Manual Start

If not running as a service:

```bash
ollama serve
```

### Ollama Configuration File

**Location**:

- Linux: `~/.ollama/`
- macOS: `~/.ollama/`
- Windows: `%USERPROFILE%\.ollama\`

### Custom Ollama Settings

Create `~/.ollama/config.json`:

```json
{
  "models_path": "/path/to/models",
  "host": "0.0.0.0:11434",
  "gpu": true
}
```

## Tesseract OCR Configuration

### Installation

#### Windows

1. Download from: https://github.com/UB-Mannheim/tesseract/wiki
2. Install to default location
3. Add to PATH: `C:\Program Files\Tesseract-OCR`

**Verify**:

```bash
tesseract --version
```

#### macOS

```bash
brew install tesseract
```

#### Linux

```bash
sudo apt-get install tesseract-ocr
```

### Custom Tesseract Path

If Tesseract is not on PATH, specify location in `backend/app/services/document_service.py`:

```python
import pytesseract

# Windows
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Linux/macOS
pytesseract.pytesseract.tesseract_cmd = '/usr/local/bin/tesseract'
```

### Language Data

Download additional language data if needed:

```bash
# Windows
# Download .traineddata files to C:\Program Files\Tesseract-OCR\tessdata\

# Linux
sudo apt-get install tesseract-ocr-fra  # French
sudo apt-get install tesseract-ocr-spa  # Spanish
```

**Usage**:

```python
text = pytesseract.image_to_string(image, lang='fra')
```

## CORS Configuration

### Backend CORS Settings

**File**: `backend/app/main.py`

```python
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Adding Production Origins

For production deployment:

```python
origins = [
    "http://localhost:3000",        # Development
    "http://127.0.0.1:3000",        # Development
    "https://your-app.com",         # Production frontend
    "https://www.your-app.com",     # Production with www
]
```

### Environment-Based CORS

```python
import os

origins_str = os.environ.get("CORS_ORIGINS", "http://localhost:3000")
origins = origins_str.split(",")
```

Then set:

```bash
export CORS_ORIGINS="http://localhost:3000,https://your-app.com"
```

## Server Configuration

### Backend Server (Uvicorn)

#### Port Configuration

**Default**: 8000

**Change Port**:

```bash
uvicorn app.main:app --port 8080
```

#### Host Configuration

**Default**: 127.0.0.1 (localhost only)

**Allow External Access**:

```bash
uvicorn app.main:app --host 0.0.0.0
```

#### Workers

**Development** (single worker with reload):

```bash
uvicorn app.main:app --reload
```

**Production** (multiple workers):

```bash
uvicorn app.main:app --workers 4
```

#### Full Production Command

```bash
uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 4 \
  --log-level info
```

### Frontend Server (Next.js)

#### Port Configuration

**Default**: 3000

**Change Port**:

```bash
npm run dev -- -p 3001
```

Or set in `package.json`:

```json
{
  "scripts": {
    "dev": "next dev -p 3001"
  }
}
```

#### Production Server

```bash
npm run build
npm start -- -p 3000
```

## Performance Tuning

### LLM Performance

#### Token Limits

Adjust `max_tokens` in service functions:

**File**: `backend/app/services/document_service.py`

```python
def summarize_document(text: str, max_tokens: int = 256) -> str:
    # Increase for longer summaries
    return generate_text(prompt, max_tokens=512)

def classify_document_type(text: str) -> DocumentType:
    # Decrease for faster classification
    raw = generate_text(prompt, max_tokens=5).strip().lower()
```

#### Text Truncation

Adjust snippet length:

```python
# Current: 4000 characters
snippet = text[:4000]

# Increase for more context
snippet = text[:8000]

# Decrease for faster processing
snippet = text[:2000]
```

### Database Performance

#### Connection Pool Size

For PostgreSQL:

```python
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20
)
```

#### Indexes

Add indexes for frequently queried columns:

```python
from sqlalchemy import Index

Index('idx_doc_type', DocumentAnalysis.doc_type)
Index('idx_created_at', DocumentAnalysis.created_at)
```

## Logging Configuration

### Backend Logging

Add logging to `backend/app/main.py`:

```python
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

@app.on_event("startup")
def on_startup():
    logger.info("Application starting up...")
```

### Frontend Logging

For Next.js, use environment variables:

```env
# Enable verbose logging
NEXT_PUBLIC_LOG_LEVEL=debug
```

## Deployment Configuration

### Environment-Specific Configs

#### Development

```env
# Frontend
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-key

# Backend
OLLAMA_BASE_URL=http://localhost:11434
```

#### Staging

```env
# Frontend
NEXTAUTH_URL=https://staging.your-app.com
NEXTAUTH_SECRET=staging-secret-key

# Backend
OLLAMA_BASE_URL=http://staging-ollama.internal:11434
```

#### Production

```env
# Frontend
NEXTAUTH_URL=https://your-app.com
NEXTAUTH_SECRET=production-secret-key-very-secure

# Backend
OLLAMA_BASE_URL=http://prod-ollama.internal:11434
```

## Docker Configuration (Future)

### Example Dockerfile for Backend

```dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y tesseract-ocr

COPY backend/pyproject.toml .
RUN pip install -e .

COPY backend/app ./app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Example Dockerfile for Frontend

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .
RUN npm run build

CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: "3.8"

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
    depends_on:
      - ollama

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=your-secret-key
    depends_on:
      - backend

  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
```

## Configuration Checklist

### Before First Run

- [ ] Install Python 3.12+
- [ ] Install Node.js (current LTS)
- [ ] Install and start Ollama
- [ ] Pull Ollama model: `ollama pull mistral`
- [ ] Install Tesseract OCR
- [ ] Create `frontend/.env.local` with NEXTAUTH_SECRET
- [ ] (Optional) Set custom OLLAMA_BASE_URL
- [ ] (Optional) Set custom OLLAMA_MODEL

### Before Production Deployment

- [ ] Change admin password
- [ ] Generate secure NEXTAUTH_SECRET
- [ ] Set NEXTAUTH_URL to production domain
- [ ] Configure CORS origins for production
- [ ] Set up HTTPS/SSL
- [ ] Configure production database (PostgreSQL)
- [ ] Set up proper logging
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerts
- [ ] Enable security headers
- [ ] Set up backups for database

## Troubleshooting Configuration

### "Module not found" errors

**Solution**: Ensure all dependencies are installed

```bash
cd backend && pip install -e .
cd frontend && npm install
```

### "Ollama connection refused"

**Solution**:

1. Check Ollama is running: `ollama list`
2. Verify OLLAMA_BASE_URL is correct
3. Test connection: `curl http://localhost:11434/api/version`

### "Tesseract not found"

**Solution**:

1. Verify installation: `tesseract --version`
2. Add to PATH or set `tesseract_cmd` in code
3. Restart terminal/IDE after installation

### Frontend can't reach backend

**Solution**:

1. Check backend is running on port 8000
2. Verify CORS settings allow frontend origin
3. Check firewall isn't blocking connection

## Next Steps

- Review [Getting Started](Getting-Started.md) for setup instructions
- Check [Troubleshooting](Troubleshooting.md) for common issues
- Read [Development Guide](Development-Guide.md) for development workflow
