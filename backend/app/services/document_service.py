from typing import BinaryIO
import os
import json
import re
from io import BytesIO

from pypdf import PdfReader
from PIL import Image, ImageSequence
import pytesseract
from sqlalchemy.orm import Session

from app.core.db import SessionLocal
from app.models.document_analysis import DocumentAnalysis
from app.schemas.document import DocumentType, DocumentRecord, DocumentDetail
from app.services.llm_service import generate_text


def extract_text_from_pdf(file_obj: BinaryIO) -> str:
    # Read bytes once so we can try multiple extraction strategies.
    try:
        pdf_bytes = file_obj.read()
    finally:
        # Best-effort rewind for callers that may reuse the stream.
        try:
            file_obj.seek(0)
        except Exception:
            pass

    if not pdf_bytes:
        return ""

    texts: list[str] = []

    # 1) Try pypdf first (fast, pure-python; sometimes fails on certain encodings).
    try:
        reader = PdfReader(BytesIO(pdf_bytes))
        for page in reader.pages:
            page_text = page.extract_text() or ""
            if page_text.strip():
                texts.append(page_text)
    except Exception:
        # Keep going to fallbacks
        pass

    joined = "\n".join(texts).strip()
    if joined:
        return joined

    # 2) Fallback to PyMuPDF (more robust for many PDFs where pypdf returns empty).
    try:
        import fitz  # PyMuPDF

        with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
            mupdf_texts: list[str] = []
            for page in doc:
                page_text = page.get_text("text") or ""
                if page_text.strip():
                    mupdf_texts.append(page_text)
            joined = "\n".join(mupdf_texts).strip()
            if joined:
                return joined
    except ImportError:
        pass
    except Exception:
        pass

    # 3) Optional OCR fallback for scanned/image-based PDFs.
    # Enable with: PDF_OCR_ENABLED=1
    enabled = (os.getenv("PDF_OCR_ENABLED") or "").strip().lower() in {"1", "true", "yes", "on"}
    if not enabled:
        return ""

    # Safety limits to avoid very slow OCR on large PDFs.
    try:
        max_pages = int(os.getenv("PDF_OCR_MAX_PAGES") or "5")
    except ValueError:
        max_pages = 5

    try:
        dpi = int(os.getenv("PDF_OCR_DPI") or "200")
    except ValueError:
        dpi = 200

    # Configure tesseract path if provided.
    tesseract_cmd = os.getenv("TESSERACT_CMD") or os.getenv("TESSERACT_PATH")
    if tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    try:
        import fitz  # PyMuPDF

        with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
            ocr_texts: list[str] = []
            scale = max(dpi, 72) / 72.0
            matrix = fitz.Matrix(scale, scale)

            for idx, page in enumerate(doc):
                if idx >= max_pages:
                    break

                pix = page.get_pixmap(matrix=matrix, alpha=False)
                image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                text = pytesseract.image_to_string(image) or ""
                if text.strip():
                    ocr_texts.append(text)

            return "\n".join(ocr_texts).strip()
    except ImportError:
        # Surface a clear error when OCR is enabled but PyMuPDF isn't installed.
        raise RuntimeError(
            "PDF OCR is enabled (PDF_OCR_ENABLED=1) but PyMuPDF is not installed. "
            "Install it with 'pip install -e .' from the backend folder (or 'pip install pymupdf')."
        )
    except pytesseract.pytesseract.TesseractNotFoundError:
        # Surface a clear error when OCR is enabled but Tesseract isn't installed / on PATH.
        raise
    except Exception:
        return ""


def extract_text_from_tiff(file_obj: BinaryIO) -> str:
    tesseract_cmd = os.getenv("TESSERACT_CMD") or os.getenv("TESSERACT_PATH")
    if tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    image = Image.open(file_obj)
    texts: list[str] = []
    for frame in ImageSequence.Iterator(image):
        text = pytesseract.image_to_string(frame) or ""
        if text.strip():
            texts.append(text)
    return "\n".join(texts)


