/*
  # Fix signup flow and initial user creation

  1. Changes
    - Add policy to allow initial user creation
    - Fix building user association for new signups
    - Ensure proper role assignment
    
  2. Security
    - Maintains RLS protection
    - Only allows users to create their own initial association
*/

-- Allow new users to create their initial building association
CREATE POLICY "allow_initial_user_creation"
ON building_users
FOR INSERT 
TO authenticated
WITH CHECK (
  -- User can only create an association for themselves
  auth.uid() = user_id
  AND
  -- Ensure this is their first association
  NOT EXISTS (
    SELECT 1 FROM building_users
    WHERE user_id = auth.uid()
  )
);

-- Ensure building_users has RLS enabled
ALTER TABLE building_users ENABLE ROW LEVEL SECURITY;