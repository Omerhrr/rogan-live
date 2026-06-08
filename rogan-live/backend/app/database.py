"""
ROGAN LIVE - Database Setup (SQLAlchemy)
Supports SQLite for development, PostgreSQL for production.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Use hardcoded path to avoid env var conflicts from parent .env
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "rogan_live.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

# SQLite needs check_same_thread=False for FastAPI async compatibility
connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency for getting DB sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
