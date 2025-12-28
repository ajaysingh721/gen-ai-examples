"""
Advanced AI services for fax categorization and analysis.
Includes entity extraction, quality assessment, duplicate detection, and more.
"""

import re
import json
from datetime import datetime
from typing import Optional, Tuple, List, Dict, Any
from difflib import SequenceMatcher

from app.services.llm_service import generate_text
from app.schemas.fax import (
    FaxCategory, FaxSubCategory, QualityScore, SentimentType,
    ExtractedEntity, ExtractedDate, ActionItem, AlternativeCategory
)


# ============================================================================
# ENHANCED CATEGORIZATION
# ============================================================================

def categorize_fax_enhanced(text: str) -> Dict[str, Any]:
    """
    Enhanced LLM-based categorization with sub-categories and alternatives.
    Returns comprehensive categorization results.
    """
    if not text or len(text.strip()) < 50:
        return {
            "category": FaxCategory.junk_fax,
            "confidence": 0.3,
            "reason": "Insufficient text to categorize.",
            "sub_category": None,
            "alternatives": []
        }

    snippet = text[:5000]  # Increased context window

    prompt = f"""You are a clinical documentation classifier for a healthcare organization. 
Analyze the following fax document and provide a comprehensive classification.

Available PRIMARY categories:
- discharge_summary: Patient discharge summaries from hospital stays
- inpatient_document: Inpatient progress notes, H&P, consults, operative notes
- census: Patient census lists with bed numbers, units, or service names
- lab_results: Laboratory test results, blood work, imaging reports
- prescription_refill: Medication refill requests
- referral: Patient referrals to specialists or other facilities
- insurance_auth: Insurance authorization requests or responses
- medical_records_request: Requests for medical records
- prior_authorization: Prior authorization for procedures/medications
- appointment_related: Appointment scheduling, confirmations, cancellations
- billing_inquiry: Billing questions or statements
- other_clinical: Other clinical documents that don't fit above
- junk_fax: Non-clinical documents, scanning errors, spam, or advertisements

Available SUB-CATEGORIES (optional, based on primary):
- For discharge_summary: discharge_instructions, discharge_medications, discharge_follow_up
- For inpatient_document: progress_note, h_and_p, consultation, operative_note
- For lab_results: blood_work, imaging, pathology

Provide your analysis in this exact JSON format:
{{
    "primary_category": "category_name",
    "primary_confidence": 0.85,
    "primary_reason": "Brief explanation for primary choice",
    "sub_category": "sub_category_name or null",
    "sub_confidence": 0.80,
    "alternatives": [
        {{"category": "second_choice", "confidence": 0.60, "reason": "Why this could also apply"}},
        {{"category": "third_choice", "confidence": 0.30, "reason": "Why this could also apply"}}
    ]
}}

Fax Document:
{snippet}
"""

    raw = generate_text(prompt, max_tokens=500).strip()
    
    # Default response
    result = {
        "category": FaxCategory.junk_fax,
        "confidence": 0.5,
        "reason": "Unable to determine category",
        "sub_category": None,
        "sub_confidence": None,
        "alternatives": []
    }

    match = re.search(r"\{.*\}", raw, flags=re.DOTALL)
    if match:
        try:
            payload = json.loads(match.group(0))
            
            # Parse primary category
            cat_str = str(payload.get("primary_category", "")).strip().lower()
            result["confidence"] = _clamp_confidence(payload.get("primary_confidence", 0.5))
            result["reason"] = str(payload.get("primary_reason", "")).strip()
            
            # Map to enum
            if hasattr(FaxCategory, cat_str):
                result["category"] = FaxCategory[cat_str]
            
            # Parse sub-category
            sub_str = payload.get("sub_category")
            if sub_str and hasattr(FaxSubCategory, sub_str):
                result["sub_category"] = FaxSubCategory[sub_str]
                result["sub_confidence"] = _clamp_confidence(payload.get("sub_confidence"))
            
            # Parse alternatives
            alts = payload.get("alternatives", [])
            for alt in alts[:3]:  # Max 3 alternatives
                alt_cat = str(alt.get("category", "")).strip().lower()
                if hasattr(FaxCategory, alt_cat):
                    result["alternatives"].append(AlternativeCategory(
                        category=FaxCategory[alt_cat],
                        confidence=_clamp_confidence(alt.get("confidence", 0.3)),
                        reason=str(alt.get("reason", ""))[:200]
                    ))
                    
        except (json.JSONDecodeError, KeyError, AttributeError):
            pass

    return result


