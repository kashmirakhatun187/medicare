import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { LoadingSpinner, EmptyState, StatusBadge, Avatar } from '@/components/ui';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  CalendarClock, FileText, FlaskConical, CreditCard, Plus,
  Stethoscope, Activity, Pill, HeartPulse, Globe,
} from 'lucide-react';

type PortalPage = 'home' | 'appointments' | 'prescriptions' | 'lab' | 'billing';

export function PatientPortal({ onShowWebsite }: { onShowWebsite?: () => void }) {
  const { user, signOut } = useAuth();
  const [page, setPage] = useState<PortalPage>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems: { id: PortalPage; label: string; icon: typeof CalendarClock }[] = [
    { id: 'home', label: 'My Dashboard', icon: Activity },
    { id: 'appointments', label: 'My Appointments', icon: CalendarClock },
    { id: 'prescriptions', label: 'My Prescriptions', icon: FileText },
    { id: 'lab', label: 'Lab Results', icon: FlaskConical },
    { id: 'billing', label: 'My Bills', icon: CreditCard },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {sidebarOpen && <div className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 z-40 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
            <HeartPulse className="text-white" size={22} />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm">Patient Portal</h1>
            <p className="text-xs text-slate-400">MediCare</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button key={item.id} onClick={() => { setPage(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1 ${
                  active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                }`}>
                <Icon size={18} className={active ? 'text-brand-600' : 'text-slate-400'} />
                {item.label}
              </button>
            );
          })}
          {onShowWebsite && (
            <button onClick={onShowWebsite}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all mb-1 mt-2 border-t border-slate-100 pt-3">
              <Globe size={18} className="text-slate-400" />
              View Website
            </button>
          )}
        </nav>
        <div className="px-4 py-3 border-t border-slate-100">
          <button onClick={() => signOut()} className="text-sm text-slate-500 hover:text-rose-600 transition-colors">
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-600 p-2 rounded-lg">
            <Plus size={20} className="rotate-45" />
          </button>
          <div className="flex items-center gap-3">
            <Avatar name={user?.full_name || ''} size="sm" />
            <div>
              <p className="text-sm font-medium text-slate-700">{user?.full_name}</p>
              <span className="badge-blue text-xs">Patient</span>
            </div>
          </div>
          {onShowWebsite && (
            <button onClick={onShowWebsite} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-slate-100 px-3 py-2 rounded-lg transition-colors">
              <Globe size={18} />
              <span className="hidden sm:inline">View Website</span>
            </button>
          )}
        </header>
        <main className="flex-1 p-4 lg:p-6">
          {page === 'home' && <PatientHome setPage={setPage} />}
          {page === 'appointments' && <PatientAppointments />}
          {page === 'prescriptions' && <PatientPrescriptions />}
          {page === 'lab' && <PatientLabResults />}
          {page === 'billing' && <PatientBills />}
        </main>
      </div>
    </div>
  );
}

function PatientHome({ setPage }: { setPage: (p: PortalPage) => void }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({ appointments: 0, prescriptions: 0, labOrders: 0, bills: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const patientName = user?.full_name;
      if (!patientName) return;
      const [a, p, l, b] = await Promise.all([
        supabase.from('appointments').select('id', { count: 'exact' }).eq('patient_name', patientName),
        supabase.from('prescriptions').select('id', { count: 'exact' }).eq('patient_name', patientName),
        supabase.from('lab_orders').select('id', { count: 'exact' }).eq('patient_name', patientName),
        supabase.from('bills').select('id', { count: 'exact' }).eq('patient_name', patientName),
      ]);
      setStats({
        appointments: a.count || 0,
        prescriptions: p.count || 0,
        labOrders: l.count || 0,
        bills: b.count || 0,
      });
      setLoading(false);
    }
    load();
  }, [user]);

  if (loading) return <LoadingSpinner />;

  const cards = [
    { label: 'Appointments', value: stats.appointments, icon: CalendarClock, page: 'appointments' as PortalPage, color: 'brand' },
    { label: 'Prescriptions', value: stats.prescriptions, icon: FileText, page: 'prescriptions' as PortalPage, color: 'emerald' },
    { label: 'Lab Tests', value: stats.labOrders, icon: FlaskConical, page: 'lab' as PortalPage, color: 'amber' },
    { label: 'Bills', value: stats.bills, icon: CreditCard, page: 'billing' as PortalPage, color: 'blue' },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Welcome, {user?.full_name?.split(' ')[0]}</h1>
      <p className="text-sm text-slate-500 mb-6">Here's your health overview</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => {
          const Icon = c.icon;
          const colors: Record<string, string> = {
            brand: 'bg-brand-50 text-brand-600',
            emerald: 'bg-emerald-50 text-emerald-600',
            amber: 'bg-amber-50 text-amber-600',
            blue: 'bg-blue-50 text-blue-600',
          };
          return (
            <button key={c.label} onClick={() => setPage(c.page)} className="card-hover p-5 text-left">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${colors[c.color]}`}>
                <Icon size={22} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{c.value}</p>
              <p className="text-sm text-slate-500">{c.label}</p>
            </button>
          );
        })}
      </div>
      <div className="card p-6">
        <h2 className="font-bold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <button onClick={() => setPage('appointments')} className="flex items-center gap-3 p-4 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors">
            <CalendarClock size={20} /> <span className="font-medium text-sm">Book New Appointment</span>
          </button>
          <button onClick={() => setPage('billing')} className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
            <CreditCard size={20} /> <span className="font-medium text-sm">View & Pay Bills</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function PatientAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    if (!user?.full_name) return;
    const { data } = await supabase.from('appointments').select('*').eq('patient_name', user.full_name).order('date', { ascending: false });
    setAppointments(data || []);
    setLoading(false);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Appointments</h1>
          <p className="text-sm text-slate-500">View and book your appointments</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={18} /> Book Appointment</button>
      </div>
      <div className="space-y-3">
        {appointments.length === 0 ? (
          <EmptyState message="No appointments yet. Book one to get started." />
        ) : (
          appointments.map((a) => (
            <div key={a.id} className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center">
                  <Stethoscope className="text-brand-600" size={22} />
                </div>
                <div>
                  <p className="font-medium text-slate-700">{a.doctor_name || 'Doctor'}</p>
                  <p className="text-sm text-slate-500">{a.department || 'General'}</p>
                  <p className="text-xs text-slate-400">{formatDate(a.date)} at {a.time}</p>
                </div>
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))
        )}
      </div>
      {showForm && <AppointmentForm user={user} onClose={() => setShowForm(false)} onCreated={load} />}
    </div>
  );
}

