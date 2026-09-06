export type MineStatus = 'active' | 'suspended' | 'under_review' | 'closed';

export type ComplianceLevel = 'compliant' | 'warning' | 'critical';

export type ComplianceRecordStatus =
  | 'compliant'
  | 'pending'
  | 'overdue'
  | 'non_compliant'
  | 'in_progress';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type InspectionStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'overdue';

export type AlertType =
  | 'compliance'
  | 'safety'
  | 'environmental'
  | 'operational'
  | 'ai_prediction';

export interface Mine {
  id: string;
  code: string;
  name: string;
  location: string;
  state: string;
  district: string;
  coalGrade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  type: 'opencast' | 'underground' | 'mixed';
  status: MineStatus;
  complianceScore: number;
  complianceLevel: ComplianceLevel;
  workforce: number;
  productionTarget: number;
  productionAchieved: number;
  lastInspection: string;
  nextInspection: string;
  openViolations: number;
  area: number;
  operator: string;
  reserves: number;
}

export interface ComplianceItem {
  id: string;
  mineId: string;
  mineName: string;
  regulation: string;
  description: string;
  level: ComplianceLevel;
  dueDate: string;
  status: 'compliant' | 'warning' | 'critical' | 'pending';
}

export interface ComplianceRecord {
  id: string;
  mineId: string;
  mineCode: string;
  mineName: string;
  requirementId: string;
  requirement: string;
  dueDate: string;
  completionDate: string | null;
  status: ComplianceRecordStatus;
  complianceScore: number;
  remarks: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dataSource: 'inspection' | 'self_report' | 'audit' | 'iot_sensor' | 'ai_analysis';
}

export interface Inspection {
  id: string;
  mineId: string;
  mineName: string;
  date: string;
  type: 'safety' | 'environmental' | 'operational' | 'compliance';
  inspector: string;
  status: InspectionStatus;
  observations: number;
  violations: number;
}

export interface Observation {
  id: string;
  mineId: string;
  mineName: string;
  inspectionId: string;
  category: string;
  description: string;
  severity: Severity;
  status: 'open' | 'acknowledged' | 'resolved';
  createdAt: string;
}

export interface Violation {
  id: string;
  mineId: string;
  mineName: string;
  regulation: string;
  description: string;
  severity: Severity;
  penalty: number;
  status: 'open' | 'contested' | 'resolved' | 'paid';
  date: string;
}

export interface CorrectiveAction {
  id: string;
  mineId: string;
  mineName: string;
  relatedViolationId: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  progress: number;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
}

export interface Alert {
  id: string;
  mineId: string;
  mineName: string;
  type: AlertType;
  title: string;
  description: string;
  severity: Severity;
  timestamp: string;
  acknowledged: boolean;
}

export interface DashboardStats {
  totalMines: number;
  activeMines: number;
  complianceRate: number;
  openViolations: number;
  pendingInspections: number;
  activeAlerts: number;
  totalObservations: number;
  correctiveActionsInProgress: number;
}

export interface ComplianceTrendPoint {
  month: string;
  compliance: number;
  violations: number;
  inspections: number;
}

export interface RegionData {
  region: string;
  mines: number;
  compliance: number;
  violations: number;
}
