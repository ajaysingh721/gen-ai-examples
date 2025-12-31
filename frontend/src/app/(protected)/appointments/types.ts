export type AppointmentStatus =
  | "scheduled"
  | "pending"
  | "confirmed"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show"
  | "rescheduled";

export type AppointmentType =
  | "new_patient"
  | "follow_up"
  | "annual_physical"
  | "sick_visit"
  | "consultation"
  | "procedure"
  | "telehealth"
  | "urgent_care"
  | "lab_work"
  | "imaging"
  | "vaccination"
  | "other";

export type AppointmentPriority = "low" | "normal" | "high" | "urgent";

export interface AppointmentRecord {
  id: number;
  patient_id: string;
  patient_name: string;
  provider_name: string | null;
  department: string | null;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  priority: AppointmentPriority;
  scheduled_start: string;
  scheduled_end: string;
  duration_minutes: number;
  location: string | null;
  room: string | null;
  is_telehealth: boolean;
  reason_for_visit: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentDetail extends AppointmentRecord {
  patient_email: string | null;
  patient_phone: string | null;
  patient_dob: string | null;
  provider_id: string | null;
  telehealth_link: string | null;
  chief_complaint: string | null;
  notes: string | null;
  insurance_provider: string | null;
  insurance_id: string | null;
  ai_summary: string | null;
  ai_prep_notes: string | null;
  ai_suggested_duration: number | null;
  reminder_sent: boolean;
  reminder_sent_at: string | null;
  created_by: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  checked_in_at: string | null;
  actual_start: string | null;
  actual_end: string | null;
}

export interface AppointmentStats {
  total_appointments: number;
  today_appointments: number;
  upcoming_appointments: number;
  completed_today: number;
  cancelled_today: number;
  no_shows_today: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  by_provider: Record<string, number>;
  avg_wait_time_minutes: number | null;
  avg_appointment_duration_minutes: number | null;
}

export interface AppointmentTypeInfo {
  value: AppointmentType;
  label: string;
  description: string;
  default_duration: number;
}

export interface AppointmentStatusInfo {
  value: AppointmentStatus;
  label: string;
  description: string;
}

export interface CreateAppointmentData {
  patient_id: string;
  patient_name: string;
  patient_email?: string;
  patient_phone?: string;
  provider_id?: string;
  provider_name?: string;
  department?: string;
  appointment_type: AppointmentType;
  priority?: AppointmentPriority;
  scheduled_start: string;
  scheduled_end?: string;
  duration_minutes?: number;
  location?: string;
  room?: string;
  is_telehealth?: boolean;
  telehealth_link?: string;
  reason_for_visit?: string;
  chief_complaint?: string;
  notes?: string;
  insurance_provider?: string;
  insurance_id?: string;
  created_by?: string;
}
