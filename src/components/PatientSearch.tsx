import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Patient } from '@/lib/types';
import { Avatar } from '@/components/ui';
import { Search, BedDouble, ArrowRightLeft } from 'lucide-react';

interface PatientSearchProps {
  onSelect: (patient: Patient) => void;
  placeholder?: string;
}

export function PatientSearch({ onSelect, placeholder = 'Search patient by ID, name, or phone...' }: PatientSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('patients')
        .select('*')
        .or(`name.ilike.%${query}%,patient_id.ilike.%${query}%,opd_number.ilike.%${query}%,ipd_number.ilike.%${query}%,mrn.ilike.%${query}%,phone.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(10);
      setResults(data || []);
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  function handleSelect(p: Patient) {
    onSelect(p);
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        className="input pl-10 pr-4 w-full"
        placeholder={placeholder}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && (results.length > 0 || (loading && query.length >= 2)) && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-lg border border-slate-100 max-h-80 overflow-y-auto z-50">
          {loading && <div className="p-3 text-sm text-slate-400 text-center">Searching...</div>}
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelect(p)}
              className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0"
            >
              <Avatar name={p.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{p.name}</p>
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                  {p.patient_id && <span className="font-mono text-xs text-brand-600 font-semibold">{p.patient_id}</span>}
                  {p.opd_number && <span className="font-mono text-xs text-blue-600">{p.opd_number}</span>}
                  {p.ipd_number && <span className="font-mono text-xs text-rose-600">{p.ipd_number}</span>}
                  <span className="text-xs text-slate-400">{p.age}y · {p.gender}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`badge ${p.patient_type === 'IPD' ? 'badge-red' : 'badge-blue'} text-xs`}>{p.patient_type}</span>
                {p.current_ward_name && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <BedDouble size={10} /> {p.current_ward_name}
                  </span>
                )}
              </div>
            </button>
          ))}
          {results.length === 0 && !loading && query.length >= 2 && (
            <div className="p-4 text-sm text-slate-400 text-center">No patients found</div>
          )}
        </div>
      )}
    </div>
  );
}
