from fastapi import APIRouter, File, HTTPException, UploadFile
import pytesseract

from app.schemas.document import DocumentAnalysisResponse, DocumentDetail, DocumentRecord, DocumentType
from app.services import document_service

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])


@router.post("/analyze", response_model=DocumentAnalysisResponse)
async def analyze_document(file: UploadFile = File(...)) -> DocumentAnalysisResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    filename = file.filename.lower()

    # Ensure we start reading from the beginning of the stream
    await file.seek(0)

    if filename.endswith(".pdf"):
        try:
            text = document_service.extract_text_from_pdf(file.file)
        except pytesseract.pytesseract.TesseractNotFoundError:
            raise HTTPException(
                status_code=400,
                detail=(
                    "PDF OCR is enabled but Tesseract OCR was not found. "
                    "Install Tesseract and ensure it is on PATH, or set TESSERACT_CMD to the full path of tesseract.exe."
                ),
            )
        except RuntimeError as e:
            raise HTTPException(status_code=400, detail=str(e))
    elif filename.endswith(".tif") or filename.endswith(".tiff"):
        try:
            text = document_service.extract_text_from_tiff(file.file)
        except pytesseract.pytesseract.TesseractNotFoundError:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Tesseract OCR is required to process TIFF files but was not found. "
                    "Install Tesseract and ensure it is on PATH, or set the TESSERACT_CMD environment variable "
                    "to the full path of tesseract.exe (Windows). See the repo README for details."
                ),
            )
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Please upload a PDF or TIFF file.")

    if not text or not text.strip():
        raise HTTPException(
            status_code=400,
            detail=(
                "Could not extract any text from the document. "
                "If this is a scanned/image-based PDF, text extraction will be empty. "
                "Try uploading a TIFF, or enable OCR for PDFs with PDF_OCR_ENABLED=1 (requires Tesseract). "
                "Also ensure the backend dependency 'pymupdf' is installed (pip install -e .) "
                "to improve PDF text extraction."
            ),
        )

    doc_type, classification_reason = document_service.classify_document_type(text)

    if doc_type == DocumentType.junk:
        summary = "Document appears to be junk or contains insufficient clinical content to summarize."
    else:
        summary = document_service.summarize_document(text)

    # Persist analysis to SQLite
    document_service.persist_document_analysis(
        filename=filename,
        text=text,
        doc_type=doc_type,
        classification_reason=classification_reason,
        summary=summary,
    )

    return DocumentAnalysisResponse(
        type=doc_type,
        summary=summary,
        text_length=len(text),
        classification_reason=classification_reason,
    )


@router.get("/", response_model=list[DocumentRecord])
async def list_documents(limit: int = 20) -> list[DocumentRecord]:
    """List recently analyzed documents.

    Results are ordered from newest to oldest.
    """

    return document_service.list_recent_documents(limit=limit)


@router.get("/{doc_id}", response_model=DocumentDetail)
async def get_document(doc_id: int) -> DocumentDetail:
    item = document_service.get_document_detail(doc_id)
    if not item:
        raise HTTPException(status_code=404, detail="Document not found")
    return item


@router.delete("/{doc_id}")
async def delete_document(doc_id: int) -> dict:
    deleted = document_service.delete_document_analysis(doc_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")

    return {"ok": True}
