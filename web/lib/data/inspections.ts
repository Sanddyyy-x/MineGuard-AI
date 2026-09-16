import { supabase, isSupabaseConfigured } from '@/lib/supabase-client';

/**
 * Data-access service for the MineGuard `public.inspections` table.
 *
 * UI components should use these functions instead of querying Supabase
 * directly. The service maps live database fields to frontend-friendly names.
 */

export interface InspectionMineRef {
  id: string;
  mineCode: string | null;
  mineName: string | null;
}

export interface InspectionRecord {
  id: string;
  mineId: string;
  inspectorId: string | null;
  inspectionType: string | null;
  inspectionDate: string;
  latitude: number | null;
  longitude: number | null;
  overallStatus: string | null;
  summary: string | null;
  createdAt: string;
  mine: InspectionMineRef | null;
}

export interface InspectionObservationRef {
  id: string;
  inspectionId: string;
  category: string | null;
  description: string | null;
  severity: string | null;
  createdAt: string | null;
}

export interface DataResult<T> {
  data: T | null;
  error: string | null;
}

const SUPABASE_NOT_CONFIGURED_MESSAGE =
  'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.';

type InspectionRow = {
  id: string;
  mine_id: string;
  inspector_id: string | null;
  inspection_type: string | null;
  inspection_date: string;
  latitude: number | null;
  longitude: number | null;
  overall_status: string | null;
  summary: string | null;
  created_at: string;
};

type MineRow = {
  id: string;
  mine_code: string | null;
  mine_name: string;
};

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred while contacting the database.';
}

function mapMine(row: MineRow): InspectionMineRef {
  return {
    id: row.id,
    mineCode: row.mine_code,
    mineName: row.mine_name,
  };
}

function mapInspectionRow(
  row: InspectionRow,
  mine: InspectionMineRef | null
): InspectionRecord {
  return {
    id: row.id,
    mineId: row.mine_id,
    inspectorId: row.inspector_id,
    inspectionType: row.inspection_type,
    inspectionDate: row.inspection_date,
    latitude: row.latitude,
    longitude: row.longitude,
    overallStatus: row.overall_status,
    summary: row.summary,
    createdAt: row.created_at,
    mine,
  };
}

async function getMinesForInspectionRows(
  mineIds: string[]
): Promise<{ mines: Map<string, InspectionMineRef>; error: string | null }> {
  const uniqueMineIds = Array.from(new Set(mineIds));

  if (uniqueMineIds.length === 0) {
    return { mines: new Map(), error: null };
  }

  const { data, error } = await supabase
    .from('mines')
    .select('id, mine_code, mine_name')
    .in('id', uniqueMineIds);

  if (error) {
    return { mines: new Map(), error: error.message };
  }

  const mines = new Map<string, InspectionMineRef>();

  for (const row of (data ?? []) as MineRow[]) {
    mines.set(row.id, mapMine(row));
  }

  return { mines, error: null };
}

export async function getInspections(): Promise<
  DataResult<InspectionRecord[]>
> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: SUPABASE_NOT_CONFIGURED_MESSAGE,
    };
  }

  try {
    const { data, error } = await supabase
      .from('inspections')
      .select(
        'id, mine_id, inspector_id, inspection_type, inspection_date, latitude, longitude, overall_status, summary, created_at'
      )
      .order('inspection_date', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    const rows = (data ?? []) as InspectionRow[];
    const mineResult = await getMinesForInspectionRows(
      rows.map((row) => row.mine_id)
    );

    if (mineResult.error) {
      return { data: null, error: mineResult.error };
    }

    return {
      data: rows.map((row) =>
        mapInspectionRow(
          row,
          mineResult.mines.get(row.mine_id) ?? null
        )
      ),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: toErrorMessage(error),
    };
  }
}

export async function getInspectionById(
  id: string
): Promise<DataResult<InspectionRecord>> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: SUPABASE_NOT_CONFIGURED_MESSAGE,
    };
  }

  if (!id) {
    return { data: null, error: 'Invalid inspection id.' };
  }

  try {
    const { data, error } = await supabase
      .from('inspections')
      .select(
        'id, mine_id, inspector_id, inspection_type, inspection_date, latitude, longitude, overall_status, summary, created_at'
      )
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: null };
    }

    const row = data as InspectionRow;
    const mineResult = await getMinesForInspectionRows([row.mine_id]);

    if (mineResult.error) {
      return { data: null, error: mineResult.error };
    }

    return {
      data: mapInspectionRow(
        row,
        mineResult.mines.get(row.mine_id) ?? null
      ),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: toErrorMessage(error),
    };
  }
}

export async function getInspectionsByMine(
  mineId: string
): Promise<DataResult<InspectionRecord[]>> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: SUPABASE_NOT_CONFIGURED_MESSAGE,
    };
  }

  if (!mineId) {
    return { data: null, error: 'Invalid mine id.' };
  }

  try {
    const { data, error } = await supabase
      .from('inspections')
      .select(
        'id, mine_id, inspector_id, inspection_type, inspection_date, latitude, longitude, overall_status, summary, created_at'
      )
      .eq('mine_id', mineId)
      .order('inspection_date', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    const rows = (data ?? []) as InspectionRow[];
    const mineResult = await getMinesForInspectionRows([mineId]);

    if (mineResult.error) {
      return { data: null, error: mineResult.error };
    }

    return {
      data: rows.map((row) =>
        mapInspectionRow(
          row,
          mineResult.mines.get(row.mine_id) ?? null
        )
      ),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: toErrorMessage(error),
    };
  }
}

export async function getObservationsForInspection(
  inspectionId: string
): Promise<DataResult<InspectionObservationRef[]>> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: SUPABASE_NOT_CONFIGURED_MESSAGE,
    };
  }

  if (!inspectionId) {
    return { data: null, error: 'Invalid inspection id.' };
  }

  try {
    const { data, error } = await supabase
      .from('observations')
      .select(
        'id, inspection_id, category, description, severity, created_at'
      )
      .eq('inspection_id', inspectionId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    const rows = (data ?? []) as Array<{
      id: string;
      inspection_id: string;
      category: string | null;
      description: string | null;
      severity: string | null;
      created_at: string | null;
    }>;

    return {
      data: rows.map((row) => ({
        id: row.id,
        inspectionId: row.inspection_id,
        category: row.category,
        description: row.description,
        severity: row.severity,
        createdAt: row.created_at,
      })),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: toErrorMessage(error),
    };
  }
}
