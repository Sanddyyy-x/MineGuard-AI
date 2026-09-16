"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, ShieldCheck } from "lucide-react"
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
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const selected = ROLES.find(([r]) => r === role)
  const mineRequired = selected?.[1] === true

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    if (password.length < 6) return setError("Password must be at least 6 characters.")
    if (password !== confirm) return setError("Passwords do not match.")
    if (!role) return setError("Please select the role you are requesting.")
    if (mineRequired && !mine.trim()) return setError("Please enter the mine you are requesting access to.")
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
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

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.session) await supabase.auth.signOut()
    router.push("/pending")
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Request MineGuard Access</h1>
          <p className="mt-2 text-sm text-slate-600">Create an account and submit an access request for administrator review.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <form onSubmit={submit} className="space-y-6">
            <Section title="Account information">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full Name" required><input required value={fullName} onChange={e => setFullName(e.target.value)} className="field" placeholder="Your full name" /></Field>
                <Field label="Email" required><input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="field" placeholder="you@example.com" /></Field>
                <Field label="Password" required><input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="field" placeholder="At least 6 characters" /></Field>
                <Field label="Confirm Password" required><input required type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="field" placeholder="Re-enter your password" /></Field>
              </div>
            </Section>

            <Section title="Professional information">
              <Field label="Organization / Company" required><input required value={organization} onChange={e => setOrganization(e.target.value)} className="field" placeholder="Organization or company name" /></Field>
            </Section>

            <Section title="Access request" note="This is your requested access. An administrator makes the final authorization decision.">
              <div className="space-y-4">
                <Field label="Requested Role" required>
                  <select required value={role} onChange={e => { setRole(e.target.value); setMine("") }} className="field">
                    <option value="">Select a role</option>
                    {ROLES.map(([value]) => <option key={value} value={value}>{value === "Contractor/Worker" ? "Contractor / Worker" : value}</option>)}
                  </select>
                </Field>
                {mineRequired && <Field label="Requested Mine" required>
                  <input required value={mine} onChange={e => setMine(e.target.value)} className="field" placeholder="e.g. MOC-69 – Rohne Coal Block" />
                  <p className="mt-1 text-xs text-slate-500">The administrator will make the final mine assignment.</p>
                </Field>}
                <Field label="Reason for Access" required>
                  <textarea required value={reason} onChange={e => setReason(e.target.value)} className="field min-h-28 resize-y" placeholder="Briefly explain why you need MineGuard access." />
                </Field>
              </div>
            </Section>

            {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Submitting request..." : "Create Account & Request Access"}
            </button>

            <p className="text-center text-sm text-slate-600">Already have an account? <Link href="/login" className="font-semibold text-slate-900 hover:underline">Sign in</Link></p>
          </form>
        </div>
      </div>
      <style jsx>{`.field{width:100%;border:1px solid rgb(203 213 225);border-radius:.5rem;background:#fff;padding:.65rem .75rem;font-size:.875rem;color:rgb(15 23 42);outline:none}.field:focus{border-color:rgb(71 85 105);box-shadow:0 0 0 2px rgb(226 232 240)}`}</style>
    </main>
  )
}

function Section({title,note,children}:{title:string;note?:string;children:React.ReactNode}) {
  return <section className="border-t border-slate-100 pt-6 first:border-0 first:pt-0"><h2 className="text-base font-semibold text-slate-900">{title}</h2>{note && <p className="mt-1 text-sm text-slate-500">{note}</p>}<div className="mt-4">{children}</div></section>
}
function Field({label,required,children}:{label:string;required?:boolean;children:React.ReactNode}) {
  return <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">{label}{required && <span className="ml-1 text-red-500">*</span>}</span>{children}</label>
}
