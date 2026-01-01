from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

# Store SQLite file in the backend folder
SQLALCHEMY_DATABASE_URL = "sqlite:///documents.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def ensure_sqlite_schema() -> None:
    """Apply minimal SQLite migrations for this app.

    We use SQLAlchemy `create_all()` for table creation, but SQLite does not
    automatically add new columns to existing tables. This function performs
    small, safe ALTERs when columns are missing.
    """
    print("Running database migrations...")

    with engine.begin() as conn:
        # Check document_analyses table
        rows = conn.execute(text("PRAGMA table_info(document_analyses)")).fetchall()
        if rows:
            existing_columns = {row[1] for row in rows}  # row[1] is column name
            if "classification_reason" not in existing_columns:
                print("Adding classification_reason to document_analyses...")
                conn.execute(
                    text(
                        "ALTER TABLE document_analyses ADD COLUMN classification_reason TEXT"
                    )
                )
        
        # Check faxes table
        fax_rows = conn.execute(text("PRAGMA table_info(faxes)")).fetchall()
        if fax_rows:
            fax_columns = {row[1] for row in fax_rows}
            print(f"Faxes table has {len(fax_columns)} columns")
            
            # Add missing columns one by one
            if "auto_approved" not in fax_columns:
                print("Adding auto_approved column...")
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN auto_approved BOOLEAN DEFAULT 0 NOT NULL"
                    )
                )
            
            if "priority_score" not in fax_columns:
                print("Adding priority_score column...")
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN priority_score INTEGER DEFAULT 0 NOT NULL"
                    )
                )
            
            if "urgency_reason" not in fax_columns:
                print("Adding urgency_reason column...")
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN urgency_reason TEXT"
                    )
                )
            
            if "file_hash" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN file_hash VARCHAR(64)"
                    )
                )
            
            if "file_size_bytes" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN file_size_bytes INTEGER"
                    )
                )
            
            if "ai_sub_category" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN ai_sub_category VARCHAR(64)"
                    )
                )
            
            if "ai_sub_confidence" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN ai_sub_confidence FLOAT"
                    )
                )
            
            if "alternative_categories" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN alternative_categories JSON"
                    )
                )
            
            if "final_sub_category" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN final_sub_category VARCHAR(64)"
                    )
                )
            
            if "extracted_entities" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN extracted_entities JSON"
                    )
                )
            
            if "key_dates" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN key_dates JSON"
                    )
                )
            
            if "action_items" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN action_items JSON"
                    )
                )
            
            if "keywords" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN keywords JSON"
                    )
                )
            
            if "detected_patient_name" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN detected_patient_name VARCHAR(256)"
                    )
                )
            
            if "detected_patient_dob" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN detected_patient_dob VARCHAR(32)"
                    )
                )
            
            if "detected_patient_mrn" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN detected_patient_mrn VARCHAR(64)"
                    )
                )
            
            if "detected_sender_name" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN detected_sender_name VARCHAR(256)"
                    )
                )
            
            if "detected_sender_fax" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN detected_sender_fax VARCHAR(32)"
                    )
                )
            
            if "detected_sender_facility" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN detected_sender_facility VARCHAR(256)"
                    )
                )
            
            if "quality_score" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN quality_score VARCHAR(32)"
                    )
                )
            
            if "quality_issues" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN quality_issues JSON"
                    )
                )
            
            if "ocr_confidence" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN ocr_confidence FLOAT"
                    )
                )
            
            if "sentiment" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN sentiment VARCHAR(32)"
                    )
                )
            
            if "tone_indicators" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN tone_indicators JSON"
                    )
                )
            
            if "similar_fax_ids" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN similar_fax_ids JSON"
                    )
                )
            
            if "is_duplicate" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN is_duplicate BOOLEAN DEFAULT 0 NOT NULL"
                    )
                )
            
            if "duplicate_of_id" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN duplicate_of_id INTEGER"
                    )
                )
            
            if "suggested_department" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN suggested_department VARCHAR(128)"
                    )
                )
            
            if "suggested_recipient" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN suggested_recipient VARCHAR(256)"
                    )
                )
            
            if "routing_confidence" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN routing_confidence FLOAT"
                    )
                )
            
            if "contains_phi" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN contains_phi BOOLEAN DEFAULT 0 NOT NULL"
                    )
                )
            
            if "phi_types_detected" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN phi_types_detected JSON"
                    )
                )
            
            if "requires_encryption" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN requires_encryption BOOLEAN DEFAULT 0 NOT NULL"
                    )
                )
            
            if "detected_language" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN detected_language VARCHAR(16) DEFAULT 'en' NOT NULL"
                    )
                )
            
            if "needs_translation" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN needs_translation BOOLEAN DEFAULT 0 NOT NULL"
                    )
                )
            
            if "processing_time_ms" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN processing_time_ms INTEGER"
                    )
                )
            
            if "retry_count" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN retry_count INTEGER DEFAULT 0 NOT NULL"
                    )
                )
            
            if "last_error" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN last_error TEXT"
                    )
                )
            
            if "assigned_to" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN assigned_to VARCHAR(256)"
                    )
                )
            
            if "due_date" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN due_date DATETIME"
                    )
                )
            
            if "escalated" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN escalated BOOLEAN DEFAULT 0 NOT NULL"
                    )
                )
            
            if "escalation_reason" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN escalation_reason TEXT"
                    )
                )
            
            if "tags" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN tags JSON"
                    )
                )
            
            if "internal_notes" not in fax_columns:
                conn.execute(
                    text(
                        "ALTER TABLE faxes ADD COLUMN internal_notes TEXT"
                    )
                )
