"""
Fax processing service - handles categorization, review, and feedback.
"""

import os
import json
import re
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Tuple, List
from io import BytesIO

from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.core.db import SessionLocal
from app.models.fax import Fax, FaxFeedback, FaxSettings, FaxStatus as ModelFaxStatus, FaxCategory as ModelFaxCategory
from app.schemas.fax import (
    FaxRecord, FaxDetail, FaxStatus, FaxCategory, FaxReviewRequest,
    FaxReviewResponse, FaxStats, FaxQueueSummary, FaxFeedbackCreate,
    FaxFeedbackRecord, FaxSettingsResponse
)
from app.services.llm_service import generate_text
from app.services.document_service import extract_text_from_pdf, extract_text_from_tiff


# Default settings
DEFAULT_WATCH_FOLDER = os.environ.get("FAX_WATCH_FOLDER", "./fax_inbox")
DEFAULT_CONFIDENCE_THRESHOLD = 0.7


def get_file_hash(file_path: str) -> str:
    """Calculate MD5 hash of a file to detect duplicates."""
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()


def extract_text_from_file(file_path: str) -> Tuple[str, int]:
    """Extract text from a fax file (PDF or TIFF)."""
    text = ""
    page_count = 1
    
    with open(file_path, "rb") as f:
        if file_path.lower().endswith(".pdf"):
            text = extract_text_from_pdf(f)
            # Try to get page count
            try:
                from pypdf import PdfReader
                f.seek(0)
                reader = PdfReader(f)
                page_count = len(reader.pages)
            except:
                pass
        elif file_path.lower().endswith((".tif", ".tiff")):
            text = extract_text_from_tiff(f)
            # Try to get page count from TIFF
            try:
                from PIL import Image
                f.seek(0)
                img = Image.open(f)
                page_count = getattr(img, 'n_frames', 1)
            except:
                pass
    
    return text, page_count


def categorize_fax(text: str) -> Tuple[FaxCategory, float, str]:
    """
    Use LLM to categorize a fax document.
    Returns (category, confidence, reason).
    """
    if not text or len(text.strip()) < 50:
        return (FaxCategory.unknown, 0.3, "Insufficient text to categorize.")

    snippet = text[:4000]  # Limit text sent to LLM

    prompt = f"""You are a medical office fax categorization assistant. Analyze the following fax document and categorize it into ONE of these categories:

- medical_records: Patient medical records, charts, history
- lab_results: Laboratory test results, blood work, diagnostic tests
- prescriptions: Prescription requests, medication orders, refill requests
- referrals: Patient referrals to specialists or other providers
- insurance: Insurance forms, authorizations, coverage information
- billing: Bills, invoices, payment information
- patient_correspondence: Letters to/from patients, appointment confirmations
- administrative: Office memos, general administrative documents
- urgent: Time-sensitive documents requiring immediate attention
- unknown: Cannot determine category

Also assess your confidence level (0.0 to 1.0) in this categorization.

Return STRICT JSON with exactly these keys:
{{"category": "one_of_the_categories", "confidence": 0.85, "reason": "Brief explanation"}}

Fax Document:
{snippet}
"""

    raw = generate_text(prompt, max_tokens=200).strip()

    # Try to parse JSON response
    category = FaxCategory.unknown
    confidence = 0.5
    reason = "Unable to determine category"

    match = re.search(r"\{.*\}", raw, flags=re.DOTALL)
    if match:
        try:
            payload = json.loads(match.group(0))
            if isinstance(payload, dict):
                cat_str = str(payload.get("category", "")).strip().lower()
                conf = payload.get("confidence", 0.5)
                reason = str(payload.get("reason", "")).strip() or reason

                # Map category string to enum
                category_map = {
                    "medical_records": FaxCategory.medical_records,
                    "lab_results": FaxCategory.lab_results,
                    "prescriptions": FaxCategory.prescriptions,
                    "referrals": FaxCategory.referrals,
                    "insurance": FaxCategory.insurance,
                    "billing": FaxCategory.billing,
                    "patient_correspondence": FaxCategory.patient_correspondence,
                    "administrative": FaxCategory.administrative,
                    "urgent": FaxCategory.urgent,
                    "unknown": FaxCategory.unknown,
                }

                if cat_str in category_map:
                    category = category_map[cat_str]

                if isinstance(conf, (int, float)):
                    confidence = max(0.0, min(1.0, float(conf)))

        except (json.JSONDecodeError, KeyError):
            pass

    return (category, confidence, reason)


