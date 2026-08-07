export interface Patient {
  id: string;
  mrn: string;
  name: string;
  age: number | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  blood_group: string | null;
  emergency_contact: string | null;
  patient_type: string;
  department: string | null;
  assigned_doctor: string | null;
  status: string;
  allergies: string | null;
  chronic_conditions: string | null;
  insurance_provider: string | null;
  insurance_id: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  department: string | null;
  specialization: string | null;
  phone: string | null;
  email: string | null;
  qualification: string | null;
  shift: string;
  status: string;
  consultation_fee: number;
  created_at: string;
}

export interface Ward {
  id: string;
  name: string;
  type: string;
  floor: number;
  total_beds: number;
  charge_per_day: number;
}

export interface Bed {
  id: string;
  bed_number: string;
  ward_id: string | null;
  ward_name: string | null;
  type: string;
  status: string;
  patient_id: string | null;
  patient_name: string | null;
  daily_charge: number;
}

export interface Appointment {
  id: string;
  patient_id: string;
  patient_name: string | null;
  doctor_id: string | null;
  doctor_name: string | null;
  department: string | null;
  appointment_date: string;
  appointment_time: string;
  token_number: number | null;
  status: string;
  reason: string | null;
  notes: string | null;
  created_at: string;
}

export interface Admission {
  id: string;
  patient_id: string;
  patient_name: string | null;
  mrn: string | null;
  bed_id: string | null;
  bed_number: string | null;
  ward_name: string | null;
  doctor_id: string | null;
  doctor_name: string | null;
  department: string | null;
  admission_date: string;
  admission_time: string | null;
  discharge_date: string | null;
  discharge_time: string | null;
  reason: string | null;
  status: string;
  advance_amount: number;
  created_at: string;
}

export interface Vital {
  id: string;
  patient_id: string;
  patient_name: string | null;
  recorded_by: string | null;
  temperature: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  pulse: number | null;
  respiratory_rate: number | null;
  oxygen_saturation: number | null;
  weight: number | null;
  height: number | null;
  notes: string | null;
  recorded_at: string;
}

export interface NursingNote {
  id: string;
  patient_id: string;
  patient_name: string | null;
  nurse_id: string | null;
  nurse_name: string | null;
  shift: string | null;
  note: string | null;
  care_plan: string | null;
  medication_administered: string | null;
  recorded_at: string;
}

export interface Prescription {
  id: string;
  patient_id: string;
  patient_name: string | null;
  doctor_id: string | null;
  doctor_name: string | null;
  diagnosis: string | null;
  medicines: any[];
  instructions: string | null;
  follow_up_date: string | null;
  status: string;
  created_at: string;
}

export interface Medicine {
  id: string;
  name: string;
  generic_name: string | null;
  brand: string | null;
  category: string | null;
  form: string;
  strength: string | null;
  unit: string | null;
  hsn_code: string | null;
  gst_rate: number;
  selling_price: number;
  purchase_price: number;
  reorder_level: number;
}

export interface MedicineStock {
  id: string;
  medicine_id: string;
  batch_number: string | null;
  quantity: number;
  expiry_date: string | null;
  supplier: string | null;
  purchase_price: number;
}

export interface LabTest {
  id: string;
  test_name: string;
  category: string | null;
  sample_type: string | null;
  normal_range: string | null;
  price: number;
  department: string;
}

export interface LabOrder {
  id: string;
  patient_id: string;
  patient_name: string | null;
  doctor_name: string | null;
  test_name: string;
  test_category: string | null;
  status: string;
  result: string | null;
  result_units: string | null;
  normal_range: string | null;
  is_abnormal: boolean;
  ordered_at: string;
  reported_at: string | null;
}

export interface Bill {
  id: string;
  bill_number: string;
  patient_id: string;
  patient_name: string | null;
  bill_type: string;
  items: any[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid_amount: number;
  payment_method: string;
  payment_status: string;
  insurance_provider: string | null;
  insurance_claim_amount: number;
  notes: string | null;
  created_at: string;
}

export interface OTSchedule {
  id: string;
  patient_id: string;
  patient_name: string | null;
  surgery_name: string;
  surgeon_name: string | null;
  anesthetist_name: string | null;
  department: string | null;
  ot_room: string;
  scheduled_date: string;
  scheduled_time: string | null;
  duration_minutes: number;
  status: string;
  notes: string | null;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  item_type: string;
  unit: string | null;
  quantity: number;
  reorder_level: number;
  unit_price: number;
  vendor: string | null;
  location: string | null;
  asset_tag: string | null;
  status: string;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_name: string;
  item_description: string | null;
  quantity: number;
  unit_price: number;
  total_amount: number;
  order_date: string;
  expected_date: string | null;
  received_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface HREmployee {
  id: string;
  emp_id: string;
  name: string;
  role: string;
  department: string | null;
  phone: string | null;
  email: string | null;
  joining_date: string;
  salary: number;
  shift: string;
  status: string;
  address: string | null;
  created_at: string;
}

export interface HRPayroll {
  id: string;
  employee_id: string;
  emp_name: string | null;
  month: string;
  year: number;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  status: string;
  paid_date: string | null;
  created_at: string;
}

export interface HRAttendance {
  id: string;
  employee_id: string;
  emp_name: string | null;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface HRLeave {
  id: string;
  employee_id: string;
  emp_name: string | null;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  status: string;
  created_at: string;
}

export interface Visitor {
  id: string;
  visitor_name: string;
  patient_name: string | null;
  patient_id: string | null;
  relationship: string | null;
  phone: string | null;
  id_proof: string | null;
  check_in: string;
  check_out: string | null;
  purpose: string | null;
  status: string;
  created_at: string;
}
