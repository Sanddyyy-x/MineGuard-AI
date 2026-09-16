import Link from "next/link"
import { Clock3, ShieldCheck } from "lucide-react"

export default function PendingPage() {
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-700"><Clock3 className="h-7 w-7" /></div>
      <h1 className="text-2xl font-bold text-slate-900">Access Request Submitted</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">Your MineGuard account has been created. Application access is not granted automatically. An administrator must review and authorize your request.</p>
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
        <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-700" /><div><p className="text-sm font-semibold text-slate-900">Status: Pending Approval</p><p className="mt-1 text-xs leading-5 text-slate-600">Your requested role and access scope will be reviewed by an authorized administrator.</p></div></div>
      </div>
      <Link href="/login" className="mt-6 inline-flex rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Return to Login</Link>
    </div>
  </main>
}
