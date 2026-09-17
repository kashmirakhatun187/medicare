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
    <div className="flex min-h-screen bg-gradient-to-b from-slate-50 via-slate-50/50 to-white">
      {sidebarOpen && <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar-premium fixed lg:sticky top-0 left-0 h-screen w-64 z-40 transition-transform duration-300 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="relative flex items-center gap-3 px-5 py-5 border-b border-slate-100 bg-gradient-to-r from-brand-600 via-brand-700 to-cyan-700 overflow-hidden">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="relative w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
            <HeartPulse className="text-white" size={22} />
          </div>
          <div className="relative">
            <h1 className="font-bold text-white text-sm">Patient Portal</h1>
            <p className="text-xs text-cyan-100/90">MediCare</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button key={item.id} onClick={() => { setPage(item.id); setSidebarOpen(false); }}
                className={`nav-item-premium ${active ? 'active' : ''}`}>
                <span className={`nav-icon ${active ? '' : 'bg-brand-50 text-brand-600'}`}>
                  <Icon size={18} />
                </span>
                {item.label}
              </button>
            );
          })}
          {onShowWebsite && (
            <button onClick={onShowWebsite}
              className="nav-item-premium mt-2 border-t border-slate-100 pt-3">
              <span className="nav-icon bg-slate-100 text-slate-500"><Globe size={18} /></span>
              View Website
            </button>
          )}
        </nav>
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <button onClick={() => signOut()} className="text-sm text-slate-500 hover:text-rose-600 transition-colors">
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="header-premium sticky top-0 z-20 px-4 lg:px-6 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-600 p-2 rounded-lg">
            <Plus size={20} className="rotate-45" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 avatar-gradient rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.full_name?.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">{user?.full_name}</p>
              <span className="badge-blue text-xs">Patient</span>
            </div>
          </div>
          {onShowWebsite && (
            <button onClick={onShowWebsite} className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 px-3 py-2 rounded-xl transition-all hover:scale-105">
              <Globe size={18} />
              <span className="hidden sm:inline">View Website</span>
            </button>
          )}
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <div key={page} className="page-enter">
            {page === 'home' && <PatientHome setPage={setPage} />}
            {page === 'appointments' && <PatientAppointments />}
            {page === 'prescriptions' && <PatientPrescriptions />}
            {page === 'lab' && <PatientLabResults />}
            {page === 'billing' && <PatientBills />}
          </div>
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
      <div className="relative overflow-hidden rounded-3xl p-6 mb-6 bg-gradient-to-br from-brand-600 via-brand-700 to-cyan-700 text-white">
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-2xl floating-orb" />
        <div className="absolute -bottom-8 left-1/4 w-28 h-28 bg-cyan-300/20 rounded-full blur-2xl floating-orb-delayed" />
        <div className="relative">
          <h1 className="text-2xl font-extrabold">Welcome, {user?.full_name?.split(' ')[0]}</h1>
          <p className="text-sm text-cyan-50/85 mt-1">Here's your health overview</p>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c, i) => {
          const Icon = c.icon;
          const themes: Record<string, { bg: string; border: string; iconBg: string; shine: string }> = {
            brand: { bg: 'from-white to-brand-50/40', border: 'border-brand-100', iconBg: 'bg-gradient-to-br from-brand-500 to-cyan-500 text-white', shine: 'bg-brand-300' },
            emerald: { bg: 'from-white to-emerald-50/40', border: 'border-emerald-100', iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white', shine: 'bg-emerald-300' },
            amber: { bg: 'from-white to-amber-50/40', border: 'border-amber-100', iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white', shine: 'bg-amber-300' },
            blue: { bg: 'from-white to-blue-50/40', border: 'border-blue-100', iconBg: 'bg-gradient-to-br from-blue-500 to-sky-500 text-white', shine: 'bg-blue-300' },
          };
          const t = themes[c.color];
          return (
            <button key={c.label} onClick={() => setPage(c.page)} className={`stat-card-premium bg-gradient-to-br ${t.bg} ${t.border} text-left stagger-in`} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className={`stat-shine ${t.shine}`} />
              <div className="relative">
                <div className={`stat-icon-box ${t.iconBg} shadow-lg mb-3`}><Icon size={22} /></div>
                <p className="text-2xl font-extrabold text-slate-800">{c.value}</p>
                <p className="text-sm text-slate-500">{c.label}</p>
              </div>
            </button>
          );
        })}
      </div>
      <div className="card-premium p-6">
        <h2 className="font-bold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <button onClick={() => setPage('appointments')} className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-brand-50 to-cyan-50 text-brand-700 hover:from-brand-100 hover:to-cyan-100 transition-all hover:scale-105 border border-brand-100">
            <CalendarClock size={20} /> <span className="font-medium text-sm">Book New Appointment</span>
          </button>
          <button onClick={() => setPage('billing')} className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-sky-50 text-blue-700 hover:from-blue-100 hover:to-sky-100 transition-all hover:scale-105 border border-blue-100">
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
          <div className="form-grid">
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
