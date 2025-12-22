from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict


class DocumentType(str, Enum):
    discharge_summary = "discharge_summary"
    inpatient_document = "inpatient_document"
    census = "census"
    junk_fax = "junk_fax"


class DocumentAnalysisResponse(BaseModel):
    type: DocumentType
    summary: str
    text_length: int
    classification_reason: str | None = None
    review_note: str | None = None
    auto_approved: bool = False


class DocumentRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    doc_type: DocumentType
    summary: str
    text_length: int
    classification_reason: str | None = None
    review_note: str | None = None
    auto_approved: bool = False
    created_at: datetime


class DocumentDetail(DocumentRecord):
    raw_text: str
