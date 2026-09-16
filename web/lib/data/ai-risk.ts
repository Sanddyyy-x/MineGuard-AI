import { supabase } from '@/lib/supabase-client';

export interface MineRiskIntelligence {
  mineId: string;
  mineCode: string;
  mineName: string;
  riskScore: number | null;
  riskLevel: string | null;
  priority: string | null;
  primaryRiskDriver: string | null;
  riskDrivers: string[];
  recommendations: string[];
  escalationRequired: boolean;
  aiContext: string | null;
}

type RiskRow = {
  mine_id: string;
  mine_code: string;
  mine_name: string;
  risk_score: number | null;
  risk_level: string | null;
  priority: string | null;
  primary_risk_driver: string | null;
  risk_drivers: unknown;
  recommendations: unknown;
  escalation_required: boolean | null;
  ai_context: string | null;
};

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function mapRow(row: RiskRow): MineRiskIntelligence {
  return {
    mineId: row.mine_id,
    mineCode: row.mine_code,
    mineName: row.mine_name,
    riskScore: row.risk_score,
    riskLevel: row.risk_level,
    priority: row.priority,
    primaryRiskDriver: row.primary_risk_driver,
    riskDrivers: stringArray(row.risk_drivers),
    recommendations: stringArray(row.recommendations),
    escalationRequired: row.escalation_required === true,
    aiContext: row.ai_context,
  };
}

export async function getMineRiskIntelligence(
  mineId?: string | null
): Promise<MineRiskIntelligence[]> {
  const { data, error } = await supabase.rpc('get_mine_risk_intelligence', {
    requested_mine_id: mineId ?? null,
  });

  if (error) throw new Error(error.message);

  return ((data ?? []) as RiskRow[]).map(mapRow);
}
