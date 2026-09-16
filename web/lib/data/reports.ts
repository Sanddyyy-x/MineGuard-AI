import { supabase, isSupabaseConfigured } from '@/lib/supabase-client';
import type { Severity } from '@/types';
import type { ReportRow, ReportType } from '@/app/(app)/reports/_data/report-definitions';

export interface ReportResult {
  rows: ReportRow[];
  mineNames: string[];
  error: string | null;
}

type JsonRecord = Record<string, unknown>;

interface MineRef {
  id: string;
  mine_code: string | null;
  mine_name: string;
}

interface ReportPayload {
  mine?: JsonRecord | null;
  compliance?: JsonRecord[];
  inspections?: JsonRecord[];
  observations?: JsonRecord[];
  violations?: JsonRecord[];
  corrective_actions?: JsonRecord[];
  alerts?: JsonRecord[];
}

const NOT_CONFIGURED =
  'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.';

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function asRecords(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.filter((item): item is JsonRecord => Boolean(asRecord(item)))
    : [];
}

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function firstString(row: JsonRecord, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim() !== '') return value;
  }
  return fallback;
}

function normalizeSeverity(value: unknown): Severity | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.toLowerCase().replace(/[-\s]/g, '_');
  if (normalized === 'low') return 'low';
  if (normalized === 'medium') return 'medium';
  if (normalized === 'high') return 'high';
  if (normalized === 'critical') return 'critical';
  return undefined;
}

function normalizePayload(value: unknown): ReportPayload {
  const root = asRecord(value) ?? {};
  return {
    mine: asRecord(root.mine),
    compliance: asRecords(root.compliance),
    inspections: asRecords(root.inspections),
    observations: asRecords(root.observations),
    violations: asRecords(root.violations),
    corrective_actions: asRecords(root.corrective_actions),
    alerts: asRecords(root.alerts),
  };
}

function mineNameFromPayload(payload: ReportPayload, fallback: MineRef): string {
  return firstString(payload.mine ?? {}, ['mine_name', 'name'], fallback.mine_name);
}

function mapRows(
  type: ReportType,
  payloads: Array<{ mine: MineRef; payload: ReportPayload }>
): ReportRow[] {
  const rows: ReportRow[] = [];
  let rowIndex = 0;

  for (const { mine, payload } of payloads) {
    const mineName = mineNameFromPayload(payload, mine);

    switch (type) {
      case 'compliance':
        for (const row of payload.compliance ?? []) {
          const requirement = asRecord(row.requirement);
          rows.push({
            id: stringValue(row.id, `${mine.id}-${type}-${rowIndex++}`),
            mineName,
            primary: firstString(
              requirement ?? {},
              ['requirement_code', 'title'],
              'Requirement'
            ),
            secondary: firstString(
              requirement ?? {},
              ['title', 'category', 'authority'],
              stringValue(row.remarks, '—')
            ),
            status: firstString(row, ['status'], 'Unknown'),
            date: firstString(row, ['due_date'], ''),
          });
        }
        break;

      case 'inspections':
        for (const row of payload.inspections ?? []) {
          rows.push({
            id: stringValue(row.id, `${mine.id}-${type}-${rowIndex++}`),
            mineName,
            primary: firstString(row, ['inspection_type'], 'Inspection'),
            secondary: firstString(row, ['inspector_id'], 'Not assigned'),
            status: firstString(row, ['overall_status'], 'Not recorded'),
            date: firstString(row, ['inspection_date', 'created_at'], ''),
          });
        }
        break;

      case 'observations':
        for (const row of payload.observations ?? []) {
          rows.push({
            id: stringValue(row.id, `${mine.id}-${type}-${rowIndex++}`),
            mineName,
            primary: firstString(row, ['category'], 'Observation'),
            secondary: firstString(row, ['description'], '—'),
            status: '',
            severity: normalizeSeverity(row.severity),
            date: firstString(row, ['created_at'], ''),
          });
        }
        break;

      case 'violations':
        for (const row of payload.violations ?? []) {
          rows.push({
            id: stringValue(row.id, `${mine.id}-${type}-${rowIndex++}`),
            mineName,
            primary: firstString(
              row,
              ['regulation', 'regulation_ref', 'regulation_code', 'title'],
              'Violation'
            ),
            secondary: firstString(row, ['description', 'details'], '—'),
            status: firstString(row, ['status'], 'Unknown'),
            severity: normalizeSeverity(row.severity),
            date: firstString(row, ['detected_date', 'created_at'], ''),
          });
        }
        break;

      case 'corrective-actions':
        for (const row of payload.corrective_actions ?? []) {
          rows.push({
            id: stringValue(row.id, `${mine.id}-${type}-${rowIndex++}`),
            mineName,
            primary: firstString(row, ['action_description', 'description'], 'Corrective action'),
            secondary: firstString(row, ['assigned_to'], 'Unassigned'),
            status: firstString(row, ['status'], 'Unknown'),
            date: firstString(row, ['due_date'], ''),
          });
        }
        break;

      case 'alerts':
        for (const row of payload.alerts ?? []) {
          rows.push({
            id: stringValue(row.id, `${mine.id}-${type}-${rowIndex++}`),
            mineName,
            primary: firstString(row, ['title'], 'Alert'),
            secondary: firstString(row, ['message', 'description'], '—'),
            status: firstString(row, ['status'], 'Unknown'),
            severity: normalizeSeverity(row.severity),
            date: firstString(row, ['created_at'], ''),
          });
        }
        break;
    }
  }

  return rows;
}

async function getAccessibleMines(): Promise<{ data: MineRef[]; error: string | null }> {
  const { data, error } = await supabase
    .from('mines')
    .select('id, mine_code, mine_name')
    .order('mine_code', { ascending: true });

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as MineRef[], error: null };
}

export async function getReportData(
  type: ReportType,
  dateFrom?: string,
  dateTo?: string
): Promise<ReportResult> {
  if (!isSupabaseConfigured) {
    return { rows: [], mineNames: [], error: NOT_CONFIGURED };
  }

  if (dateFrom && dateTo && dateFrom > dateTo) {
    return { rows: [], mineNames: [], error: 'From date cannot be after to date.' };
  }

  try {
    const minesResult = await getAccessibleMines();
    if (minesResult.error) {
      return { rows: [], mineNames: [], error: `Failed to load accessible mines: ${minesResult.error}` };
    }

    if (minesResult.data.length === 0) {
      return { rows: [], mineNames: [], error: 'No mines are available for the current account.' };
    }

    const useActivityReport = Boolean(dateFrom && dateTo);
    const payloadResults = await Promise.all(
      minesResult.data.map(async (mine) => {
        const rpc = useActivityReport
          ? supabase.rpc('get_mine_activity_report', {
              requested_mine_id: mine.id,
              requested_from_date: dateFrom,
              requested_to_date: dateTo,
            })
          : supabase.rpc('get_mine_compliance_report', {
              requested_mine_id: mine.id,
            });

        const { data, error } = await rpc;
        if (error) {
          throw new Error(`${mine.mine_code ?? mine.mine_name}: ${error.message}`);
        }

        return { mine, payload: normalizePayload(data) };
      })
    );

    return {
      rows: mapRows(type, payloadResults),
      mineNames: minesResult.data.map((mine) => mine.mine_name),
      error: null,
    };
  } catch (error) {
    return {
      rows: [],
      mineNames: [],
      error: error instanceof Error ? error.message : 'Failed to load report data.',
    };
  }
}
