export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold">Access unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account is not authorized for this MineGuard resource.
        </p>
      </div>
    </main>
  );
}
