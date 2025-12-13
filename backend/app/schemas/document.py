from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict


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
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    doc_type: DocumentType
    summary: str
    text_length: int
    created_at: datetime
