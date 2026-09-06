'use client';

import { ClipboardCheck } from 'lucide-react';
import { PlaceholderPage } from '@/components/shared/placeholder-page';

export default function InspectionsPage() {
  return (
    <PlaceholderPage
      title="Inspections"
      description="Schedule, track, and review safety, environmental, and compliance inspections across all mine sites."
      icon={ClipboardCheck}
    />
  );
}
