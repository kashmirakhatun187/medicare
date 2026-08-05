import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Vital, NursingNote, Patient } from '@/lib/types';
import { PageHeader, LoadingSpinner, Avatar, EmptyState } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { formatDateTime, formatDate } from '@/lib/utils';
import { HeartPulse, Activity, Thermometer, Wind, Droplet, Plus, FileText } from 'lucide-react';

type Tab = 'vitals' | 'notes' | 'roster';

export function NursingPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('vitals');
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [notes, setNotes] = useState<NursingNote[]>([]);
  const [nurses, setNurses] = useState<any[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVitalModal, setShowVitalModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: v }, { data: n }, { data: ns }, { data: p }] = await Promise.all([
      supabase.from('vitals').select('*').order('recorded_at', { ascending: false }).limit(20),
      supabase.from('nursing_notes').select('*').order('recorded_at', { ascending: false }).limit(20),
      supabase.from('staff').select('*').eq('role', 'Nurse').order('name'),
      supabase.from('patients').select('*').eq('patient_type', 'IPD').eq('status', 'Admitted'),
    ]);
    setVitals(v || []);
    setNotes(n || []);
    setNurses(ns || []);
    setPatients(p || []);
    setLoading(false);
  }

  async function addVital(form: any) {
    const patient = patients.find((p) => p.id === form.patient_id);
    await supabase.from('vitals').insert({
      ...form,
      patient_name: patient?.name,
      recorded_by: user?.full_name || 'Staff',
    });
    setShowVitalModal(false);
    loadData();
  }

  async function addNote(form: any) {
    const patient = patients.find((p) => p.id === form.patient_id);
    const nurse = nurses.find((n) => n.id === form.nurse_id);
    await supabase.from('nursing_notes').insert({
      ...form,
      patient_name: patient?.name,
      nurse_name: nurse?.name,
    });
    setShowNoteModal(false);
    loadData();
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Nursing Management"
        subtitle="Patient vitals, nursing notes, and duty roster"
        action={
          tab === 'vitals' ? (
            <button className="btn-primary" onClick={() => setShowVitalModal(true)}>
              <Plus size={18} /> Record Vitals
            </button>
          ) : tab === 'notes' ? (
            <button className="btn-primary" onClick={() => setShowNoteModal(true)}>
              <Plus size={18} /> Add Note
            </button>
          ) : undefined
        }
      />

      <div className="flex gap-2 mb-6">
        {([
          { id: 'vitals', label: 'Patient Vitals', icon: Activity },
          { id: 'notes', label: 'Nursing Notes', icon: FileText },
          { id: 'roster', label: 'Duty Roster', icon: HeartPulse },
        ] as const).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                tab === t.id ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'vitals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vitals.length === 0 ? (
            <div className="col-span-full"><EmptyState message="No vitals recorded yet" /></div>
          ) : (
            vitals.map((v) => (
              <div key={v.id} className="card-hover p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={v.patient_name || ''} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">{v.patient_name}</p>
                      <p className="text-xs text-slate-400">{formatDateTime(v.recorded_at)}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <VitalItem icon={<Thermometer size={14} />} label="Temp" value={v.temperature ? `${v.temperature}°C` : '-'} />
                  <VitalItem icon={<Activity size={14} />} label="BP" value={v.blood_pressure_systolic ? `${v.blood_pressure_systolic}/${v.blood_pressure_diastolic}` : '-'} />
                  <VitalItem icon={<HeartPulse size={14} />} label="Pulse" value={v.pulse ? `${v.pulse} bpm` : '-'} />
                  <VitalItem icon={<Wind size={14} />} label="Resp" value={v.respiratory_rate ? `${v.respiratory_rate}/min` : '-'} />
                  <VitalItem icon={<Droplet size={14} />} label="SpO2" value={v.oxygen_saturation ? `${v.oxygen_saturation}%` : '-'} />
                  <VitalItem icon={<Activity size={14} />} label="Weight" value={v.weight ? `${v.weight} kg` : '-'} />
                </div>
                {v.notes && <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">{v.notes}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'notes' && (
        <div className="card overflow-hidden">
          {notes.length === 0 ? (
            <EmptyState message="No nursing notes yet" />
          ) : (
            <div className="divide-y divide-slate-50">
              {notes.map((n) => (
                <div key={n.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={n.patient_name || ''} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">{n.patient_name}</p>
                        <p className="text-xs text-slate-400">By {n.nurse_name} · {n.shift} shift</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{formatDateTime(n.recorded_at)}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">{n.note}</p>
                  {n.care_plan && (
                    <div className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-2">
                      <span className="font-medium">Care Plan:</span> {n.care_plan}
                    </div>
                  )}
                  {n.medication_administered && (
                    <div className="mt-1 text-xs text-slate-500">
                      <span className="font-medium">Medication:</span> {n.medication_administered}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'roster' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Morning', 'Evening', 'Night'].map((shift) => {
            const shiftNurses = nurses.filter((n) => n.shift === shift);
            return (
              <div key={shift} className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800">{shift} Shift</h3>
                  <span className="badge-teal">{shiftNurses.length} nurses</span>
                </div>
                <div className="space-y-3">
                  {shiftNurses.map((n) => (
                    <div key={n.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <Avatar name={n.name} size="sm" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700">{n.name}</p>
                        <p className="text-xs text-slate-400">{n.specialization}</p>
                      </div>
                      <span className={`badge ${n.status === 'Active' ? 'badge-green' : 'badge-gray'}`}>{n.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showVitalModal && (
        <VitalFormModal onClose={() => setShowVitalModal(false)} onSubmit={addVital} patients={patients} />
      )}
      {showNoteModal && (
        <NoteFormModal onClose={() => setShowNoteModal(false)} onSubmit={addNote} patients={patients} nurses={nurses} />
      )}
    </div>
  );
}

function VitalItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-600">
      <span className="text-slate-400">{icon}</span>
      <span className="text-xs text-slate-400">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function VitalFormModal({ onClose, onSubmit, patients }: { onClose: () => void; onSubmit: (f: any) => void; patients: Patient[] }) {
  const [form, setForm] = useState({
    patient_id: '',
    temperature: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    pulse: '',
    respiratory_rate: '',
    oxygen_saturation: '',
    weight: '',
    height: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      temperature: form.temperature ? parseFloat(form.temperature) : null,
      blood_pressure_systolic: form.blood_pressure_systolic ? parseInt(form.blood_pressure_systolic) : null,
      blood_pressure_diastolic: form.blood_pressure_diastolic ? parseInt(form.blood_pressure_diastolic) : null,
      pulse: form.pulse ? parseInt(form.pulse) : null,
      respiratory_rate: form.respiratory_rate ? parseInt(form.respiratory_rate) : null,
      oxygen_saturation: form.oxygen_saturation ? parseInt(form.oxygen_saturation) : null,
      weight: form.weight ? parseFloat(form.weight) : null,
      height: form.height ? parseFloat(form.height) : null,
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Record Patient Vitals" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Patient *</label>
          <select className="input" required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
            <option value="">Select patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Temperature (°C)</label>
            <input type="number" step="0.1" className="input" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} />
          </div>
          <div>
            <label className="label">Pulse (bpm)</label>
            <input type="number" className="input" value={form.pulse} onChange={(e) => setForm({ ...form, pulse: e.target.value })} />
          </div>
          <div>
            <label className="label">BP Systolic</label>
            <input type="number" className="input" value={form.blood_pressure_systolic} onChange={(e) => setForm({ ...form, blood_pressure_systolic: e.target.value })} />
          </div>
          <div>
            <label className="label">BP Diastolic</label>
            <input type="number" className="input" value={form.blood_pressure_diastolic} onChange={(e) => setForm({ ...form, blood_pressure_diastolic: e.target.value })} />
          </div>
          <div>
            <label className="label">Resp Rate (/min)</label>
            <input type="number" className="input" value={form.respiratory_rate} onChange={(e) => setForm({ ...form, respiratory_rate: e.target.value })} />
          </div>
          <div>
            <label className="label">SpO2 (%)</label>
            <input type="number" className="input" value={form.oxygen_saturation} onChange={(e) => setForm({ ...form, oxygen_saturation: e.target.value })} />
          </div>
          <div>
            <label className="label">Weight (kg)</label>
            <input type="number" step="0.1" className="input" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
          </div>
          <div>
            <label className="label">Height (cm)</label>
            <input type="number" className="input" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Record Vitals</button>
        </div>
      </form>
    </Modal>
  );
}

function NoteFormModal({ onClose, onSubmit, patients, nurses }: { onClose: () => void; onSubmit: (f: any) => void; patients: Patient[]; nurses: any[] }) {
  const [form, setForm] = useState({
    patient_id: '',
    nurse_id: '',
    shift: 'Morning',
    note: '',
    care_plan: '',
    medication_administered: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Add Nursing Note" size="md">
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
            <label className="label">Nurse</label>
            <select className="input" value={form.nurse_id} onChange={(e) => setForm({ ...form, nurse_id: e.target.value })}>
              <option value="">Select nurse</option>
              {nurses.map((n) => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Shift</label>
          <select className="input" value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })}>
            <option>Morning</option>
            <option>Evening</option>
            <option>Night</option>
          </select>
        </div>
        <div>
          <label className="label">Note *</label>
          <textarea className="input" required rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>
        <div>
          <label className="label">Care Plan</label>
          <input className="input" value={form.care_plan} onChange={(e) => setForm({ ...form, care_plan: e.target.value })} />
        </div>
        <div>
          <label className="label">Medication Administered</label>
          <input className="input" value={form.medication_administered} onChange={(e) => setForm({ ...form, medication_administered: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Add Note</button>
        </div>
      </form>
    </Modal>
  );
}
