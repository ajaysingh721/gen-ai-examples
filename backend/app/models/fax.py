from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, DateTime, Enum, Integer, String, Text, Boolean, Float

from app.core.db import Base


class FaxStatus(str, PyEnum):
    """Status of a fax in the processing pipeline."""
    pending = "pending"           # Awaiting AI categorization
    categorized = "categorized"   # AI has categorized, awaiting review
    approved = "approved"         # User approved AI decision
    overridden = "overridden"     # User overrode AI decision
    processed = "processed"       # Fully processed and filed


class FaxCategory(str, PyEnum):
    """Categories for fax documents."""
    discharge_summary = "discharge_summary"
    inpatient_document = "inpatient_document"
    census = "census"
    junk_fax = "junk_fax"


class Fax(Base):
    """Model for fax documents in the processing queue."""
    __tablename__ = "faxes"

    id = Column(Integer, primary_key=True, index=True)
    
    # File information
    filename = Column(String(512), nullable=False)
    original_path = Column(String(1024), nullable=False)  # Path in shared folder
    file_hash = Column(String(64), nullable=True, index=True)  # To detect duplicates
    
    # Processing status
    status = Column(String(32), default=FaxStatus.pending.value, nullable=False, index=True)
    
    # AI categorization
    ai_category = Column(String(64), nullable=True)
    ai_confidence = Column(Float, nullable=True)  # Confidence score 0-1
    ai_reason = Column(Text, nullable=True)       # Why AI chose this category
    
    # Final category (after potential override)
    final_category = Column(String(64), nullable=True)
    
    # User feedback/override
    was_overridden = Column(Boolean, default=False, nullable=False)
    override_reason = Column(Text, nullable=True)
    reviewed_by = Column(String(256), nullable=True)  # Username who reviewed
    reviewed_at = Column(DateTime, nullable=True)
    auto_approved = Column(Boolean, default=False, nullable=False)  # Was this auto-approved?
    
    # Document content
    raw_text = Column(Text, nullable=True)
    text_length = Column(Integer, default=0, nullable=False)
    summary = Column(Text, nullable=True)
    page_count = Column(Integer, default=1, nullable=False)
    
    # Priority and urgency
    is_urgent = Column(Boolean, default=False, nullable=False)
    priority_score = Column(Integer, default=0, nullable=False)  # Higher = more urgent
    
    # Timestamps
    received_at = Column(DateTime, default=datetime.utcnow, nullable=False)  # When file appeared
    processed_at = Column(DateTime, nullable=True)  # When AI processed it
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class FaxFeedback(Base):
    """Store user feedback to improve categorization over time."""
    __tablename__ = "fax_feedback"

    id = Column(Integer, primary_key=True, index=True)
    fax_id = Column(Integer, nullable=False, index=True)
    
    # What AI predicted vs what was correct
    ai_category = Column(String(64), nullable=False)
    correct_category = Column(String(64), nullable=False)
    
    # Feedback details
    feedback_text = Column(Text, nullable=True)
    submitted_by = Column(String(256), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class FaxSettings(Base):
    """Configuration settings for the fax processing system."""
    __tablename__ = "fax_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(128), unique=True, nullable=False)
    value = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
