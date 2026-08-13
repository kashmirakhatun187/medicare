/*
# Create inquiries table

## Overview
Stores visitor inquiries submitted from the public site without requiring login.
Admin can view and respond to inquiries from the dashboard.

## New Tables
- `inquiries`
  - `id` (uuid, PK)
  - `name` (text, required)
  - `email` (text, required)
  - `phone` (text, nullable)
  - `category` (text, required — Service, Department, Appointment, General)
  - `subject` (text, required)
  - `message` (text, required)
  - `status` (text, default 'New' — New, Responded, Closed)
  - `created_at` (timestamptz)

## Security
- RLS enabled. INSERT allowed for anon (public form). SELECT/UPDATE for authenticated (admin dashboard).
*/

CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  category text NOT NULL DEFAULT 'General',
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'New',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anon) to submit inquiries from the public site
DROP POLICY IF EXISTS "anon_insert_inquiries" ON inquiries;
CREATE POLICY "anon_insert_inquiries" ON inquiries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Only authenticated users (admin) can view inquiries
DROP POLICY IF EXISTS "auth_select_inquiries" ON inquiries;
CREATE POLICY "auth_select_inquiries" ON inquiries FOR SELECT
  TO authenticated USING (true);

-- Only authenticated users (admin) can update inquiry status
DROP POLICY IF EXISTS "auth_update_inquiries" ON inquiries;
CREATE POLICY "auth_update_inquiries" ON inquiries FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Only authenticated users (admin) can delete inquiries
DROP POLICY IF EXISTS "auth_delete_inquiries" ON inquiries;
CREATE POLICY "auth_delete_inquiries" ON inquiries FOR DELETE
  TO authenticated USING (true);