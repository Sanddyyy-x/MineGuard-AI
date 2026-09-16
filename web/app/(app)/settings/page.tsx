'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  User,
  SlidersHorizontal,
  Bell,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Info,
  LockKeyhole,
  Building2,
} from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/components/auth/auth-provider';
import {
  getSettingsMineAssignments,
  getSettingsPermissions,
  getSettingsProfile,
  updatePassword,
  type SettingsMineAssignment,
  type SettingsPermission,
  type SettingsProfile,
} from '@/lib/data/settings';

type Feedback = { type: 'success' | 'error'; message: string } | null;

type LocalPreferences = {
  language: string;
  timezone: string;
  dateFormat: string;
  compactMode: boolean;
  darkMode: boolean;
};

type LocalNotifications = {
  emailAlerts: boolean;
  smsAlerts: boolean;
  criticalOnly: boolean;
  weeklyDigest: boolean;
};

const initialPreferences: LocalPreferences = {
  language: 'en-IN',
  timezone: 'Asia/Kolkata',
  dateFormat: 'DD MMM YYYY',
  compactMode: false,
  darkMode: false,
};

const initialNotifications: LocalNotifications = {
  emailAlerts: true,
  smsAlerts: false,
  criticalOnly: false,
  weeklyDigest: true,
};

