from typing import BinaryIO

from pypdf import PdfReader
from PIL import Image, ImageSequence
import pytesseract
from sqlalchemy.orm import Session

from app.core.db import SessionLocal
from app.models.document_analysis import DocumentAnalysis
from app.schemas.document import DocumentType
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
    cleaned = text.strip()
    if not cleaned or len(cleaned) < 100:
        return DocumentType.junk

    lowered = cleaned.lower()

    if "discharge summary" in lowered or "discharge diagnosis" in lowered:
        return DocumentType.discharge_summary

    if any(kw in lowered for kw in [
        "hospital day",
        "progress note",
        "admission date",
        "discharge date",
        "inpatient",
    ]):
        return DocumentType.inpatient_document

    if "census" in lowered:
        return DocumentType.census

    # Default to inpatient-style clinical document if it looks substantial
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
