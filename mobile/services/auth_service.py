from typing import Any, Dict, Optional
import logging

from supabase import Client
from supabase_api.client import get_supabase_client


logger = logging.getLogger("MineGuardAI.AuthService")


class AuthService:
    """
    Handles authentication and authenticated-user profile
    operations for MineGuard AI.

    Supabase Auth is responsible for identity.
    public.profiles is responsible for application-level
    user information.
    """

    def __init__(self, client: Optional[Client] = None) -> None:
        self.client = client or get_supabase_client()

    # =========================================================
    # LOGIN
    # =========================================================

    def sign_in(
        self,
        email: str,
        password: str,
    ) -> Dict[str, Any]:
        """
        Authenticate using Supabase email/password authentication.
        """

        email = email.strip()

        if not email:
            raise ValueError("Email is required.")

        if not password:
            raise ValueError("Password is required.")

        try:
            response = self.client.auth.sign_in_with_password(
                {
                    "email": email,
                    "password": password,
                }
            )

            if not response.user:
                raise RuntimeError(
                    "Authentication failed."
                )

            profile = self.get_current_profile()

            if profile is None:
                self.sign_out()

                raise RuntimeError(
                    "Login succeeded, but the user profile "
                    "could not be found."
                )

            return {
                "user": response.user,
                "session": response.session,
                "profile": profile,
            }

        except Exception:
            logger.exception(
                "Supabase authentication failed."
            )
            raise

    # =========================================================
    # SIGNUP
    # =========================================================

    def sign_up(
        self,
        email: str,
        password: str,
        full_name: str,
        organization: str,
    ) -> Dict[str, Any]:
        """
        Register a new user.

        The mobile application does NOT assign a role or activate
        the account.

        The backend/admin workflow is responsible for:
        - Pending status
        - role assignment
        - mine assignment
        - activation
        """

        email = email.strip()
        full_name = full_name.strip()
        organization = organization.strip()

        if not email:
            raise ValueError("Email is required.")

        if not password:
            raise ValueError("Password is required.")

        if not full_name:
            raise ValueError("Full name is required.")

        try:
            response = self.client.auth.sign_up(
                {
                    "email": email,
                    "password": password,
                    "options": {
                        "data": {
                            "full_name": full_name,
                            "organization": organization,
                        }
                    },
                }
            )

            return {
                "user": response.user,
                "session": response.session,
            }

        except Exception:
            logger.exception(
                "Supabase signup failed."
            )
            raise

    # =========================================================
    # CURRENT USER
    # =========================================================

    def get_current_user(self) -> Optional[Any]:
        """
        Return the currently authenticated Supabase user.
        """

        try:
            response = self.client.auth.get_user()

            if response is None:
                return None

            return response.user

        except Exception:
            logger.exception(
                "Unable to retrieve current Supabase user."
            )
            return None

    # =========================================================
    # CURRENT SESSION
    # =========================================================

    def get_current_session(self) -> Optional[Any]:
        """
        Return the current Supabase authentication session.
        """

        try:
            return self.client.auth.get_session()

        except Exception:
            logger.exception(
                "Unable to retrieve Supabase session."
            )
            return None

    # =========================================================
    # ACCESS TOKEN
    # =========================================================

    def get_access_token(self) -> Optional[str]:
        """
        Return the current authenticated user's access token.

        The token is never displayed or logged.
        """

        session = self.get_current_session()

        if session is None:
            return None

        return getattr(
            session,
            "access_token",
            None,
        )

    # =========================================================
    # CURRENT PROFILE
    # =========================================================

    def get_current_profile(
        self,
    ) -> Optional[Dict[str, Any]]:
        """
        Load public.profiles using auth.users.id.
        """

        user = self.get_current_user()

        if user is None:
            return None

        try:
            response = (
                self.client
                .table("profiles")
                .select(
                    "id,"
                    "full_name,"
                    "email,"
                    "role,"
                    "organization,"
                    "status,"
                    "created_at,"
                    "updated_at"
                )
                .eq("id", user.id)
                .single()
                .execute()
            )

            return response.data

        except Exception:
            logger.exception(
                "Unable to retrieve user profile."
            )
            return None

    # =========================================================
    # USER STATUS
    # =========================================================

    def get_user_status(self) -> Optional[str]:
        """
        Return the current user's profile status.
        """

        profile = self.get_current_profile()

        if not profile:
            return None

        return profile.get("status")

    # =========================================================
    # USER ROLE
    # =========================================================

    def get_user_role(self) -> Optional[str]:
        """
        Return the current user's assigned role.
        """

        profile = self.get_current_profile()

        if not profile:
            return None

        return profile.get("role")

    # =========================================================
    # AUTHENTICATION CHECK
    # =========================================================

    def is_authenticated(self) -> bool:
        """
        Determine whether an authenticated user exists.
        """

        return self.get_current_user() is not None

    # =========================================================
    # LOGOUT
    # =========================================================

    def sign_out(self) -> bool:
        """
        Sign out the current Supabase user.
        """

        try:
            self.client.auth.sign_out()
            return True

        except Exception:
            logger.exception(
                "Supabase logout failed."
            )
            return False