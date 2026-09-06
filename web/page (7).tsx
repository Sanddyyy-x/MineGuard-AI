'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Gauge,
  Search,
  Eye,
} from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { ComplianceRecordStatusBadge } from '@/components/shared/status-badges';
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
import { mockComplianceRecords } from '@/lib/mock-compliance';
import { mockMines } from '@/lib/mock-data';
import type { ComplianceRecordStatus } from '@/types';

const scoreColor = (score: number) => {
  if (score >= 85) return 'text-success';
  if (score >= 70) return 'text-warning';
  if (score >= 50) return 'text-info';
  return 'text-destructive';
};

const scoreBarColor = (score: number) => {
  if (score >= 85) return 'bg-success';
  if (score >= 70) return 'bg-warning';
  if (score >= 50) return 'bg-info';
  return 'bg-destructive';
};

const riskLabel = (score: number) => {
  if (score >= 85) return 'Low';
  if (score >= 70) return 'Moderate';
  if (score >= 50) return 'Elevated';
  return 'High';
};

export default function CompliancePage() {
  const [search, setSearch] = useState('');
  const [mineFilter, setMineFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dueDateFilter, setDueDateFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  const filteredRecords = useMemo(() => {
    return mockComplianceRecords.filter((rec) => {
      const q = search.toLowerCase();
      const matchesSearch =
        rec.mineName.toLowerCase().includes(q) ||
        rec.mineCode.toLowerCase().includes(q) ||
        rec.requirement.toLowerCase().includes(q) ||
        rec.remarks.toLowerCase().includes(q);

      const matchesMine = mineFilter === 'all' || rec.mineId === mineFilter;
      const matchesStatus = statusFilter === 'all' || rec.status === statusFilter;

      let matchesDueDate = true;
      if (dueDateFilter !== 'all') {
        const due = new Date(rec.dueDate);
        const now = new Date('2026-09-06');
        const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (dueDateFilter === 'overdue') matchesDueDate = diffDays < 0;
        else if (dueDateFilter === '7days') matchesDueDate = diffDays >= 0 && diffDays <= 7;
        else if (dueDateFilter === '30days') matchesDueDate = diffDays >= 0 && diffDays <= 30;
        else if (dueDateFilter === 'future') matchesDueDate = diffDays > 30;
      }

      let matchesRisk = true;
      if (riskFilter !== 'all') {
        const label = riskLabel(rec.complianceScore);
        matchesRisk = label === riskFilter;
      }

      return matchesSearch && matchesMine && matchesStatus && matchesDueDate && matchesRisk;
    });
  }, [search, mineFilter, statusFilter, dueDateFilter, riskFilter]);

  const totalRecords = mockComplianceRecords.length;
  const compliantCount = mockComplianceRecords.filter((r) => r.status === 'compliant').length;
  const pendingCount = mockComplianceRecords.filter(
    (r) => r.status === 'pending' || r.status === 'in_progress'
  ).length;
  const overdueCount = mockComplianceRecords.filter(
    (r) => r.status === 'overdue' || r.status === 'non_compliant'
  ).length;
  const avgScore = Math.round(
    mockComplianceRecords.reduce((sum, r) => sum + r.complianceScore, 0) / totalRecords
  );

  const hasActiveFilters =
    search !== '' || mineFilter !== 'all' || statusFilter !== 'all' ||
    dueDateFilter !== 'all' || riskFilter !== 'all';

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Compliance"
        description="Monitor compliance requirements, deadlines, and completion status across all monitored mines."
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Records" value={totalRecords} icon={ClipboardList} accent="primary" />
        <StatCard label="Compliant" value={compliantCount} icon={CheckCircle2} accent="success" />
        <StatCard label="Due / Pending" value={pendingCount} icon={Clock} accent="info" />
        <StatCard label="Overdue" value={overdueCount} icon={AlertOctagon} accent="destructive" />
        <StatCard label="Avg Score" value={`${avgScore}%`} icon={Gauge} accent="warning" />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by mine name, code, requirement, or remarks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select value={mineFilter} onValueChange={setMineFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by Mine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Mines</SelectItem>
                {mockMines.map((mine) => (
                  <SelectItem key={mine.id} value={mine.id}>
                    {mine.code} — {mine.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="compliant">Compliant</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="non_compliant">Non-Compliant</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by Due Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Due Dates</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="7days">Due in 7 days</SelectItem>
                <SelectItem value="30days">Due in 30 days</SelectItem>
                <SelectItem value="future">Due after 30 days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by Risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="Low">Low (85+)</SelectItem>
                <SelectItem value="Moderate">Moderate (70-84)</SelectItem>
                <SelectItem value="Elevated">Elevated (50-69)</SelectItem>
                <SelectItem value="High">High (&lt;50)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Compliance records table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="min-w-[180px]">Mine</TableHead>
                <TableHead className="min-w-[250px]">Requirement</TableHead>
                <TableHead className="min-w-[120px]">Due Date</TableHead>
                <TableHead className="min-w-[120px]">Completion Date</TableHead>
                <TableHead className="min-w-[120px]">Status</TableHead>
                <TableHead className="min-w-[140px]">Compliance Score</TableHead>
                <TableHead className="min-w-[200px]">Remarks</TableHead>
                <TableHead className="min-w-[80px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    No compliance records found matching the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((rec) => (
                  <TableRow key={rec.id} className="group">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{rec.mineName}</span>
                        <span className="font-mono text-xs text-muted-foreground">{rec.mineCode}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground">{rec.requirement}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{rec.requirementId}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(rec.dueDate).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {rec.completionDate
                        ? new Date(rec.completionDate).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <ComplianceRecordStatusBadge status={rec.status as ComplianceRecordStatus} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${scoreColor(rec.complianceScore)}`}>
                            {rec.complianceScore}%
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {riskLabel(rec.complianceScore)}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all ${scoreBarColor(rec.complianceScore)}`}
                            style={{ width: `${rec.complianceScore}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <span className="line-clamp-2 text-sm text-muted-foreground">{rec.remarks}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/compliance/${rec.id}`}>
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
        {hasActiveFilters && filteredRecords.length > 0 && (
          <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
            Showing {filteredRecords.length} of {mockComplianceRecords.length} records
          </div>
        )}
      </Card>
    </div>
  );
}
