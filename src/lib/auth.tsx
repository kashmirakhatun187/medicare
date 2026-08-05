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
  signUp: (email: string, password: string, fullName: string, role: UserRole, phone?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadProfile(session.user.id, session.user.email || '');
      } else {
        setLoading(false);
      }
    });

    supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'SIGNED_IN' && session) {
          await loadProfile(session.user.id, session.user.email || '');
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        }
      })();
    });
  }, []);

  async function loadProfile(userId: string, email: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      // Profile doesn't exist yet — auto-create a basic one so the user isn't stuck.
      // This handles the race condition where signUp creates the auth user but the
      // profile insert hasn't completed (or failed) before onAuthStateChange fires.
      const { data: created } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email,
          full_name: email.split('@')[0],
          role: 'patient',
          status: 'Active',
        })
        .select('*')
        .maybeSingle();

      if (created) {
        setUser(created as UserProfile);
      }
      setLoading(false);
      return;
    }
    setUser(data as UserProfile);
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  }

  async function signUp(email: string, password: string, fullName: string, role: UserRole, phone?: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };

    if (data.user) {
      const { error: profileError } = await supabase.from('user_profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        role,
        phone: phone || null,
        status: role === 'patient' ? 'Active' : 'Pending',
      });
      if (profileError) {
        // Don't return error here — the auth account was created successfully.
        // loadProfile will auto-create a fallback profile on sign-in.
      }
    }
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
