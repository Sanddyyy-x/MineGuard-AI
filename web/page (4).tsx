'use client';

import { Map } from 'lucide-react';
import { PlaceholderPage } from '@/components/shared/placeholder-page';

export default function GisPage() {
  return (
    <PlaceholderPage
      title="GIS / Mine Map"
      description="Geographic information system view of all mine locations with spatial compliance and risk overlays."
      icon={Map}
    />
  );
}
