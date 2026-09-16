import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Patient } from '@/lib/types';
import { PageHeader, LoadingSpinner, Avatar, StatusBadge, EmptyState } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { formatDate } from '@/lib/utils';
import { UserPlus, Search, Phone, Mail, MapPin, Droplet, AlertTriangle, BedDouble, ArrowRightLeft, Hash } from 'lucide-react';

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
  const [showConvertModal, setShowConvertModal] = useState<Patient | null>(null);
  const [beds, setBeds] = useState<any[]>([]);

  useEffect(() => {
    loadPatients();
    loadDoctors();
    loadBeds();
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

  async function loadBeds() {
    const { data } = await supabase.from('beds').select('*').eq('status', 'Available').order('bed_number');
    setBeds(data || []);
  }

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.mrn.toLowerCase().includes(q) ||
      (p.phone || '').includes(search) ||
      (p.opd_number || '').toLowerCase().includes(q) ||
      (p.ipd_number || '').toLowerCase().includes(q) ||
      (p.current_ward_name || '').toLowerCase().includes(q);
    const matchesType = filterType === 'All' || p.patient_type === filterType;
    return matchesSearch && matchesType;
  });

  async function registerPatient(form: any) {
    const mrn = 'MRN' + String(Date.now()).slice(-6);
    const { data: opdNum } = await supabase.rpc('generate_opd_number');
    const insertData: any = {
      ...form,
      mrn,
      patient_type: form.patient_type,
      status: 'Active',
    };
    if (form.patient_type === 'OPD') {
      insertData.opd_number = opdNum;
    } else {
      const { data: ipdNum } = await supabase.rpc('generate_ipd_number');
      insertData.ipd_number = ipdNum;
    }
    await supabase.from('patients').insert(insertData);
    setShowModal(false);
    loadPatients();
  }

  async function convertToIPD(patient: Patient, bedId: string, reason: string) {
    const { data: ipdNum } = await supabase.rpc('generate_ipd_number');
    const updates: any = {
      patient_type: 'IPD',
      ipd_number: ipdNum,
      status: 'Admitted',
    };

    if (bedId) {
      const bed = beds.find((b) => b.id === bedId);
      updates.current_bed_id = bedId;
      updates.current_ward_name = bed?.ward_name || null;

      // Mark bed as occupied
      await supabase.from('beds').update({
        status: 'Occupied',
        patient_id: patient.id,
        patient_name: patient.name,
      }).eq('id', bedId);

      // Create admission record
      await supabase.from('admissions').insert({
        patient_id: patient.id,
        patient_name: patient.name,
        mrn: patient.mrn,
        bed_id: bedId,
        bed_number: bed?.bed_number || null,
        ward_name: bed?.ward_name || null,
        doctor_id: null,
        doctor_name: patient.assigned_doctor || null,
        department: patient.department || null,
        admission_date: new Date().toISOString().split('T')[0],
        admission_time: new Date().toTimeString().split(' ')[0],
        reason: reason || 'Converted from OPD',
        status: 'Admitted',
        advance_amount: 0,
      });
    }

    await supabase.from('patients').update(updates).eq('id', patient.id);
    setShowConvertModal(null);
    loadPatients();
    loadBeds();
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Patient Registration"
        subtitle="Register and manage OPD & IPD patients with unique numbers"
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
            placeholder="Search by name, MRN, OPD/IPD number, phone, or ward..."
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
                <th className="table-header">Unique No.</th>
                <th className="table-header">Type</th>
                <th className="table-header">Bed / Ward</th>
                <th className="table-header">Department</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
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
                  <td className="table-cell">
                    <div className="space-y-0.5">
                      {p.opd_number && <p className="font-mono text-xs text-blue-600">{p.opd_number}</p>}
                      {p.ipd_number && <p className="font-mono text-xs text-rose-600">{p.ipd_number}</p>}
                      <p className="font-mono text-xs text-slate-400">{p.mrn}</p>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={p.patient_type === 'IPD' ? 'badge-red' : 'badge-blue'}>{p.patient_type}</span>
                  </td>
                  <td className="table-cell">
                    {p.current_ward_name ? (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                        <BedDouble size={12} /> {p.current_ward_name}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="table-cell">{p.department || '-'}</td>
                  <td className="table-cell"><StatusBadge status={p.status} /></td>
                  <td className="table-cell" onClick={(e) => e.stopPropagation()}>
                    {p.patient_type === 'OPD' && (
                      <button
                        onClick={() => setShowConvertModal(p)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-2 py-1 rounded-lg transition-colors"
                        title="Convert to IPD"
                      >
                        <ArrowRightLeft size={14} /> To IPD
                      </button>
                    )}
                  </td>
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

      {showConvertModal && (
        <ConvertToIPDModal
          patient={showConvertModal}
          beds={beds}
          onClose={() => setShowConvertModal(null)}
          onConvert={convertToIPD}
        />
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
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700 mb-2">
          A unique {form.patient_type} number will be auto-generated (e.g., {form.patient_type}-000123)
        </div>
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

function ConvertToIPDModal({
  patient,
  beds,
  onClose,
  onConvert,
}: {
  patient: Patient;
  beds: any[];
  onClose: () => void;
  onConvert: (patient: Patient, bedId: string, reason: string) => void;
}) {
  const [bedId, setBedId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await onConvert(patient, bedId, reason);
    setLoading(false);
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Convert OPD to IPD" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-700">
          <p>Patient: <span className="font-semibold">{patient.name}</span></p>
          <p>Current OPD No: <span className="font-mono">{patient.opd_number || patient.mrn}</span></p>
          <p className="mt-1">A new IPD number will be auto-generated.</p>
        </div>
        <div>
          <label className="label">Assign Bed *</label>
          <select className="input" required value={bedId} onChange={(e) => setBedId(e.target.value)}>
            <option value="">Select available bed</option>
            {beds.map((b) => (
              <option key={b.id} value={b.id}>
                {b.bed_number} — {b.ward_name} ({b.type})
              </option>
            ))}
          </select>
          {beds.length === 0 && (
            <p className="text-xs text-rose-500 mt-1">No available beds. Please add or free up a bed first.</p>
          )}
        </div>
        <div>
          <label className="label">Reason for Admission</label>
          <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Observation, Surgery, etc." />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading || !bedId}>
            {loading ? 'Converting...' : 'Convert to IPD'}
          </button>
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
            <div className="flex flex-wrap gap-2 mt-2">
              {patient.opd_number && <span className="badge-blue font-mono text-xs">{patient.opd_number}</span>}
              {patient.ipd_number && <span className="badge-red font-mono text-xs">{patient.ipd_number}</span>}
              <span className={patient.patient_type === 'IPD' ? 'badge-red' : 'badge-blue'}>{patient.patient_type}</span>
              <StatusBadge status={patient.status} />
              <span className="badge-teal">{patient.department}</span>
            </div>
          </div>
        </div>

        {patient.current_ward_name && (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-lg p-3 text-sm text-rose-700">
            <BedDouble size={16} />
            Currently admitted in <span className="font-semibold">{patient.current_ward_name}</span>
          </div>
        )}

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
