from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, DateTime, Enum, Integer, String, Text, Boolean, Float, JSON

from app.core.db import Base


class FaxStatus(str, PyEnum):
    """Status of a fax in the processing pipeline."""
    pending = "pending"           # Awaiting AI categorization
    categorized = "categorized"   # AI has categorized, awaiting review
    approved = "approved"         # User approved AI decision
    overridden = "overridden"     # User overrode AI decision
    processed = "processed"       # Fully processed and filed
    flagged = "flagged"           # Flagged for manual review (anomaly detected)
    archived = "archived"         # Archived for long-term storage


class FaxCategory(str, PyEnum):
    """Categories for fax documents."""
    discharge_summary = "discharge_summary"
    inpatient_document = "inpatient_document"
    census = "census"
    junk_fax = "junk_fax"
    # New categories for better classification
    lab_results = "lab_results"
    prescription_refill = "prescription_refill"
    referral = "referral"
    insurance_auth = "insurance_auth"
    medical_records_request = "medical_records_request"
    prior_authorization = "prior_authorization"
    appointment_related = "appointment_related"
    billing_inquiry = "billing_inquiry"
    other_clinical = "other_clinical"


class FaxSubCategory(str, PyEnum):
    """Sub-categories for more granular classification."""
    # Discharge Summary sub-types
    discharge_instructions = "discharge_instructions"
    discharge_medications = "discharge_medications"
    discharge_follow_up = "discharge_follow_up"
    # Inpatient sub-types
    progress_note = "progress_note"
    h_and_p = "h_and_p"
    consultation = "consultation"
    operative_note = "operative_note"
    # Lab results sub-types
    blood_work = "blood_work"
    imaging = "imaging"
    pathology = "pathology"
    # Other
    unspecified = "unspecified"


class SentimentType(str, PyEnum):
    """Sentiment/tone detected in the fax."""
    neutral = "neutral"
    urgent = "urgent"
    routine = "routine"
    critical = "critical"
    informational = "informational"


class QualityScore(str, PyEnum):
    """Document quality assessment."""
    excellent = "excellent"  # Clear, readable, complete
    good = "good"            # Mostly readable
    fair = "fair"            # Some issues but usable
    poor = "poor"            # Significant quality issues
    illegible = "illegible"  # Cannot be processed


