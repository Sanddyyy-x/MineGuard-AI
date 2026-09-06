import type { LucideIcon } from 'lucide-react';
import { Construction } from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export function PlaceholderPage({ title, description, icon: Icon = Construction }: PlaceholderPageProps) {
  return (
    <div className="animate-fade-in">
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">Under Development</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            This section is part of the MineGuard AI platform roadmap. It will be
            implemented in an upcoming development phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
