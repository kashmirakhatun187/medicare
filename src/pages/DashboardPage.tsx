import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { StatCard, LoadingSpinner, Avatar } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { PageId } from '@/components/Sidebar';
import {
  Activity,
  Ambulance,
  Archive,
  BedDouble,
  Beaker,
  BellRing,
  Briefcase,
  CalendarDays,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileBarChart,
  FileCheck2,
  FlaskConical,
  HeartPulse,
  Building2,
  Inbox,
  LayoutDashboard,
  Package,
  Pill,
  ReceiptText,
  Search,
  ShieldCheck,
  Stethoscope,
  Syringe,
  TrendingUp,
  Users,
  UsersRound,
  WalletCards,
  Warehouse,
  X,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate?: (page: PageId) => void;
}

interface ModuleItem {
  label: string;
  page: PageId;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  tone: string;
  iconTone: string;
  description: string;
}

const modules: ModuleItem[] = [
  { label: 'Appointments', page: 'appointments', icon: CalendarDays, tone: 'from-rose-500 to-red-400', iconTone: 'bg-rose-50 text-rose-600', description: 'Schedule and queue' },
  { label: 'Patient Registration', page: 'patients', icon: ClipboardList, tone: 'from-blue-600 to-cyan-400', iconTone: 'bg-blue-50 text-blue-600', description: 'Create patient records' },
  { label: 'Clinical Management', page: 'doctors', icon: Stethoscope, tone: 'from-cyan-500 to-teal-400', iconTone: 'bg-cyan-50 text-cyan-600', description: 'Doctors and clinical care' },
  { label: 'Emergency', page: 'emergency', icon: Ambulance, tone: 'from-red-500 to-orange-400', iconTone: 'bg-red-50 text-red-600', description: 'Urgent care dashboard' },
  { label: 'Procedure Room', page: 'ot', icon: Briefcase, tone: 'from-pink-500 to-rose-400', iconTone: 'bg-pink-50 text-pink-600', description: 'Procedure schedules' },
  { label: 'Operation Theatre', page: 'ot', icon: Activity, tone: 'from-blue-700 to-sky-400', iconTone: 'bg-blue-50 text-blue-600', description: 'OT planning and status' },
  { label: 'Inpatient Management', page: 'admissions', icon: BedDouble, tone: 'from-sky-500 to-cyan-400', iconTone: 'bg-sky-50 text-sky-600', description: 'Admissions and wards' },
  { label: 'Nurse Station', page: 'nursing', icon: HeartPulse, tone: 'from-teal-600 to-emerald-400', iconTone: 'bg-teal-50 text-teal-600', description: 'Vitals and nursing care' },
  { label: 'Billing & Collection', page: 'billing', icon: WalletCards, tone: 'from-amber-500 to-orange-400', iconTone: 'bg-amber-50 text-amber-600', description: 'Bills and payments' },
  { label: 'Insurance & Claims', page: 'billing', icon: ShieldCheck, tone: 'from-cyan-700 to-blue-400', iconTone: 'bg-blue-50 text-blue-600', description: 'Claims and coverage' },
  { label: 'Phlebotomy', page: 'lab', icon: Syringe, tone: 'from-slate-600 to-slate-400', iconTone: 'bg-slate-100 text-slate-600', description: 'Sample collection' },
  { label: 'Laboratory', page: 'lab', icon: FlaskConical, tone: 'from-emerald-600 to-teal-400', iconTone: 'bg-emerald-50 text-emerald-600', description: 'Tests and reports' },
  { label: 'Blood Bank', page: 'lab', icon: Beaker, tone: 'from-red-600 to-rose-400', iconTone: 'bg-red-50 text-red-600', description: 'Blood service records' },
  { label: 'Radiology', page: 'lab', icon: FileCheck2, tone: 'from-cyan-600 to-sky-400', iconTone: 'bg-cyan-50 text-cyan-600', description: 'Imaging requests' },
  { label: 'Inventory', page: 'inventory', icon: Warehouse, tone: 'from-orange-600 to-amber-400', iconTone: 'bg-orange-50 text-orange-600', description: 'Stock and supplies' },
  { label: 'Discharge Summary', page: 'admissions', icon: ReceiptText, tone: 'from-teal-600 to-cyan-400', iconTone: 'bg-teal-50 text-teal-600', description: 'Discharge workflow' },
  { label: 'Visitor Management', page: 'visitors', icon: UsersRound, tone: 'from-yellow-500 to-amber-400', iconTone: 'bg-yellow-50 text-yellow-600', description: 'Visitor check-in' },
  { label: 'Reports', page: 'reports', icon: FileBarChart, tone: 'from-sky-700 to-cyan-400', iconTone: 'bg-sky-50 text-sky-600', description: 'Operational insights' },
  { label: 'Pharmacy', page: 'pharmacy', icon: Pill, tone: 'from-green-600 to-emerald-400', iconTone: 'bg-green-50 text-green-600', description: 'Medicines and dispensing' },
  { label: 'HR Management', page: 'hr', icon: Users, tone: 'from-fuchsia-600 to-pink-400', iconTone: 'bg-fuchsia-50 text-fuchsia-600', description: 'People and payroll' },
  { label: 'Inquiries', page: 'inquiries', icon: Inbox, tone: 'from-lime-600 to-green-400', iconTone: 'bg-lime-50 text-lime-600', description: 'Public enquiries' },
  { label: 'Beds & Wards', page: 'beds', icon: Building2, tone: 'from-sky-600 to-blue-400', iconTone: 'bg-sky-50 text-sky-600', description: 'Capacity and occupancy' },
  { label: 'Prescriptions', page: 'prescriptions', icon: ClipboardCheck, tone: 'from-blue-700 to-cyan-400', iconTone: 'bg-blue-50 text-blue-600', description: 'Prescription records' },
  { label: 'System Settings', page: 'settings', icon: Archive, tone: 'from-slate-700 to-slate-500', iconTone: 'bg-slate-100 text-slate-600', description: 'Hospital preferences' },
];

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [loading, setLoading] = useState(true);
  const [showAllModules, setShowAllModules] = useState(false);
  const [moduleSearch, setModuleSearch] = useState('');
  const [stats, setStats] = useState({ totalPatients: 0, opdPatients: 0, ipdPatients: 0, occupiedBeds: 0, totalBeds: 0, todayAppointments: 0, todayRevenue: 0, totalDoctors: 0, totalNurses: 0, lowStockMeds: 0 });
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [revenueByDay, setRevenueByDay] = useState<{ day: string; amount: number }[]>([]);
  const [departmentDist, setDepartmentDist] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    setLoading(true);
    const [patients, beds, appts, staff, meds, bills] = await Promise.all([
      supabase.from('patients').select('*'),
      supabase.from('beds').select('*'),
      supabase.from('appointments').select('*').eq('appointment_date', new Date().toISOString().split('T')[0]),
      supabase.from('staff').select('*'),
      supabase.from('medicines').select('*, medicine_stocks(*)'),
      supabase.from('bills').select('*').gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    ]);

    const patientRows = patients.data || [];
    const bedRows = beds.data || [];
    const opd = patientRows.filter((p: any) => p.patient_type === 'OPD');
    const ipd = patientRows.filter((p: any) => p.patient_type === 'IPD');
    const occupied = bedRows.filter((b: any) => b.status === 'Occupied');
    const billRows = bills.data || [];

    setStats({
      totalPatients: patientRows.length,
      opdPatients: opd.length,
      ipdPatients: ipd.length,
      occupiedBeds: occupied.length,
      totalBeds: bedRows.length,
      todayAppointments: appts.data?.length || 0,
      todayRevenue: billRows.reduce((sum: number, b: any) => sum + (b.total || 0), 0),
      totalDoctors: staff.data?.filter((s: any) => s.role === 'Doctor').length || 0,
      totalNurses: staff.data?.filter((s: any) => s.role === 'Nurse').length || 0,
      lowStockMeds: meds.data?.filter((m: any) => (m.medicine_stocks || []).reduce((s: number, st: any) => s + st.quantity, 0) <= m.reorder_level).length || 0,
    });
    setRecentPatients(patientRows.slice(-5).reverse());
    setAppointments((appts.data || []).slice(0, 6));

    const revMap: Record<string, number> = {};
    billRows.forEach((b: any) => {
      const day = new Date(b.created_at).toLocaleDateString('en-IN', { weekday: 'short' });
      revMap[day] = (revMap[day] || 0) + (b.total || 0);
    });
    setRevenueByDay(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({ day, amount: revMap[day] || 0 })));

    const deptMap: Record<string, number> = {};
    patientRows.forEach((p: any) => { if (p.department) deptMap[p.department] = (deptMap[p.department] || 0) + 1; });
    setDepartmentDist(Object.entries(deptMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6));
    setLoading(false);
  }

  if (loading) return <LoadingSpinner />;

  const occupancyRate = stats.totalBeds > 0 ? Math.round((stats.occupiedBeds / stats.totalBeds) * 100) : 0;
  const maxRevenue = Math.max(...revenueByDay.map((d) => d.amount), 1);
  const maxDept = Math.max(...departmentDist.map((d) => d.count), 1);
  const filteredModules = modules.filter((module) => module.label.toLowerCase().includes(moduleSearch.toLowerCase()));
  const visibleModules = showAllModules ? filteredModules : filteredModules.slice(0, 12);

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="dashboard-hero relative overflow-hidden rounded-3xl p-5 sm:p-7 text-white">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-50">
              <span className="status-dot" /> Live hospital command center
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Good day, welcome back</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-cyan-50/85">Move between every care team and hospital service from one calm, colorful workspace.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
            <CalendarClock size={20} />
            <div>
              <p className="text-xs text-cyan-100">Today</p>
              <p className="text-sm font-semibold">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="module-panel rounded-3xl border border-white/70 bg-white/80 p-4 shadow-xl shadow-slate-200/60 backdrop-blur-xl sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Hospital modules</p>
            <h2 className="mt-1 text-xl font-bold text-slate-800">Everything your team needs</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={moduleSearch} onChange={(event) => setModuleSearch(event.target.value)} placeholder="Find a module" className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 sm:w-48" />
              {moduleSearch && <button onClick={() => setModuleSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100"><X size={14} /></button>}
            </div>
            <button onClick={() => setShowAllModules((value) => !value)} className="hidden h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-600 sm:block">{showAllModules ? 'Show less' : 'View all'}</button>
          </div>
        </div>
        <div className="module-grid">
          {visibleModules.map((module, index) => {
            const Icon = module.icon;
            return (
              <button key={`${module.label}-${index}`} onClick={() => onNavigate?.(module.page)} className="module-tile group text-left" title={module.description}>
                <span className={`module-icon bg-gradient-to-br ${module.tone}`}><Icon size={25} strokeWidth={1.8} /></span>
                <span className="mt-3 line-clamp-2 text-center text-[11px] font-bold uppercase leading-4 tracking-wide text-slate-600 transition-colors group-hover:text-brand-700">{module.label}</span>
                <span className={`mt-2 h-1 w-7 rounded-full bg-gradient-to-r ${module.tone} opacity-60 transition-all group-hover:w-12`} />
              </button>
            );
          })}
        </div>
        {filteredModules.length === 0 && <p className="py-10 text-center text-sm text-slate-400">No matching module found.</p>}
        {!showAllModules && !moduleSearch && <button onClick={() => setShowAllModules(true)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-3 text-sm font-semibold text-slate-500 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 sm:hidden">View all modules <TrendingUp size={15} /></button>}
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Patients" value={stats.totalPatients} icon={<Users size={22} />} color="brand" trend={`${stats.opdPatients} OPD · ${stats.ipdPatients} IPD`} />
        <StatCard label="Bed Occupancy" value={`${occupancyRate}%`} icon={<BedDouble size={22} />} color="blue" trend={`${stats.occupiedBeds} of ${stats.totalBeds} beds occupied`} />
        <StatCard label="Today's Appointments" value={stats.todayAppointments} icon={<CalendarClock size={22} />} color="amber" trend="Scheduled for today" />
        <StatCard label="Revenue (7 days)" value={formatCurrency(stats.todayRevenue)} icon={<CreditCard size={22} />} color="emerald" trend="Total billing" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Performance</p><h3 className="mt-1 font-semibold text-slate-800">Revenue, last 7 days</h3></div><div className="flex items-center gap-1 text-sm font-medium text-emerald-600"><TrendingUp size={16} /> Weekly</div></div>
          <div className="flex h-48 items-end justify-between gap-3">
            {revenueByDay.map((day) => <div key={day.day} className="flex h-full flex-1 flex-col items-center gap-2"><div className="flex h-full w-full items-end rounded-t-xl bg-slate-100/80"><div className="w-full rounded-t-xl bg-gradient-to-t from-brand-600 via-cyan-500 to-sky-400 transition-all duration-700 hover:brightness-110" style={{ height: `${(day.amount / maxRevenue) * 100}%` }} /></div><span className="text-xs font-medium text-slate-500">{day.day}</span><span className="text-[10px] text-slate-400">{formatCurrency(day.amount)}</span></div>)}
          </div>
        </div>
        <div className="card p-6"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Care mix</p><h3 className="mb-4 mt-1 font-semibold text-slate-800">Patients by department</h3><div className="space-y-4">{departmentDist.map((dept, index) => <div key={dept.name}><div className="mb-1 flex items-center justify-between"><span className="text-sm text-slate-600">{dept.name}</span><span className="text-sm font-bold text-slate-700">{dept.count}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full bg-gradient-to-r ${['from-brand-500 to-cyan-400', 'from-rose-500 to-orange-400', 'from-blue-500 to-sky-400', 'from-amber-500 to-yellow-400'][index % 4]} transition-all duration-700`} style={{ width: `${(dept.count / maxDept) * 100}%` }} /></div></div>)}</div></div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Latest activity</p><h3 className="mt-1 font-semibold text-slate-800">Recent patients</h3></div><Users size={18} className="text-brand-500" /></div><div className="space-y-3">{recentPatients.map((patient) => <div key={patient.id} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50"><Avatar name={patient.name} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-700">{patient.name}</p><p className="text-xs text-slate-400">{patient.mrn} · {patient.department || 'General'}</p></div><span className={`badge ${patient.patient_type === 'IPD' ? 'badge-red' : 'badge-blue'}`}>{patient.patient_type}</span></div>)}</div></div>
        <div className="card p-6"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Today</p><h3 className="mt-1 font-semibold text-slate-800">Appointment queue</h3></div><BellRing size={18} className="text-amber-500" /></div>{appointments.length === 0 ? <p className="py-6 text-center text-sm text-slate-400">No appointments scheduled for today</p> : <div className="space-y-3">{appointments.map((appointment) => <div key={appointment.id} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-bold text-white shadow-md shadow-amber-100">#{appointment.token_number || '-'}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-700">{appointment.patient_name}</p><p className="text-xs text-slate-400">{appointment.doctor_name} · {appointment.department}</p></div><span className="text-xs font-semibold text-slate-500">{appointment.appointment_time?.substring(0, 5)}</span></div>)}</div>}</div>
      </div>
    </div>
  );
}
