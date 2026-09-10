# Supabase client stub
from supabase import create_client, Client
from app.config import settings

def get_supabase_client() -> Client:
    if not settings.supabase_url or not settings.supabase_key:
        # Stub for local dev without supabase connected
        return None 
    return create_client(settings.supabase_url, settings.supabase_key)
