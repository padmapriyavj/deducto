import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy.orm import DeclarativeBase
from supabase import Client, create_client

# Always load ``backend/.env`` regardless of process cwd (Uvicorn often starts from repo root).
load_dotenv(Path(__file__).resolve().parent / ".env")

class Base(DeclarativeBase):
    pass

@lru_cache
def get_supabase() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set")
    return create_client(url, key)
