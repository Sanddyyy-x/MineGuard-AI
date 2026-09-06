'use client';

import { useState } from 'react';
import { Menu, Search, Bell, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { mockAlerts } from '@/lib/mock-data';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const unacknowledgedAlerts = mockAlerts.filter((a) => !a.acknowledged);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search */}
      <div className="relative hidden flex-1 md:block md:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search mines, inspections, violations..."
          className="pl-10 bg-muted/50"
        />
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">
        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNotifications((s) => !s)}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unacknowledgedAlerts.length > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unacknowledgedAlerts.length}
              </span>
            )}
          </Button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-popover shadow-lg">
                <div className="border-b border-border px-4 py-3">
                  <span className="text-sm font-semibold">Recent Alerts</span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {unacknowledgedAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="border-b border-border px-4 py-3 last:border-0"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium">{alert.title}</span>
                        <Badge
                          variant={
                            alert.severity === 'critical'
                              ? 'destructive'
                              : alert.severity === 'high'
                              ? 'default'
                              : 'secondary'
                          }
                          className="shrink-0 text-xs"
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {alert.description}
                      </p>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {alert.mineName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User menu */}
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            RA
          </div>
          <div className="hidden flex-col sm:flex">
            <span className="text-sm font-medium leading-tight">Rajesh Agarwal</span>
            <span className="text-xs text-muted-foreground leading-tight">Compliance Officer</span>
          </div>
          <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
        </div>
      </div>
    </header>
  );
}
