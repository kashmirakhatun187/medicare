import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { LabTest, LabOrder } from '@/lib/types';
import { PageHeader, LoadingSpinner, StatusBadge, EmptyState, StatCard } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { FlaskConical, Plus, Search, Microscope, FileCheck, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

type Tab = 'orders' | 'catalog';

export function LabPage() {
  const [tab, setTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [catalogPage, setCatalogPage] = useState(1);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: o }, { data: t }, { data: p }] = await Promise.all([
      supabase.from('lab_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('lab_tests').select('*').order('test_name'),
      supabase.from('patients').select('id, name, assigned_doctor, opd_number, ipd_number').eq('status', 'Active'),
    ]);
    setOrders(o || []);
    setTests(t || []);
    setPatients(p || []);
    setLoading(false);
  }

  async function createOrder(form: any) {
    const patient = patients.find((p) => p.id === form.patient_id);
    const test = tests.find((t) => t.id === form.test_id);
    await supabase.from('lab_orders').insert({
      ...form,
      patient_name: patient?.name,
      doctor_name: patient?.assigned_doctor,
      test_name: test?.test_name,
      test_category: test?.category,
      normal_range: test?.normal_range,
      status: 'Ordered',
    });
    setShowOrderModal(false);
    loadData();
  }

  async function updateResult(id: string, result: string, status: string, isAbnormal: boolean) {
    await supabase.from('lab_orders').update({
      result,
      status,
      is_abnormal: isAbnormal,
      reported_at: status === 'Completed' ? new Date().toISOString() : null,
    }).eq('id', id);
    loadData();
  }

  async function addTest(form: any) {
    await supabase.from('lab_tests').insert({
      ...form,
      price: parseFloat(form.price) || 0,
    });
    setShowTestModal(false);
    loadData();
  }

  const filteredOrders = orders.filter((o) =>
    o.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.test_name.toLowerCase().includes(search.toLowerCase()) ||
    (o.test_category || '').toLowerCase().includes(search.toLowerCase())
  );

  const categories = ['All', ...new Set(tests.map((t) => t.category).filter(Boolean))];
  const filteredTests = tests.filter((t) => {
    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
    const matchesSearch = !search || t.test_name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const ITEMS_PER_PAGE = 9;
  const totalPages = Math.ceil(filteredTests.length / ITEMS_PER_PAGE);
  const paginatedTests = filteredTests.slice((catalogPage - 1) * ITEMS_PER_PAGE, catalogPage * ITEMS_PER_PAGE);

  const pending = orders.filter((o) => o.status === 'Ordered').length;
  const completed = orders.filter((o) => o.status === 'Completed').length;
  const abnormal = orders.filter((o) => o.is_abnormal).length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Laboratory & Diagnostics"
        subtitle="Pathology, radiology, and diagnostic test management"
        action={
          tab === 'orders' ? (
            <button className="btn-primary" onClick={() => setShowOrderModal(true)}>
              <Plus size={18} /> New Lab Order
            </button>
          ) : (
            <button className="btn-primary" onClick={() => setShowTestModal(true)}>
              <Plus size={18} /> Add Test
            </button>
          )
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Orders" value={orders.length} icon={<FlaskConical size={22} />} color="brand" />
        <StatCard label="Pending" value={pending} icon={<Clock size={22} />} color="amber" />
        <StatCard label="Completed" value={completed} icon={<FileCheck size={22} />} color="emerald" />
        <StatCard label="Abnormal Results" value={abnormal} icon={<Microscope size={22} />} color="rose" />
      </div>

      <div className="flex gap-2 mb-6">
        {([
          { id: 'orders', label: 'Lab Orders' },
          { id: 'catalog', label: 'Test Catalog' },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        <>
          <div className="relative mb-4">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-10"
              placeholder="Search by patient or test name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full responsive-table">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="table-header">Patient</th>
                    <th className="table-header">Test</th>
                    <th className="table-header">Category</th>
                    <th className="table-header">Result</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Ordered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                      <td data-label="Patient" className="table-cell font-medium text-slate-700">{o.patient_name}</td>
                      <td data-label="Test" className="table-cell">{o.test_name}</td>
                      <td data-label="Category" className="table-cell">{o.test_category || '-'}</td>
                      <td data-label="Result" className="table-cell">
                        {o.result ? (
                          <div>
                            <span className={`font-medium ${o.is_abnormal ? 'text-rose-600' : 'text-slate-700'}`}>
                              {o.result} {o.result_units}
                            </span>
                            {o.is_abnormal && <span className="badge-red ml-2">Abnormal</span>}
                            <p className="text-xs text-slate-400">Range: {o.normal_range}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400">Pending</span>
                        )}
                      </td>
                      <td data-label="Status" className="table-cell"><StatusBadge status={o.status} /></td>
                      <td data-label="Ordered" className="table-cell text-xs text-slate-500">{formatDateTime(o.ordered_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredOrders.length === 0 && <EmptyState message="No lab orders found" />}
            </div>
          </div>
        </>
      )}

      {tab === 'catalog' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-10" placeholder="Search tests..." value={search} onChange={(e) => { setSearch(e.target.value); setCatalogPage(1); }} />
            </div>
            <select className="input sm:w-48" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCatalogPage(1); }}>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedTests.map((t) => (
              <div key={t.id} className="card-hover p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-700">{t.test_name}</h4>
                    <p className="text-xs text-slate-400 mt-1">{t.category} · {t.department}</p>
                  </div>
                  <span className="font-bold text-brand-600">{formatCurrency(t.price)}</span>
                </div>
                {t.sample_type && (
                  <p className="text-xs text-slate-500 mt-2">Sample: {t.sample_type}</p>
                )}
                {t.normal_range && t.normal_range !== 'N/A' && (
                  <p className="text-xs text-slate-500">Normal: {t.normal_range}</p>
                )}
              </div>
            ))}
          </div>
          {paginatedTests.length === 0 && <EmptyState message="No tests found" />}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCatalogPage((p) => Math.max(1, p - 1))}
                disabled={catalogPage === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-slate-600">Page {catalogPage} of {totalPages}</span>
              <button
                onClick={() => setCatalogPage((p) => Math.min(totalPages, p + 1))}
                disabled={catalogPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {showOrderModal && (
        <OrderFormModal onClose={() => setShowOrderModal(false)} onSubmit={createOrder} patients={patients} tests={tests} />
      )}
      {showTestModal && (
        <TestFormModal onClose={() => setShowTestModal(false)} onSubmit={addTest} />
      )}
    </div>
  );
}

function OrderFormModal({ onClose, onSubmit, patients, tests }: { onClose: () => void; onSubmit: (f: any) => void; patients: any[]; tests: LabTest[] }) {
  const [form, setForm] = useState({ patient_id: '', test_id: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="New Lab Order" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Patient *</label>
          <select className="input" required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
            <option value="">Select patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name} {p.ipd_number ? `(${p.ipd_number})` : `(${p.opd_number || ''})`}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Test *</label>
          <select className="input" required value={form.test_id} onChange={(e) => setForm({ ...form, test_id: e.target.value })}>
            <option value="">Select test</option>
            {tests.map((t) => (
              <option key={t.id} value={t.id}>{t.test_name} — {formatCurrency(t.price)}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Create Order</button>
        </div>
      </form>
    </Modal>
  );
}

function TestFormModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (f: any) => void }) {
  const [form, setForm] = useState({
    test_name: '',
    category: 'Pathology',
    sample_type: '',
    normal_range: '',
    price: '0',
    department: 'Pathology',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Add Lab Test" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Test Name *</label>
          <input className="input" required value={form.test_name} onChange={(e) => setForm({ ...form, test_name: e.target.value })} />
        </div>
        <div className="form-grid">
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {['Pathology', 'Biochemistry', 'Hematology', 'Microbiology', 'Radiology', 'Cardiology'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Department</label>
            <select className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
              {['Pathology', 'Radiology', 'Cardiology'].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Sample Type</label>
          <input className="input" value={form.sample_type} onChange={(e) => setForm({ ...form, sample_type: e.target.value })} />
        </div>
        <div>
          <label className="label">Normal Range</label>
          <input className="input" value={form.normal_range} onChange={(e) => setForm({ ...form, normal_range: e.target.value })} />
        </div>
        <div>
          <label className="label">Price (₹)</label>
          <input type="number" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Add Test</button>
        </div>
      </form>
    </Modal>
  );
}
