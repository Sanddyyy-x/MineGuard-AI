'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Loader2,
  User,
  Wrench,
} from 'lucide-react';
import {
  formatCorrectiveActionDate,
  formatCorrectiveActionDateTime,
  getCorrectiveActionById,
  type CorrectiveAction,
} from '@/lib/data/corrective-actions';

function Badge({ value, type }: { value: string | null; type: 'status' | 'verification' }) {
  const normalized = (value ?? '').toLowerCase();
  const positive =
    (type === 'status' && normalized === 'completed') ||
    (type === 'verification' && normalized === 'verified');

  const classes = positive
    ? 'border-green-200 bg-green-50 text-green-800'
    : normalized === 'in progress'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-slate-200 bg-slate-50 text-slate-700';

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${classes}`}>{value || '—'}</span>;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}

export default function CorrectiveActionDetailPage() {
  const params = useParams<{ correctiveActionId: string }>();
  const id = params?.correctiveActionId;
  const [action, setAction] = useState<CorrectiveAction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        setAction(await getCorrectiveActionById(id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load corrective action.');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  if (loading) return <div className="flex min-h-96 items-center justify-center p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (error) return (
    <div className="space-y-4 p-6">
      <Link href="/corrective-actions" className="inline-flex items-center gap-2 text-sm font-medium hover:underline"><ArrowLeft className="h-4 w-4" />Back to Corrective Actions</Link>
      <div className="rounded-xl border p-8"><p className="font-medium">Unable to load corrective action</p><p className="mt-1 text-sm text-muted-foreground">{error}</p></div>
    </div>
  );

  if (!action) return (
    <div className="space-y-4 p-6">
      <Link href="/corrective-actions" className="inline-flex items-center gap-2 text-sm font-medium hover:underline"><ArrowLeft className="h-4 w-4" />Back to Corrective Actions</Link>
      <div className="rounded-xl border p-8 text-center"><AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 font-medium">Corrective action not found</p></div>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <Link href="/corrective-actions" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Back to Corrective Actions
      </Link>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <div className="rounded-lg border p-3"><Wrench className="h-6 w-6" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Corrective Action</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">{action.action_description}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge value={action.status} type="status" />
                <Badge value={action.verification_status} type="verification" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />Created {formatCorrectiveActionDateTime(action.created_at)}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border bg-card p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold">Corrective Action Details</h2>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            <DetailItem label="Due Date" value={formatCorrectiveActionDate(action.due_date)} />
            <DetailItem label="Completion Date" value={formatCorrectiveActionDate(action.completion_date)} />
            <DetailItem label="Status" value={action.status || '—'} />
            <DetailItem label="Verification Status" value={action.verification_status || '—'} />
            <DetailItem label="Assigned To" value={action.assignedUser?.full_name || action.assignedUser?.email || '—'} />
            <DetailItem label="Verified By" value={action.verifiedByUser?.full_name || action.verifiedByUser?.email || '—'} />
            <DetailItem label="Created At" value={formatCorrectiveActionDateTime(action.created_at)} />
            <DetailItem label="Violation ID" value={action.violation_id} />
          </dl>

          <div className="mt-8 border-t pt-6">
            <h3 className="font-medium">Action Description</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{action.action_description}</p>
          </div>

          <div className="mt-8 border-t pt-6">
            <h3 className="font-medium">Remarks</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{action.remarks || 'No remarks recorded.'}</p>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /><h2 className="font-semibold">Related Violation</h2></div>
            {action.violation ? (
              <>
                <p className="mt-4 text-sm font-medium">{action.violation.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">Mine: {action.violation.mine?.mine_code || '—'}</p>
                <p className="mt-1 text-xs text-muted-foreground">{action.violation.violation_code || 'No violation code'}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {action.violation.category && <span className="rounded-full border px-2 py-1">{action.violation.category}</span>}
                  {action.violation.severity && <span className="rounded-full border px-2 py-1">{action.violation.severity}</span>}
                  {action.violation.status && <span className="rounded-full border px-2 py-1">{action.violation.status}</span>}
                </div>
                <Link href={`/violations/${action.violation.id}`} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">View Violation<ExternalLink className="h-4 w-4" /></Link>
              </>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Related violation is not available.</p>
            )}
          </section>

          <section className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /><h2 className="font-semibold">Related Observation</h2></div>
            {action.observation ? (
              <>
                <p className="mt-4 text-xs text-muted-foreground break-all">{action.observation.id}</p>
                <p className="mt-3 text-sm text-muted-foreground">{action.observation.description || 'No observation description recorded.'}</p>
                <Link href={`/observations/${action.observation.id}`} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">View Observation<ExternalLink className="h-4 w-4" /></Link>
              </>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No observation details are available through the linked violation.</p>
            )}
          </section>

          <section className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2"><User className="h-5 w-5" /><h2 className="font-semibold">Assignment & Verification</h2></div>
            <p className="mt-4 text-sm">Assigned: {action.assignedUser?.full_name || action.assignedUser?.email || 'Not assigned'}</p>
            <p className="mt-2 text-sm">Verified by: {action.verifiedByUser?.full_name || action.verifiedByUser?.email || 'Not recorded'}</p>
            <div className="mt-4 flex items-center gap-2 text-sm">
              {action.verification_status === 'Verified' ? <CheckCircle2 className="h-4 w-4" /> : <Clock3Icon />}
              {action.verification_status || '—'}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Clock3Icon() {
  return <span className="inline-block h-4 w-4 rounded-full border border-current" aria-hidden="true" />;
}
