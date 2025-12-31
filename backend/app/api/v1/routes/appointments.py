"""
API routes for appointment scheduling and management.
"""

from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Query

from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentRecord,
    AppointmentDetail,
    AppointmentReschedule,
    AppointmentCancel,
    AppointmentCheckIn,
    AppointmentStats,
    AppointmentStatus,
    AppointmentType,
    DailySchedule,
    AIAppointmentSuggestion
)
from app.services import appointment_service

router = APIRouter(prefix="/api/v1/appointments", tags=["appointments"])


# --- List & Search Endpoints ---

@router.get("/", response_model=List[AppointmentRecord])
async def list_appointments(
    status: Optional[AppointmentStatus] = None,
    appointment_type: Optional[AppointmentType] = None,
    provider_id: Optional[str] = None,
    patient_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
) -> List[AppointmentRecord]:
    """
    List appointments with optional filtering.
    
    - **status**: Filter by appointment status
    - **appointment_type**: Filter by type (follow_up, new_patient, etc.)
    - **provider_id**: Filter by provider
    - **patient_id**: Filter by patient
    - **start_date**: Filter appointments starting after this date
    - **end_date**: Filter appointments starting before this date
    - **limit**: Maximum number of results
    - **offset**: Number of results to skip
    """
    return appointment_service.list_appointments(
        status=status,
        appointment_type=appointment_type,
        provider_id=provider_id,
        patient_id=patient_id,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset
    )


@router.get("/search", response_model=List[AppointmentRecord])
async def search_appointments(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(20, ge=1, le=100)
) -> List[AppointmentRecord]:
    """Search appointments by patient name, provider, or reason for visit."""
    return appointment_service.search_appointments(q, limit)


@router.get("/today", response_model=List[AppointmentRecord])
async def get_todays_appointments(
    provider_id: Optional[str] = None
) -> List[AppointmentRecord]:
    """Get all appointments scheduled for today."""
    return appointment_service.get_todays_appointments(provider_id)


@router.get("/upcoming", response_model=List[AppointmentRecord])
async def get_upcoming_appointments(
    hours: int = Query(24, ge=1, le=168, description="Hours to look ahead"),
    provider_id: Optional[str] = None
) -> List[AppointmentRecord]:
    """Get upcoming appointments within the specified hours."""
    return appointment_service.get_upcoming_appointments(hours, provider_id)


# --- Statistics & Schedule ---

@router.get("/stats", response_model=AppointmentStats)
async def get_stats() -> AppointmentStats:
    """Get appointment statistics and analytics."""
    return appointment_service.get_appointment_stats()


@router.get("/schedule/{date}", response_model=DailySchedule)
async def get_daily_schedule(
    date: str,
    provider_id: Optional[str] = None
) -> DailySchedule:
    """
    Get the schedule for a specific day.
    
    - **date**: Date in YYYY-MM-DD format
    - **provider_id**: Optional provider filter
    """
    try:
        schedule_date = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    return appointment_service.get_daily_schedule(schedule_date, provider_id)


# --- Appointment Types Info ---

@router.get("/types", response_model=List[dict])
async def list_appointment_types() -> List[dict]:
    """List all available appointment types with descriptions."""
    return [
        {"value": "new_patient", "label": "New Patient", "description": "First time patient visit", "default_duration": 60},
        {"value": "follow_up", "label": "Follow-up", "description": "Follow-up appointment", "default_duration": 30},
        {"value": "annual_physical", "label": "Annual Physical", "description": "Annual wellness exam", "default_duration": 45},
        {"value": "sick_visit", "label": "Sick Visit", "description": "Illness-related visit", "default_duration": 20},
        {"value": "consultation", "label": "Consultation", "description": "Specialist consultation", "default_duration": 45},
        {"value": "procedure", "label": "Procedure", "description": "Medical procedure", "default_duration": 60},
        {"value": "telehealth", "label": "Telehealth", "description": "Virtual appointment", "default_duration": 30},
        {"value": "urgent_care", "label": "Urgent Care", "description": "Urgent/same-day visit", "default_duration": 20},
        {"value": "lab_work", "label": "Lab Work", "description": "Laboratory testing", "default_duration": 15},
        {"value": "imaging", "label": "Imaging", "description": "X-ray, MRI, CT scan", "default_duration": 30},
        {"value": "vaccination", "label": "Vaccination", "description": "Immunization visit", "default_duration": 15},
        {"value": "other", "label": "Other", "description": "Other appointment type", "default_duration": 30},
    ]


@router.get("/statuses", response_model=List[dict])
async def list_appointment_statuses() -> List[dict]:
    """List all appointment statuses with descriptions."""
    return [
        {"value": "scheduled", "label": "Scheduled", "description": "Appointment is confirmed"},
        {"value": "pending", "label": "Pending", "description": "Awaiting confirmation"},
        {"value": "confirmed", "label": "Confirmed", "description": "Patient confirmed attendance"},
        {"value": "checked_in", "label": "Checked In", "description": "Patient has arrived"},
        {"value": "in_progress", "label": "In Progress", "description": "Appointment is underway"},
        {"value": "completed", "label": "Completed", "description": "Appointment finished"},
        {"value": "cancelled", "label": "Cancelled", "description": "Appointment was cancelled"},
        {"value": "no_show", "label": "No Show", "description": "Patient didn't show up"},
        {"value": "rescheduled", "label": "Rescheduled", "description": "Moved to different time"},
    ]


