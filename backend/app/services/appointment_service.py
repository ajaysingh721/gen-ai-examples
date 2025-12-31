"""
Appointment service - handles appointment scheduling, management, and AI features.
"""

import json
import re
from datetime import datetime, timedelta
from typing import Optional, List, Tuple

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.core.db import SessionLocal
from app.models.appointment import (
    Appointment,
    AppointmentHistory,
    AppointmentStatus as ModelAppointmentStatus,
    AppointmentType as ModelAppointmentType,
    AppointmentPriority as ModelAppointmentPriority
)
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
    AppointmentPriority,
    DailySchedule,
    AIAppointmentSuggestion
)
from app.services.llm_service import generate_text


# --- Database Session Management ---

def get_db() -> Session:
    """Get a database session."""
    return SessionLocal()


# --- Appointment CRUD Operations ---

def create_appointment(data: AppointmentCreate) -> AppointmentDetail:
    """Create a new appointment."""
    db = get_db()
    try:
        # Calculate end time if not provided
        scheduled_end = data.scheduled_end
        if not scheduled_end:
            scheduled_end = data.scheduled_start + timedelta(minutes=data.duration_minutes)
        
        appointment = Appointment(
            patient_id=data.patient_id,
            patient_name=data.patient_name,
            patient_email=data.patient_email,
            patient_phone=data.patient_phone,
            patient_dob=data.patient_dob,
            provider_id=data.provider_id,
            provider_name=data.provider_name,
            department=data.department,
            appointment_type=data.appointment_type.value,
            status=AppointmentStatus.scheduled.value,
            priority=data.priority.value,
            scheduled_start=data.scheduled_start,
            scheduled_end=scheduled_end,
            duration_minutes=data.duration_minutes,
            location=data.location,
            room=data.room,
            is_telehealth=data.is_telehealth,
            telehealth_link=data.telehealth_link,
            reason_for_visit=data.reason_for_visit,
            chief_complaint=data.chief_complaint,
            notes=data.notes,
            insurance_provider=data.insurance_provider,
            insurance_id=data.insurance_id,
            created_by=data.created_by,
        )
        
        db.add(appointment)
        db.commit()
        db.refresh(appointment)
        
        # Log history
        _log_appointment_history(db, appointment.id, "created", None, data.model_dump_json(), data.created_by)
        
        # Generate AI prep notes in background (if reason provided)
        if data.reason_for_visit:
            ai_notes = generate_ai_prep_notes(data.reason_for_visit, data.appointment_type.value)
            if ai_notes:
                appointment.ai_prep_notes = ai_notes
                db.commit()
                db.refresh(appointment)
        
        return AppointmentDetail.model_validate(appointment)
    finally:
        db.close()


def get_appointment(appointment_id: int) -> Optional[AppointmentDetail]:
    """Get a single appointment by ID."""
    db = get_db()
    try:
        appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appointment:
            return None
        return AppointmentDetail.model_validate(appointment)
    finally:
        db.close()


def update_appointment(appointment_id: int, data: AppointmentUpdate, updated_by: Optional[str] = None) -> Optional[AppointmentDetail]:
    """Update an existing appointment."""
    db = get_db()
    try:
        appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appointment:
            return None
        
        old_values = {
            "status": appointment.status,
            "scheduled_start": str(appointment.scheduled_start) if appointment.scheduled_start else None,
            "provider_name": appointment.provider_name,
        }
        
        update_data = data.model_dump(exclude_unset=True, exclude_none=True)
        
        # Handle enum conversions
        if "status" in update_data and isinstance(update_data["status"], AppointmentStatus):
            update_data["status"] = update_data["status"].value
        if "appointment_type" in update_data and isinstance(update_data["appointment_type"], AppointmentType):
            update_data["appointment_type"] = update_data["appointment_type"].value
        if "priority" in update_data and isinstance(update_data["priority"], AppointmentPriority):
            update_data["priority"] = update_data["priority"].value
        
        for key, value in update_data.items():
            setattr(appointment, key, value)
        
        # Recalculate end time if start or duration changed
        if "scheduled_start" in update_data or "duration_minutes" in update_data:
            if appointment.scheduled_start and appointment.duration_minutes:
                appointment.scheduled_end = appointment.scheduled_start + timedelta(minutes=appointment.duration_minutes)
        
        db.commit()
        db.refresh(appointment)
        
        _log_appointment_history(db, appointment_id, "updated", json.dumps(old_values), json.dumps(update_data), updated_by)
        
        return AppointmentDetail.model_validate(appointment)
    finally:
        db.close()


def delete_appointment(appointment_id: int) -> bool:
    """Delete an appointment."""
    db = get_db()
    try:
        appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appointment:
            return False
        
        db.delete(appointment)
        db.commit()
        return True
    finally:
        db.close()


