import { supabase } from '@/lib/supabase-client';

export const ADMIN_ROLES = [
  'Admin',
  'Subsidiary Admin',
  'Mine Manager',
  'Inspector',
  'Safety Officer',
  'Contractor/Worker',
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export type PendingAdminUser = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  status: string | null;
  signup_source: string | null;
  organization: string | null;
  requested_role: string | null;
  requested_mine: string | null;
  access_reason: string | null;
  requested_mine_id: string | null;
  requested_mine_code: string | null;
  requested_mine_name: string | null;
  created_at: string;
  assigned_mine_id: string | null;
  assigned_mine_code: string | null;
  assigned_mine_name: string | null;
};

export type ActiveAdminUser = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  status: string | null;
  assigned_mine_id: string | null;
  assigned_mine_code: string | null;
  assigned_mine_name: string | null;
  assigned_at: string | null;
  created_at: string;
};

export type AdminMine = {
  id: string;
  mine_code: string;
  mine_name: string;
};

export type InactiveAdminUser = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  status: string;
  created_at: string;
  assigned_mine_id: string | null;
  assigned_mine_code: string | null;
  assigned_mine_name: string | null;
  assigned_at: string | null;
};

export type AdminSummary = {
  total_users: number;
  pending_users: number;
  active_users: number;
  inactive_users: number;
  rejected_users: number;
  users_by_role: Record<string, number>;
};

export type AdminPermission = { code: string };

export type ApproveAdminUserResult = {
  success: boolean;
  user_id: string;
  email: string | null;
  role: string;
  status: string;
  mine_id: string;
  mine_code: string;
  mine_name: string;
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function unwrapRpcData<T>(data: T | T[] | null): T | null {
  if (Array.isArray(data)) return data[0] ?? null;
  return data;
}

export async function getPendingAdminUsers(): Promise<PendingAdminUser[]> {
  const { data, error } = await supabase.rpc('get_pending_mineguard_users');
  if (error) throw new Error(errorMessage(error, 'Unable to load pending user requests.'));
  return (data ?? []) as PendingAdminUser[];
}

export async function getAdminInactiveUsers(): Promise<InactiveAdminUser[]> {
  const { data, error } = await supabase.rpc('get_admin_inactive_users');

  if (error) {
    throw new Error(
      errorMessage(error, 'Unable to load inactive users.')
    );
  }

  return (data ?? []) as InactiveAdminUser[];
}

export async function getAdminRejectedUsers(): Promise<InactiveAdminUser[]> {
  const { data, error } = await supabase.rpc('get_admin_rejected_users');

  if (error) {
    throw new Error(
      errorMessage(error, 'Unable to load rejected users.')
    );
  }

  return (data ?? []) as InactiveAdminUser[];
}

export async function getActiveAdminUsers(): Promise<ActiveAdminUser[]> {
  const { data, error } = await supabase.rpc('get_admin_active_users');
  if (error) throw new Error(errorMessage(error, 'Unable to load active users.'));
  return (data ?? []) as ActiveAdminUser[];
}

export async function getAdminMines(): Promise<AdminMine[]> {
  const { data, error } = await supabase.rpc('get_admin_mine_list');

  if (error) {
    throw new Error(errorMessage(error, 'Unable to load mines.'));
  }

 return (data ?? []).map((mine: { mine_id: string; mine_code: string; mine_name: string }) => ({
  id: mine.mine_id,
  mine_code: mine.mine_code,
  mine_name: mine.mine_name,
}));
}

export async function getAdminSummary(): Promise<AdminSummary> {
  const { data, error } = await supabase.rpc('get_admin_user_management_summary');
  if (error) throw new Error(errorMessage(error, 'Unable to load user-management summary.'));
  return (
    unwrapRpcData(data as AdminSummary | AdminSummary[] | null) ?? {
      total_users: 0,
      pending_users: 0,
      active_users: 0,
      inactive_users: 0,
      rejected_users: 0,
      users_by_role: {},
    }
  );
}

export async function getRolePermissions(role: string | null): Promise<AdminPermission[]> {
  if (!role) return [];

  const { data: roleRows, error: roleError } = await supabase
    .from('role_permissions')
    .select('permission_id')
    .eq('role', role);

  if (roleError) throw new Error(errorMessage(roleError, 'Unable to load role permissions.'));

  const permissionIds = Array.from(
    new Set(
      ((roleRows ?? []) as Array<{ permission_id: string | null }>)
        .map((row) => row.permission_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  if (permissionIds.length === 0) return [];

  const { data: permissionRows, error: permissionError } = await supabase
    .from('permissions')
    .select('id, permission_code')
    .in('id', permissionIds);

  if (permissionError) throw new Error(errorMessage(permissionError, 'Unable to load permission details.'));

  return ((permissionRows ?? []) as Array<{ id: string; permission_code: string | null }>)
    .filter((row) => Boolean(row.permission_code))
    .map((row) => ({ code: row.permission_code as string }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

async function callMutation(functionName: string, args: Record<string, unknown>) {
  const { data, error } = await supabase.rpc(functionName, args);
  if (error) throw new Error(errorMessage(error, 'The requested user-management action failed.'));
  return data;
}

export async function approveAdminUser(
  userId: string,
  role: AdminRole,
  mineId: string,
): Promise<ApproveAdminUserResult> {
  const result = await callMutation('approve_mineguard_user', {
    requested_user_id: userId,
    requested_role: role,
    requested_mine_id: mineId,
  });
  const normalized = unwrapRpcData(result as ApproveAdminUserResult | ApproveAdminUserResult[] | null);
  if (!normalized || normalized.success !== true) {
    throw new Error('The backend did not confirm the user approval.');
  }
  return normalized;
}

export function rejectAdminUser(userId: string) {
  return callMutation('reject_mineguard_user', { requested_user_id: userId });
}

export function updateAdminUserRole(userId: string, role: AdminRole) {
  return callMutation('update_mineguard_user_role', {
    requested_user_id: userId,
    requested_role: role,
  });
}

export function updateAdminUserMine(userId: string, mineId: string) {
  return callMutation('update_mineguard_user_mine', {
    requested_user_id: userId,
    requested_mine_id: mineId,
  });
}

export function deactivateAdminUser(userId: string) {
  return callMutation('deactivate_mineguard_user', { requested_user_id: userId });
}

export function reactivateAdminUser(userId: string) {
  return callMutation('reactivate_mineguard_user', { requested_user_id: userId });
}