def summarize_fax(text: str, max_tokens: int = 200) -> str:
    """Generate a brief summary of the fax content."""
    if not text or len(text.strip()) < 50:
        return "Insufficient text to summarize."

    snippet = text[:3000]

    prompt = f"""Summarize this fax document in 2-3 sentences. Focus on:
- Who sent it / who it's about
- Main purpose or request
- Any urgent items or deadlines

Fax content:
{snippet}

Summary:"""

    return generate_text(prompt, max_tokens=max_tokens)


def detect_urgency(text: str, category: FaxCategory) -> Tuple[bool, int]:
    """
    Detect if a fax is urgent based on content and category.
    Returns (is_urgent, priority_score).
    Priority score: 0-100, higher = more urgent.
    """
    is_urgent = category == FaxCategory.urgent
    priority = 50 if is_urgent else 0

    text_lower = text.lower()

    # Check for urgent keywords
    urgent_keywords = [
        "urgent", "asap", "immediately", "emergency", "stat",
        "critical", "time-sensitive", "rush", "priority"
    ]

    for keyword in urgent_keywords:
        if keyword in text_lower:
            is_urgent = True
            priority = max(priority, 75)
            break

    # Higher priority for certain categories
    if category == FaxCategory.prescriptions:
        priority = max(priority, 60)
    elif category == FaxCategory.referrals:
        priority = max(priority, 55)
    elif category == FaxCategory.lab_results:
        priority = max(priority, 50)

    return (is_urgent, priority)


def process_new_fax(file_path: str, filename: str) -> Optional[FaxRecord]:
    """
    Process a new fax file: extract text, categorize, and save to database.
    """
    db: Session = SessionLocal()
    try:
        # Check for duplicates by file hash
        file_hash = get_file_hash(file_path)
        existing = db.query(Fax).filter(Fax.file_hash == file_hash).first()
        if existing:
            return None  # Duplicate file

        # Extract text
        text, page_count = extract_text_from_file(file_path)

        # Categorize with LLM
        category, confidence, reason = categorize_fax(text)

        # Detect urgency
        is_urgent, priority = detect_urgency(text, category)

        # Generate summary
        summary = summarize_fax(text)

        # Create fax record
        fax = Fax(
            filename=filename,
            original_path=file_path,
            file_hash=file_hash,
            status=FaxStatus.categorized.value,
            ai_category=category.value,
            ai_confidence=confidence,
            ai_reason=reason,
            raw_text=text,
            text_length=len(text),
            summary=summary,
            page_count=page_count,
            is_urgent=is_urgent,
            priority_score=priority,
            received_at=datetime.utcnow(),
            processed_at=datetime.utcnow(),
        )

        db.add(fax)
        db.commit()
        db.refresh(fax)

        return FaxRecord(
            id=fax.id,
            filename=fax.filename,
            status=FaxStatus(fax.status),
            ai_category=FaxCategory(fax.ai_category) if fax.ai_category else None,
            ai_confidence=fax.ai_confidence,
            ai_reason=fax.ai_reason,
            final_category=FaxCategory(fax.final_category) if fax.final_category else None,
            was_overridden=fax.was_overridden,
            is_urgent=fax.is_urgent,
            priority_score=fax.priority_score,
            text_length=fax.text_length,
            page_count=fax.page_count,
            summary=fax.summary,
            received_at=fax.received_at,
            processed_at=fax.processed_at,
            reviewed_at=fax.reviewed_at,
            reviewed_by=fax.reviewed_by,
            created_at=fax.created_at,
        )

    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def list_faxes(
    status: Optional[FaxStatus] = None,
    category: Optional[FaxCategory] = None,
    urgent_only: bool = False,
    limit: int = 50,
    offset: int = 0
) -> List[FaxRecord]:
    """List faxes with optional filtering."""
    db: Session = SessionLocal()
    try:
        query = db.query(Fax)

        if status:
            query = query.filter(Fax.status == status.value)
        if category:
            query = query.filter(
                (Fax.ai_category == category.value) | 
                (Fax.final_category == category.value)
            )
        if urgent_only:
            query = query.filter(Fax.is_urgent == True)

        # Order by priority (urgent first), then by received date
        query = query.order_by(Fax.priority_score.desc(), Fax.received_at.desc())
        query = query.offset(offset).limit(limit)

        faxes = query.all()

        return [
            FaxRecord(
                id=f.id,
                filename=f.filename,
                status=FaxStatus(f.status),
                ai_category=FaxCategory(f.ai_category) if f.ai_category else None,
                ai_confidence=f.ai_confidence,
                ai_reason=f.ai_reason,
                final_category=FaxCategory(f.final_category) if f.final_category else None,
                was_overridden=f.was_overridden,
                is_urgent=f.is_urgent,
                priority_score=f.priority_score,
                text_length=f.text_length,
                page_count=f.page_count,
                summary=f.summary,
                received_at=f.received_at,
                processed_at=f.processed_at,
                reviewed_at=f.reviewed_at,
                reviewed_by=f.reviewed_by,
                created_at=f.created_at,
            )
            for f in faxes
        ]
    finally:
        db.close()


