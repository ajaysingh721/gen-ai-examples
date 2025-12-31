"""
Appointment model for doctor appointment scheduling.
"""

from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, DateTime, Enum, Integer, String, Text, Boolean, Float

from app.core.db import Base


class AppointmentStatus(str, PyEnum):
    """Status of an appointment."""
    scheduled = "scheduled"       # Appointment is confirmed
    pending = "pending"           # Awaiting confirmation
    confirmed = "confirmed"       # Patient confirmed attendance
    checked_in = "checked_in"     # Patient has arrived
    in_progress = "in_progress"   # Appointment is underway
    completed = "completed"       # Appointment finished
    cancelled = "cancelled"       # Appointment was cancelled
    no_show = "no_show"           # Patient didn't show up
    rescheduled = "rescheduled"   # Moved to different time


class AppointmentType(str, PyEnum):
    """Types of appointments."""
    new_patient = "new_patient"           # First time patient visit
    follow_up = "follow_up"               # Follow-up appointment
    annual_physical = "annual_physical"   # Annual wellness exam
    sick_visit = "sick_visit"             # Illness-related visit
    consultation = "consultation"         # Specialist consultation
    procedure = "procedure"               # Medical procedure
    telehealth = "telehealth"             # Virtual appointment
    urgent_care = "urgent_care"           # Urgent/same-day visit
    lab_work = "lab_work"                 # Laboratory testing
    imaging = "imaging"                   # X-ray, MRI, CT scan
    vaccination = "vaccination"           # Immunization visit
    other = "other"                       # Other appointment type


class AppointmentPriority(str, PyEnum):
    """Priority level for appointments."""
    low = "low"
    normal = "normal"
    high = "high"
    urgent = "urgent"


class Appointment(Base):
    """Model for doctor appointments."""
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    
    # Patient information
    patient_id = Column(String(64), nullable=False, index=True)
    patient_name = Column(String(256), nullable=False)
    patient_email = Column(String(256), nullable=True)
    patient_phone = Column(String(32), nullable=True)
    patient_dob = Column(DateTime, nullable=True)
    
    # Provider information
    provider_id = Column(String(64), nullable=True, index=True)
    provider_name = Column(String(256), nullable=True)
    department = Column(String(128), nullable=True)
    
    # Appointment details
    appointment_type = Column(String(32), default=AppointmentType.follow_up.value, nullable=False)
    status = Column(String(32), default=AppointmentStatus.scheduled.value, nullable=False, index=True)
    priority = Column(String(16), default=AppointmentPriority.normal.value, nullable=False)
    
    # Scheduling
    scheduled_start = Column(DateTime, nullable=False, index=True)
    scheduled_end = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=30, nullable=False)
    
    # Location
    location = Column(String(256), nullable=True)
    room = Column(String(64), nullable=True)
    is_telehealth = Column(Boolean, default=False, nullable=False)
    telehealth_link = Column(String(512), nullable=True)
    
    # Clinical information
    reason_for_visit = Column(Text, nullable=True)
    chief_complaint = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Insurance
    insurance_provider = Column(String(128), nullable=True)
    insurance_id = Column(String(64), nullable=True)
    
    # AI-generated fields
    ai_summary = Column(Text, nullable=True)
    ai_prep_notes = Column(Text, nullable=True)  # AI-generated preparation notes for provider
    ai_suggested_duration = Column(Integer, nullable=True)
    
    # Reminders
    reminder_sent = Column(Boolean, default=False, nullable=False)
    reminder_sent_at = Column(DateTime, nullable=True)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(String(128), nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    cancelled_by = Column(String(128), nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    
    # Check-in tracking
    checked_in_at = Column(DateTime, nullable=True)
    actual_start = Column(DateTime, nullable=True)
    actual_end = Column(DateTime, nullable=True)


class AppointmentHistory(Base):
    """Model for tracking appointment changes/history."""
    __tablename__ = "appointment_history"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, nullable=False, index=True)
    
    action = Column(String(32), nullable=False)  # created, updated, cancelled, rescheduled
    old_values = Column(Text, nullable=True)  # JSON of changed fields
    new_values = Column(Text, nullable=True)  # JSON of new values
    
    changed_by = Column(String(128), nullable=True)
    changed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    notes = Column(Text, nullable=True)