def list_appointments(
    status: Optional[AppointmentStatus] = None,
    appointment_type: Optional[AppointmentType] = None,
    provider_id: Optional[str] = None,
    patient_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 50,
    offset: int = 0
) -> List[AppointmentRecord]:
    """List appointments with optional filters."""
    db = get_db()
    try:
        query = db.query(Appointment)
        
        if status:
            query = query.filter(Appointment.status == status.value)
        if appointment_type:
            query = query.filter(Appointment.appointment_type == appointment_type.value)
        if provider_id:
            query = query.filter(Appointment.provider_id == provider_id)
        if patient_id:
            query = query.filter(Appointment.patient_id == patient_id)
        if start_date:
            query = query.filter(Appointment.scheduled_start >= start_date)
        if end_date:
            query = query.filter(Appointment.scheduled_start <= end_date)
        
        query = query.order_by(Appointment.scheduled_start.asc())
        appointments = query.offset(offset).limit(limit).all()
        
        return [AppointmentRecord.model_validate(a) for a in appointments]
    finally:
        db.close()


# --- Appointment Actions ---

def reschedule_appointment(appointment_id: int, data: AppointmentReschedule) -> Optional[AppointmentDetail]:
    """Reschedule an appointment to a new time."""
    db = get_db()
    try:
        appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appointment:
            return None
        
        old_values = {
            "scheduled_start": str(appointment.scheduled_start),
            "scheduled_end": str(appointment.scheduled_end),
            "duration_minutes": appointment.duration_minutes,
        }
        
        appointment.scheduled_start = data.new_scheduled_start
        
        duration = data.new_duration_minutes or appointment.duration_minutes
        appointment.duration_minutes = duration
        appointment.scheduled_end = data.new_scheduled_end or (data.new_scheduled_start + timedelta(minutes=duration))
        
        appointment.status = AppointmentStatus.rescheduled.value
        
        db.commit()
        db.refresh(appointment)
        
        new_values = {
            "scheduled_start": str(appointment.scheduled_start),
            "scheduled_end": str(appointment.scheduled_end),
            "duration_minutes": appointment.duration_minutes,
            "reason": data.reason,
        }
        _log_appointment_history(db, appointment_id, "rescheduled", json.dumps(old_values), json.dumps(new_values), data.rescheduled_by)
        
        return AppointmentDetail.model_validate(appointment)
    finally:
        db.close()


def cancel_appointment(appointment_id: int, data: AppointmentCancel) -> Optional[AppointmentDetail]:
    """Cancel an appointment."""
    db = get_db()
    try:
        appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appointment:
            return None
        
        old_status = appointment.status
        
        appointment.status = AppointmentStatus.cancelled.value
        appointment.cancelled_at = datetime.utcnow()
        appointment.cancelled_by = data.cancelled_by
        appointment.cancellation_reason = data.reason
        
        db.commit()
        db.refresh(appointment)
        
        _log_appointment_history(
            db, appointment_id, "cancelled",
            json.dumps({"status": old_status}),
            json.dumps({"status": "cancelled", "reason": data.reason}),
            data.cancelled_by
        )
        
        return AppointmentDetail.model_validate(appointment)
    finally:
        db.close()


def check_in_patient(appointment_id: int, data: AppointmentCheckIn) -> Optional[AppointmentDetail]:
    """Check in a patient for their appointment."""
    db = get_db()
    try:
        appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appointment:
            return None
        
        appointment.status = AppointmentStatus.checked_in.value
        appointment.checked_in_at = datetime.utcnow()
        
        if data.notes:
            existing_notes = appointment.notes or ""
            appointment.notes = f"{existing_notes}\n[Check-in notes]: {data.notes}".strip()
        
        db.commit()
        db.refresh(appointment)
        
        _log_appointment_history(db, appointment_id, "checked_in", None, None, data.checked_in_by)
        
        return AppointmentDetail.model_validate(appointment)
    finally:
        db.close()


def start_appointment(appointment_id: int, started_by: Optional[str] = None) -> Optional[AppointmentDetail]:
    """Mark appointment as in progress."""
    db = get_db()
    try:
        appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appointment:
            return None
        
        appointment.status = AppointmentStatus.in_progress.value
        appointment.actual_start = datetime.utcnow()
        
        db.commit()
        db.refresh(appointment)
        
        _log_appointment_history(db, appointment_id, "started", None, None, started_by)
        
        return AppointmentDetail.model_validate(appointment)
    finally:
        db.close()


def complete_appointment(appointment_id: int, completed_by: Optional[str] = None, notes: Optional[str] = None) -> Optional[AppointmentDetail]:
    """Mark appointment as completed."""
    db = get_db()
    try:
        appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appointment:
            return None
        
        appointment.status = AppointmentStatus.completed.value
        appointment.actual_end = datetime.utcnow()
        
        if notes:
            existing_notes = appointment.notes or ""
            appointment.notes = f"{existing_notes}\n[Completion notes]: {notes}".strip()
        
        db.commit()
        db.refresh(appointment)
        
        _log_appointment_history(db, appointment_id, "completed", None, json.dumps({"notes": notes}), completed_by)
        
        return AppointmentDetail.model_validate(appointment)
    finally:
        db.close()


