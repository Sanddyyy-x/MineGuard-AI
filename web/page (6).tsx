'use client';

import { Settings } from 'lucide-react';
import { PlaceholderPage } from '@/components/shared/placeholder-page';

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings & Profile"
      description="Manage user profile, notification preferences, system configuration, and platform integrations."
      icon={Settings}
    />
  );
}