function AppointmentForm({ user, onClose, onCreated }: { user: any; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ department: 'General Medicine', date: new Date().toISOString().split('T')[0], time: '10:00', notes: '' });
  const [doctors, setDoctors] = useState<any[]>([]);
  const [doctorId, setDoctorId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('staff').select('id, name, department').eq('role', 'Doctor').eq('status', 'Active').then(({ data }) => {
      setDoctors(data || []);
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const doctor = doctors.find((d) => d.id === doctorId);
    await supabase.from('appointments').insert({
      patient_name: user.full_name,
      patient_phone: user.phone,
      doctor_id: doctorId || null,
      doctor_name: doctor?.name || null,
      department: form.department,
      date: form.date,
      time: form.time,
      notes: form.notes,
      status: 'Scheduled',
    });
    setLoading(false);
    onClose();
    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-bold text-slate-800 mb-4">Book Appointment</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Department</label>
            <select className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
              {['General Medicine', 'General Surgery', 'Orthopedics', 'Gynecology & Obstetrics', 'Pediatrics', 'ENT', 'Cardiology', 'Neurology'].map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Doctor</label>
            <select className="input" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              <option value="">Any available doctor</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} — {d.department}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="label">Time</label>
              <input type="time" className="input" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Booking...' : 'Book'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PatientPrescriptions() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.full_name) return;
    supabase.from('prescriptions').select('*').eq('patient_name', user.full_name).order('created_at', { ascending: false }).then(({ data }) => {
      setPrescriptions(data || []);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">My Prescriptions</h1>
      <p className="text-sm text-slate-500 mb-6">Your digital prescriptions from doctors</p>
      <div className="space-y-4">
        {prescriptions.length === 0 ? (
          <EmptyState message="No prescriptions yet" />
        ) : (
          prescriptions.map((rx) => (
            <div key={rx.id} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-slate-800">{rx.diagnosis}</p>
                  <p className="text-sm text-slate-500">By {rx.doctor_name} · {formatDate(rx.created_at)}</p>
                </div>
                <StatusBadge status={rx.status} />
              </div>
              <div className="space-y-2">
                {(rx.medicines || []).map((m: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
                    <Pill size={16} className="text-brand-600" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">{m.medicine}</p>
                      <p className="text-xs text-slate-500">{m.dosage} · {m.frequency} · {m.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
              {rx.instructions && <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3 mt-3">{rx.instructions}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PatientLabResults() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.full_name) return;
    supabase.from('lab_orders').select('*').eq('patient_name', user.full_name).order('created_at', { ascending: false }).then(({ data }) => {
      setOrders(data || []);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Lab Results</h1>
      <p className="text-sm text-slate-500 mb-6">Your laboratory test results</p>
      <div className="space-y-3">
        {orders.length === 0 ? (
          <EmptyState message="No lab tests yet" />
        ) : (
          orders.map((o) => (
            <div key={o.id} className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                  <FlaskConical className="text-amber-600" size={22} />
                </div>
                <div>
                  <p className="font-medium text-slate-700">{o.test_name || 'Lab Test'}</p>
                  <p className="text-xs text-slate-400">{formatDate(o.created_at)}</p>
                </div>
              </div>
              <div className="text-right">
                <StatusBadge status={o.status} />
                {o.result && <p className="text-xs text-slate-500 mt-1">{o.result}</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PatientBills() {
  const { user } = useAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.full_name) return;
    supabase.from('bills').select('*').eq('patient_name', user.full_name).order('created_at', { ascending: false }).then(({ data }) => {
      setBills(data || []);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <LoadingSpinner />;

  const totalDue = bills.filter((b) => b.status !== 'Paid').reduce((s, b) => s + (b.total_amount - b.paid_amount), 0);

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">My Bills</h1>
      <p className="text-sm text-slate-500 mb-6">Your billing history and payments</p>
      {totalDue > 0 && (
        <div className="card p-5 mb-6 bg-rose-50 border-rose-200">
          <p className="text-sm text-rose-600 font-medium">Total Outstanding</p>
          <p className="text-3xl font-bold text-rose-700">{formatCurrency(totalDue)}</p>
        </div>
      )}
      <div className="space-y-3">
        {bills.length === 0 ? (
          <EmptyState message="No bills yet" />
        ) : (
          bills.map((b) => (
            <div key={b.id} className="card p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700">Bill #{b.bill_number || b.id.slice(0, 8)}</p>
                <p className="text-xs text-slate-400">{formatDate(b.created_at)}</p>
                <p className="text-sm text-slate-600 mt-1">Total: {formatCurrency(b.total_amount)} · Paid: {formatCurrency(b.paid_amount)}</p>
              </div>
              <StatusBadge status={b.status} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
