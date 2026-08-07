import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Patient } from '@/lib/types';
import { PageHeader, LoadingSpinner, Avatar, StatusBadge, EmptyState, StatCard } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { formatDate } from '@/lib/utils';
import { Ambulance, Plus, Siren, Phone, X } from 'lucide-react';

interface Ambulance {
  id: string;
  vehicle_id: string;
  driver_name: string;
  driver_phone: string | null;
  status: string;
}

export function EmergencyPage() {
  const [erPatients, setErPatients] = useState<Patient[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAmbulanceForm, setShowAmbulanceForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [erRes, ambRes] = await Promise.all([
      supabase.from('patients').select('*').eq('department', 'Emergency').order('created_at', { ascending: false }),
      supabase.from('ambulances').select('*').order('vehicle_id'),
    ]);
    setErPatients(erRes.data || []);
    setAmbulances(ambRes.data || []);
    setLoading(false);
  }

  async function registerEmergency(form: any) {
    const mrn = 'ER' + String(Date.now()).slice(-6);
    await supabase.from('patients').insert({
      ...form,
      mrn,
      patient_type: 'IPD',
      department: 'Emergency',
      status: 'Active',
    });
    setShowModal(false);
    loadData();
  }

  async function toggleAmbulance(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'Available' ? 'On Call' : 'Available';
    await supabase.from('ambulances').update({ status: newStatus }).eq('id', id);
    loadData();
  }

  if (loading) return <LoadingSpinner />;

  const available = ambulances.filter((a) => a.status === 'Available').length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Emergency & Ambulance"
        subtitle="Emergency registration, ambulance dispatch, and trauma records"
        action={
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setShowAmbulanceForm(true)}>
              <Plus size={18} /> Add Ambulance
            </button>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Siren size={18} /> Emergency Registration
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="ER Patients" value={erPatients.length} icon={<Siren size={22} />} color="rose" />
        <StatCard label="Ambulances" value={ambulances.length} icon={<Ambulance size={22} />} color="brand" />
        <StatCard label="Available" value={available} icon={<Ambulance size={22} />} color="emerald" />
        <StatCard label="On Call" value={ambulances.length - available} icon={<Ambulance size={22} />} color="amber" />
      </div>

      {/* Ambulance Dispatch */}
      <div className="card p-6 mb-6">
        <h3 className="font-semibold text-slate-800 mb-4">Ambulance Fleet</h3>
        {ambulances.length === 0 ? (
          <EmptyState message="No ambulances added yet. Click 'Add Ambulance' to get started." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ambulances.map((a) => (
              <div key={a.id} className={`rounded-xl border-2 p-4 transition-all ${a.status === 'Available' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${a.status === 'Available' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                      <Ambulance size={20} className={a.status === 'Available' ? 'text-emerald-600' : 'text-amber-600'} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700">{a.vehicle_id}</p>
                      <p className="text-xs text-slate-500">{a.driver_name}</p>
                    </div>
                  </div>
                  <span className={`badge ${a.status === 'Available' ? 'badge-green' : 'badge-amber'}`}>{a.status}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                  <Phone size={12} /> {a.driver_phone || '-'}
                </div>
                <button
                  onClick={() => toggleAmbulance(a.id, a.status)}
                  className={`w-full text-sm font-medium py-2 rounded-lg transition-colors ${a.status === 'Available' ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                >
                  {a.status === 'Available' ? 'Dispatch' : 'Mark Available'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ER Patients */}
      <div className="card overflow-hidden">
        <h3 className="font-semibold text-slate-800 p-6 pb-4">Emergency Patients</h3>
        {erPatients.length === 0 ? (
          <EmptyState message="No emergency patients" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="table-header">Patient</th>
                  <th className="table-header">MRN</th>
                  <th className="table-header">Age/Gender</th>
                  <th className="table-header">Contact</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {erPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Avatar name={p.name} size="sm" />
                        <span className="font-medium text-slate-700">{p.name}</span>
                      </div>
                    </td>
                    <td className="table-cell font-mono text-xs">{p.mrn}</td>
                    <td className="table-cell">{p.age}y · {p.gender}</td>
                    <td className="table-cell">{p.phone || '-'}</td>
                    <td className="table-cell"><StatusBadge status={p.status} /></td>
                    <td className="table-cell text-xs text-slate-500">{formatDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <ERFormModal onClose={() => setShowModal(false)} onSubmit={registerEmergency} />}
      {showAmbulanceForm && <AmbulanceForm onClose={() => setShowAmbulanceForm(false)} onCreated={loadData} />}
    </div>
  );
}

function AmbulanceForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ vehicle_id: '', driver_name: '', driver_phone: '', status: 'Available' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase.from('ambulances').insert(form);
    setLoading(false);
    onClose();
    onCreated();
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Add Ambulance" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Vehicle ID *</label>
          <input className="input" placeholder="AMB-01" required value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} />
        </div>
        <div>
          <label className="label">Driver Name *</label>
          <input className="input" placeholder="Driver name" required value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} />
        </div>
        <div>
          <label className="label">Driver Phone</label>
          <input className="input" placeholder="Phone number" value={form.driver_phone} onChange={(e) => setForm({ ...form, driver_phone: e.target.value })} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option>Available</option>
            <option>On Call</option>
            <option>Maintenance</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Adding...' : 'Add Ambulance'}</button>
        </div>
      </form>
    </Modal>
  );
}

function ERFormModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (f: any) => void }) {
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'Male',
    phone: '',
    emergency_contact: '',
    blood_group: 'B+',
    address: '',
    allergies: '',
    chronic_conditions: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, age: form.age ? parseInt(form.age) : null });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Emergency Registration" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Name *</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Age</label>
            <input type="number" className="input" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
          </div>
          <div>
            <label className="label">Gender</label>
            <select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="label">Blood Group</label>
            <select className="input" value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })}>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Emergency Contact</label>
            <input className="input" value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">Address</label>
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="label">Allergies</label>
            <input className="input" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} />
          </div>
          <div>
            <label className="label">Known Conditions</label>
            <input className="input" value={form.chronic_conditions} onChange={(e) => setForm({ ...form, chronic_conditions: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Register Emergency</button>
        </div>
      </form>
    </Modal>
  );
}
