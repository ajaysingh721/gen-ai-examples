from datetime import datetime
from enum import Enum
from typing import Optional, List

from pydantic import BaseModel, ConfigDict, Field


class FaxStatus(str, Enum):
    """Status of a fax in the processing pipeline."""
    pending = "pending"
    categorized = "categorized"
    approved = "approved"
    overridden = "overridden"
    processed = "processed"


class FaxCategory(str, Enum):
    """Categories for fax documents."""
    discharge_summary = "discharge_summary"
    inpatient_document = "inpatient_document"
    census = "census"
    junk_fax = "junk_fax"


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


class FaxRecord(BaseModel):
    """Schema for fax list items (without full text)."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    status: FaxStatus
    ai_category: Optional[FaxCategory] = None
    ai_confidence: Optional[float] = None
    ai_reason: Optional[str] = None
    final_category: Optional[FaxCategory] = None
    was_overridden: bool = False
    is_urgent: bool = False
    priority_score: int = 0
    text_length: int = 0
    page_count: int = 1
    summary: Optional[str] = None
    received_at: datetime
    processed_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    created_at: datetime


class FaxDetail(FaxRecord):
    """Full fax details including extracted text."""
    raw_text: Optional[str] = None
    original_path: str
    override_reason: Optional[str] = None


class FaxReviewRequest(BaseModel):
    """Request to review/approve/override a fax categorization."""
    action: str = Field(..., pattern="^(approve|override)$")
    category: Optional[FaxCategory] = None  # Required if action is "override"
    reason: Optional[str] = None  # Reason for override
    reviewer: Optional[str] = None  # Username of reviewer


class FaxReviewResponse(BaseModel):
    """Response after reviewing a fax."""
    id: int
    status: FaxStatus
    final_category: FaxCategory
    was_overridden: bool
    message: str


class FaxBatchReviewRequest(BaseModel):
    """Batch review multiple faxes."""
    fax_ids: List[int]
    action: str = Field(..., pattern="^(approve|override)$")
    category: Optional[FaxCategory] = None
    reason: Optional[str] = None
    reviewer: Optional[str] = None


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
    feedback_text: Optional[str] = None
    submitted_by: Optional[str] = None


class FaxFeedbackRecord(BaseModel):
    """Feedback record schema."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    fax_id: int
    ai_category: FaxCategory
    correct_category: FaxCategory
    feedback_text: Optional[str] = None
    submitted_by: Optional[str] = None
    created_at: datetime


# --- Statistics Schemas ---

class FaxStats(BaseModel):
    """Statistics about fax processing."""
    total_faxes: int
    pending: int
    categorized: int  # Awaiting review
    approved: int
    overridden: int
    processed: int
    auto_approved: int  # Auto-approved documents count
    
    # Category breakdown
    category_counts: dict[str, int]
    
    # Accuracy metrics
    total_reviewed: int
    accuracy_rate: float  # Percentage of AI decisions that were approved
    
    # Recent activity
    processed_today: int
    processed_this_week: int


class FaxQueueSummary(BaseModel):
    """Summary of the fax queue for dashboard."""
    pending_review: int
    urgent_count: int
    today_received: int
    today_processed: int
    avg_processing_time_minutes: Optional[float] = None


# --- Settings Schemas ---

class FaxSettingsUpdate(BaseModel):
    """Update fax processing settings."""
    watch_folder: Optional[str] = None
    auto_process: Optional[bool] = None
    require_review: Optional[bool] = None
    confidence_threshold: Optional[float] = Field(None, ge=0.0, le=1.0)


class FaxSettingsResponse(BaseModel):
    """Current fax processing settings."""
    watch_folder: str
    auto_process: bool
    require_review: bool
    confidence_threshold: float


# --- Watcher Status ---

class WatcherStatus(BaseModel):
    """Status of the folder watcher service."""
    is_running: bool
    watch_folder: str
    files_in_queue: int
    last_scan_at: Optional[datetime] = None
    errors: List[str] = []
    currently_processing_file: Optional[str] = None
