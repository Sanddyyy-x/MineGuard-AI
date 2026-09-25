'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserMinus,
  UserPlus,
  UserX,
  XCircle,
} from 'lucide-react';

import { PageHeader } from '@/components/layout/page-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth/auth-provider';
import {
  ADMIN_ROLES,
  approveAdminUser,
  deactivateAdminUser,
  getActiveAdminUsers,
  getAdminInactiveUsers,
  getAdminRejectedUsers,
  getAdminMines,
  getAdminSummary,
  getPendingAdminUsers,
  reactivateAdminUser,
  getRolePermissions,
  rejectAdminUser,
  updateAdminUserMine,
  updateAdminUserRole,
  type ActiveAdminUser,
  type AdminMine,
  type AdminRole,
  type AdminSummary,
  type InactiveAdminUser,
  type PendingAdminUser,
} from '@/lib/data/admin-users';

const permissionLabels: Record<string, string> = {
  manage_users: 'Manage users',
  manage_roles: 'Manage roles',
  manage_mines: 'Manage mines',
  manage_compliance: 'Manage compliance',
  manage_alerts: 'Manage alerts',
  manage_ai_risk: 'Manage AI risk',
  view_ai_risk: 'View AI risk',
  view_dashboard: 'View dashboard',
  view_mines: 'View mines',
  view_inspections: 'View inspections',
  view_observations: 'View observations',
  view_violations: 'View violations',
  view_corrective_actions: 'View corrective actions',
  view_compliance: 'View compliance',
  view_alerts: 'View alerts',
  view_documents: 'View documents',
  view_audit_logs: 'View audit logs',
  create_inspections: 'Create inspections',
  create_observations: 'Create observations',
  create_violations: 'Create violations',
  create_corrective_actions: 'Create corrective actions',
  update_inspections: 'Update inspections',
  update_violations: 'Update violations',
  update_corrective_actions: 'Update corrective actions',
  verify_corrective_actions: 'Verify corrective actions',
  upload_documents: 'Upload documents',
};

