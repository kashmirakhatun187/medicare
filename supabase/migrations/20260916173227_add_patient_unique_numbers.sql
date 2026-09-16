/*
# Add Unique Patient Numbers (OPD/IPD) and Bed Tracking

## Summary
This migration adds unique, sequential patient numbers for OPD and IPD patients,
enabling precise patient identification across all hospital modules.

## Changes

### 1. New Columns on `patients` table
- `opd_number` (text, nullable) — Unique sequential number for OPD patients (e.g., OPD-000001)
- `ipd_number` (text, nullable) — Unique sequential number for IPD patients (e.g., IPD-000001)
- `current_bed_id` (uuid, nullable) — References beds(id), tracks which bed the patient currently occupies
- `current_ward_name` (text, nullable) — Denormalized ward name for quick lookup

### 2. Indexes
- Unique index on `opd_number` to enforce uniqueness
- Unique index on `ipd_number` to enforce uniqueness
- Index on `mrn` for faster search

### 3. Sequence generators
- A function `generate_opd_number()` that returns the next OPD number
- A function `generate_ipd_number()` that returns the next IPD number

### 4. Backfill existing patients
- Existing OPD patients get sequential OPD numbers
- Existing IPD patients get sequential IPD numbers

### 5. Security
- No RLS policy changes — existing policies remain intact
- Functions run as SECURITY DEFINER so they can read the patients table for sequence calculation
*/

-- Add new columns
ALTER TABLE patients ADD COLUMN IF NOT EXISTS opd_number text;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS ipd_number text;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS current_bed_id uuid REFERENCES beds(id) ON DELETE SET NULL;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS current_ward_name text;

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS patients_opd_number_unique ON patients (opd_number) WHERE opd_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS patients_ipd_number_unique ON patients (ipd_number) WHERE ipd_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS patients_mrn_idx ON patients (mrn);

-- Backfill existing OPD patients
DO $$
DECLARE
  rec RECORD;
  counter int := 1;
BEGIN
  FOR rec IN SELECT id FROM patients WHERE opd_number IS NULL AND (patient_type = 'OPD' OR patient_type IS NULL) ORDER BY created_at LOOP
    UPDATE patients SET opd_number = 'OPD-' || lpad(counter::text, 6, '0') WHERE id = rec.id;
    counter := counter + 1;
  END LOOP;
END $$;

-- Backfill existing IPD patients
DO $$
DECLARE
  rec RECORD;
  counter int := 1;
BEGIN
  FOR rec IN SELECT id FROM patients WHERE ipd_number IS NULL AND patient_type = 'IPD' ORDER BY created_at LOOP
    UPDATE patients SET ipd_number = 'IPD-' || lpad(counter::text, 6, '0') WHERE id = rec.id;
    counter := counter + 1;
  END LOOP;
END $$;

-- Function to generate next OPD number
CREATE OR REPLACE FUNCTION generate_opd_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  max_num int;
  next_num int;
  result text;
BEGIN
  SELECT COALESCE(MAX(CAST(REPLACE(opd_number, 'OPD-', '') AS int)), 0) INTO max_num
  FROM patients WHERE opd_number LIKE 'OPD-%';
  next_num := max_num + 1;
  result := 'OPD-' || lpad(next_num::text, 6, '0');
  RETURN result;
END;
$$;

-- Function to generate next IPD number
CREATE OR REPLACE FUNCTION generate_ipd_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  max_num int;
  next_num int;
  result text;
BEGIN
  SELECT COALESCE(MAX(CAST(REPLACE(ipd_number, 'IPD-', '') AS int)), 0) INTO max_num
  FROM patients WHERE ipd_number LIKE 'IPD-%';
  next_num := max_num + 1;
  result := 'IPD-' || lpad(next_num::text, 6, '0');
  RETURN result;
END;
$$;
