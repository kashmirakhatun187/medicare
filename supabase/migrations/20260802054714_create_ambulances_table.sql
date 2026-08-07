/*
# Create ambulances table

## Overview
Creates a table to store ambulance fleet data so it persists in the database
instead of being hardcoded in the frontend.

## New Tables
- `ambulances`
  - `id` (uuid, PK)
  - `vehicle_id` (text, unique — e.g. AMB-01)
  - `driver_name` (text)
  - `driver_phone` (text)
  - `status` (text: Available, On Call, Maintenance — default Available)
  - `created_at` (timestamptz)

## Security
- RLS enabled, authenticated-only CRUD.
*/

CREATE TABLE IF NOT EXISTS ambulances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id text UNIQUE NOT NULL,
  driver_name text NOT NULL,
  driver_phone text,
  status text DEFAULT 'Available',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ambulances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_ambulances" ON ambulances;
CREATE POLICY "auth_select_ambulances" ON ambulances FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_ambulances" ON ambulances;
CREATE POLICY "auth_insert_ambulances" ON ambulances FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_ambulances" ON ambulances;
CREATE POLICY "auth_update_ambulances" ON ambulances FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_ambulances" ON ambulances;
CREATE POLICY "auth_delete_ambulances" ON ambulances FOR DELETE TO authenticated USING (true);