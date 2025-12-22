from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text, Boolean

from app.core.db import Base


class DocumentAnalysis(Base):
    __tablename__ = "document_analyses"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(512), nullable=False)
    doc_type = Column(String(64), nullable=False)
    classification_reason = Column(Text, nullable=True)
    review_note = Column(Text, nullable=True)
    auto_approved = Column(Boolean, default=False, nullable=False)
    summary = Column(Text, nullable=False)
    text_length = Column(Integer, nullable=False)
    raw_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
