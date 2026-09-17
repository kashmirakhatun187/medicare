import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Patient } from '@/lib/types';
import { PageHeader, LoadingSpinner, Avatar, StatusBadge, EmptyState } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { formatDate } from '@/lib/utils';
import { UserPlus, Search, Phone, Mail, MapPin, Droplet, AlertTriangle, BedDouble, ArrowRightLeft, Hash, FileText, Activity, FlaskConical, Pill, CreditCard, Stethoscope, Calendar, HeartPulse } from 'lucide-react';

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
      (p.patient_id || '').toLowerCase().includes(q) ||
      (p.phone || '').includes(search) ||
      (p.opd_number || '').toLowerCase().includes(q) ||
      (p.ipd_number || '').toLowerCase().includes(q) ||
      (p.current_ward_name || '').toLowerCase().includes(q);
    const matchesType = filterType === 'All' || p.patient_type === filterType;
    return matchesSearch && matchesType;
  });

  async function registerPatient(form: any) {
    const { data: patientId } = await supabase.rpc('generate_patient_id');
    const { data: opdNum } = await supabase.rpc('generate_opd_number');
    const mrn = 'MRN' + String(Date.now()).slice(-6);
    const insertData: any = {
      ...form,
      mrn,
      patient_id: patientId,
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
            placeholder="Search by Patient ID, OPD/IPD number, name, phone, or ward..."
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
                      {p.patient_id && <p className="font-mono text-xs font-bold text-brand-600">{p.patient_id}</p>}
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
  const [showHistory, setShowHistory] = useState(false);

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
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-800">{patient.name}</h3>
            <p className="text-sm text-slate-500">{patient.age}y {patient.gender} · {patient.blood_group}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {patient.patient_id && <span className="badge-teal font-mono text-xs font-bold">{patient.patient_id}</span>}
              {patient.opd_number && <span className="badge-blue font-mono text-xs">{patient.opd_number}</span>}
              {patient.ipd_number && <span className="badge-red font-mono text-xs">{patient.ipd_number}</span>}
              <span className={patient.patient_type === 'IPD' ? 'badge-red' : 'badge-blue'}>{patient.patient_type}</span>
              <StatusBadge status={patient.status} />
              <span className="badge-teal">{patient.department}</span>
            </div>
          </div>
          <button onClick={() => setShowHistory(true)} className="btn-secondary text-sm whitespace-nowrap">
            <Activity size={16} /> Full History
          </button>
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
      {showHistory && <PatientHistoryModal patient={patient} onClose={() => setShowHistory(false)} />}
    </Modal>
  );
}

function PatientHistoryModal({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [vitals, setVitals] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [otSchedules, setOTSchedules] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [v, p, l, b, a, ap, ot] = await Promise.all([
        supabase.from('vitals').select('*').eq('patient_id', patient.id).order('recorded_at', { ascending: false }),
        supabase.from('prescriptions').select('*').eq('patient_id', patient.id).order('created_at', { ascending: false }),
        supabase.from('lab_orders').select('*').eq('patient_id', patient.id).order('ordered_at', { ascending: false }),
        supabase.from('bills').select('*').eq('patient_id', patient.id).order('created_at', { ascending: false }),
        supabase.from('admissions').select('*').eq('patient_id', patient.id).order('admission_date', { ascending: false }),
        supabase.from('appointments').select('*').eq('patient_id', patient.id).order('appointment_date', { ascending: false }),
        supabase.from('ot_schedules').select('*').eq('patient_id', patient.id).order('scheduled_date', { ascending: false }),
      ]);
      setVitals(v.data || []);
      setPrescriptions(p.data || []);
      setLabOrders(l.data || []);
      setBills(b.data || []);
      setAdmissions(a.data || []);
      setAppointments(ap.data || []);
      setOTSchedules(ot.data || []);
      setLoading(false);
    })();
  }, [patient.id]);

  type TimelineEvent = { date: string; type: string; title: string; detail: string; icon: any; color: string };
  const events: TimelineEvent[] = [
    ...vitals.map((v) => ({ date: v.recorded_at, type: 'Vital', title: `Vitals recorded by ${v.recorded_by || 'Staff'}`, detail: `Temp: ${v.temperature}°C, BP: ${v.blood_pressure_systolic}/${v.blood_pressure_diastolic}, Pulse: ${v.pulse}, SpO2: ${v.oxygen_saturation}%`, icon: HeartPulse, color: 'rose' })),
    ...prescriptions.map((p) => ({ date: p.created_at, type: 'Prescription', title: `Prescription: ${p.diagnosis || 'N/A'}`, detail: `By ${p.doctor_name || 'Doctor'} · ${(p.medicines || []).length} medicine(s)`, icon: FileText, color: 'blue' })),
    ...labOrders.map((l) => ({ date: l.ordered_at, type: 'Lab', title: `Lab test: ${l.test_name}`, detail: `Status: ${l.status}${l.result ? ` · Result: ${l.result} ${l.result_units || ''}` : ''}`, icon: FlaskConical, color: 'cyan' })),
    ...bills.map((b) => ({ date: b.created_at, type: 'Billing', title: `Bill ${b.bill_number}`, detail: `${b.bill_type} · Total: ₹${b.total} · ${b.payment_status}`, icon: CreditCard, color: 'emerald' })),
    ...admissions.map((a) => ({ date: a.admission_date, type: 'Admission', title: `Admitted to ${a.ward_name || 'ward'}`, detail: `Bed: ${a.bed_number || 'N/A'} · Reason: ${a.reason || 'N/A'} · Status: ${a.status}`, icon: BedDouble, color: 'amber' })),
    ...appointments.map((a) => ({ date: a.appointment_date, type: 'Appointment', title: `Appointment with ${a.doctor_name || 'Doctor'}`, detail: `Dept: ${a.department || 'N/A'} · Time: ${a.appointment_time || 'N/A'} · Status: ${a.status}`, icon: Calendar, color: 'brand' })),
    ...otSchedules.map((o) => ({ date: o.scheduled_date, type: 'Surgery', title: `Surgery: ${o.surgery_name}`, detail: `Surgeon: ${o.surgeon_name || 'N/A'} · OT: ${o.ot_room} · Status: ${o.status}`, icon: Stethoscope, color: 'rose' })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const colorMap: Record<string, string> = {
    rose: 'bg-rose-50 text-rose-600',
    blue: 'bg-blue-50 text-blue-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    brand: 'bg-brand-50 text-brand-600',
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Medical History — ${patient.name}`} size="lg">
      {loading ? (
        <div className="py-8 text-center text-sm text-slate-400">Loading history...</div>
      ) : events.length === 0 ? (
        <EmptyState message="No medical history found for this patient" />
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {events.map((e, i) => {
            const Icon = e.icon;
            return (
              <div key={i} className="flex gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[e.color]}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 pb-3 border-b border-slate-50 last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">{e.title}</p>
                    <span className="text-xs text-slate-400">{formatDate(e.date)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{e.detail}</p>
                  <span className={`badge ${colorMap[e.color]} text-xs mt-1`}>{e.type}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}