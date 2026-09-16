import { supabase } from '@/lib/supabase-client';

export interface DashboardStatData {
  totalMines: number;
  complianceRate: number;
  openViolations: number;
  unreadAlerts: number;
  inspectionsNeedingAttention: number;
  totalObservations: number;
  correctiveActionsInProgress: number;
  documentedMines: number;
}

export interface DashboardTrendPoint {
  month: string;
  compliance: number;
  violations: number;
}

export interface DashboardComplianceDistribution {
  name: string;
  value: number;
}

export interface DashboardRegionData {
  region: string;
  compliance: number;
}

export interface DashboardAlert {
  id: string;
  title: string;
  description: string;
  severity: string;
  mineName: string;
  timestamp: string;
}

export interface DashboardData {
  stats: DashboardStatData;
  trend: DashboardTrendPoint[];
  complianceDistribution: DashboardComplianceDistribution[];
  regions: DashboardRegionData[];
  recentAlerts: DashboardAlert[];
}

function monthKey(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export async function getDashboardData(): Promise<DashboardData> {
  const [
    minesResult,
    complianceResult,
    inspectionsResult,
    observationsCountResult,
    violationsResult,
    correctiveActionsResult,
    alertsResult,
    recentAlertsResult,
  ] = await Promise.all([
    supabase.from('mines').select('id, state, status'),
    supabase
      .from('compliance_records')
      .select('status, compliance_score, due_date, completion_date, mine_id'),
    supabase.from('inspections').select('id, overall_status'),
    supabase.from('observations').select('id', { count: 'exact', head: true }),
    supabase.from('violations').select('id, status, detected_date'),
    supabase.from('corrective_actions').select('id, status'),
    supabase.from('alerts').select('id, status'),
    supabase
      .from('alerts')
      .select('id, title, message, severity, created_at, mine_id, mines(mine_name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const results = [
    minesResult,
    complianceResult,
    inspectionsResult,
    observationsCountResult,
    violationsResult,
    correctiveActionsResult,
    alertsResult,
    recentAlertsResult,
  ];
  const firstError = results.find((result) => result.error)?.error;
  if (firstError) throw new Error(firstError.message);

  const mines = minesResult.data ?? [];
  const compliance = complianceResult.data ?? [];
  const inspections = inspectionsResult.data ?? [];
  const violations = violationsResult.data ?? [];
  const correctiveActions = correctiveActionsResult.data ?? [];
  const alerts = alertsResult.data ?? [];

  const compliantCount = compliance.filter((record) => record.status === 'Compliant').length;
  const complianceRate = compliance.length
    ? Number(((compliantCount / compliance.length) * 100).toFixed(1))
    : 0;

  const openViolations = violations.filter(
    (violation) => String(violation.status ?? '').toLowerCase() === 'open'
  ).length;

  const unreadAlerts = alerts.filter(
    (alert) => String(alert.status ?? '').toLowerCase() === 'unread'
  ).length;

  const inspectionsNeedingAttention = inspections.filter(
    (inspection) => inspection.overall_status === 'Needs Attention'
  ).length;

  const correctiveActionsInProgress = correctiveActions.filter(
    (action) => action.status === 'In Progress'
  ).length;

  const documentedMines = mines.filter((mine) => mine.status === 'As documented').length;

  const complianceDistribution: DashboardComplianceDistribution[] = [
    { name: 'Compliant', value: compliance.filter((r) => r.status === 'Compliant').length },
    { name: 'Pending', value: compliance.filter((r) => r.status === 'Pending').length },
    { name: 'Overdue', value: compliance.filter((r) => r.status === 'Overdue').length },
    { name: 'Non-Compliant', value: compliance.filter((r) => r.status === 'Non-Compliant').length },
  ];

  const stateBuckets = new Map<string, { total: number; scoreTotal: number; scored: number }>();
  for (const mine of mines) {
    if (!mine.state) continue;
    if (!stateBuckets.has(mine.state)) {
      stateBuckets.set(mine.state, { total: 0, scoreTotal: 0, scored: 0 });
    }
    const bucket = stateBuckets.get(mine.state)!;
    const mineRecords = compliance.filter((record) => record.mine_id === mine.id);
    bucket.total += mineRecords.length;
    for (const record of mineRecords) {
      if (typeof record.compliance_score === 'number') {
        bucket.scoreTotal += record.compliance_score;
        bucket.scored += 1;
      }
    }
  }

  const regions: DashboardRegionData[] = Array.from(stateBuckets.entries())
    .map(([region, bucket]) => ({
      region,
      compliance: bucket.scored ? Number((bucket.scoreTotal / bucket.scored).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.compliance - a.compliance);

  const trendBuckets = new Map<
    string,
    { complianceTotal: number; compliant: number; violations: number }
  >();

  for (const record of compliance) {
    const key = monthKey(record.completion_date ?? record.due_date);
    if (!key) continue;
    if (!trendBuckets.has(key)) {
      trendBuckets.set(key, { complianceTotal: 0, compliant: 0, violations: 0 });
    }
    const bucket = trendBuckets.get(key)!;
    bucket.complianceTotal += 1;
    if (record.status === 'Compliant') bucket.compliant += 1;
  }

  for (const violation of violations) {
    const key = monthKey(violation.detected_date);
    if (!key) continue;
    if (!trendBuckets.has(key)) {
      trendBuckets.set(key, { complianceTotal: 0, compliant: 0, violations: 0 });
    }
    trendBuckets.get(key)!.violations += 1;
  }

  const trend: DashboardTrendPoint[] = Array.from(trendBuckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, bucket]) => ({
      month: monthLabel(month),
      compliance: bucket.complianceTotal
        ? Number(((bucket.compliant / bucket.complianceTotal) * 100).toFixed(1))
        : 0,
      violations: bucket.violations,
    }));

  const recentAlerts: DashboardAlert[] = (recentAlertsResult.data ?? []).map((alert) => {
    const mine = Array.isArray(alert.mines) ? alert.mines[0] : alert.mines;
    return {
      id: alert.id,
      title: alert.title,
      description: alert.message,
      severity: alert.severity,
      mineName: mine?.mine_name ?? 'Unknown mine',
      timestamp: alert.created_at,
    };
  });

  return {
    stats: {
      totalMines: mines.length,
      complianceRate,
      openViolations,
      unreadAlerts,
      inspectionsNeedingAttention,
      totalObservations: observationsCountResult.count ?? 0,
      correctiveActionsInProgress,
      documentedMines,
    },
    trend,
    complianceDistribution,
    regions,
    recentAlerts,
  };
}
