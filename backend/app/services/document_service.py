from typing import BinaryIO

from pypdf import PdfReader
from PIL import Image, ImageSequence
import pytesseract
from sqlalchemy.orm import Session

from app.core.db import SessionLocal
from app.models.document_analysis import DocumentAnalysis
from app.schemas.document import DocumentType, DocumentRecord
from app.services.llm_service import generate_text


def extract_text_from_pdf(file_obj: BinaryIO) -> str:
    reader = PdfReader(file_obj)
    texts: list[str] = []
    for page in reader.pages:
        page_text = page.extract_text() or ""
        if page_text.strip():
            texts.append(page_text)
    return "\n".join(texts)


def extract_text_from_tiff(file_obj: BinaryIO) -> str:
    image = Image.open(file_obj)
    texts: list[str] = []
    for frame in ImageSequence.Iterator(image):
        text = pytesseract.image_to_string(frame) or ""
        if text.strip():
            texts.append(text)
    return "\n".join(texts)


def classify_document_type(text: str) -> DocumentType:
    """Use the LLM to decide what kind of document this is.

    Categories:
      - discharge_summary
      - inpatient_document
      - census
      - junk
    """

    cleaned = text.strip()
    if not cleaned or len(cleaned) < 100:
        return DocumentType.junk

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
        "Respond with only one word from: discharge_summary, inpatient_document, census, junk.\n\n"
        f"Document:\n{snippet}\n\nCategory:"
    )

    raw = generate_text(prompt, max_tokens=8).strip().lower()

    # Normalize and map model output to our enum
    if "discharge" in raw:
        return DocumentType.discharge_summary
    if "inpatient" in raw or "progress" in raw or "note" in raw:
        return DocumentType.inpatient_document
    if "census" in raw:
        return DocumentType.census
    if "junk" in raw:
        return DocumentType.junk

    # Fallback heuristic if LLM output is unclear
    if len(cleaned) < 150:
        return DocumentType.junk
    if "discharge" in cleaned.lower():
        return DocumentType.discharge_summary
    if "census" in cleaned.lower():
        return DocumentType.census
    if len(cleaned) > 300:
        return DocumentType.inpatient_document

    return DocumentType.junk


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
    summary: str,
) -> DocumentAnalysis:
    """Persist a document analysis result to the SQLite database."""

    db: Session = SessionLocal()
    try:
        obj = DocumentAnalysis(
            filename=filename,
            doc_type=doc_type.value,
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
                created_at=item.created_at,
            )
            for item in items
        ]
    finally:
        db.close()
