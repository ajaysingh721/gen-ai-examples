"""
API routes for fax processing system.
"""

from typing import Optional
from fastapi import APIRouter, File, HTTPException, Query, UploadFile
import os
import tempfile
import shutil

from app.schemas.fax import (
    FaxRecord, FaxDetail, FaxStatus, FaxCategory,
    FaxReviewRequest, FaxReviewResponse,
    FaxBatchReviewRequest, FaxBatchReviewResponse,
    FaxFeedbackCreate, FaxFeedbackRecord,
    FaxStats, FaxQueueSummary,
    FaxSettingsUpdate, FaxSettingsResponse,
    WatcherStatus
)
from app.services import fax_service
from app.services.folder_watcher import get_watcher, start_watcher, stop_watcher

router = APIRouter(prefix="/api/v1/faxes", tags=["faxes"])


# --- Queue & List Endpoints ---

@router.get("/", response_model=list[FaxRecord])
async def list_faxes(
    status: Optional[FaxStatus] = None,
    category: Optional[FaxCategory] = None,
    urgent_only: bool = False,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
) -> list[FaxRecord]:
    """
    List faxes with optional filtering.
    
    - **status**: Filter by processing status
    - **category**: Filter by category (AI or final)
    - **urgent_only**: Show only urgent faxes
    - **limit**: Maximum number of results
    - **offset**: Number of results to skip
    """
    return fax_service.list_faxes(
        status=status,
        category=category,
        urgent_only=urgent_only,
        limit=limit,
        offset=offset
    )


# --- Categories Info ---

@router.get("/categories", response_model=list[dict])
async def list_categories() -> list[dict]:
    """List all available fax categories with descriptions."""
    return [
        {"value": "discharge_summary", "label": "Discharge Summary", "description": "Patient discharge summaries from hospital stays"},
        {"value": "inpatient_document", "label": "Inpatient Document", "description": "Inpatient progress notes, H&P, consults, and other in-hospital documentation"},
        {"value": "census", "label": "Census", "description": "Patient census lists with bed numbers, units, or service names"},
        {"value": "junk_fax", "label": "Junk Fax", "description": "Non-clinical documents, scanning errors, or spam faxes"},
    ]


@router.get("/queue", response_model=list[FaxRecord])
async def get_review_queue(limit: int = Query(50, ge=1, le=200)) -> list[FaxRecord]:
    """Get faxes that are awaiting review (categorized but not yet approved)."""
    return fax_service.list_faxes(status=FaxStatus.categorized, limit=limit)


@router.get("/stats", response_model=FaxStats)
async def get_stats() -> FaxStats:
    """Get statistics about fax processing."""
    return fax_service.get_fax_stats()


@router.get("/summary", response_model=FaxQueueSummary)
async def get_queue_summary() -> FaxQueueSummary:
    """Get a summary of the fax queue for dashboard."""
    return fax_service.get_queue_summary()


# --- Single Fax Endpoints ---

@router.get("/{fax_id}", response_model=FaxDetail)
async def get_fax(fax_id: int) -> FaxDetail:
    """Get full details of a specific fax."""
    fax = fax_service.get_fax_detail(fax_id)
    if not fax:
        raise HTTPException(status_code=404, detail="Fax not found")
    return fax


@router.post("/{fax_id}/review", response_model=FaxReviewResponse)
async def review_fax(fax_id: int, request: FaxReviewRequest) -> FaxReviewResponse:
    """
    Review a fax categorization - approve or override.
    
    - **action**: "approve" to accept AI decision, "override" to change category
    - **category**: Required if action is "override"
    - **reason**: Optional reason for the decision
    - **reviewer**: Optional username of reviewer
    """
    if request.action == "override" and not request.category:
        raise HTTPException(
            status_code=400,
            detail="Category is required when overriding"
        )
    
    result = fax_service.review_fax(fax_id, request)
    if not result:
        raise HTTPException(status_code=404, detail="Fax not found")
    return result


@router.post("/{fax_id}/process", response_model=dict)
async def mark_processed(fax_id: int) -> dict:
    """Mark a fax as fully processed (filed away)."""
    success = fax_service.mark_fax_processed(fax_id)
    if not success:
        raise HTTPException(status_code=404, detail="Fax not found")
    return {"success": True, "message": "Fax marked as processed"}


@router.delete("/{fax_id}")
async def delete_fax(fax_id: int) -> dict:
    """Delete a fax record."""
    success = fax_service.delete_fax(fax_id)
    if not success:
        raise HTTPException(status_code=404, detail="Fax not found")
    return {"success": True, "message": "Fax deleted"}


# --- Batch Operations ---

