from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Store SQLite file in the backend folder
SQLALCHEMY_DATABASE_URL = "sqlite:///./api/v1/documents.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
