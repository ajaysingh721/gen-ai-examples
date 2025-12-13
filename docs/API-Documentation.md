# API Documentation

Complete API reference for the Clinical Document Analyzer backend.

## Base URL

**Development**: `http://127.0.0.1:8000`

**API Version**: v1 (prefix: `/api/v1`)

## Interactive Documentation

- **Swagger UI**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc

## Authentication

Currently, the backend API does **not require authentication**. The frontend handles authentication via NextAuth, but backend endpoints are open.

> **Note**: For production deployment, consider adding API authentication (JWT, API keys, etc.)

## Endpoints

### 1. Analyze Document

Upload and analyze a clinical document (PDF or TIFF).

**Endpoint**: `POST /api/v1/api/v1/documents/analyze`

**Request**:

- Content-Type: `multipart/form-data`
- Body:
  - `file`: Binary file (PDF or TIFF)

**Example using curl**:

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/api/v1/documents/analyze" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/document.pdf"
```

**Example using JavaScript**:

```javascript
const formData = new FormData();
formData.append("file", fileInput.files[0]);

const response = await fetch(
  "http://127.0.0.1:8000/api/v1/api/v1/documents/analyze",
  {
    method: "POST",
    body: formData,
  }
);

const result = await response.json();
```

**Response** (200 OK):

```json
{
  "id": 1,
  "filename": "discharge_summary.pdf",
  "doc_type": "discharge_summary",
  "summary": "Patient discharged after successful treatment for pneumonia. Vital signs stable. Follow-up appointment scheduled in 2 weeks. Continue antibiotics for 7 days.",
  "text_length": 2547,
  "created_at": "2025-12-13T10:30:00.000Z"
}
```

**Response Fields**:

- `id` (integer): Database record ID
- `filename` (string): Original filename
- `doc_type` (string): Document classification
  - `discharge_summary`
  - `inpatient_document`
  - `census`
  - `junk`
- `summary` (string): AI-generated summary
- `text_length` (integer): Length of extracted text
- `created_at` (string): ISO 8601 timestamp

**Error Responses**:

400 Bad Request:

```json
{
  "detail": "Invalid file type. Only PDF and TIFF files are supported."
}
```

422 Unprocessable Entity:

```json
{
  "detail": [
    {
      "loc": ["body", "file"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

500 Internal Server Error:

```json
{
  "detail": "Error processing document: [error message]"
}
```

### 2. List Documents

Retrieve a list of recently analyzed documents.

**Endpoint**: `GET /api/v1/api/v1/documents`

**Query Parameters**:

- `limit` (integer, optional): Maximum number of results (default: 20)

**Example Request**:

```bash
curl -X GET "http://127.0.0.1:8000/api/v1/api/v1/documents?limit=10" \
  -H "accept: application/json"
```

**Example using JavaScript**:

```javascript
const response = await fetch(
  "http://127.0.0.1:8000/api/v1/api/v1/documents?limit=10"
);
const documents = await response.json();
```

**Response** (200 OK):

```json
[
  {
    "id": 3,
    "filename": "discharge_summary.pdf",
    "doc_type": "discharge_summary",
    "summary": "Patient discharged after successful treatment...",
    "text_length": 2547,
    "created_at": "2025-12-13T10:30:00.000Z"
  },
  {
    "id": 2,
    "filename": "progress_note.pdf",
    "doc_type": "inpatient_document",
    "summary": "Patient showing improvement. Continue current treatment plan...",
    "text_length": 1823,
    "created_at": "2025-12-13T09:15:00.000Z"
  },
  {
    "id": 1,
    "filename": "census_report.tiff",
    "doc_type": "census",
    "summary": "Daily census report showing 45 patients across 3 units...",
    "text_length": 892,
    "created_at": "2025-12-13T08:00:00.000Z"
  }
]
```

**Response**: Array of document objects (ordered by most recent first)

### 3. Delete Document

Delete a specific document analysis from the database.

**Endpoint**: `DELETE /api/v1/api/v1/documents/{doc_id}`

**Path Parameters**:

- `doc_id` (integer): The document ID to delete

**Example Request**:

```bash
curl -X DELETE "http://127.0.0.1:8000/api/v1/api/v1/documents/1" \
  -H "accept: application/json"
```

**Example using JavaScript**:

```javascript
const response = await fetch(
  "http://127.0.0.1:8000/api/v1/api/v1/documents/1",
  {
    method: "DELETE",
  }
);
```

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

**Error Response** (404 Not Found):

```json
{
  "detail": "Document not found"
}
```

### 4. Health Check

Check if the API is running (if implemented).

**Endpoint**: `GET /`

**Example Request**:

```bash
curl -X GET "http://127.0.0.1:8000/" \
  -H "accept: application/json"
```

**Response** (200 OK):

```json
{
  "status": "healthy",
  "version": "0.1.0"
}
```

## Document Types

The API classifies documents into four categories:

### 1. discharge_summary

**Description**: Patient discharge summaries when leaving the hospital

**Typical Content**:

- Patient demographics
- Admission/discharge dates
- Diagnosis
- Procedures performed
- Medications
- Follow-up instructions

**Example Classification Keywords**: "discharge", "discharged", "discharge summary", "post-discharge"

### 2. inpatient_document

**Description**: Any in-hospital documentation

**Includes**:

- Progress notes
- History & Physical (H&P)
- Consultation notes
- Operative reports
- Nursing notes

**Example Classification Keywords**: "progress note", "consultation", "operative report", "H&P"

### 3. census

**Description**: Patient census reports or lists

**Typical Content**:

- Patient lists
- Bed assignments
- Unit/service information
- Census counts
- Room numbers

**Example Classification Keywords**: "census", "patient list", "bed assignment", "unit census"

### 4. junk

**Description**: Non-meaningful or corrupted documents

**Includes**:

- Scanning errors
- Blank pages
- Noise/artifacts
- Very short or empty content
- Non-medical content

**Classification Criteria**:

- Text length < 100 characters
- No recognizable medical content
- Corrupted/unreadable text

## LLM Integration

The API uses **Ollama** for AI-powered features:

### Document Classification

**Process**:

1. Extract first 4000 characters of document
2. Send to LLM with classification prompt
3. LLM responds with category
4. Fallback to heuristics if unclear

**Prompt Template**:

```
You are a clinical documentation classifier.
Given the following clinical or administrative document,
decide which ONE of the following categories it belongs to:

- discharge_summary: a discharge summary for a patient leaving the hospital
- inpatient_document: any inpatient progress note, H&P, consult, or other in-hospital documentation
- census: a list or table of patients, often with bed numbers, units, or service names
- junk: anything that is not a meaningful clinical or census document

Respond with only one word from: discharge_summary, inpatient_document, census, junk.

Document:
[document text]

Category:
```

### Document Summarization

**Process**:

1. Extract first 4000 characters of document
2. Send to LLM with summarization prompt
3. LLM generates 3-5 bullet points
4. Return plain language summary

**Prompt Template**:

```
You are a clinical documentation assistant.
Summarize the following medical document in 3-5 bullet points,
focusing on key clinical information, in plain language.

Document:
[document text]

Summary:
```

**Parameters**:

- `max_tokens`: 256 (adjustable)
- Model: mistral (default)

## Text Extraction

### PDF Files

**Library**: PyPDF

**Process**:

1. Open PDF with PdfReader
2. Iterate through all pages
3. Extract text from each page
4. Concatenate with newlines

**Limitations**:

- Text-based PDFs only (not scanned images)
- Complex layouts may have extraction issues
- Tables may not preserve structure

### TIFF Files

**Library**: Tesseract OCR (via pytesseract)

**Process**:

1. Open TIFF with Pillow
2. Iterate through all frames (pages)
3. Apply OCR to each frame
4. Concatenate results

**Requirements**:

- Tesseract must be installed
- `tesseract.exe` must be on PATH (Windows)

**Limitations**:

- OCR accuracy depends on image quality
- Handwritten text may not be recognized
- Processing is slower than PDF extraction

## Error Handling

### Common Errors

**1. File Upload Errors**

- Missing file in request
- File too large
- Invalid file type

**2. Text Extraction Errors**

- Corrupted PDF/TIFF file
- Tesseract not installed
- Unreadable content

**3. LLM Errors**

- Ollama not running
- Model not available
- Connection timeout

**4. Database Errors**

- Database locked
- Disk space full
- Invalid query

### Error Response Format

All errors follow FastAPI's standard format:

```json
{
  "detail": "Error message or array of validation errors"
}
```

## Rate Limiting

Currently, there is **no rate limiting** on the API.

**Recommendations for Production**:

- Implement rate limiting middleware
- Use tools like `slowapi` or `fastapi-limiter`
- Set reasonable limits (e.g., 10 requests/minute per IP)

## CORS Configuration

The API allows CORS from:

- `http://localhost:3000`
- `http://127.0.0.1:3000`

**To add more origins**, edit `backend/app/main.py`:

```python
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://your-frontend-domain.com"
]
```

## Database Schema

### document_analyses Table

| Column      | Type     | Description                  |
| ----------- | -------- | ---------------------------- |
| id          | INTEGER  | Primary key (auto-increment) |
| filename    | VARCHAR  | Original filename            |
| doc_type    | VARCHAR  | Document classification      |
| summary     | TEXT     | AI-generated summary         |
| text_length | INTEGER  | Length of extracted text     |
| raw_text    | TEXT     | Full extracted text          |
| created_at  | DATETIME | Timestamp of creation        |

**Indexes**:

- Primary key on `id`
- Index on `created_at` for efficient sorting

## Performance Considerations

### Response Times

**Typical response times**:

- Document analysis: 5-30 seconds (depends on LLM speed)
- List documents: < 100ms
- Delete document: < 50ms

**Factors affecting speed**:

1. **LLM inference time**: Largest factor (5-20 seconds)
2. **Text extraction**:
   - PDF: Fast (< 1 second)
   - TIFF OCR: Slower (2-10 seconds)
3. **File size**: Larger files take longer
4. **Document complexity**: Complex layouts slower

### Optimization Tips

1. **Use faster LLM models**: Consider smaller/faster models
2. **Reduce max_tokens**: Lower token limits speed up generation
3. **Implement caching**: Cache results for identical documents
4. **Async processing**: Return immediately and notify when done
5. **Queue system**: Use Celery or similar for background processing

## Testing with Swagger UI

1. Navigate to http://127.0.0.1:8000/docs
2. Click on an endpoint to expand
3. Click "Try it out"
4. Fill in parameters
5. Click "Execute"
6. View response below

**Benefits**:

- Interactive testing
- Automatic request formatting
- Response examples
- Schema documentation

## SDK / Client Libraries

Currently, no official SDK is provided. Use standard HTTP clients:

**Python**:

```python
import requests

# Upload document
with open('document.pdf', 'rb') as f:
    files = {'file': f}
    response = requests.post('http://127.0.0.1:8000/api/v1/api/v1/documents/analyze', files=files)
    result = response.json()

# List documents
response = requests.get('http://127.0.0.1:8000/api/v1/api/v1/documents?limit=10')
documents = response.json()
```

**JavaScript/TypeScript**:

```typescript
// See examples in endpoint sections above
```

## Versioning

Current version: **v1**

API prefix: `/api/v1`

**Future versions**: Will use `/api/v2`, `/api/v3`, etc.

**Backward compatibility**: v1 will be maintained for compatibility.
