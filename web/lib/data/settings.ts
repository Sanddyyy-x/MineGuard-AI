import { supabase } from '@/lib/supabase-client';

export type SettingsProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  organization: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type SettingsPermission = {
  code: string;
};

export type SettingsMineAssignment = {
  mineId: string;
  mineCode: string;
  mineName: string;
  status: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function getSettingsProfile(userId: string): Promise<SettingsProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, organization, status, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to load your profile.'));
  }

  return data as SettingsProfile;
}

export async function getSettingsPermissions(role: string | null): Promise<SettingsPermission[]> {
  if (!role) return [];

  const { data, error } = await supabase
    .from('role_permissions')
    .select('permission_id, permissions(permission_code)')
    .eq('role', role);

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to load your permissions.'));
  }

  return ((data ?? []) as Array<{
    permission_id: string;
    permissions: { permission_code: string } | { permission_code: string }[] | null;
  }>)
    .map((row) => {
      const permission = Array.isArray(row.permissions) ? row.permissions[0] : row.permissions;
      return permission?.permission_code ? { code: permission.permission_code } : null;
    })
    .filter((permission): permission is SettingsPermission => permission !== null)
    .sort((a, b) => a.code.localeCompare(b.code));
}

export async function getSettingsMineAssignments(userId: string): Promise<SettingsMineAssignment[]> {
  const { data, error } = await supabase
    .from('mine_user_assignments')
    .select('mine_id, status')
    .eq('user_id', userId)
    .order('assigned_at', { ascending: false });

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to load your mine assignments.'));
  }

  const assignments = (data ?? []) as Array<{ mine_id: string; status: string | null }>;
  if (assignments.length === 0) return [];

  const mineIds = assignments.map((assignment) => assignment.mine_id);
  const { data: mines, error: minesError } = await supabase
    .from('mines')
    .select('id, mine_code, mine_name')
    .in('id', mineIds);

  if (minesError) {
    throw new Error(getErrorMessage(minesError, 'Unable to load your assigned mines.'));
  }

  const mineById = new Map(
    ((mines ?? []) as Array<{ id: string; mine_code: string; mine_name: string }>).map((mine) => [
      mine.id,
      mine,
    ])
  );

  return assignments
    .map((assignment) => {
      const mine = mineById.get(assignment.mine_id);
      if (!mine) return null;
      return {
        mineId: mine.id,
        mineCode: mine.mine_code,
        mineName: mine.mine_name,
        status: assignment.status ?? 'Unknown',
      };
    })
    .filter((assignment): assignment is SettingsMineAssignment => assignment !== null);
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    throw new Error(getErrorMessage(error, 'Unable to update your password.'));
  }
}
