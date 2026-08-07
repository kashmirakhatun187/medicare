import { useState, useEffect } from 'react';
import { AuthProvider, useAuth, type UserRole } from '@/lib/auth';
import { isStaff } from '@/lib/roles';
import { PublicSite } from '@/pages/PublicSite';
import { PatientPortal } from '@/pages/PatientPortal';
import { Sidebar, type PageId } from '@/components/Sidebar';
import { DashboardPage } from '@/pages/DashboardPage';
import { PatientsPage } from '@/pages/PatientsPage';
import { AppointmentsPage } from '@/pages/AppointmentsPage';
import { AdmissionsPage } from '@/pages/AdmissionsPage';
import { VisitorsPage } from '@/pages/VisitorsPage';
import { DoctorsPage } from '@/pages/DoctorsPage';
import { PrescriptionsPage } from '@/pages/PrescriptionsPage';
import { NursingPage } from '@/pages/NursingPage';
import { BedsPage } from '@/pages/BedsPage';
import { OTPage } from '@/pages/OTPage';
import { EmergencyPage } from '@/pages/EmergencyPage';
import { PharmacyPage } from '@/pages/PharmacyPage';
import { LabPage } from '@/pages/LabPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { BillingPage } from '@/pages/BillingPage';
import { HRPage } from '@/pages/HRPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { UserManagementPage } from '@/pages/UserManagementPage';
import { InquiriesPage } from '@/pages/InquiriesPage';
import { canAccess, ROLE_LABELS, ROLE_COLORS } from '@/lib/roles';
import { LoadingSpinner } from '@/components/ui';
import { Menu, Bell, LogOut, Globe } from 'lucide-react';

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const [showWebsite, setShowWebsite] = useState(false);

  if (loading) return <LoadingSpinner size={32} />;

  // Not logged in → public website
  if (!user) return <PublicSite />;

  // Logged in but wants to view website
  if (showWebsite) return <PublicSite onBackToDashboard={() => setShowWebsite(false)} />;

  // Logged in as patient → patient portal
  if (!isStaff(user.role)) return <PatientPortal onShowWebsite={() => setShowWebsite(true)} />;

  // Logged in as staff → admin dashboard
  return <StaffDashboard user={user} signOut={signOut} onShowWebsite={() => setShowWebsite(true)} />;
}

function StaffDashboard({ user, signOut, onShowWebsite }: { user: { full_name: string; role: UserRole; id: string }; signOut: () => void; onShowWebsite: () => void }) {
  const [page, setPage] = useState<PageId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!canAccess(user.role, page)) {
      setPage('dashboard');
    }
  }, [user, page]);

  const pages: Record<PageId, React.ReactNode> = {
    dashboard: <DashboardPage />,
    patients: <PatientsPage />,
    appointments: <AppointmentsPage />,
    admissions: <AdmissionsPage />,
    visitors: <VisitorsPage />,
    doctors: <DoctorsPage />,
    prescriptions: <PrescriptionsPage />,
    nursing: <NursingPage />,
    beds: <BedsPage />,
    ot: <OTPage />,
    emergency: <EmergencyPage />,
    pharmacy: <PharmacyPage />,
    lab: <LabPage />,
    inventory: <InventoryPage />,
    billing: <BillingPage />,
    hr: <HRPage />,
    reports: <ReportsPage />,
    settings: <SettingsPage />,
    'user-management': <UserManagementPage />,
    inquiries: <InquiriesPage />,
  };

  const accessiblePage = canAccess(user.role, page) ? page : 'dashboard';
  const initials = user.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        current={accessiblePage}
        onNavigate={setPage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role={user.role}
        onShowWebsite={onShowWebsite}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-slate-700">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onShowWebsite}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-slate-100 px-3 py-2 rounded-lg transition-colors"
              title="View Public Website"
            >
              <Globe size={18} />
              <span className="hidden sm:inline">View Website</span>
            </button>
            <button className="relative text-slate-500 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-lg transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-700">{user.full_name}</p>
                <span className={ROLE_COLORS[user.role]}>{ROLE_LABELS[user.role]}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {pages[accessiblePage]}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
