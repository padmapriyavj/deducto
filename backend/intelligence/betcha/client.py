"""Supabase client for the Betcha module (SUPABASE_URL / SUPABASE_KEY from env)."""

from supabase import Client

from database import get_supabase

__all__ = ["Client", "get_supabase"]