def classify_document_type(text: str) -> tuple[DocumentType, str]:
    """Use the LLM to decide what kind of document this is, with a reason.

    Returns (document_type, classification_reason).
    """

    cleaned = text.strip()
    if not cleaned or len(cleaned) < 100:
        return (
            DocumentType.junk,
            "Insufficient extracted text to classify reliably.",
        )

    # Limit the length sent to the LLM for classification
    snippet = cleaned[:4000]

    prompt = (
        "You are a clinical documentation classifier. "
        "Given the following clinical or administrative document, "
        "decide which ONE of the following categories it belongs to:\n\n"
        "- discharge_summary: a discharge summary for a patient leaving the hospital\n"
        "- inpatient_document: any inpatient progress note, H&P, consult, or other in-hospital documentation\n"
        "- census: a list or table of patients, often with bed numbers, units, or service names\n"
        "- junk: anything that is not a meaningful clinical or census document (e.g., scanning errors, noise, empty content)\n\n"
        "Return STRICT JSON with exactly these keys:\n"
        "{\"category\": \"discharge_summary|inpatient_document|census|junk\", \"reason\": \"...\"}\n\n"
        f"Document:\n{snippet}\n"
    )

    raw = generate_text(prompt, max_tokens=128).strip()
    raw_lower = raw.lower()

    category: str | None = None
    reason: str | None = None

    # Try JSON first (tolerate extra text by extracting the first JSON object).
    match = re.search(r"\{.*\}", raw, flags=re.DOTALL)
    if match:
        try:
            payload = json.loads(match.group(0))
            if isinstance(payload, dict):
                category = str(payload.get("category") or "").strip().lower() or None
                reason = str(payload.get("reason") or "").strip() or None
        except Exception:
            category = None
            reason = None

    # Normalize and map model output to our enum
    if category and "discharge" in category:
        return (DocumentType.discharge_summary, reason or "Classified as discharge summary.")
    if category and "inpatient" in category:
        return (DocumentType.inpatient_document, reason or "Classified as inpatient document.")
    if category and "census" in category:
        return (DocumentType.census, reason or "Classified as census.")
    if category and "junk" in category:
        return (DocumentType.junk, reason or "Classified as junk.")

    # If the model didn't return JSON, fall back to keyword matching on its raw output.
    if "discharge" in raw_lower:
        return (DocumentType.discharge_summary, reason or f"Model output: {raw[:300]}")
    if "inpatient" in raw_lower or "progress" in raw_lower or "note" in raw_lower:
        return (DocumentType.inpatient_document, reason or f"Model output: {raw[:300]}")
    if "census" in raw_lower:
        return (DocumentType.census, reason or f"Model output: {raw[:300]}")
    if "junk" in raw_lower:
        return (DocumentType.junk, reason or f"Model output: {raw[:300]}")

    # Fallback heuristic if LLM output is unclear
    if len(cleaned) < 150:
        return (DocumentType.junk, "Short document; treating as junk.")
    if "discharge" in cleaned.lower():
        return (DocumentType.discharge_summary, "Heuristic match for 'discharge'.")
    if "census" in cleaned.lower():
        return (DocumentType.census, "Heuristic match for 'census'.")
    if len(cleaned) > 300:
        return (
            DocumentType.inpatient_document,
            "Heuristic: long clinical text; treating as inpatient document.",
        )

    return (DocumentType.junk, "Classification uncertain; defaulting to junk.")


def summarize_document(text: str, max_tokens: int = 256) -> str:
    # Truncate very long documents before sending to the LLM
    snippet = text[:4000]

    prompt = (
        "You are a clinical documentation assistant. "
        "Summarize the following medical document in 3-5 bullet points, "
        "focusing on key clinical information, in plain language.\n\n"
        f"Document:\n{snippet}\n\nSummary:"\
    )

    return generate_text(prompt, max_tokens=max_tokens)


def persist_document_analysis(
    *,
    filename: str,
    text: str,
    doc_type: DocumentType,
    classification_reason: str | None,
    summary: str,
) -> DocumentAnalysis:
    """Persist a document analysis result to the SQLite database."""

    db: Session = SessionLocal()
    try:
        obj = DocumentAnalysis(
            filename=filename,
            doc_type=doc_type.value,
            classification_reason=classification_reason,
            summary=summary,
            text_length=len(text),
            raw_text=text,
        )
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj
    finally:
        db.close()


def list_recent_documents(limit: int = 20) -> list[DocumentRecord]:
    """Return the most recent document analyses from the database."""

    db: Session = SessionLocal()
    try:
        query = (
            db.query(DocumentAnalysis)
            .order_by(DocumentAnalysis.created_at.desc())
            .limit(limit)
        )
        items = query.all()
        return [
            DocumentRecord(
                id=item.id,
                filename=item.filename,
                doc_type=DocumentType(item.doc_type),
                summary=item.summary,
                text_length=item.text_length,
                classification_reason=getattr(item, "classification_reason", None),
                created_at=item.created_at,
            )
            for item in items
        ]
    finally:
        db.close()


def delete_document_analysis(doc_id: int) -> bool:
    """Delete a document analysis row by id.

    Returns True if a row was deleted, False if it did not exist.
    """

    db: Session = SessionLocal()
    try:
        obj = db.query(DocumentAnalysis).filter(DocumentAnalysis.id == doc_id).first()
        if not obj:
            return False

        db.delete(obj)
        db.commit()
        return True
    finally:
        db.close()


def get_document_detail(doc_id: int) -> DocumentDetail | None:
    """Return a single document analysis including extracted text."""

    db: Session = SessionLocal()
    try:
        item = db.query(DocumentAnalysis).filter(DocumentAnalysis.id == doc_id).first()
        if not item:
            return None

        return DocumentDetail(
            id=item.id,
            filename=item.filename,
            doc_type=DocumentType(item.doc_type),
            summary=item.summary,
            text_length=item.text_length,
            classification_reason=getattr(item, "classification_reason", None),
            created_at=item.created_at,
            raw_text=item.raw_text,
        )
    finally:
        db.close()
