'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Search, Bell, ChevronDown, LogOut, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { mockAlerts } from '@/lib/mock-data';
import { useAuth } from '@/components/auth/auth-provider';

interface HeaderProps {
  onMenuClick: () => void;
}

function getInitials(name: string | null | undefined) {
  const value = name?.trim();

  if (!value) return 'MG';

  const parts = value.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { profile, signOut } = useAuth();

  const unacknowledgedAlerts = mockAlerts.filter((a) => !a.acknowledged);
  const displayName = profile?.full_name?.trim() || 'MineGuard User';
  const displayRole = profile?.role || 'User';
  const initials = getInitials(profile?.full_name);

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);

    try {
      await signOut();
      router.replace('/login');
    } catch {
      setSigningOut(false);
    }
  }

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
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu((s) => !s)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50"
            aria-haspopup="menu"
            aria-expanded={showUserMenu}
            disabled={signingOut}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initials}
            </div>
            <div className="hidden flex-col text-left sm:flex">
              <span className="text-sm font-medium leading-tight">{displayName}</span>
              <span className="text-xs text-muted-foreground leading-tight">{displayRole}</span>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
                aria-hidden="true"
              />
              <div
                className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-border bg-popover p-2 shadow-lg"
                role="menu"
              >
                <div className="border-b border-border px-3 py-2">
                  <p className="truncate text-sm font-medium">{displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">{displayRole}</p>
                  {profile?.email && (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {profile.email}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void handleSignOut()}
                  className="mt-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
                  disabled={signingOut}
                >
                  {signingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  {signingOut ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
