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

    with engine.begin() as conn:
        rows = conn.execute(text("PRAGMA table_info(document_analyses)")).fetchall()
        if not rows:
            # Table doesn't exist yet; create_all() will handle it.
            return

        existing_columns = {row[1] for row in rows}  # row[1] is column name
        if "classification_reason" not in existing_columns:
            conn.execute(
                text(
                    "ALTER TABLE document_analyses ADD COLUMN classification_reason TEXT"
                )
            )
