'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';

import {
  getAuthenticatedProfile,
  signOut as signOutUser,
} from '@/lib/auth/auth';
import { isSupabaseConfigured, supabase } from '@/lib/supabase-client';
import type { Profile } from '@/lib/auth/types';

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadProfile(nextSession: Session | null) {
    if (!nextSession?.user) {
      setProfile(null);
      setError(null);
      return;
    }

    try {
      setError(null);
      const nextProfile = await getAuthenticatedProfile(nextSession.user);
      setProfile(nextProfile);
    } catch (err) {
      setProfile(null);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load your MineGuard profile.'
      );
    }
  }

  async function refreshProfile() {
    if (!session?.user) return;

    try {
      setError(null);
      const nextProfile = await getAuthenticatedProfile(session.user);
      setProfile(nextProfile);
    } catch (err) {
      setProfile(null);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load your MineGuard profile.'
      );
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setError(
        'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to web/.env.local.'
      );
      return;
    }

    let mounted = true;

    async function initialize() {
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (!mounted) return;

      if (sessionError) {
        setError(sessionError.message);
        setSession(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setSession(data.session);
      await loadProfile(data.session);

      if (mounted) setLoading(false);
    }

    void initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession);

      // Avoid awaiting a Supabase request directly inside the auth callback.
      setTimeout(() => {
        if (!mounted) return;

        void loadProfile(nextSession).finally(() => {
          if (mounted) setLoading(false);
        });
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      error,
      signOut: signOutUser,
      refreshProfile,
    }),
    [session, profile, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
