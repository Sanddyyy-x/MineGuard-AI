"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react"

import { supabase } from "@/lib/supabase-client"

const ROLES = [
  ["Inspector", true],
  ["Safety Officer", true],
  ["Mine Manager", true],
  ["Contractor/Worker", true],
  ["Subsidiary Admin", false],
] as const

export default function RegisterPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [organization, setOrganization] = useState("")
  const [role, setRole] = useState("")
  const [mine, setMine] = useState("")
  const [reason, setReason] = useState("")

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const selected = ROLES.find(([r]) => r === role)
  const mineRequired = selected?.[1] === true

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }

    if (!role) {
      setError("Please select the role you are requesting.")
      return
    }

    if (mineRequired && !mine.trim()) {
      setError("Please enter the mine you are requesting access to.")
      return
    }

    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          organization: organization.trim(),
          requested_role: role,
          requested_mine: mine.trim() || null,
          access_reason: reason.trim(),
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    /*
     * Registration does not automatically authorize application access.
     * The existing AuthGuard requires an Active MineGuard profile.
     */
    if (data.session) {
      await supabase.auth.signOut()
    }

    router.push("/pending")
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Request MineGuard Access
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Create an account and submit an access request for administrator
            review.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <form onSubmit={submit} className="space-y-6">
            {/* Account Information */}
            <Section title="Account information">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full Name" required>
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="field"
                    placeholder="Your full name"
                    autoComplete="name"
                  />
                </Field>

                <Field label="Email" required>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </Field>

                {/* Password */}
                <Field label="Password" required>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="field pr-12"
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((current) => !current)
                      }
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-slate-500 transition hover:text-slate-700"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </Field>

                {/* Confirm Password */}
                <Field label="Confirm Password" required>
                  <div className="relative">
                    <input
                      required
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="field pr-12"
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((current) => !current)
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                      className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-slate-500 transition hover:text-slate-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </Field>
              </div>
            </Section>

            {/* Professional Information */}
            <Section title="Professional information">
              <Field label="Organization / Company" required>
                <input
                  required
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="field"
                  placeholder="Organization or company name"
                  autoComplete="organization"
                />
              </Field>
            </Section>

            {/* Access Request */}
            <Section
              title="Access request"
              note="This is your requested access. An administrator makes the final authorization decision."
            >
              <div className="space-y-4">
                {/* Requested Role */}
                <Field label="Requested Role" required>
                  <select
                    required
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value)
                      setMine("")
                    }}
                    className="field"
                  >
                    <option value="">Select a role</option>

                    {ROLES.map(([value]) => (
                      <option key={value} value={value}>
                        {value === "Contractor/Worker"
                          ? "Contractor / Worker"
                          : value}
                      </option>
                    ))}
                  </select>
                </Field>

                {/* Requested Mine */}
                {mineRequired && (
                  <Field label="Requested Mine" required>
                    <input
                      required
                      value={mine}
                      onChange={(e) => setMine(e.target.value)}
                      className="field"
                      placeholder="e.g. MOC-69 – Rohne Coal Block"
                    />

                    <p className="mt-1 text-xs text-slate-500">
                      The administrator will make the final mine assignment.
                    </p>
                  </Field>
                )}

                {/* Reason */}
                <Field label="Reason for Access" required>
                  <textarea
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="field min-h-28 resize-y"
                    placeholder="Briefly explain why you need MineGuard access."
                  />
                </Field>
              </div>
            </Section>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}

              {loading
                ? "Submitting request..."
                : "Create Account & Request Access"}
            </button>

            {/* Login Link */}
            <p className="text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-slate-900 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Field Styling */}
      <style jsx>{`
        .field {
          width: 100%;
          border: 1px solid rgb(203 213 225);
          border-radius: 0.5rem;
          background: #ffffff;
          padding: 0.65rem 0.75rem;
          font-size: 0.875rem;
          color: rgb(15 23 42);
          outline: none;
        }

        .field:focus {
          border-color: rgb(71 85 105);
          box-shadow: 0 0 0 2px rgb(226 232 240);
        }
      `}</style>
    </main>
  )
}

/* ---------- Reusable Components ---------- */

function Section({
  title,
  note,
  children,
}: {
  title: string
  note?: string
  children: React.ReactNode
}) {
  return (
    <section className="border-t border-slate-100 pt-6 first:border-0 first:pt-0">
      <h2 className="text-base font-semibold text-slate-900">
        {title}
      </h2>

      {note && (
        <p className="mt-1 text-sm text-slate-500">
          {note}
        </p>
      )}

      <div className="mt-4">{children}</div>
    </section>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  )
}