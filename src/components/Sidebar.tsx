import {
  LayoutDashboard,
  Users,
  BedDouble,
  Stethoscope,
  HeartPulse,
  Pill,
  FlaskConical,
  CreditCard,
  CalendarClock,
  Activity,
  FileBarChart,
  Settings,
  Building2,
  Ambulance,
  Scissors,
  FileText,
  Package,
  UsersRound,
  ClipboardList,
  UserCog,
  Inbox,
  Globe,
  ChevronRight,
} from 'lucide-react';
import { canAccess } from '@/lib/roles';
import type { UserRole } from '@/lib/auth';

export type PageId =
  | 'dashboard'
  | 'patients'
  | 'appointments'
  | 'admissions'
  | 'visitors'
  | 'doctors'
  | 'prescriptions'
  | 'nursing'
  | 'beds'
  | 'ot'
  | 'emergency'
  | 'pharmacy'
  | 'lab'
  | 'inventory'
  | 'billing'
  | 'hr'
  | 'reports'
  | 'settings'
  | 'user-management'
  | 'inquiries';

interface NavItem {
  id: PageId;
  label: string;
  icon: typeof LayoutDashboard;
  group: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview' },
  { id: 'patients', label: 'Patients', icon: Users, group: 'Front Office' },
  { id: 'appointments', label: 'Appointments', icon: CalendarClock, group: 'Front Office' },
  { id: 'admissions', label: 'IPD Admissions', icon: ClipboardList, group: 'Front Office' },
  { id: 'visitors', label: 'Visitor Management', icon: UsersRound, group: 'Front Office' },
  { id: 'doctors', label: 'Doctors & Staff', icon: Stethoscope, group: 'Clinical' },
  { id: 'prescriptions', label: 'Prescriptions', icon: FileText, group: 'Clinical' },
  { id: 'nursing', label: 'Nursing', icon: HeartPulse, group: 'Clinical' },
  { id: 'beds', label: 'Beds & Wards', icon: BedDouble, group: 'Facility' },
  { id: 'ot', label: 'Operation Theatre', icon: Scissors, group: 'Facility' },
  { id: 'emergency', label: 'Emergency', icon: Ambulance, group: 'Facility' },
  { id: 'pharmacy', label: 'Pharmacy', icon: Pill, group: 'Services' },
  { id: 'lab', label: 'Laboratory', icon: FlaskConical, group: 'Services' },
  { id: 'inventory', label: 'Inventory & Store', icon: Package, group: 'Services' },
  { id: 'billing', label: 'Billing & Accounts', icon: CreditCard, group: 'Finance' },
  { id: 'hr', label: 'HR & Payroll', icon: Users, group: 'Finance' },
  { id: 'reports', label: 'Reports', icon: FileBarChart, group: 'Finance' },
  { id: 'settings', label: 'Settings', icon: Settings, group: 'System' },
  { id: 'user-management', label: 'User Management', icon: UserCog, group: 'System' },
  { id: 'inquiries', label: 'Inquiries', icon: Inbox, group: 'System' },
];

interface SidebarProps {
  current: PageId;
  onNavigate: (page: PageId) => void;
  isOpen: boolean;
  onClose: () => void;
  role: UserRole;
  onShowWebsite?: () => void;
}

const GROUP_STYLES: Record<string, { color: string; iconBg: string; activeGradient: string }> = {
  Overview: { color: 'text-brand-600', iconBg: 'bg-brand-50 text-brand-600', activeGradient: 'from-brand-500 to-cyan-500' },
  'Front Office': { color: 'text-blue-600', iconBg: 'bg-blue-50 text-blue-600', activeGradient: 'from-blue-500 to-indigo-500' },
  Clinical: { color: 'text-rose-600', iconBg: 'bg-rose-50 text-rose-600', activeGradient: 'from-rose-500 to-pink-500' },
  Facility: { color: 'text-amber-600', iconBg: 'bg-amber-50 text-amber-600', activeGradient: 'from-amber-500 to-orange-500' },
  Services: { color: 'text-emerald-600', iconBg: 'bg-emerald-50 text-emerald-600', activeGradient: 'from-emerald-500 to-teal-500' },
  Finance: { color: 'text-cyan-600', iconBg: 'bg-cyan-50 text-cyan-600', activeGradient: 'from-cyan-500 to-sky-500' },
  System: { color: 'text-slate-500', iconBg: 'bg-slate-100 text-slate-600', activeGradient: 'from-slate-500 to-slate-600' },
};

export function Sidebar({ current, onNavigate, isOpen, onClose, role, onShowWebsite }: SidebarProps) {
  const visibleItems = navItems.filter((item) => canAccess(role, item.id));
  const groups = [...new Set(visibleItems.map((n) => n.group))];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden animate-fade-in" onClick={onClose} />
      )}
      <aside
        className={`sidebar-premium fixed lg:sticky top-0 left-0 h-screen w-60 z-40 transition-transform duration-300 ease-out flex flex-col shadow-2xl lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo header with gradient */}
        <div className="relative flex items-center gap-2.5 px-4 py-4 border-b border-slate-100 bg-gradient-to-r from-brand-600 via-brand-700 to-cyan-700 overflow-hidden">
          <div className="absolute -right-8 -top-8 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
          <div className="relative w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg">
            <Building2 className="text-white" size={20} />
          </div>
          <div className="relative">
            <h1 className="font-bold text-white text-sm leading-tight">MediCare</h1>
            <p className="text-[10px] text-cyan-100/90">Nursing Home HMS</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3">
          {groups.map((group, groupIndex) => {
            const style = GROUP_STYLES[group] || GROUP_STYLES.System;
            return (
              <div key={group} className="mb-3" style={{ animation: `fadeInUp 0.3s ease ${groupIndex * 0.05}s both` }}>
                <p className={`nav-group-label ${style.color}`}>
                  {group}
                </p>
                {visibleItems
                  .filter((n) => n.group === group)
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = current === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.id);
                          onClose();
                        }}
                        className={`nav-item-premium ${isActive ? 'active' : ''}`}
                      >
                        <span className={`nav-icon ${isActive ? `bg-gradient-to-br ${style.activeGradient} text-white` : style.iconBg}`}>
                          <Icon size={16} />
                        </span>
                        <span className="flex-1">{item.label}</span>
                        {isActive && <ChevronRight size={12} className="text-brand-500" />}
                      </button>
                    );
                  })}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-2.5 border-t border-slate-100 space-y-1.5 bg-slate-50/50">
          {onShowWebsite && (
            <button onClick={onShowWebsite} className="w-full flex items-center gap-2 text-xs text-slate-500 hover:text-brand-600 transition-colors py-1 px-2 rounded-lg hover:bg-brand-50">
              <Globe size={13} />
              View Website
            </button>
          )}
          <div className="flex items-center gap-2 text-[10px] text-slate-400 px-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span>System Online · v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
