/*
# Nursing Home Management — Core Schema

## Overview
Creates the full data model for a 100-bed nursing home management system.
Single-tenant app (no sign-in), all policies use `TO anon, authenticated`.

## New Tables
- `departments`, `staff`, `wards`, `patients`, `beds`, `appointments`,
  `admissions`, `vitals`, `nursing_notes`, `prescriptions`, `medicines`,
  `medicine_stocks`, `lab_tests`, `lab_orders`, `bills`, `ot_schedules`

## Security
- RLS enabled on every table with anon+authenticated full CRUD (shared facility data).
*/

-- ============ DEPARTMENTS ============
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- ============ STAFF ============
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT 'Doctor',
  department text,
  specialization text,
  phone text,
  email text,
  qualification text,
  shift text DEFAULT 'General',
  status text DEFAULT 'Active',
  consultation_fee numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============ WARDS ============
CREATE TABLE IF NOT EXISTS wards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'General',
  floor int DEFAULT 1,
  total_beds int DEFAULT 0,
  charge_per_day numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============ PATIENTS (before beds FK) ============
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mrn text UNIQUE NOT NULL,
  name text NOT NULL,
  age int,
  gender text,
  phone text,
  email text,
  address text,
  blood_group text,
  emergency_contact text,
  patient_type text DEFAULT 'OPD',
  department text,
  assigned_doctor text,
  status text DEFAULT 'Active',
  allergies text,
  chronic_conditions text,
  insurance_provider text,
  insurance_id text,
  photo_url text,
  created_at timestamptz DEFAULT now()
);

-- ============ BEDS ============
CREATE TABLE IF NOT EXISTS beds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bed_number text UNIQUE NOT NULL,
  ward_id uuid REFERENCES wards(id) ON DELETE SET NULL,
  ward_name text,
  type text DEFAULT 'General',
  status text DEFAULT 'Available',
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  patient_name text,
  daily_charge numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============ APPOINTMENTS ============
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  patient_name text,
  doctor_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  doctor_name text,
  department text,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  token_number int,
  status text DEFAULT 'Scheduled',
  reason text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ============ ADMISSIONS ============
CREATE TABLE IF NOT EXISTS admissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  patient_name text,
  mrn text,
  bed_id uuid REFERENCES beds(id) ON DELETE SET NULL,
  bed_number text,
  ward_name text,
  doctor_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  doctor_name text,
  department text,
  admission_date date NOT NULL,
  admission_time time,
  discharge_date date,
  discharge_time time,
  reason text,
  status text DEFAULT 'Admitted',
  advance_amount numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============ VITALS ============
CREATE TABLE IF NOT EXISTS vitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  patient_name text,
  recorded_by text,
  temperature numeric,
  blood_pressure_systolic int,
  blood_pressure_diastolic int,
  pulse int,
  respiratory_rate int,
  oxygen_saturation int,
  weight numeric,
  height numeric,
  notes text,
  recorded_at timestamptz DEFAULT now()
);

-- ============ NURSING NOTES ============
CREATE TABLE IF NOT EXISTS nursing_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  patient_name text,
  nurse_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  nurse_name text,
  shift text,
  note text,
  care_plan text,
  medication_administered text,
  recorded_at timestamptz DEFAULT now()
);

-- ============ PRESCRIPTIONS ============
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  patient_name text,
  doctor_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  doctor_name text,
  diagnosis text,
  medicines jsonb,
  instructions text,
  follow_up_date date,
  status text DEFAULT 'Active',
  created_at timestamptz DEFAULT now()
);

-- ============ MEDICINES ============
CREATE TABLE IF NOT EXISTS medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  generic_name text,
  brand text,
  category text,
  form text DEFAULT 'Tablet',
  strength text,
  unit text,
  hsn_code text,
  gst_rate numeric DEFAULT 12,
  selling_price numeric DEFAULT 0,
  purchase_price numeric DEFAULT 0,
  reorder_level int DEFAULT 50,
  created_at timestamptz DEFAULT now()
);

-- ============ MEDICINE STOCKS ============
CREATE TABLE IF NOT EXISTS medicine_stocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id uuid REFERENCES medicines(id) ON DELETE CASCADE,
  batch_number text,
  quantity int DEFAULT 0,
  expiry_date date,
  supplier text,
  purchase_price numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============ LAB TESTS ============
CREATE TABLE IF NOT EXISTS lab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name text NOT NULL,
  category text,
  sample_type text,
  normal_range text,
  price numeric DEFAULT 0,
  department text DEFAULT 'Pathology',
  created_at timestamptz DEFAULT now()
);

-- ============ LAB ORDERS ============
CREATE TABLE IF NOT EXISTS lab_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  patient_name text,
  doctor_name text,
  test_name text,
  test_category text,
  status text DEFAULT 'Ordered',
  result text,
  result_units text,
  normal_range text,
  is_abnormal boolean DEFAULT false,
  ordered_at timestamptz DEFAULT now(),
  reported_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============ BILLS ============
CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number text UNIQUE NOT NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  patient_name text,
  bill_type text DEFAULT 'OPD',
  items jsonb,
  subtotal numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  total numeric DEFAULT 0,
  paid_amount numeric DEFAULT 0,
  payment_method text DEFAULT 'Cash',
  payment_status text DEFAULT 'Pending',
  insurance_provider text,
  insurance_claim_amount numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ============ OT SCHEDULES ============
CREATE TABLE IF NOT EXISTS ot_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  patient_name text,
  surgery_name text,
  surgeon_name text,
  anesthetist_name text,
  department text,
  ot_room text DEFAULT 'OT-1',
  scheduled_date date NOT NULL,
  scheduled_time time,
  duration_minutes int DEFAULT 60,
  status text DEFAULT 'Scheduled',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ============ RLS & POLICIES ============
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'departments','staff','wards','patients','beds','appointments',
    'admissions','vitals','nursing_notes','prescriptions','medicines',
    'medicine_stocks','lab_tests','lab_orders','bills','ot_schedules'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_select_%s" ON %I;', t, t);
    EXECUTE format('CREATE POLICY "anon_select_%s" ON %I FOR SELECT TO anon, authenticated USING (true);', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_insert_%s" ON %I;', t, t);
    EXECUTE format('CREATE POLICY "anon_insert_%s" ON %I FOR INSERT TO anon, authenticated WITH CHECK (true);', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_update_%s" ON %I;', t, t);
    EXECUTE format('CREATE POLICY "anon_update_%s" ON %I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_delete_%s" ON %I;', t, t);
    EXECUTE format('CREATE POLICY "anon_delete_%s" ON %I FOR DELETE TO anon, authenticated USING (true);', t, t);
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_admissions_status ON admissions(status);
CREATE INDEX IF NOT EXISTS idx_bills_created ON bills(created_at);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status);
CREATE INDEX IF NOT EXISTS idx_vitals_patient ON vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_ot_schedule_date ON ot_schedules(scheduled_date);