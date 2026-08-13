import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { InventoryItem, PurchaseOrder } from '@/lib/types';
import { PageHeader, LoadingSpinner, StatusBadge, EmptyState, StatCard } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Package, Plus, Search, AlertCircle, ShoppingCart, Wrench, Boxes } from 'lucide-react';

type Tab = 'inventory' | 'purchase';

export function InventoryPage() {
  const [tab, setTab] = useState<Tab>('inventory');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: i }, { data: o }] = await Promise.all([
      supabase.from('inventory_items').select('*').order('name'),
      supabase.from('purchase_orders').select('*').order('created_at', { ascending: false }),
    ]);
    setItems(i || []);
    setOrders(o || []);
    setLoading(false);
  }

  async function addItem(form: any) {
    await supabase.from('inventory_items').insert({
      ...form,
      quantity: parseInt(form.quantity) || 0,
      reorder_level: parseInt(form.reorder_level) || 20,
      unit_price: parseFloat(form.unit_price) || 0,
    });
    setShowItemModal(false);
    loadData();
  }

  async function addPO(form: any) {
    const total = (parseInt(form.quantity) || 0) * (parseFloat(form.unit_price) || 0);
    const poNumber = 'PO-2026-' + String(Date.now()).slice(-4);
    await supabase.from('purchase_orders').insert({
      ...form,
      po_number: poNumber,
      quantity: parseInt(form.quantity) || 1,
      unit_price: parseFloat(form.unit_price) || 0,
      total_amount: total,
    });
    setShowPOModal(false);
    loadData();
  }

  async function updatePOStatus(id: string, status: string) {
    const update: any = { status };
    if (status === 'Received') update.received_date = new Date().toISOString().split('T')[0];
    await supabase.from('purchase_orders').update(update).eq('id', id);
    loadData();
  }

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = items.filter((i) => i.quantity <= i.reorder_level).length;
  const totalValue = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const pendingPOs = orders.filter((o) => o.status === 'Pending').length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Inventory & Store"
        subtitle="Medical equipment, consumables, purchase orders, and asset tracking"
        action={
          tab === 'inventory' ? (
            <button className="btn-primary" onClick={() => setShowItemModal(true)}>
              <Plus size={18} /> Add Item
            </button>
          ) : (
            <button className="btn-primary" onClick={() => setShowPOModal(true)}>
              <Plus size={18} /> New Purchase Order
            </button>
          )
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Items" value={items.length} icon={<Boxes size={22} />} color="brand" />
        <StatCard label="Low Stock" value={lowStock} icon={<AlertCircle size={22} />} color="rose" />
        <StatCard label="Inventory Value" value={formatCurrency(totalValue)} icon={<Package size={22} />} color="emerald" />
        <StatCard label="Pending POs" value={pendingPOs} icon={<ShoppingCart size={22} />} color="amber" />
      </div>

      <div className="flex gap-2 mb-6">
        {([
          { id: 'inventory', label: 'Inventory', icon: Package },
          { id: 'purchase', label: 'Purchase Orders', icon: ShoppingCart },
        ] as const).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                tab === t.id ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'inventory' && (
        <>
          <div className="relative mb-4">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-10" placeholder="Search inventory..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="table-header">Item</th>
                    <th className="table-header">Category</th>
                    <th className="table-header">Type</th>
                    <th className="table-header">Qty</th>
                    <th className="table-header">Unit Price</th>
                    <th className="table-header">Vendor</th>
                    <th className="table-header">Location</th>
                    <th className="table-header">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredItems.map((i) => {
                    const isLow = i.quantity <= i.reorder_level;
                    return (
                      <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                        <td className="table-cell">
                          <div>
                            <p className="font-medium text-slate-700">{i.name}</p>
                            {i.asset_tag && <p className="text-xs text-slate-400 font-mono">{i.asset_tag}</p>}
                          </div>
                        </td>
                        <td className="table-cell">{i.category}</td>
                        <td className="table-cell">
                          <span className={`badge ${i.item_type === 'Asset' ? 'badge-blue' : 'badge-gray'}`}>{i.item_type}</span>
                        </td>
                        <td className="table-cell">
                          <span className={`font-semibold ${isLow ? 'text-rose-600' : 'text-slate-700'}`}>{i.quantity} {i.unit}</span>
                          {isLow && <p className="text-xs text-rose-500">Below {i.reorder_level}</p>}
                        </td>
                        <td className="table-cell font-medium">{formatCurrency(i.unit_price)}</td>
                        <td className="table-cell text-sm">{i.vendor || '-'}</td>
                        <td className="table-cell text-sm">{i.location || '-'}</td>
                        <td className="table-cell">
                          {isLow ? <span className="badge-red">Low Stock</span> : <span className="badge-green">In Stock</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredItems.length === 0 && <EmptyState message="No items found" />}
            </div>
          </div>
        </>
      )}

      {tab === 'purchase' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="table-header">PO Number</th>
                  <th className="table-header">Vendor</th>
                  <th className="table-header">Item</th>
                  <th className="table-header">Qty</th>
                  <th className="table-header">Total</th>
                  <th className="table-header">Order Date</th>
                  <th className="table-header">Expected</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-cell font-mono text-xs">{o.po_number}</td>
                    <td className="table-cell font-medium text-slate-700">{o.vendor_name}</td>
                    <td className="table-cell text-sm">{o.item_description}</td>
                    <td className="table-cell">{o.quantity}</td>
                    <td className="table-cell font-medium">{formatCurrency(o.total_amount)}</td>
                    <td className="table-cell text-xs text-slate-500">{formatDate(o.order_date)}</td>
                    <td className="table-cell text-xs text-slate-500">{formatDate(o.expected_date)}</td>
                    <td className="table-cell"><StatusBadge status={o.status} /></td>
                    <td className="table-cell">
                      {o.status === 'Pending' && (
                        <button
                          onClick={() => updatePOStatus(o.id, 'Received')}
                          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                        >
                          Mark Received
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && <EmptyState message="No purchase orders" />}
          </div>
        </div>
      )}

      {showItemModal && <ItemFormModal onClose={() => setShowItemModal(false)} onSubmit={addItem} />}
      {showPOModal && <POFormModal onClose={() => setShowPOModal(false)} onSubmit={addPO} />}
    </div>
  );
}

function ItemFormModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (f: any) => void }) {
  const [form, setForm] = useState({
    name: '', category: 'Consumable', item_type: 'Consumable', unit: 'Unit',
    quantity: '0', reorder_level: '20', unit_price: '0', vendor: '', location: '', asset_tag: '',
  });
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit(form); };
  return (
    <Modal isOpen={true} onClose={onClose} title="Add Inventory Item" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Name *</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {['Consumable', 'Equipment', 'Medicine', 'Stationery', 'Cleaning'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.item_type} onChange={(e) => setForm({ ...form, item_type: e.target.value })}>
              <option>Consumable</option><option>Asset</option>
            </select>
          </div>
          <div>
            <label className="label">Unit</label>
            <input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div>
            <label className="label">Quantity</label>
            <input type="number" className="input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <div>
            <label className="label">Reorder Level</label>
            <input type="number" className="input" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} />
          </div>
          <div>
            <label className="label">Unit Price (₹)</label>
            <input type="number" className="input" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} />
          </div>
          <div>
            <label className="label">Vendor</label>
            <input className="input" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          {form.item_type === 'Asset' && (
            <div>
              <label className="label">Asset Tag</label>
              <input className="input" value={form.asset_tag} onChange={(e) => setForm({ ...form, asset_tag: e.target.value })} />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Add Item</button>
        </div>
      </form>
    </Modal>
  );
}

function POFormModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (f: any) => void }) {
  const [form, setForm] = useState({
    vendor_name: '', item_description: '', quantity: '1', unit_price: '0',
    expected_date: '', notes: '',
  });
  const total = (parseInt(form.quantity) || 0) * (parseFloat(form.unit_price) || 0);
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit(form); };
  return (
    <Modal isOpen={true} onClose={onClose} title="New Purchase Order" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Vendor Name *</label>
          <input className="input" required value={form.vendor_name} onChange={(e) => setForm({ ...form, vendor_name: e.target.value })} />
        </div>
        <div>
          <label className="label">Item Description *</label>
          <input className="input" required value={form.item_description} onChange={(e) => setForm({ ...form, item_description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Quantity</label>
            <input type="number" className="input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <div>
            <label className="label">Unit Price (₹)</label>
            <input type="number" className="input" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Expected Date</label>
          <input type="date" className="input" value={form.expected_date} onChange={(e) => setForm({ ...form, expected_date: e.target.value })} />
        </div>
        <div className="bg-slate-50 rounded-lg p-3 flex justify-between text-sm font-medium">
          <span>Total Amount</span><span>{formatCurrency(total)}</span>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Create PO</button>
        </div>
      </form>
    </Modal>
  );
}