function initials(name: string | null | undefined) {
  return (name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
}

function formatRole(role: string | null) {
  return role ?? 'Not assigned';
}

function formatPermission(code: string) {
  return code
    .replace(/^view_/, 'View ')
    .replace(/^create_/, 'Create ')
    .replace(/^update_/, 'Update ')
    .replace(/^manage_/, 'Manage ')
    .replace(/^verify_/, 'Verify ')
    .replace(/^upload_/, 'Upload ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isValidPassword(password: string) {
  return password.length >= 8;
}

export default function SettingsPage() {
  const { session, profile: authProfile } = useAuth();
  const [profile, setProfile] = useState<SettingsProfile | null>(null);
  const [permissions, setPermissions] = useState<SettingsPermission[]>([]);
  const [assignments, setAssignments] = useState<SettingsMineAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const [preferences, setPreferences] = useState(initialPreferences);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    let mounted = true;
    setLoading(true);
    setLoadError(null);

    async function loadSettings() {
  if (!session?.user?.id) {
    return;
  }

  try {
    const loadedProfile = await getSettingsProfile(session.user.id);

    const [loadedPermissions, loadedAssignments] = await Promise.all([
      getSettingsPermissions(loadedProfile.role),
      getSettingsMineAssignments(session.user.id),
    ]);


        if (!mounted) return;
        setProfile(loadedProfile);
        setPermissions(loadedPermissions);
        setAssignments(loadedAssignments);
      } catch (error) {
        if (!mounted) return;
        setLoadError(error instanceof Error ? error.message : 'Unable to load Settings.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadSettings();
    return () => {
      mounted = false;
    };
  }, [session?.user?.id]);

  const effectiveProfile = profile ?? authProfile;
  const profileName = effectiveProfile?.full_name ?? 'Unnamed User';
  const profileEmail = effectiveProfile?.email ?? session?.user?.email ?? '—';
  const role = effectiveProfile?.role ?? null;
  const isAdmin = role === 'Admin';

  const preferencesDirty = useMemo(
    () => JSON.stringify(preferences) !== JSON.stringify(initialPreferences),
    [preferences]
  );
  const notificationsDirty = useMemo(
    () => JSON.stringify(notifications) !== JSON.stringify(initialNotifications),
    [notifications]
  );

  async function handlePasswordChange() {
    setFeedback(null);

    if (!isValidPassword(newPassword)) {
      setFeedback({ type: 'error', message: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }

    setSavingPassword(true);
    try {
      await updatePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setFeedback({ type: 'success', message: 'Password updated successfully.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to update your password.',
      });
    } finally {
      setSavingPassword(false);
    }
  }

  function handleResetPreferences() {
    setPreferences(initialPreferences);
    setFeedback(null);
  }

  function handleResetNotifications() {
    setNotifications(initialNotifications);
    setFeedback(null);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Settings & Profile"
        description="View your account, access, security, and application settings."
      />

      {loadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Could not load account details</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {feedback && (
        <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'}>
          {feedback.type === 'error' ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          <AlertTitle>{feedback.type === 'error' ? 'Action failed' : 'Success'}</AlertTitle>
          <AlertDescription>{feedback.message}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" onValueChange={() => setFeedback(null)}>
        <TabsList className="grid w-full grid-cols-2 sm:w-fit sm:grid-cols-4">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Information</CardTitle>
              <CardDescription>Your account details from the MineGuard profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-16 w-16 rounded-full bg-muted" />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="h-10 rounded-md bg-muted" />
                    <div className="h-10 rounded-md bg-muted" />
                    <div className="h-10 rounded-md bg-muted" />
                    <div className="h-10 rounded-md bg-muted" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-lg">{initials(profileName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{profileName}</p>
                      <p className="text-sm text-muted-foreground">{formatRole(role)}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" value={profileName} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={profileEmail} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="organization">Organization</Label>
                      <Input id="organization" value={effectiveProfile?.organization ?? '—'} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Account Status</Label>
                      <Input id="status" value={effectiveProfile?.status ?? '—'} readOnly />
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Profile fields are read-only</AlertTitle>
                    <AlertDescription>
                      These values come from the authenticated MineGuard profile. Profile editing
                      will be enabled after the account-management backend provides an authorized
                      update path.
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Preferences</CardTitle>
              <CardDescription>Display and locale controls available in the current UI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={preferences.language}
                    onValueChange={(value) => setPreferences((p) => ({ ...p, language: value }))}
                  >
                    <SelectTrigger aria-label="Select language"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-IN">English (India)</SelectItem>
                      <SelectItem value="hi-IN">Hindi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={preferences.timezone}
                    onValueChange={(value) => setPreferences((p) => ({ ...p, timezone: value }))}
                  >
                    <SelectTrigger aria-label="Select timezone"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">India Standard Time (IST)</SelectItem>
                      <SelectItem value="UTC">Coordinated Universal Time (UTC)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select
                    value={preferences.dateFormat}
                    onValueChange={(value) => setPreferences((p) => ({ ...p, dateFormat: value }))}
                  >
                    <SelectTrigger aria-label="Select date format"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD MMM YYYY">DD MMM YYYY (18 Sep 2026)</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (09/18/2026)</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2026-09-18)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Compact Mode</p>
                    <p className="text-sm text-muted-foreground">Show denser tables and lists across the application.</p>
                  </div>
                  <Switch
                    checked={preferences.compactMode}
                    onCheckedChange={(checked) => setPreferences((p) => ({ ...p, compactMode: checked }))}
                    aria-label="Toggle compact mode"
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">Theme persistence is not connected to the MineGuard backend yet.</p>
                  </div>
                  <Switch
                    checked={preferences.darkMode}
                    onCheckedChange={(checked) => setPreferences((p) => ({ ...p, darkMode: checked }))}
                    aria-label="Toggle dark mode"
                  />
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Persistence is not connected</AlertTitle>
                <AlertDescription>
                  The current backend has no user-preferences storage contract. These controls are
                  intentionally local until that backend is added; they are not presented as saved account settings.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end">
                <Button variant="outline" onClick={handleResetPreferences} disabled={!preferencesDirty}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notification Preferences</CardTitle>
              <CardDescription>Notification controls reserved for the account preference backend.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Email Alerts</p>
                    <p className="text-sm text-muted-foreground">Receive alert notifications by email.</p>
                  </div>
                  <Switch checked={notifications.emailAlerts} onCheckedChange={(checked) => setNotifications((n) => ({ ...n, emailAlerts: checked }))} aria-label="Toggle email alerts" />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">SMS Alerts</p>
                    <p className="text-sm text-muted-foreground">Receive alert notifications by SMS.</p>
                  </div>
                  <Switch checked={notifications.smsAlerts} onCheckedChange={(checked) => setNotifications((n) => ({ ...n, smsAlerts: checked }))} aria-label="Toggle SMS alerts" />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Critical Only</p>
                    <p className="text-sm text-muted-foreground">Only notify for critical-severity alerts.</p>
                  </div>
                  <Switch checked={notifications.criticalOnly} onCheckedChange={(checked) => setNotifications((n) => ({ ...n, criticalOnly: checked }))} aria-label="Toggle critical-only notifications" />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Weekly Digest</p>
                    <p className="text-sm text-muted-foreground">Receive a weekly summary of compliance activity.</p>
                  </div>
                  <Switch checked={notifications.weeklyDigest} onCheckedChange={(checked) => setNotifications((n) => ({ ...n, weeklyDigest: checked }))} aria-label="Toggle weekly digest" />
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Persistence is not connected</AlertTitle>
                <AlertDescription>
                  Notification preferences are not stored in the current MineGuard schema. The controls above are local UI state until an authorized persistence mechanism is added.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end">
                <Button variant="outline" onClick={handleResetNotifications} disabled={!notificationsDirty}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Security & Access</CardTitle>
              <CardDescription>Live account role, permissions, mine access, and password management.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ShieldCheck className="h-4 w-4" /> Role
                  </div>
                  <div className="mt-2"><Badge variant="secondary">{formatRole(role)}</Badge></div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <LockKeyhole className="h-4 w-4" /> Account status
                  </div>
                  <div className="mt-2"><Badge variant="secondary">{effectiveProfile?.status ?? 'Unknown'}</Badge></div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <p className="text-sm font-medium text-foreground">Mine Access</p>
                </div>
                {isAdmin ? (
                  <p className="text-sm text-muted-foreground">Admin access is evaluated globally by the existing `has_mine_access` authorization rule.</p>
                ) : assignments.length > 0 ? (
                  <div className="space-y-2">
                    {assignments.map((assignment) => (
                      <div key={assignment.mineId} className="flex items-center justify-between rounded-md border px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">{assignment.mineCode}</p>
                          <p className="text-sm text-muted-foreground">{assignment.mineName}</p>
                        </div>
                        <Badge variant="secondary">{assignment.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No active mine assignment is available for this account.</p>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Effective Permissions</p>
                {permissions.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {permissions.map((permission) => (
                      <div key={permission.code} className="flex items-start gap-2 rounded-md border px-3 py-2 text-sm">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <span>{formatPermission(permission.code)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No permissions are currently assigned to this role.</p>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    <p className="text-sm font-medium text-foreground">Change Password</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">Password changes use Supabase Auth; MineGuard does not store the password itself.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => void handlePasswordChange()} disabled={savingPassword || !newPassword || !confirmPassword}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    {savingPassword ? 'Updating…' : 'Update Password'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
