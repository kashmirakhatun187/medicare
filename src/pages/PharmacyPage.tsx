import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Medicine, MedicineStock } from '@/lib/types';
import { PageHeader, LoadingSpinner, StatusBadge, EmptyState, StatCard } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Pill, AlertCircle, Package, Plus, Search, Calendar } from 'lucide-react';

export function PharmacyPage() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [lowStockOnly, setLowStockOnly] = useState(false);

  useEffect(() => {
    loadMedicines();
  }, []);

  async function loadMedicines() {
    setLoading(true);
    const { data } = await supabase.from('medicines').select('*, medicine_stocks(*)').order('name');
    setMedicines(data || []);
    setLoading(false);
  }

  async function addMedicine(form: any) {
    await supabase.from('medicines').insert({
      ...form,
      selling_price: parseFloat(form.selling_price) || 0,
      purchase_price: parseFloat(form.purchase_price) || 0,
      gst_rate: parseFloat(form.gst_rate) || 0,
      reorder_level: parseInt(form.reorder_level) || 50,
    });
    setShowModal(false);
    loadMedicines();
  }

  const filtered = medicines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.generic_name || '').toLowerCase().includes(search.toLowerCase());
    const totalStock = (m.medicine_stocks || []).reduce((s: number, st: MedicineStock) => s + st.quantity, 0);
    const matchesLowStock = !lowStockOnly || totalStock <= m.reorder_level;
    return matchesSearch && matchesLowStock;
  });

  const lowStockCount = medicines.filter((m) => {
    const total = (m.medicine_stocks || []).reduce((s: number, st: MedicineStock) => s + st.quantity, 0);
    return total <= m.reorder_level;
  }).length;

  const totalValue = medicines.reduce((sum, m) => {
    const total = (m.medicine_stocks || []).reduce((s: number, st: MedicineStock) => s + st.quantity, 0);
    return sum + total * m.selling_price;
  }, 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Pharmacy Management"
        subtitle="Medicine inventory, stock alerts, and batch tracking"
        action={
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Add Medicine
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Medicines" value={medicines.length} icon={<Pill size={22} />} color="brand" />
        <StatCard label="Low Stock" value={lowStockCount} icon={<AlertCircle size={22} />} color="rose" />
        <StatCard label="Inventory Value" value={formatCurrency(totalValue)} icon={<Package size={22} />} color="emerald" />
        <StatCard label="Categories" value={new Set(medicines.map((m) => m.category)).size} icon={<Package size={22} />} color="blue" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-10"
            placeholder="Search medicines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            lowStockOnly ? 'bg-rose-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {lowStockOnly ? 'Showing Low Stock' : 'Show Low Stock Only'}
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="table-header">Medicine</th>
                <th className="table-header">Category</th>
                <th className="table-header">Form</th>
                <th className="table-header">Stock</th>
                <th className="table-header">Price</th>
                <th className="table-header">Batches</th>
                <th className="table-header">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((m) => {
                const totalStock = (m.medicine_stocks || []).reduce((s: number, st: MedicineStock) => s + st.quantity, 0);
                const isLow = totalStock <= m.reorder_level;
                const expiringSoon = (m.medicine_stocks || []).some((st: MedicineStock) => {
                  if (!st.expiry_date) return false;
                  const days = (new Date(st.expiry_date).getTime() - Date.now()) / 86400000;
                  return days < 90;
                });
                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-cell">
                      <div>
                        <p className="font-medium text-slate-700">{m.name}</p>
                        <p className="text-xs text-slate-400">{m.generic_name} · {m.brand}</p>
                      </div>
                    </td>
                    <td className="table-cell">{m.category}</td>
                    <td className="table-cell">{m.form} · {m.strength}</td>
                    <td className="table-cell">
                      <span className={`font-semibold ${isLow ? 'text-rose-600' : 'text-slate-700'}`}>{totalStock} {m.unit}</span>
                    </td>
                    <td className="table-cell font-medium">{formatCurrency(m.selling_price)}</td>
                    <td className="table-cell">
                      <div className="space-y-0.5">
                        {(m.medicine_stocks || []).map((st: MedicineStock) => (
                          <div key={st.id} className="text-xs text-slate-500 flex items-center gap-1">
                            <span>{st.batch_number}</span>
                            <span className="text-slate-400">·</span>
                            <span className="flex items-center gap-0.5">
                              <Calendar size={10} />
                              {formatDate(st.expiry_date)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="table-cell">
                      {isLow ? <span className="badge-red">Low Stock</span> : expiringSoon ? <span className="badge-amber">Expiring</span> : <span className="badge-green">In Stock</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState message="No medicines found" />}
        </div>
      </div>

      {showModal && <MedicineFormModal onClose={() => setShowModal(false)} onSubmit={addMedicine} />}
    </div>
  );
}

function MedicineFormModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (f: any) => void }) {
  const [form, setForm] = useState({
    name: '',
    generic_name: '',
    brand: '',
    category: 'Analgesic',
    form: 'Tablet',
    strength: '',
    unit: 'Strip',
    hsn_code: '',
    gst_rate: '12',
    selling_price: '0',
    purchase_price: '0',
    reorder_level: '50',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Add Medicine" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Name *</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Generic Name</label>
            <input className="input" value={form.generic_name} onChange={(e) => setForm({ ...form, generic_name: e.target.value })} />
          </div>
          <div>
            <label className="label">Brand</label>
            <input className="input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {['Analgesic', 'Antibiotic', 'Antacid', 'Antihypertensive', 'Cardiac', 'Antidiabetic', 'Antihistamine', 'Antiemetic', 'Supplement'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Form</label>
            <select className="input" value={form.form} onChange={(e) => setForm({ ...form, form: e.target.value })}>
              {['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops'].map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Strength</label>
            <input className="input" value={form.strength} onChange={(e) => setForm({ ...form, strength: e.target.value })} />
          </div>
          <div>
            <label className="label">Unit</label>
            <input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div>
            <label className="label">GST Rate (%)</label>
            <input type="number" className="input" value={form.gst_rate} onChange={(e) => setForm({ ...form, gst_rate: e.target.value })} />
          </div>
          <div>
            <label className="label">Selling Price (₹)</label>
            <input type="number" className="input" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} />
          </div>
          <div>
            <label className="label">Purchase Price (₹)</label>
            <input type="number" className="input" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} />
          </div>
          <div>
            <label className="label">Reorder Level</label>
            <input type="number" className="input" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Add Medicine</button>
        </div>
      </form>
    </Modal>
  );
}
