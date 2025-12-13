from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas.document import DocumentAnalysisResponse, DocumentType
from app.services import document_service

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/analyze", response_model=DocumentAnalysisResponse)
async def analyze_document(file: UploadFile = File(...)) -> DocumentAnalysisResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    filename = file.filename.lower()

    # Ensure we start reading from the beginning of the stream
    await file.seek(0)

    if filename.endswith(".pdf"):
        text = document_service.extract_text_from_pdf(file.file)
    elif filename.endswith(".tif") or filename.endswith(".tiff"):
        text = document_service.extract_text_from_tiff(file.file)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Please upload a PDF or TIFF file.")

    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract any text from the document.")

    doc_type = document_service.classify_document_type(text)

    if doc_type == DocumentType.junk:
        summary = "Document appears to be junk or contains insufficient clinical content to summarize."
    else:
        summary = document_service.summarize_document(text)

    # Persist analysis to SQLite
    document_service.persist_document_analysis(
        filename=filename,
        text=text,
        doc_type=doc_type,
        summary=summary,
    )

    return DocumentAnalysisResponse(
        type=doc_type,
        summary=summary,
        text_length=len(text),
    )
