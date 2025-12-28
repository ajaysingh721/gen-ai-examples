from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, ConfigDict, Field


class FaxStatus(str, Enum):
    """Status of a fax in the processing pipeline."""
    pending = "pending"
    categorized = "categorized"
    approved = "approved"
    overridden = "overridden"
    processed = "processed"
    flagged = "flagged"
    archived = "archived"


class FaxCategory(str, Enum):
    """Categories for fax documents."""
    discharge_summary = "discharge_summary"
    inpatient_document = "inpatient_document"
    census = "census"
    junk_fax = "junk_fax"
    lab_results = "lab_results"
    prescription_refill = "prescription_refill"
    referral = "referral"
    insurance_auth = "insurance_auth"
    medical_records_request = "medical_records_request"
    prior_authorization = "prior_authorization"
    appointment_related = "appointment_related"
    billing_inquiry = "billing_inquiry"
    other_clinical = "other_clinical"


class FaxSubCategory(str, Enum):
    """Sub-categories for more granular classification."""
    discharge_instructions = "discharge_instructions"
    discharge_medications = "discharge_medications"
    discharge_follow_up = "discharge_follow_up"
    progress_note = "progress_note"
    h_and_p = "h_and_p"
    consultation = "consultation"
    operative_note = "operative_note"
    blood_work = "blood_work"
    imaging = "imaging"
    pathology = "pathology"
    unspecified = "unspecified"


class QualityScore(str, Enum):
    """Document quality assessment."""
    excellent = "excellent"
    good = "good"
    fair = "fair"
    poor = "poor"
    illegible = "illegible"


class SentimentType(str, Enum):
    """Sentiment/tone detected in the fax."""
    neutral = "neutral"
    urgent = "urgent"
    routine = "routine"
    critical = "critical"
    informational = "informational"


# --- Entity Extraction Schemas ---

class ExtractedEntity(BaseModel):
    """An extracted named entity from the document."""
    entity_type: str  # patient, doctor, facility, medication, diagnosis, etc.
    value: str
    confidence: float
    source_text: Optional[str] = None  # Original text snippet


class ExtractedDate(BaseModel):
    """An extracted date from the document."""
    date_type: str  # admission, discharge, follow_up, appointment, etc.
    date_value: str
    is_deadline: bool = False
    context: Optional[str] = None


class ActionItem(BaseModel):
    """An action item extracted from the document."""
    action: str
    priority: str = "normal"  # low, normal, high, urgent
    due_date: Optional[str] = None
    assigned_to: Optional[str] = None
    completed: bool = False


class AlternativeCategory(BaseModel):
    """Alternative category prediction."""
    category: FaxCategory
    confidence: float
    reason: str


# --- Request/Response Schemas ---

class FaxBase(BaseModel):
    """Base fax schema with common fields."""
    filename: str
    status: FaxStatus = FaxStatus.pending
    ai_category: Optional[FaxCategory] = None
    ai_confidence: Optional[float] = None
    ai_reason: Optional[str] = None
    final_category: Optional[FaxCategory] = None
    is_urgent: bool = False


class FaxCreate(BaseModel):
    """Schema for creating a new fax record."""
    filename: str
    original_path: str
    file_hash: Optional[str] = None
    file_size_bytes: Optional[int] = None


