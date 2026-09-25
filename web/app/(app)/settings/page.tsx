'use client';

import { useEffect, useState } from 'react';
import {
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
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
  updateMyProfile,
  type SettingsMineAssignment,
  type SettingsPermission,
  type SettingsProfile,
} from '@/lib/data/settings';

type Feedback = { type: 'success' | 'error'; message: string } | null;

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

function ProfileEditor({
  profile,
  onSaved,
  onFeedback,
}: {
  profile: SettingsProfile | null;
  onSaved: (profile: SettingsProfile) => void;
  onFeedback: (feedback: Feedback) => void;
}) {
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [organization, setOrganization] = useState(profile?.organization ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setOrganization(profile?.organization ?? '');
  }, [profile?.id, profile?.full_name, profile?.organization]);

  const dirty =
    fullName !== (profile?.full_name ?? '') ||
    organization !== (profile?.organization ?? '');

  async function handleSave() {
    const nextFullName = fullName.trim();
    const nextOrganization = organization.trim();

    if (!nextFullName) {
      onFeedback({ type: 'error', message: 'Full Name is required.' });
      return;
    }

    setSaving(true);
    onFeedback(null);

    try {
      const updated = await updateMyProfile(nextFullName, nextOrganization);
      onSaved(updated);
      setFullName(updated.full_name ?? '');
      setOrganization(updated.organization ?? '');
      onFeedback({ type: 'success', message: 'Profile updated successfully.' });
    } catch (error) {
      onFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to update your profile.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-lg">{initials(fullName)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-foreground">{fullName || 'Unnamed User'}</p>
          <p className="text-sm text-muted-foreground">{formatRole(profile?.role ?? null)}</p>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="organization">Organization</Label>
          <Input
            id="organization"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={profile?.email ?? '—'} readOnly />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Account Status</Label>
          <Input id="status" value={profile?.status ?? '—'} readOnly />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={() => void handleSave()} disabled={saving || !dirty}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </>
  );
}

export default function SettingsPage() {
  const { session, profile: authProfile } = useAuth();
  const [profile, setProfile] = useState<SettingsProfile | null>(null);
  const [permissions, setPermissions] = useState<SettingsPermission[]>([]);
  const [assignments, setAssignments] = useState<SettingsMineAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);


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
        <TabsList className="grid w-full grid-cols-2 sm:w-fit">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
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
              <CardDescription>Manage your profile information.</CardDescription>
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
                <ProfileEditor
                  profile={effectiveProfile}
                  onSaved={setProfile}
                  onFeedback={setFeedback}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Security & Access</CardTitle>
              <CardDescription>Your role, mine access, and permissions.</CardDescription>
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
                    <ShieldCheck className="h-4 w-4" /> Account Status
                  </div>
                  <div className="mt-2"><Badge variant="secondary">{effectiveProfile?.status ?? 'Unknown'}</Badge></div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Mine Access</p>
                {isAdmin ? (
                  <div className="rounded-md border px-3 py-2 text-sm">All mines</div>
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
                  <p className="text-sm text-muted-foreground">No active mine assignment.</p>
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
                  <p className="text-sm text-muted-foreground">No permissions assigned.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