# --- CRUD Endpoints ---

@router.post("/", response_model=AppointmentDetail, status_code=201)
async def create_appointment(data: AppointmentCreate) -> AppointmentDetail:
    """
    Create a new appointment.
    
    Required fields:
    - patient_id, patient_name
    - scheduled_start
    
    Optional but recommended:
    - provider_name, department
    - appointment_type (defaults to follow_up)
    - duration_minutes (defaults to 30)
    - reason_for_visit (enables AI prep notes)
    """
    return appointment_service.create_appointment(data)


@router.get("/{appointment_id}", response_model=AppointmentDetail)
async def get_appointment(appointment_id: int) -> AppointmentDetail:
    """Get full details of a specific appointment."""
    appointment = appointment_service.get_appointment(appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


@router.put("/{appointment_id}", response_model=AppointmentDetail)
async def update_appointment(
    appointment_id: int,
    data: AppointmentUpdate,
    updated_by: Optional[str] = Query(None)
) -> AppointmentDetail:
    """Update an existing appointment."""
    appointment = appointment_service.update_appointment(appointment_id, data, updated_by)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


@router.delete("/{appointment_id}")
async def delete_appointment(appointment_id: int) -> dict:
    """Delete an appointment."""
    success = appointment_service.delete_appointment(appointment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"success": True, "message": "Appointment deleted"}


# --- Appointment Actions ---

@router.post("/{appointment_id}/reschedule", response_model=AppointmentDetail)
async def reschedule_appointment(
    appointment_id: int,
    data: AppointmentReschedule
) -> AppointmentDetail:
    """
    Reschedule an appointment to a new date/time.
    
    - **new_scheduled_start**: The new start time
    - **new_duration_minutes**: Optional new duration
    - **reason**: Optional reason for rescheduling
    """
    appointment = appointment_service.reschedule_appointment(appointment_id, data)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


@router.post("/{appointment_id}/cancel", response_model=AppointmentDetail)
async def cancel_appointment(
    appointment_id: int,
    data: AppointmentCancel
) -> AppointmentDetail:
    """
    Cancel an appointment.
    
    - **reason**: Required reason for cancellation
    """
    appointment = appointment_service.cancel_appointment(appointment_id, data)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


@router.post("/{appointment_id}/check-in", response_model=AppointmentDetail)
async def check_in_patient(
    appointment_id: int,
    data: AppointmentCheckIn
) -> AppointmentDetail:
    """Check in a patient for their appointment."""
    appointment = appointment_service.check_in_patient(appointment_id, data)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


@router.post("/{appointment_id}/start", response_model=AppointmentDetail)
async def start_appointment(
    appointment_id: int,
    started_by: Optional[str] = Query(None)
) -> AppointmentDetail:
    """Mark an appointment as in progress."""
    appointment = appointment_service.start_appointment(appointment_id, started_by)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


@router.post("/{appointment_id}/complete", response_model=AppointmentDetail)
async def complete_appointment(
    appointment_id: int,
    completed_by: Optional[str] = Query(None),
    notes: Optional[str] = Query(None)
) -> AppointmentDetail:
    """Mark an appointment as completed."""
    appointment = appointment_service.complete_appointment(appointment_id, completed_by, notes)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


@router.post("/{appointment_id}/no-show", response_model=AppointmentDetail)
async def mark_no_show(
    appointment_id: int,
    marked_by: Optional[str] = Query(None)
) -> AppointmentDetail:
    """Mark a patient as no-show."""
    appointment = appointment_service.mark_no_show(appointment_id, marked_by)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


# --- History ---

@router.get("/{appointment_id}/history", response_model=List[dict])
async def get_appointment_history(appointment_id: int) -> List[dict]:
    """Get the history of changes for an appointment."""
    # First verify appointment exists
    appointment = appointment_service.get_appointment(appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    return appointment_service.get_appointment_history(appointment_id)


# --- AI Features ---

@router.post("/ai/suggest", response_model=AIAppointmentSuggestion)
async def get_ai_suggestion(
    patient_info: str = Query(..., description="Patient information"),
    reason: str = Query(..., description="Reason for visit")
) -> AIAppointmentSuggestion:
    """
    Get AI-powered suggestions for appointment scheduling.
    
    Based on patient info and reason for visit, suggests:
    - Appointment type
    - Duration
    - Priority level
    - Preparation notes
    """
    suggestion = appointment_service.get_ai_appointment_suggestion(patient_info, reason)
    if not suggestion:
        raise HTTPException(status_code=500, detail="Unable to generate AI suggestion")
    return suggestion
