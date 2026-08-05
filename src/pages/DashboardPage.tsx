import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { StatCard, LoadingSpinner, Avatar } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import {
  Users,
  BedDouble,
  CalendarClock,
  CreditCard,
  TrendingUp,
  Activity,
  HeartPulse,
  Stethoscope,
  Pill,
  AlertCircle,
} from 'lucide-react';

export function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    opdPatients: 0,
    ipdPatients: 0,
    occupiedBeds: 0,
    totalBeds: 0,
    todayAppointments: 0,
    todayRevenue: 0,
    totalDoctors: 0,
    totalNurses: 0,
    lowStockMeds: 0,
  });
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [revenueByDay, setRevenueByDay] = useState<{ day: string; amount: number }[]>([]);
  const [departmentDist, setDepartmentDist] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

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

    const opd = patients.data?.filter((p: any) => p.patient_type === 'OPD') || [];
    const ipd = patients.data?.filter((p: any) => p.patient_type === 'IPD') || [];
    const occupied = beds.data?.filter((b: any) => b.status === 'Occupied') || [];

    setStats({
      totalPatients: patients.data?.length || 0,
      opdPatients: opd.length,
      ipdPatients: ipd.length,
      occupiedBeds: occupied.length,
      totalBeds: beds.data?.length || 0,
      todayAppointments: appts.data?.length || 0,
      todayRevenue: bills.data?.reduce((sum: number, b: any) => sum + (b.total || 0), 0) || 0,
      totalDoctors: staff.data?.filter((s: any) => s.role === 'Doctor').length || 0,
      totalNurses: staff.data?.filter((s: any) => s.role === 'Nurse').length || 0,
      lowStockMeds: meds.data?.filter((m: any) => {
        const total = (m.medicine_stocks || []).reduce((s: number, st: any) => s + st.quantity, 0);
        return total <= m.reorder_level;
      }).length || 0,
    });

    setRecentPatients((patients.data || []).slice(-5).reverse());
    setAppointments((appts.data || []).slice(0, 6));

    // Revenue by day (last 7 days)
    const revMap: Record<string, number> = {};
    bills.data?.forEach((b: any) => {
      const day = new Date(b.created_at).toLocaleDateString('en-IN', { weekday: 'short' });
      revMap[day] = (revMap[day] || 0) + (b.total || 0);
    });
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    setRevenueByDay(days.map((d) => ({ day: d, amount: revMap[d] || 0 })));

    // Department distribution
    const deptMap: Record<string, number> = {};
    patients.data?.forEach((p: any) => {
      if (p.department) deptMap[p.department] = (deptMap[p.department] || 0) + 1;
    });
    setDepartmentDist(
      Object.entries(deptMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
    );

    setLoading(false);
  }

  if (loading) return <LoadingSpinner />;

  const occupancyRate = stats.totalBeds > 0 ? Math.round((stats.occupiedBeds / stats.totalBeds) * 100) : 0;
  const maxRevenue = Math.max(...revenueByDay.map((d) => d.amount), 1);
  const maxDept = Math.max(...departmentDist.map((d) => d.count), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reception Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Patients" value={stats.totalPatients} icon={<Users size={22} />} color="brand" trend={`${stats.opdPatients} OPD · ${stats.ipdPatients} IPD`} />
        <StatCard label="Bed Occupancy" value={`${occupancyRate}%`} icon={<BedDouble size={22} />} color="blue" trend={`${stats.occupiedBeds} of ${stats.totalBeds} beds occupied`} />
        <StatCard label="Today's Appointments" value={stats.todayAppointments} icon={<CalendarClock size={22} />} color="amber" trend="Scheduled for today" />
        <StatCard label="Revenue (7 days)" value={formatCurrency(stats.todayRevenue)} icon={<CreditCard size={22} />} color="emerald" trend="Total billing" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Doctors" value={stats.totalDoctors} icon={<Stethoscope size={22} />} color="cyan" />
        <StatCard label="Nurses" value={stats.totalNurses} icon={<HeartPulse size={22} />} color="rose" />
        <StatCard label="Low Stock Alerts" value={stats.lowStockMeds} icon={<AlertCircle size={22} />} color="amber" />
        <StatCard label="Available Beds" value={stats.totalBeds - stats.occupiedBeds} icon={<BedDouble size={22} />} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-800">Revenue (Last 7 Days)</h3>
            <div className="flex items-center gap-1 text-sm text-emerald-600">
              <TrendingUp size={16} />
              <span className="font-medium">Weekly</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-3 h-48">
            {revenueByDay.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-slate-100 rounded-t-lg flex items-end justify-center" style={{ height: '100%' }}>
                  <div
                    className="w-full bg-gradient-to-t from-brand-500 to-brand-400 rounded-t-lg transition-all duration-500 hover:from-brand-600 hover:to-brand-500"
                    style={{ height: `${(d.amount / maxRevenue) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 font-medium">{d.day}</span>
                <span className="text-xs text-slate-400">{formatCurrency(d.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Department Distribution */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Patients by Department</h3>
          <div className="space-y-3">
            {departmentDist.map((dept) => (
              <div key={dept.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600">{dept.name}</span>
                  <span className="text-sm font-semibold text-slate-700">{dept.count}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-500"
                    style={{ width: `${(dept.count / maxDept) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Recent Patients</h3>
          <div className="space-y-3">
            {recentPatients.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <Avatar name={p.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.mrn} · {p.department}</p>
                </div>
                <span className={`badge ${p.patient_type === 'IPD' ? 'badge-red' : 'badge-blue'}`}>{p.patient_type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Today's Appointments</h3>
          {appointments.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No appointments scheduled for today</p>
          ) : (
            <div className="space-y-3">
              {appointments.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600 font-semibold text-sm">
                    #{a.token_number || '-'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{a.patient_name}</p>
                    <p className="text-xs text-slate-400">{a.doctor_name} · {a.department}</p>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{a.appointment_time?.substring(0, 5)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
