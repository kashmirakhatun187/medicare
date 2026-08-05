import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Bed, Ward } from '@/lib/types';
import { PageHeader, LoadingSpinner, StatusBadge, StatCard } from '@/components/ui';
import { BedDouble, CheckCircle, Wrench, Activity } from 'lucide-react';

export function BedsPage() {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterWard, setFilterWard] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: bedData }, { data: wardData }] = await Promise.all([
      supabase.from('beds').select('*').order('bed_number'),
      supabase.from('wards').select('*').order('name'),
    ]);
    setBeds(bedData || []);
    setWards(wardData || []);
    setLoading(false);
  }

  const filtered = beds.filter((b) => {
    const matchesWard = filterWard === 'All' || b.ward_name === filterWard;
    const matchesStatus = filterStatus === 'All' || b.status === filterStatus;
    return matchesWard && matchesStatus;
  });

  const occupied = beds.filter((b) => b.status === 'Occupied').length;
  const available = beds.filter((b) => b.status === 'Available').length;
  const maintenance = beds.filter((b) => b.status === 'Maintenance').length;

  if (loading) return <LoadingSpinner />;

  const statusColors: Record<string, string> = {
    Available: 'bg-emerald-50 border-emerald-200 hover:border-emerald-300',
    Occupied: 'bg-rose-50 border-rose-200 hover:border-rose-300',
    Maintenance: 'bg-amber-50 border-amber-200 hover:border-amber-300',
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Bed & Ward Management" subtitle="Visual bed map for all 100 beds across wards" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Beds" value={beds.length} icon={<BedDouble size={22} />} color="brand" />
        <StatCard label="Available" value={available} icon={<CheckCircle size={22} />} color="emerald" />
        <StatCard label="Occupied" value={occupied} icon={<Activity size={22} />} color="rose" />
        <StatCard label="Maintenance" value={maintenance} icon={<Wrench size={22} />} color="amber" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select className="input sm:w-48" value={filterWard} onChange={(e) => setFilterWard(e.target.value)}>
          <option>All</option>
          {wards.map((w) => (
            <option key={w.id}>{w.name}</option>
          ))}
        </select>
        <select className="input sm:w-48" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option>All</option>
          <option>Available</option>
          <option>Occupied</option>
          <option>Maintenance</option>
        </select>
      </div>

      {/* Ward Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {wards.map((w) => {
          const wardBeds = beds.filter((b) => b.ward_name === w.name);
          const wardOcc = wardBeds.filter((b) => b.status === 'Occupied').length;
          const pct = wardBeds.length > 0 ? Math.round((wardOcc / wardBeds.length) * 100) : 0;
          return (
            <div key={w.id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm text-slate-700">{w.name}</h4>
                <span className={`badge ${pct >= 80 ? 'badge-red' : pct >= 50 ? 'badge-amber' : 'badge-green'}`}>
                  {pct}%
                </span>
              </div>
              <p className="text-xs text-slate-400">{w.type} · Floor {w.floor}</p>
              <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${pct >= 80 ? 'bg-rose-500' : pct >= 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">{wardOcc}/{wardBeds.length} occupied · ₹{w.charge_per_day}/day</p>
            </div>
          );
        })}
      </div>

      {/* Bed Grid */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Bed Map</h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-200 border border-emerald-300"></span>Available</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-200 border border-rose-300"></span>Occupied</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-200 border border-amber-300"></span>Maintenance</span>
          </div>
        </div>

        {filterWard === 'All' ? (
          wards.map((w) => {
            const wardBeds = filtered.filter((b) => b.ward_name === w.name);
            if (wardBeds.length === 0) return null;
            return (
              <div key={w.id} className="mb-6">
                <h4 className="text-sm font-semibold text-slate-600 mb-3">{w.name}</h4>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {wardBeds.map((b) => (
                    <BedCard key={b.id} bed={b} className={statusColors[b.status] || ''} />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {filtered.map((b) => (
              <BedCard key={b.id} bed={b} className={statusColors[b.status] || ''} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BedCard({ bed, className }: { bed: Bed; className: string }) {
  return (
    <div className={`border rounded-lg p-2.5 transition-all cursor-pointer ${className}`}>
      <p className="text-xs font-bold text-slate-700">{bed.bed_number}</p>
      <p className="text-[10px] text-slate-400 truncate">{bed.type}</p>
      {bed.status === 'Occupied' && bed.patient_name && (
        <p className="text-[10px] text-rose-600 font-medium truncate mt-1">{bed.patient_name}</p>
      )}
      {bed.status === 'Available' && (
        <p className="text-[10px] text-emerald-600 mt-1">Free</p>
      )}
    </div>
  );
}
