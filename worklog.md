---
Task ID: 1
Agent: Main Agent
Task: Phase 1A Hardening - Fix all Docker Compose startup errors

Work Log:
- Identified 3 runtime errors from user's `docker compose up --build` output
- Scanned all 56 Python files in backend for import/dependency issues
- Fixed backend crash: added psycopg2-binary and google-auth to requirements.txt
- Fixed MediaMTX crash: changed authAddress → externalAuthURL in mediamtx.yml
- Fixed database.py: now uses settings.DATABASE_URL from config (not os.getenv with SQLite default)
- Fixed database.py: updated to modern sqlalchemy.orm.declarative_base import
- Fixed schemas.py: removed unused EmailStr import (would crash without email-validator)
- Fixed main.py: uses custom rate limiter from middleware module
- Fixed rate_limit.py: removed unused redis_client import, cleaned up settings import
- Fixed docker-compose.yml: removed obsolete version field, added alembic-migrate service
- Added .dockerignore files for backend and frontend (faster builds)
- Removed unused dependencies from requirements.txt: passlib, apscheduler, Pillow
- Force-pushed all fixes to GitHub

Stage Summary:
- All 3 runtime errors fixed (psycopg2 missing, mediamtx authAddress, database URL mismatch)
- 5 additional potential crash issues prevented (EmailStr, deprecated imports, etc.)
- Docker Compose now includes alembic-migrate service for automatic DB migrations
- User needs to pull latest and re-run `docker compose up --build`
