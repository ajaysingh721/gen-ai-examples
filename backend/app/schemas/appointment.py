"""
Pydantic schemas for appointment feature.
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List

from pydantic import BaseModel, ConfigDict, Field, EmailStr


class AppointmentStatus(str, Enum):
    """Status of an appointment."""
    scheduled = "scheduled"
    pending = "pending"
    confirmed = "confirmed"
    checked_in = "checked_in"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"
    no_show = "no_show"
    rescheduled = "rescheduled"


class AppointmentType(str, Enum):
    """Types of appointments."""
    new_patient = "new_patient"
    follow_up = "follow_up"
    annual_physical = "annual_physical"
    sick_visit = "sick_visit"
    consultation = "consultation"
    procedure = "procedure"
    telehealth = "telehealth"
    urgent_care = "urgent_care"
    lab_work = "lab_work"
    imaging = "imaging"
    vaccination = "vaccination"
    other = "other"


class AppointmentPriority(str, Enum):
    """Priority level for appointments."""
    low = "low"
    normal = "normal"
    high = "high"
    urgent = "urgent"


# --- Base Schemas ---

class PatientInfo(BaseModel):
    """Patient information for appointments."""
    patient_id: str
    patient_name: str
    patient_email: Optional[str] = None
    patient_phone: Optional[str] = None
    patient_dob: Optional[datetime] = None


class ProviderInfo(BaseModel):
    """Provider information for appointments."""
    provider_id: Optional[str] = None
    provider_name: Optional[str] = None
    department: Optional[str] = None


# --- Create/Update Schemas ---

class AppointmentCreate(BaseModel):
    """Schema for creating a new appointment."""
    # Patient info
    patient_id: str
    patient_name: str
    patient_email: Optional[str] = None
    patient_phone: Optional[str] = None
    patient_dob: Optional[datetime] = None
    
    # Provider info
    provider_id: Optional[str] = None
    provider_name: Optional[str] = None
    department: Optional[str] = None
    
    # Appointment details
    appointment_type: AppointmentType = AppointmentType.follow_up
    priority: AppointmentPriority = AppointmentPriority.normal
    
    # Scheduling
    scheduled_start: datetime
    scheduled_end: Optional[datetime] = None
    duration_minutes: int = Field(default=30, ge=5, le=480)
    
    # Location
    location: Optional[str] = None
    room: Optional[str] = None
    is_telehealth: bool = False
    telehealth_link: Optional[str] = None
    
    # Clinical info
    reason_for_visit: Optional[str] = None
    chief_complaint: Optional[str] = None
    notes: Optional[str] = None
    
    # Insurance
    insurance_provider: Optional[str] = None
    insurance_id: Optional[str] = None
    
    # Audit
    created_by: Optional[str] = None


class AppointmentUpdate(BaseModel):
    """Schema for updating an appointment."""
    patient_name: Optional[str] = None
    patient_email: Optional[str] = None
    patient_phone: Optional[str] = None
    
    provider_id: Optional[str] = None
    provider_name: Optional[str] = None
    department: Optional[str] = None
    
    appointment_type: Optional[AppointmentType] = None
    status: Optional[AppointmentStatus] = None
    priority: Optional[AppointmentPriority] = None
    
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(default=None, ge=5, le=480)
    
    location: Optional[str] = None
    room: Optional[str] = None
    is_telehealth: Optional[bool] = None
    telehealth_link: Optional[str] = None
    
    reason_for_visit: Optional[str] = None
    chief_complaint: Optional[str] = None
    notes: Optional[str] = None
    
    insurance_provider: Optional[str] = None
    insurance_id: Optional[str] = None


class AppointmentReschedule(BaseModel):
    """Schema for rescheduling an appointment."""
    new_scheduled_start: datetime
    new_scheduled_end: Optional[datetime] = None
    new_duration_minutes: Optional[int] = Field(default=None, ge=5, le=480)
    reason: Optional[str] = None
    rescheduled_by: Optional[str] = None


class AppointmentCancel(BaseModel):
    """Schema for cancelling an appointment."""
    reason: str
    cancelled_by: Optional[str] = None


class AppointmentCheckIn(BaseModel):
    """Schema for patient check-in."""
    checked_in_by: Optional[str] = None
    notes: Optional[str] = None


# --- Response Schemas ---

class AppointmentRecord(BaseModel):
    """Summary record of an appointment for lists."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    patient_id: str
    patient_name: str
    provider_name: Optional[str] = None
    department: Optional[str] = None
    
    appointment_type: str
    status: str
    priority: str
    
    scheduled_start: datetime
    scheduled_end: datetime
    duration_minutes: int
    
    location: Optional[str] = None
    room: Optional[str] = None
    is_telehealth: bool
    
    reason_for_visit: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime


class AppointmentDetail(BaseModel):
    """Full appointment details."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    
    # Patient info
    patient_id: str
    patient_name: str
    patient_email: Optional[str] = None
    patient_phone: Optional[str] = None
    patient_dob: Optional[datetime] = None
    
    # Provider info
    provider_id: Optional[str] = None
    provider_name: Optional[str] = None
    department: Optional[str] = None
    
    # Appointment details
    appointment_type: str
    status: str
    priority: str
    
    # Scheduling
    scheduled_start: datetime
    scheduled_end: datetime
    duration_minutes: int
    
    # Location
    location: Optional[str] = None
    room: Optional[str] = None
    is_telehealth: bool
    telehealth_link: Optional[str] = None
    
    # Clinical info
    reason_for_visit: Optional[str] = None
    chief_complaint: Optional[str] = None
    notes: Optional[str] = None
    
    # Insurance
    insurance_provider: Optional[str] = None
    insurance_id: Optional[str] = None
    
    # AI fields
    ai_summary: Optional[str] = None
    ai_prep_notes: Optional[str] = None
    ai_suggested_duration: Optional[int] = None
    
    # Reminders
    reminder_sent: bool
    reminder_sent_at: Optional[datetime] = None
    
    # Audit
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    cancelled_at: Optional[datetime] = None
    cancelled_by: Optional[str] = None
    cancellation_reason: Optional[str] = None
    
    # Check-in tracking
    checked_in_at: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None


# --- Statistics Schemas ---

class AppointmentStats(BaseModel):
    """Statistics about appointments."""
    total_appointments: int
    today_appointments: int
    upcoming_appointments: int
    completed_today: int
    cancelled_today: int
    no_shows_today: int
    
    by_status: dict[str, int]
    by_type: dict[str, int]
    by_provider: dict[str, int]
    
    avg_wait_time_minutes: Optional[float] = None
    avg_appointment_duration_minutes: Optional[float] = None


class DailySchedule(BaseModel):
    """Daily schedule summary."""
    date: datetime
    total_slots: int
    booked_slots: int
    available_slots: int
    appointments: List[AppointmentRecord]


class ProviderAvailability(BaseModel):
    """Provider availability slots."""
    provider_id: str
    provider_name: str
    date: datetime
    available_slots: List[dict]  # [{start, end, duration}]


# --- AI Schemas ---

class AIAppointmentSuggestion(BaseModel):
    """AI-generated appointment suggestions."""
    suggested_type: AppointmentType
    suggested_duration: int
    suggested_priority: AppointmentPriority
    prep_notes: Optional[str] = None
    reasoning: str


class AppointmentHistoryRecord(BaseModel):
    """Record of appointment change history."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    appointment_id: int
    action: str
    old_values: Optional[str] = None
    new_values: Optional[str] = None
    changed_by: Optional[str] = None
    changed_at: datetime
    notes: Optional[str] = None
