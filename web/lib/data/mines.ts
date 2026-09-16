import { supabase } from '@/lib/supabase-client';
import type { ComplianceLevel, Mine, MineStatus } from '@/types';

type MineRow = {
  id: string;
  mine_code: string | null;
  mine_name: string;
  state: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  coal_grade: string | null;
  status: string | null;
  target_capacity_mtpa: number | null;
  mining_method: string | null;
  mining_lease_area_ha: number | null;
  total_extractable_reserve_mt: number | null;
};

type ComplianceRow = {
  mine_id: string;
  compliance_score: number | null;
};

type InspectionRow = {
  mine_id: string;
  inspection_date: string | null;
};

function normalizeMineStatus(status: string | null): MineStatus {
  switch (status?.toLowerCase()) {
    case 'suspended':
      return 'suspended';
    case 'under_review':
    case 'under review':
      return 'under_review';
    case 'closed':
      return 'closed';
    case 'as documented':
    case 'as_documented':
      return 'as_documented';
    case 'active':
      return 'active';
    default:
      return 'active';
  }
}

function normalizeCoalGrade(
  grade: string | null
): Mine['coalGrade'] {
  const normalized = grade?.trim().toUpperCase();

  if (
    normalized === 'A' ||
    normalized === 'B' ||
    normalized === 'C' ||
    normalized === 'D' ||
    normalized === 'E' ||
    normalized === 'F' ||
    normalized === 'G'
  ) {
    return normalized;
  }

  return null;
}

function normalizeMineType(
  miningMethod: string | null
): Mine['type'] {
  const method = miningMethod?.toLowerCase() ?? '';

  if (
    method.includes('underground') ||
    method.includes('u/g')
  ) {
    return 'underground';
  }

  if (
    method.includes('mixed') ||
    method.includes('combined')
  ) {
    return 'mixed';
  }

  return 'opencast';
}

function getComplianceLevel(score: number): ComplianceLevel {
  if (score >= 80) {
    return 'compliant';
  }

  if (score >= 60) {
    return 'warning';
  }

  return 'critical';
}

function formatLocation(
  district: string | null,
  state: string | null
): string {
  return [district, state].filter(Boolean).join(', ');
}

function mapMine(
  row: MineRow,
  complianceScore: number,
  lastInspection: string
): Mine {
  const mineCode = row.mine_code ?? row.id;

  return {
    id: row.id,
    code: mineCode,
    name: row.mine_name,
    location: formatLocation(row.district, row.state),
    state: row.state ?? '',
    district: row.district ?? '',
    coalGrade: normalizeCoalGrade(row.coal_grade),
    type: normalizeMineType(row.mining_method),
    status: normalizeMineStatus(row.status),

    complianceScore,
    complianceLevel: getComplianceLevel(complianceScore),

    // These fields are not present in the verified public.mines
    // schema. Keep explicit UI fallbacks until their authoritative
    // source/table is verified.
    workforce: null,

    productionTarget: row.target_capacity_mtpa,
    productionAchieved: null,

    lastInspection,

    // No next-inspection field exists in the verified inspections schema.
    nextInspection: null,

    // Violations table columns have not yet been verified.
    openViolations: null,

    area: row.mining_lease_area_ha,

    // No authoritative operator column exists in the verified mines schema.
    operator: null,

    reserves: row.total_extractable_reserve_mt,
  };
}

export async function getMines(): Promise<Mine[]> {
  const [
    { data: mines, error: minesError },
    { data: complianceRecords, error: complianceError },
    { data: inspections, error: inspectionsError },
  ] = await Promise.all([
    supabase
      .from('mines')
      .select(`
        id,
        mine_code,
        mine_name,
        state,
        district,
        latitude,
        longitude,
        coal_grade,
        status,
        target_capacity_mtpa,
        mining_method,
        mining_lease_area_ha,
        total_extractable_reserve_mt
      `)
      .order('mine_name', { ascending: true }),

    supabase
      .from('compliance_records')
      .select('mine_id, compliance_score'),

    supabase
      .from('inspections')
      .select('mine_id, inspection_date')
      .order('inspection_date', { ascending: false }),
  ]);

  if (minesError) {
    throw new Error(`Failed to load mines: ${minesError.message}`);
  }

  if (complianceError) {
    throw new Error(
      `Failed to load mine compliance data: ${complianceError.message}`
    );
  }

  if (inspectionsError) {
    throw new Error(
      `Failed to load mine inspection data: ${inspectionsError.message}`
    );
  }

  const complianceByMine = new Map<string, number[]>();

  for (const record of (complianceRecords ?? []) as ComplianceRow[]) {
    if (record.compliance_score === null) {
      continue;
    }

    const existing = complianceByMine.get(record.mine_id) ?? [];
    existing.push(record.compliance_score);
    complianceByMine.set(record.mine_id, existing);
  }

  const lastInspectionByMine = new Map<string, string>();

  for (const inspection of (inspections ?? []) as InspectionRow[]) {
    if (
      inspection.inspection_date &&
      !lastInspectionByMine.has(inspection.mine_id)
    ) {
      lastInspectionByMine.set(
        inspection.mine_id,
        inspection.inspection_date
      );
    }
  }

  return ((mines ?? []) as MineRow[]).map((mine) => {
    const scores = complianceByMine.get(mine.id) ?? [];

    const complianceScore =
      scores.length > 0
        ? Math.round(
            scores.reduce((sum, score) => sum + score, 0) /
              scores.length
          )
        : 0;

    return mapMine(
      mine,
      complianceScore,
      lastInspectionByMine.get(mine.id) ?? ''
    );
  });
}

export async function getMineById(
  mineId: string
): Promise<Mine | null> {
  const [
    { data: mine, error: mineError },
    { data: complianceRecords, error: complianceError },
    { data: inspections, error: inspectionsError },
  ] = await Promise.all([
    supabase
      .from('mines')
      .select(`
        id,
        mine_code,
        mine_name,
        state,
        district,
        latitude,
        longitude,
        coal_grade,
        status,
        target_capacity_mtpa,
        mining_method,
        mining_lease_area_ha,
        total_extractable_reserve_mt
      `)
      .eq('id', mineId)
      .maybeSingle(),

    supabase
      .from('compliance_records')
      .select('mine_id, compliance_score')
      .eq('mine_id', mineId),

    supabase
      .from('inspections')
      .select('mine_id, inspection_date')
      .eq('mine_id', mineId)
      .order('inspection_date', { ascending: false })
      .limit(1),
  ]);

  if (mineError) {
    throw new Error(`Failed to load mine: ${mineError.message}`);
  }

  if (complianceError) {
    throw new Error(
      `Failed to load mine compliance data: ${complianceError.message}`
    );
  }

  if (inspectionsError) {
    throw new Error(
      `Failed to load mine inspection data: ${inspectionsError.message}`
    );
  }

  if (!mine) {
    return null;
  }

  const scores = ((complianceRecords ?? []) as ComplianceRow[])
    .map((record) => record.compliance_score)
    .filter((score): score is number => score !== null);

  const complianceScore =
    scores.length > 0
      ? Math.round(
          scores.reduce((sum, score) => sum + score, 0) /
            scores.length
        )
      : 0;

  const lastInspection =
    ((inspections ?? []) as InspectionRow[])[0]?.inspection_date ?? '';

  return mapMine(
    mine as MineRow,
    complianceScore,
    lastInspection
  );
}