# ============================================================================
# ENTITY EXTRACTION
# ============================================================================

def extract_entities(text: str) -> List[ExtractedEntity]:
    """
    Extract named entities from fax content using LLM.
    Entities include: patients, doctors, facilities, medications, diagnoses, etc.
    """
    if not text or len(text.strip()) < 50:
        return []

    snippet = text[:4000]

    prompt = f"""Extract all relevant named entities from this medical fax document.

Categories to extract:
- patient: Patient names
- doctor: Doctor/physician names
- facility: Hospital, clinic, or facility names
- medication: Medication names
- diagnosis: Medical diagnoses or conditions
- procedure: Medical procedures
- phone: Phone numbers
- fax: Fax numbers
- address: Physical addresses

Return as JSON array:
[
    {{"type": "patient", "value": "John Smith", "confidence": 0.95}},
    {{"type": "medication", "value": "Metformin 500mg", "confidence": 0.90}}
]

Document:
{snippet}

JSON entities:"""

    raw = generate_text(prompt, max_tokens=600).strip()
    entities = []

    # Try to parse JSON array
    match = re.search(r"\[.*\]", raw, flags=re.DOTALL)
    if match:
        try:
            items = json.loads(match.group(0))
            for item in items[:20]:  # Limit to 20 entities
                entities.append(ExtractedEntity(
                    entity_type=str(item.get("type", "unknown")),
                    value=str(item.get("value", ""))[:256],
                    confidence=_clamp_confidence(item.get("confidence", 0.7)),
                    source_text=str(item.get("source", ""))[:100] if item.get("source") else None
                ))
        except (json.JSONDecodeError, KeyError):
            pass

    return entities


def extract_patient_info(text: str) -> Dict[str, Optional[str]]:
    """
    Extract specific patient identification information.
    """
    if not text or len(text.strip()) < 50:
        return {"name": None, "dob": None, "mrn": None}

    snippet = text[:3000]

    prompt = f"""Extract patient identification information from this medical document.

Return JSON with these exact fields (use null if not found):
{{
    "patient_name": "Full Name or null",
    "date_of_birth": "MM/DD/YYYY or null",
    "mrn": "Medical Record Number or null"
}}

Document:
{snippet}

JSON:"""

    raw = generate_text(prompt, max_tokens=150).strip()
    result = {"name": None, "dob": None, "mrn": None}

    match = re.search(r"\{.*\}", raw, flags=re.DOTALL)
    if match:
        try:
            data = json.loads(match.group(0))
            result["name"] = data.get("patient_name") if data.get("patient_name") != "null" else None
            result["dob"] = data.get("date_of_birth") if data.get("date_of_birth") != "null" else None
            result["mrn"] = data.get("mrn") if data.get("mrn") != "null" else None
        except (json.JSONDecodeError, KeyError):
            pass

    return result


def extract_sender_info(text: str) -> Dict[str, Optional[str]]:
    """
    Extract sender/source information from fax header or content.
    """
    if not text:
        return {"name": None, "fax": None, "facility": None}

    # Focus on beginning of document (usually where fax header is)
    snippet = text[:2000]

    prompt = f"""Extract sender information from this fax document header/content.

Return JSON with these exact fields (use null if not found):
{{
    "sender_name": "Person or department name or null",
    "sender_fax": "Fax number or null",
    "sender_facility": "Organization/facility name or null"
}}

Document:
{snippet}

JSON:"""

    raw = generate_text(prompt, max_tokens=150).strip()
    result = {"name": None, "fax": None, "facility": None}

    match = re.search(r"\{.*\}", raw, flags=re.DOTALL)
    if match:
        try:
            data = json.loads(match.group(0))
            result["name"] = data.get("sender_name") if data.get("sender_name") != "null" else None
            result["fax"] = data.get("sender_fax") if data.get("sender_fax") != "null" else None
            result["facility"] = data.get("sender_facility") if data.get("sender_facility") != "null" else None
        except (json.JSONDecodeError, KeyError):
            pass

    return result


