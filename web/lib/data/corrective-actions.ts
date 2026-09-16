import { supabase } from '@/lib/supabase-client';

export interface CorrectiveActionUser {
  id: string;
  full_name: string | null;
  email: string | null;
}

export interface CorrectiveActionMine {
  id: string;
  mine_code: string | null;
}

export interface CorrectiveActionViolation {
  id: string;
  violation_code: string | null;
  title: string;
  description: string | null;
  category: string | null;
  severity: string | null;
  status: string | null;
  observation_id: string | null;
  mine_id: string;
  mine: CorrectiveActionMine | null;
}

export interface CorrectiveActionObservation {
  id: string;
  inspection_id: string;
  category: string | null;
  description: string | null;
  severity: string | null;
}

export interface CorrectiveAction {
  id: string;
  violation_id: string;
  assigned_to: string | null;
  action_description: string;
  due_date: string | null;
  completion_date: string | null;
  status: string | null;
  verification_status: string | null;
  verified_by: string | null;
  remarks: string | null;
  created_at: string | null;
  violation: CorrectiveActionViolation | null;
  observation: CorrectiveActionObservation | null;
  assignedUser: CorrectiveActionUser | null;
  verifiedByUser: CorrectiveActionUser | null;
}

const selectFields = `
  id,
  violation_id,
  assigned_to,
  action_description,
  due_date,
  completion_date,
  status,
  verification_status,
  verified_by,
  remarks,
  created_at
`;

async function getUsersByIds(ids: string[]) {
  if (!ids.length) return new Map<string, CorrectiveActionUser>();

  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email')
    .in('id', ids);

  if (error) {
    // User assignments are nullable and RLS may legitimately hide related users.
    return new Map<string, CorrectiveActionUser>();
  }

  return new Map((data ?? []).map((user) => [user.id, {
    id: user.id,
    full_name: user.full_name ?? null,
    email: user.email ?? null,
  }]));
}

async function getViolationsByIds(ids: string[]) {
  if (!ids.length) return new Map<string, CorrectiveActionViolation>();

  const { data, error } = await supabase
    .from('violations')
    .select('id, violation_code, title, description, category, severity, status, observation_id, mine_id')
    .in('id', ids);

  if (error) throw error;

  return new Map((data ?? []).map((violation) => [violation.id, violation as CorrectiveActionViolation]));
}


async function getMinesByIds(ids: string[]) {
  if (!ids.length) return new Map<string, CorrectiveActionMine>();

  const { data, error } = await supabase
    .from('mines')
    .select('id, mine_code')
    .in('id', ids);

  if (error) throw error;

  return new Map((data ?? []).map((mine) => [mine.id, {
    id: mine.id,
    mine_code: mine.mine_code ?? null,
  }]));
}

async function getObservationsByIds(ids: string[]) {
  if (!ids.length) return new Map<string, CorrectiveActionObservation>();

  const { data, error } = await supabase
    .from('observations')
    .select('id, inspection_id, category, description, severity')
    .in('id', ids);

  if (error) {
    return new Map<string, CorrectiveActionObservation>();
  }

  return new Map((data ?? []).map((observation) => [observation.id, observation as CorrectiveActionObservation]));
}

async function attachRelations(rows: any[]): Promise<CorrectiveAction[]> {
  const violationIds = [...new Set(rows.map((row) => row.violation_id).filter(Boolean))];
  const assignedIds = [...new Set(rows.map((row) => row.assigned_to).filter(Boolean))];
  const verifiedIds = [...new Set(rows.map((row) => row.verified_by).filter(Boolean))];

  const [violations, assignedUsers, verifiedUsers] = await Promise.all([
    getViolationsByIds(violationIds),
    getUsersByIds(assignedIds),
    getUsersByIds(verifiedIds),
  ]);

  const mineIds = [...new Set(
    [...violations.values()]
      .map((violation) => violation.mine_id)
      .filter(Boolean)
  )];

  const mines = await getMinesByIds(mineIds);

  for (const [id, violation] of violations) {
    violations.set(id, {
      ...violation,
      mine: mines.get(violation.mine_id) ?? null,
    });
  }

  const observationIds = [...new Set(
    [...violations.values()]
      .map((violation) => violation.observation_id)
      .filter((id): id is string => Boolean(id))
  )];

  const observations = await getObservationsByIds(observationIds);

  return rows.map((row) => {
    const violation = violations.get(row.violation_id) ?? null;
    return {
      ...row,
      violation,
      observation: violation?.observation_id
        ? observations.get(violation.observation_id) ?? null
        : null,
      assignedUser: row.assigned_to ? assignedUsers.get(row.assigned_to) ?? null : null,
      verifiedByUser: row.verified_by ? verifiedUsers.get(row.verified_by) ?? null : null,
    };
  });
}

export async function getCorrectiveActions(): Promise<CorrectiveAction[]> {
  const { data, error } = await supabase
    .from('corrective_actions')
    .select(selectFields)
    .order('created_at', { ascending: false, nullsFirst: false });

  if (error) throw error;

  return attachRelations(data ?? []);
}

export async function getCorrectiveActionById(id: string): Promise<CorrectiveAction | null> {
  const { data, error } = await supabase
    .from('corrective_actions')
    .select(selectFields)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const rows = await attachRelations([data]);
  return rows[0] ?? null;
}

export function formatCorrectiveActionDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatCorrectiveActionDateTime(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
