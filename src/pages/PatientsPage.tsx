import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Patient } from '@/lib/types';
import { PageHeader, LoadingSpinner, Avatar, StatusBadge, EmptyState } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { formatDate } from '@/lib/utils';
import { UserPlus, Search, Phone, Mail, MapPin, Droplet, AlertTriangle } from 'lucide-react';

const DEPARTMENTS = [
  'General Medicine', 'General Surgery', 'Orthopedics', 'Gynecology & Obstetrics',
  'Pediatrics', 'ENT', 'Cardiology', 'Neurology', 'Urology', 'ICU/CCU', 'Emergency', 'Physiotherapy',
];

export function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [doctors, setDoctors] = useState<string[]>([]);

  useEffect(() => {
    loadPatients();
    loadDoctors();
  }, []);

  async function loadPatients() {
    setLoading(true);
    const { data } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
    setPatients(data || []);
    setLoading(false);
  }

  async function loadDoctors() {
    const { data } = await supabase.from('staff').select('name').eq('role', 'Doctor').eq('status', 'Active');
    setDoctors((data || []).map((d: any) => d.name));
  }

  const filtered = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.mrn.toLowerCase().includes(search.toLowerCase()) ||
      (p.phone || '').includes(search);
    const matchesType = filterType === 'All' || p.patient_type === filterType;
    return matchesSearch && matchesType;
  });

  async function registerPatient(form: any) {
    const mrn = 'MRN' + String(Date.now()).slice(-6);
    await supabase.from('patients').insert({
      ...form,
      mrn,
      patient_type: form.patient_type,
      status: 'Active',
    });
    setShowModal(false);
    loadPatients();
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Patient Registration"
        subtitle="Register and manage OPD & IPD patients"
        action={
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <UserPlus size={18} />
            Register Patient
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-10"
            placeholder="Search by name, MRN, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input sm:w-40" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option>All</option>
          <option>OPD</option>
          <option>IPD</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="table-header">Patient</th>
                <th className="table-header">MRN</th>
                <th className="table-header">Type</th>
                <th className="table-header">Department</th>
                <th className="table-header">Doctor</th>
                <th className="table-header">Status</th>
                <th className="table-header">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedPatient(p)}
                >
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <Avatar name={p.name} size="sm" />
                      <div>
                        <p className="font-medium text-slate-700">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.age}y · {p.gender} · {p.blood_group}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell font-mono text-xs">{p.mrn}</td>
                  <td className="table-cell">
                    <span className={p.patient_type === 'IPD' ? 'badge-red' : 'badge-blue'}>{p.patient_type}</span>
                  </td>
                  <td className="table-cell">{p.department || '-'}</td>
                  <td className="table-cell">{p.assigned_doctor || '-'}</td>
                  <td className="table-cell"><StatusBadge status={p.status} /></td>
                  <td className="table-cell text-xs text-slate-500">{formatDate(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState message="No patients found" />}
        </div>
      </div>

      {showModal && (
        <PatientFormModal
          onClose={() => setShowModal(false)}
          onSubmit={registerPatient}
          doctors={doctors}
        />
      )}

      {selectedPatient && (
        <PatientDetailModal patient={selectedPatient} onClose={() => setSelectedPatient(null)} />
      )}
    </div>
  );
}

