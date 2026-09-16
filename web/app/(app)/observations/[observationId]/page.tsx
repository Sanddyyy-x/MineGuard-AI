'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  AlertTriangle,
  Calendar,
  Camera,
  ClipboardCheck,
  FileText,
  Hash,
  MapPin,
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

import {
  getObservationById,
  getObservationPhotoSignedUrl,
  type Observation,
} from '@/lib/data/observations';

interface PageProps {
  params: { observationId: string };
}

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

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-foreground">{value}</span>
      </div>
    </div>
  );
}

export default function ObservationDetailPage({
  params,
}: PageProps) {
  const { observationId } = params;

  const [observation, setObservation] =
    useState<Observation | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadObservation() {
      try {
        setLoading(true);
        setError(null);
        setPhotoUrl(null);
        setPhotoError(null);

        const data = await getObservationById(observationId);

        if (cancelled) return;

        setObservation(data);

        if (data?.photoUrl) {
          setPhotoLoading(true);

          try {
            const signedUrl =
              await getObservationPhotoSignedUrl(data.photoUrl);

            if (!cancelled) {
              setPhotoUrl(signedUrl);
            }
          } catch (err) {
            if (!cancelled) {
              console.error(
                'Failed to create observation photo URL:',
                err
              );
              setPhotoError(
                err instanceof Error
                  ? err.message
                  : 'The photo could not be loaded.'
              );
            }
          } finally {
            if (!cancelled) {
              setPhotoLoading(false);
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load observation:', err);
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load observation.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadObservation();

    return () => {
      cancelled = true;
    };
  }, [observationId]);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/observations">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Observations
          </Link>
        </Button>
        <Card>
          <CardContent className="flex items-center justify-center py-20">
            <p className="text-sm text-muted-foreground">
              Loading observation...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/observations">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Observations
          </Link>
        </Button>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">
              Failed to Load Observation
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {error}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!observation) {
    return (
      <div className="animate-fade-in">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/observations">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Observations
          </Link>
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">
              Observation Not Found
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              The observation &quot;{observationId}&quot; could not be
              found. It may have been removed or the identifier is
              incorrect.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <Button variant="ghost" size="sm" asChild className="mb-2">
        <Link href="/observations">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Observations
        </Link>
      </Button>

      <PageHeader
        title={observation.category}
        description={`${observation.id} — Inspection ${observation.inspectionId}`}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              Observation Information
            </CardTitle>
            <CardDescription>
              Field observation details recorded during an inspection
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
              <InfoRow
                icon={Hash}
                label="Observation ID"
                value={observation.id}
              />
              <InfoRow
                icon={ClipboardCheck}
                label="Inspection ID"
                value={observation.inspectionId}
              />
              <InfoRow
                icon={FileText}
                label="Category"
                value={observation.category}
              />
              <InfoRow
                icon={Calendar}
                label="Recorded At"
                value={formatDateTime(observation.createdAt)}
              />

              <div className="flex items-center gap-3 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">
                    Severity
                  </span>
                  <span
                    className={`mt-1 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-medium ${severityClass(
                      observation.severity
                    )}`}
                  >
                    {severityLabel(observation.severity)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inspection</CardTitle>
            <CardDescription>
              Parent inspection for this observation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-[180px] flex-col items-center justify-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <ClipboardCheck className="h-10 w-10 text-primary" />
              </div>
              <Link
                href={`/inspections/${observation.inspectionId}`}
                className="text-center text-sm font-medium text-foreground hover:text-primary"
              >
                View Inspection
              </Link>
              <span className="font-mono text-xs text-muted-foreground">
                {observation.inspectionId}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Description</CardTitle>
              <CardDescription>
                Details recorded by the inspector
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-foreground">
            {observation.description ||
              'No description has been recorded for this observation.'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Observation Location</CardTitle>
          <CardDescription>
            Coordinates recorded with this observation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {observation.latitude !== null &&
          observation.longitude !== null ? (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {observation.latitude.toFixed(6)},{' '}
                  {observation.longitude.toFixed(6)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Latitude / Longitude
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No location coordinates were recorded.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Photo Evidence</CardTitle>
              <CardDescription>
                Photo attached to this observation
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {!observation.photoUrl ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Camera className="h-5 w-5" />
              No photo evidence was attached to this observation.
            </div>
          ) : photoLoading ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Camera className="h-5 w-5" />
              Loading private photo evidence...
            </div>
          ) : photoError ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Photo evidence is attached, but the private storage object
                could not be opened.
              </p>
              <p className="text-xs text-muted-foreground">{photoError}</p>
            </div>
          ) : photoUrl ? (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-lg border border-border bg-muted/20">
                <img
                  src={photoUrl}
                  alt={`Observation ${observation.id}`}
                  className="max-h-[500px] w-full object-contain"
                />
              </div>
              <a
                href={photoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Open photo
              </a>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Photo evidence is recorded, but no usable photo URL was
              returned.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
