import { supabase } from '@/lib/supabase-client';

export interface ViolationMine {
  id: string;
  mine_code: string | null;
}

export interface ViolationObservation {
  id: string;
  description: string | null;
  severity: string | null;
  category: string | null;
  inspection_id: string;
  created_at: string | null;
}

export interface Violation {
  id: string;
  mine_id: string;
  observation_id: string | null;
  violation_code: string | null;
  title: string;
  description: string | null;
  category: string | null;
  severity: string | null;
  status: string | null;
  detected_date: string | null;
  resolved_date: string | null;
  recurring: boolean | null;
  created_at: string | null;
  mine: ViolationMine | null;
  observation: ViolationObservation | null;
}

type ViolationRow = Omit<Violation, 'mine' | 'observation'>;

const violationSelect = `
  id,
  mine_id,
  observation_id,
  violation_code,
  title,
  description,
  category,
  severity,
  status,
  detected_date,
  resolved_date,
  recurring,
  created_at
`;

async function getMinesByIds(ids: string[]) {
  if (!ids.length) return new Map<string, ViolationMine>();
  const { data, error } = await supabase.from('mines').select('id, mine_code').in('id', ids);
  if (error) throw error;
  return new Map((data ?? []).map((mine) => [mine.id, { id: mine.id, mine_code: mine.mine_code ?? null }]));
}

async function getObservationsByIds(ids: string[]) {
  if (!ids.length) return new Map<string, ViolationObservation>();
  const { data, error } = await supabase
    .from('observations')
    .select('id, description, severity, category, inspection_id, created_at')
    .in('id', ids);

  if (error) return new Map<string, ViolationObservation>();
  return new Map((data ?? []).map((observation) => [observation.id, observation]));
}

function attachRelations(
  rows: ViolationRow[],
  mines: Map<string, ViolationMine>,
  observations: Map<string, ViolationObservation>
): Violation[] {
  return rows.map((row) => ({
    ...row,
    mine: mines.get(row.mine_id) ?? null,
    observation: row.observation_id ? observations.get(row.observation_id) ?? null : null,
  }));
}

export async function getViolations(): Promise<Violation[]> {
  const { data, error } = await supabase
    .from('violations')
    .select(violationSelect)
    .order('detected_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false, nullsFirst: false });

  if (error) throw error;

  const rows = (data ?? []) as ViolationRow[];
  const mineIds = [...new Set(rows.map((row) => row.mine_id))];
  const observationIds = [...new Set(rows.map((row) => row.observation_id).filter((id): id is string => Boolean(id)))];

  const [mines, observations] = await Promise.all([
    getMinesByIds(mineIds),
    getObservationsByIds(observationIds),
  ]);

  return attachRelations(rows, mines, observations);
}

export async function getViolationById(id: string): Promise<Violation | null> {
  const { data, error } = await supabase
    .from('violations')
    .select(violationSelect)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as ViolationRow;
  const [mines, observations] = await Promise.all([
    getMinesByIds([row.mine_id]),
    row.observation_id ? getObservationsByIds([row.observation_id]) : Promise.resolve(new Map<string, ViolationObservation>()),
  ]);

  return attachRelations([row], mines, observations)[0] ?? null;
}

export function formatViolationDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export function formatViolationDateTime(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date);
}
