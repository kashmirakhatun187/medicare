import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { HREmployee, HRPayroll, HRLeave } from '@/lib/types';
import { PageHeader, LoadingSpinner, StatusBadge, EmptyState, StatCard, Avatar } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Users, Plus, Calendar, Wallet, CheckCircle, Clock, UserCheck } from 'lucide-react';

type Tab = 'employees' | 'payroll' | 'leaves';

export function HRPage() {
  const [tab, setTab] = useState<Tab>('employees');
  const [employees, setEmployees] = useState<HREmployee[]>([]);
  const [payrolls, setPayrolls] = useState<HRPayroll[]>([]);
  const [leaves, setLeaves] = useState<HRLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEmpModal, setShowEmpModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: e }, { data: p }, { data: l }] = await Promise.all([
      supabase.from('hr_employees').select('*').order('name'),
      supabase.from('hr_payroll').select('*').order('created_at', { ascending: false }),
      supabase.from('hr_leaves').select('*').order('created_at', { ascending: false }),
    ]);
    setEmployees(e || []);
    setPayrolls(p || []);
    setLeaves(l || []);
    setLoading(false);
  }

  async function addEmployee(form: any) {
    const empId = 'EMP' + String(Date.now()).slice(-4);
    await supabase.from('hr_employees').insert({
      ...form,
      emp_id: empId,
      salary: parseFloat(form.salary) || 0,
      joining_date: form.joining_date || new Date().toISOString().split('T')[0],
      status: 'Active',
    });
    setShowEmpModal(false);
    loadData();
  }

  async function updateLeaveStatus(id: string, status: string) {
    await supabase.from('hr_leaves').update({ status }).eq('id', id);
    loadData();
  }

  async function processPayroll(id: string) {
    await supabase.from('hr_payroll').update({ status: 'Paid', paid_date: new Date().toISOString().split('T')[0] }).eq('id', id);
    loadData();
  }

  const totalSalary = employees.reduce((s, e) => s + e.salary, 0);
  const pendingLeaves = leaves.filter((l) => l.status === 'Pending').length;
  const pendingPayroll = payrolls.filter((p) => p.status === 'Pending').length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="HR & Payroll"
        subtitle="Employee management, attendance, leave, and payroll"
        action={
          tab === 'employees' ? (
            <button className="btn-primary" onClick={() => setShowEmpModal(true)}>
              <Plus size={18} /> Add Employee
            </button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Employees" value={employees.length} icon={<Users size={22} />} color="brand" />
        <StatCard label="Monthly Salary" value={formatCurrency(totalSalary)} icon={<Wallet size={22} />} color="emerald" />
        <StatCard label="Pending Payroll" value={pendingPayroll} icon={<Clock size={22} />} color="amber" />
        <StatCard label="Pending Leaves" value={pendingLeaves} icon={<Calendar size={22} />} color="rose" />
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {([
          { id: 'employees', label: 'Employees', icon: Users },
          { id: 'payroll', label: 'Payroll', icon: Wallet },
          { id: 'leaves', label: 'Leave Management', icon: Calendar },
        ] as const).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                tab === t.id ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'employees' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="table-header">Employee</th>
                  <th className="table-header">Emp ID</th>
                  <th className="table-header">Role</th>
                  <th className="table-header">Department</th>
                  <th className="table-header">Shift</th>
                  <th className="table-header">Salary</th>
                  <th className="table-header">Joined</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {employees.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Avatar name={e.name} size="sm" />
                        <div>
                          <p className="font-medium text-slate-700">{e.name}</p>
                          <p className="text-xs text-slate-400">{e.phone || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell font-mono text-xs">{e.emp_id}</td>
                    <td className="table-cell">{e.role}</td>
                    <td className="table-cell">{e.department || '-'}</td>
                    <td className="table-cell">
                      <span className={`badge ${e.shift === 'Morning' ? 'badge-amber' : e.shift === 'Evening' ? 'badge-blue' : e.shift === 'Night' ? 'badge-gray' : 'badge-teal'}`}>{e.shift}</span>
                    </td>
                    <td className="table-cell font-medium">{formatCurrency(e.salary)}</td>
                    <td className="table-cell text-xs text-slate-500">{formatDate(e.joining_date)}</td>
                    <td className="table-cell"><StatusBadge status={e.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'payroll' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="table-header">Employee</th>
                  <th className="table-header">Month</th>
                  <th className="table-header">Basic</th>
                  <th className="table-header">Allowances</th>
                  <th className="table-header">Deductions</th>
                  <th className="table-header">Net Salary</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-cell font-medium text-slate-700">{p.emp_name}</td>
                    <td className="table-cell">{p.month} {p.year}</td>
                    <td className="table-cell">{formatCurrency(p.basic_salary)}</td>
                    <td className="table-cell text-emerald-600">+{formatCurrency(p.allowances)}</td>
                    <td className="table-cell text-rose-600">-{formatCurrency(p.deductions)}</td>
                    <td className="table-cell font-bold">{formatCurrency(p.net_salary)}</td>
                    <td className="table-cell"><StatusBadge status={p.status} /></td>
                    <td className="table-cell">
                      {p.status === 'Pending' && (
                        <button
                          onClick={() => processPayroll(p.id)}
                          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                        >
                          Pay Now
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payrolls.length === 0 && <EmptyState message="No payroll records" />}
          </div>
        </div>
      )}

      {tab === 'leaves' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="table-header">Employee</th>
                  <th className="table-header">Leave Type</th>
                  <th className="table-header">Start</th>
                  <th className="table-header">End</th>
                  <th className="table-header">Days</th>
                  <th className="table-header">Reason</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-cell font-medium text-slate-700">{l.emp_name}</td>
                    <td className="table-cell">
                      <span className={`badge ${l.leave_type === 'Sick' ? 'badge-red' : l.leave_type === 'Casual' ? 'badge-blue' : 'badge-amber'}`}>{l.leave_type}</span>
                    </td>
                    <td className="table-cell text-xs text-slate-500">{formatDate(l.start_date)}</td>
                    <td className="table-cell text-xs text-slate-500">{formatDate(l.end_date)}</td>
                    <td className="table-cell">{l.days}d</td>
                    <td className="table-cell text-sm text-slate-600">{l.reason || '-'}</td>
                    <td className="table-cell"><StatusBadge status={l.status} /></td>
                    <td className="table-cell">
                      {l.status === 'Pending' && (
                        <div className="flex gap-1">
                          <button onClick={() => updateLeaveStatus(l.id, 'Approved')} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded hover:bg-emerald-50">Approve</button>
                          <button onClick={() => updateLeaveStatus(l.id, 'Rejected')} className="text-xs font-medium text-rose-600 hover:text-rose-700 px-2 py-1 rounded hover:bg-rose-50">Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leaves.length === 0 && <EmptyState message="No leave requests" />}
          </div>
        </div>
      )}

      {showEmpModal && <EmployeeFormModal onClose={() => setShowEmpModal(false)} onSubmit={addEmployee} />}
    </div>
  );
}

function EmployeeFormModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (f: any) => void }) {
  const [form, setForm] = useState({
    name: '', role: 'Nurse', department: 'General', phone: '', email: '',
    joining_date: new Date().toISOString().split('T')[0], salary: '0', shift: 'Morning', address: '',
  });
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit(form); };
  return (
    <Modal isOpen={true} onClose={onClose} title="Add Employee" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Name *</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {['Doctor', 'Nurse', 'Technician', 'Pharmacist', 'Receptionist', 'Accountant', 'Driver', 'Admin'].map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Department</label>
            <input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
          <div>
            <label className="label">Shift</label>
            <select className="input" value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })}>
              {['Morning', 'Evening', 'Night', 'General'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Joining Date</label>
            <input type="date" className="input" value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} />
          </div>
          <div>
            <label className="label">Salary (₹)</label>
            <input type="number" className="input" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">Address</label>
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Add Employee</button>
        </div>
      </form>
    </Modal>
  );
}
