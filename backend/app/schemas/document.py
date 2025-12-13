from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class DocumentType(str, Enum):
    discharge_summary = "discharge_summary"
    inpatient_document = "inpatient_document"
    census = "census"
    junk = "junk"


class DocumentAnalysisResponse(BaseModel):
    type: DocumentType
    summary: str
    text_length: int


class DocumentRecord(BaseModel):
    id: int
    filename: str
    doc_type: DocumentType
    summary: str
    text_length: int
    created_at: datetime

    class Config:
        orm_mode = True
