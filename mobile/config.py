import os
from dotenv import load_dotenv


# Load variables from .env
load_dotenv()


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")


if not SUPABASE_URL:
    raise RuntimeError(
        "SUPABASE_URL is missing. Check your .env file."
    )


if not SUPABASE_ANON_KEY:
    raise RuntimeError(
        "SUPABASE_ANON_KEY is missing. Check your .env file."
    )