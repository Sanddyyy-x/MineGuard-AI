from typing import Optional

from supabase import Client, create_client

from config import SUPABASE_URL, SUPABASE_ANON_KEY


class SupabaseClientManager:
    """
    Creates and manages the shared Supabase client
    used by the MineGuard mobile application.
    """

    def __init__(self) -> None:
        self.client: Client = create_client(
            SUPABASE_URL,
            SUPABASE_ANON_KEY,
        )

    def get_client(self) -> Client:
        """Return the active Supabase client."""
        return self.client


_supabase_manager: Optional[SupabaseClientManager] = None


def get_supabase_client() -> Client:
    """
    Return a shared Supabase client instance.

    The client is created only once during the application's
    lifetime.
    """

    global _supabase_manager

    if _supabase_manager is None:
        _supabase_manager = SupabaseClientManager()

    return _supabase_manager.get_client()