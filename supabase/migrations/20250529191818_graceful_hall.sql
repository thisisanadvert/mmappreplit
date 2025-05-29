/*
  # Fix Interest Registrations Table

  1. Changes
    - Create interest_registrations table for storing signup requests
    - Add proper RLS policies using auth.role() instead of role()
    - Allow public inserts but restrict viewing to admins
    
  2. Security
    - Enable RLS on the table
    - Only service_role can view and update records
    - Public users can insert new records
*/

-- Create interest registrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS interest_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL,
  phone text,
  building_name text,
  building_address text,
  unit_number text,
  company_name text,
  created_at timestamptz DEFAULT now(),
  contacted boolean DEFAULT false,
  contacted_at timestamptz,
  notes text
);

-- Enable RLS
ALTER TABLE interest_registrations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Only admins can view interest registrations" ON interest_registrations;
DROP POLICY IF EXISTS "Only admins can insert interest registrations" ON interest_registrations;
DROP POLICY IF EXISTS "Only admins can update interest registrations" ON interest_registrations;
DROP POLICY IF EXISTS "Public can insert interest registrations" ON interest_registrations;

-- Create RLS policies
CREATE POLICY "Only admins can view interest registrations"
  ON interest_registrations
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Public can insert interest registrations"
  ON interest_registrations
  FOR INSERT
  TO public
  WITH CHECK (true);  -- Allow anyone to insert

CREATE POLICY "Only admins can update interest registrations"
  ON interest_registrations
  FOR UPDATE
  TO service_role
  USING (true);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS interest_registrations_email_idx ON interest_registrations (email);