def mark_no_show(appointment_id: int, marked_by: Optional[str] = None) -> Optional[AppointmentDetail]:
    """Mark patient as no-show."""
    db = get_db()
    try:
        appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appointment:
            return None
        
        appointment.status = AppointmentStatus.no_show.value
        
        db.commit()
        db.refresh(appointment)
        
        _log_appointment_history(db, appointment_id, "no_show", None, None, marked_by)
        
        return AppointmentDetail.model_validate(appointment)
    finally:
        db.close()


# --- Statistics ---

def get_appointment_stats() -> AppointmentStats:
    """Get appointment statistics."""
    db = get_db()
    try:
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        total = db.query(func.count(Appointment.id)).scalar() or 0
        
        today_appts = db.query(func.count(Appointment.id)).filter(
            and_(Appointment.scheduled_start >= today_start, Appointment.scheduled_start < today_end)
        ).scalar() or 0
        
        upcoming = db.query(func.count(Appointment.id)).filter(
            and_(
                Appointment.scheduled_start > datetime.utcnow(),
                Appointment.status.in_([AppointmentStatus.scheduled.value, AppointmentStatus.confirmed.value])
            )
        ).scalar() or 0
        
        completed_today = db.query(func.count(Appointment.id)).filter(
            and_(
                Appointment.scheduled_start >= today_start,
                Appointment.scheduled_start < today_end,
                Appointment.status == AppointmentStatus.completed.value
            )
        ).scalar() or 0
        
        cancelled_today = db.query(func.count(Appointment.id)).filter(
            and_(
                Appointment.cancelled_at >= today_start,
                Appointment.cancelled_at < today_end
            )
        ).scalar() or 0
        
        no_shows_today = db.query(func.count(Appointment.id)).filter(
            and_(
                Appointment.scheduled_start >= today_start,
                Appointment.scheduled_start < today_end,
                Appointment.status == AppointmentStatus.no_show.value
            )
        ).scalar() or 0
        
        # Group by status
        status_counts = db.query(
            Appointment.status, func.count(Appointment.id)
        ).group_by(Appointment.status).all()
        by_status = {s: c for s, c in status_counts}
        
        # Group by type
        type_counts = db.query(
            Appointment.appointment_type, func.count(Appointment.id)
        ).group_by(Appointment.appointment_type).all()
        by_type = {t: c for t, c in type_counts}
        
        # Group by provider
        provider_counts = db.query(
            Appointment.provider_name, func.count(Appointment.id)
        ).filter(Appointment.provider_name.isnot(None)).group_by(Appointment.provider_name).all()
        by_provider = {p: c for p, c in provider_counts if p}
        
        return AppointmentStats(
            total_appointments=total,
            today_appointments=today_appts,
            upcoming_appointments=upcoming,
            completed_today=completed_today,
            cancelled_today=cancelled_today,
            no_shows_today=no_shows_today,
            by_status=by_status,
            by_type=by_type,
            by_provider=by_provider,
        )
    finally:
        db.close()


def get_daily_schedule(date: datetime, provider_id: Optional[str] = None) -> DailySchedule:
    """Get schedule for a specific day."""
    db = get_db()
    try:
        day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        query = db.query(Appointment).filter(
            and_(Appointment.scheduled_start >= day_start, Appointment.scheduled_start < day_end)
        )
        
        if provider_id:
            query = query.filter(Appointment.provider_id == provider_id)
        
        appointments = query.order_by(Appointment.scheduled_start.asc()).all()
        
        # Calculate slots (assuming 8 AM - 6 PM, 30-minute slots = 20 slots)
        total_slots = 20
        booked_slots = len(appointments)
        
        return DailySchedule(
            date=day_start,
            total_slots=total_slots,
            booked_slots=booked_slots,
            available_slots=total_slots - booked_slots,
            appointments=[AppointmentRecord.model_validate(a) for a in appointments]
        )
    finally:
        db.close()


def get_todays_appointments(provider_id: Optional[str] = None) -> List[AppointmentRecord]:
    """Get all appointments for today."""
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    return list_appointments(
        start_date=today_start,
        end_date=today_end,
        provider_id=provider_id,
        limit=100
    )


def get_upcoming_appointments(hours: int = 24, provider_id: Optional[str] = None) -> List[AppointmentRecord]:
    """Get upcoming appointments within the specified hours."""
    now = datetime.utcnow()
    end_time = now + timedelta(hours=hours)
    
    return list_appointments(
        start_date=now,
        end_date=end_time,
        provider_id=provider_id,
        limit=100
    )


