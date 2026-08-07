import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Admission, Patient, Bed, Staff } from '@/lib/types';
import { PageHeader, LoadingSpinner, StatusBadge, EmptyState, StatCard, Avatar } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { formatDate, formatTime, formatCurrency, daysBetween } from '@/lib/utils';
import { BedDouble, Plus, Search, Activity, CheckCircle, LogOut } from 'lucide-react';

export function AdmissionsPage() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: a }, { data: p }, { data: b }, { data: d }] = await Promise.all([
      supabase.from('admissions').select('*').order('created_at', { ascending: false }),
      supabase.from('patients').select('*').eq('status', 'Active'),
      supabase.from('beds').select('*').order('bed_number'),
      supabase.from('staff').select('*').eq('role', 'Doctor').eq('status', 'Active'),
    ]);
    setAdmissions(a || []);
    setPatients(p || []);
    setBeds(b || []);
    setDoctors(d || []);
    setLoading(false);
  }

  async function admitPatient(form: any) {
    const patient = patients.find((p) => p.id === form.patient_id);
    const bed = beds.find((b) => b.id === form.bed_id);
    const doctor = doctors.find((d) => d.id === form.doctor_id);

    await supabase.from('admissions').insert({
      patient_id: form.patient_id,
      patient_name: patient?.name,
      mrn: patient?.mrn,
      bed_id: form.bed_id,
      bed_number: bed?.bed_number,
      ward_name: bed?.ward_name,
      doctor_id: form.doctor_id,
      doctor_name: doctor?.name,
      department: form.department,
      admission_date: form.admission_date,
      admission_time: form.admission_time,
      reason: form.reason,
      status: 'Admitted',
      advance_amount: parseFloat(form.advance_amount) || 0,
    });

    await supabase.from('beds').update({
      status: 'Occupied',
      patient_id: form.patient_id,
      patient_name: patient?.name,
    }).eq('id', form.bed_id);

    await supabase.from('patients').update({ patient_type: 'IPD' }).eq('id', form.patient_id);

    setShowModal(false);
    loadData();
  }

  async function dischargeAdmission(id: string, bedId: string | null) {
    await supabase.from('admissions').update({
      status: 'Discharged',
      discharge_date: new Date().toISOString().split('T')[0],
      discharge_time: formatTime(new Date().toTimeString().substring(0, 5)),
    }).eq('id', id);

    if (bedId) {
      await supabase.from('beds').update({
        status: 'Available',
        patient_id: null,
        patient_name: null,
      }).eq('id', bedId);
    }

    loadData();
  }

  const filtered = admissions.filter((a) => {
    const matchesSearch = a.patient_name?.toLowerCase().includes(search.toLowerCase()) || a.mrn?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'All' || a.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const activeCount = admissions.filter((a) => a.status === 'Admitted').length;
  const dischargedCount = admissions.filter((a) => a.status === 'Discharged').length;
  const availableBeds = beds.filter((b) => b.status === 'Available').length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="IPD Admissions"
        subtitle="Manage inpatient admissions, bed assignment, and discharges"
        action={
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> New Admission
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Admissions" value={activeCount} icon={<Activity size={22} />} color="brand" />
        <StatCard label="Discharged" value={dischargedCount} icon={<CheckCircle size={22} />} color="emerald" />
        <StatCard label="Available Beds" value={availableBeds} icon={<BedDouble size={22} />} color="blue" />
        <StatCard label="Total Admissions" value={admissions.length} icon={<Activity size={22} />} color="amber" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search by patient or MRN..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-40" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option>All</option>
          <option>Admitted</option>
          <option>Discharged</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="table-header">Patient</th>
                <th className="table-header">MRN</th>
                <th className="table-header">Bed / Ward</th>
                <th className="table-header">Doctor</th>
                <th className="table-header">Admitted</th>
                <th className="table-header">Days</th>
                <th className="table-header">Advance</th>
                <th className="table-header">Status</th>
                <th className="table-header">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <Avatar name={a.patient_name || ''} size="sm" />
                      <span className="font-medium text-slate-700">{a.patient_name}</span>
                    </div>
                  </td>
                  <td className="table-cell font-mono text-xs">{a.mrn}</td>
                  <td className="table-cell">
                    <div>
                      <p className="font-medium text-slate-700">{a.bed_number}</p>
                      <p className="text-xs text-slate-400">{a.ward_name}</p>
                    </div>
                  </td>
                  <td className="table-cell">{a.doctor_name || '-'}</td>
                  <td className="table-cell text-xs text-slate-500">{formatDate(a.admission_date)} {formatTime(a.admission_time)}</td>
                  <td className="table-cell">
                    <span className="badge-blue">{daysBetween(a.admission_date, a.status === 'Discharged' && a.discharge_date ? a.discharge_date : new Date().toISOString().split('T')[0])}d</span>
                  </td>
                  <td className="table-cell font-medium">{formatCurrency(a.advance_amount)}</td>
                  <td className="table-cell"><StatusBadge status={a.status} /></td>
                  <td className="table-cell">
                    {a.status === 'Admitted' && (
                      <button
                        onClick={() => dischargeAdmission(a.id, a.bed_id)}
                        className="text-xs font-medium text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1"
                      >
                        <LogOut size={12} /> Discharge
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState message="No admissions found" />}
        </div>
      </div>

      {showModal && (
        <AdmissionFormModal
          onClose={() => setShowModal(false)}
          onSubmit={admitPatient}
          patients={patients.filter((p) => p.patient_type === 'OPD')}
          beds={beds.filter((b) => b.status === 'Available')}
          doctors={doctors}
        />
      )}
    </div>
  );
}

function AdmissionFormModal({
  onClose,
  onSubmit,
  patients,
  beds,
  doctors,
}: {
  onClose: () => void;
  onSubmit: (f: any) => void;
  patients: Patient[];
  beds: Bed[];
  doctors: Staff[];
}) {
  const [form, setForm] = useState({
    patient_id: '',
    bed_id: '',
    doctor_id: '',
    department: 'General Medicine',
    admission_date: new Date().toISOString().split('T')[0],
    admission_time: '09:00',
    reason: '',
    advance_amount: '0',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="New IPD Admission" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Patient *</label>
          <select className="input" required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
            <option value="">Select patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.mrn})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Assign Bed *</label>
          <select className="input" required value={form.bed_id} onChange={(e) => setForm({ ...form, bed_id: e.target.value })}>
            <option value="">Select available bed</option>
            {beds.map((b) => (
              <option key={b.id} value={b.id}>{b.bed_number} — {b.ward_name} ({b.type}) ₹{b.daily_charge}/day</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Assigned Doctor</label>
          <select className="input" value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}>
            <option value="">Select doctor</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.name} — {d.department}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Department</label>
          <select className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
            {['General Medicine', 'General Surgery', 'Orthopedics', 'Gynecology & Obstetrics', 'Pediatrics', 'ENT', 'Cardiology', 'Neurology', 'Urology', 'ICU/CCU', 'Emergency'].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Admission Date *</label>
            <input type="date" className="input" required value={form.admission_date} onChange={(e) => setForm({ ...form, admission_date: e.target.value })} />
          </div>
          <div>
            <label className="label">Admission Time</label>
            <input type="time" className="input" value={form.admission_time} onChange={(e) => setForm({ ...form, admission_time: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Reason for Admission</label>
          <input className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        </div>
        <div>
          <label className="label">Advance Amount (₹)</label>
          <input type="number" className="input" value={form.advance_amount} onChange={(e) => setForm({ ...form, advance_amount: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Admit Patient</button>
        </div>
      </form>
    </Modal>
  );
}
