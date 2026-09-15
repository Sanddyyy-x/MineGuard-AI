from services.auth_service import AuthService


def main():
    print("Starting MineGuard authentication test...")

    email = input("Enter test account email: ").strip()
    password = input("Enter test account password: ")

    auth = AuthService()

    try:
        result = auth.sign_in(email, password)

        print()
        print("✓ Login successful.")
        print("User ID:", result["user"].id)
        print("Email:", result["user"].email)

        print()
        print("Profile:")
        print(result["profile"])

        print()
        print("Role:", result["profile"].get("role"))
        print("Status:", result["profile"].get("status"))

        print()
        print("Access token available:", bool(result["session"].access_token))

        auth.sign_out()

        print()
        print("✓ Sign-out successful.")
        print("STEP 1C PASSED.")

    except Exception as error:
        print()
        print("STEP 1C FAILED.")
        print("Error type:", type(error).__name__)
        print("Error:", error)


if __name__ == "__main__":
    main()