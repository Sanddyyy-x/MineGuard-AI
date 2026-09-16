'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Pickaxe,
  Activity,
  AlertTriangle,
  Gauge,
  Search,
  Eye,
} from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { MineStatusBadge, StatusBadge } from '@/components/shared/status-badges';
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

import { getMines } from '@/lib/data/mines';
import type { Mine, MineStatus, ComplianceLevel } from '@/types';

const complianceScoreColor = (score: number) => {
  if (score >= 85) return 'text-success';
  if (score >= 70) return 'text-warning';
  return 'text-destructive';
};

const scoreBarColor = (score: number) => {
  if (score >= 85) return 'bg-success';
  if (score >= 70) return 'bg-warning';
  return 'bg-destructive';
};

export default function MinesPage() {
  const [mines, setMines] = useState<Mine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [complianceFilter, setComplianceFilter] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;

    async function loadMines() {
      try {
        setLoading(true);
        setError(null);

        const data = await getMines();

        if (!cancelled) {
          setMines(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load mines.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMines();

    return () => {
      cancelled = true;
    };
  }, []);

  const states = useMemo(() => {
    const unique = Array.from(new Set(mines.map((mine) => mine.state)));
    return unique.filter(Boolean).sort();
  }, [mines]);

  const filteredMines = useMemo(() => {
    return mines.filter((mine) => {
      const searchTerm = search.toLowerCase();

      const matchesSearch =
        mine.name.toLowerCase().includes(searchTerm) ||
        mine.code.toLowerCase().includes(searchTerm);

      const matchesState =
        stateFilter === 'all' || mine.state === stateFilter;

      const matchesStatus =
        statusFilter === 'all' || mine.status === statusFilter;

      const matchesCompliance =
        complianceFilter === 'all' ||
        mine.complianceLevel === complianceFilter;

      return (
        matchesSearch &&
        matchesState &&
        matchesStatus &&
        matchesCompliance
      );
    });
  }, [mines, search, stateFilter, statusFilter, complianceFilter]);

  const totalMines = mines.length;

  const activeMines = mines.filter(
    (mine) => mine.status === 'active'
  ).length;

  const minesRequiringAttention = mines.filter(
    (mine) =>
      mine.complianceLevel === 'critical' ||
      mine.complianceLevel === 'warning'
  ).length;

  const avgCompliance =
    mines.length > 0
      ? Math.round(
          mines.reduce(
            (sum, mine) => sum + mine.complianceScore,
            0
          ) / mines.length
        )
      : 0;

  const hasActiveFilters =
    search !== '' ||
    stateFilter !== 'all' ||
    statusFilter !== 'all' ||
    complianceFilter !== 'all';

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Mines"
        description="Monitor and manage compliance across all monitored coal mines."
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Mines"
          value={totalMines}
          icon={Pickaxe}
          accent="primary"
        />

        <StatCard
          label="Active Mines"
          value={activeMines}
          icon={Activity}
          accent="success"
        />

        <StatCard
          label="Requiring Attention"
          value={minesRequiringAttention}
          icon={AlertTriangle}
          accent="warning"
        />

        <StatCard
          label="Average Compliance"
          value={`${avgCompliance}%`}
          icon={Gauge}
          accent="info"
        />
      </div>

      {/* Loading state */}
      {loading && (
        <Card className="p-8">
          <div className="text-center text-sm text-muted-foreground">
            Loading mines...
          </div>
        </Card>
      )}

      {/* Error state */}
      {!loading && error && (
        <Card className="border-destructive/30 p-8">
          <div className="text-center">
            <p className="font-medium text-destructive">
              Unable to load mines
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {error}
            </p>
          </div>
        </Card>
      )}

      {/* Filters + table */}
      {!loading && !error && (
        <>
          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  placeholder="Search by mine name or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Select
                  value={stateFilter}
                  onValueChange={setStateFilter}
                >
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Filter by State" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">
                      All States
                    </SelectItem>

                    {states.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">
                      All Statuses
                    </SelectItem>

                    <SelectItem value="active">
                      Active
                    </SelectItem>

                    <SelectItem value="under_review">
                      Under Review
                    </SelectItem>

                    <SelectItem value="suspended">
                      Suspended
                    </SelectItem>

                    <SelectItem value="closed">
                      Closed
                    </SelectItem>

                    <SelectItem value="as_documented">
                      As Documented
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={complianceFilter}
                  onValueChange={setComplianceFilter}
                >
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Filter by Compliance" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="all">
                      All Compliance
                    </SelectItem>

                    <SelectItem value="compliant">
                      Compliant
                    </SelectItem>

                    <SelectItem value="warning">
                      Warning
                    </SelectItem>

                    <SelectItem value="critical">
                      Critical
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Mines table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="min-w-[200px]">
                      Mine Name
                    </TableHead>

                    <TableHead className="min-w-[100px]">
                      Code
                    </TableHead>

                    <TableHead className="min-w-[120px]">
                      State
                    </TableHead>

                    <TableHead className="min-w-[120px]">
                      District
                    </TableHead>

                    <TableHead className="min-w-[90px]">
                      Coal Grade
                    </TableHead>

                    <TableHead className="min-w-[120px]">
                      Status
                    </TableHead>

                    <TableHead className="min-w-[130px]">
                      Compliance
                    </TableHead>

                    <TableHead className="min-w-[120px]">
                      Last Inspection
                    </TableHead>

                    <TableHead className="min-w-[100px] text-center">
                      Open Violations
                    </TableHead>

                    <TableHead className="min-w-[100px] text-right">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredMines.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="py-12 text-center text-muted-foreground"
                      >
                        No mines found matching the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMines.map((mine) => (
                      <TableRow
                        key={mine.id}
                        className="group"
                      >
                        <TableCell>
                          <Link
                            href={`/mines/${mine.id}`}
                            className="font-medium text-foreground transition-colors group-hover:text-primary"
                          >
                            {mine.name}
                          </Link>
                        </TableCell>

                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {mine.code}
                        </TableCell>

                        <TableCell className="text-sm">
                          {mine.state}
                        </TableCell>

                        <TableCell className="text-sm">
                          {mine.district}
                        </TableCell>

                        <TableCell>
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                            {mine.coalGrade ?? '—'}
                          </span>
                        </TableCell>

                        <TableCell>
                          <MineStatusBadge
                            status={mine.status as MineStatus}
                          />
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-semibold ${complianceScoreColor(
                                  mine.complianceScore
                                )}`}
                              >
                                {mine.complianceScore}%
                              </span>

                              <StatusBadge
                                level={
                                  mine.complianceLevel as ComplianceLevel
                                }
                              />
                            </div>

                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className={`h-full rounded-full transition-all ${scoreBarColor(
                                  mine.complianceScore
                                )}`}
                                style={{
                                  width: `${mine.complianceScore}%`,
                                }}
                              />
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">
                          {mine.lastInspection ? (
                            new Date(
                              mine.lastInspection
                            ).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          ) : (
                            '—'
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          <span
                            className={`text-sm font-medium ${
                              (mine.openViolations ?? 0) > 0
                                ? 'text-destructive'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {mine.openViolations ?? '—'}
                          </span>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link
                              href={`/mines/${mine.id}`}
                            >
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

            {hasActiveFilters &&
              filteredMines.length > 0 && (
                <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
                  Showing {filteredMines.length} of {mines.length}{' '}
                  mines
                </div>
              )}
          </Card>
        </>
      )}
    </div>
  );
}