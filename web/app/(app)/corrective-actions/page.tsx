'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
  Wrench,
} from 'lucide-react';
import {
  getCorrectiveActions,
  formatCorrectiveActionDate,
  type CorrectiveAction,
} from '@/lib/data/corrective-actions';

const normalize = (value: string | null | undefined) => (value ?? '').trim().toLowerCase();

function StatusBadge({ value }: { value: string | null }) {
  const status = normalize(value);
  let classes = 'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium';

  if (status === 'completed') {
    classes += ' border-green-200 bg-green-50 text-green-800';
  } else if (status === 'in progress') {
    classes += ' border-amber-200 bg-amber-50 text-amber-800';
  } else {
    classes += ' border-slate-200 bg-slate-50 text-slate-700';
  }

  return <span className={classes}>{value || '—'}</span>;
}

function VerificationBadge({ value }: { value: string | null }) {
  const verified = normalize(value) === 'verified';
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
      verified
        ? 'border-green-200 bg-green-50 text-green-800'
        : 'border-slate-200 bg-slate-50 text-slate-700'
    }`}>
      {value || '—'}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Wrench;
}) {
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

export default function CorrectiveActionsPage() {
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setActions(await getCorrectiveActions());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load corrective actions.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const statuses = useMemo(
    () => [...new Set(actions.map((action) => action.status).filter(Boolean))] as string[],
    [actions]
  );

  const filtered = useMemo(() => {
    const query = normalize(search);

    return actions.filter((action) => {
      const values = [
        action.action_description,
        action.remarks,
        action.violation?.violation_code,
        action.violation?.title,
        action.violation?.category,
        action.violation?.severity,
      ];

      const matchesSearch =
        !query || values.some((value) => normalize(value).includes(query));

      const matchesStatus = status === 'all' || action.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [actions, search, status]);

  const pendingCount = actions.filter((action) => normalize(action.status) === 'pending').length;
  const inProgressCount = actions.filter((action) => normalize(action.status) === 'in progress').length;
  const completedCount = actions.filter((action) => normalize(action.status) === 'completed').length;
  const verifiedCount = actions.filter((action) => normalize(action.verification_status) === 'verified').length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            <h1 className="text-2xl font-semibold tracking-tight">Corrective Actions</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Track actions raised against recorded violations and their verification status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total Actions" value={actions.length} icon={Wrench} />
        <SummaryCard label="Pending" value={pendingCount} icon={Clock3} />
        <SummaryCard label="In Progress" value={inProgressCount} icon={ClipboardCheck} />
        <SummaryCard label="Completed" value={completedCount} icon={CheckCircle2} />
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by violation, action, category, or remarks..."
              className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              aria-label="Search corrective actions"
            />
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            {statuses.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="font-medium">Unable to load corrective actions</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <button type="button" onClick={() => void load()} className="mt-4 rounded-md border px-3 py-2 text-sm">
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-medium">
              {actions.length === 0 ? 'No corrective actions found' : 'No corrective actions match your filters'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Violation</th>
                  <th className="px-4 py-3 font-medium">Mine</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Assigned To</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Verification</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((action) => (
                  <tr key={action.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="max-w-[250px] px-4 py-4">
                      <p className="font-medium">{action.violation?.title || '—'}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {action.violation?.violation_code || 'No violation code'}
                      </p>
                    </td>
                    <td className="px-4 py-4 font-medium">
                      {action.violation?.mine?.mine_code || '—'}
                    </td>
                    <td className="max-w-[320px] px-4 py-4 text-muted-foreground">
                      {action.action_description}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {action.assignedUser?.full_name || action.assignedUser?.email || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                      {formatCorrectiveActionDate(action.due_date)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge value={action.status} />
                    </td>
                    <td className="px-4 py-4">
                      <VerificationBadge value={action.verification_status} />
                    </td>
                    <td className="px-4 py-4">
                      <Link href={`/corrective-actions/${action.id}`} className="font-medium text-primary hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !error && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Showing {filtered.length} of {actions.length} corrective actions.</span>
          <span>{verifiedCount} verified.</span>
        </div>
      )}
    </div>
  );
}

