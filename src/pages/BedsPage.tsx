import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Bed, Ward } from '@/lib/types';
import { PageHeader, LoadingSpinner, StatCard } from '@/components/ui';
import { Modal } from '@/components/Modal';
import {
  BedDouble,
  CheckCircle,
  Wrench,
  Activity,
  UserPlus,
  ArrowRightLeft,
  X,
  Plus,
} from 'lucide-react';

const BED_CATEGORIES = ['General', 'Deluxe', 'ICU', 'Private', 'VIP'];

export function BedsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [beds, setBeds] = useState<Bed[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterWard, setFilterWard] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [assignBed, setAssignBed] = useState<Bed | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [showAddBed, setShowAddBed] = useState(false);

  const [bedForm, setBedForm] = useState({
    ward_id: '',
    ward_name: '',
    bed_number: '',
    type: 'General',
    status: 'Available',
    daily_charge: '0',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: bedData }, { data: wardData }, { data: patientData }] = await Promise.all([
      supabase.from('beds').select('*').order('bed_number'),
      supabase.from('wards').select('*').order('name'),
      supabase.from('patients')
        .select('id, name, patient_id, ipd_number, opd_number, patient_type, current_ward_name, current_bed_id, status')
        .eq('status', 'Admitted'),
    ]);

    setBeds(bedData || []);
    setWards(wardData || []);
    setPatients(patientData || []);
    setLoading(false);
  }

  const filtered = beds.filter((b) => {
    const matchesWard = filterWard === 'All' || b.ward_name === filterWard;
    const matchesStatus = filterStatus === 'All' || b.status === filterStatus;
    const matchesType = filterType === 'All' || b.type === filterType;
    return matchesWard && matchesStatus && matchesType;
  });

  const occupied = beds.filter((b) => b.status === 'Occupied').length;
  const available = beds.filter((b) => b.status === 'Available').length;
  const maintenance = beds.filter((b) => b.status === 'Maintenance').length;

  async function handleCreateBed() {
    if (!bedForm.ward_id || !bedForm.bed_number.trim()) {
      alert('Please select a ward and enter bed number.');
      return;
    }

    const selectedWard = wards.find((w) => w.id === bedForm.ward_id);
    const normalizedBedNumber = bedForm.bed_number.trim();
    const duplicate = beds.some(
      (b) =>
        b.ward_id === selectedWard?.id &&
        b.bed_number.trim().toLowerCase() === normalizedBedNumber.toLowerCase(),
    );

    if (duplicate) {
      alert(`Bed number ${normalizedBedNumber} already exists in ${selectedWard?.name || 'this ward'}. Please use a unique number.`);
      return;
    }

    const payload = {
      bed_number: normalizedBedNumber,
      ward_id: selectedWard?.id ?? null,
      ward_name: selectedWard?.name ?? bedForm.ward_name,
      type: bedForm.type,
      status: 'Available',
      patient_id: null,
      patient_name: null,
      daily_charge: Number(bedForm.daily_charge || selectedWard?.charge_per_day || 0),
    };

    const { error } = await supabase.from('beds').insert(payload);

    if (error) {
      alert(error.message);
      return;
    }

    setShowAddBed(false);
    setBedForm({
      ward_id: '',
      ward_name: '',
      bed_number: '',
      type: 'General',
      status: 'Available',
      daily_charge: '0',
    });
    await loadData();
  }

  async function assignPatientToBed(bed: Bed, patientId: string) {
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) return;

    if (patient.current_bed_id) {
      const existingBed = beds.find((b) => b.id === patient.current_bed_id);
      if (existingBed && existingBed.id !== bed.id) {
        alert(`Patient ${patient.name} is already assigned to bed ${existingBed.bed_number} in ${existingBed.ward_name}. Transfer them first or use the Transfer button.`);
        return;
      }
    }

    if (bed.status === 'Occupied' && bed.patient_id !== patientId) {
      alert(`Bed ${bed.bed_number} is already occupied by ${bed.patient_name}.`);
      return;
    }

    await supabase.from('beds').update({
      status: 'Occupied',
      patient_id: patient.id,
      patient_name: patient.name,
    }).eq('id', bed.id);

    await supabase.from('patients').update({
      current_bed_id: bed.id,
      current_ward_name: bed.ward_name,
    }).eq('id', patient.id);

    setAssignBed(null);
    await loadData();
  }

  async function transferPatient(bed: Bed, newBedId: string) {
    const newBed = beds.find((b) => b.id === newBedId);
    if (!newBed) return;

    if (newBed.status === 'Occupied') {
      alert(`Bed ${newBed.bed_number} is already occupied by ${newBed.patient_name}.`);
      return;
    }

    await supabase.from('beds').update({
      status: 'Available',
      patient_id: null,
      patient_name: null,
    }).eq('id', bed.id);

    await supabase.from('beds').update({
      status: 'Occupied',
      patient_id: bed.patient_id,
      patient_name: bed.patient_name,
    }).eq('id', newBedId);

    await supabase.from('patients').update({
      current_bed_id: newBedId,
      current_ward_name: newBed.ward_name,
    }).eq('id', bed.patient_id);

    setAssignBed(null);
    await loadData();
  }

  async function dischargePatientFromBed(bed: Bed) {
    if (!bed.patient_id) return;

    await supabase.from('beds').update({
      status: 'Available',
      patient_id: null,
      patient_name: null,
    }).eq('id', bed.id);

    await supabase.from('patients').update({
      current_bed_id: null,
      current_ward_name: null,
      status: 'Discharged',
    }).eq('id', bed.patient_id);

    await loadData();
  }

  if (loading) return <LoadingSpinner />;

  const statusColors: Record<string, string> = {
    Available: 'bg-emerald-50 border-emerald-200 hover:border-emerald-300',
    Occupied: 'bg-rose-50 border-rose-200 hover:border-rose-300',
    Maintenance: 'bg-amber-50 border-amber-200 hover:border-amber-300',
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Bed & Ward Management"
        subtitle="Visual bed map with patient assignment and transfer"
        action={
          isAdmin ? (
            <button className="btn-primary" onClick={() => setShowAddBed(true)}>
              <Plus size={16} className="inline mr-1" />
              Add Bed
            </button>
          ) : null
        }
      />

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

        <select className="input sm:w-48" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option>All</option>
          {BED_CATEGORIES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

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
                    <BedCard key={b.id} bed={b} className={statusColors[b.status] || ''} onClick={() => setAssignBed(b)} />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {filtered.map((b) => (
              <BedCard key={b.id} bed={b} className={statusColors[b.status] || ''} onClick={() => setAssignBed(b)} />
            ))}
          </div>
        )}
      </div>

      {assignBed && (
        <BedActionModal
          bed={assignBed}
          patients={patients}
          beds={beds}
          onClose={() => setAssignBed(null)}
          onAssign={assignPatientToBed}
          onTransfer={transferPatient}
          onDischarge={dischargePatientFromBed}
        />
      )}

      {showAddBed && (
        <Modal isOpen={true} onClose={() => setShowAddBed(false)} title="Add New Bed" size="md">
          <div className="space-y-4">
            <label className="label">Ward</label>
            <select
              className="input"
              value={bedForm.ward_id}
              onChange={(e) => {
                const selectedWard = wards.find((w) => w.id === e.target.value);
                setBedForm({
                  ...bedForm,
                  ward_id: e.target.value,
                  ward_name: selectedWard?.name || '',
                });
              }}
            >
              <option value="">Select ward</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>

            <label className="label">Bed Category</label>
            <select
              className="input"
              value={bedForm.type}
              onChange={(e) => setBedForm({ ...bedForm, type: e.target.value })}
            >
              {BED_CATEGORIES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <label className="label">Bed Number</label>
            <input
              className="input"
              value={bedForm.bed_number}
              onChange={(e) => setBedForm({ ...bedForm, bed_number: e.target.value })}
              placeholder="e.g. A-101"
            />

            <label className="label">Daily Charge</label>
            <input
              className="input"
              type="number"
              value={bedForm.daily_charge}
              onChange={(e) => setBedForm({ ...bedForm, daily_charge: e.target.value })}
            />

            <button className="btn-primary w-full mt-3" onClick={handleCreateBed}>
              <Plus size={16} className="inline mr-1" />
              Save Bed
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function BedCard({ bed, className, onClick }: { bed: Bed; className: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`border rounded-lg p-2.5 transition-all text-left ${className}`}>
      <p className="text-xs font-bold text-slate-700">{bed.bed_number}</p>
      <p className="text-[10px] text-slate-400 truncate">{bed.type}</p>
      {bed.status === 'Occupied' && bed.patient_name && (
        <p className="text-[10px] text-rose-600 font-medium truncate mt-1">{bed.patient_name}</p>
      )}
      {bed.status === 'Available' && (
        <p className="text-[10px] text-emerald-600 mt-1">Free</p>
      )}
    </button>
  );
}

function BedActionModal({
  bed,
  patients,
  beds,
  onClose,
  onAssign,
  onTransfer,
  onDischarge,
}: {
  bed: Bed;
  patients: any[];
  beds: Bed[];
  onClose: () => void;
  onAssign: (bed: Bed, patientId: string) => void;
  onTransfer: (bed: Bed, newBedId: string) => void;
  onDischarge: (bed: Bed) => void;
}) {
  const [mode, setMode] = useState<'assign' | 'transfer'>(bed.status === 'Occupied' ? 'transfer' : 'assign');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedBed, setSelectedBed] = useState('');

  const availableBeds = beds.filter((b) => b.status === 'Available' && b.id !== bed.id);
  const unassignedPatients = patients.filter((p) => !p.current_bed_id);

  return (
    <Modal isOpen={true} onClose={onClose} title={`Bed ${bed.bed_number} — ${bed.ward_name}`} size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className={`badge ${bed.status === 'Occupied' ? 'badge-red' : bed.status === 'Available' ? 'badge-green' : 'badge-amber'}`}>
            {bed.status}
          </span>
          <span className="text-sm text-slate-500">{bed.type}</span>
          {bed.patient_name && (
            <span className="text-sm font-medium text-slate-700">· {bed.patient_name}</span>
          )}
        </div>

        {bed.status === 'Occupied' && (
          <div className="flex gap-2">
            <button
              onClick={() => setMode('transfer')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'transfer' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              <ArrowRightLeft size={14} className="inline mr-1" /> Transfer
            </button>
            <button
              onClick={() => onDischarge(bed)}
              className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
            >
              <X size={14} className="inline mr-1" /> Discharge
            </button>
          </div>
        )}

        {mode === 'assign' && bed.status === 'Available' && (
          <div>
            <label className="label">Assign Patient to This Bed</label>
            {unassignedPatients.length === 0 ? (
              <p className="text-sm text-slate-400 bg-slate-50 rounded-lg p-3">
                No admitted patients without a bed. Convert an OPD patient to IPD first, or check if all IPD patients already have beds.
              </p>
            ) : (
              <select className="input" value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)}>
                <option value="">Select patient</option>
                {unassignedPatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.ipd_number ? `(${p.ipd_number})` : `(${p.opd_number || ''})`} · {p.current_ward_name || 'No ward'}
                  </option>
                ))}
              </select>
            )}
            {selectedPatient && (
              <button
                onClick={() => onAssign(bed, selectedPatient)}
                className="btn-primary w-full mt-3"
              >
                <UserPlus size={16} /> Assign to Bed {bed.bed_number}
              </button>
            )}
          </div>
        )}

        {mode === 'transfer' && bed.status === 'Occupied' && (
          <div>
            <label className="label">Transfer {bed.patient_name} to Another Bed</label>
            {availableBeds.length === 0 ? (
              <p className="text-sm text-slate-400 bg-slate-50 rounded-lg p-3">No available beds to transfer to.</p>
            ) : (
              <select className="input" value={selectedBed} onChange={(e) => setSelectedBed(e.target.value)}>
                <option value="">Select available bed</option>
                {availableBeds.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bed_number} — {b.ward_name} ({b.type})
                  </option>
                ))}
              </select>
            )}
            {selectedBed && (
              <button
                onClick={() => onTransfer(bed, selectedBed)}
                className="btn-primary w-full mt-3"
              >
                <ArrowRightLeft size={16} /> Transfer to New Bed
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
