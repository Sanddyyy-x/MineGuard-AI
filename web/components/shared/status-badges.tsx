import type { ComplianceLevel, Severity, MineStatus, InspectionStatus, ComplianceRecordStatus } from '@/types';
import { cn } from '@/lib/utils';

const levelConfig: Record<ComplianceLevel, { label: string; className: string }> = {
  compliant: {
    label: 'Compliant',
    className: 'bg-success/10 text-success border-success/30',
  },
  warning: {
    label: 'Warning',
    className: 'bg-warning/10 text-warning border-warning/30',
  },
  critical: {
    label: 'Critical',
    className: 'bg-destructive/10 text-destructive border-destructive/30',
  },
};

const severityConfig: Record<Severity, { label: string; className: string }> = {
  low: {
    label: 'Low',
    className: 'bg-muted text-muted-foreground border-border',
  },
  medium: {
    label: 'Medium',
    className: 'bg-info/10 text-info border-info/30',
  },
  high: {
    label: 'High',
    className: 'bg-warning/10 text-warning border-warning/30',
  },
  critical: {
    label: 'Critical',
    className: 'bg-destructive/10 text-destructive border-destructive/30',
  },
};

const mineStatusConfig: Record<MineStatus, { label: string; className: string }> = {
  active: {
    label: 'Active',
    className: 'bg-success/10 text-success border-success/30',
  },
  suspended: {
    label: 'Suspended',
    className: 'bg-destructive/10 text-destructive border-destructive/30',
  },
  under_review: {
    label: 'Under Review',
    className: 'bg-warning/10 text-warning border-warning/30',
  },
  closed: {
    label: 'Closed',
    className: 'bg-muted text-muted-foreground border-border',
  },
  as_documented: {
    label: 'As Documented',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

const inspectionStatusConfig: Record<InspectionStatus, { label: string; className: string }> = {
  scheduled: {
    label: 'Scheduled',
    className: 'bg-info/10 text-info border-info/30',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-warning/10 text-warning border-warning/30',
  },
  completed: {
    label: 'Completed',
    className: 'bg-success/10 text-success border-success/30',
  },
  overdue: {
    label: 'Overdue',
    className: 'bg-destructive/10 text-destructive border-destructive/30',
  },
};

const complianceRecordStatusConfig: Record<ComplianceRecordStatus, { label: string; className: string }> = {
  compliant: {
    label: 'Compliant',
    className: 'bg-success/10 text-success border-success/30',
  },
  pending: {
    label: 'Pending',
    className: 'bg-info/10 text-info border-info/30',
  },
  overdue: {
    label: 'Overdue',
    className: 'bg-destructive/10 text-destructive border-destructive/30',
  },
  non_compliant: {
    label: 'Non-Compliant',
    className: 'bg-destructive/15 text-destructive border-destructive/40',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-warning/10 text-warning border-warning/30',
  },
};

export function ComplianceRecordStatusBadge({ status }: { status: ComplianceRecordStatus }) {
  const config = complianceRecordStatusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

export function StatusBadge({
  level,
}: {
  level: ComplianceLevel;
}) {
  const config = levelConfig[level];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const config = severityConfig[severity];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

export function MineStatusBadge({ status }: { status: MineStatus }) {
  const config = mineStatusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

export function InspectionStatusBadge({ status }: { status: InspectionStatus }) {
  const config = inspectionStatusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
