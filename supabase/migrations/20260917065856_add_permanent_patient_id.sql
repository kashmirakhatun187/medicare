/*
# Add Permanent Patient ID (PT-000001) and Encounter System

## Summary
This migration adds a permanent Patient ID column to the patients table, separate from
the encounter-based OPD/IPD numbers. The Patient ID is assigned once at registration
and never changes, even when the patient returns for new OPD visits or IPD admissions.

## Changes

### 1. New Column on `patients`
- `patient_id` (text, nullable) — Permanent unique patient identifier (e.g., PT-000001)

### 2. Unique Index
- Unique partial index on `patient_id` where NOT NULL

### 3. Backfill
- All existing patients get sequential PT- numbers ordered by created_at

### 4. Functions
- `generate_patient_id()` — returns next PT- number
- `generate_opd_number()` — updated to work with encounter model (already exists, kept as-is)
- `generate_ipd_number()` — updated to work with encounter model (already exists, kept as-is)

### 5. Security
- No RLS changes. Functions are SECURITY DEFINER for sequence calculation.
*/

ALTER TABLE patients ADD COLUMN IF NOT EXISTS patient_id text;

CREATE UNIQUE INDEX IF NOT EXISTS patients_patient_id_unique ON patients (patient_id) WHERE patient_id IS NOT NULL;

-- Backfill existing patients
DO $$
DECLARE
  rec RECORD;
  counter int := 1;
BEGIN
  FOR rec IN SELECT id FROM patients WHERE patient_id IS NULL ORDER BY created_at LOOP
    UPDATE patients SET patient_id = 'PT-' || lpad(counter::text, 6, '0') WHERE id = rec.id;
    counter := counter + 1;
  END LOOP;
END $$;

-- Function to generate next permanent Patient ID
CREATE OR REPLACE FUNCTION generate_patient_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  max_num int;
  next_num int;
  result text;
BEGIN
  SELECT COALESCE(MAX(CAST(REPLACE(patient_id, 'PT-', '') AS int)), 0) INTO max_num
  FROM patients WHERE patient_id LIKE 'PT-%';
  next_num := max_num + 1;
  result := 'PT-' || lpad(next_num::text, 6, '0');
  RETURN result;
END;
$$;
