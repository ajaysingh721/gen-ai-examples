# Backend Architecture

This document describes the architecture, structure, and key components of the FastAPI backend service.

## Overview

The backend is built with **FastAPI**, a modern Python web framework that provides:

- High performance (comparable to NodeJS and Go)
- Automatic API documentation (Swagger/OpenAPI)
- Type safety with Pydantic
- Async support out of the box

## Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── api/                 # API routes
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── routes/
│   │           ├── documents.py  # Document analysis endpoints
│   │           └── llm.py        # LLM-related endpoints
│   ├── core/                # Core configuration
│   │   ├── __init__.py
│   │   └── db.py           # Database configuration
│   ├── models/              # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   └── document_analysis.py
│   ├── schemas/             # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── document.py
│   │   └── llm.py
│   └── services/            # Business logic
│       ├── document_service.py
│       └── llm_service.py
├── pyproject.toml           # Python dependencies
└── documents.db             # SQLite database (created at runtime)
```

## Core Components

### 1. Main Application (`main.py`)

The entry point for the FastAPI application:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import api_router
from app.core.db import Base, engine

app = FastAPI(title="Backend API", version="0.1.0")
```

**Key Features:**

- CORS middleware configured for localhost:3000
- Database table creation on startup
- API router inclusion

### 2. Database Layer (`core/db.py`)

Uses SQLAlchemy with SQLite:

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./api/v1/documents.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

**Features:**

- SQLite for simplicity and portability
- Session management with SessionLocal
- Declarative base for ORM models

### 3. Models (`models/document_analysis.py`)

Database models using SQLAlchemy ORM:

```python
class DocumentAnalysis(Base):
    __tablename__ = "document_analyses"

    id: Integer (Primary Key)
    filename: String
    doc_type: String (discharge_summary, inpatient_document, census, junk)
    summary: Text
    text_length: Integer
    raw_text: Text
    created_at: DateTime
```

**Document Types:**

1. **discharge_summary**: Patient discharge summaries
2. **inpatient_document**: Progress notes, H&P, consults
3. **census**: Patient census lists
4. **junk**: Non-meaningful or corrupted documents

### 4. Schemas (`schemas/`)

Pydantic models for request/response validation:

**Document Schemas:**

- `DocumentType`: Enum for document categories
- `DocumentRecord`: Response schema for document list
- `DocumentAnalysisResponse`: Response for document analysis

**LLM Schemas:**

- Request/response models for LLM interactions

### 5. Services

#### Document Service (`services/document_service.py`)

Handles all document processing logic:

**Key Functions:**

1. **`extract_text_from_pdf(file_obj: BinaryIO) -> str`**

   - Uses PyPDF to extract text from PDF files
   - Iterates through all pages
   - Concatenates text with newlines

2. **`extract_text_from_tiff(file_obj: BinaryIO) -> str`**

   - Uses Pillow to open TIFF images
   - Applies Tesseract OCR to each frame
   - Handles multi-page TIFF files

3. **`classify_document_type(text: str) -> DocumentType`**

   - Uses LLM to classify document type
   - Sends first 4000 characters to LLM
   - Falls back to heuristics if LLM output is unclear
   - Returns one of: discharge_summary, inpatient_document, census, junk

4. **`summarize_document(text: str, max_tokens: int = 256) -> str`**

   - Generates 3-5 bullet point summary
   - Sends first 4000 characters to LLM
   - Returns plain language clinical summary

5. **`persist_document_analysis(...) -> DocumentAnalysis`**

   - Saves analysis results to database
   - Creates new DocumentAnalysis record
   - Returns the persisted object

6. **`list_recent_documents(limit: int = 20) -> list[DocumentRecord]`**

   - Queries database for recent analyses
   - Orders by created_at descending
   - Returns list of DocumentRecord schemas

7. **`delete_document_analysis(doc_id: int) -> bool`**
   - Deletes a document analysis by ID
   - Returns True if deleted, False if not found