# ============================================================================
# DATE AND ACTION EXTRACTION
# ============================================================================

def extract_key_dates(text: str) -> List[ExtractedDate]:
    """
    Extract important dates from the document.
    """
    if not text or len(text.strip()) < 50:
        return []

    snippet = text[:3000]

    prompt = f"""Extract all important dates from this medical document.

Date types to look for:
- admission: Hospital admission date
- discharge: Hospital discharge date
- appointment: Scheduled appointments
- follow_up: Follow-up visit dates
- procedure: Procedure/surgery dates
- deadline: Any deadlines mentioned
- expiration: Authorization expiration, etc.

Return JSON array:
[
    {{"type": "discharge", "date": "01/15/2024", "is_deadline": false, "context": "Patient discharged on..."}}
]

Document:
{snippet}

JSON dates:"""

    raw = generate_text(prompt, max_tokens=400).strip()
    dates = []

    match = re.search(r"\[.*\]", raw, flags=re.DOTALL)
    if match:
        try:
            items = json.loads(match.group(0))
            for item in items[:10]:  # Limit to 10 dates
                dates.append(ExtractedDate(
                    date_type=str(item.get("type", "other")),
                    date_value=str(item.get("date", ""))[:32],
                    is_deadline=bool(item.get("is_deadline", False)),
                    context=str(item.get("context", ""))[:200] if item.get("context") else None
                ))
        except (json.JSONDecodeError, KeyError):
            pass

    return dates


def extract_action_items(text: str) -> List[ActionItem]:
    """
    Extract required actions or follow-up items from the document.
    """
    if not text or len(text.strip()) < 50:
        return []

    snippet = text[:3000]

    prompt = f"""Identify any required actions or follow-up items from this medical document.

Look for:
- Tasks that need to be completed
- Follow-up appointments to schedule
- Tests or procedures to order
- Referrals to make
- Medications to prescribe or refill
- Phone calls to make
- Documents to send

Return JSON array:
[
    {{"action": "Schedule follow-up appointment with cardiology", "priority": "high", "due_date": "within 1 week"}}
]

Priority levels: low, normal, high, urgent

Document:
{snippet}

JSON actions:"""

    raw = generate_text(prompt, max_tokens=400).strip()
    actions = []

    match = re.search(r"\[.*\]", raw, flags=re.DOTALL)
    if match:
        try:
            items = json.loads(match.group(0))
            for item in items[:10]:  # Limit to 10 actions
                actions.append(ActionItem(
                    action=str(item.get("action", ""))[:256],
                    priority=str(item.get("priority", "normal")).lower(),
                    due_date=str(item.get("due_date", ""))[:64] if item.get("due_date") else None,
                    assigned_to=str(item.get("assigned_to", ""))[:128] if item.get("assigned_to") else None,
                    completed=False
                ))
        except (json.JSONDecodeError, KeyError):
            pass

    return actions


# ============================================================================
# QUALITY ASSESSMENT
# ============================================================================

