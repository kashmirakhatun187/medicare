import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { ROLE_LABELS } from '@/lib/roles';
import { PageHeader, LoadingSpinner } from '@/components/ui';
import { Building2, ShieldCheck, Database, Bell, Users, Server, KeyRound, Mail, Phone, MapPin } from 'lucide-react';

export function SettingsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ users: 0, patients: 0, staff: 0, beds: 0, tables: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [users, patients, staff, beds] = await Promise.all([
        supabase.from('user_profiles').select('id', { count: 'exact' }),
        supabase.from('patients').select('id', { count: 'exact' }),
        supabase.from('staff').select('id', { count: 'exact' }),
        supabase.from('beds').select('id', { count: 'exact' }),
      ]);
      setStats({
        users: users.count || 0,
        patients: patients.count || 0,
        staff: staff.count || 0,
        beds: beds.count || 0,
        tables: 25,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Settings" subtitle="System configuration and facility information" />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Facility Information */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
              <Building2 className="text-brand-600" size={20} />
            </div>
            <h3 className="font-semibold text-slate-800">Facility Information</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Building2 size={16} className="text-slate-400" />
              <span className="text-slate-500">Name:</span>
              <span className="font-medium text-slate-700">MediCare Nursing Home</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin size={16} className="text-slate-400" />
              <span className="text-slate-500">Address:</span>
              <span className="font-medium text-slate-700">123 Health Street, Pune, Maharashtra</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone size={16} className="text-slate-400" />
              <span className="text-slate-500">Phone:</span>
              <span className="font-medium text-slate-700">+91 98765 43210</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail size={16} className="text-slate-400" />
              <span className="text-slate-500">Email:</span>
              <span className="font-medium text-slate-700">care@medicare.com</span>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <KeyRound className="text-blue-600" size={20} />
            </div>
            <h3 className="font-semibold text-slate-800">Your Account</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Name</span>
              <span className="font-medium text-slate-700">{user?.full_name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Email</span>
              <span className="font-medium text-slate-700">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Role</span>
              <span className="font-medium text-slate-700">{user ? ROLE_LABELS[user.role] : '-'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Department</span>
              <span className="font-medium text-slate-700">{user?.department || '-'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Status</span>
              <span className="badge-green">{user?.status}</span>
            </div>
          </div>
        </div>

        {/* System Statistics */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Database className="text-emerald-600" size={20} />
            </div>
            <h3 className="font-semibold text-slate-800">System Statistics</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-slate-800">{stats.users}</p>
              <p className="text-xs text-slate-500">Registered Users</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-slate-800">{stats.patients}</p>
              <p className="text-xs text-slate-500">Patient Records</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-slate-800">{stats.staff}</p>
              <p className="text-xs text-slate-500">Staff Members</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-slate-800">{stats.beds}</p>
              <p className="text-xs text-slate-500">Beds</p>
            </div>
          </div>
        </div>

        {/* Security & Access */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
              <ShieldCheck className="text-rose-600" size={20} />
            </div>
            <h3 className="font-semibold text-slate-800">Security & Access</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Authentication</span>
              <span className="badge-green">Email/Password</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Row Level Security</span>
              <span className="badge-green">Enabled</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Role-Based Access</span>
              <span className="badge-green">Active</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Database Tables</span>
              <span className="font-medium text-slate-700">{stats.tables}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