class FaxRecord(BaseModel):
    """Schema for fax list items (without full text)."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    status: FaxStatus
    ai_category: Optional[FaxCategory] = None
    ai_confidence: Optional[float] = None
    ai_reason: Optional[str] = None
    ai_sub_category: Optional[FaxSubCategory] = None
    final_category: Optional[FaxCategory] = None
    final_sub_category: Optional[FaxSubCategory] = None
    was_overridden: bool = False
    is_urgent: bool = False
    priority_score: int = 0
    text_length: int = 0
    page_count: int = 1
    summary: Optional[str] = None
    
    # New fields
    quality_score: Optional[QualityScore] = None
    sentiment: Optional[SentimentType] = None
    detected_patient_name: Optional[str] = None
    detected_sender_facility: Optional[str] = None
    suggested_department: Optional[str] = None
    contains_phi: bool = False
    detected_language: str = "en"
    is_duplicate: bool = False
    tags: Optional[List[str]] = None
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None
    escalated: bool = False
    
    received_at: datetime
    processed_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    created_at: datetime


class FaxDetail(FaxRecord):
    """Full fax details including extracted text and all AI analysis."""
    raw_text: Optional[str] = None
    original_path: str
    override_reason: Optional[str] = None
    urgency_reason: Optional[str] = None
    
    # AI extraction results
    extracted_entities: Optional[List[ExtractedEntity]] = None
    key_dates: Optional[List[ExtractedDate]] = None
    action_items: Optional[List[ActionItem]] = None
    keywords: Optional[List[str]] = None
    alternative_categories: Optional[List[AlternativeCategory]] = None
    
    # Patient/Sender details
    detected_patient_dob: Optional[str] = None
    detected_patient_mrn: Optional[str] = None
    detected_sender_name: Optional[str] = None
    detected_sender_fax: Optional[str] = None
    
    # Quality details
    quality_issues: Optional[List[str]] = None
    ocr_confidence: Optional[float] = None
    tone_indicators: Optional[List[str]] = None
    
    # Duplicate info
    similar_fax_ids: Optional[List[int]] = None
    duplicate_of_id: Optional[int] = None
    
    # Routing
    suggested_recipient: Optional[str] = None
    routing_confidence: Optional[float] = None
    
    # Compliance
    phi_types_detected: Optional[List[str]] = None
    requires_encryption: bool = False
    needs_translation: bool = False
    
    # Processing info
    processing_time_ms: Optional[int] = None
    internal_notes: Optional[str] = None


class FaxReviewRequest(BaseModel):
    """Request to review/approve/override a fax categorization."""
    action: str = Field(..., pattern="^(approve|override|flag|escalate|assign)$")
    category: Optional[FaxCategory] = None  # Required if action is "override"
    sub_category: Optional[FaxSubCategory] = None
    reason: Optional[str] = None  # Reason for override/flag/escalate
    reviewer: Optional[str] = None  # Username of reviewer
    assign_to: Optional[str] = None  # For assign action
    tags: Optional[List[str]] = None  # Tags to add
    notes: Optional[str] = None  # Internal notes


class FaxReviewResponse(BaseModel):
    """Response after reviewing a fax."""
    id: int
    status: FaxStatus
    final_category: Optional[FaxCategory] = None
    was_overridden: bool
    message: str


class FaxBatchReviewRequest(BaseModel):
    """Batch review multiple faxes."""
    fax_ids: List[int]
    action: str = Field(..., pattern="^(approve|override|flag|archive|assign)$")
    category: Optional[FaxCategory] = None
    reason: Optional[str] = None
    reviewer: Optional[str] = None
    assign_to: Optional[str] = None
    tags: Optional[List[str]] = None


class FaxBatchReviewResponse(BaseModel):
    """Response after batch reviewing faxes."""
    processed: int
    failed: int
    message: str


# --- Feedback Schemas ---

class FaxFeedbackCreate(BaseModel):
    """Submit feedback about a categorization."""
    fax_id: int
    correct_category: FaxCategory
    correct_sub_category: Optional[FaxSubCategory] = None
    feedback_text: Optional[str] = None
    feedback_type: Optional[str] = None  # correction, suggestion, complaint
    submitted_by: Optional[str] = None
    was_helpful: Optional[bool] = None
    confidence_was_accurate: Optional[bool] = None
    extraction_quality: Optional[int] = Field(None, ge=1, le=5)
    summary_quality: Optional[int] = Field(None, ge=1, le=5)


class FaxFeedbackRecord(BaseModel):
    """Feedback record schema."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    fax_id: int
    ai_category: FaxCategory
    correct_category: FaxCategory
    feedback_text: Optional[str] = None
    feedback_type: Optional[str] = None
    submitted_by: Optional[str] = None
    was_helpful: Optional[bool] = None
    created_at: datetime