def get_fax_detail(fax_id: int) -> Optional[FaxDetail]:
    """Get full details of a fax including extracted text."""
    db: Session = SessionLocal()
    try:
        fax = db.query(Fax).filter(Fax.id == fax_id).first()
        if not fax:
            return None

        return FaxDetail(
            id=fax.id,
            filename=fax.filename,
            original_path=fax.original_path,
            status=FaxStatus(fax.status),
            ai_category=FaxCategory(fax.ai_category) if fax.ai_category else None,
            ai_confidence=fax.ai_confidence,
            ai_reason=fax.ai_reason,
            final_category=FaxCategory(fax.final_category) if fax.final_category else None,
            was_overridden=fax.was_overridden,
            override_reason=fax.override_reason,
            is_urgent=fax.is_urgent,
            priority_score=fax.priority_score,
            text_length=fax.text_length,
            page_count=fax.page_count,
            summary=fax.summary,
            raw_text=fax.raw_text,
            received_at=fax.received_at,
            processed_at=fax.processed_at,
            reviewed_at=fax.reviewed_at,
            reviewed_by=fax.reviewed_by,
            created_at=fax.created_at,
        )
    finally:
        db.close()


def review_fax(fax_id: int, request: FaxReviewRequest) -> Optional[FaxReviewResponse]:
    """Review/approve/override a fax categorization."""
    db: Session = SessionLocal()
    try:
        fax = db.query(Fax).filter(Fax.id == fax_id).first()
        if not fax:
            return None

        now = datetime.utcnow()

        if request.action == "approve":
            # Accept AI decision
            fax.status = FaxStatus.approved.value
            fax.final_category = fax.ai_category
            fax.was_overridden = False
            message = "AI categorization approved."
        else:  # override
            if not request.category:
                raise ValueError("Category is required for override action")
            
            # Record feedback for learning
            feedback = FaxFeedback(
                fax_id=fax_id,
                ai_category=fax.ai_category,
                correct_category=request.category.value,
                feedback_text=request.reason,
                submitted_by=request.reviewer,
            )
            db.add(feedback)

            # Override with user's choice
            fax.status = FaxStatus.overridden.value
            fax.final_category = request.category.value
            fax.was_overridden = True
            fax.override_reason = request.reason
            message = f"Category overridden to {request.category.value}."

        fax.reviewed_by = request.reviewer
        fax.reviewed_at = now
        fax.updated_at = now

        db.commit()
        db.refresh(fax)

        return FaxReviewResponse(
            id=fax.id,
            status=FaxStatus(fax.status),
            final_category=FaxCategory(fax.final_category),
            was_overridden=fax.was_overridden,
            message=message,
        )

    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def batch_review_faxes(
    fax_ids: List[int],
    action: str,
    category: Optional[FaxCategory] = None,
    reason: Optional[str] = None,
    reviewer: Optional[str] = None
) -> Tuple[int, int]:
    """Batch review multiple faxes. Returns (processed_count, failed_count)."""
    processed = 0
    failed = 0

    for fax_id in fax_ids:
        try:
            request = FaxReviewRequest(
                action=action,
                category=category,
                reason=reason,
                reviewer=reviewer,
            )
            result = review_fax(fax_id, request)
            if result:
                processed += 1
            else:
                failed += 1
        except Exception:
            failed += 1

    return (processed, failed)


