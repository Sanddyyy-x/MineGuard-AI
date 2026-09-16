'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Eye,
  Search,
  Calendar,
  MapPin,
  Camera,
  ClipboardCheck,
} from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  getObservations,
  type Observation,
} from '@/lib/data/observations';

function severityLabel(severity: string) {
  return severity
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function severityClass(severity: string) {
  const normalized = severity.toLowerCase().replace(/[_-]/g, ' ');

  if (
    normalized.includes('critical') ||
    normalized.includes('high') ||
    normalized.includes('severe')
  ) {
    return 'bg-destructive/10 text-destructive';
  }

  if (
    normalized.includes('medium') ||
    normalized.includes('moderate')
  ) {
    return 'bg-warning/10 text-warning';
  }

  if (
    normalized.includes('low') ||
    normalized.includes('minor')
  ) {
    return 'bg-info/10 text-info';
  }

  return 'bg-muted text-muted-foreground';
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ObservationsPage() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;

    async function loadObservations() {
      try {
        setLoading(true);
        setError(null);

        const data = await getObservations();

        if (!cancelled) {
          setObservations(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load observations:', err);
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load observations.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadObservations();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(observations.map((observation) => observation.category))
      ).sort(),
    [observations]
  );

  const severities = useMemo(
    () =>
      Array.from(
        new Set(observations.map((observation) => observation.severity))
      ).sort(),
    [observations]
  );

  const filteredObservations = useMemo(() => {
    const q = search.trim().toLowerCase();

    return observations.filter((observation) => {
      const matchesSearch =
        q === '' ||
        observation.id.toLowerCase().includes(q) ||
        observation.inspectionId.toLowerCase().includes(q) ||
        observation.category.toLowerCase().includes(q) ||
        observation.description.toLowerCase().includes(q) ||
        observation.severity.toLowerCase().includes(q);

      return (
        matchesSearch &&
        (severityFilter === 'all' ||
          observation.severity === severityFilter) &&
        (categoryFilter === 'all' ||
          observation.category === categoryFilter)
      );
    });
  }, [observations, search, severityFilter, categoryFilter]);

  const highSeverityCount = observations.filter((observation) => {
    const severity = observation.severity.toLowerCase();

    return (
      severity.includes('critical') ||
      severity.includes('high') ||
      severity.includes('severe')
    );
  }).length;

  const withPhotoCount = observations.filter(
    (observation) => Boolean(observation.photoUrl)
  ).length;

  const categoriesCount = new Set(
    observations.map((observation) => observation.category)
  ).size;

  const hasActiveFilters =
    search !== '' ||
    severityFilter !== 'all' ||
    categoryFilter !== 'all';

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Observations"
        description="Field observations recorded during inspections, categorized by type and severity."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Observations"
          value={observations.length}
          icon={Eye}
          accent="primary"
        />
        <StatCard
          label="High / Critical"
          value={highSeverityCount}
          icon={Eye}
          accent="destructive"
        />
        <StatCard
          label="With Photo"
          value={withPhotoCount}
          icon={Camera}
          accent="info"
        />
        <StatCard
          label="Categories"
          value={categoriesCount}
          icon={ClipboardCheck}
          accent="warning"
        />
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by observation, inspection, category, or severity..."
              className="pl-10"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Select
              value={severityFilter}
              onValueChange={setSeverityFilter}
              disabled={loading || Boolean(error)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                {severities.map((severity) => (
                  <SelectItem key={severity} value={severity}>
                    {severityLabel(severity)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              disabled={loading || Boolean(error)}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {loading && (
        <Card className="py-12 text-center text-muted-foreground">
          Loading observations...
        </Card>
      )}

      {!loading && error && (
        <Card className="border-destructive/30 bg-destructive/5 p-6">
          <p className="font-medium text-destructive">
            Failed to load observations
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Card>
      )}

      {!loading && !error && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="min-w-[220px]">Observation</TableHead>
                  <TableHead className="min-w-[180px]">Inspection</TableHead>
                  <TableHead className="min-w-[150px]">Category</TableHead>
                  <TableHead className="min-w-[130px]">Severity</TableHead>
                  <TableHead className="min-w-[300px]">Description</TableHead>
                  <TableHead className="min-w-[180px]">Location</TableHead>
                  <TableHead className="min-w-[130px]">Recorded</TableHead>
                  <TableHead className="min-w-[80px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredObservations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-12 text-center text-muted-foreground"
                    >
                      No observations found matching the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredObservations.map((observation) => (
                    <TableRow key={observation.id} className="group">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-muted-foreground">
                            {observation.id}
                          </span>
                          {observation.photoUrl && (
                            <span className="mt-1 flex items-center gap-1 text-xs text-info">
                              <Camera className="h-3 w-3" />
                              Photo attached
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Link
                          href={`/inspections/${observation.inspectionId}`}
                          className="font-mono text-xs text-foreground hover:text-primary"
                        >
                          {observation.inspectionId}
                        </Link>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm font-medium text-foreground">
                          {observation.category}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${severityClass(
                            observation.severity
                          )}`}
                        >
                          {severityLabel(observation.severity)}
                        </span>
                      </TableCell>

                      <TableCell className="max-w-[300px]">
                        <span className="line-clamp-2 text-sm text-muted-foreground">
                          {observation.description || '—'}
                        </span>
                      </TableCell>

                      <TableCell>
                        {observation.latitude !== null &&
                        observation.longitude !== null ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {observation.latitude.toFixed(4)},{' '}
                              {observation.longitude.toFixed(4)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(observation.createdAt)}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/observations/${observation.id}`}>
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {hasActiveFilters && filteredObservations.length > 0 && (
            <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
              Showing {filteredObservations.length} of {observations.length}{' '}
              observations
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
