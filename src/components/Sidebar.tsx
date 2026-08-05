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
}

export function Sidebar({ current, onNavigate, isOpen, onClose, role }: SidebarProps) {
  const visibleItems = navItems.filter((item) => canAccess(role, item.id));
  const groups = [...new Set(visibleItems.map((n) => n.group))];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 z-40 transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
            <Building2 className="text-white" size={22} />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm leading-tight">MediCare</h1>
            <p className="text-xs text-slate-400">Nursing Home HMS</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {groups.map((group) => (
            <div key={group} className="mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
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
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-brand-600' : 'text-slate-400'} />
                      {item.label}
                    </button>
                  );
                })}
            </div>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Activity size={14} />
            <span>System Online · v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
