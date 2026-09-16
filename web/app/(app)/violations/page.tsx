'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CalendarDays, CheckCircle2, CircleAlert, Loader2, Plus, RefreshCw, Repeat2, Search } from 'lucide-react';
import { getViolations, formatViolationDate, type Violation } from '@/lib/data/violations';

const normalize = (value: string | null | undefined) => (value ?? '').trim().toLowerCase();

function ViolationBadge({ value, kind }: { value: string | null; kind: 'status' | 'severity' }) {
  const normalized = normalize(value);
  let classes = 'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium';
  if (kind === 'status' && normalized === 'open') classes += ' border-amber-200 bg-amber-50 text-amber-800';
  else if (kind === 'severity' && (normalized === 'high' || normalized === 'critical')) classes += ' border-red-200 bg-red-50 text-red-800';
  else if (kind === 'severity' && normalized === 'medium') classes += ' border-amber-200 bg-amber-50 text-amber-800';
  else classes += ' border-slate-200 bg-slate-50 text-slate-700';
  return <span className={classes}>{value || '—'}</span>;
}

function SummaryCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof AlertTriangle }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default function ViolationsPage() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [status, setStatus] = useState('all');

  async function load() {
    setLoading(true);
    setError(null);
    try { setViolations(await getViolations()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to load violations.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  const categories = useMemo(() => [...new Set(violations.map((v) => v.category).filter(Boolean))] as string[], [violations]);
  const severities = useMemo(() => [...new Set(violations.map((v) => v.severity).filter(Boolean))] as string[], [violations]);
  const statuses = useMemo(() => [...new Set(violations.map((v) => v.status).filter(Boolean))] as string[], [violations]);

  const filtered = useMemo(() => {
    const query = normalize(search);
    return violations.filter((v) => {
      const matchesSearch = !query || [v.violation_code, v.title, v.description, v.category, v.severity, v.status, v.mine?.mine_code]
        .some((value) => normalize(value).includes(query));
      return matchesSearch &&
        (category === 'all' || v.category === category) &&
        (severity === 'all' || v.severity === severity) &&
        (status === 'all' || v.status === status);
    });
  }, [violations, search, category, severity, status]);

  const openCount = violations.filter((v) => normalize(v.status) === 'open').length;
  const highSeverityCount = violations.filter((v) => ['high', 'critical'].includes(normalize(v.severity))).length;
  const recurringCount = violations.filter((v) => v.recurring === true).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2"><AlertTriangle className="h-6 w-6" /><h1 className="text-2xl font-semibold tracking-tight">Violations</h1></div>
          <p className="mt-1 text-sm text-muted-foreground">Recorded regulatory violations and their current resolution status.</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total Violations" value={violations.length} icon={AlertTriangle} />
        <SummaryCard label="Open" value={openCount} icon={CircleAlert} />
        <SummaryCard label="High Severity" value={highSeverityCount} icon={AlertTriangle} />
        <SummaryCard label="Recurring" value={recurringCount} icon={Repeat2} />
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search violations..." className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring" />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="all">All categories</option>{categories.map((v) => <option key={v} value={v}>{v}</option>)}</select>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="all">All severities</option>{severities.map((v) => <option key={v} value={v}>{v}</option>)}</select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="all">All statuses</option>{statuses.map((v) => <option key={v} value={v}>{v}</option>)}</select>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : error ? (
          <div className="p-8 text-center"><p className="font-medium">Unable to load violations</p><p className="mt-1 text-sm text-muted-foreground">{error}</p><button type="button" onClick={() => void load()} className="mt-4 rounded-md border px-3 py-2 text-sm">Try again</button></div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center"><CheckCircle2 className="h-8 w-8 text-muted-foreground" /><p className="mt-3 font-medium">{violations.length === 0 ? 'No violations found' : 'No violations match your filters'}</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/40 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Violation</th><th className="px-4 py-3 font-medium">Mine</th><th className="px-4 py-3 font-medium">Category</th><th className="px-4 py-3 font-medium">Severity</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Detected</th><th className="px-4 py-3 font-medium">Recurring</th><th className="px-4 py-3 font-medium">Action</th>
              </tr></thead>
              <tbody>{filtered.map((v) => (
                <tr key={v.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="max-w-xs px-4 py-4"><p className="font-medium">{v.title}</p><p className="mt-1 text-xs text-muted-foreground">{v.violation_code || 'No violation code'}</p></td>
                  <td className="px-4 py-4 font-medium">{v.mine?.mine_code || '—'}</td><td className="px-4 py-4">{v.category || '—'}</td>
                  <td className="px-4 py-4"><ViolationBadge value={v.severity} kind="severity" /></td><td className="px-4 py-4"><ViolationBadge value={v.status} kind="status" /></td>
                  <td className="whitespace-nowrap px-4 py-4"><span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-muted-foreground" />{formatViolationDate(v.detected_date)}</span></td>
                  <td className="px-4 py-4">{v.recurring ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-4"><Link href={`/violations/${v.id}`} className="font-medium text-primary hover:underline">View</Link></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
      {!loading && !error && <p className="text-xs text-muted-foreground">Showing {filtered.length} of {violations.length} violations.</p>}
    </div>
  );
}
