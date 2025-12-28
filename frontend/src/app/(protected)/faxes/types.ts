/**
 * Comprehensive type definitions for the Fax Categorization System
 * Includes all AI-enhanced features and advanced categorization capabilities
 */

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export type FaxStatus =
  | "pending"
  | "categorized"
  | "approved"
  | "overridden"
  | "processed"
  | "flagged"
  | "archived";

export type FaxCategory =
  | "discharge_summary"
  | "inpatient_document"
  | "census"
  | "junk_fax"
  | "lab_results"
  | "prescription_refill"
  | "referral"
  | "insurance_auth"
  | "medical_records_request"
  | "prior_authorization"
  | "appointment_related"
  | "billing_inquiry"
  | "other_clinical";

export type FaxSubCategory =
  | "discharge_instructions"
  | "discharge_medications"
  | "discharge_follow_up"
  | "progress_note"
  | "h_and_p"
  | "consultation"
  | "operative_note"
  | "blood_work"
  | "imaging"
  | "pathology"
  | "unspecified";

export type QualityScore = "excellent" | "good" | "fair" | "poor" | "illegible";

export type SentimentType =
  | "neutral"
  | "urgent"
  | "routine"
  | "critical"
  | "informational";

// ============================================================================
// CATEGORY METADATA
// ============================================================================

export const categoryLabels: Record<FaxCategory, string> = {
  discharge_summary: "Discharge Summary",
  inpatient_document: "Inpatient Document",
  census: "Census",
  junk_fax: "Junk Fax",
  lab_results: "Lab Results",
  prescription_refill: "Prescription Refill",
  referral: "Referral",
  insurance_auth: "Insurance Auth",
  medical_records_request: "Medical Records Request",
  prior_authorization: "Prior Authorization",
  appointment_related: "Appointment Related",
  billing_inquiry: "Billing Inquiry",
  other_clinical: "Other Clinical",
};

export const categoryDescriptions: Record<FaxCategory, string> = {
  discharge_summary: "Patient discharge summaries from hospital stays",
  inpatient_document:
    "Inpatient progress notes, H&P, consults, and other in-hospital documentation",
  census: "Patient census lists with bed numbers, units, or service names",
  junk_fax: "Non-clinical documents, scanning errors, or spam faxes",
  lab_results: "Laboratory test results, blood work, and imaging reports",
  prescription_refill: "Medication refill requests from patients or pharmacies",
  referral: "Patient referrals to specialists or other healthcare facilities",
  insurance_auth: "Insurance authorization requests or approval notifications",
  medical_records_request: "Requests for patient medical records",
  prior_authorization:
    "Prior authorization requests for procedures or medications",
  appointment_related:
    "Appointment scheduling, confirmations, or cancellations",
  billing_inquiry: "Billing questions, statements, or payment inquiries",
  other_clinical: "Other clinical documents that don't fit standard categories",
};

export const categoryColors: Record<FaxCategory, string> = {
  discharge_summary: "bg-blue-100 text-blue-700 border border-blue-200",
  inpatient_document:
    "bg-emerald-100 text-emerald-700 border border-emerald-200",
  census: "bg-amber-100 text-amber-700 border border-amber-200",
  junk_fax: "bg-slate-100 text-slate-600 border border-slate-200",
  lab_results: "bg-purple-100 text-purple-700 border border-purple-200",
  prescription_refill: "bg-pink-100 text-pink-700 border border-pink-200",
  referral: "bg-cyan-100 text-cyan-700 border border-cyan-200",
  insurance_auth: "bg-orange-100 text-orange-700 border border-orange-200",
  medical_records_request:
    "bg-indigo-100 text-indigo-700 border border-indigo-200",
  prior_authorization: "bg-rose-100 text-rose-700 border border-rose-200",
  appointment_related: "bg-teal-100 text-teal-700 border border-teal-200",
  billing_inquiry: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  other_clinical: "bg-gray-100 text-gray-700 border border-gray-200",
};

export const statusLabels: Record<FaxStatus, string> = {
  pending: "Pending",
  categorized: "Needs Review",
  approved: "Approved",
  overridden: "Overridden",
  processed: "Processed",
  flagged: "Flagged",
  archived: "Archived",
};

