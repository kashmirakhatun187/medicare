import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth, type UserRole } from '@/lib/auth';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/roles';
import { PageHeader, LoadingSpinner, StatusBadge, EmptyState, Avatar } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { UserCog, Search, UserPlus, X, AlertCircle } from 'lucide-react';

interface UserAccount {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department: string | null;
  phone: string | null;
  status: string;
  created_at: string;
}

export function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false });
    setUsers((data as UserAccount[]) || []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('user_profiles').update({ status }).eq('id', id);
    load();
  }

  async function updateRole(id: string, role: UserRole) {
    await supabase.from('user_profiles').update({ role }).eq('id', id);
    load();
  }

  const filtered = users.filter((u) => {
    const matchesSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === 'All' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="User Management"
        subtitle="Manage user accounts, roles, and access permissions"
        action={
          <button onClick={() => setShowCreateForm(true)} className="btn-primary">
            <UserPlus size={18} /> Create Staff Account
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users', value: users.length, color: 'brand' },
          { label: 'Active', value: users.filter((u) => u.status === 'Active').length, color: 'emerald' },
          { label: 'Pending', value: users.filter((u) => u.status === 'Pending').length, color: 'amber' },
          { label: 'Patients', value: users.filter((u) => u.role === 'patient').length, color: 'blue' },
        ].map((s) => (
          <div key={s.label} className="card-hover p-5">
            <p className="text-sm text-slate-500 font-medium">{s.label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-40" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option>All</option>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="table-header">User</th>
                <th className="table-header">Email</th>
                <th className="table-header">Role</th>
                <th className="table-header">Department</th>
                <th className="table-header">Phone</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <Avatar name={u.full_name} size="sm" />
                      <span className="font-medium text-slate-700">{u.full_name}</span>
                      {u.id === currentUser?.id && <span className="text-xs text-brand-600 font-medium">(You)</span>}
                    </div>
                  </td>
                  <td className="table-cell text-sm text-slate-500">{u.email}</td>
                  <td className="table-cell">
                    <select
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value as UserRole)}
                      className={`text-xs font-medium px-2 py-1 rounded-lg border-0 cursor-pointer ${ROLE_COLORS[u.role]}`}
                      disabled={u.id === currentUser?.id}
                    >
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="table-cell text-sm">{u.department || '-'}</td>
                  <td className="table-cell text-sm">{u.phone || '-'}</td>
                  <td className="table-cell"><StatusBadge status={u.status} /></td>
                  <td className="table-cell">
                    {u.id !== currentUser?.id && (
                      <div className="flex gap-1">
                        {u.status === 'Pending' && (
                          <button onClick={() => updateStatus(u.id, 'Active')} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded hover:bg-emerald-50">Approve</button>
                        )}
                        {u.status === 'Active' && (
                          <button onClick={() => updateStatus(u.id, 'Suspended')} className="text-xs font-medium text-rose-600 hover:text-rose-700 px-2 py-1 rounded hover:bg-rose-50">Suspend</button>
                        )}
                        {u.status === 'Suspended' && (
                          <button onClick={() => updateStatus(u.id, 'Active')} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded hover:bg-emerald-50">Reactivate</button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState message="No users found" />}
        </div>
      </div>

      {showCreateForm && <CreateStaffForm onClose={() => setShowCreateForm(false)} onCreated={load} />}
    </div>
  );
}

function CreateStaffForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('doctor');
  const [department, setDepartment] = useState('General Medicine');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const departments = [
    'General Medicine', 'General Surgery', 'Orthopedics', 'Gynecology & Obstetrics',
    'Pediatrics', 'ENT', 'Cardiology', 'Neurology', 'Urology', 'Dermatology',
    'Ophthalmology', 'Psychiatry', 'Pharmacy', 'Laboratory', 'Administration',
    'Front Office', 'Finance', 'ICU/CCU',
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Use the Supabase admin API to create the user (via service role key in .env)
    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.msg || errData.message || 'Failed to create user');
      }

      const userData = await res.json();

      // Insert profile
      const { error: profileError } = await supabase.from('user_profiles').insert({
        id: userData.id,
        email,
        full_name: fullName,
        role,
        department,
        phone: phone || null,
        status: 'Active',
      });

      if (profileError) throw new Error(profileError.message);

      setLoading(false);
      onClose();
      onCreated();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800 text-lg">Create Staff Account</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" placeholder="Dr. John Smith" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="staff@medicare.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" placeholder="Set a password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'patient').map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Department</label>
            <select className="input" value={department} onChange={(e) => setDepartment(e.target.value)}>
              {departments.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 rounded-lg p-3">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