def assess_document_quality(text: str, ocr_confidence: Optional[float] = None) -> Dict[str, Any]:
    """
    Assess the quality of the scanned/OCR'd document.
    """
    result = {
        "quality_score": QualityScore.good,
        "issues": [],
        "ocr_confidence": ocr_confidence
    }

    if not text:
        return {
            "quality_score": QualityScore.illegible,
            "issues": ["No text extracted from document"],
            "ocr_confidence": 0.0
        }

    text_length = len(text.strip())
    
    # Check for common OCR issues
    issues = []
    
    # Very short text might indicate poor scan
    if text_length < 100:
        issues.append("Very short text - possible scanning issue")
    
    # Check for excessive special characters (OCR garbage)
    special_char_ratio = len(re.findall(r'[^\w\s.,;:!?\'-]', text)) / max(text_length, 1)
    if special_char_ratio > 0.15:
        issues.append("High ratio of special characters - possible OCR errors")
    
    # Check for repeated characters (scan lines)
    if re.search(r'(.)\1{10,}', text):
        issues.append("Repeated character patterns detected - possible scan artifacts")
    
    # Check for very long "words" (concatenated text)
    long_words = re.findall(r'\b\w{30,}\b', text)
    if len(long_words) > 3:
        issues.append("Unusually long words detected - possible text concatenation issues")
    
    # Check word to gibberish ratio using simple heuristic
    words = text.split()
    if words:
        # Words with good vowel/consonant mix are likely real words
        likely_real = sum(1 for w in words if _is_likely_word(w))
        real_word_ratio = likely_real / len(words)
        if real_word_ratio < 0.5:
            issues.append("Low proportion of recognizable words")
    
    # Determine quality score
    issue_count = len(issues)
    if issue_count == 0:
        result["quality_score"] = QualityScore.excellent
    elif issue_count == 1:
        result["quality_score"] = QualityScore.good
    elif issue_count == 2:
        result["quality_score"] = QualityScore.fair
    elif issue_count <= 3:
        result["quality_score"] = QualityScore.poor
    else:
        result["quality_score"] = QualityScore.illegible

    result["issues"] = issues
    return result


def _is_likely_word(word: str) -> bool:
    """Simple heuristic to check if a string is likely a real word."""
    if len(word) < 2:
        return True
    # Check for vowels (most real English words have vowels)
    has_vowel = bool(re.search(r'[aeiouAEIOU]', word))
    # Check reasonable length
    reasonable_length = len(word) <= 20
    # Check not all same character
    not_repeated = len(set(word.lower())) > 1
    return has_vowel and reasonable_length and not_repeated


# ============================================================================
# SENTIMENT/URGENCY ANALYSIS
# ============================================================================

def analyze_sentiment(text: str) -> Dict[str, Any]:
    """
    Analyze the sentiment and urgency indicators in the document.
    """
    if not text or len(text.strip()) < 50:
        return {
            "sentiment": SentimentType.neutral,
            "is_urgent": False,
            "priority_score": 0,
            "indicators": [],
            "urgency_reason": None
        }

    snippet = text[:3000]
    text_lower = text.lower()

    # Check for urgent keywords
    urgent_patterns = {
        "urgent": 85,
        "asap": 85,
        "immediately": 90,
        "emergency": 95,
        "stat": 95,
        "critical": 90,
        "time-sensitive": 80,
        "rush": 75,
        "priority": 70,
        "expedite": 75,
        "life-threatening": 100,
        "code": 80,
        "911": 100,
    }

    indicators = []
    max_priority = 0
    
    for keyword, priority in urgent_patterns.items():
        if keyword in text_lower:
            indicators.append(keyword)
            max_priority = max(max_priority, priority)

    # Determine sentiment
    sentiment = SentimentType.neutral
    is_urgent = False
    urgency_reason = None

    if max_priority >= 90:
        sentiment = SentimentType.critical
        is_urgent = True
        urgency_reason = f"Critical keywords detected: {', '.join(indicators[:3])}"
    elif max_priority >= 75:
        sentiment = SentimentType.urgent
        is_urgent = True
        urgency_reason = f"Urgent keywords detected: {', '.join(indicators[:3])}"
    elif max_priority >= 50:
        sentiment = SentimentType.routine
    else:
        # Check if it's purely informational
        info_keywords = ["fyi", "for your information", "for your records", "no action required"]
        if any(kw in text_lower for kw in info_keywords):
            sentiment = SentimentType.informational

    return {
        "sentiment": sentiment,
        "is_urgent": is_urgent,
        "priority_score": max_priority,
        "indicators": indicators[:5],
        "urgency_reason": urgency_reason
    }


# ============================================================================
# DUPLICATE DETECTION
# ============================================================================