export const statusColors: Record<FaxStatus, string> = {
  pending: "bg-amber-100 text-amber-700 border border-amber-200",
  categorized: "bg-blue-100 text-blue-700 border border-blue-200",
  approved: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  overridden: "bg-orange-100 text-orange-700 border border-orange-200",
  processed: "bg-slate-100 text-slate-600 border border-slate-200",
  flagged: "bg-red-100 text-red-700 border border-red-200",
  archived: "bg-gray-100 text-gray-500 border border-gray-200",
};

export const qualityColors: Record<QualityScore, string> = {
  excellent: "bg-green-100 text-green-700 border border-green-200",
  good: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  fair: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  poor: "bg-orange-100 text-orange-700 border border-orange-200",
  illegible: "bg-red-100 text-red-700 border border-red-200",
};

export const sentimentColors: Record<SentimentType, string> = {
  neutral: "bg-gray-100 text-gray-700",
  urgent: "bg-orange-100 text-orange-700",
  routine: "bg-blue-100 text-blue-700",
  critical: "bg-red-100 text-red-700",
  informational: "bg-cyan-100 text-cyan-700",
};

// ============================================================================
// ENTITY TYPES
// ============================================================================

export interface ExtractedEntity {
  entity_type: string; // patient, doctor, facility, medication, diagnosis, etc.
  value: string;
  confidence: number;
  source_text?: string;
}

export interface ExtractedDate {
  date_type: string; // admission, discharge, follow_up, appointment, etc.
  date_value: string;
  is_deadline: boolean;
  context?: string;
}

export interface ActionItem {
  action: string;
  priority: "low" | "normal" | "high" | "urgent";
  due_date?: string;
  assigned_to?: string;
  completed: boolean;
}

export interface AlternativeCategory {
  category: FaxCategory;
  confidence: number;
  reason: string;
}

// ============================================================================
// FAX RECORD INTERFACES
// ============================================================================

export interface FaxRecord {
  id: number;
  filename: string;
  status: FaxStatus;

  // AI categorization
  ai_category: FaxCategory | null;
  ai_confidence: number | null;
  ai_reason: string | null;
  ai_sub_category: FaxSubCategory | null;

  // Final categorization
  final_category: FaxCategory | null;
  final_sub_category: FaxSubCategory | null;
  was_overridden: boolean;

  // Document info
  text_length: number;
  page_count: number;
  summary: string | null;

  // Quality & sentiment
  quality_score: QualityScore | null;
  sentiment: SentimentType | null;

  // Detected info
  detected_patient_name: string | null;
  detected_sender_facility: string | null;
  suggested_department: string | null;

  // Compliance
  contains_phi: boolean;
  detected_language: string;

  // Duplicate detection
  is_duplicate: boolean;

  // Workflow
  tags: string[] | null;
  assigned_to: string | null;
  due_date: string | null;
  escalated: boolean;

  // Urgency
  is_urgent: boolean;
  priority_score: number;

  // Timestamps
  received_at: string;
  processed_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
}

export interface FaxDetail extends FaxRecord {
  raw_text: string | null;
  original_path: string;
  override_reason: string | null;
  urgency_reason: string | null;

  // AI extraction results
  extracted_entities: ExtractedEntity[] | null;
  key_dates: ExtractedDate[] | null;
  action_items: ActionItem[] | null;
  keywords: string[] | null;
  alternative_categories: AlternativeCategory[] | null;

  // Patient/Sender details
  detected_patient_dob: string | null;
  detected_patient_mrn: string | null;
  detected_sender_name: string | null;
  detected_sender_fax: string | null;

  // Quality details
  quality_issues: string[] | null;
  ocr_confidence: number | null;
  tone_indicators: string[] | null;

  // Duplicate info
  similar_fax_ids: number[] | null;
  duplicate_of_id: number | null;

  // Routing
  suggested_recipient: string | null;
  routing_confidence: number | null;

  // Compliance
  phi_types_detected: string[] | null;
  requires_encryption: boolean;
  needs_translation: boolean;

  // Processing info
  processing_time_ms: number | null;
  internal_notes: string | null;
}

// ============================================================================
// QUEUE & SUMMARY INTERFACES
// ============================================================================

export interface QueueSummary {
  pending_review: number;
  urgent_count: number;
  today_received: number;
  today_processed: number;
  avg_processing_time_minutes: number | null;

  // Enhanced metrics
  flagged_count: number;
  escalated_count: number;
  overdue_count: number;
  assigned_to_me: number;
  high_priority_count: number;
  low_quality_count: number;
  category_pending: Record<string, number> | null;
}

