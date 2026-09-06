import type { ComplianceRecord } from '@/types';

const requirements = [
  { id: 'REQ-001', name: 'Ventilation System Inspection — CMR Reg 99' },
  { id: 'REQ-002', name: 'Roof Support Certification — CMR Reg 73' },
  { id: 'REQ-003', name: 'Dust Suppression System Check — CMR Reg 66' },
  { id: 'REQ-004', name: 'Emergency Evacuation Drill — CMR Reg 112' },
  { id: 'REQ-005', name: 'Methane Gas Monitoring — CMR Reg 127' },
  { id: 'REQ-006', name: 'Water Management & Settling Pond — EPA 1986' },
  { id: 'REQ-007', name: 'Particulate Emission (PM10) Compliance — EPA 1986' },
  { id: 'REQ-008', name: 'Electrical Equipment Safety Audit — CMR Reg 89' },
  { id: 'REQ-009', name: 'Worker Safety Training Records — CMR Reg 42' },
  { id: 'REQ-010', name: 'Haul Road Maintenance Inspection — CMR Reg 55' },
  { id: 'REQ-011', name: 'First Aid & Medical Facility Audit — CMR Reg 44' },
  { id: 'REQ-012', name: 'Environmental Management Plan Review — EIA 2006' },
];

interface MineRef {
  id: string;
  code: string;
  name: string;
}

const mines: MineRef[] = [
  { id: 'MOC-66', code: 'MOC-66', name: 'Choritand Tilaya Block' },
  { id: 'MOC-67', code: 'MOC-67', name: 'Jogeshwar Coal Block' },
  { id: 'MOC-68', code: 'MOC-68', name: 'Rabodh Block' },
  { id: 'MOC-69', code: 'MOC-69', name: 'Rohne Coal Block' },
  { id: 'MOC-70', code: 'MOC-70', name: 'Urtan North Coal Block' },
  { id: 'MOC-71', code: 'MOC-71', name: 'North of Arkhapal and Srirampur Coal Block' },
];

const dataSources: ComplianceRecord['dataSource'][] = [
  'inspection', 'self_report', 'audit', 'iot_sensor', 'ai_analysis',
];

const complianceRemarks = {
  compliant: [
    'Inspection completed. All parameters within permissible limits.',
    'Records verified during site visit. Documentation up to date.',
    'System tested and operational. No deviations observed.',
    'Certification valid. Next review scheduled as per cycle.',
    'Drill conducted successfully with full workforce participation.',
  ],
  pending: [
    'Inspection scheduled. Awaiting inspector visit.',
    'Documentation submitted. Under review by compliance team.',
    'System calibration in progress. Results expected shortly.',
    'Training module assigned. Completion pending for 3 workers.',
    'Report submitted to regional office. Approval awaited.',
  ],
  overdue: [
    'Deadline passed. Inspection not yet conducted.',
    'Certification expired. Renewal application submitted.',
    'Monthly report overdue by 15 days. Reminder sent to operator.',
    'Equipment audit lapsed. Urgent scheduling required.',
    'Environmental review delayed due to monsoon conditions.',
  ],
  non_compliant: [
    'PM10 levels exceeded permissible limits at east boundary.',
    'Ventilation airflow below minimum required in Section B-12.',
    'Roof bolt density insufficient. Corrective action initiated.',
    'Settling pond overflow detected during runoff event.',
    'Methane concentration above threshold. Immediate action required.',
  ],
  in_progress: [
    'Corrective action 60% complete. Expected completion next week.',
    'Equipment upgrade ordered. Installation in progress.',
    'Re-inspection scheduled after initial findings.',
    'Retraining program underway. 70% workforce covered.',
    'System modification under review by engineering team.',
  ],
};

const auditors = [
  'R. Subramanian', 'A. Mehta', 'S. Nair', 'P. Reddy', 'K. Dasgupta',
  'M. Banerjee', 'V. Joshi', 'T. Krishnan',
];

// Deterministic pseudo-random based on index for stable mock data
function seededValue(seed: number, max: number): number {
  return (seed * 9301 + 49297) % max;
}

function generateRecordsForMine(mine: MineRef, mineIndex: number): ComplianceRecord[] {
  return requirements.map((req, reqIndex) => {
    const globalIndex = mineIndex * 12 + reqIndex;
    const seed = globalIndex + 1;

    // Distribute statuses realistically across the 12 requirements
    // Mines with higher compliance get more compliant records
    const mineComplianceProfile: Record<string, number> = {
      'MOC-66': 9, 'MOC-67': 5, 'MOC-68': 8, 'MOC-69': 3, 'MOC-70': 9, 'MOC-71': 4,
    };
    const compliantCount = mineComplianceProfile[mine.id] ?? 6;

    let status: ComplianceRecord['status'];
    if (reqIndex < compliantCount) {
      status = 'compliant';
    } else if (reqIndex < compliantCount + 2) {
      status = seededValue(seed, 2) === 0 ? 'pending' : 'in_progress';
    } else {
      status = seededValue(seed, 2) === 0 ? 'overdue' : 'non_compliant';
    }

    // Compliance score based on status
    let score: number;
    if (status === 'compliant') {
      score = 85 + seededValue(seed + 3, 15); // 85-99
    } else if (status === 'in_progress') {
      score = 60 + seededValue(seed + 5, 20); // 60-79
    } else if (status === 'pending') {
      score = 55 + seededValue(seed + 7, 15); // 55-69
    } else if (status === 'overdue') {
      score = 30 + seededValue(seed + 11, 25); // 30-54
    } else {
      score = 15 + seededValue(seed + 13, 30); // 15-44
    }

    // Dates: due dates spread across the year, completion only for compliant/in_progress
    const dueMonth = (reqIndex % 12) + 1;
    const dueDay = 1 + seededValue(seed + 17, 28);
    const dueDate = `2026-${String(dueMonth).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;

    let completionDate: string | null = null;
    if (status === 'compliant') {
      const compMonth = Math.max(1, dueMonth - 1);
      const compDay = 1 + seededValue(seed + 19, 28);
      completionDate = `2026-${String(compMonth).padStart(2, '0')}-${String(compDay).padStart(2, '0')}`;
    } else if (status === 'in_progress') {
      const compMonth = Math.min(12, dueMonth + 1);
      completionDate = `2026-${String(compMonth).padStart(2, '0')}-15`;
    }

    const remarksPool = complianceRemarks[status];
    const remark = remarksPool[seededValue(seed + 23, remarksPool.length)];

    const dataSource = dataSources[seededValue(seed + 29, dataSources.length)];
    const auditor = auditors[seededValue(seed + 31, auditors.length)];

    const createdMonth = Math.max(1, dueMonth - 2);
    const createdDay = 1 + seededValue(seed + 37, 28);
    const createdAt = `2026-${String(createdMonth).padStart(2, '0')}-${String(createdDay).padStart(2, '0')}`;

    const updatedMonth = Math.max(1, dueMonth - 1);
    const updatedDay = 1 + seededValue(seed + 41, 28);
    const updatedAt = `2026-${String(updatedMonth).padStart(2, '0')}-${String(updatedDay).padStart(2, '0')}`;

    return {
      id: `CR-${mine.code}-${req.id}`,
      mineId: mine.id,
      mineCode: mine.code,
      mineName: mine.name,
      requirementId: req.id,
      requirement: req.name,
      dueDate,
      completionDate,
      status,
      complianceScore: score,
      remarks: remark,
      createdBy: auditor,
      createdAt,
      updatedAt,
      dataSource,
    };
  });
}

export const mockComplianceRecords: ComplianceRecord[] = mines.flatMap(generateRecordsForMine);
