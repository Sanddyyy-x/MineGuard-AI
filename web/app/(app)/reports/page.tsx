'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  FileBarChart,
  Printer,
  Download,
  FileDown,
  Search,
  ListChecks,
  AlertTriangle,
  CalendarRange,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { SeverityBadge } from '@/components/shared/status-badges';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
  REPORT_COLUMNS,
  REPORT_TYPE_LABELS,
  rowsToCsv,
  type ReportType,
  type ReportRow,
} from './_data/report-definitions';
import { getReportData } from '@/lib/data/reports';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(var(--success))',
  'hsl(var(--info))',
];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function titleCase(value: string) {
  return value.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allRows, setAllRows] = useState<ReportRow[]>([]);
  const [mineOptions, setMineOptions] = useState<string[]>([]);
  const [reportType, setReportType] = useState<ReportType>('compliance');
  const [mineFilter, setMineFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      setLoading(true);
      setError(null);

      const result = await getReportData(reportType, dateFrom || undefined, dateTo || undefined);
      if (cancelled) return;

      setAllRows(result.rows);
      setMineOptions(result.mineNames);
      setError(result.error);
      setLoading(false);
    }

    loadReport();
    return () => {
      cancelled = true;
    };
  }, [reportType, dateFrom, dateTo]);

  // Reset type-specific filters when switching report type
  useEffect(() => {
    setStatusFilter('all');
  }, [reportType]);

  const statusOptions = useMemo(
    () => Array.from(new Set(allRows.map((row) => row.status).filter(Boolean))).sort(),
    [allRows]
  );
  const columns = REPORT_COLUMNS[reportType];

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allRows.filter((row) => {
      const matchesMine = mineFilter === 'all' || row.mineName === mineFilter;
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
      const matchesSearch =
        query === '' ||
        row.primary.toLowerCase().includes(query) ||
        row.secondary.toLowerCase().includes(query) ||
        row.mineName.toLowerCase().includes(query);

      const rowDate = row.date ? row.date.slice(0, 10) : '';
      const matchesFrom = dateFrom === '' || (rowDate !== '' && rowDate >= dateFrom);
      const matchesTo = dateTo === '' || (rowDate !== '' && rowDate <= dateTo);

      return matchesMine && matchesStatus && matchesSearch && matchesFrom && matchesTo;
    });
  }, [allRows, mineFilter, statusFilter, search, dateFrom, dateTo]);

  const statusBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    filteredRows.forEach((row) => {
      if (!row.status) return;
      counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
    });
    return Array.from(counts.entries()).map(([status, count]) => ({
      status: titleCase(status),
      count,
    }));
  }, [filteredRows]);

  const highSeverityCount = filteredRows.filter(
    (r) => r.severity === 'high' || r.severity === 'critical'
  ).length;
  const minesCovered = new Set(filteredRows.map((r) => r.mineName)).size;

  const hasActiveFilters =
    mineFilter !== 'all' || statusFilter !== 'all' || search !== '' || dateFrom !== '' || dateTo !== '';

  function resetFilters() {
    setMineFilter('all');
    setStatusFilter('all');
    setSearch('');
    setDateFrom('');
    setDateTo('');
  }

  function handlePrint() {
    window.print();
  }

  function handleExportCsv() {
    const csv = rowsToCsv(filteredRows, columns);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mineguard-${reportType}-report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Reports"
        description="Generate compliance, inspection, and operational reports from data available to your account."
      />

      {/* Report type + filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
              <SelectTrigger aria-label="Select report type">
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(REPORT_TYPE_LABELS) as ReportType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {REPORT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={mineFilter} onValueChange={setMineFilter}>
              <SelectTrigger aria-label="Filter by mine">
                <SelectValue placeholder="Filter by Mine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Mines</SelectItem>
                {mineOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {statusOptions.length > 0 && (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger aria-label="Filter by status">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {titleCase(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search report rows..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                aria-label="Search report rows"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarRange className="h-4 w-4" />
              Date range
            </div>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full sm:w-[170px]"
              aria-label="Date from"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full sm:w-[170px]"
              aria-label="Date to"
            />
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="sm:ml-auto">
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex min-h-40 items-center justify-center p-6 text-center">
            <div>
              <p className="font-medium text-destructive">Unable to load report</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Records in Report"
              value={filteredRows.length}
              icon={FileBarChart}
              accent="primary"
            />
            <StatCard label="Mines Covered" value={minesCovered} icon={ListChecks} accent="info" />
            <StatCard
              label="High/Critical Severity"
              value={highSeverityCount}
              icon={AlertTriangle}
              accent="destructive"
            />
            <StatCard
              label="Status Categories"
              value={statusBreakdown.length}
              icon={ListChecks}
              accent="success"
            />
          </div>

          {/* Chart + export actions */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Status Distribution</CardTitle>
                <CardDescription>{REPORT_TYPE_LABELS[reportType]} — current filters applied</CardDescription>
              </CardHeader>
              <CardContent>
                {statusBreakdown.length === 0 ? (
                  <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                    No records match the current filters.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={statusBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="status" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.5rem',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Records">
                        {statusBreakdown.map((entry, idx) => (
                          <Cell key={entry.status} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Export Report</CardTitle>
                <CardDescription>Based on the current filtered preview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Preview
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleExportCsv}
                  disabled={filteredRows.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export as CSV
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <FileDown className="mr-2 h-4 w-4" />
                  Export as PDF
                </Button>
                <p className="text-xs text-muted-foreground">
                  PDF export is not yet connected. CSV export downloads the currently filtered live report data.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Report table */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">Report Preview</CardTitle>
              <CardDescription>
                {filteredRows.length} of {allRows.length} {REPORT_TYPE_LABELS[reportType].toLowerCase()} records
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      {columns.map((col) => (
                        <TableHead key={col.key} className="min-w-[140px]">
                          {col.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="py-12 text-center text-muted-foreground"
                        >
                          No records found for the selected report type and filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRows.map((row) => (
                        <TableRow key={row.id}>
                          {columns.map((col) => {
                            if (col.key === 'severity') {
                              return (
                                <TableCell key={col.key}>
                                  {row.severity ? <SeverityBadge severity={row.severity} /> : '—'}
                                </TableCell>
                              );
                            }
                            if (col.key === 'status') {
                              return (
                                <TableCell key={col.key}>
                                  <Badge variant="outline">{titleCase(row.status)}</Badge>
                                </TableCell>
                              );
                            }
                            if (col.key === 'date') {
                              return (
                                <TableCell key={col.key} className="text-sm text-muted-foreground">
                                  {formatDate(row.date)}
                                </TableCell>
                              );
                            }
                            if (col.key === 'secondary') {
                              return (
                                <TableCell
                                  key={col.key}
                                  className="max-w-[260px] truncate text-sm text-muted-foreground"
                                >
                                  {row.secondary}
                                </TableCell>
                              );
                            }
                            if (col.key === 'mineName') {
                              return (
                                <TableCell key={col.key} className="font-medium text-foreground">
                                  {row.mineName}
                                </TableCell>
                              );
                            }
                            return (
                              <TableCell key={col.key} className="text-sm text-foreground">
                                {row.primary}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
