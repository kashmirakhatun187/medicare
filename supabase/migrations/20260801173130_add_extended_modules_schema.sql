/*
# Extended Schema: Inventory, HR/Payroll, Visitors

## New Tables
- `inventory_items` — medical equipment, consumables, assets
- `purchase_orders` — purchase order tracking with vendor info
- `hr_employees` — employee records for HR & payroll
- `hr_payroll` — monthly payroll records
- `hr_attendance` — daily attendance tracking
- `hr_leaves` — leave management
- `visitors` — visitor management for IPD patients
- `prescription_items` — individual prescription line items (structured)

## Security
- RLS enabled on all new tables, anon+authenticated full CRUD (shared facility data).
*/

-- ============ INVENTORY ITEMS ============
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text DEFAULT 'Consumable',
  item_type text DEFAULT 'Consumable',
  unit text,
  quantity int DEFAULT 0,
  reorder_level int DEFAULT 20,
  unit_price numeric DEFAULT 0,
  vendor text,
  location text,
  asset_tag text,
  status text DEFAULT 'In Stock',
  created_at timestamptz DEFAULT now()
);

-- ============ PURCHASE ORDERS ============
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number text UNIQUE NOT NULL,
  vendor_name text NOT NULL,
  item_description text,
  quantity int DEFAULT 1,
  unit_price numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  order_date date DEFAULT CURRENT_DATE,
  expected_date date,
  received_date date,
  status text DEFAULT 'Pending',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ============ HR EMPLOYEES ============
CREATE TABLE IF NOT EXISTS hr_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emp_id text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL,
  department text,
  phone text,
  email text,
  joining_date date DEFAULT CURRENT_DATE,
  salary numeric DEFAULT 0,
  shift text DEFAULT 'General',
  status text DEFAULT 'Active',
  address text,
  created_at timestamptz DEFAULT now()
);

-- ============ HR PAYROLL ============
CREATE TABLE IF NOT EXISTS hr_payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES hr_employees(id) ON DELETE CASCADE,
  emp_name text,
  month text NOT NULL,
  year int NOT NULL,
  basic_salary numeric DEFAULT 0,
  allowances numeric DEFAULT 0,
  deductions numeric DEFAULT 0,
  net_salary numeric DEFAULT 0,
  status text DEFAULT 'Pending',
  paid_date date,
  created_at timestamptz DEFAULT now()
);

-- ============ HR ATTENDANCE ============
CREATE TABLE IF NOT EXISTS hr_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES hr_employees(id) ON DELETE CASCADE,
  emp_name text,
  date date NOT NULL,
  check_in time,
  check_out time,
  status text DEFAULT 'Present',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ============ HR LEAVES ============
CREATE TABLE IF NOT EXISTS hr_leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES hr_employees(id) ON DELETE CASCADE,
  emp_name text,
  leave_type text DEFAULT 'Casual',
  start_date date NOT NULL,
  end_date date NOT NULL,
  days int DEFAULT 1,
  reason text,
  status text DEFAULT 'Pending',
  created_at timestamptz DEFAULT now()
);

-- ============ VISITORS ============
CREATE TABLE IF NOT EXISTS visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name text NOT NULL,
  patient_name text,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  relationship text,
  phone text,
  id_proof text,
  check_in timestamptz DEFAULT now(),
  check_out timestamptz,
  purpose text,
  status text DEFAULT 'Checked In',
  created_at timestamptz DEFAULT now()
);

-- ============ PRESCRIPTION ITEMS ============
CREATE TABLE IF NOT EXISTS prescription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid REFERENCES prescriptions(id) ON DELETE CASCADE,
  medicine_name text NOT NULL,
  dosage text,
  frequency text,
  duration text,
  instructions text,
  created_at timestamptz DEFAULT now()
);

-- ============ RLS & POLICIES ============
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'inventory_items','purchase_orders','hr_employees','hr_payroll',
    'hr_attendance','hr_leaves','visitors','prescription_items'
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

CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_hr_emp_status ON hr_employees(status);
CREATE INDEX IF NOT EXISTS idx_payroll_month ON hr_payroll(month, year);
CREATE INDEX IF NOT EXISTS idx_visitors_status ON visitors(status);