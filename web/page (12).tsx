'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Building2,
  Layers,
  Users,
  Target,
  TrendingUp,
  Calendar,
  Gauge,
  Package,
  Ruler,
  ClipboardCheck,
  AlertTriangle,
  Wrench,
  Bell,
} from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import {
  MineStatusBadge,
  StatusBadge,
  SeverityBadge,
  InspectionStatusBadge,
} from '@/components/shared/status-badges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mockMines, mockInspections, mockViolations, mockCorrectiveActions, mockAlerts } from '@/lib/mock-data';

interface PageProps {
  params: { mineId: string };
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

export default function MineDetailPage({ params }: PageProps) {
  const { mineId } = params;

  const mine = mockMines.find((m) => m.id === mineId);
  if (!mine) {
    return (
      <div className="animate-fade-in">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/mines">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Mines
          </Link>
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Mine Not Found</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              The mine with code &quot;{mineId}&quot; could not be found. It may have been
              removed or the code is incorrect.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const inspections = mockInspections.filter((i) => i.mineId === mine.id);
  const violations = mockViolations.filter((v) => v.mineId === mine.id);
  const correctiveActions = mockCorrectiveActions.filter((ca) => ca.mineId === mine.id);
  const alerts = mockAlerts.filter((a) => a.mineId === mine.id);

  const productionPct = Math.round((mine.productionAchieved / mine.productionTarget) * 100);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Back navigation */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/mines">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Mines
          </Link>
        </Button>
      </div>

      <PageHeader
        title={mine.name}
        description={`${mine.code} — ${mine.location}`}
      />

      {/* Top section: key info + compliance score */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Mine basic info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Mine Information</CardTitle>
            <CardDescription>Basic operational and location details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
              <InfoRow icon={Building2} label="Operator" value={mine.operator} />
              <InfoRow icon={MapPin} label="Location" value={mine.location} />
              <InfoRow icon={MapPin} label="State" value={mine.state} />
              <InfoRow icon={MapPin} label="District" value={mine.district} />
              <InfoRow icon={Layers} label="Mine Type" value={mine.type.charAt(0).toUpperCase() + mine.type.slice(1)} />
              <InfoRow icon={Package} label="Coal Grade" value={mine.coalGrade} />
              <InfoRow icon={Ruler} label="Area (hectares)" value={mine.area.toLocaleString('en-IN')} />
              <InfoRow icon={Gauge} label="Reserves (MT)" value={mine.reserves.toLocaleString('en-IN')} />
              <InfoRow icon={Users} label="Workforce" value={mine.workforce.toLocaleString('en-IN')} />
              <div className="flex items-center gap-3 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <span className="text-xs font-semibold text-muted-foreground">ST</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <MineStatusBadge status={mine.status} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance score */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compliance Score</CardTitle>
            <CardDescription>Overall compliance status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="relative flex h-32 w-32 items-center justify-center">
                <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
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
                    stroke={
                      mine.complianceScore >= 85
                        ? 'hsl(var(--success))'
                        : mine.complianceScore >= 70
                        ? 'hsl(var(--warning))'
                        : 'hsl(var(--destructive))'
                    }
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(mine.complianceScore / 100) * 327} 327`}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold text-foreground">{mine.complianceScore}%</span>
                </div>
              </div>
              <StatusBadge level={mine.complianceLevel} />
              <div className="w-full space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Open Violations</span>
                  <span className="font-medium text-destructive">{mine.openViolations}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Inspection</span>
                  <span className="font-medium">
                    {new Date(mine.lastInspection).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Next Inspection</span>
                  <span className="font-medium">
                    {new Date(mine.nextInspection).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Production summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Target className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Production Target</span>
              <span className="text-xl font-bold text-foreground">{mine.productionTarget.toLocaleString('en-IN')} T</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-success/10 text-success">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Achieved</span>
              <span className="text-xl font-bold text-foreground">{mine.productionAchieved.toLocaleString('en-IN')} T</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Production Progress</span>
              <span className="text-sm font-bold text-foreground">{productionPct}%</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${productionPct}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent inspections */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Recent Inspections</CardTitle>
              <CardDescription>Latest inspection records for this mine</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {inspections.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No inspections recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Inspector</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Observations</TableHead>
                    <TableHead className="text-center">Violations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspections.map((insp) => (
                    <TableRow key={insp.id}>
                      <TableCell className="text-sm">
                        {new Date(insp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-sm capitalize">{insp.type}</TableCell>
                      <TableCell className="text-sm">{insp.inspector}</TableCell>
                      <TableCell>
                        <InspectionStatusBadge status={insp.status} />
                      </TableCell>
                      <TableCell className="text-center text-sm">{insp.observations}</TableCell>
                      <TableCell className="text-center text-sm">{insp.violations}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Open violations + corrective actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <CardTitle className="text-lg">Open Violations</CardTitle>
                <CardDescription>Regulatory violations requiring attention</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {violations.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No open violations.</p>
            ) : (
              <div className="space-y-3">
                {violations.map((v) => (
                  <div key={v.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-foreground">{v.regulation}</span>
                        <p className="mt-1 text-xs text-muted-foreground">{v.description}</p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(v.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span>Penalty: Rs {v.penalty.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <SeverityBadge severity={v.severity} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-warning" />
              <div>
                <CardTitle className="text-lg">Corrective Actions</CardTitle>
                <CardDescription>Remediation efforts and progress</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {correctiveActions.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No corrective actions.</p>
            ) : (
              <div className="space-y-3">
                {correctiveActions.map((ca) => (
                  <div key={ca.id} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-medium text-foreground">{ca.description}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{ca.assignedTo}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due {new Date(ca.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{ca.progress}%</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${ca.progress}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-warning" />
            <div>
              <CardTitle className="text-lg">Recent Alerts</CardTitle>
              <CardDescription>Safety and compliance notifications for this mine</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No recent alerts.</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-foreground">{alert.title}</span>
                      <p className="mt-1 text-xs text-muted-foreground">{alert.description}</p>
                      <span className="mt-1 block text-xs text-muted-foreground capitalize">
                        Type: {alert.type.replace('_', ' ')}
                      </span>
                    </div>
                    <SeverityBadge severity={alert.severity} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
