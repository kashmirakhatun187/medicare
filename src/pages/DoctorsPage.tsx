import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Staff } from '@/lib/types';
import { PageHeader, LoadingSpinner, Avatar, StatusBadge } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { formatCurrency } from '@/lib/utils';
import { Stethoscope, HeartPulse, UserPlus, Phone, Mail, BadgeCheck } from 'lucide-react';

export function DoctorsPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('All');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadStaff();
  }, []);

  async function loadStaff() {
    setLoading(true);
    const { data } = await supabase.from('staff').select('*').order('name');
    setStaff(data || []);
    setLoading(false);
  }

  async function addStaff(form: any) {
    await supabase.from('staff').insert(form);
    setShowModal(false);
    loadStaff();
  }

  const filtered = staff.filter((s) => filterRole === 'All' || s.role === filterRole);
  const doctors = staff.filter((s) => s.role === 'Doctor');
  const nurses = staff.filter((s) => s.role === 'Nurse');

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Doctor & Staff Management"
        subtitle={`${doctors.length} doctors · ${nurses.length} nurses · ${staff.length} total staff`}
        action={
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <UserPlus size={18} />
            Add Staff
          </button>
        }
      />

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {['All', 'Doctor', 'Nurse', 'Technician'].map((r) => (
          <button
            key={r}
            onClick={() => setFilterRole(r)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filterRole === r ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {r === 'All' ? 'All Staff' : r + 's'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <div key={s.id} className="card-hover p-5">
            <div className="flex items-start gap-3">
              <Avatar name={s.name} size="lg" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 truncate">{s.name}</h3>
                <p className="text-sm text-slate-500">{s.specialization || s.role}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`badge ${s.role === 'Doctor' ? 'badge-teal' : s.role === 'Nurse' ? 'badge-amber' : 'badge-blue'}`}>
                    {s.role}
                  </span>
                  <StatusBadge status={s.status} />
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-1.5 text-sm text-slate-600">
              {s.department && <p className="flex items-center gap-2"><Stethoscope size={14} className="text-slate-400" /> {s.department}</p>}
              {s.phone && <p className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {s.phone}</p>}
              {s.email && <p className="flex items-center gap-2 truncate"><Mail size={14} className="text-slate-400" /> {s.email}</p>}
              {s.qualification && <p className="flex items-center gap-2"><BadgeCheck size={14} className="text-slate-400" /> {s.qualification}</p>}
            </div>
            {s.role === 'Doctor' && s.consultation_fee > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">Consultation Fee</span>
                <span className="font-semibold text-slate-700">{formatCurrency(s.consultation_fee)}</span>
              </div>
            )}
            {s.role === 'Doctor' && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">Shift</span>
                <span className="text-sm font-medium text-slate-600">{s.shift}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && <StaffFormModal onClose={() => setShowModal(false)} onSubmit={addStaff} />}
    </div>
  );
}

function StaffFormModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (form: any) => void }) {
  const [form, setForm] = useState({
    name: '',
    role: 'Doctor',
    department: 'General Medicine',
    specialization: '',
    phone: '',
    email: '',
    qualification: '',
    shift: 'Morning',
    status: 'Active',
    consultation_fee: '0',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, consultation_fee: parseFloat(form.consultation_fee) || 0 });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Add Staff Member" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Name *</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option>Doctor</option>
              <option>Nurse</option>
              <option>Technician</option>
            </select>
          </div>
          <div>
            <label className="label">Department</label>
            <input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
          <div>
            <label className="label">Specialization</label>
            <input className="input" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Qualification</label>
            <input className="input" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} />
          </div>
          <div>
            <label className="label">Shift</label>
            <select className="input" value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })}>
              <option>Morning</option>
              <option>Evening</option>
              <option>Night</option>
              <option>General</option>
            </select>
          </div>
          {form.role === 'Doctor' && (
            <div className="col-span-2">
              <label className="label">Consultation Fee (₹)</label>
              <input type="number" className="input" value={form.consultation_fee} onChange={(e) => setForm({ ...form, consultation_fee: e.target.value })} />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Add Staff</button>
        </div>
      </form>
    </Modal>
  );
}