# --- Statistics Schemas ---

class CategoryAccuracy(BaseModel):
    """Accuracy metrics for a specific category."""
    category: str
    total_predictions: int
    correct_predictions: int
    accuracy_rate: float
    avg_confidence: float
    override_rate: float


class FaxStats(BaseModel):
    """Statistics about fax processing."""
    total_faxes: int
    pending: int
    categorized: int  # Awaiting review
    approved: int
    overridden: int
    processed: int
    flagged: int
    archived: int
    auto_approved: int  # Auto-approved documents count
    
    # Category breakdown
    category_counts: Dict[str, int]
    
    # Accuracy metrics
    total_reviewed: int
    accuracy_rate: float  # Percentage of AI decisions that were approved
    category_accuracy: Optional[List[CategoryAccuracy]] = None
    
    # Recent activity
    processed_today: int
    processed_this_week: int
    
    # NEW: Performance metrics
    avg_processing_time_ms: Optional[float] = None
    avg_confidence_score: Optional[float] = None
    high_confidence_rate: Optional[float] = None  # % above threshold
    duplicate_detected_count: int = 0
    urgent_count: int = 0
    
    # NEW: Quality metrics
    quality_distribution: Optional[Dict[str, int]] = None  # excellent: 10, good: 20, etc.
    phi_detected_count: int = 0
    needs_translation_count: int = 0


class FaxQueueSummary(BaseModel):
    """Summary of the fax queue for dashboard."""
    pending_review: int
    urgent_count: int
    today_received: int
    today_processed: int
    avg_processing_time_minutes: Optional[float] = None
    
    # NEW: Enhanced dashboard metrics
    flagged_count: int = 0
    escalated_count: int = 0
    overdue_count: int = 0  # Past due date
    assigned_to_me: int = 0  # For user-specific view
    high_priority_count: int = 0
    low_quality_count: int = 0  # Documents with poor/illegible quality
    
    # Category distribution for quick view
    category_pending: Optional[Dict[str, int]] = None


# --- Settings Schemas ---

class FaxSettingsUpdate(BaseModel):
    """Update fax processing settings."""
    watch_folder: Optional[str] = None
    auto_process: Optional[bool] = None
    require_review: Optional[bool] = None
    confidence_threshold: Optional[float] = Field(None, ge=0.0, le=1.0)
    
    # NEW: Additional settings
    enable_duplicate_detection: Optional[bool] = None
    duplicate_similarity_threshold: Optional[float] = Field(None, ge=0.0, le=1.0)
    enable_phi_detection: Optional[bool] = None
    enable_entity_extraction: Optional[bool] = None
    enable_sentiment_analysis: Optional[bool] = None
    enable_quality_scoring: Optional[bool] = None
    enable_routing_suggestions: Optional[bool] = None
    default_language: Optional[str] = None
    sla_hours: Optional[int] = Field(None, ge=1, le=168)  # SLA in hours (1-168)
    auto_escalate_after_hours: Optional[int] = None
    auto_archive_after_days: Optional[int] = None
    max_retry_count: Optional[int] = Field(None, ge=0, le=5)


class FaxSettingsResponse(BaseModel):
    """Current fax processing settings."""
    watch_folder: str
    auto_process: bool
    require_review: bool
    confidence_threshold: float
    
    # NEW: Additional settings
    enable_duplicate_detection: bool = True
    duplicate_similarity_threshold: float = 0.85
    enable_phi_detection: bool = True
    enable_entity_extraction: bool = True
    enable_sentiment_analysis: bool = True
    enable_quality_scoring: bool = True
    enable_routing_suggestions: bool = True
    default_language: str = "en"
    sla_hours: int = 24
    auto_escalate_after_hours: Optional[int] = 48
    auto_archive_after_days: int = 90
    max_retry_count: int = 3


