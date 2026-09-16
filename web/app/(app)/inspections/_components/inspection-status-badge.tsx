import { Badge } from '@/components/ui/badge';

function statusClass(status: string | null) {
  const normalized = status?.trim().toLowerCase() ?? '';

  if (
    normalized.includes('non-compliant') ||
    normalized.includes('non compliant') ||
    normalized.includes('unsafe') ||
    normalized.includes('failed') ||
    normalized.includes('fail')
  ) {
    return 'bg-destructive/10 text-destructive border-destructive/30';
  }

  if (
    normalized.includes('needs attention') ||
    normalized.includes('warning') ||
    normalized.includes('pending') ||
    normalized.includes('scheduled') ||
    normalized.includes('in progress')
  ) {
    return 'bg-warning/10 text-warning border-warning/30';
  }

  if (
    normalized.includes('compliant') ||
    normalized.includes('completed') ||
    normalized === 'passed'
  ) {
    return 'bg-success/10 text-success border-success/30';
  }

  return '';
}

export function InspectionOverallStatusBadge({
  status,
}: {
  status: string | null;
}) {
  if (!status || status.trim() === '') {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Not set
      </Badge>
    );
  }

  const className = statusClass(status);

  return (
    <Badge
      variant="outline"
      className={className || undefined}
    >
      {status}
    </Badge>
  );
}