def calculate_text_similarity(text1: str, text2: str) -> float:
    """
    Calculate similarity between two documents.
    Uses a combination of techniques for accuracy.
    """
    if not text1 or not text2:
        return 0.0

    # Normalize texts
    norm1 = _normalize_text(text1)
    norm2 = _normalize_text(text2)

    # Use SequenceMatcher for similarity
    similarity = SequenceMatcher(None, norm1[:5000], norm2[:5000]).ratio()
    
    return similarity


def _normalize_text(text: str) -> str:
    """Normalize text for comparison."""
    # Lowercase
    text = text.lower()
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove common OCR artifacts
    text = re.sub(r'[^\w\s]', '', text)
    return text.strip()


def find_similar_documents(
    text: str, 
    existing_texts: List[Tuple[int, str]], 
    threshold: float = 0.85
) -> List[Tuple[int, float]]:
    """
    Find documents similar to the given text.
    Returns list of (fax_id, similarity_score) tuples.
    """
    similar = []
    
    for fax_id, existing_text in existing_texts:
        similarity = calculate_text_similarity(text, existing_text)
        if similarity >= threshold:
            similar.append((fax_id, similarity))
    
    # Sort by similarity descending
    similar.sort(key=lambda x: x[1], reverse=True)
    return similar[:5]  # Return top 5 matches


# ============================================================================
# PHI DETECTION
# ============================================================================

