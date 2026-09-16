'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Pickaxe,
  ClipboardCheck,
  Calendar,
  User,
  MapPin,
  FileText,
  AlertTriangle,
  RefreshCw,
  Eye,
} from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { SeverityBadge } from '@/components/shared/status-badges';

import {
  getInspectionById,
  getObservationsForInspection,
  type InspectionRecord,
  type InspectionObservationRef,
} from '@/lib/data/inspections';
import { InspectionOverallStatusBadge } from '../_components/inspection-status-badge';

interface PageProps {
  params: { id: string };
}

function formatDateTime(value: string | null) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-foreground">{value}</span>
      </div>
    </div>
  );
}

function toSeverityLevel(
  severity: string | null
): 'low' | 'medium' | 'high' | 'critical' | null {
  if (!severity) return null;

  const normalized = severity.trim().toLowerCase();

  if (
    normalized === 'low' ||
    normalized === 'medium' ||
    normalized === 'high' ||
    normalized === 'critical'
  ) {
    return normalized;
  }

  return null;
}

function BackLink() {
  return (
    <Button variant="ghost" size="sm" asChild className="mb-2">
      <Link href="/inspections">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Inspections
      </Link>
    </Button>
  );
}

export default function InspectionDetailPage({ params }: PageProps) {
  const { id } = params;

  const [inspection, setInspection] =
    useState<InspectionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [observations, setObservations] = useState<
    InspectionObservationRef[]
  >([]);
  const [observationsError, setObservationsError] =
    useState<string | null>(null);
  const [observationsLoading, setObservationsLoading] =
    useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    setNotFound(false);
    setObservationsError(null);

    const { data, error: fetchError } = await getInspectionById(id);

    if (fetchError) {
      setError(fetchError);
      setInspection(null);
      setLoading(false);
      return;
    }

    if (!data) {
      setNotFound(true);
      setInspection(null);
      setLoading(false);
      return;
    }

    setInspection(data);
    setLoading(false);

    setObservationsLoading(true);

    const obsResult = await getObservationsForInspection(data.id);

    if (obsResult.error) {
      setObservationsError(obsResult.error);
      setObservations([]);
    } else {
      setObservations(obsResult.data ?? []);
    }

    setObservationsLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <BackLink />
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in space-y-4">
        <BackLink />
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Unable to load this inspection</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={load}>
                <RefreshCw className="mr-1.5 h-4 w-4" />
                Try again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (notFound || !inspection) {
    return (
      <div className="animate-fade-in">
        <BackLink />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">
              Inspection Not Found
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              The inspection with ID &quot;{id}&quot; could not be found. It may
              have been removed or the link is incorrect.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mineLabel =
    inspection.mine?.mineName ??
    inspection.mine?.mineCode ??
    inspection.mineId;

  return (
    <div className="animate-fade-in space-y-6">
      <BackLink />

      <PageHeader
        title={
          inspection.inspectionType
            ? `${inspection.inspectionType} Inspection`
            : 'Inspection'
        }
        description={`${mineLabel} — ${formatDateTime(
          inspection.inspectionDate
        )}`}
        action={
          <InspectionOverallStatusBadge
            status={inspection.overallStatus}
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Inspection Details</CardTitle>
            <CardDescription>
              Information recorded for this inspection
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
              <InfoRow
                icon={ClipboardCheck}
                label="Inspection ID"
                value={inspection.id}
              />
              <InfoRow
                icon={Pickaxe}
                label="Mine"
                value={mineLabel}
              />
              <InfoRow
                icon={FileText}
                label="Type"
                value={inspection.inspectionType ?? 'Not specified'}
              />
              <InfoRow
                icon={Calendar}
                label="Inspection Date"
                value={formatDateTime(inspection.inspectionDate)}
              />
              <InfoRow
                icon={User}
                label="Inspector"
                value={inspection.inspectorId ?? 'Unassigned'}
              />
              <InfoRow
                icon={Calendar}
                label="Recorded On"
                value={formatDateTime(inspection.createdAt)}
              />

              {inspection.latitude !== null &&
                inspection.longitude !== null && (
                  <InfoRow
                    icon={MapPin}
                    label="Location"
                    value={`${inspection.latitude.toFixed(
                      5
                    )}, ${inspection.longitude.toFixed(5)}`}
                  />
                )}
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <span className="text-xs text-muted-foreground">Summary</span>
              <p className="mt-1 text-sm text-foreground">
                {inspection.summary ??
                  'No summary was recorded for this inspection.'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Overall Status</CardTitle>
            <CardDescription>As recorded in the database</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col items-center gap-4 py-4">
              <InspectionOverallStatusBadge
                status={inspection.overallStatus}
              />

              {inspection.mine && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/mines/${inspection.mine.id}`}>
                    <Eye className="mr-1.5 h-4 w-4" />
                    View Mine
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Related Observations</CardTitle>
          <CardDescription>
            Observations recorded during this inspection
          </CardDescription>
        </CardHeader>

        <CardContent>
          {observationsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : observationsError ? (
            <p className="text-sm text-muted-foreground">
              Related observations could not be loaded for this inspection.
            </p>
          ) : observations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No observations are recorded against this inspection.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {observations.map((observation) => {
                const severityLevel = toSeverityLevel(observation.severity);

                return (
                  <li
                    key={observation.id}
                    className="flex items-start justify-between gap-4 py-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {observation.category ?? 'Uncategorized'}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {observation.description ??
                          'No description provided.'}
                      </p>
                    </div>

                    {severityLevel && (
                      <SeverityBadge severity={severityLevel} />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
