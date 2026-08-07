import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Bill } from '@/lib/types';
import { PageHeader, LoadingSpinner, StatusBadge, EmptyState, StatCard } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CreditCard, Plus, Search, TrendingUp, CheckCircle, Clock, FileText, Printer, Send, Eye, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function BillingPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [sendStatus, setSendStatus] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: b }, { data: p }] = await Promise.all([
      supabase.from('bills').select('*').order('created_at', { ascending: false }),
      supabase.from('patients').select('id, name, patient_type, insurance_provider, phone, email').eq('status', 'Active'),
    ]);
    setBills(b || []);
    setPatients(p || []);
    setLoading(false);
  }

  async function createBill(form: any) {
    const patient = patients.find((p) => p.id === form.patient_id);
    const billNumber = 'BILL-' + String(Date.now()).slice(-6);
    const items = form.items.filter((i: any) => i.description && i.amount);
    const subtotal = items.reduce((s: number, i: any) => s + parseFloat(i.amount || 0), 0);
    const discount = parseFloat(form.discount || '0');
    const tax = (subtotal - discount) * 0.12;
    const total = subtotal - discount + tax;

    await supabase.from('bills').insert({
      bill_number: billNumber,
      patient_id: form.patient_id,
      patient_name: patient?.name,
      bill_type: form.bill_type,
      items: items,
      subtotal,
      discount,
      tax,
      total,
      paid_amount: total,
      payment_method: form.payment_method,
      payment_status: 'Paid',
      insurance_provider: patient?.insurance_provider,
      insurance_claim_amount: form.payment_method === 'Insurance' ? total : 0,
    });
    setShowModal(false);
    loadData();
  }

  function generatePDF(bill: Bill, action: 'download' | 'print' | 'send') {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(13, 148, 136);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('MediCare Nursing Home', 14, 16);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('123 Health Street, Pune, Maharashtra 411001', 14, 24);
    doc.text('Phone: +91 98765 43210 | Email: care@medicare.com', 14, 30);

    // Bill info
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 14, 50);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Bill No: ${bill.bill_number}`, 14, 60);
    doc.text(`Date: ${formatDate(bill.created_at)}`, 14, 66);
    doc.text(`Type: ${bill.bill_type}`, 14, 72);
    doc.text(`Payment: ${bill.payment_method} (${bill.payment_status})`, 14, 78);

    // Patient info
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', pageWidth - 80, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(bill.patient_name || 'Patient', pageWidth - 80, 66);
    if (bill.insurance_provider) {
      doc.text(`Insurance: ${bill.insurance_provider}`, pageWidth - 80, 72);
    }

    // Items table
    autoTable(doc, {
      startY: 88,
      head: [['#', 'Description', 'Amount']],
      body: (bill.items || []).map((item: any, i: number) => [i + 1, item.description, formatCurrency(item.amount)]),
      theme: 'striped',
      headStyles: { fillColor: [13, 148, 136], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 15 }, 2: { halign: 'right' } },
    });

    // Totals
    let y = (doc as any).lastAutoTable.finalY + 10;
    const rightX = pageWidth - 60;
    doc.setFontSize(10);
    doc.text('Subtotal:', rightX - 40, y);
    doc.text(formatCurrency(bill.subtotal), rightX, y, { align: 'right' });
    y += 6;
    doc.text('Discount:', rightX - 40, y);
    doc.text('-' + formatCurrency(bill.discount), rightX, y, { align: 'right' });
    y += 6;
    doc.text('GST (12%):', rightX - 40, y);
    doc.text(formatCurrency(bill.tax), rightX, y, { align: 'right' });
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setFillColor(13, 148, 136);
    doc.rect(rightX - 45, y - 6, 50, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('Total:', rightX - 40, y);
    doc.text(formatCurrency(bill.total), rightX, y, { align: 'right' });

    // Footer
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for choosing MediCare Nursing Home.', pageWidth / 2, 280, { align: 'center' });
    doc.text('This is a computer-generated invoice and does not require a signature.', pageWidth / 2, 285, { align: 'center' });

    if (action === 'download') {
      doc.save(`${bill.bill_number}.pdf`);
    } else if (action === 'print') {
      doc.autoPrint();
      const url = doc.output('bloburl');
      window.open(url, '_blank');
    } else if (action === 'send') {
      // Generate PDF as base64 and send via edge function (or open mail client)
      const patient = patients.find((p) => p.name === bill.patient_name);
      const pdfBase64 = doc.output('datauristring');
      const subject = `Invoice ${bill.bill_number} from MediCare Nursing Home`;
      const body = `Dear ${bill.patient_name},\n\nPlease find your invoice ${bill.bill_number} attached.\n\nTotal Amount: ${formatCurrency(bill.total)}\nPayment Status: ${bill.payment_status}\n\nThank you for choosing MediCare Nursing Home.\n\nRegards,\nMediCare Billing Team`;
      window.location.href = `mailto:${patient?.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  }

  const filtered = bills.filter((b) => {
    const matchesSearch = b.patient_name?.toLowerCase().includes(search.toLowerCase()) || b.bill_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'All' || b.payment_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = bills.reduce((s, b) => s + b.total, 0);
  const paidCount = bills.filter((b) => b.payment_status === 'Paid').length;
  const pendingCount = bills.filter((b) => b.payment_status === 'Pending').length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Billing & Accounts"
        subtitle="OPD, IPD, pharmacy, and lab billing with GST"
        action={
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Create Bill
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Bills" value={bills.length} icon={<CreditCard size={22} />} color="brand" />
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={<TrendingUp size={22} />} color="emerald" />
        <StatCard label="Paid" value={paidCount} icon={<CheckCircle size={22} />} color="emerald" />
        <StatCard label="Pending" value={pendingCount} icon={<Clock size={22} />} color="amber" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search by patient or bill number..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-40" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option>All</option>
          <option>Paid</option>
          <option>Pending</option>
          <option>Partial</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="table-header">Bill No.</th>
                <th className="table-header">Patient</th>
                <th className="table-header">Type</th>
                <th className="table-header">Items</th>
                <th className="table-header">Total</th>
                <th className="table-header">Payment</th>
                <th className="table-header">Date</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-cell font-mono text-xs">{b.bill_number}</td>
                  <td className="table-cell font-medium text-slate-700">{b.patient_name}</td>
                  <td className="table-cell">
                    <span className={`badge ${b.bill_type === 'IPD' ? 'badge-red' : b.bill_type === 'Pharmacy' ? 'badge-teal' : 'badge-blue'}`}>{b.bill_type}</span>
                  </td>
                  <td className="table-cell text-xs text-slate-500">{(b.items || []).length} items</td>
                  <td className="table-cell font-semibold">{formatCurrency(b.total)}</td>
                  <td className="table-cell">
                    <div>
                      <StatusBadge status={b.payment_status} />
                      <p className="text-xs text-slate-400 mt-0.5">{b.payment_method}</p>
                    </div>
                  </td>
                  <td className="table-cell text-xs text-slate-500">{formatDate(b.created_at)}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button onClick={() => generatePDF(b, 'download')} className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Download PDF">
                        <Download size={15} />
                      </button>
                      <button onClick={() => generatePDF(b, 'print')} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Print">
                        <Printer size={15} />
                      </button>
                      <button onClick={() => generatePDF(b, 'send')} className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Send to Patient">
                        <Send size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState message="No bills found" />}
        </div>
      </div>

      {showModal && <BillFormModal onClose={() => setShowModal(false)} onSubmit={createBill} patients={patients} />}
    </div>
  );
}

