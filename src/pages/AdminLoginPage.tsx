import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Building2, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

/**
 * Dedicated admin sign-in form.
 *
 * Admin access is granted by the user_profiles row in Supabase. The browser
 * never receives or stores an admin password, and no role is accepted from
 * the client during sign-in.
 */
export function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signInError || !data.user) {
      setError(signInError?.message || 'Unable to sign in. Please try again.');
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, status')
      .eq('id', data.user.id)
      .maybeSingle();

    const isActiveAdmin =
      profile?.role === 'admin' &&
      profile.status?.trim().toLowerCase() === 'active';

    if (profileError || !profile || !isActiveAdmin) {
      await supabase.auth.signOut();
      setError('Admin access required.');
      setLoading(false);
      return;
    }

    // App.tsx derives the dashboard from the authenticated profile; no
    // hard-coded /admin route or credential is needed here.
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-brand-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl mb-4 shadow-lg shadow-brand-600/20">
            <Building2 className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">MediCare Admin</h1>
          <p className="text-sm text-slate-500 mt-1">Administrator sign in</p>
        </div>

        <div className="card p-8 shadow-xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label" htmlFor="admin-email">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-email"
                  type="email"
                  className="input pl-10"
                  placeholder="admin@medicare.com"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="admin-password">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 rounded-lg p-3">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? 'Logging in...' : 'Admin Login'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Admin accounts are provisioned securely through Supabase.
        </p>
      </div>
    </div>
  );
}