function formatPermission(code: string) {
  return permissionLabels[code] ?? code.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function initials(name: string | null) {
  return (name ?? 'User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
}

function displayMine(code: string | null, name: string | null) {
  if (code && name) return `${code} — ${name}`;
  return code || name || 'Not assigned';
}

function roleIsValid(role: string | null): role is AdminRole {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}

type Feedback = { type: 'success' | 'error'; message: string } | null;

export default function AdminUsersPage() {
  const { profile } = useAuth();
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [pending, setPending] = useState<PendingAdminUser[]>([]);
  const [active, setActive] = useState<ActiveAdminUser[]>([]);
  const [inactive, setInactive] = useState<InactiveAdminUser[]>([]);
  const [rejected, setRejected] = useState<InactiveAdminUser[]>([]);
  const [mines, setMines] = useState<AdminMine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [search, setSearch] = useState('');
  const [selectedPending, setSelectedPending] = useState<PendingAdminUser | null>(null);
  const [selectedActive, setSelectedActive] = useState<ActiveAdminUser | null>(null);
  const [pendingRole, setPendingRole] = useState<AdminRole | ''>('');
  const [pendingMineId, setPendingMineId] = useState('');
  const [activeRole, setActiveRole] = useState<AdminRole | ''>('');
  const [activeMineId, setActiveMineId] = useState('');
  const [pendingPermissions, setPendingPermissions] = useState<{ code: string }[]>([]);
  const [pendingPermissionsLoading, setPendingPermissionsLoading] = useState(false);
  const [activePermissions, setActivePermissions] = useState<{ code: string }[]>([]);
  const [activePermissionsLoading, setActivePermissionsLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const isAdmin = profile?.role === 'Admin';

  async function loadData(showSpinner = true) {
    if (showSpinner) setLoading(true);
    setRefreshing(!showSpinner);
    setLoadError(null);
    try {
const [
  nextSummary,
  nextPending,
  nextActive,
  nextInactive,
  nextRejected,
  nextMines,
] = await Promise.all([
  getAdminSummary(),
  getPendingAdminUsers(),
  getActiveAdminUsers(),
  getAdminInactiveUsers(),
  getAdminRejectedUsers(),
  getAdminMines(),
]);
      setSummary(nextSummary);
      setPending(nextPending);
      setActive(nextActive);
      setInactive(nextInactive);
      setRejected(nextRejected);
      setMines(nextMines);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load User Management.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (isAdmin) void loadData();
  }, [isAdmin]);

  useEffect(() => {
    if (!selectedPending) {
      setPendingRole('');
      setPendingMineId('');
      return;
    }
    const requestedRole = roleIsValid(selectedPending.requested_role) ? selectedPending.requested_role : '';
    setPendingRole(requestedRole);
    setPendingMineId(selectedPending.requested_mine_id ?? '');
  }, [selectedPending]);

  useEffect(() => {
    let cancelled = false;
    if (!pendingRole) {
      setPendingPermissions([]);
      setPendingPermissionsLoading(false);
      return;
    }
    setPendingPermissionsLoading(true);
    void getRolePermissions(pendingRole)
      .then((items) => {
        if (!cancelled) setPendingPermissions(items);
      })
      .catch(() => {
        if (!cancelled) setPendingPermissions([]);
      })
      .finally(() => {
        if (!cancelled) setPendingPermissionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pendingRole]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedActive || !activeRole) {
      setActivePermissions([]);
      setActivePermissionsLoading(false);
      return;
    }
    setActivePermissionsLoading(true);
    void getRolePermissions(activeRole)
      .then((items) => {
        if (!cancelled) setActivePermissions(items);
      })
      .catch(() => {
        if (!cancelled) setActivePermissions([]);
      })
      .finally(() => {
        if (!cancelled) setActivePermissionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedActive, activeRole]);

  const filteredPending = useMemo(() => filterUsers(pending, search), [pending, search]);
  const filteredActive = useMemo(() => filterUsers(active, search), [active, search]);

  async function runAction(action: string, operation: () => Promise<unknown>, successMessage: string) {
    setBusyAction(action);
    setFeedback(null);
    try {
      await operation();
      setFeedback({ type: 'success', message: successMessage });
      setSelectedPending(null);
      setSelectedActive(null);
      await loadData(false);
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Action failed.' });
    } finally {
      setBusyAction(null);
    }
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="User Management" description="Administrative access is required." />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unauthorized</AlertTitle>
          <AlertDescription>This area is available only to users with the Admin role.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Review registration requests and manage authorized MineGuard users."
        action={
          <Button variant="outline" onClick={() => void loadData(false)} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {loadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to load user management</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}
      {feedback && (
        <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'}>
          {feedback.type === 'error' ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <AlertTitle>{feedback.type === 'error' ? 'Action failed' : 'Action completed'}</AlertTitle>
          <AlertDescription>{feedback.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard icon={UserPlus} label="Total Users" value={summary?.total_users ?? 0} />
        <SummaryCard icon={Clock3} label="Pending" value={summary?.pending_users ?? 0} />
        <SummaryCard icon={UserCheck} label="Active" value={summary?.active_users ?? 0} />
        <SummaryCard icon={UserMinus} label="Inactive" value={summary?.inactive_users ?? 0} />
        <SummaryCard icon={UserX} label="Rejected" value={summary?.rejected_users ?? 0} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, role, or mine…" className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="pending">Pending Requests ({pending.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({summary?.inactive_users ?? 0})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({summary?.rejected_users ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <PendingSection
            users={filteredPending}
            selected={selectedPending}
            role={pendingRole}
            mineId={pendingMineId}
            mines={mines}
            permissions={pendingPermissions}
            permissionsLoading={pendingPermissionsLoading}
            busyAction={busyAction}
            onSelect={setSelectedPending}
            onRoleChange={(value) => setPendingRole(value as AdminRole)}
            onMineChange={(value) => {
            setPendingMineId(value);
}}
            onApprove={() => {
              if (!selectedPending || !pendingRole || !pendingMineId || !!busyAction) return;
              void runAction(
                'approve',
                async () => {
                  const result = await approveAdminUser(selectedPending.user_id, pendingRole, pendingMineId);
                  if (!result.success) throw new Error('The backend did not confirm the approval.');
                  return result;
                },
                `${selectedPending.full_name ?? 'User'} has been approved and authorized.`,
              );
            }}
            onReject={() => {
              if (!selectedPending) return;
              void runAction('reject', () => rejectAdminUser(selectedPending.user_id), `${selectedPending.full_name ?? 'User'} registration request was rejected.`);
            }}
          />
        </TabsContent>

        <TabsContent value="active">
          <ActiveSection
            users={filteredActive}
            selected={selectedActive}
            role={activeRole}
            mineId={activeMineId}
            mines={mines}
            permissions={activePermissions}
            permissionsLoading={activePermissionsLoading}
            busyAction={busyAction}
            onSelect={(user) => {
              setSelectedActive(user);
              setActiveRole(roleIsValid(user.role) ? user.role : '');
              setActiveMineId(user.assigned_mine_id ?? '');
            }}
            onRoleChange={(value) => setActiveRole(value as AdminRole)}
            onMineChange={setActiveMineId}
            onSaveRole={() => {
              if (!selectedActive || !activeRole) return;
              void runAction('role', () => updateAdminUserRole(selectedActive.user_id, activeRole), 'User role updated.');
            }}
            onSaveMine={() => {
              if (!selectedActive || !activeMineId) return;
              void runAction('mine', () => updateAdminUserMine(selectedActive.user_id, activeMineId), 'User mine assignment updated.');
            }}
            onDeactivate={() => {
              if (!selectedActive) return;
              void runAction('deactivate', () => deactivateAdminUser(selectedActive.user_id), 'User account deactivated.');
            }}
          />
        </TabsContent>

        <TabsContent value="inactive">
  <Card>
    <CardContent className="p-6">
      {inactive.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No inactive users.
        </div>
      ) : (
        <div className="space-y-4">
          {inactive.map((user) => (
            <div
              key={user.user_id}
              className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">
                  {user.full_name ?? 'Unnamed user'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user.email ?? 'No email'}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span>Role: {user.role ?? 'Not assigned'}</span>
                  <span>•</span>
                  <span>Status: {user.status}</span>
                </div>
              </div>

              <Button
                onClick={() =>
                  void runAction(
                    `reactivate:${user.user_id}`,
                    () => reactivateAdminUser(user.user_id),
                    'User account reactivated.'
                  )
                }
                disabled={busyAction === `reactivate:${user.user_id}`}
              >
                {busyAction === `reactivate:${user.user_id}`
                  ? 'Reactivating...'
                  : 'Reactivate'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>
      <TabsContent value="rejected">
  <Card>
    <CardContent className="p-6">
      {rejected.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No rejected users.
        </div>
      ) : (
        <div className="space-y-4">
          {rejected.map((user) => (
            <div
              key={user.user_id}
              className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">
                  {user.full_name ?? 'Unnamed user'}
                </p>

                <p className="text-sm text-muted-foreground">
                  {user.email ?? 'No email'}
                </p>

                <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span>
                    Role: {user.role ?? 'Not assigned'}
                  </span>

                  <span>•</span>

                  <span>
                    Status: {user.status}
                  </span>

                  {user.assigned_mine_name && (
                    <>
                      <span>•</span>
                      <span>
                        Mine: {user.assigned_mine_code} — {user.assigned_mine_name}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>  
      </Tabs>
    </div>
  );
}

function filterUsers<T>(users: T[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return users;
  return users.filter((user) => Object.values(user as object).some((value) => String(value ?? '').toLowerCase().includes(q)));
}

function SummaryCard({ icon: Icon, label, value }: { icon: typeof UserPlus; label: string; value: number }) {
  return <Card><CardContent className="flex items-center gap-4 pt-6"><div className="rounded-lg bg-muted p-2.5"><Icon className="h-5 w-5" /></div><div><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-semibold tracking-tight">{value}</p></div></CardContent></Card>;
}

function PendingSection({ users, selected, role, mineId, mines, permissions, permissionsLoading, busyAction, onSelect, onRoleChange, onMineChange, onApprove, onReject }: {
  users: PendingAdminUser[]; selected: PendingAdminUser | null; role: AdminRole | ''; mineId: string; mines: AdminMine[]; permissions: { code: string }[]; permissionsLoading: boolean; busyAction: string | null; onSelect: (u: PendingAdminUser) => void; onRoleChange: (v: string) => void; onMineChange: (v: string) => void; onApprove: () => void; onReject: () => void;
}){
  return <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
    <Card><CardHeader><CardTitle>Registration Requests</CardTitle></CardHeader><CardContent className="space-y-3">
      {users.length === 0 ? <Empty text="No pending registration requests match your search." /> : users.map((user) => <button key={user.user_id} onClick={() => onSelect(user)} className={`w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/50 ${selected?.user_id === user.user_id ? 'border-primary bg-muted/40' : ''}`}>
        <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold">{initials(user.full_name)}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{user.full_name || 'Unnamed user'}</p><Badge variant="secondary">Pending</Badge></div><p className="truncate text-sm text-muted-foreground">{user.email || 'No email'}</p><p className="mt-1 text-xs text-muted-foreground">Requested: {user.requested_role || 'Not specified'} · {displayMine(user.requested_mine_code, user.requested_mine_name)}</p></div></div>
      </button>)}
    </CardContent></Card>

    <Card className="h-fit lg:sticky lg:top-6"><CardHeader><CardTitle>{selected ? 'Review Request' : 'Select a Request'}</CardTitle></CardHeader><CardContent>
      {!selected ? <Empty text="Select a pending registration to review its details and authorization." /> : <div className="space-y-5">
        <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-semibold">{initials(selected.full_name)}</div><div><p className="font-semibold">{selected.full_name || 'Unnamed user'}</p><p className="text-sm text-muted-foreground">{selected.email || 'No email'}</p></div></div>
        <div className="grid gap-3 text-sm"><InfoRow label="Organization" value={selected.organization || '—'} /><InfoRow label="Signup source" value={selected.signup_source || '—'} /><InfoRow label="Requested role" value={selected.requested_role || '—'} /><InfoRow label="Requested mine" value={displayMine(selected.requested_mine_code, selected.requested_mine_name)} /><InfoRow label="Access reason" value={selected.access_reason || '—'} /></div>
        <Separator />
        <div className="space-y-3"><div><Label>Final role</Label><Select value={role} onValueChange={onRoleChange}><SelectTrigger className="mt-1"><SelectValue placeholder="Select role" /></SelectTrigger><SelectContent>{ADMIN_ROLES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><div><Label>Authorized mine</Label><Select
  value={mineId}
  onValueChange={(value) => {
  onMineChange(value);
  }}
><SelectTrigger className="mt-1"><SelectValue placeholder="Select mine" /></SelectTrigger><SelectContent>{mines.map((mine) => <SelectItem key={mine.id} value={mine.id}>{mine.mine_code} — {mine.mine_name}</SelectItem>)}</SelectContent></Select></div></div>
        <div className="rounded-lg border bg-muted/30 p-3"><div className="mb-2 flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4" />Effective permissions</div>{permissionsLoading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading role permissions…</div> : permissions.length === 0 ? <p className="text-sm text-muted-foreground">No permissions are currently assigned to this role.</p> : <div className="grid gap-1.5 sm:grid-cols-2">{permissions.map((permission) => <div key={permission.code} className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 shrink-0" />{formatPermission(permission.code)}</div>)}</div>}</div>
        <div className="flex flex-col gap-2 sm:flex-row"><Button className="flex-1" disabled={!role || !mineId || !!busyAction} onClick={onApprove}>{busyAction === 'approve' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}Approve & Authorize</Button><Button variant="destructive" disabled={!!busyAction} onClick={onReject}>{busyAction === 'reject' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}Reject</Button></div>
      </div>}
    </CardContent></Card>
  </div>;
}

function ActiveSection({ users, selected, role, mineId, mines, permissions, permissionsLoading, busyAction, onSelect, onRoleChange, onMineChange, onSaveRole, onSaveMine, onDeactivate }: {
  users: ActiveAdminUser[];
  selected: ActiveAdminUser | null;
  role: AdminRole | '';
  mineId: string;
  mines: AdminMine[];
  permissions: { code: string }[];
  permissionsLoading: boolean;
  busyAction: string | null;
  onSelect: (u: ActiveAdminUser) => void;
  onRoleChange: (v: string) => void;
  onMineChange: (v: string) => void;
  onSaveRole: () => void;
  onSaveMine: () => void;
  onDeactivate: () => void;
}) {
  return <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]"><Card><CardHeader><CardTitle>Active Users</CardTitle></CardHeader><CardContent className="space-y-3">{users.length === 0 ? <Empty text="No active users match your search." /> : users.map((user) => <button key={user.user_id} onClick={() => onSelect(user)} className={`w-full rounded-lg border p-4 text-left hover:bg-muted/50 ${selected?.user_id === user.user_id ? 'border-primary bg-muted/40' : ''}`}><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold">{initials(user.full_name)}</div><div className="min-w-0 flex-1"><p className="font-medium">{user.full_name || 'Unnamed user'}</p><p className="truncate text-sm text-muted-foreground">{user.email || 'No email'}</p><p className="text-xs text-muted-foreground">{user.role || 'No role'} · {displayMine(user.assigned_mine_code, user.assigned_mine_name)}</p></div><Badge>Active</Badge></div></button>)}</CardContent></Card>
    <Card className="h-fit lg:sticky lg:top-6"><CardHeader><CardTitle>{selected ? 'Manage User' : 'Select a User'}</CardTitle></CardHeader><CardContent>{!selected ? <Empty text="Select an active user to change role, change mine, or deactivate." /> : <div className="space-y-4"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 font-semibold">{initials(selected.full_name)}</div><div><p className="font-semibold">{selected.full_name || 'Unnamed user'}</p><p className="text-sm text-muted-foreground">{selected.email || 'No email'}</p></div></div><div><Label>Role</Label><div className="mt-1 flex gap-2"><Select value={role} onValueChange={onRoleChange}><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger><SelectContent>{ADMIN_ROLES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><Button variant="outline" disabled={!role || !!busyAction} onClick={onSaveRole}>Save</Button></div></div><div><Label>Mine assignment</Label><div className="mt-1 flex gap-2"><Select value={mineId} onValueChange={onMineChange}><SelectTrigger><SelectValue placeholder="Select mine" /></SelectTrigger><SelectContent>{mines.map((mine) => <SelectItem key={mine.id} value={mine.id}>{mine.mine_code} — {mine.mine_name}</SelectItem>)}</SelectContent></Select><Button variant="outline" disabled={!mineId || !!busyAction} onClick={onSaveMine}>Save</Button></div></div><Separator /><div className="rounded-lg border bg-muted/30 p-3"><div className="mb-2 flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4" />Effective permissions</div>{permissionsLoading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading role permissions…</div> : permissions.length === 0 ? <p className="text-sm text-muted-foreground">No permissions are currently assigned to this role.</p> : <div className="grid gap-1.5 sm:grid-cols-2">{permissions.map((permission) => <div key={permission.code} className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 shrink-0" />{formatPermission(permission.code)}</div>)}</div>}</div><Button variant="destructive" className="w-full" disabled={!!busyAction} onClick={onDeactivate}>{busyAction === 'deactivate' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserMinus className="mr-2 h-4 w-4" />}Deactivate User</Button></div>}</CardContent></Card></div>;
}

function UnavailableStatusSection({ status, count, action }: { status: string; count: number; action: string }) {
  return <Card><CardContent className="py-12 text-center"><Eye className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-medium">{status} users: {count}</p><p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">The current backend exposes the {action} mutation and the summary count, but it does not expose a read RPC for the {status.toLowerCase()} user list. This interface does not bypass that contract by querying protected tables directly.</p></CardContent></Card>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-0.5 break-words">{value}</p></div>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">{text}</div>;
}
