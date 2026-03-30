# backend/database.py
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from the .env file
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase credentials not found in .env file.")

# Initialize and export the Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_db():
    """
    Dependency injection for FastAPI routes.
    Returns the Supabase client instance.
    """
    return supabase