import { supabase } from '@/lib/supabase-client';
import type {
  ComplianceRecord,
  ComplianceRecordStatus,
} from '@/types';

type ComplianceRecordRow = {
  id: string;
  mine_id: string;
  requirement_id: string;
  due_date: string;
  completion_date: string | null;
  status: string | null;
  compliance_score: number | null;
  remarks: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  data_source: string | null;
};

type ComplianceRequirementRow = {
  id: string;
  requirement_code: string | null;
  title: string;
  description: string | null;
  category: string | null;
  authority: string | null;
  frequency: string | null;
  severity_level: string | null;
};

type MineRow = {
  id: string;
  mine_code: string | null;
  mine_name: string;
};

function normalizeStatus(
  status: string | null
): ComplianceRecordStatus {
  switch (status?.toLowerCase()) {
    case 'compliant':
      return 'compliant';

    case 'overdue':
      return 'overdue';

    case 'non_compliant':
    case 'non-compliant':
    case 'non compliant':
      return 'non_compliant';

    case 'in_progress':
    case 'in-progress':
    case 'in progress':
      return 'in_progress';

    default:
      return 'pending';
  }
}

function normalizeDataSource(
  dataSource: string | null
): ComplianceRecord['dataSource'] {
  switch (dataSource?.toLowerCase()) {
    case 'inspection':
      return 'inspection';

    case 'self_report':
    case 'self-report':
    case 'self report':
      return 'self_report';

    case 'audit':
      return 'audit';

    case 'iot_sensor':
    case 'iot-sensor':
    case 'iot sensor':
      return 'iot_sensor';

    case 'ai_analysis':
    case 'ai-analysis':
    case 'ai analysis':
      return 'ai_analysis';

    case 'synthetic demonstration':
    case 'synthetic':
      return 'synthetic';

    default:
      return 'synthetic';
  }
}

function mapComplianceRecord(
  row: ComplianceRecordRow,
  requirement: ComplianceRequirementRow,
  mine: MineRow
): ComplianceRecord {
  return {
    id: row.id,
    mineId: row.mine_id,
    mineCode: mine.mine_code ?? mine.id,
    mineName: mine.mine_name,

    requirementId: row.requirement_id,
    requirement: requirement.title,

    dueDate: row.due_date,
    completionDate: row.completion_date,

    status: normalizeStatus(row.status),

    complianceScore: row.compliance_score,
    remarks: row.remarks ?? '',

    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,

    dataSource: normalizeDataSource(row.data_source),
  };
}

export async function getComplianceRecords(): Promise<
  ComplianceRecord[]
> {
  const [
    { data: records, error: recordsError },
    { data: requirements, error: requirementsError },
    { data: mines, error: minesError },
  ] = await Promise.all([
    supabase
      .from('compliance_records')
      .select(`
        id,
        mine_id,
        requirement_id,
        due_date,
        completion_date,
        status,
        compliance_score,
        remarks,
        created_by,
        created_at,
        updated_at,
        data_source
      `)
      .order('due_date', { ascending: true }),

    supabase
      .from('compliance_requirements')
      .select(`
        id,
        requirement_code,
        title,
        description,
        category,
        authority,
        frequency,
        severity_level
      `),

    supabase
      .from('mines')
      .select(`
        id,
        mine_code,
        mine_name
      `),
  ]);

  if (recordsError) {
    throw new Error(
      `Failed to load compliance records: ${recordsError.message}`
    );
  }

  if (requirementsError) {
    throw new Error(
      `Failed to load compliance requirements: ${requirementsError.message}`
    );
  }

  if (minesError) {
    throw new Error(
      `Failed to load mines for compliance records: ${minesError.message}`
    );
  }

  const requirementMap = new Map(
    ((requirements ?? []) as ComplianceRequirementRow[]).map(
      (requirement) => [requirement.id, requirement]
    )
  );

  const mineMap = new Map(
    ((mines ?? []) as MineRow[]).map((mine) => [mine.id, mine])
  );

  return ((records ?? []) as ComplianceRecordRow[])
    .map((record) => {
      const requirement = requirementMap.get(record.requirement_id);
      const mine = mineMap.get(record.mine_id);

      if (!requirement || !mine) {
        return null;
      }

      return mapComplianceRecord(record, requirement, mine);
    })
    .filter(
      (record): record is ComplianceRecord => record !== null
    );
}

export async function getComplianceRecordById(
  recordId: string
): Promise<ComplianceRecord | null> {
  const { data: record, error: recordError } = await supabase
    .from('compliance_records')
    .select(`
      id,
      mine_id,
      requirement_id,
      due_date,
      completion_date,
      status,
      compliance_score,
      remarks,
      created_by,
      created_at,
      updated_at,
      data_source
    `)
    .eq('id', recordId)
    .maybeSingle();

  if (recordError) {
    throw new Error(
      `Failed to load compliance record: ${recordError.message}`
    );
  }

  if (!record) {
    return null;
  }

  const typedRecord = record as ComplianceRecordRow;

  const [
    { data: requirement, error: requirementError },
    { data: mine, error: mineError },
  ] = await Promise.all([
    supabase
      .from('compliance_requirements')
      .select(`
        id,
        requirement_code,
        title,
        description,
        category,
        authority,
        frequency,
        severity_level
      `)
      .eq('id', typedRecord.requirement_id)
      .maybeSingle(),

    supabase
      .from('mines')
      .select(`
        id,
        mine_code,
        mine_name
      `)
      .eq('id', typedRecord.mine_id)
      .maybeSingle(),
  ]);

  if (requirementError) {
    throw new Error(
      `Failed to load compliance requirement: ${requirementError.message}`
    );
  }

  if (mineError) {
    throw new Error(
      `Failed to load mine for compliance record: ${mineError.message}`
    );
  }

  if (!requirement || !mine) {
    return null;
  }

  return mapComplianceRecord(
    typedRecord,
    requirement as ComplianceRequirementRow,
    mine as MineRow
  );
}