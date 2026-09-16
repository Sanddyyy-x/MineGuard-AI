'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ClipboardCheck,
  Pickaxe,
  AlertTriangle,
  HelpCircle,
  Search,
  Eye,
  RefreshCw,
} from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
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

import { getInspections, type InspectionRecord } from '@/lib/data/inspections';
import { InspectionOverallStatusBadge } from './_components/inspection-status-badge';

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function isFlagged(status: string | null) {
  if (!status) return false;
  const normalized = status.toLowerCase();
  return normalized.includes('non-compliant') || normalized.includes('non compliant') || normalized.includes('needs attention');
}

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  async function loadInspections() {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await getInspections();

    if (fetchError) {
      setError(fetchError);
      setInspections([]);
    } else {
      setInspections(data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadInspections();
  }, []);

  const inspectionTypes = useMemo(() => {
    const unique = new Set(
      inspections
        .map((i) => i.inspectionType)
        .filter((t): t is string => Boolean(t && t.trim() !== ''))
    );
    return Array.from(unique).sort();
  }, [inspections]);

  const inspectionStatuses = useMemo(() => {
    const unique = new Set(
      inspections
        .map((i) => i.overallStatus)
        .filter((s): s is string => Boolean(s && s.trim() !== ''))
    );
    return Array.from(unique).sort();
  }, [inspections]);

  const filteredInspections = useMemo(() => {
    const query = search.trim().toLowerCase();

    return inspections.filter((inspection) => {
      const matchesSearch =
        query === '' ||
        inspection.mine?.mineName?.toLowerCase().includes(query) ||
        inspection.mine?.mineCode?.toLowerCase().includes(query) ||
        inspection.mineId.toLowerCase().includes(query) ||
        inspection.inspectionType?.toLowerCase().includes(query) ||
        inspection.summary?.toLowerCase().includes(query) ||
        inspection.id.toLowerCase().includes(query);

      const matchesType =
        typeFilter === 'all' || inspection.inspectionType === typeFilter;

      const matchesStatus =
        statusFilter === 'all' || inspection.overallStatus === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [inspections, search, typeFilter, statusFilter]);

  const totalInspections = inspections.length;

  const minesCovered = useMemo(
    () => new Set(inspections.map((i) => i.mineId)).size,
    [inspections]
  );

  const flaggedCount = useMemo(
    () => inspections.filter((i) => isFlagged(i.overallStatus)).length,
    [inspections]
  );

  const missingStatusCount = useMemo(
    () =>
      inspections.filter(
        (i) => !i.overallStatus || i.overallStatus.trim() === ''
      ).length,
    [inspections]
  );

  const hasActiveFilters =
    search !== '' || typeFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Inspections"
        description="Track safety, environmental, and compliance inspections across all mine sites."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={loadInspections}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Inspections"
          value={totalInspections}
          icon={ClipboardCheck}
          accent="primary"
        />
        <StatCard
          label="Mines Covered"
          value={minesCovered}
          icon={Pickaxe}
          accent="info"
        />
        <StatCard
          label="Flagged"
          value={flaggedCount}
          icon={AlertTriangle}
          accent="warning"
        />
        <StatCard
          label="Status Not Set"
          value={missingStatusCount}
          icon={HelpCircle}
          accent="destructive"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Unable to load inspections</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={loadInspections}>
                <RefreshCw className="mr-1.5 h-4 w-4" />
                Try again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by mine, inspection type, or summary..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              disabled={loading || Boolean(error)}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              value={typeFilter}
              onValueChange={setTypeFilter}
              disabled={loading || Boolean(error)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {inspectionTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              disabled={loading || Boolean(error)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {inspectionStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="min-w-[200px]">Mine</TableHead>
                <TableHead className="min-w-[140px]">Type</TableHead>
                <TableHead className="min-w-[120px]">Date</TableHead>
                <TableHead className="min-w-[140px]">Inspector</TableHead>
                <TableHead className="min-w-[140px]">Status</TableHead>
                <TableHead className="min-w-[220px]">Summary</TableHead>
                <TableHead className="min-w-[100px] text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-12 text-center text-muted-foreground"
                  >
                    Inspection data could not be loaded. Use &quot;Try
                    again&quot; above.
                  </TableCell>
                </TableRow>
              ) : filteredInspections.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-12 text-center text-muted-foreground"
                  >
                    {inspections.length === 0
                      ? 'No inspections found in the database yet.'
                      : 'No inspections found matching the current filters.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredInspections.map((inspection) => (
                  <TableRow key={inspection.id} className="group">
                    <TableCell>
                      {inspection.mine ? (
                        <Link
                          href={`/mines/${inspection.mine.id}`}
                          className="font-medium text-foreground transition-colors group-hover:text-primary"
                        >
                          {inspection.mine.mineName ??
                            inspection.mine.mineCode ??
                            inspection.mine.id}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Unknown mine
                        </span>
                      )}

                      {inspection.mine?.mineCode && (
                        <div className="font-mono text-xs text-muted-foreground">
                          {inspection.mine.mineCode}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-sm">
                      {inspection.inspectionType ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(inspection.inspectionDate)}
                    </TableCell>

                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {inspection.inspectorId
                        ? inspection.inspectorId.slice(0, 8)
                        : 'Unassigned'}
                    </TableCell>

                    <TableCell>
                      <InspectionOverallStatusBadge
                        status={inspection.overallStatus}
                      />
                    </TableCell>

                    <TableCell className="max-w-[280px] truncate text-sm text-muted-foreground">
                      {inspection.summary ?? '—'}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/inspections/${inspection.id}`}>
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

        {!loading &&
          !error &&
          hasActiveFilters &&
          filteredInspections.length > 0 && (
            <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
              Showing {filteredInspections.length} of {inspections.length}{' '}
              inspections
            </div>
          )}
      </Card>
    </div>
  );
}
