import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export type UserRole = 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'pharmacist' | 'lab_tech' | 'accountant' | 'patient';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department: string | null;
  phone: string | null;
  status: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isActive(profile: UserProfile) {
  return profile.status.trim().toLowerCase() === 'active';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (session) {
        await loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }

    void restoreSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' && session) {
        void loadProfile(session.user.id);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function loadProfile(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, role, department, phone, status')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      setUser(null);
      setLoading(false);
      return 'Unable to load your profile. Please try again.';
    }

    if (!data) {
      setUser(null);
      setLoading(false);
      return 'Your account profile has not been provisioned yet. Please contact an administrator.';
    }

    const profile = data as UserProfile;
    if (!isActive(profile)) {
      setUser(null);
      setLoading(false);
      return 'Your account is inactive. Please contact an administrator.';
    }

    setUser(profile);
    setLoading(false);
    return null;
  }

  async function signIn(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) return { error: error.message };
    if (!data.user) return { error: 'Unable to sign in. Please try again.' };

    const profileError = await loadProfile(data.user.id);
    if (profileError) {
      await supabase.auth.signOut();
      return { error: profileError };
    }

    return { error: null };
  }

  async function signUp(email: string, password: string, fullName: string, phone?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone?.trim() || null,
        },
      },
    });

    if (error) return { error: error.message };

    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