function BillFormModal({ onClose, onSubmit, patients }: { onClose: () => void; onSubmit: (f: any) => void; patients: any[] }) {
  const [form, setForm] = useState({
    patient_id: '',
    bill_type: 'OPD',
    discount: '0',
    payment_method: 'Cash',
    items: [{ description: '', amount: '' }],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', amount: '' }] });
  const removeItem = (i: number) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i: number, field: string, value: string) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: value };
    setForm({ ...form, items });
  };

  const subtotal = form.items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const discount = parseFloat(form.discount) || 0;
  const tax = (subtotal - discount) * 0.12;
  const total = subtotal - discount + tax;

  return (
    <Modal isOpen={true} onClose={onClose} title="Create Bill" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Patient *</label>
            <select className="input" required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Bill Type</label>
            <select className="input" value={form.bill_type} onChange={(e) => setForm({ ...form, bill_type: e.target.value })}>
              <option>OPD</option>
              <option>IPD</option>
              <option>Pharmacy</option>
              <option>Laboratory</option>
              <option>Package</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Bill Items</label>
            <button type="button" onClick={addItem} className="text-sm text-brand-600 font-medium hover:text-brand-700">+ Add Item</button>
          </div>
          <div className="space-y-2">
            {form.items.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateItem(i, 'description', e.target.value)}
                />
                <input
                  type="number"
                  className="input w-32"
                  placeholder="Amount ₹"
                  value={item.amount}
                  onChange={(e) => updateItem(i, 'amount', e.target.value)}
                />
                {form.items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)} className="text-rose-500 hover:text-rose-700 px-2">×</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Discount (₹)</label>
            <input type="number" className="input" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
          </div>
          <div>
            <label className="label">Payment Method</label>
            <select className="input" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
              <option>Cash</option>
              <option>Card</option>
              <option>UPI</option>
              <option>Insurance</option>
            </select>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 space-y-1.5">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Discount</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>GST (12%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-slate-800 pt-2 border-t border-slate-200">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Create Bill</button>
        </div>
      </form>
    </Modal>
  );
}
