import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PageHeader, LoadingSpinner, EmptyState, Avatar } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { Search, Mail, Phone, MessageSquare, X } from 'lucide-react';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  category: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selected, setSelected] = useState<Inquiry | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false });
    setInquiries((data as Inquiry[]) || []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('inquiries').update({ status }).eq('id', id);
    load();
    if (selected?.id === id) setSelected({ ...selected, status });
  }

  const filtered = inquiries.filter((i) => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.subject.toLowerCase().includes(search.toLowerCase()) || i.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'All' || i.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Inquiries" subtitle="Visitor inquiries from the public website" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: inquiries.length, color: 'brand' },
          { label: 'New', value: inquiries.filter((i) => i.status === 'New').length, color: 'amber' },
          { label: 'Responded', value: inquiries.filter((i) => i.status === 'Responded').length, color: 'emerald' },
          { label: 'Closed', value: inquiries.filter((i) => i.status === 'Closed').length, color: 'blue' },
        ].map((s) => (
          <div key={s.label} className="card-hover p-5">
            <p className="text-sm text-slate-500 font-medium">{s.label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search inquiries..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-40" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option>All</option>
          <option>New</option>
          <option>Responded</option>
          <option>Closed</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState message="No inquiries found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="table-header">Name</th>
                  <th className="table-header">Category</th>
                  <th className="table-header">Subject</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Date</th>
                  <th className="table-header">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Avatar name={i.name} size="sm" />
                        <div>
                          <p className="font-medium text-slate-700 text-sm">{i.name}</p>
                          <p className="text-xs text-slate-400">{i.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell"><span className="badge-gray">{i.category}</span></td>
                    <td className="table-cell text-sm text-slate-600 max-w-xs truncate">{i.subject}</td>
                    <td className="table-cell">
                      <span className={i.status === 'New' ? 'badge-amber' : i.status === 'Responded' ? 'badge-green' : 'badge-gray'}>{i.status}</span>
                    </td>
                    <td className="table-cell text-xs text-slate-500">{formatDate(i.created_at)}</td>
                    <td className="table-cell">
                      <button onClick={() => setSelected(i)} className="text-xs font-medium text-brand-600 hover:text-brand-700 px-2 py-1 rounded hover:bg-brand-50">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && <InquiryDetailModal inquiry={selected} onClose={() => setSelected(null)} onUpdate={updateStatus} />}
    </div>
  );
}

function InquiryDetailModal({ inquiry, onClose, onUpdate }: { inquiry: Inquiry; onClose: () => void; onUpdate: (id: string, status: string) => void }) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <MessageSquare size={20} className="text-brand-600" /> Inquiry Details
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar name={inquiry.name} size="lg" />
            <div>
              <p className="font-semibold text-slate-800">{inquiry.name}</p>
              <p className="text-xs text-slate-400">{formatDate(inquiry.created_at)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg p-3">
              <Mail size={16} className="text-slate-400" />
              <span className="text-slate-600">{inquiry.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg p-3">
              <Phone size={16} className="text-slate-400" />
              <span className="text-slate-600">{inquiry.phone || '-'}</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Category</p>
            <span className="badge-gray">{inquiry.category}</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Subject</p>
            <p className="text-sm font-medium text-slate-700 bg-slate-50 rounded-lg p-3">{inquiry.subject}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Message</p>
            <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">{inquiry.message}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Update Status</p>
            <div className="flex gap-2">
              <button onClick={() => onUpdate(inquiry.id, 'New')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${inquiry.status === 'New' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}`}>New</button>
              <button onClick={() => onUpdate(inquiry.id, 'Responded')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${inquiry.status === 'Responded' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}`}>Responded</button>
              <button onClick={() => onUpdate(inquiry.id, 'Closed')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${inquiry.status === 'Closed' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}`}>Closed</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