function PatientFormModal({
  onClose,
  onSubmit,
  doctors,
}: {
  onClose: () => void;
  onSubmit: (form: any) => void;
  doctors: string[];
}) {
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'Male',
    phone: '',
    email: '',
    address: '',
    blood_group: 'B+',
    emergency_contact: '',
    patient_type: 'OPD',
    department: DEPARTMENTS[0],
    assigned_doctor: '',
    allergies: '',
    chronic_conditions: '',
    insurance_provider: '',
    insurance_id: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      age: form.age ? parseInt(form.age) : null,
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Register New Patient" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name *</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone *</label>
            <input className="input" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
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
            <label className="label">Patient Type</label>
            <select className="input" value={form.patient_type} onChange={(e) => setForm({ ...form, patient_type: e.target.value })}>
              <option>OPD</option>
              <option>IPD</option>
            </select>
          </div>
          <div>
            <label className="label">Department</label>
            <select className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Assigned Doctor</label>
            <select className="input" value={form.assigned_doctor} onChange={(e) => setForm({ ...form, assigned_doctor: e.target.value })}>
              <option value="">Select doctor</option>
              {doctors.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Address</label>
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="label">Emergency Contact</label>
            <input className="input" value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Allergies</label>
            <input className="input" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} />
          </div>
          <div>
            <label className="label">Chronic Conditions</label>
            <input className="input" value={form.chronic_conditions} onChange={(e) => setForm({ ...form, chronic_conditions: e.target.value })} />
          </div>
          <div>
            <label className="label">Insurance Provider</label>
            <input className="input" value={form.insurance_provider} onChange={(e) => setForm({ ...form, insurance_provider: e.target.value })} />
          </div>
          <div>
            <label className="label">Insurance ID</label>
            <input className="input" value={form.insurance_id} onChange={(e) => setForm({ ...form, insurance_id: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Register Patient</button>
        </div>
      </form>
    </Modal>
  );
}

function PatientDetailModal({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const [vitals, setVitals] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('vitals').select('*').eq('patient_id', patient.id).order('recorded_at', { ascending: false }).limit(5)
      .then(({ data }) => setVitals(data || []));
    supabase.from('prescriptions').select('*').eq('patient_id', patient.id).order('created_at', { ascending: false }).limit(3)
      .then(({ data }) => setPrescriptions(data || []));
  }, [patient.id]);

  return (
    <Modal isOpen={true} onClose={onClose} title="Patient Details" size="lg">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar name={patient.name} size="lg" />
          <div>
            <h3 className="text-xl font-bold text-slate-800">{patient.name}</h3>
            <p className="text-sm text-slate-500">{patient.mrn} · {patient.age}y {patient.gender} · {patient.blood_group}</p>
            <div className="flex gap-2 mt-2">
              <span className={patient.patient_type === 'IPD' ? 'badge-red' : 'badge-blue'}>{patient.patient_type}</span>
              <StatusBadge status={patient.status} />
              <span className="badge-teal">{patient.department}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Phone size={16} className="text-slate-400" />
            {patient.phone || '-'}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Mail size={16} className="text-slate-400" />
            {patient.email || '-'}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 col-span-2">
            <MapPin size={16} className="text-slate-400" />
            {patient.address || '-'}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Droplet size={16} className="text-slate-400" />
            Blood: {patient.blood_group}
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <AlertTriangle size={16} className="text-slate-400" />
            Allergies: {patient.allergies || 'None'}
          </div>
        </div>

        {patient.assigned_doctor && (
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Assigned Doctor</p>
            <p className="text-sm font-medium text-slate-700">{patient.assigned_doctor}</p>
          </div>
        )}

        {vitals.length > 0 && (
          <div>
            <h4 className="font-semibold text-slate-700 mb-2">Recent Vitals</h4>
            <div className="space-y-2">
              {vitals.map((v) => (
                <div key={v.id} className="bg-slate-50 rounded-lg p-3 text-sm">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>{v.recorded_by}</span>
                    <span>{formatDate(v.recorded_at)}</span>
                  </div>
                  <div className="flex gap-4 text-slate-600">
                    <span>Temp: {v.temperature}°C</span>
                    <span>BP: {v.blood_pressure_systolic}/{v.blood_pressure_diastolic}</span>
                    <span>Pulse: {v.pulse}</span>
                    <span>SpO2: {v.oxygen_saturation}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {prescriptions.length > 0 && (
          <div>
            <h4 className="font-semibold text-slate-700 mb-2">Prescriptions</h4>
            <div className="space-y-2">
              {prescriptions.map((p) => (
                <div key={p.id} className="bg-slate-50 rounded-lg p-3 text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-slate-700">{p.diagnosis}</span>
                    <span className="text-xs text-slate-400">{formatDate(p.created_at)}</span>
                  </div>
                  <p className="text-xs text-slate-500">By {p.doctor_name}</p>
                  <div className="mt-2 space-y-1">
                    {(p.medicines || []).map((m: any, i: number) => (
                      <div key={i} className="text-xs text-slate-600">
                        {m.medicine} — {m.dosage}, {m.frequency}, {m.duration}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
