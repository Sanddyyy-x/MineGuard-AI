'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, ChevronLeft } from 'lucide-react';

import { cn } from '@/lib/utils';
import { navItems } from '@/lib/navigation';
import { mockDashboardStats } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/auth-provider';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const badgeMap: Record<string, number> = {
  activeAlerts: mockDashboardStats.activeAlerts,
  openViolations: mockDashboardStats.openViolations ?? 0,
  pendingInspections: mockDashboardStats.pendingInspections,
};

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const displayName = profile?.full_name || 'MineGuard User';
  const displayRole = profile?.role || 'User';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'MG';

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-primary transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo / Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary-foreground shadow-lg">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-primary-foreground">
              MineGuard AI
            </span>
            <span className="text-xs text-primary-foreground/60">
              Governance & Compliance
            </span>
          </div>
          <button
            onClick={onClose}
            className="ml-auto rounded-md p-1.5 text-primary-foreground/70 hover:bg-white/10 hover:text-primary-foreground lg:hidden"
            aria-label="Close sidebar"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              const badgeCount = item.badgeKey ? badgeMap[item.badgeKey] : undefined;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-accent text-primary shadow-md'
                        : 'text-primary-foreground/70 hover:bg-white/10 hover:text-primary-foreground'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 shrink-0 transition-colors',
                        isActive
                          ? 'text-primary'
                          : 'text-primary-foreground/60 group-hover:text-primary-foreground'
                      )}
                    />
                    <span className="flex-1">{item.label}</span>
                    {badgeCount !== undefined && badgeCount > 0 && (
                      <Badge
                        variant={isActive ? 'secondary' : 'destructive'}
                        className="h-5 min-w-5 justify-center px-1.5 text-xs"
                      >
                        {badgeCount}
                      </Badge>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-primary-foreground">
              {initials}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-primary-foreground">
                {displayName}
              </span>
              <span className="truncate text-xs text-primary-foreground/50">
                {displayRole}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
