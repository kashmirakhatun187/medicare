import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PageHeader, LoadingSpinner, StatCard, EmptyState } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { FileBarChart, TrendingUp, Users, BedDouble, Pill, FlaskConical, CreditCard, Activity } from 'lucide-react';

export function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalPatients: 0,
    opd: 0,
    ipd: 0,
    totalBeds: 0,
    occupiedBeds: 0,
    totalRevenue: 0,
    totalBills: 0,
    totalMedicines: 0,
    lowStock: 0,
    totalLabOrders: 0,
    completedLabs: 0,
    totalDoctors: 0,
    totalNurses: 0,
    totalSurgeries: 0,
    revenueByType: [] as { type: string; amount: number }[],
    patientsByDept: [] as { name: string; count: number }[],
    billsByDay: [] as { day: string; count: number; amount: number }[],
  });

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    const [patients, beds, bills, meds, labs, staff, ot] = await Promise.all([
      supabase.from('patients').select('*'),
      supabase.from('beds').select('*'),
      supabase.from('bills').select('*'),
      supabase.from('medicines').select('*, medicine_stocks(*)'),
      supabase.from('lab_orders').select('*'),
      supabase.from('staff').select('*'),
      supabase.from('ot_schedules').select('*'),
    ]);

    const opd = patients.data?.filter((p: any) => p.patient_type === 'OPD') || [];
    const ipd = patients.data?.filter((p: any) => p.patient_type === 'IPD') || [];
    const occupied = beds.data?.filter((b: any) => b.status === 'Occupied') || [];
    const totalRev = bills.data?.reduce((s: number, b: any) => s + b.total, 0) || 0;

    // Revenue by bill type
    const revMap: Record<string, number> = {};
    bills.data?.forEach((b: any) => {
      revMap[b.bill_type] = (revMap[b.bill_type] || 0) + b.total;
    });

    // Patients by department
    const deptMap: Record<string, number> = {};
    patients.data?.forEach((p: any) => {
      if (p.department) deptMap[p.department] = (deptMap[p.department] || 0) + 1;
    });

    // Bills by day (last 7)
    const dayMap: Record<string, { count: number; amount: number }> = {};
    bills.data?.forEach((b: any) => {
      const day = new Date(b.created_at).toLocaleDateString('en-IN', { weekday: 'short' });
      if (!dayMap[day]) dayMap[day] = { count: 0, amount: 0 };
      dayMap[day].count++;
      dayMap[day].amount += b.total;
    });
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    setData({
      totalPatients: patients.data?.length || 0,
      opd: opd.length,
      ipd: ipd.length,
      totalBeds: beds.data?.length || 0,
      occupiedBeds: occupied.length,
      totalRevenue: totalRev,
      totalBills: bills.data?.length || 0,
      totalMedicines: meds.data?.length || 0,
      lowStock: meds.data?.filter((m: any) => {
        const total = (m.medicine_stocks || []).reduce((s: number, st: any) => s + st.quantity, 0);
        return total <= m.reorder_level;
      }).length || 0,
      totalLabOrders: labs.data?.length || 0,
      completedLabs: labs.data?.filter((l: any) => l.status === 'Completed').length || 0,
      totalDoctors: staff.data?.filter((s: any) => s.role === 'Doctor').length || 0,
      totalNurses: staff.data?.filter((s: any) => s.role === 'Nurse').length || 0,
      totalSurgeries: ot.data?.length || 0,
      revenueByType: Object.entries(revMap).map(([type, amount]) => ({ type, amount })),
      patientsByDept: Object.entries(deptMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      billsByDay: days.map((d) => ({ day: d, count: dayMap[d]?.count || 0, amount: dayMap[d]?.amount || 0 })),
    });
    setLoading(false);
  }

  if (loading) return <LoadingSpinner />;

  const occupancyRate = data.totalBeds > 0 ? Math.round((data.occupiedBeds / data.totalBeds) * 100) : 0;
  const maxRevType = Math.max(...data.revenueByType.map((r) => r.amount), 1);
  const maxDeptCount = Math.max(...data.patientsByDept.map((d) => d.count), 1);
  const maxBillAmount = Math.max(...data.billsByDay.map((d) => d.amount), 1);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Reports & Analytics" subtitle="MIS reports, financial dashboard, and performance metrics" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Patients" value={data.totalPatients} icon={<Users size={22} />} color="brand" trend={`${data.opd} OPD · ${data.ipd} IPD`} />
        <StatCard label="Bed Occupancy" value={`${occupancyRate}%`} icon={<BedDouble size={22} />} color="blue" trend={`${data.occupiedBeds}/${data.totalBeds} beds`} />
        <StatCard label="Total Revenue" value={formatCurrency(data.totalRevenue)} icon={<TrendingUp size={22} />} color="emerald" trend={`${data.totalBills} bills`} />
        <StatCard label="Lab Completion" value={`${data.completedLabs}/${data.totalLabOrders}`} icon={<FlaskConical size={22} />} color="amber" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Doctors" value={data.totalDoctors} icon={<Activity size={22} />} color="cyan" />
        <StatCard label="Nurses" value={data.totalNurses} icon={<Activity size={22} />} color="rose" />
        <StatCard label="Medicines" value={data.totalMedicines} icon={<Pill size={22} />} color="brand" trend={`${data.lowStock} low stock`} />
        <StatCard label="Surgeries" value={data.totalSurgeries} icon={<FileBarChart size={22} />} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue by Bill Type */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Revenue by Bill Type</h3>
          {data.revenueByType.length === 0 ? (
            <EmptyState message="No revenue data" />
          ) : (
            <div className="space-y-3">
              {data.revenueByType.map((r) => (
                <div key={r.type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600">{r.type}</span>
                    <span className="text-sm font-semibold text-slate-700">{formatCurrency(r.amount)}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500" style={{ width: `${(r.amount / maxRevType) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Patients by Department */}
        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Patients by Department</h3>
          {data.patientsByDept.length === 0 ? (
            <EmptyState message="No data" />
          ) : (
            <div className="space-y-3">
              {data.patientsByDept.map((d) => (
                <div key={d.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600">{d.name}</span>
                    <span className="text-sm font-semibold text-slate-700">{d.count}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${(d.count / maxDeptCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daily Billing Trend */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Daily Billing Trend</h3>
        <div className="flex items-end justify-between gap-3 h-48">
          {data.billsByDay.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-medium text-slate-600">{formatCurrency(d.amount)}</span>
              <div className="w-full bg-slate-100 rounded-t-lg flex items-end justify-center" style={{ height: '100%' }}>
                <div className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg transition-all duration-500" style={{ height: `${(d.amount / maxBillAmount) * 100}%` }} />
              </div>
              <span className="text-xs text-slate-500 font-medium">{d.day}</span>
              <span className="text-xs text-slate-400">{d.count} bills</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Table */}
      <div className="card p-6 mt-6">
        <h3 className="font-semibold text-slate-800 mb-4">Financial Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1"><CreditCard size={14} /> Total Bills</div>
            <p className="text-xl font-bold text-slate-800">{data.totalBills}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1"><TrendingUp size={14} /> Avg Bill Value</div>
            <p className="text-xl font-bold text-slate-800">{formatCurrency(data.totalBills > 0 ? data.totalRevenue / data.totalBills : 0)}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1"><Users size={14} /> Total Patients</div>
            <p className="text-xl font-bold text-slate-800">{data.totalPatients}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1"><BedDouble size={14} /> Occupancy Rate</div>
            <p className="text-xl font-bold text-slate-800">{occupancyRate}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