@router.post("/batch/review", response_model=FaxBatchReviewResponse)
async def batch_review(request: FaxBatchReviewRequest) -> FaxBatchReviewResponse:
    """
    Batch review multiple faxes at once.
    
    Useful for approving multiple faxes with the same category,
    or overriding multiple faxes to a specific category.
    """
    if request.action == "override" and not request.category:
        raise HTTPException(
            status_code=400,
            detail="Category is required when overriding"
        )
    
    processed, failed = fax_service.batch_review_faxes(
        fax_ids=request.fax_ids,
        action=request.action,
        category=request.category,
        reason=request.reason,
        reviewer=request.reviewer
    )
    
    return FaxBatchReviewResponse(
        processed=processed,
        failed=failed,
        message=f"Processed {processed} faxes, {failed} failed"
    )


@router.post("/batch/approve", response_model=FaxBatchReviewResponse)
async def batch_approve(fax_ids: list[int], reviewer: Optional[str] = None) -> FaxBatchReviewResponse:
    """Batch approve multiple faxes (accept AI decisions)."""
    processed, failed = fax_service.batch_review_faxes(
        fax_ids=fax_ids,
        action="approve",
        reviewer=reviewer
    )
    
    return FaxBatchReviewResponse(
        processed=processed,
        failed=failed,
        message=f"Approved {processed} faxes, {failed} failed"
    )


# --- Upload Endpoint (Manual) ---

@router.post("/upload", response_model=FaxRecord)
async def upload_fax(file: UploadFile = File(...)) -> FaxRecord:
    """
    Manually upload a fax file for processing.
    
    This is an alternative to the automatic folder watcher.
    The fax will be categorized by AI and added to the review queue.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")
    
    filename = file.filename.lower()
    if not (filename.endswith(".pdf") or filename.endswith(".tif") or filename.endswith(".tiff")):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a PDF or TIFF file."
        )
    
    # Save to temp file
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
        
        # Process the fax
        result = fax_service.process_new_fax(tmp_path, file.filename)
        
        if not result:
            raise HTTPException(
                status_code=400,
                detail="File appears to be a duplicate (already processed)"
            )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up temp file
        try:
            os.unlink(tmp_path)
        except:
            pass


# --- Feedback Endpoints ---

@router.post("/feedback", response_model=FaxFeedbackRecord)
async def submit_feedback(feedback: FaxFeedbackCreate) -> FaxFeedbackRecord:
    """
    Submit feedback about a categorization.
    
    This helps improve the AI categorization over time by
    recording what the correct category should have been.
    """
    try:
        return fax_service.submit_feedback(feedback)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# --- Watcher Endpoints ---

@router.get("/watcher/status", response_model=WatcherStatus)
async def get_watcher_status() -> WatcherStatus:
    """Get the status of the folder watcher service."""
    watcher = get_watcher()
    state = watcher.state
    
    return WatcherStatus(
        is_running=state.is_running,
        watch_folder=state.watch_folder,
        files_in_queue=state.files_in_queue,
        last_scan_at=state.last_scan_at,
        errors=state.errors,
        currently_processing_file=state.currently_processing_file
    )


@router.post("/watcher/start", response_model=WatcherStatus)
async def start_folder_watcher(watch_folder: Optional[str] = None) -> WatcherStatus:
    """Start the folder watcher service."""
    watcher = start_watcher(watch_folder)
    state = watcher.state
    
    return WatcherStatus(
        is_running=state.is_running,
        watch_folder=state.watch_folder,
        files_in_queue=state.files_in_queue,
        last_scan_at=state.last_scan_at,
        errors=state.errors,
        currently_processing_file=state.currently_processing_file
    )


@router.post("/watcher/stop", response_model=WatcherStatus)
async def stop_folder_watcher() -> WatcherStatus:
    """Stop the folder watcher service."""
    stop_watcher()
    watcher = get_watcher()
    state = watcher.state
    
    return WatcherStatus(
        is_running=state.is_running,
        watch_folder=state.watch_folder,
        files_in_queue=state.files_in_queue,
        last_scan_at=state.last_scan_at,
        errors=state.errors,
        currently_processing_file=state.currently_processing_file
    )


@router.post("/watcher/scan", response_model=dict)
async def trigger_scan() -> dict:
    """Trigger an immediate scan of the watch folder."""
    watcher = get_watcher()
    watcher.manual_scan()
    return {"success": True, "message": "Scan triggered"}


# --- Settings Endpoints ---

@router.get("/settings", response_model=FaxSettingsResponse)
async def get_settings() -> FaxSettingsResponse:
    """Get current fax processing settings."""
    return fax_service.get_settings()


@router.put("/settings", response_model=FaxSettingsResponse)
async def update_settings(settings: FaxSettingsUpdate) -> FaxSettingsResponse:
    """Update fax processing settings."""
    updates = settings.model_dump(exclude_none=True)
    return fax_service.update_settings(updates)