# --- AI Features ---

def generate_ai_prep_notes(reason_for_visit: str, appointment_type: str) -> Optional[str]:
    """Generate AI preparation notes for providers."""
    if not reason_for_visit or len(reason_for_visit.strip()) < 10:
        return None
    
    prompt = f"""You are a clinical assistant helping prepare for a patient appointment.
    
Appointment Type: {appointment_type.replace('_', ' ').title()}
Reason for Visit: {reason_for_visit}

Generate brief preparation notes for the healthcare provider including:
1. Key areas to review in patient history
2. Potential topics to discuss
3. Common considerations for this type of visit
4. Any recommended screenings or assessments

Keep the notes concise and actionable (3-5 bullet points max).

Preparation Notes:"""

    try:
        notes = generate_text(prompt, max_tokens=300)
        return notes.strip() if notes else None
    except Exception:
        return None


def get_ai_appointment_suggestion(patient_info: str, reason: str) -> Optional[AIAppointmentSuggestion]:
    """Get AI suggestions for appointment scheduling."""
    prompt = f"""Based on the following patient information and reason for visit, suggest the appropriate appointment type and duration.

Patient Info: {patient_info}
Reason for Visit: {reason}

Return JSON with:
{{"suggested_type": "follow_up|new_patient|sick_visit|etc", "suggested_duration": 30, "suggested_priority": "normal|high|urgent", "prep_notes": "brief notes", "reasoning": "why this suggestion"}}

JSON:"""

    try:
        raw = generate_text(prompt, max_tokens=250).strip()
        
        match = re.search(r"\{.*\}", raw, flags=re.DOTALL)
        if match:
            payload = json.loads(match.group(0))
            
            # Map to valid enum
            type_map = {
                "new_patient": AppointmentType.new_patient,
                "follow_up": AppointmentType.follow_up,
                "sick_visit": AppointmentType.sick_visit,
                "annual_physical": AppointmentType.annual_physical,
                "consultation": AppointmentType.consultation,
                "procedure": AppointmentType.procedure,
                "telehealth": AppointmentType.telehealth,
                "urgent_care": AppointmentType.urgent_care,
            }
            
            priority_map = {
                "low": AppointmentPriority.low,
                "normal": AppointmentPriority.normal,
                "high": AppointmentPriority.high,
                "urgent": AppointmentPriority.urgent,
            }
            
            suggested_type = type_map.get(payload.get("suggested_type", "follow_up"), AppointmentType.follow_up)
            suggested_priority = priority_map.get(payload.get("suggested_priority", "normal"), AppointmentPriority.normal)
            
            return AIAppointmentSuggestion(
                suggested_type=suggested_type,
                suggested_duration=int(payload.get("suggested_duration", 30)),
                suggested_priority=suggested_priority,
                prep_notes=payload.get("prep_notes"),
                reasoning=payload.get("reasoning", "")
            )
    except Exception:
        pass
    
    return None


# --- Helper Functions ---

def _log_appointment_history(
    db: Session,
    appointment_id: int,
    action: str,
    old_values: Optional[str],
    new_values: Optional[str],
    changed_by: Optional[str]
) -> None:
    """Log an appointment change to history."""
    history = AppointmentHistory(
        appointment_id=appointment_id,
        action=action,
        old_values=old_values,
        new_values=new_values,
        changed_by=changed_by,
    )
    db.add(history)
    db.commit()


def get_appointment_history(appointment_id: int) -> List[dict]:
    """Get the history of changes for an appointment."""
    db = get_db()
    try:
        history = db.query(AppointmentHistory).filter(
            AppointmentHistory.appointment_id == appointment_id
        ).order_by(AppointmentHistory.changed_at.desc()).all()
        
        return [
            {
                "id": h.id,
                "action": h.action,
                "old_values": json.loads(h.old_values) if h.old_values else None,
                "new_values": json.loads(h.new_values) if h.new_values else None,
                "changed_by": h.changed_by,
                "changed_at": h.changed_at.isoformat(),
                "notes": h.notes,
            }
            for h in history
        ]
    finally:
        db.close()


def search_appointments(query: str, limit: int = 20) -> List[AppointmentRecord]:
    """Search appointments by patient name, provider name, or reason."""
    db = get_db()
    try:
        search_term = f"%{query}%"
        
        appointments = db.query(Appointment).filter(
            or_(
                Appointment.patient_name.ilike(search_term),
                Appointment.provider_name.ilike(search_term),
                Appointment.reason_for_visit.ilike(search_term),
                Appointment.patient_id.ilike(search_term),
            )
        ).order_by(Appointment.scheduled_start.desc()).limit(limit).all()
        
        return [AppointmentRecord.model_validate(a) for a in appointments]
    finally:
        db.close()
