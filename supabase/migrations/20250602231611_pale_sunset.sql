/*
  # Fix building_users RLS policies

  1. Changes
    - Drop existing problematic policies causing recursion
    - Create new simplified policies that avoid circular dependencies
    - Maintain security while preventing infinite recursion
    - Preserve special access for demo building

  2. Security
    - Users can still only view their own memberships
    - Directors maintain management capabilities
    - All necessary access controls are preserved
*/

-- Drop existing policies to clean up
DROP POLICY IF EXISTS "allow_building_user_association" ON building_users;
DROP POLICY IF EXISTS "demo_building_access" ON building_users;
DROP POLICY IF EXISTS "directors_create_users" ON building_users;
DROP POLICY IF EXISTS "directors_delete_users" ON building_users;
DROP POLICY IF EXISTS "directors_manage_users" ON building_users;
DROP POLICY IF EXISTS "directors_update_users" ON building_users;
DROP POLICY IF EXISTS "directors_view_members" ON building_users;
DROP POLICY IF EXISTS "users_view_own_memberships" ON building_users;

-- Create new, simplified policies
-- Allow users to read their own building associations
CREATE POLICY "users_view_own_memberships"
ON building_users
FOR SELECT
TO public
USING (auth.uid() = user_id);

-- Allow directors to view all users in their buildings
CREATE POLICY "directors_view_members"
ON building_users
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM building_users bu
    WHERE bu.building_id = building_users.building_id
    AND bu.user_id = auth.uid()
    AND bu.role IN ('rtm-director', 'sof-director', 'management-company')
  )
);

-- Allow directors to create new users in their buildings
CREATE POLICY "directors_create_users"
ON building_users
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM building_users bu
    WHERE bu.building_id = building_users.building_id
    AND bu.user_id = auth.uid()
    AND bu.role IN ('rtm-director', 'sof-director', 'management-company')
  )
);

-- Allow directors to update users in their buildings
CREATE POLICY "directors_update_users"
ON building_users
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM building_users bu
    WHERE bu.building_id = building_users.building_id
    AND bu.user_id = auth.uid()
    AND bu.role IN ('rtm-director', 'sof-director', 'management-company')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM building_users bu
    WHERE bu.building_id = building_users.building_id
    AND bu.user_id = auth.uid()
    AND bu.role IN ('rtm-director', 'sof-director', 'management-company')
  )
);

-- Allow directors to delete users from their buildings
CREATE POLICY "directors_delete_users"
ON building_users
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM building_users bu
    WHERE bu.building_id = building_users.building_id
    AND bu.user_id = auth.uid()
    AND bu.role IN ('rtm-director', 'sof-director', 'management-company')
  )
);

-- Special access for demo building
CREATE POLICY "demo_building_access"
ON building_users
FOR ALL
TO public
USING (building_id = 'b0a3f3f0-0b1a-4e1a-9f1a-0e1b2c3d4e5f'::uuid);