class Fax(Base):
    """Model for fax documents in the processing queue."""
    __tablename__ = "faxes"

    id = Column(Integer, primary_key=True, index=True)
    
    # File information
    filename = Column(String(512), nullable=False)
    original_path = Column(String(1024), nullable=False)  # Path in shared folder
    file_hash = Column(String(64), nullable=True, index=True)  # To detect duplicates
    file_size_bytes = Column(Integer, nullable=True)  # File size for analytics
    
    # Processing status
    status = Column(String(32), default=FaxStatus.pending.value, nullable=False, index=True)
    
    # AI categorization - Primary
    ai_category = Column(String(64), nullable=True)
    ai_confidence = Column(Float, nullable=True)  # Confidence score 0-1
    ai_reason = Column(Text, nullable=True)       # Why AI chose this category
    
    # AI categorization - Secondary (hierarchical classification)
    ai_sub_category = Column(String(64), nullable=True)
    ai_sub_confidence = Column(Float, nullable=True)
    
    # Alternative categories (top-3 predictions for user selection)
    alternative_categories = Column(JSON, nullable=True)  # [{category, confidence, reason}]
    
    # Final category (after potential override)
    final_category = Column(String(64), nullable=True)
    final_sub_category = Column(String(64), nullable=True)
    
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
    
    # NEW: Enhanced AI extraction
    extracted_entities = Column(JSON, nullable=True)  # Named entities: patients, doctors, facilities
    key_dates = Column(JSON, nullable=True)  # Important dates found in document
    action_items = Column(JSON, nullable=True)  # Required follow-up actions
    keywords = Column(JSON, nullable=True)  # Key terms for searchability
    
    # NEW: Patient/Sender identification
    detected_patient_name = Column(String(256), nullable=True)
    detected_patient_dob = Column(String(32), nullable=True)
    detected_patient_mrn = Column(String(64), nullable=True)
    detected_sender_name = Column(String(256), nullable=True)
    detected_sender_fax = Column(String(32), nullable=True)
    detected_sender_facility = Column(String(256), nullable=True)
    
    # NEW: Document quality assessment
    quality_score = Column(String(32), nullable=True)  # excellent/good/fair/poor/illegible
    quality_issues = Column(JSON, nullable=True)  # List of detected issues
    ocr_confidence = Column(Float, nullable=True)  # OCR accuracy estimate
    
    # NEW: Sentiment and tone analysis
    sentiment = Column(String(32), nullable=True)  # urgent/routine/critical/informational
    tone_indicators = Column(JSON, nullable=True)  # Words/phrases indicating urgency
    
    # NEW: Duplicate/Similar document detection
    similar_fax_ids = Column(JSON, nullable=True)  # IDs of similar documents
    is_duplicate = Column(Boolean, default=False, nullable=False)
    duplicate_of_id = Column(Integer, nullable=True)  # Original document ID if duplicate
    
    # NEW: Routing suggestions
    suggested_department = Column(String(128), nullable=True)
    suggested_recipient = Column(String(256), nullable=True)
    routing_confidence = Column(Float, nullable=True)
    
    # NEW: Compliance and PHI detection
    contains_phi = Column(Boolean, default=False, nullable=False)
    phi_types_detected = Column(JSON, nullable=True)  # SSN, DOB, MRN, etc.
    requires_encryption = Column(Boolean, default=False, nullable=False)
    
    # NEW: Language detection (for multi-language support)
    detected_language = Column(String(16), default="en", nullable=False)
    needs_translation = Column(Boolean, default=False, nullable=False)
    
    # NEW: Processing metrics
    processing_time_ms = Column(Integer, nullable=True)  # Time to process
    retry_count = Column(Integer, default=0, nullable=False)
    last_error = Column(Text, nullable=True)
    
    # NEW: Workflow tracking
    assigned_to = Column(String(256), nullable=True)  # Assigned user for review
    due_date = Column(DateTime, nullable=True)  # SLA deadline
    escalated = Column(Boolean, default=False, nullable=False)
    escalation_reason = Column(Text, nullable=True)
    
    # NEW: Tags and notes
    tags = Column(JSON, nullable=True)  # User-defined tags
    internal_notes = Column(Text, nullable=True)  # Staff notes
    
    # Priority and urgency
    is_urgent = Column(Boolean, default=False, nullable=False)
    priority_score = Column(Integer, default=0, nullable=False)  # Higher = more urgent
    urgency_reason = Column(Text, nullable=True)  # Why it's marked urgent
    
    # Timestamps
    received_at = Column(DateTime, default=datetime.utcnow, nullable=False)  # When file appeared
    processed_at = Column(DateTime, nullable=True)  # When AI processed it
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    archived_at = Column(DateTime, nullable=True)  # When archived


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
    feedback_type = Column(String(32), nullable=True)  # correction, suggestion, complaint
    submitted_by = Column(String(256), nullable=True)
    
    # NEW: Detailed feedback for model improvement
    was_helpful = Column(Boolean, nullable=True)  # Was the AI helpful overall?
    confidence_was_accurate = Column(Boolean, nullable=True)  # Was confidence score accurate?
    extraction_quality = Column(Integer, nullable=True)  # 1-5 rating of entity extraction
    summary_quality = Column(Integer, nullable=True)  # 1-5 rating of summary
    
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


class FaxRoutingRule(Base):
    """Configurable routing rules based on document characteristics."""
    __tablename__ = "fax_routing_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    priority = Column(Integer, default=0, nullable=False)  # Higher = evaluated first
    
    # Conditions (JSON structure for flexibility)
    conditions = Column(JSON, nullable=False)  # {category: [...], keywords: [...], sender: [...]}
    
    # Actions
    route_to_department = Column(String(128), nullable=True)
    route_to_user = Column(String(256), nullable=True)
    auto_approve = Column(Boolean, default=False, nullable=False)
    add_tags = Column(JSON, nullable=True)
    set_priority = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class FaxTemplate(Base):
    """Templates for common fax types to improve recognition."""
    __tablename__ = "fax_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    category = Column(String(64), nullable=False)
    sub_category = Column(String(64), nullable=True)
    
    # Template patterns
    header_patterns = Column(JSON, nullable=True)  # Common header text patterns
    keyword_patterns = Column(JSON, nullable=True)  # Keywords that identify this template
    sender_patterns = Column(JSON, nullable=True)  # Common senders for this type
    
    # Expected structure
    expected_sections = Column(JSON, nullable=True)  # Expected document sections
    
    # Statistics
    match_count = Column(Integer, default=0, nullable=False)
    accuracy_rate = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class FaxAuditLog(Base):
    """Comprehensive audit trail for compliance."""
    __tablename__ = "fax_audit_log"

    id = Column(Integer, primary_key=True, index=True)
    fax_id = Column(Integer, nullable=False, index=True)
    action = Column(String(64), nullable=False)  # viewed, reviewed, exported, etc.
    performed_by = Column(String(256), nullable=True)
    ip_address = Column(String(64), nullable=True)
    user_agent = Column(String(512), nullable=True)
    details = Column(JSON, nullable=True)  # Additional action details
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
