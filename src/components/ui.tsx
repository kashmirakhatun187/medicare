import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 size={size} className="animate-spin text-brand-500" />
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  color = 'brand',
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  color?: 'brand' | 'blue' | 'amber' | 'rose' | 'emerald' | 'cyan';
}) {
  const themes: Record<string, { bg: string; border: string; iconBg: string; shine: string; label: string }> = {
    brand: { bg: 'from-white to-brand-50/40', border: 'border-brand-100', iconBg: 'bg-gradient-to-br from-brand-500 to-cyan-500 text-white', shine: 'bg-brand-300', label: 'text-brand-600' },
    blue: { bg: 'from-white to-blue-50/40', border: 'border-blue-100', iconBg: 'bg-gradient-to-br from-blue-500 to-sky-500 text-white', shine: 'bg-blue-300', label: 'text-blue-600' },
    amber: { bg: 'from-white to-amber-50/40', border: 'border-amber-100', iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white', shine: 'bg-amber-300', label: 'text-amber-600' },
    rose: { bg: 'from-white to-rose-50/40', border: 'border-rose-100', iconBg: 'bg-gradient-to-br from-rose-500 to-pink-500 text-white', shine: 'bg-rose-300', label: 'text-rose-600' },
    emerald: { bg: 'from-white to-emerald-50/40', border: 'border-emerald-100', iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white', shine: 'bg-emerald-300', label: 'text-emerald-600' },
    cyan: { bg: 'from-white to-cyan-50/40', border: 'border-cyan-100', iconBg: 'bg-gradient-to-br from-cyan-500 to-sky-500 text-white', shine: 'bg-cyan-300', label: 'text-cyan-600' },
  };
  const t = themes[color];

  return (
    <div className={`stat-card-premium bg-gradient-to-br ${t.bg} ${t.border}`}>
      <div className={`stat-shine ${t.shine}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className="text-3xl font-extrabold text-slate-800 mt-1">{value}</p>
          {trend && <p className={`text-xs ${t.label} mt-1 font-medium`}>{trend}</p>}
        </div>
        <div className={`stat-icon-box ${t.iconBg} shadow-lg`}>{icon}</div>
      </div>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-slate-400">
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const colors = [
    'bg-teal-100 text-teal-700',
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
    'bg-indigo-100 text-indigo-700',
  ];
  const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const color = colors[hash % colors.length];

  return (
    <div className={`${sizes[size]} ${color} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Available: 'badge-green',
    Occupied: 'badge-red',
    Maintenance: 'badge-amber',
    Admitted: 'badge-red',
    Active: 'badge-green',
    Discharged: 'badge-gray',
    Scheduled: 'badge-blue',
    Completed: 'badge-green',
    Cancelled: 'badge-red',
    Ordered: 'badge-amber',
    Reported: 'badge-green',
    Pending: 'badge-amber',
    Paid: 'badge-green',
    Partial: 'badge-amber',
    Unpaid: 'badge-red',
  };
  const cls = map[status] || 'badge-gray';
  return <span className={cls}>{status}</span>;
}
