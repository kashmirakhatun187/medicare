import type { UserRole } from '@/lib/auth';
import type { PageId } from '@/components/Sidebar';

export const ROLE_ACCESS: Record<UserRole, PageId[]> = {
  admin: [
    'dashboard', 'patients', 'appointments', 'admissions', 'visitors',
    'doctors', 'prescriptions', 'nursing', 'beds', 'ot', 'emergency',
    'pharmacy', 'lab', 'inventory', 'billing', 'hr', 'reports', 'settings',
    'user-management', 'inquiries',
  ],
  doctor: [
    'dashboard', 'patients', 'appointments', 'prescriptions',
    'nursing', 'beds', 'ot', 'lab', 'reports',
  ],
  nurse: [
    'dashboard', 'patients', 'nursing', 'beds', 'visitors',
  ],
  receptionist: [
    'dashboard', 'patients', 'appointments', 'admissions', 'visitors', 'billing',
  ],
  pharmacist: [
    'dashboard', 'pharmacy', 'inventory', 'billing',
  ],
  lab_tech: [
    'dashboard', 'lab', 'patients',
  ],
  accountant: [
    'dashboard', 'billing', 'reports', 'hr',
  ],
  patient: [],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  doctor: 'Doctor',
  nurse: 'Nurse',
  receptionist: 'Receptionist',
  pharmacist: 'Pharmacist',
  lab_tech: 'Lab Technician',
  accountant: 'Accountant',
  patient: 'Patient',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'badge-red',
  doctor: 'badge-teal',
  nurse: 'badge-amber',
  receptionist: 'badge-blue',
  pharmacist: 'badge-green',
  lab_tech: 'badge-gray',
  accountant: 'badge-teal',
  patient: 'badge-blue',
};

export const STAFF_ROLES: UserRole[] = ['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_tech', 'accountant'];

export function isStaff(role: UserRole): boolean {
  return role !== 'patient';
}

export function canAccess(role: UserRole, page: PageId): boolean {
  return ROLE_ACCESS[role]?.includes(page) ?? false;
}
