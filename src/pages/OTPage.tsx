import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { OTSchedule } from '@/lib/types';
import { PageHeader, LoadingSpinner, StatusBadge, EmptyState, StatCard } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { formatDate, formatTime } from '@/lib/utils';
import { Scissors, Plus, Clock, User, Building } from 'lucide-react';

export function OTPage() {
  const [schedules, setSchedules] = useState<OTSchedule[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: s }, { data: p }, { data: st }] = await Promise.all([
      supabase.from('ot_schedules').select('*').order('scheduled_date'),
      supabase.from('patients').select('id, name, department').eq('status', 'Active'),
      supabase.from('staff').select('id, name, department').eq('role', 'Doctor').eq('status', 'Active'),
    ]);
    setSchedules(s || []);
    setPatients(p || []);
    setStaff(st || []);
    setLoading(false);
  }

  async function scheduleSurgery(form: any) {
    const patient = patients.find((p) => p.id === form.patient_id);
    await supabase.from('ot_schedules').insert({
      ...form,
      patient_name: patient?.name,
      department: patient?.department,
      status: 'Scheduled',
    });
    setShowModal(false);
    loadData();
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('ot_schedules').update({ status }).eq('id', id);
    loadData();
  }

  const scheduled = schedules.filter((s) => s.status === 'Scheduled').length;
  const completed = schedules.filter((s) => s.status === 'Completed').length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Operation Theatre"
        subtitle="OT scheduling, surgery management, and staff allocation"
        action={
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Schedule Surgery
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Surgeries" value={schedules.length} icon={<Scissors size={22} />} color="brand" />
        <StatCard label="Scheduled" value={scheduled} icon={<Clock size={22} />} color="amber" />
        <StatCard label="Completed" value={completed} icon={<Scissors size={22} />} color="emerald" />
        <StatCard label="OT Rooms" value={new Set(schedules.map((s) => s.ot_room).filter(Boolean)).size || 2} icon={<Building size={22} />} color="blue" />
      </div>

      <div className="card overflow-hidden">
        {schedules.length === 0 ? (
          <EmptyState message="No surgeries scheduled" />
        ) : (
          <div className="divide-y divide-slate-50">
            {schedules.map((s) => (
              <div key={s.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Scissors size={20} className="text-brand-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-700">{s.surgery_name}</h4>
                        <StatusBadge status={s.status} />
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">{s.patient_name} · {s.department}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><User size={12} /> {s.surgeon_name}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(s.scheduled_date)} at {formatTime(s.scheduled_time)}</span>
                        <span>Duration: {s.duration_minutes} min</span>
                        <span>OT: {s.ot_room}</span>
                        {s.anesthetist_name && <span>Anesthetist: {s.anesthetist_name}</span>}
                      </div>
                      {s.notes && <p className="text-xs text-slate-500 mt-1.5">{s.notes}</p>}
                    </div>
                  </div>
                  {s.status === 'Scheduled' && (
                    <button
                      onClick={() => updateStatus(s.id, 'Completed')}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors whitespace-nowrap"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <SurgeryFormModal onClose={() => setShowModal(false)} onSubmit={scheduleSurgery} patients={patients} staff={staff} />
      )}
    </div>
  );
}

function SurgeryFormModal({ onClose, onSubmit, patients, staff }: { onClose: () => void; onSubmit: (f: any) => void; patients: any[]; staff: any[] }) {
  const [form, setForm] = useState({
    patient_id: '',
    surgery_name: '',
    surgeon_name: '',
    anesthetist_name: '',
    ot_room: 'OT-1',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '10:00',
    duration_minutes: '60',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, duration_minutes: parseInt(form.duration_minutes) || 60 });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Schedule Surgery" size="md">
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
        <div>
          <label className="label">Surgery Name *</label>
          <input className="input" required value={form.surgery_name} onChange={(e) => setForm({ ...form, surgery_name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Surgeon</label>
            <select className="input" value={form.surgeon_name} onChange={(e) => setForm({ ...form, surgeon_name: e.target.value })}>
              <option value="">Select surgeon</option>
              {staff.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Anesthetist</label>
            <select className="input" value={form.anesthetist_name} onChange={(e) => setForm({ ...form, anesthetist_name: e.target.value })}>
              <option value="">Select anesthetist</option>
              {staff.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">OT Room</label>
            <select className="input" value={form.ot_room} onChange={(e) => setForm({ ...form, ot_room: e.target.value })}>
              <option>OT-1</option>
              <option>OT-2</option>
            </select>
          </div>
          <div>
            <label className="label">Duration (min)</label>
            <input type="number" className="input" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
          </div>
          <div>
            <label className="label">Date *</label>
            <input type="date" className="input" required value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} />
          </div>
          <div>
            <label className="label">Time *</label>
            <input type="time" className="input" required value={form.scheduled_time} onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Schedule Surgery</button>
        </div>
      </form>
    </Modal>
  );
}
