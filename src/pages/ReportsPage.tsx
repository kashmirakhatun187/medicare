import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Patient } from '@/lib/types';
import { PatientSearch } from '@/components/PatientSearch';
import { PageHeader, LoadingSpinner, StatCard, EmptyState, Avatar, StatusBadge } from '@/components/ui';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { FileBarChart, TrendingUp, Users, BedDouble, Pill, FlaskConical, CreditCard, Activity, X, FileText, Calendar, Stethoscope, HeartPulse } from 'lucide-react';

export function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientReport, setPatientReport] = useState<any>(null);
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

  useEffect(() => {
    if (selectedPatient) {
      loadPatientReport(selectedPatient.id);
    } else {
      setPatientReport(null);
    }
  }, [selectedPatient]);

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

    const revMap: Record<string, number> = {};
    bills.data?.forEach((b: any) => {
      revMap[b.bill_type] = (revMap[b.bill_type] || 0) + b.total;
    });

    const deptMap: Record<string, number> = {};
    patients.data?.forEach((p: any) => {
      if (p.department) deptMap[p.department] = (deptMap[p.department] || 0) + 1;
    });

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

  async function loadPatientReport(patientId: string) {
    setLoading(true);
    const [bills, labs, prescriptions, appointments, vitals, admissions, otSchedules] = await Promise.all([
      supabase.from('bills').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
      supabase.from('lab_orders').select('*').eq('patient_id', patientId).order('ordered_at', { ascending: false }),
      supabase.from('prescriptions').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
      supabase.from('appointments').select('*').eq('patient_id', patientId).order('appointment_date', { ascending: false }),
      supabase.from('vitals').select('*').eq('patient_id', patientId).order('recorded_at', { ascending: false }),
      supabase.from('admissions').select('*').eq('patient_id', patientId).order('admission_date', { ascending: false }),
      supabase.from('ot_schedules').select('*').eq('patient_id', patientId).order('scheduled_date', { ascending: false }),
    ]);

    const totalBilled = bills.data?.reduce((s: number, b: any) => s + b.total, 0) || 0;
    const totalPaid = bills.data?.reduce((s: number, b: any) => s + (b.paid_amount || 0), 0) || 0;

    setPatientReport({
      bills: bills.data || [],
      labs: labs.data || [],
      prescriptions: prescriptions.data || [],
      appointments: appointments.data || [],
      vitals: vitals.data || [],
      admissions: admissions.data || [],
      otSchedules: otSchedules.data || [],
      totalBilled,
      totalPaid,
      pendingAmount: totalBilled - totalPaid,
      labCount: labs.data?.length || 0,
      labCompleted: labs.data?.filter((l: any) => l.status === 'Completed').length || 0,
      labAbnormal: labs.data?.filter((l: any) => l.is_abnormal).length || 0,
      rxCount: prescriptions.data?.length || 0,
      apptCount: appointments.data?.length || 0,
      vitalsCount: vitals.data?.length || 0,
      admissionCount: admissions.data?.length || 0,
      surgeryCount: otSchedules.data?.length || 0,
    });
    setLoading(false);
  }

  if (loading) return <LoadingSpinner />;

  // Patient-specific report view
  if (selectedPatient && patientReport) {
    const p = selectedPatient;
    const r = patientReport;
    return (
      <div className="animate-fade-in">
        <PageHeader title="Patient Report" subtitle="Individual patient analytics and history" />

        {/* Patient header card */}
        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar name={p.name} size="lg" />
              <div>
                <h3 className="text-xl font-bold text-slate-800">{p.name}</h3>
                <p className="text-sm text-slate-500">{p.age}y {p.gender} · {p.blood_group}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {p.patient_id && <span className="badge-teal font-mono text-xs font-bold">{p.patient_id}</span>}
                  {p.opd_number && <span className="badge-blue font-mono text-xs">{p.opd_number}</span>}
                  {p.ipd_number && <span className="badge-red font-mono text-xs">{p.ipd_number}</span>}
                  <span className={p.patient_type === 'IPD' ? 'badge-red' : 'badge-blue'}>{p.patient_type}</span>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            </div>
            <button onClick={() => setSelectedPatient(null)} className="btn-secondary text-sm">
              <X size={16} /> Clear Filter
            </button>
          </div>
        </div>

        {/* Patient stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Billed" value={formatCurrency(r.totalBilled)} icon={<CreditCard size={22} />} color="emerald" />
          <StatCard label="Pending" value={formatCurrency(r.pendingAmount)} icon={<TrendingUp size={22} />} color="rose" />
          <StatCard label="Lab Tests" value={`${r.labCompleted}/${r.labCount}`} icon={<FlaskConical size={22} />} color="amber" />
          <StatCard label="Prescriptions" value={r.rxCount} icon={<FileText size={22} />} color="brand" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Appointments" value={r.apptCount} icon={<Calendar size={22} />} color="blue" />
          <StatCard label="Vitals Recorded" value={r.vitalsCount} icon={<HeartPulse size={22} />} color="rose" />
          <StatCard label="Admissions" value={r.admissionCount} icon={<BedDouble size={22} />} color="amber" />
          <StatCard label="Surgeries" value={r.surgeryCount} icon={<Stethoscope size={22} />} color="cyan" />
        </div>

        {/* Billing breakdown */}
        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-slate-800 mb-4">Billing History</h3>
          {r.bills.length === 0 ? (
            <EmptyState message="No bills for this patient" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full responsive-table">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="table-header">Bill No</th>
                    <th className="table-header">Type</th>
                    <th className="table-header">Amount</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {r.bills.map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td data-label="Bill No" className="table-cell font-mono text-xs">{b.bill_number}</td>
                      <td data-label="Type" className="table-cell">{b.bill_type}</td>
                      <td data-label="Amount" className="table-cell font-medium">{formatCurrency(b.total)}</td>
                      <td data-label="Status" className="table-cell"><StatusBadge status={b.payment_status} /></td>
                      <td data-label="Date" className="table-cell text-xs text-slate-500">{formatDate(b.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Lab + Prescriptions side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Lab Results</h3>
            {r.labs.length === 0 ? (
              <EmptyState message="No lab orders" />
            ) : (
              <div className="space-y-2">
                {r.labs.map((l: any) => (
                  <div key={l.id} className="bg-slate-50 rounded-lg p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">{l.test_name}</span>
                      <StatusBadge status={l.status} />
                    </div>
                    {l.result && (
                      <p className={`text-xs mt-1 ${l.is_abnormal ? 'text-rose-600' : 'text-slate-500'}`}>
                        Result: {l.result} {l.result_units} · Range: {l.normal_range}
                        {l.is_abnormal && <span className="badge-red ml-2">Abnormal</span>}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Prescriptions</h3>
            {r.prescriptions.length === 0 ? (
              <EmptyState message="No prescriptions" />
            ) : (
              <div className="space-y-2">
                {r.prescriptions.map((rx: any) => (
                  <div key={rx.id} className="bg-slate-50 rounded-lg p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">{rx.diagnosis || 'N/A'}</span>
                      <span className="text-xs text-slate-400">{formatDate(rx.created_at)}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">By {rx.doctor_name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Admissions + Surgeries */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Admission History</h3>
            {r.admissions.length === 0 ? (
              <EmptyState message="No admissions" />
            ) : (
              <div className="space-y-2">
                {r.admissions.map((a: any) => (
                  <div key={a.id} className="bg-slate-50 rounded-lg p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">{a.ward_name} · Bed {a.bed_number}</span>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDate(a.admission_date)} · {a.reason || 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Surgery History</h3>
            {r.otSchedules.length === 0 ? (
              <EmptyState message="No surgeries" />
            ) : (
              <div className="space-y-2">
                {r.otSchedules.map((o: any) => (
                  <div key={o.id} className="bg-slate-50 rounded-lg p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">{o.surgery_name}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDate(o.scheduled_date)} · {o.surgeon_name || 'N/A'} · OT: {o.ot_room}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default aggregate report view
  const occupancyRate = data.totalBeds > 0 ? Math.round((data.occupiedBeds / data.totalBeds) * 100) : 0;
  const maxRevType = Math.max(...data.revenueByType.map((r) => r.amount), 1);
  const maxDeptCount = Math.max(...data.patientsByDept.map((d) => d.count), 1);
  const maxBillAmount = Math.max(...data.billsByDay.map((d) => d.amount), 1);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Reports & Analytics" subtitle="MIS reports, financial dashboard, and performance metrics" />

      {/* Patient filter */}
      <div className="card p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <PatientSearch onSelect={(p) => setSelectedPatient(p)} placeholder="Search a patient to view their individual report..." />
          </div>
        </div>
      </div>

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
