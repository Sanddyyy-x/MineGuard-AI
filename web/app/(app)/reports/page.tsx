'use client';

import { FileBarChart } from 'lucide-react';
import { PlaceholderPage } from '@/components/shared/placeholder-page';

export default function ReportsPage() {
  return (
    <PlaceholderPage
      title="Reports"
      description="Generate and download compliance, inspection, and operational reports for audits and stakeholder review."
      icon={FileBarChart}
    />
  );
}
