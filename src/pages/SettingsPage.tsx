import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { ROLE_LABELS } from '@/lib/roles';
import { PageHeader, LoadingSpinner } from '@/components/ui';
import { Building2, ShieldCheck, Database, KeyRound, Mail, Phone, MapPin, AlertCircle } from 'lucide-react';

interface SystemStats {
  users: number;
  patients: number;
  staff: number;
  beds: number;
  tables: number;
}

const EMPTY_STATS: SystemStats = { users: 0, patients: 0, staff: 0, beds: 0, tables: 25 };

export function SettingsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SystemStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      const results = await Promise.all([
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('patients').select('id', { count: 'exact', head: true }),
        supabase.from('staff').select('id', { count: 'exact', head: true }),
        supabase.from('beds').select('id', { count: 'exact', head: true }),
      ]);

      if (!mounted) return;

      const failed = results.find((result) => result.error)?.error;
      if (failed) {
        setError('Unable to load system statistics. Please try again.');
        setLoading(false);
        return;
      }

      setStats({
        users: results[0].count || 0,
        patients: results[1].count || 0,
        staff: results[2].count || 0,
        beds: results[3].count || 0,
        tables: 25,
      });
      setLoading(false);
    }

    void load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Settings" subtitle="System configuration and facility information" />

      {error && (
        <div role="alert" className="mb-6 flex items-center gap-2 text-sm text-rose-600 bg-rose-50 rounded-lg p-3">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center"><Building2 className="text-brand-600" size={20} /></div><h3 className="font-semibold text-slate-800">Facility Information</h3></div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm"><Building2 size={16} className="text-slate-400" /><span className="text-slate-500">Name:</span><span className="font-medium text-slate-700">MediCare Nursing Home</span></div>
            <div className="flex items-center gap-3 text-sm"><MapPin size={16} className="text-slate-400" /><span className="text-slate-500">Address:</span><span className="font-medium text-slate-700">123 Health Street, Pune, Maharashtra</span></div>
            <div className="flex items-center gap-3 text-sm"><Phone size={16} className="text-slate-400" /><span className="text-slate-500">Phone:</span><span className="font-medium text-slate-700">+91 98765 43210</span></div>
            <div className="flex items-center gap-3 text-sm"><Mail size={16} className="text-slate-400" /><span className="text-slate-500">Email:</span><span className="font-medium text-slate-700">care@medicare.com</span></div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><KeyRound className="text-blue-600" size={20} /></div><h3 className="font-semibold text-slate-800">Your Account</h3></div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Name</span><span className="font-medium text-slate-700">{user?.full_name || '-'}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Email</span><span className="font-medium text-slate-700">{user?.email || '-'}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Role</span><span className="font-medium text-slate-700">{user ? ROLE_LABELS[user.role] : '-'}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Department</span><span className="font-medium text-slate-700">{user?.department || '-'}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Status</span><span className="badge-green">{user?.status || '-'}</span></div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center"><Database className="text-emerald-600" size={20} /></div><h3 className="font-semibold text-slate-800">System Statistics</h3></div>
          <div className="form-grid">
            <div className="bg-slate-50 rounded-xl p-4"><p className="text-2xl font-bold text-slate-800">{stats.users}</p><p className="text-xs text-slate-500">Registered Users</p></div>
            <div className="bg-slate-50 rounded-xl p-4"><p className="text-2xl font-bold text-slate-800">{stats.patients}</p><p className="text-xs text-slate-500">Patient Records</p></div>
            <div className="bg-slate-50 rounded-xl p-4"><p className="text-2xl font-bold text-slate-800">{stats.staff}</p><p className="text-xs text-slate-500">Staff Members</p></div>
            <div className="bg-slate-50 rounded-xl p-4"><p className="text-2xl font-bold text-slate-800">{stats.beds}</p><p className="text-xs text-slate-500">Beds</p></div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center"><ShieldCheck className="text-rose-600" size={20} /></div><h3 className="font-semibold text-slate-800">Security & Access</h3></div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Authentication</span><span className="badge-green">Email/Password</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Row Level Security</span><span className="badge-green">Enabled</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Role-Based Access</span><span className="badge-green">Active</span></div>
            <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Database Tables</span><span className="font-medium text-slate-700">{stats.tables}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
