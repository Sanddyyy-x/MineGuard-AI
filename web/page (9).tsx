'use client';

import { Bell } from 'lucide-react';
import { PlaceholderPage } from '@/components/shared/placeholder-page';

export default function AlertsPage() {
  return (
    <PlaceholderPage
      title="Alerts"
      description="Real-time safety, compliance, environmental, and AI-predicted alerts across all monitored mines."
      icon={Bell}
    />
  );
}
