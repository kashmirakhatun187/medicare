/*
# Add User Profiles with Role-Based Access Control

## Overview
Adds a `user_profiles` table that links to Supabase `auth.users` and stores a role
for each user. Roles determine which pages/modules a user can access in the nursing home app.

## New Tables
- `user_profiles`
  - `id` (uuid, PK, FK to auth.users)
  - `email` (text, unique)
  - `full_name` (text)
  - `role` (text: admin, doctor, nurse, receptionist, pharmacist, lab_tech, accountant)
  - `department` (text, nullable)
  - `phone` (text, nullable)
  - `status` (text, default 'Active')
  - `created_at` (timestamptz)

## Security
- RLS enabled on user_profiles.
- SELECT: authenticated users can read all profiles (needed for staff lists).
- INSERT/UPDATE/DELETE: only authenticated users (admin manages accounts).
- All other existing tables: policies updated from `TO anon, authenticated` to
  `TO authenticated` only — the app now requires login.

## Role Definitions
1. admin — full access to all 18 modules
2. doctor — Dashboard, Patients, Appointments, Prescriptions, Nursing, Beds, OT, Lab, Reports
3. nurse — Dashboard, Patients, Nursing, Beds, Vitals, Visitors
4. receptionist — Dashboard, Patients, Appointments, Admissions, Visitors, Billing
5. pharmacist — Dashboard, Pharmacy, Inventory, Billing
6. lab_tech — Dashboard, Lab, Patients (read-only)
7. accountant — Dashboard, Billing, Reports, HR
*/

-- ============ USER PROFILES ============
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'receptionist',
  department text,
  phone text,
  status text DEFAULT 'Active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_all_profiles" ON user_profiles;
CREATE POLICY "read_all_profiles" ON user_profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_profiles" ON user_profiles;
CREATE POLICY "insert_profiles" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_profiles" ON user_profiles;
CREATE POLICY "update_profiles" ON user_profiles FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_profiles" ON user_profiles;
CREATE POLICY "delete_profiles" ON user_profiles FOR DELETE
  TO authenticated USING (true);

-- ============ UPDATE EXISTING TABLE POLICIES ============
-- Switch all existing tables from anon+authenticated to authenticated-only
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'departments','staff','wards','patients','beds','appointments',
    'admissions','vitals','nursing_notes','prescriptions','medicines',
    'medicine_stocks','lab_tests','lab_orders','bills','ot_schedules',
    'inventory_items','purchase_orders','hr_employees','hr_payroll',
    'hr_attendance','hr_leaves','visitors','prescription_items'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Drop old anon policies
    EXECUTE format('DROP POLICY IF EXISTS "anon_select_%s" ON %I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_insert_%s" ON %I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_update_%s" ON %I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_delete_%s" ON %I;', t, t);

    -- Create authenticated-only policies
    EXECUTE format('CREATE POLICY "auth_select_%s" ON %I FOR SELECT TO authenticated USING (true);', t, t);
    EXECUTE format('CREATE POLICY "auth_insert_%s" ON %I FOR INSERT TO authenticated WITH CHECK (true);', t, t);
    EXECUTE format('CREATE POLICY "auth_update_%s" ON %I FOR UPDATE TO authenticated USING (true) WITH CHECK (true);', t, t);
    EXECUTE format('CREATE POLICY "auth_delete_%s" ON %I FOR DELETE TO authenticated USING (true);', t, t);
  END LOOP;
END $$;