#### LLM Service (`services/api/v1/llm_service.py`)

Handles interaction with the local Ollama LLM:

**Key Functions:**

1. **`get_ollama_client() -> Client`**

   - Creates and caches Ollama client
   - Uses `@lru_cache` for singleton pattern
   - Configurable base URL via `OLLAMA_BASE_URL`

2. **`generate_text(prompt: str, max_tokens: int = 128) -> str`**
   - Sends prompt to Ollama
   - Uses configured model (default: mistral)
   - Returns generated text

**Environment Variables:**

- `OLLAMA_BASE_URL`: Ollama server URL (default: `http://localhost:11434`)
- `OLLAMA_MODEL`: Model to use (default: `mistral`)

### 6. API Routes (`api/v1/routes/`)

#### Documents Route

**POST `/api/v1/api/v1/documents/analyze`**

- Upload PDF or TIFF file
- Extract text
- Classify document type
- Generate summary
- Persist to database
- Return analysis results

**GET `/api/v1/api/v1/documents`**

- List recent document analyses
- Query parameter: `limit` (default: 20)
- Returns array of document records

**DELETE `/api/v1/api/v1/documents/{doc_id}`**

- Delete a specific document analysis
- Path parameter: `doc_id` (integer)
- Returns success status

## Request Flow

### Document Analysis Flow

1. **Client uploads file** → POST `/api/v1/api/v1/documents/analyze`
2. **Route handler** receives multipart file upload
3. **Service layer**:
   - Determines file type (PDF or TIFF)
   - Calls appropriate text extraction function
   - Passes text to `classify_document_type()`
   - Passes text to `summarize_document()`
4. **LLM service**:
   - Sends prompts to Ollama
   - Receives AI-generated responses
5. **Database layer**:
   - Saves analysis with `persist_document_analysis()`
6. **Response** returns to client with:
   - Document type
   - Summary
   - Text length
   - Timestamp

## Dependencies

```toml
dependencies = [
    "fastapi",              # Web framework
    "uvicorn[standard]",    # ASGI server
    "transformers",         # HuggingFace transformers (if needed)
    "torch",                # PyTorch (if needed)
    "pypdf",                # PDF text extraction
    "pillow",               # Image processing
    "pytesseract",          # OCR wrapper
    "sqlalchemy",           # ORM
    "python-multipart",     # File upload support
    "ollama",               # Ollama client
]
```

## Performance Considerations

1. **Text Truncation**: Documents are truncated to 4000 characters before LLM processing to:

   - Reduce latency
   - Stay within token limits
   - Save computational resources

2. **Database Sessions**: Proper session management with try/finally blocks ensures connections are closed

3. **LRU Cache**: Ollama client is cached to avoid reconnection overhead

4. **Async Support**: FastAPI supports async endpoints for better concurrency (can be added if needed)

## Error Handling

- File type validation (PDF/TIFF only)
- Graceful fallback if LLM returns unexpected output
- Database transaction rollback on errors
- Proper HTTP status codes

## Testing

Test the backend using:

1. **Swagger UI**: http://127.0.0.1:8000/docs

   - Interactive API testing
   - Try out all endpoints
   - View request/response schemas

2. **ReDoc**: http://127.0.0.1:8000/redoc

   - Alternative documentation view
   - Better for reading/understanding

3. **curl/Postman**: Direct HTTP requests

Example curl:

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/api/v1/documents/analyze" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@document.pdf"
```

## Security Considerations

1. **CORS**: Currently allows only localhost:3000
2. **File Validation**: Only accepts PDF/TIFF files
3. **SQL Injection**: SQLAlchemy ORM prevents SQL injection
4. **Rate Limiting**: Consider adding for production use

## Next Steps

- Add authentication to backend endpoints
- Implement pagination for document list
- Add document search/filter capabilities
- Consider async endpoints for better performance
- Add comprehensive error responses
- Implement logging and monitoring