# --- Watcher Status ---

class WatcherStatus(BaseModel):
    """Status of the folder watcher service."""
    is_running: bool
    watch_folder: str
    files_in_queue: int
    last_scan_at: Optional[datetime] = None
    errors: List[str] = []
    currently_processing_file: Optional[str] = None
    
    # NEW: Enhanced watcher metrics
    total_processed_today: int = 0
    total_failed_today: int = 0
    avg_file_size_kb: Optional[float] = None
    supported_formats: List[str] = ["pdf", "tif", "tiff"]


# --- Routing Rules ---

class RoutingCondition(BaseModel):
    """A single routing condition."""
    field: str  # category, sender, keywords, priority, etc.
    operator: str  # equals, contains, greater_than, etc.
    value: Any


class FaxRoutingRuleCreate(BaseModel):
    """Create a new routing rule."""
    name: str
    description: Optional[str] = None
    is_active: bool = True
    priority: int = 0
    conditions: List[RoutingCondition]
    route_to_department: Optional[str] = None
    route_to_user: Optional[str] = None
    auto_approve: bool = False
    add_tags: Optional[List[str]] = None
    set_priority: Optional[int] = None


class FaxRoutingRuleResponse(FaxRoutingRuleCreate):
    """Routing rule response."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime


# --- Search/Filter Schemas ---

class FaxSearchRequest(BaseModel):
    """Advanced search request."""
    query: Optional[str] = None  # Full-text search
    categories: Optional[List[FaxCategory]] = None
    statuses: Optional[List[FaxStatus]] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    is_urgent: Optional[bool] = None
    assigned_to: Optional[str] = None
    has_phi: Optional[bool] = None
    quality_scores: Optional[List[QualityScore]] = None
    min_confidence: Optional[float] = None
    max_confidence: Optional[float] = None
    tags: Optional[List[str]] = None
    sender_facility: Optional[str] = None
    patient_name: Optional[str] = None
    include_archived: bool = False
    sort_by: str = "received_at"
    sort_order: str = "desc"
    limit: int = 50
    offset: int = 0


class FaxSearchResponse(BaseModel):
    """Search results."""
    total: int
    results: List[FaxRecord]
    facets: Optional[Dict[str, Dict[str, int]]] = None  # Aggregations for filtering


# --- Export Schemas ---

class FaxExportRequest(BaseModel):
    """Request to export faxes."""
    fax_ids: Optional[List[int]] = None  # Specific IDs, or use filters below
    categories: Optional[List[FaxCategory]] = None
    statuses: Optional[List[FaxStatus]] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    format: str = "csv"  # csv, xlsx, pdf
    include_text: bool = False
    include_summary: bool = True


class FaxExportResponse(BaseModel):
    """Export result."""
    download_url: str
    filename: str
    record_count: int
    expires_at: datetime


# --- Audit Log ---

class FaxAuditLogEntry(BaseModel):
    """Audit log entry."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    fax_id: int
    action: str
    performed_by: Optional[str] = None
    ip_address: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    created_at: datetime


# --- Analytics Schemas ---

class TimeSeriesDataPoint(BaseModel):
    """A single data point in a time series."""
    timestamp: datetime
    value: float
    label: Optional[str] = None


class FaxAnalytics(BaseModel):
    """Analytics data for dashboards."""
    # Volume trends
    daily_volume: List[TimeSeriesDataPoint]
    category_distribution: Dict[str, int]
    
    # Performance trends
    accuracy_trend: List[TimeSeriesDataPoint]
    processing_time_trend: List[TimeSeriesDataPoint]
    
    # Top metrics
    top_senders: List[Dict[str, Any]]
    top_categories: List[Dict[str, Any]]
    
    # Anomalies
    unusual_patterns: Optional[List[str]] = None
    
    # Predictions (ML-based)
    predicted_volume_next_week: Optional[int] = None
    predicted_urgent_rate: Optional[float] = None
