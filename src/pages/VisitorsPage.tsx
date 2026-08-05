import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Visitor, Patient } from '@/lib/types';
import { PageHeader, LoadingSpinner, StatusBadge, EmptyState, StatCard, Avatar } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { formatDateTime } from '@/lib/utils';
import { UserPlus, LogIn, LogOut, Users, Clock, CheckCircle } from 'lucide-react';

export function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: v }, { data: p }] = await Promise.all([
      supabase.from('visitors').select('*').order('check_in', { ascending: false }),
      supabase.from('patients').select('id, name').eq('patient_type', 'IPD').eq('status', 'Admitted'),
    ]);
    setVisitors(v || []);
    setPatients(p || []);
    setLoading(false);
  }

  async function checkInVisitor(form: any) {
    const patient = patients.find((p) => p.id === form.patient_id);
    await supabase.from('visitors').insert({
      ...form,
      patient_name: patient?.name,
      status: 'Checked In',
    });
    setShowModal(false);
    loadData();
  }

  async function checkOutVisitor(id: string) {
    await supabase.from('visitors').update({
      status: 'Checked Out',
      check_out: new Date().toISOString(),
    }).eq('id', id);
    loadData();
  }

  const checkedIn = visitors.filter((v) => v.status === 'Checked In').length;
  const checkedOut = visitors.filter((v) => v.status === 'Checked Out').length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Visitor Management"
        subtitle="Track visitors for IPD patients with check-in/check-out"
        action={
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <UserPlus size={18} /> Check In Visitor
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Visitors" value={visitors.length} icon={<Users size={22} />} color="brand" />
        <StatCard label="Checked In" value={checkedIn} icon={<LogIn size={22} />} color="emerald" />
        <StatCard label="Checked Out" value={checkedOut} icon={<LogOut size={22} />} color="blue" />
        <StatCard label="IPD Patients" value={patients.length} icon={<Clock size={22} />} color="amber" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="table-header">Visitor</th>
                <th className="table-header">Visiting Patient</th>
                <th className="table-header">Relationship</th>
                <th className="table-header">Phone</th>
                <th className="table-header">ID Proof</th>
                <th className="table-header">Check In</th>
                <th className="table-header">Check Out</th>
                <th className="table-header">Status</th>
                <th className="table-header">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visitors.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <Avatar name={v.visitor_name} size="sm" />
                      <span className="font-medium text-slate-700">{v.visitor_name}</span>
                    </div>
                  </td>
                  <td className="table-cell text-slate-600">{v.patient_name || '-'}</td>
                  <td className="table-cell">{v.relationship || '-'}</td>
                  <td className="table-cell text-sm">{v.phone || '-'}</td>
                  <td className="table-cell text-sm">{v.id_proof || '-'}</td>
                  <td className="table-cell text-xs text-slate-500">{formatDateTime(v.check_in)}</td>
                  <td className="table-cell text-xs text-slate-500">{v.check_out ? formatDateTime(v.check_out) : '-'}</td>
                  <td className="table-cell"><StatusBadge status={v.status} /></td>
                  <td className="table-cell">
                    {v.status === 'Checked In' && (
                      <button
                        onClick={() => checkOutVisitor(v.id)}
                        className="text-xs font-medium text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1"
                      >
                        <LogOut size={12} /> Check Out
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visitors.length === 0 && <EmptyState message="No visitors recorded" />}
        </div>
      </div>

      {showModal && <VisitorFormModal onClose={() => setShowModal(false)} onSubmit={checkInVisitor} patients={patients} />}
    </div>
  );
}

function VisitorFormModal({ onClose, onSubmit, patients }: { onClose: () => void; onSubmit: (f: any) => void; patients: { id: string; name: string }[] }) {
  const [form, setForm] = useState({
    visitor_name: '', patient_id: '', relationship: '', phone: '', id_proof: 'Aadhaar', purpose: 'General Visit',
  });
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit(form); };
  return (
    <Modal isOpen={true} onClose={onClose} title="Check In Visitor" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Visitor Name *</label>
          <input className="input" required value={form.visitor_name} onChange={(e) => setForm({ ...form, visitor_name: e.target.value })} />
        </div>
        <div>
          <label className="label">Visiting Patient *</label>
          <select className="input" required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
            <option value="">Select patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Relationship</label>
            <select className="input" value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })}>
              {['Son', 'Daughter', 'Spouse', 'Parent', 'Sibling', 'Relative', 'Friend', 'Other'].map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">ID Proof</label>
            <select className="input" value={form.id_proof} onChange={(e) => setForm({ ...form, id_proof: e.target.value })}>
              {['Aadhaar', 'PAN Card', 'Voter ID', 'Driving License', 'Passport'].map((i) => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Purpose</label>
            <input className="input" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Check In</button>
        </div>
      </form>
    </Modal>
  );
}
