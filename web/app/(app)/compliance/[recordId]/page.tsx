'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  AlertTriangle,
  Building2,
  Calendar,
  ClipboardList,
  FileText,
  Gauge,
  Hash,
  User,
} from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { ComplianceRecordStatusBadge } from '@/components/shared/status-badges';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

import { getComplianceRecordById } from '@/lib/data/compliance';
import type { ComplianceRecord } from '@/types';

interface PageProps {
  params: { recordId: string };
}

const scoreColor = (score: number | null) => {
  if (score === null) return 'text-muted-foreground';
  if (score >= 85) return 'text-success';
  if (score >= 70) return 'text-warning';
  if (score >= 50) return 'text-info';
  return 'text-destructive';
};

const scoreBarColor = (score: number | null) => {
  if (score === null) return 'bg-muted';
  if (score >= 85) return 'bg-success';
  if (score >= 70) return 'bg-warning';
  if (score >= 50) return 'bg-info';
  return 'bg-destructive';
};

const scoreStroke = (score: number | null) => {
  if (score === null) return 'hsl(var(--muted))';
  if (score >= 85) return 'hsl(var(--success))';
  if (score >= 70) return 'hsl(var(--warning))';
  if (score >= 50) return 'hsl(var(--info))';
  return 'hsl(var(--destructive))';
};

const riskLabel = (score: number | null) => {
  if (score === null) return 'Unavailable';
  if (score >= 85) return 'Low';
  if (score >= 70) return 'Moderate';
  if (score >= 50) return 'Elevated';
  return 'High';
};

const dataSourceLabel = (source: string) =>
  source
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Hash;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">
          {label}
        </span>

        <span className="text-sm font-medium text-foreground">
          {value}
        </span>
      </div>
    </div>
  );
}

export default function ComplianceRecordDetailPage({
  params,
}: PageProps) {
  const { recordId } = params;

  const [record, setRecord] = useState<ComplianceRecord | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRecord() {
      try {
        setLoading(true);
        setError(null);

        const data = await getComplianceRecordById(recordId);

        if (!cancelled) {
          setRecord(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(
            'Failed to load compliance record:',
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load compliance record.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRecord();

    return () => {
      cancelled = true;
    };
  }, [recordId]);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mb-4"
        >
          <Link href="/compliance">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Compliance
          </Link>
        </Button>

        <Card>
          <CardContent className="flex items-center justify-center py-20">
            <p className="text-sm text-muted-foreground">
              Loading compliance record...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mb-4"
        >
          <Link href="/compliance">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Compliance
          </Link>
        </Button>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive" />

            <h2 className="mt-4 text-lg font-semibold text-foreground">
              Failed to Load Compliance Record
            </h2>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {error}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="animate-fade-in">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mb-4"
        >
          <Link href="/compliance">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Compliance
          </Link>
        </Button>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground" />

            <h2 className="mt-4 text-lg font-semibold text-foreground">
              Compliance Record Not Found
            </h2>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              The compliance record &quot;{recordId}&quot; could
              not be found. It may have been removed or the
              identifier is incorrect.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mb-2"
        >
          <Link href="/compliance">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Compliance
          </Link>
        </Button>
      </div>

      <PageHeader
        title={record.requirement}
        description={`${record.id} — ${record.mineCode} ${record.mineName}`}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              Record Information
            </CardTitle>

            <CardDescription>
              Requirement, mine, and tracking details
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
              <InfoRow
                icon={Hash}
                label="Record ID"
                value={record.id}
              />

              <InfoRow
                icon={ClipboardList}
                label="Requirement ID"
                value={record.requirementId}
              />

              <div className="flex items-center gap-3 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">
                    Mine
                  </span>

                  <Link
                    href={`/mines/${record.mineId}`}
                    className="text-sm font-medium text-foreground hover:text-primary"
                  >
                    {record.mineCode} — {record.mineName}
                  </Link>
                </div>
              </div>

              <InfoRow
                icon={FileText}
                label="Data Source"
                value={dataSourceLabel(record.dataSource)}
              />

              <InfoRow
                icon={Calendar}
                label="Due Date"
                value={formatDate(record.dueDate)}
              />

              <InfoRow
                icon={Calendar}
                label="Completion Date"
                value={
                  record.completionDate
                    ? formatDate(record.completionDate)
                    : '—'
                }
              />

              <InfoRow
                icon={User}
                label="Created By"
                value={record.createdBy ?? '—'}
              />

              <div className="flex items-center gap-3 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <span className="text-xs font-semibold text-muted-foreground">
                    ST
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">
                    Status
                  </span>

                  <ComplianceRecordStatusBadge
                    status={record.status}
                  />
                </div>
              </div>

              <InfoRow
                icon={Calendar}
                label="Created At"
                value={formatDate(record.createdAt)}
              />

              <InfoRow
                icon={Calendar}
                label="Updated At"
                value={formatDate(record.updatedAt)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Compliance Score
            </CardTitle>

            <CardDescription>
              Score and derived risk for this requirement
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="relative flex h-32 w-32 items-center justify-center">
                <svg
                  className="h-32 w-32 -rotate-90"
                  viewBox="0 0 120 120"
                >
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="10"
                  />

                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke={scoreStroke(
                      record.complianceScore
                    )}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={
                      record.complianceScore === null
                        ? '0 327'
                        : `${
                            (Math.min(
                              100,
                              Math.max(
                                0,
                                record.complianceScore
                              )
                            ) /
                              100) *
                            327
                          } 327`
                    }
                  />
                </svg>

                <div className="absolute flex flex-col items-center">
                  <span
                    className={`text-3xl font-bold ${scoreColor(
                      record.complianceScore
                    )}`}
                  >
                    {record.complianceScore === null
                      ? '—'
                      : `${record.complianceScore}%`}
                  </span>
                </div>
              </div>

              <ComplianceRecordStatusBadge
                status={record.status}
              />

              <div className="w-full space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Risk
                  </span>

                  <span
                    className={`font-medium ${scoreColor(
                      record.complianceScore
                    )}`}
                  >
                    {riskLabel(record.complianceScore)}
                  </span>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  {record.complianceScore !== null && (
                    <div
                      className={`h-full rounded-full transition-all ${scoreBarColor(
                        record.complianceScore
                      )}`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            record.complianceScore
                          )
                        )}%`,
                      }}
                    />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Due Date
                  </span>

                  <span className="font-medium">
                    {formatDate(record.dueDate)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />

            <div>
              <CardTitle className="text-lg">
                Remarks
              </CardTitle>

              <CardDescription>
                Notes recorded for this compliance requirement
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-foreground">
            {record.remarks || 'No remarks recorded.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}