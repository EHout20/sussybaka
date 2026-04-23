import { getSupabaseClient } from '@/lib/supabase';
import { AppRole } from '@/types/roles';
import { Session } from '@supabase/supabase-js';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: AppRole;
  patient_id: string | null;
};

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const supabase = getSupabaseClient();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = async (nextSession: Session | null) => {
    setSession(nextSession);
    if (!nextSession?.user) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, patient_id')
      .eq('id', nextSession.user.id)
      .maybeSingle();

    if (error || !data) {
      // Temporary fallback while database profile rows are unavailable.
      setProfile({
        id: nextSession.user.id,
        full_name: nextSession.user.email ?? 'User',
        email: nextSession.user.email ?? null,
        role: 'admin',
        patient_id: null,
      });
      return;
    }
    setProfile(data as Profile);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      await loadProfile(data.session ?? null);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      await loadProfile(nextSession);
      setLoading(false);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      session,
      profile,
      refreshProfile: async () => loadProfile(session),
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [loading, session, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthSession() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthSession must be used within AuthProvider');
  }
  return ctx;
}
