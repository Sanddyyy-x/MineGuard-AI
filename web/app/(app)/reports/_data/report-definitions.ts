import type { Severity } from '@/types';

export type ReportType =
  | 'compliance'
  | 'inspections'
  | 'observations'
  | 'violations'
  | 'corrective-actions'
  | 'alerts';

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  compliance: 'Compliance Summary',
  inspections: 'Inspections Summary',
  observations: 'Observations Summary',
  violations: 'Violations Summary',
  'corrective-actions': 'Corrective Actions Summary',
  alerts: 'Alerts Summary',
};

export interface ReportRow {
  id: string;
  mineName: string;
  primary: string;
  secondary: string;
  status: string;
  severity?: Severity;
  date: string;
}

export interface ReportColumn {
  key: string;
  label: string;
}

export const REPORT_COLUMNS: Record<ReportType, ReportColumn[]> = {
  compliance: [
    { key: 'mineName', label: 'Mine' },
    { key: 'primary', label: 'Regulation' },
    { key: 'secondary', label: 'Description' },
    { key: 'status', label: 'Level' },
    { key: 'date', label: 'Due Date' },
  ],
  inspections: [
    { key: 'mineName', label: 'Mine' },
    { key: 'primary', label: 'Inspection Type' },
    { key: 'secondary', label: 'Inspector' },
    { key: 'status', label: 'Status' },
    { key: 'date', label: 'Date' },
  ],
  observations: [
    { key: 'mineName', label: 'Mine' },
    { key: 'primary', label: 'Category' },
    { key: 'secondary', label: 'Description' },
    { key: 'severity', label: 'Severity' },
    { key: 'date', label: 'Recorded' },
  ],
  violations: [
    { key: 'mineName', label: 'Mine' },
    { key: 'primary', label: 'Regulation' },
    { key: 'secondary', label: 'Description' },
    { key: 'severity', label: 'Severity' },
    { key: 'status', label: 'Status' },
    { key: 'date', label: 'Date' },
  ],
  'corrective-actions': [
    { key: 'mineName', label: 'Mine' },
    { key: 'primary', label: 'Action' },
    { key: 'secondary', label: 'Assigned To' },
    { key: 'status', label: 'Status' },
    { key: 'date', label: 'Due Date' },
  ],
  alerts: [
    { key: 'mineName', label: 'Mine' },
    { key: 'primary', label: 'Title' },
    { key: 'secondary', label: 'Description' },
    { key: 'severity', label: 'Severity' },
    { key: 'status', label: 'Status' },
    { key: 'date', label: 'Timestamp' },
  ],
};

export function getStatusOptions(rows: ReportRow[]): string[] {
  return Array.from(
    new Set(rows.map((row) => row.status).filter((status) => status.trim() !== ''))
  ).sort();
}

export function rowsToCsv(rows: ReportRow[], columns: ReportColumn[]): string {
  const header = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(',');
  const lines = rows.map((row) =>
    columns
      .map((c) => {
        const value = (row as unknown as Record<string, unknown>)[c.key];
        const text = value === undefined || value === null ? '' : String(value);
        return `"${text.replace(/"/g, '""')}"`;
      })
      .join(',')
  );
  return [header, ...lines].join('\n');
}
