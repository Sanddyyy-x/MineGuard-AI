'use client';

import { AlertTriangle } from 'lucide-react';
import { PlaceholderPage } from '@/components/shared/placeholder-page';

export default function ViolationsPage() {
  return (
    <PlaceholderPage
      title="Violations"
      description="Recorded regulatory violations with penalty details, contest status, and resolution tracking."
      icon={AlertTriangle}
    />
  );
}
