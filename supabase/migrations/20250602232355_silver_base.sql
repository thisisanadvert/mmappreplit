/*
  # Fix RLS Recursion with SECURITY DEFINER Function

  1. Changes
    - Create SECURITY DEFINER function for checking building membership
    - Update RLS policies to use the new function
    - Add initial user creation policy
    - Enable RLS on building_users table

  2. Security
    - Function runs with elevated privileges to prevent recursion
    - Policies ensure proper access control
    - Special handling for demo building access
*/

-- Create helper function to check building membership
CREATE OR REPLACE FUNCTION public.check_building_membership(building_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Special case for demo building
  IF building_id = 'b0a3f3f0-0b1a-4e1a-9f1a-0e1b2c3d4e5f'::uuid THEN
    RETURN true;
  END IF;

  -- Check if user is a director/manager of the building
  RETURN EXISTS (
    SELECT 1 FROM building_users
    WHERE building_users.building_id = $1
    AND building_users.user_id = $2
    AND building_users.role IN ('rtm-director', 'sof-director', 'management-company')
  );
END;
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "allow_building_user_association" ON building_users;
DROP POLICY IF EXISTS "demo_building_access" ON building_users;
DROP POLICY IF EXISTS "directors_create_users" ON building_users;
DROP POLICY IF EXISTS "directors_delete_users" ON building_users;
DROP POLICY IF EXISTS "directors_manage_users" ON building_users;
DROP POLICY IF EXISTS "directors_update_users" ON building_users;
DROP POLICY IF EXISTS "directors_view_members" ON building_users;
DROP POLICY IF EXISTS "users_view_own_memberships" ON building_users;
DROP POLICY IF EXISTS "allow_initial_user_creation" ON building_users;

-- Create new policies using the SECURITY DEFINER function
CREATE POLICY "users_view_own_memberships"
ON building_users
FOR SELECT
TO public
USING (auth.uid() = user_id);

CREATE POLICY "directors_view_members"
ON building_users
FOR SELECT
TO public
USING (check_building_membership(building_id, auth.uid()));

CREATE POLICY "directors_create_users"
ON building_users
FOR INSERT
TO public
WITH CHECK (check_building_membership(building_id, auth.uid()));

CREATE POLICY "directors_update_users"
ON building_users
FOR UPDATE
TO public
USING (check_building_membership(building_id, auth.uid()))
WITH CHECK (check_building_membership(building_id, auth.uid()));

CREATE POLICY "directors_delete_users"
ON building_users
FOR DELETE
TO public
USING (check_building_membership(building_id, auth.uid()));

-- Allow new users to create their initial building association
CREATE POLICY "allow_initial_user_creation"
ON building_users
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND
  NOT EXISTS (
    SELECT 1 FROM building_users
    WHERE user_id = auth.uid()
  )
);

-- Ensure RLS is enabled
ALTER TABLE building_users ENABLE ROW LEVEL SECURITY;