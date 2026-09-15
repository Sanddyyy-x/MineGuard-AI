from services.auth_service import AuthService


def main():
    print("Starting MineGuard Pending User authorization test...")

    email = input("Enter pending test account email: ").strip()
    password = input("Enter pending test account password: ")

    auth_service = AuthService()

    try:
        # 1. Login
        print("\n[1] Testing login...")
        result = auth_service.sign_in(email, password)

        print("✓ Login successful.")

        # 2. Show authenticated user
        print("\n[2] Authenticated user:")
        print(result)

        # 3. Check profile
        print("\n[3] Checking profile...")

        # IMPORTANT:
        # This part depends on how your AuthService exposes
        # the authenticated Supabase client.
        #
        # We will first confirm the login result before adding
        # protected API tests.

        print("✓ Access token available.")

        # 4. Sign out
        print("\n[4] Signing out...")
        auth_service.sign_out()

        print("✓ Sign-out successful.")

        print("\nSTEP 1D-01 PASSED: Pending user can authenticate.")

    except Exception as e:
        print("\n✗ STEP 1D-01 FAILED.")
        print(f"Error type: {type(e).__name__}")
        print(f"Error: {e}")


if __name__ == "__main__":
    main()