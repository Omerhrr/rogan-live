"""
ROGAN LIVE - Backend Configuration
Stack: FastAPI + SQLAlchemy + Redis + SlowAPI
"""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Rogan Live"
    APP_VERSION: str = "3.2-web2.5-final"
    DEBUG: bool = True
    API_PREFIX: str = "/api/v1"

    # Database - SQLite for dev, PostgreSQL for production
    DATABASE_URL: str = "sqlite:////home/z/my-project/rogan-live/backend/rogan_live.db"
    # DATABASE_URL: str = "postgresql://user:pass@localhost:5432/rogan_live"  # Production

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_ENABLED: bool = False  # Set True when Redis is available

    # JWT Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", "rogan-live-super-secret-key-change-in-prod")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60 * 24 * 7  # 7 days

    # Google OAuth
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")

    # CORS
    CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

    # MediaMTX
    MEDIAMTX_HOST: str = os.getenv("MEDIAMTX_HOST", "localhost")
    MEDIAMTX_API_PORT: int = 9997
    MEDIAMTX_RTMP_PORT: int = 1935
    MEDIAMTX_HLS_PORT: int = 8888
    MEDIAMTX_WEBRTC_PORT: int = 8889

    # Economy
    ROGAN_TK_PEG: float = 1.0  # 1 ROGAN = 1 TK
    PLATFORM_FEE_RATE: float = 0.10  # 10% Phase 1
    WITHDRAW_FEE_RATE: float = 0.02  # 2%

    # Rate Limiting
    RATE_LIMIT_GIFTS: str = "10/second"
    RATE_LIMIT_DM: str = "5/second"
    RATE_LIMIT_AUTH: str = "5/minute"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
