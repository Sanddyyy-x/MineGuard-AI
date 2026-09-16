'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, CalendarDays, ClipboardList, ExternalLink, Loader2, MapPin, Repeat2 } from 'lucide-react';
import { formatViolationDate, formatViolationDateTime, getViolationById, type Violation } from '@/lib/data/violations';

function Badge({ value, kind }: { value: string | null; kind: 'status' | 'severity' }) {
  const normalized = (value ?? '').toLowerCase();
  let classes = 'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium';
  if (kind === 'severity' && ['high', 'critical'].includes(normalized)) classes += ' border-red-200 bg-red-50 text-red-800';
  else if (kind === 'severity' && normalized === 'medium') classes += ' border-amber-200 bg-amber-50 text-amber-800';
  else if (kind === 'status' && normalized === 'open') classes += ' border-amber-200 bg-amber-50 text-amber-800';
  else classes += ' border-slate-200 bg-slate-50 text-slate-700';
  return <span className={classes}>{value || '—'}</span>;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 text-sm">{value}</dd></div>;
}

export default function ViolationDetailPage() {
  const params = useParams<{ violationId: string }>();
  const violationId = params?.violationId;
  const [violation, setViolation] = useState<Violation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!violationId) return;
    async function load() {
      setLoading(true); setError(null);
      try { setViolation(await getViolationById(violationId)); }
      catch (err) { setError(err instanceof Error ? err.message : 'Unable to load the violation.'); }
      finally { setLoading(false); }
    }
    void load();
  }, [violationId]);

  if (loading) return <div className="flex min-h-96 items-center justify-center p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (error) return <div className="space-y-4 p-6"><Link href="/violations" className="inline-flex items-center gap-2 text-sm font-medium hover:underline"><ArrowLeft className="h-4 w-4" />Back to Violations</Link><div className="rounded-xl border p-8"><p className="font-medium">Unable to load violation</p><p className="mt-1 text-sm text-muted-foreground">{error}</p></div></div>;

  if (!violation) return <div className="space-y-4 p-6"><Link href="/violations" className="inline-flex items-center gap-2 text-sm font-medium hover:underline"><ArrowLeft className="h-4 w-4" />Back to Violations</Link><div className="rounded-xl border p-8 text-center"><AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 font-medium">Violation not found</p></div></div>;

  return (
    <div className="space-y-6 p-6">
      <Link href="/violations" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to Violations</Link>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4"><div className="rounded-lg border p-3"><AlertTriangle className="h-6 w-6" /></div><div>
            <p className="text-sm text-muted-foreground">{violation.violation_code || 'Violation'}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{violation.title}</h1>
            <div className="mt-3 flex flex-wrap gap-2"><Badge value={violation.status} kind="status" /><Badge value={violation.severity} kind="severity" />{violation.category && <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">{violation.category}</span>}</div>
          </div></div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4" />Detected {formatViolationDate(violation.detected_date)}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border bg-card p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold">Violation Details</h2>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            <DetailItem label="Violation Code" value={violation.violation_code || '—'} />
            <DetailItem label="Status" value={violation.status || '—'} />
            <DetailItem label="Severity" value={violation.severity || '—'} />
            <DetailItem label="Category" value={violation.category || '—'} />
            <DetailItem label="Detected Date" value={formatViolationDateTime(violation.detected_date)} />
            <DetailItem label="Resolved Date" value={formatViolationDateTime(violation.resolved_date)} />
            <DetailItem label="Recurring" value={violation.recurring === null ? '—' : violation.recurring ? 'Yes' : 'No'} />
            <DetailItem label="Created At" value={formatViolationDateTime(violation.created_at)} />
          </dl>
          <div className="mt-8 border-t pt-6"><h3 className="font-medium">Description</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{violation.description || 'No description recorded.'}</p></div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-xl border bg-card p-6 shadow-sm"><div className="flex items-center gap-2"><MapPin className="h-5 w-5" /><h2 className="font-semibold">Mine</h2></div><p className="mt-4 text-sm">{violation.mine?.mine_code || 'Mine information unavailable'}</p>{violation.mine && <Link href={`/mines/${violation.mine.id}`} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">View Mine<ExternalLink className="h-4 w-4" /></Link>}</section>

          <section className="rounded-xl border bg-card p-6 shadow-sm"><div className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /><h2 className="font-semibold">Related Observation</h2></div>
            {violation.observation ? <><p className="mt-4 break-all text-xs text-muted-foreground">{violation.observation.id}</p><p className="mt-3 line-clamp-4 text-sm text-muted-foreground">{violation.observation.description || 'No observation description recorded.'}</p><Link href={`/observations/${violation.observation.id}`} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">View Observation<ExternalLink className="h-4 w-4" /></Link></>
            : violation.observation_id ? <p className="mt-4 text-sm text-muted-foreground">Related observation exists, but its details are not available to the current user.</p>
            : <p className="mt-4 text-sm text-muted-foreground">No observation is linked to this violation.</p>}
          </section>

          <section className="rounded-xl border bg-card p-6 shadow-sm"><div className="flex items-center gap-2"><Repeat2 className="h-5 w-5" /><h2 className="font-semibold">Recurrence</h2></div><p className="mt-4 text-sm">{violation.recurring === null ? 'Not recorded' : violation.recurring ? 'Marked as recurring' : 'Not marked as recurring'}</p></section>
        </aside>
      </div>
    </div>
  );
}
