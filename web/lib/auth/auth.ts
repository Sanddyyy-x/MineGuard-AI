import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase-client';
import type { Profile } from '@/lib/auth/types';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, full_name, email, role, organization, status, created_at, updated_at'
    )
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;

  return data as Profile | null;
}

export async function getAuthenticatedProfile(user: User): Promise<Profile> {
  const profile = await getProfile(user.id);

  if (!profile) {
    throw new Error(
      'Your account does not have a MineGuard profile. Contact an administrator.'
    );
  }

  if (profile.status !== 'Active') {
    throw new Error(
      'Your MineGuard profile is not active. Contact an administrator.'
    );
  }

  return profile;
}

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}