def mark_fax_processed(fax_id: int) -> bool:
    """Mark a fax as fully processed (filed away)."""
    db: Session = SessionLocal()
    try:
        fax = db.query(Fax).filter(Fax.id == fax_id).first()
        if not fax:
            return False

        fax.status = FaxStatus.processed.value
        fax.updated_at = datetime.utcnow()
        db.commit()
        return True
    finally:
        db.close()


def get_fax_stats() -> FaxStats:
    """Get statistics about fax processing."""
    db: Session = SessionLocal()
    try:
        total = db.query(func.count(Fax.id)).scalar() or 0

        # Status counts
        status_counts = dict(
            db.query(Fax.status, func.count(Fax.id))
            .group_by(Fax.status)
            .all()
        )

        pending = status_counts.get(FaxStatus.pending.value, 0)
        categorized = status_counts.get(FaxStatus.categorized.value, 0)
        approved = status_counts.get(FaxStatus.approved.value, 0)
        overridden = status_counts.get(FaxStatus.overridden.value, 0)
        processed = status_counts.get(FaxStatus.processed.value, 0)

        # Category counts (using final_category where available)
        category_counts = {}
        cat_results = db.query(
            func.coalesce(Fax.final_category, Fax.ai_category),
            func.count(Fax.id)
        ).group_by(func.coalesce(Fax.final_category, Fax.ai_category)).all()
        
        for cat, count in cat_results:
            if cat:
                category_counts[cat] = count

        # Accuracy metrics
        total_reviewed = approved + overridden
        accuracy_rate = (approved / total_reviewed * 100) if total_reviewed > 0 else 0.0

        # Recent activity
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)

        processed_today = db.query(func.count(Fax.id)).filter(
            Fax.reviewed_at >= today_start
        ).scalar() or 0

        processed_this_week = db.query(func.count(Fax.id)).filter(
            Fax.reviewed_at >= week_start
        ).scalar() or 0

        return FaxStats(
            total_faxes=total,
            pending=pending,
            categorized=categorized,
            approved=approved,
            overridden=overridden,
            processed=processed,
            category_counts=category_counts,
            total_reviewed=total_reviewed,
            accuracy_rate=accuracy_rate,
            processed_today=processed_today,
            processed_this_week=processed_this_week,
        )

    finally:
        db.close()