def detect_phi(text: str) -> Dict[str, Any]:
    """
    Detect Protected Health Information (PHI) in the document.
    """
    if not text:
        return {"contains_phi": False, "phi_types": [], "requires_encryption": False}

    phi_types = []
    
    # SSN pattern
    if re.search(r'\b\d{3}[-.]?\d{2}[-.]?\d{4}\b', text):
        phi_types.append("SSN")
    
    # Date of birth patterns
    if re.search(r'\b(DOB|Date of Birth|Birth Date)[:\s]*\d', text, re.IGNORECASE):
        phi_types.append("DOB")
    
    # Medical Record Number
    if re.search(r'\b(MRN|Medical Record|Patient ID|Chart)[:\s#]*\d', text, re.IGNORECASE):
        phi_types.append("MRN")
    
    # Phone numbers
    if re.search(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', text):
        phi_types.append("Phone")
    
    # Email addresses
    if re.search(r'\b[\w.-]+@[\w.-]+\.\w+\b', text):
        phi_types.append("Email")
    
    # Physical addresses (simplified detection)
    if re.search(r'\b\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b', text, re.IGNORECASE):
        phi_types.append("Address")
    
    # Account numbers
    if re.search(r'\b(Account|Acct)[:\s#]*\d', text, re.IGNORECASE):
        phi_types.append("Account")
    
    # Insurance ID
    if re.search(r'\b(Insurance|Policy|Member)\s*(ID|Number|#)[:\s]*[\w\d]', text, re.IGNORECASE):
        phi_types.append("Insurance_ID")

    contains_phi = len(phi_types) > 0
    requires_encryption = len(phi_types) >= 3 or "SSN" in phi_types

    return {
        "contains_phi": contains_phi,
        "phi_types": phi_types,
        "requires_encryption": requires_encryption
    }


# ============================================================================
# LANGUAGE DETECTION
# ============================================================================

def detect_language(text: str) -> Dict[str, Any]:
    """
    Detect the primary language of the document.
    """
    if not text or len(text.strip()) < 20:
        return {"language": "en", "needs_translation": False}

    # Simple language detection based on common words
    english_indicators = ["the", "and", "is", "are", "was", "for", "that", "with", "patient"]
    spanish_indicators = ["el", "la", "de", "que", "en", "es", "por", "con", "paciente"]
    french_indicators = ["le", "la", "de", "et", "est", "pour", "avec", "patient"]

    text_lower = text.lower()
    words = set(text_lower.split())

    en_count = sum(1 for w in english_indicators if w in words)
    es_count = sum(1 for w in spanish_indicators if w in words)
    fr_count = sum(1 for w in french_indicators if w in words)

    if es_count > en_count and es_count > fr_count:
        return {"language": "es", "needs_translation": True}
    elif fr_count > en_count and fr_count > es_count:
        return {"language": "fr", "needs_translation": True}
    else:
        return {"language": "en", "needs_translation": False}


# ============================================================================
# ROUTING SUGGESTIONS
# ============================================================================

def suggest_routing(
    category: FaxCategory,
    text: str,
    entities: List[ExtractedEntity],
    is_urgent: bool
) -> Dict[str, Any]:
    """
    Suggest department and recipient routing based on document analysis.
    """
    # Default routing based on category
    routing_map = {
        FaxCategory.discharge_summary: ("Medical Records", "records@"),
        FaxCategory.inpatient_document: ("Medical Records", "records@"),
        FaxCategory.census: ("Admissions", "admissions@"),
        FaxCategory.lab_results: ("Laboratory", "lab@"),
        FaxCategory.prescription_refill: ("Pharmacy", "pharmacy@"),
        FaxCategory.referral: ("Referral Coordination", "referrals@"),
        FaxCategory.insurance_auth: ("Prior Auth", "priorauth@"),
        FaxCategory.medical_records_request: ("Medical Records", "records@"),
        FaxCategory.prior_authorization: ("Prior Auth", "priorauth@"),
        FaxCategory.appointment_related: ("Scheduling", "scheduling@"),
        FaxCategory.billing_inquiry: ("Billing", "billing@"),
        FaxCategory.junk_fax: (None, None),
        FaxCategory.other_clinical: ("Clinical Support", "clinical@"),
    }

    dept, recipient_prefix = routing_map.get(category, ("General", "general@"))
    confidence = 0.7  # Base confidence

    # Adjust based on urgency
    if is_urgent:
        dept = "Urgent Care" if category != FaxCategory.junk_fax else dept
        confidence = 0.85

    # Look for specific department mentions in entities
    for entity in entities:
        if entity.entity_type == "facility":
            # Could enhance routing based on facility
            pass

    return {
        "department": dept,
        "recipient": recipient_prefix,
        "confidence": confidence
    }


# ============================================================================
# KEYWORD EXTRACTION
# ============================================================================

def extract_keywords(text: str) -> List[str]:
    """
    Extract relevant keywords for search and indexing.
    """
    if not text or len(text.strip()) < 50:
        return []

    snippet = text[:3000]

    prompt = f"""Extract 5-10 key medical/clinical terms from this document that would be useful for searching.
Focus on: diagnoses, procedures, medications, specialties, and important clinical concepts.

Return as JSON array of strings:
["term1", "term2", "term3"]

Document:
{snippet}

Keywords:"""

    raw = generate_text(prompt, max_tokens=150).strip()
    
    match = re.search(r"\[.*\]", raw, flags=re.DOTALL)
    if match:
        try:
            keywords = json.loads(match.group(0))
            return [str(k)[:50] for k in keywords[:10] if isinstance(k, str)]
        except (json.JSONDecodeError, KeyError):
            pass

    return []


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _clamp_confidence(value: Any, default: float = 0.5) -> float:
    """Clamp confidence value to 0-1 range."""
    if value is None:
        return default
    try:
        return max(0.0, min(1.0, float(value)))
    except (ValueError, TypeError):
        return default


def generate_enhanced_summary(text: str, category: FaxCategory) -> str:
    """
    Generate a category-aware summary of the document.
    """
    if not text or len(text.strip()) < 50:
        return "Insufficient text to summarize."

    snippet = text[:4000]

    # Customize summary prompt based on category
    focus_areas = {
        FaxCategory.discharge_summary: "discharge date, diagnoses, follow-up instructions, medications",
        FaxCategory.inpatient_document: "patient condition, treatment plan, physician recommendations",
        FaxCategory.lab_results: "test types, abnormal results, clinical significance",
        FaxCategory.prescription_refill: "medication name, dosage, refill quantity requested",
        FaxCategory.referral: "referring physician, specialty, reason for referral",
        FaxCategory.insurance_auth: "authorization status, services requested, decision",
    }

    focus = focus_areas.get(category, "main purpose, key information, any required actions")

    prompt = f"""Summarize this {category.value.replace('_', ' ')} fax in 2-3 sentences.
Focus on: {focus}

Document:
{snippet}

Summary:"""

    return generate_text(prompt, max_tokens=200)
