import { supabase } from '@/lib/supabase-client';

export type AlertStatus = 'Unread' | 'Read';
export type AlertSeverity = 'Medium' | 'High';

export type AlertType =
  | 'Corrective Action Due Soon'
  | 'Recurring Violation'
  | 'Corrective Action'
  | 'Compliance Follow-up'
  | 'Production Anomaly'
  | 'High Severity Violation';

export interface Alert {
  id: string;
  mineId: string;
  mineCode: string | null;
  violationId: string | null;
  violationCode: string | null;
  violationTitle: string | null;
  correctiveActionId: string | null;
  correctiveActionDescription: string | null;
  correctiveActionStatus: string | null;
  alertType: AlertType;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  dueDate: string | null;
  resolvedAt: string | null;
  assignedTo: string | null;
  createdAt: string;
}

interface AlertRow {
  id: string;
  mine_id: string;
  violation_id: string | null;
  corrective_action_id: string | null;
  alert_type: string;
  title: string;
  message: string;
  severity: string;
  status: string;
  due_date: string | null;
  resolved_at: string | null;
  assigned_to: string | null;
  created_at: string;
}

interface MineRow {
  id: string;
  mine_code: string | null;
}

interface ViolationRow {
  id: string;
  violation_code: string | null;
  title: string;
}

interface CorrectiveActionRow {
  id: string;
  violation_id: string;
  action_description: string;
  status: string | null;
}

function normalizeAlertType(value: string): AlertType {
  switch (value) {
    case 'Corrective Action Due Soon':
    case 'Recurring Violation':
    case 'Corrective Action':
    case 'Compliance Follow-up':
    case 'Production Anomaly':
    case 'High Severity Violation':
      return value;
    default:
      throw new Error(`Unexpected alert type returned by database: ${value}`);
  }
}

function normalizeSeverity(value: string): AlertSeverity {
  if (value === 'Medium' || value === 'High') {
    return value;
  }

  throw new Error(`Unexpected alert severity returned by database: ${value}`);
}

function normalizeStatus(value: string): AlertStatus {
  if (value === 'Unread' || value === 'Read') {
    return value;
  }

  throw new Error(`Unexpected alert status returned by database: ${value}`);
}

export async function getAlerts(): Promise<Alert[]> {
  const [
    { data: alerts, error: alertsError },
    { data: mines, error: minesError },
    { data: violations, error: violationsError },
    { data: correctiveActions, error: correctiveActionsError },
  ] = await Promise.all([
    supabase
      .from('alerts')
      .select(`
        id,
        mine_id,
        violation_id,
        corrective_action_id,
        alert_type,
        title,
        message,
        severity,
        status,
        due_date,
        resolved_at,
        assigned_to,
        created_at
      `)
      .order('created_at', { ascending: false }),

    supabase
      .from('mines')
      .select(`
        id,
        mine_code
      `),

    supabase
      .from('violations')
      .select(`
        id,
        violation_code,
        title
      `),

    supabase
      .from('corrective_actions')
      .select(`
        id,
        violation_id,
        action_description,
        status
      `),
  ]);

  if (alertsError) {
    throw new Error(`Failed to load alerts: ${alertsError.message}`);
  }

  if (minesError) {
    throw new Error(`Failed to load mines for alerts: ${minesError.message}`);
  }

  if (violationsError) {
    throw new Error(`Failed to load violations for alerts: ${violationsError.message}`);
  }

  if (correctiveActionsError) {
    throw new Error(
      `Failed to load corrective actions for alerts: ${correctiveActionsError.message}`
    );
  }

  const mineMap = new Map(
    ((mines ?? []) as MineRow[]).map((mine) => [mine.id, mine])
  );

  const violationMap = new Map(
    ((violations ?? []) as ViolationRow[]).map((violation) => [
      violation.id,
      violation,
    ])
  );

  const correctiveActionMap = new Map(
    ((correctiveActions ?? []) as CorrectiveActionRow[]).map((action) => [
      action.id,
      action,
    ])
  );

  return ((alerts ?? []) as AlertRow[]).map((row) => {
    const mine = mineMap.get(row.mine_id);
    const violation = row.violation_id
      ? violationMap.get(row.violation_id)
      : undefined;
    const correctiveAction = row.corrective_action_id
      ? correctiveActionMap.get(row.corrective_action_id)
      : undefined;

    return {
      id: row.id,
      mineId: row.mine_id,
      mineCode: mine?.mine_code ?? null,
      violationId: row.violation_id,
      violationCode: violation?.violation_code ?? null,
      violationTitle: violation?.title ?? null,
      correctiveActionId: row.corrective_action_id,
      correctiveActionDescription: correctiveAction?.action_description ?? null,
      correctiveActionStatus: correctiveAction?.status ?? null,
      alertType: normalizeAlertType(row.alert_type),
      title: row.title,
      message: row.message,
      severity: normalizeSeverity(row.severity),
      status: normalizeStatus(row.status),
      dueDate: row.due_date,
      resolvedAt: row.resolved_at,
      assignedTo: row.assigned_to,
      createdAt: row.created_at,
    };
  });
}
