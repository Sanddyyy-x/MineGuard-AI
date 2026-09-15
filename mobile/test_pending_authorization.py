from services.auth_service import AuthService


def main():
    print("Starting MineGuard Pending User authorization test...")

    email = input("Enter pending test account email: ").strip()
    password = input("Enter pending test account password: ")

    auth_service = AuthService()

    try:
        # ---------------------------------------------------------
        # 1. Login as Pending user
        # ---------------------------------------------------------
        print("\n[1] Logging in as Pending user...")

        result = auth_service.sign_in(email, password)

        print("✓ Login successful.")

        profile = result["profile"]

        print(f"User ID: {profile['id']}")
        print(f"Role: {profile['role']}")
        print(f"Status: {profile['status']}")

        # ---------------------------------------------------------
        # 2. Confirm this is actually a Pending user
        # ---------------------------------------------------------
        if profile["status"] != "Pending":
            raise RuntimeError(
                f"Expected Pending status, got {profile['status']}"
            )

        print("✓ User is Pending.")

        # ---------------------------------------------------------
        # 3. Try Admin-only RPC
        # ---------------------------------------------------------
        print("\n[2] Testing Admin-only RPC...")

        try:
            response = (
                auth_service.client
                .rpc("get_admin_user_management_summary")
                .execute()
            )

            if response.data is None:
                print("✓ Admin RPC returned no data for Pending user.")
                print("✓ Admin authorization check appears to be working.")
            else:
                print("✗ SECURITY TEST FAILED.")
                print("Pending user received Admin RPC data.")
                print("Response:")
                print(response.data)

        except Exception as e:
            print("✓ Admin RPC access denied.")
            print(f"Expected authorization error: {e}")

        # ---------------------------------------------------------
        # 4. Sign out
        # ---------------------------------------------------------
        print("\n[3] Signing out...")

        auth_service.sign_out()

        print("✓ Sign-out successful.")

        print("\nSTEP 1D-02 COMPLETED.")

    except Exception as e:
        print("\n✗ STEP 1D-02 FAILED.")
        print(f"Error type: {type(e).__name__}")
        print(f"Error: {e}")

        try:
            auth_service.sign_out()
        except Exception:
            pass


if __name__ == "__main__":
    main()