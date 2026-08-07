import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Prescription, Patient, Staff } from '@/lib/types';
import { PageHeader, LoadingSpinner, StatusBadge, EmptyState, Avatar } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { formatDate } from '@/lib/utils';
import { Pill, Plus, FileText, Stethoscope, Calendar } from 'lucide-react';

export function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: rx }, { data: p }, { data: d }, { data: m }] = await Promise.all([
      supabase.from('prescriptions').select('*').order('created_at', { ascending: false }),
      supabase.from('patients').select('*').eq('status', 'Active'),
      supabase.from('staff').select('*').eq('role', 'Doctor').eq('status', 'Active'),
      supabase.from('medicines').select('id, name, strength').order('name'),
    ]);
    setPrescriptions(rx || []);
    setPatients(p || []);
    setDoctors(d || []);
    setMedicines(m || []);
    setLoading(false);
  }

  async function createPrescription(form: any) {
    const patient = patients.find((p) => p.id === form.patient_id);
    const doctor = doctors.find((d) => d.id === form.doctor_id);
    const meds = form.medicines.filter((m: any) => m.medicine);

    await supabase.from('prescriptions').insert({
      patient_id: form.patient_id,
      patient_name: patient?.name,
      doctor_id: form.doctor_id,
      doctor_name: doctor?.name,
      diagnosis: form.diagnosis,
      medicines: meds,
      instructions: form.instructions,
      follow_up_date: form.follow_up_date || null,
      status: 'Active',
    });
    setShowModal(false);
    loadData();
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Digital Prescriptions"
        subtitle="Create and manage digital prescriptions (e-Rx)"
        action={
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> New Prescription
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prescriptions.length === 0 ? (
          <div className="col-span-full"><EmptyState message="No prescriptions yet" /></div>
        ) : (
          prescriptions.map((rx) => (
            <div
              key={rx.id}
              className="card-hover p-5 cursor-pointer"
              onClick={() => setSelectedRx(rx)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Avatar name={rx.patient_name || ''} size="sm" />
                  <div>
                    <p className="font-medium text-slate-700">{rx.patient_name}</p>
                    <p className="text-xs text-slate-400">{formatDate(rx.created_at)}</p>
                  </div>
                </div>
                <StatusBadge status={rx.status} />
              </div>
              <div className="space-y-1.5 text-sm">
                <p className="text-slate-600"><Stethoscope size={14} className="inline mr-1 text-slate-400" /> {rx.doctor_name}</p>
                <p className="text-slate-600 font-medium">{rx.diagnosis}</p>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Pill size={12} /> {(rx.medicines || []).length} medicines prescribed
                </div>
                {rx.follow_up_date && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <Calendar size={12} /> Follow up: {formatDate(rx.follow_up_date)}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <PrescriptionFormModal
          onClose={() => setShowModal(false)}
          onSubmit={createPrescription}
          patients={patients}
          doctors={doctors}
          medicines={medicines}
        />
      )}

      {selectedRx && (
        <Modal isOpen={true} onClose={() => setSelectedRx(null)} title="Prescription Details" size="md">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <Avatar name={selectedRx.patient_name || ''} size="lg" />
              <div>
                <h3 className="font-bold text-slate-800">{selectedRx.patient_name}</h3>
                <p className="text-sm text-slate-500">By {selectedRx.doctor_name}</p>
                <p className="text-xs text-slate-400">{formatDate(selectedRx.created_at)}</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Diagnosis</p>
              <p className="text-sm font-medium text-slate-700">{selectedRx.diagnosis}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Prescribed Medicines</p>
              <div className="space-y-2">
                {(selectedRx.medicines || []).map((m: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 bg-white border border-slate-200 rounded-lg p-3">
                    <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Pill size={16} className="text-brand-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">{m.medicine}</p>
                      <p className="text-xs text-slate-500">{m.dosage} · {m.frequency} · {m.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {selectedRx.instructions && (
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-amber-600 uppercase font-semibold mb-1">Instructions</p>
                <p className="text-sm text-slate-600">{selectedRx.instructions}</p>
              </div>
            )}
            {selectedRx.follow_up_date && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <Calendar size={16} />
                Follow-up date: {formatDate(selectedRx.follow_up_date)}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function PrescriptionFormModal({
  onClose,
  onSubmit,
  patients,
  doctors,
  medicines,
}: {
  onClose: () => void;
  onSubmit: (f: any) => void;
  patients: Patient[];
  doctors: Staff[];
  medicines: any[];
}) {
  const [form, setForm] = useState({
    patient_id: '',
    doctor_id: '',
    diagnosis: '',
    instructions: '',
    follow_up_date: '',
    medicines: [{ medicine: '', dosage: '', frequency: '', duration: '' }],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const addMed = () => setForm({ ...form, medicines: [...form.medicines, { medicine: '', dosage: '', frequency: '', duration: '' }] });
  const removeMed = (i: number) => setForm({ ...form, medicines: form.medicines.filter((_, idx) => idx !== i) });
  const updateMed = (i: number, field: string, value: string) => {
    const meds = [...form.medicines];
    meds[i] = { ...meds[i], [field]: value };
    setForm({ ...form, medicines: meds });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="New Digital Prescription" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Patient *</label>
            <select className="input" required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Doctor *</label>
            <select className="input" required value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}>
              <option value="">Select doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name} — {d.department}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Diagnosis *</label>
          <input className="input" required value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Medicines</label>
            <button type="button" onClick={addMed} className="text-sm text-brand-600 font-medium hover:text-brand-700">+ Add Medicine</button>
          </div>
          <div className="space-y-2">
            {form.medicines.map((med, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-start">
                <select
                  className="input col-span-4"
                  value={med.medicine}
                  onChange={(e) => updateMed(i, 'medicine', e.target.value)}
                >
                  <option value="">Select medicine</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.name}>{m.name} ({m.strength})</option>
                  ))}
                </select>
                <input className="input col-span-2" placeholder="Dosage" value={med.dosage} onChange={(e) => updateMed(i, 'dosage', e.target.value)} />
                <input className="input col-span-3" placeholder="Frequency" value={med.frequency} onChange={(e) => updateMed(i, 'frequency', e.target.value)} />
                <input className="input col-span-2" placeholder="Duration" value={med.duration} onChange={(e) => updateMed(i, 'duration', e.target.value)} />
                {form.medicines.length > 1 && (
                  <button type="button" onClick={() => removeMed(i)} className="col-span-1 text-rose-500 hover:text-rose-700 pt-2">×</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Instructions</label>
          <textarea className="input" rows={2} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
        </div>
        <div>
          <label className="label">Follow-up Date</label>
          <input type="date" className="input" value={form.follow_up_date} onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Create Prescription</button>
        </div>
      </form>
    </Modal>
  );
}
