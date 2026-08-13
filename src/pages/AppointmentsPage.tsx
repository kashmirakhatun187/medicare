import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Appointment } from '@/lib/types';
import { PageHeader, LoadingSpinner, StatusBadge, EmptyState } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { formatDate, formatTime } from '@/lib/utils';
import { CalendarPlus, Clock, User, Stethoscope } from 'lucide-react';

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadAppointments();
    loadOptions();
  }, [filterDate]);

  async function loadAppointments() {
    setLoading(true);
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('appointment_date', filterDate)
      .order('appointment_time');
    setAppointments(data || []);
    setLoading(false);
  }

  async function loadOptions() {
    const [{ data: p }, { data: d }] = await Promise.all([
      supabase.from('patients').select('id, name, department').eq('status', 'Active'),
      supabase.from('staff').select('id, name, department, consultation_fee').eq('role', 'Doctor').eq('status', 'Active'),
    ]);
    setPatients(p || []);
    setDoctors(d || []);
  }

  async function bookAppointment(form: any) {
    const patient = patients.find((p) => p.id === form.patient_id);
    const doctor = doctors.find((d) => d.id === form.doctor_id);
    const count = appointments.length + 1;
    await supabase.from('appointments').insert({
      ...form,
      patient_name: patient?.name,
      doctor_name: doctor?.name,
      department: doctor?.department,
      token_number: count,
      status: 'Scheduled',
    });
    setShowModal(false);
    loadAppointments();
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('appointments').update({ status }).eq('id', id);
    loadAppointments();
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Appointments"
        subtitle="OPD appointment booking and token management"
        action={
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <CalendarPlus size={18} />
            Book Appointment
          </button>
        }
      />

      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm text-slate-600 font-medium">Date:</label>
        <input
          type="date"
          className="input w-48"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
        <span className="badge-blue">{appointments.length} appointments</span>
      </div>

      <div className="card overflow-hidden">
        {appointments.length === 0 ? (
          <EmptyState message="No appointments for this date" />
        ) : (
          <div className="divide-y divide-slate-50">
            {appointments.map((a) => (
              <div key={a.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-xs text-brand-600 font-bold">#{a.token_number}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-700">{a.patient_name}</p>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Clock size={12} /> {formatTime(a.appointment_time)}</span>
                    <span className="flex items-center gap-1"><Stethoscope size={12} /> {a.doctor_name}</span>
                    <span>{a.department}</span>
                    {a.reason && <span>· {a.reason}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {a.status === 'Scheduled' && (
                    <>
                      <button
                        onClick={() => updateStatus(a.id, 'Completed')}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => updateStatus(a.id, 'Cancelled')}
                        className="text-xs font-medium text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AppointmentFormModal
          onClose={() => setShowModal(false)}
          onSubmit={bookAppointment}
          patients={patients}
          doctors={doctors}
        />
      )}
    </div>
  );
}

function AppointmentFormModal({
  onClose,
  onSubmit,
  patients,
  doctors,
}: {
  onClose: () => void;
  onSubmit: (form: any) => void;
  patients: any[];
  doctors: any[];
}) {
  const [form, setForm] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '10:00',
    reason: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Book Appointment" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Patient *</label>
          <select className="input" required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
            <option value="">Select patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.department})</option>
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Date *</label>
            <input type="date" className="input" required value={form.appointment_date} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })} />
          </div>
          <div>
            <label className="label">Time *</label>
            <input type="time" className="input" required value={form.appointment_time} onChange={(e) => setForm({ ...form, appointment_time: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Reason for Visit</label>
          <input className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Book Appointment</button>
        </div>
      </form>
    </Modal>
  );
}
