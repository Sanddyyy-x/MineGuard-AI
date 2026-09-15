from supabase_api.client import get_supabase_client


def main():
    print("Starting MineGuard Supabase connection test...")

    try:
        client = get_supabase_client()

        print("✓ Supabase client created successfully.")
        print("✓ Supabase URL loaded from configuration.")

        response = (
            client
            .table("profiles")
            .select("id,full_name,email,role,status")
            .limit(5)
            .execute()
        )

        print("✓ Successfully connected to Supabase.")
        print()
        print("Profiles returned:")
        print(response.data)

        print()
        print("STEP 1B PASSED.")

    except Exception as error:
        print()
        print("STEP 1B FAILED.")
        print("Error type:", type(error).__name__)
        print("Error:", error)


if __name__ == "__main__":
    main()