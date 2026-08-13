import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Vital, NursingNote, Patient } from '@/lib/types';
import { PageHeader, LoadingSpinner, Avatar, EmptyState } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { formatDateTime, formatDate } from '@/lib/utils';
import {
  HeartPulse, Activity, Thermometer, Wind, Droplet, Plus, FileText,
  Stethoscope, Clock, Moon, Sun, Sunrise, Pill, ClipboardList,
  TrendingUp, AlertTriangle, CheckCircle2, User, Phone, Search,
} from 'lucide-react';

type Tab = 'vitals' | 'notes' | 'roster' | 'medication' | 'assignments';

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
  const [showMedModal, setShowMedModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [medRecords, setMedRecords] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => { loadData(); }, []);

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

    const medData = (n || []).filter((note: any) => note.medication_administered).map((note: any) => ({
      id: note.id,
      patient_name: note.patient_name,
      nurse_name: note.nurse_name,
      shift: note.shift,
      medication: note.medication_administered,
      care_plan: note.care_plan,
      time: note.recorded_at,
    }));
    setMedRecords(medData);

    const shiftMap: Record<string, string> = { Morning: 'Morning', Evening: 'Evening', Night: 'Night' };
    const assignData = (p || []).map((pat: any, i: number) => ({
      id: pat.id,
      patient_name: pat.name,
      bed_number: pat.assigned_doctor ? `Bed ${i + 1}` : '-',
      department: pat.department || 'General',
      nurse_name: (ns || [])[i % Math.max(ns.length, 1)]?.name || 'Unassigned',
      nurse_id: (ns || [])[i % Math.max(ns.length, 1)]?.id || null,
      shift: (ns || [])[i % Math.max(ns.length, 1)]?.shift || 'Morning',
      status: pat.status,
    }));
    setAssignments(assignData);
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

  async function addMedication(form: any) {
    const patient = patients.find((p) => p.id === form.patient_id);
    const nurse = nurses.find((n) => n.id === form.nurse_id);
    await supabase.from('nursing_notes').insert({
      patient_id: form.patient_id,
      patient_name: patient?.name,
      nurse_id: form.nurse_id,
      nurse_name: nurse?.name,
      shift: form.shift,
      note: `Medication administered: ${form.medication}`,
      care_plan: form.care_plan || null,
      medication_administered: form.medication,
    });
    setShowMedModal(false);
    loadData();
  }

  async function assignNurse(form: any) {
    const patient = patients.find((p) => p.id === form.patient_id);
    const nurse = nurses.find((n) => n.id === form.nurse_id);
    setAssignments((prev) =>
      prev.map((a) => a.id === form.patient_id ? { ...a, nurse_name: nurse?.name, nurse_id: nurse?.id, shift: nurse?.shift } : a)
    );
    setShowAssignModal(false);
  }

  if (loading) return <LoadingSpinner />;

  const tabs = [
    { id: 'vitals' as Tab, label: 'Patient Vitals', icon: Activity, color: 'rose' },
    { id: 'notes' as Tab, label: 'Nursing Notes', icon: FileText, color: 'blue' },
    { id: 'medication' as Tab, label: 'Medication', icon: Pill, color: 'emerald' },
    { id: 'roster' as Tab, label: 'Duty Roster', icon: HeartPulse, color: 'amber' },
    { id: 'assignments' as Tab, label: 'Patient Assignment', icon: ClipboardList, color: 'cyan' },
  ];

  const tabColors: Record<string, string> = {
    rose: 'bg-rose-500 text-white shadow-rose-200',
    blue: 'bg-blue-500 text-white shadow-blue-200',
    emerald: 'bg-emerald-500 text-white shadow-emerald-200',
    amber: 'bg-amber-500 text-white shadow-amber-200',
    cyan: 'bg-cyan-500 text-white shadow-cyan-200',
  };

  const headerActions: Record<Tab, { label: string; onClick: () => void } | null> = {
    vitals: { label: 'Record Vitals', onClick: () => setShowVitalModal(true) },
    notes: { label: 'Add Note', onClick: () => setShowNoteModal(true) },
    medication: { label: 'Administer Med', onClick: () => setShowMedModal(true) },
    roster: null,
    assignments: { label: 'Assign Nurse', onClick: () => setShowAssignModal(true) },
  };

  const activeAction = headerActions[tab];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Nursing Management"
        subtitle="Patient vitals, nursing notes, medication, and duty roster"
        action={
          activeAction ? (
            <button className="btn-primary" onClick={activeAction.onClick}>
              <Plus size={18} /> {activeAction.label}
            </button>
          ) : undefined
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-500 rounded-lg flex items-center justify-center">
              <Activity className="text-white" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-rose-700">{vitals.length}</p>
              <p className="text-xs text-rose-600 font-medium">Vitals Recorded</p>
            </div>
          </div>
        </div>
        <div className="card p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <FileText className="text-white" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{notes.length}</p>
              <p className="text-xs text-blue-600 font-medium">Nursing Notes</p>
            </div>
          </div>
        </div>
        <div className="card p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Pill className="text-white" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700">{medRecords.length}</p>
              <p className="text-xs text-emerald-600 font-medium">Medications Given</p>
            </div>
          </div>
        </div>
        <div className="card p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <HeartPulse className="text-white" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{nurses.length}</p>
              <p className="text-xs text-amber-600 font-medium">Nurses On Duty</p>
            </div>
          </div>
        </div>
      </div>

      {/* Colorful Tab Bar */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? `${tabColors[t.color]} shadow-lg`
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Vitals Tab */}
      {tab === 'vitals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vitals.length === 0 ? (
            <div className="col-span-full"><EmptyState message="No vitals recorded yet" /></div>
          ) : (
            vitals.map((v) => {
              const tempHigh = v.temperature && v.temperature > 37.5;
              const spo2Low = v.oxygen_saturation && v.oxygen_saturation < 95;
              const bpHigh = v.blood_pressure_systolic && v.blood_pressure_systolic > 140;
              return (
                <div key={v.id} className="card-hover p-4 border-l-4 border-l-rose-400">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={v.patient_name || ''} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">{v.patient_name}</p>
                        <p className="text-xs text-slate-400">{formatDateTime(v.recorded_at)}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md">by {v.recorded_by}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <VitalChip icon={<Thermometer size={14} />} label="Temp" value={v.temperature ? `${v.temperature}°` : '-'} danger={tempHigh} color="rose" />
                    <VitalChip icon={<HeartPulse size={14} />} label="BP" value={v.blood_pressure_systolic ? `${v.blood_pressure_systolic}/${v.blood_pressure_diastolic}` : '-'} danger={bpHigh} color="blue" />
                    <VitalChip icon={<Activity size={14} />} label="Pulse" value={v.pulse ? `${v.pulse}` : '-'} color="emerald" />
                    <VitalChip icon={<Wind size={14} />} label="Resp" value={v.respiratory_rate ? `${v.respiratory_rate}` : '-'} color="amber" />
                    <VitalChip icon={<Droplet size={14} />} label="SpO2" value={v.oxygen_saturation ? `${v.oxygen_saturation}%` : '-'} danger={spo2Low} color="cyan" />
                    <VitalChip icon={<Activity size={14} />} label="Wt" value={v.weight ? `${v.weight}kg` : '-'} color="slate" />
                  </div>
                  {v.notes && <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">{v.notes}</p>}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Notes Tab */}
      {tab === 'notes' && (
        <div className="card overflow-hidden">
          {notes.length === 0 ? (
            <EmptyState message="No nursing notes yet" />
          ) : (
            <div className="divide-y divide-slate-50">
              {notes.map((n) => {
                const shiftColor = n.shift === 'Morning' ? 'bg-amber-100 text-amber-700' : n.shift === 'Evening' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700';
                return (
                  <div key={n.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar name={n.patient_name || ''} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">{n.patient_name}</p>
                          <p className="text-xs text-slate-400">By {n.nurse_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${shiftColor}`}>{n.shift}</span>
                        <span className="text-xs text-slate-400">{formatDateTime(n.recorded_at)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">{n.note}</p>
                    {n.care_plan && (
                      <div className="mt-2 text-xs text-blue-700 bg-blue-50 rounded-lg p-2 flex items-start gap-2">
                        <ClipboardList size={14} className="mt-0.5 flex-shrink-0" />
                        <span><span className="font-medium">Care Plan:</span> {n.care_plan}</span>
                      </div>
                    )}
                    {n.medication_administered && (
                      <div className="mt-1 text-xs text-emerald-700 bg-emerald-50 rounded-lg p-2 flex items-start gap-2">
                        <Pill size={14} className="mt-0.5 flex-shrink-0" />
                        <span><span className="font-medium">Medication:</span> {n.medication_administered}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Medication Tab */}
      {tab === 'medication' && (
        <div className="card overflow-hidden">
          {medRecords.length === 0 ? (
            <EmptyState message="No medication administration records yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="table-header">Patient</th>
                    <th className="table-header">Nurse</th>
                    <th className="table-header">Shift</th>
                    <th className="table-header">Medication</th>
                    <th className="table-header">Care Plan</th>
                    <th className="table-header">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {medRecords.map((m) => {
                    const shiftColor = m.shift === 'Morning' ? 'bg-amber-100 text-amber-700' : m.shift === 'Evening' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700';
                    return (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <Avatar name={m.patient_name || ''} size="sm" />
                            <span className="font-medium">{m.patient_name}</span>
                          </div>
                        </td>
                        <td className="table-cell text-slate-600">{m.nurse_name}</td>
                        <td className="table-cell"><span className={`badge ${shiftColor}`}>{m.shift}</span></td>
                        <td className="table-cell">
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg text-xs font-medium">
                            <Pill size={12} /> {m.medication}
                          </span>
                        </td>
                        <td className="table-cell text-xs text-slate-500">{m.care_plan || '-'}</td>
                        <td className="table-cell text-xs text-slate-500">{formatDateTime(m.time)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Roster Tab */}
      {tab === 'roster' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Morning', icon: Sunrise, color: 'amber', bg: 'from-amber-50 to-amber-100', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', iconBg: 'bg-amber-500' },
            { name: 'Evening', icon: Sun, color: 'orange', bg: 'from-orange-50 to-orange-100', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', iconBg: 'bg-orange-500' },
            { name: 'Night', icon: Moon, color: 'indigo', bg: 'from-indigo-50 to-indigo-100', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-700', iconBg: 'bg-indigo-500' },
          ].map((shift) => {
            const shiftNurses = nurses.filter((n) => n.shift === shift.name);
            const ShiftIcon = shift.icon;
            return (
              <div key={shift.name} className={`card p-5 bg-gradient-to-br ${shift.bg} ${shift.border}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${shift.iconBg} rounded-lg flex items-center justify-center`}>
                      <ShiftIcon className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{shift.name} Shift</h3>
                      <p className="text-xs text-slate-500">
                        {shift.name === 'Morning' ? '6:00 AM - 2:00 PM' : shift.name === 'Evening' ? '2:00 PM - 10:00 PM' : '10:00 PM - 6:00 AM'}
                      </p>
                    </div>
                  </div>
                  <span className={`badge ${shift.badge}`}>{shiftNurses.length} nurses</span>
                </div>
                <div className="space-y-2">
                  {shiftNurses.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No nurses assigned</p>
                  ) : (
                    shiftNurses.map((n) => (
                      <div key={n.id} className="flex items-center gap-3 p-2.5 bg-white/70 rounded-lg hover:bg-white transition-colors">
                        <Avatar name={n.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{n.name}</p>
                          <p className="text-xs text-slate-400 truncate">{n.specialization || 'General Nurse'}</p>
                        </div>
                        <span className={`badge ${n.status === 'Active' ? 'badge-green' : 'badge-gray'}`}>{n.status}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assignments Tab */}
      {tab === 'assignments' && (
        <div>
          <div className="relative mb-4">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-10" placeholder="Search patients..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.filter((a) => a.patient_name?.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
              <div className="col-span-full"><EmptyState message="No admitted patients to assign" /></div>
            ) : (
              assignments
                .filter((a) => a.patient_name?.toLowerCase().includes(search.toLowerCase()))
                .map((a) => {
                  const shiftColor = a.shift === 'Morning' ? 'bg-amber-100 text-amber-700' : a.shift === 'Evening' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700';
                  return (
                    <div key={a.id} className="card-hover p-4 border-l-4 border-l-cyan-400">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={a.patient_name || ''} size="md" />
                          <div>
                            <p className="text-sm font-medium text-slate-700">{a.patient_name}</p>
                            <p className="text-xs text-slate-400">{a.department}</p>
                          </div>
                        </div>
                        <span className="badge-red">Admitted</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                          <span className="text-slate-500 flex items-center gap-1.5"><User size={14} /> Assigned Nurse</span>
                          <span className="font-medium text-slate-700">{a.nurse_name}</span>
                        </div>
                        <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                          <span className="text-slate-500 flex items-center gap-1.5"><Clock size={14} /> Shift</span>
                          <span className={`badge ${shiftColor}`}>{a.shift}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {showVitalModal && <VitalFormModal onClose={() => setShowVitalModal(false)} onSubmit={addVital} patients={patients} />}
      {showNoteModal && <NoteFormModal onClose={() => setShowNoteModal(false)} onSubmit={addNote} patients={patients} nurses={nurses} />}
      {showMedModal && <MedFormModal onClose={() => setShowMedModal(false)} onSubmit={addMedication} patients={patients} nurses={nurses} />}
      {showAssignModal && <AssignFormModal onClose={() => setShowAssignModal(false)} onSubmit={assignNurse} patients={patients} nurses={nurses} />}
    </div>
  );
}

function VitalChip({ icon, label, value, danger, color }: { icon: React.ReactNode; label: string; value: string; danger?: boolean; color: string }) {
  const colorMap: Record<string, string> = {
    rose: 'bg-rose-50 text-rose-700',
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    cyan: 'bg-cyan-50 text-cyan-700',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <div className={`rounded-lg px-2 py-1.5 ${danger ? 'bg-red-100 text-red-700 ring-1 ring-red-300' : colorMap[color]}`}>
      <div className="flex items-center gap-1 text-xs opacity-70">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-sm font-bold mt-0.5">{value}</p>
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
            {patients.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
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
  const [form, setForm] = useState({ patient_id: '', nurse_id: '', shift: 'Morning', note: '', care_plan: '', medication_administered: '' });

  return (
    <Modal isOpen={true} onClose={onClose} title="Add Nursing Note" size="md">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Patient *</label>
            <select className="input" required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
              <option value="">Select patient</option>
              {patients.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>
          <div>
            <label className="label">Nurse</label>
            <select className="input" value={form.nurse_id} onChange={(e) => setForm({ ...form, nurse_id: e.target.value })}>
              <option value="">Select nurse</option>
              {nurses.map((n) => (<option key={n.id} value={n.id}>{n.name}</option>))}
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

function MedFormModal({ onClose, onSubmit, patients, nurses }: { onClose: () => void; onSubmit: (f: any) => void; patients: Patient[]; nurses: any[] }) {
  const [form, setForm] = useState({ patient_id: '', nurse_id: '', shift: 'Morning', medication: '', care_plan: '' });

  return (
    <Modal isOpen={true} onClose={onClose} title="Administer Medication" size="md">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Patient *</label>
            <select className="input" required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
              <option value="">Select patient</option>
              {patients.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>
          <div>
            <label className="label">Nurse *</label>
            <select className="input" required value={form.nurse_id} onChange={(e) => setForm({ ...form, nurse_id: e.target.value })}>
              <option value="">Select nurse</option>
              {nurses.map((n) => (<option key={n.id} value={n.id}>{n.name}</option>))}
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
          <label className="label">Medication *</label>
          <input className="input" required placeholder="e.g. Paracetamol 500mg - 1 tablet" value={form.medication} onChange={(e) => setForm({ ...form, medication: e.target.value })} />
        </div>
        <div>
          <label className="label">Care Plan / Instructions</label>
          <textarea className="input" rows={2} value={form.care_plan} onChange={(e) => setForm({ ...form, care_plan: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Record</button>
        </div>
      </form>
    </Modal>
  );
}

function AssignFormModal({ onClose, onSubmit, patients, nurses }: { onClose: () => void; onSubmit: (f: any) => void; patients: Patient[]; nurses: any[] }) {
  const [form, setForm] = useState({ patient_id: '', nurse_id: '' });

  return (
    <Modal isOpen={true} onClose={onClose} title="Assign Nurse to Patient" size="md">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
        <div>
          <label className="label">Patient *</label>
          <select className="input" required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
            <option value="">Select patient</option>
            {patients.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
          </select>
        </div>
        <div>
          <label className="label">Nurse *</label>
          <select className="input" required value={form.nurse_id} onChange={(e) => setForm({ ...form, nurse_id: e.target.value })}>
            <option value="">Select nurse</option>
            {nurses.map((n) => (<option key={n.id} value={n.id}>{n.name} - {n.shift} shift</option>))}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Assign</button>
        </div>
      </form>
    </Modal>
  );
}