def get_queue_summary() -> FaxQueueSummary:
    """Get a summary of the fax queue for dashboard."""
    db: Session = SessionLocal()
    try:
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        pending_review = db.query(func.count(Fax.id)).filter(
            Fax.status == FaxStatus.categorized.value
        ).scalar() or 0

        urgent_count = db.query(func.count(Fax.id)).filter(
            and_(
                Fax.status == FaxStatus.categorized.value,
                Fax.is_urgent == True
            )
        ).scalar() or 0

        today_received = db.query(func.count(Fax.id)).filter(
            Fax.received_at >= today_start
        ).scalar() or 0

        today_processed = db.query(func.count(Fax.id)).filter(
            Fax.reviewed_at >= today_start
        ).scalar() or 0

        # Calculate average processing time
        avg_time = None
        reviewed_faxes = db.query(
            func.avg(
                func.julianday(Fax.reviewed_at) - func.julianday(Fax.received_at)
            )
        ).filter(
            Fax.reviewed_at.isnot(None)
        ).scalar()

        if reviewed_faxes:
            avg_time = reviewed_faxes * 24 * 60  # Convert days to minutes

        return FaxQueueSummary(
            pending_review=pending_review,
            urgent_count=urgent_count,
            today_received=today_received,
            today_processed=today_processed,
            avg_processing_time_minutes=avg_time,
        )

    finally:
        db.close()


def submit_feedback(feedback: FaxFeedbackCreate) -> FaxFeedbackRecord:
    """Submit feedback about a categorization (for learning)."""
    db: Session = SessionLocal()
    try:
        fax = db.query(Fax).filter(Fax.id == feedback.fax_id).first()
        if not fax:
            raise ValueError(f"Fax with id {feedback.fax_id} not found")

        record = FaxFeedback(
            fax_id=feedback.fax_id,
            ai_category=fax.ai_category or "unknown",
            correct_category=feedback.correct_category.value,
            feedback_text=feedback.feedback_text,
            submitted_by=feedback.submitted_by,
        )

        db.add(record)
        db.commit()
        db.refresh(record)

        return FaxFeedbackRecord(
            id=record.id,
            fax_id=record.fax_id,
            ai_category=FaxCategory(record.ai_category),
            correct_category=FaxCategory(record.correct_category),
            feedback_text=record.feedback_text,
            submitted_by=record.submitted_by,
            created_at=record.created_at,
        )

    finally:
        db.close()


def get_settings() -> FaxSettingsResponse:
    """Get current fax processing settings."""
    db: Session = SessionLocal()
    try:
        settings = {
            "watch_folder": DEFAULT_WATCH_FOLDER,
            "auto_process": True,
            "require_review": True,
            "confidence_threshold": DEFAULT_CONFIDENCE_THRESHOLD,
        }

        db_settings = db.query(FaxSettings).all()
        for s in db_settings:
            if s.key == "watch_folder":
                settings["watch_folder"] = s.value or DEFAULT_WATCH_FOLDER
            elif s.key == "auto_process":
                settings["auto_process"] = s.value == "true"
            elif s.key == "require_review":
                settings["require_review"] = s.value == "true"
            elif s.key == "confidence_threshold":
                try:
                    settings["confidence_threshold"] = float(s.value)
                except (ValueError, TypeError):
                    pass

        return FaxSettingsResponse(**settings)
    finally:
        db.close()


def update_settings(updates: dict) -> FaxSettingsResponse:
    """Update fax processing settings."""
    db: Session = SessionLocal()
    try:
        for key, value in updates.items():
            if value is not None:
                existing = db.query(FaxSettings).filter(FaxSettings.key == key).first()
                str_value = str(value).lower() if isinstance(value, bool) else str(value)
                
                if existing:
                    existing.value = str_value
                    existing.updated_at = datetime.utcnow()
                else:
                    db.add(FaxSettings(key=key, value=str_value))
        
        db.commit()
        return get_settings()
    finally:
        db.close()


def delete_fax(fax_id: int) -> bool:
    """Delete a fax record."""
    db: Session = SessionLocal()
    try:
        fax = db.query(Fax).filter(Fax.id == fax_id).first()
        if not fax:
            return False
        
        # Also delete related feedback
        db.query(FaxFeedback).filter(FaxFeedback.fax_id == fax_id).delete()
        db.delete(fax)
        db.commit()
        return True
    finally:
        db.close()
