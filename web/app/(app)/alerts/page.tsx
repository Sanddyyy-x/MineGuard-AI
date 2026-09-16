'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BellOff,
  BellRing,
  Calendar,
  Check,
  CircleAlert,
  ClipboardCheck,
  FileWarning,
  Gauge,
  Leaf,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  Wrench,
} from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  getAlerts,
  type Alert,
  type AlertSeverity,
  type AlertStatus,
  type AlertType,
} from '@/lib/data/alerts';

const alertTypes: AlertType[] = [
  'Corrective Action Due Soon',
  'Recurring Violation',
  'Corrective Action',
  'Compliance Follow-up',
  'Production Anomaly',
  'High Severity Violation',
];

const alertTypeIcons: Record<AlertType, typeof Bell> = {
  'Corrective Action Due Soon': Calendar,
  'Recurring Violation': ShieldAlert,
  'Corrective Action': Wrench,
  'Compliance Follow-up': FileWarning,
  'Production Anomaly': Gauge,
  'High Severity Violation': CircleAlert,
};

function formatDate(value: string | null) {
  if (!value) return '—';

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SeverityPill({ severity }: { severity: AlertSeverity }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        severity === 'High'
          ? 'border-destructive/30 bg-destructive/10 text-destructive'
          : 'border-info/30 bg-info/10 text-info'
      )}
    >
      {severity}
    </span>
  );
}

function AlertStatusPill({ status }: { status: AlertStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        status === 'Unread'
          ? 'border-warning/30 bg-warning/10 text-warning'
          : 'border-border bg-muted text-muted-foreground'
      )}
    >
      {status === 'Unread' ? (
        <BellRing className="h-3 w-3" aria-hidden="true" />
      ) : (
        <Check className="h-3 w-3" aria-hidden="true" />
      )}
      {status}
    </span>
  );
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | AlertType>('all');
  const [severityFilter, setSeverityFilter] =
    useState<'all' | AlertSeverity>('all');
  const [statusFilter, setStatusFilter] =
    useState<'all' | AlertStatus>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAlerts(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const data = await getAlerts();
      setAlerts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadAlerts();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return alerts.filter((alert) => {
      const matchesSearch =
        query === '' ||
        alert.id.toLowerCase().includes(query) ||
        alert.title.toLowerCase().includes(query) ||
        alert.message.toLowerCase().includes(query) ||
        alert.alertType.toLowerCase().includes(query) ||
        (alert.mineCode?.toLowerCase().includes(query) ?? false) ||
        (alert.violationCode?.toLowerCase().includes(query) ?? false) ||
        (alert.violationTitle?.toLowerCase().includes(query) ?? false);

      const matchesType =
        typeFilter === 'all' || alert.alertType === typeFilter;

      const matchesSeverity =
        severityFilter === 'all' || alert.severity === severityFilter;

      const matchesStatus =
        statusFilter === 'all' || alert.status === statusFilter;

      return matchesSearch && matchesType && matchesSeverity && matchesStatus;
    });
  }, [alerts, search, typeFilter, severityFilter, statusFilter]);

  const total = alerts.length;
  const unreadCount = alerts.filter((alert) => alert.status === 'Unread').length;
  const highCount = alerts.filter((alert) => alert.severity === 'High').length;
  const readCount = alerts.filter((alert) => alert.status === 'Read').length;

  const hasActiveFilters =
    search !== '' ||
    typeFilter !== 'all' ||
    severityFilter !== 'all' ||
    statusFilter !== 'all';

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Alerts"
        description="Operational alerts generated from recorded violations and corrective actions."
        action={
          <Button
            variant="outline"
            onClick={() => void loadAlerts(true)}
            disabled={loading || refreshing}
          >
            <RefreshCw
              className={cn('mr-2 h-4 w-4', refreshing && 'animate-spin')}
            />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Alerts" value={total} icon={Bell} accent="primary" />
        <StatCard
          label="Unread"
          value={unreadCount}
          icon={BellRing}
          accent="warning"
        />
        <StatCard
          label="High Severity"
          value={highCount}
          icon={ShieldAlert}
          accent="destructive"
        />
        <StatCard
          label="Read"
          value={readCount}
          icon={Check}
          accent="success"
        />
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title, message, mine, violation, or ID..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10"
              aria-label="Search alerts"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Select
              value={typeFilter}
              onValueChange={(value) =>
                setTypeFilter(value as 'all' | AlertType)
              }
            >
              <SelectTrigger
                className="w-full sm:w-[190px]"
                aria-label="Filter by alert type"
              >
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {alertTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={severityFilter}
              onValueChange={(value) =>
                setSeverityFilter(value as 'all' | AlertSeverity)
              }
            >
              <SelectTrigger
                className="w-full sm:w-[160px]"
                aria-label="Filter by severity"
              >
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as 'all' | AlertStatus)
              }
            >
              <SelectTrigger
                className="w-full sm:w-[160px]"
                aria-label="Filter by alert status"
              >
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Unread">Unread</SelectItem>
                <SelectItem value="Read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading alerts...
          </div>
        </Card>
      ) : error ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <CircleAlert className="h-8 w-8 text-destructive" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">
              Unable to load alerts
            </p>
            <p className="max-w-xl text-sm text-muted-foreground">{error}</p>
          </div>
          <Button variant="outline" onClick={() => void loadAlerts(true)}>
            Try again
          </Button>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <BellOff className="h-8 w-8 text-muted-foreground" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">No alerts found</p>
            <p className="text-sm text-muted-foreground">
              {alerts.length === 0
                ? 'There are no alerts recorded yet.'
                : 'No alerts match the current search and filters.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => {
            const TypeIcon = alertTypeIcons[alert.alertType];

            return (
              <Card
                key={alert.id}
                className={cn(
                  'flex flex-col gap-4 p-4 transition-colors sm:flex-row sm:items-start',
                  alert.status === 'Unread' && 'border-l-4 border-l-warning'
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                  <TypeIcon
                    className="h-5 w-5 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-foreground">
                      {alert.title}
                    </h3>
                    <SeverityPill severity={alert.severity} />
                    <Badge variant="outline">{alert.alertType}</Badge>
                    <AlertStatusPill status={alert.status} />
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {alert.message}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {alert.mineCode ?? 'Mine unavailable'}
                    </span>

                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Created {formatTimestamp(alert.createdAt)}
                    </span>

                    {alert.dueDate && (
                      <span>Due {formatDate(alert.dueDate)}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                    {alert.violationId && (
                      <a
                        href={`/violations/${alert.violationId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {alert.violationCode ?? 'View violation'}
                      </a>
                    )}

                    {alert.correctiveActionId && (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <ClipboardCheck className="h-3.5 w-3.5" />
                        Corrective action: {alert.correctiveActionStatus ?? '—'}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && !error && hasActiveFilters && filtered.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length} of {alerts.length} alerts
        </p>
      )}
    </div>
  );
}