export interface WatcherStatus {
  is_running: boolean;
  watch_folder: string;
  files_in_queue: number;
  last_scan_at: string | null;
  errors: string[];
  currently_processing_file: string | null;

  // Enhanced metrics
  total_processed_today: number;
  total_failed_today: number;
  avg_file_size_kb: number | null;
  supported_formats: string[];
}

// ============================================================================
// STATISTICS INTERFACES
// ============================================================================

export interface CategoryAccuracy {
  category: string;
  total_predictions: number;
  correct_predictions: number;
  accuracy_rate: number;
  avg_confidence: number;
  override_rate: number;
}

export interface FaxStats {
  total_faxes: number;
  pending: number;
  categorized: number;
  approved: number;
  overridden: number;
  processed: number;
  flagged: number;
  archived: number;
  auto_approved: number;

  category_counts: Record<string, number>;
  total_reviewed: number;
  accuracy_rate: number;
  category_accuracy: CategoryAccuracy[] | null;

  processed_today: number;
  processed_this_week: number;

  // Performance metrics
  avg_processing_time_ms: number | null;
  avg_confidence_score: number | null;
  high_confidence_rate: number | null;
  duplicate_detected_count: number;
  urgent_count: number;

  // Quality metrics
  quality_distribution: Record<string, number> | null;
  phi_detected_count: number;
  needs_translation_count: number;
}

// ============================================================================
// SETTINGS INTERFACES
// ============================================================================

export interface FaxSettings {
  watch_folder: string;
  auto_process: boolean;
  require_review: boolean;
  confidence_threshold: number;

  // Feature toggles
  enable_duplicate_detection: boolean;
  duplicate_similarity_threshold: number;
  enable_phi_detection: boolean;
  enable_entity_extraction: boolean;
  enable_sentiment_analysis: boolean;
  enable_quality_scoring: boolean;
  enable_routing_suggestions: boolean;

  // Workflow settings
  default_language: string;
  sla_hours: number;
  auto_escalate_after_hours: number | null;
  auto_archive_after_days: number;
  max_retry_count: number;
}

export interface FaxSettingsUpdate {
  watch_folder?: string;
  auto_process?: boolean;
  require_review?: boolean;
  confidence_threshold?: number;
  enable_duplicate_detection?: boolean;
  duplicate_similarity_threshold?: number;
  enable_phi_detection?: boolean;
  enable_entity_extraction?: boolean;
  enable_sentiment_analysis?: boolean;
  enable_quality_scoring?: boolean;
  enable_routing_suggestions?: boolean;
  default_language?: string;
  sla_hours?: number;
  auto_escalate_after_hours?: number;
  auto_archive_after_days?: number;
  max_retry_count?: number;
}

// ============================================================================
// ROUTING RULES
// ============================================================================

export interface RoutingCondition {
  field: string; // category, sender, keywords, priority, etc.
  operator: string; // equals, contains, greater_than, etc.
  value: any;
}

export interface FaxRoutingRule {
  id?: number;
  name: string;
  description?: string;
  is_active: boolean;
  priority: number;
  conditions: RoutingCondition[];
  route_to_department?: string;
  route_to_user?: string;
  auto_approve: boolean;
  add_tags?: string[];
  set_priority?: number;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// SEARCH & FILTER INTERFACES
// ============================================================================

export interface FaxSearchRequest {
  query?: string;
  categories?: FaxCategory[];
  statuses?: FaxStatus[];
  date_from?: string;
  date_to?: string;
  is_urgent?: boolean;
  assigned_to?: string;
  has_phi?: boolean;
  quality_scores?: QualityScore[];
  min_confidence?: number;
  max_confidence?: number;
  tags?: string[];
  sender_facility?: string;
  patient_name?: string;
  include_archived?: boolean;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface FaxSearchResponse {
  total: number;
  results: FaxRecord[];
  facets?: Record<string, Record<string, number>>;
}

// ============================================================================
// REVIEW & FEEDBACK INTERFACES
// ============================================================================

export interface FaxReviewRequest {
  action: "approve" | "override" | "flag" | "escalate" | "assign";
  category?: FaxCategory;
  sub_category?: FaxSubCategory;
  reason?: string;
  reviewer?: string;
  assign_to?: string;
  tags?: string[];
  notes?: string;
}

export interface FaxReviewResponse {
  id: number;
  status: FaxStatus;
  final_category: FaxCategory | null;
  was_overridden: boolean;
  message: string;
}

export interface FaxBatchReviewRequest {
  fax_ids: number[];
  action: "approve" | "override" | "flag" | "archive" | "assign";
  category?: FaxCategory;
  reason?: string;
  reviewer?: string;
  assign_to?: string;
  tags?: string[];
}

export interface FaxFeedback {
  fax_id: number;
  correct_category: FaxCategory;
  correct_sub_category?: FaxSubCategory;
  feedback_text?: string;
  feedback_type?: "correction" | "suggestion" | "complaint";
  submitted_by?: string;
  was_helpful?: boolean;
  confidence_was_accurate?: boolean;
  extraction_quality?: number; // 1-5
  summary_quality?: number; // 1-5
}

// ============================================================================
// ANALYTICS INTERFACES
// ============================================================================

export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface FaxAnalytics {
  daily_volume: TimeSeriesDataPoint[];
  category_distribution: Record<string, number>;
  accuracy_trend: TimeSeriesDataPoint[];
  processing_time_trend: TimeSeriesDataPoint[];
  top_senders: { name: string; count: number }[];
  top_categories: { category: string; count: number }[];
  unusual_patterns?: string[];
  predicted_volume_next_week?: number;
  predicted_urgent_rate?: number;
}

// ============================================================================
// AUDIT LOG INTERFACES
// ============================================================================

export interface FaxAuditLogEntry {
  id: number;
  fax_id: number;
  action: string;
  performed_by: string | null;
  ip_address: string | null;
  details: Record<string, any> | null;
  created_at: string;
}

// ============================================================================
// EXPORT INTERFACES
// ============================================================================

export interface FaxExportRequest {
  fax_ids?: number[];
  categories?: FaxCategory[];
  statuses?: FaxStatus[];
  date_from?: string;
  date_to?: string;
  format: "csv" | "xlsx" | "pdf";
  include_text?: boolean;
  include_summary?: boolean;
}

export interface FaxExportResponse {
  download_url: string;
  filename: string;
  record_count: number;
  expires_at: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get confidence level label based on score
 */
export function getConfidenceLabel(confidence: number | null): string {
  if (confidence === null) return "Unknown";
  if (confidence >= 0.9) return "Very High";
  if (confidence >= 0.75) return "High";
  if (confidence >= 0.6) return "Medium";
  if (confidence >= 0.4) return "Low";
  return "Very Low";
}

/**
 * Get confidence color class based on score
 */
export function getConfidenceColor(confidence: number | null): string {
  if (confidence === null) return "text-gray-500";
  if (confidence >= 0.9) return "text-green-600";
  if (confidence >= 0.75) return "text-emerald-600";
  if (confidence >= 0.6) return "text-yellow-600";
  if (confidence >= 0.4) return "text-orange-600";
  return "text-red-600";
}

/**
 * Format priority score as label
 */
export function getPriorityLabel(score: number): string {
  if (score >= 90) return "Critical";
  if (score >= 75) return "High";
  if (score >= 50) return "Medium";
  if (score >= 25) return "Low";
  return "Normal";
}

/**
 * Get priority badge color
 */
export function getPriorityColor(score: number): string {
  if (score >= 90) return "bg-red-100 text-red-700 border-red-200";
  if (score >= 75) return "bg-orange-100 text-orange-700 border-orange-200";
  if (score >= 50) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  if (score >= 25) return "bg-blue-100 text-blue-700 border-blue-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
}

/**
 * Format processing time for display
 */
export function formatProcessingTime(ms: number | null): string {
  if (ms === null) return "N/A";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

/**
 * Check if a fax needs attention (overdue, escalated, etc.)
 */
export function needsAttention(fax: FaxRecord): boolean {
  if (fax.escalated) return true;
  if (fax.status === "flagged") return true;
  if (fax.due_date && new Date(fax.due_date) < new Date()) return true;
  if (fax.priority_score >= 75) return true;
  return false;
}

/**
 * Get appropriate icon name for a category
 */
export function getCategoryIcon(category: FaxCategory): string {
  const icons: Record<FaxCategory, string> = {
    discharge_summary: "file-text",
    inpatient_document: "clipboard",
    census: "users",
    junk_fax: "trash-2",
    lab_results: "flask-conical",
    prescription_refill: "pill",
    referral: "arrow-right-circle",
    insurance_auth: "shield-check",
    medical_records_request: "folder-search",
    prior_authorization: "check-square",
    appointment_related: "calendar",
    billing_inquiry: "receipt",
    other_clinical: "file-plus",
  };
  return icons[category] || "file";
}
