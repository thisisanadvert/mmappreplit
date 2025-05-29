/*
  # Fix User Registration Process
  
  1. Changes
    - Simplify the handle_new_user_signup function
    - Fix RLS policy issues preventing building creation
    - Ensure proper error handling
    - Fix building association creation
    
  2. Security
    - Maintain existing security model
    - Ensure proper access control
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "allow_building_creation" ON buildings;
DROP POLICY IF EXISTS "allow_building_user_association" ON building_users;

-- Create a simplified and more reliable function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS trigger AS $$
DECLARE
  v_building_id uuid;
  v_role text;
  v_management_structure text;
BEGIN
  -- Skip if no role is provided
  IF NEW.raw_user_meta_data->>'role' IS NULL THEN
    RETURN NEW;
  END IF;

  v_role := NEW.raw_user_meta_data->>'role';
  
  -- Only create buildings for director roles
  IF v_role IN ('rtm-director', 'sof-director') THEN
    -- Determine management structure based on role
    IF v_role = 'rtm-director' THEN
      v_management_structure := 'rtm';
    ELSE
      v_management_structure := 'share-of-freehold';
    END IF;
    
    BEGIN
      -- Create the building with SECURITY DEFINER to bypass RLS
      INSERT INTO buildings (
        name,
        address,
        total_units,
        management_structure
      ) VALUES (
        COALESCE(NEW.raw_user_meta_data->>'buildingName', 'My Building'),
        COALESCE(NEW.raw_user_meta_data->>'buildingAddress', 'Address not set'),
        COALESCE((NEW.raw_user_meta_data->>'totalUnits')::integer, 1),
        v_management_structure
      )
      RETURNING id INTO v_building_id;
      
      -- Create building_users entry directly using SQL to bypass RLS
      IF v_building_id IS NOT NULL THEN
        -- Insert building_user association
        EXECUTE 'INSERT INTO building_users (building_id, user_id, role) VALUES ($1, $2, $3::user_role)'
        USING v_building_id, NEW.id, v_role;
        
        -- Update user metadata with building ID
        UPDATE auth.users
        SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('buildingId', v_building_id)
        WHERE id = NEW.id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail user creation
      RAISE LOG 'Error in handle_new_user_signup: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_signup();

-- Create simplified building creation policy
CREATE POLICY "allow_building_creation"
  ON buildings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- Allow any authenticated user to create a building

-- Create policy for building_users associations
CREATE POLICY "allow_building_user_association"
  ON building_users
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());  -- Users can only create associations for themselves

-- Create a policy for users to view their own buildings
DROP POLICY IF EXISTS "users_view_own_buildings" ON buildings;
CREATE POLICY "users_view_own_buildings"
  ON buildings
  FOR SELECT
  TO public
  USING (
    id IN (
      SELECT building_id FROM building_users
      WHERE user_id = auth.uid()
    )
  );

-- Create a policy for users to view their own building associations
DROP POLICY IF EXISTS "users_view_own_memberships" ON building_users;
CREATE POLICY "users_view_own_memberships"
  ON building_users
  FOR SELECT
  TO public
  USING (user_id = auth.uid());

-- Create a policy for directors to view all members in their buildings
DROP POLICY IF EXISTS "directors_view_members" ON building_users;
CREATE POLICY "directors_view_members"
  ON building_users
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 
      FROM building_users bu
      WHERE bu.building_id = building_users.building_id
      AND bu.user_id = auth.uid()
      AND bu.role IN ('rtm-director', 'sof-director', 'management-company')
    )
  );

-- Create a policy for directors to manage users in their buildings
DROP POLICY IF EXISTS "directors_manage_users" ON building_users;
CREATE POLICY "directors_manage_users"
  ON building_users
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 
      FROM building_users bu
      WHERE bu.building_id = building_users.building_id
      AND bu.user_id = auth.uid()
      AND bu.role IN ('rtm-director', 'sof-director', 'management-company')
    )
  );

-- Create a policy for building administrators to update buildings
DROP POLICY IF EXISTS "building_admins_update_buildings" ON buildings;
CREATE POLICY "building_admins_update_buildings"
  ON buildings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM building_users bu
      WHERE bu.building_id = buildings.id
      AND bu.user_id = auth.uid()
      AND bu.role IN ('rtm-director', 'sof-director', 'management-company')
    )
  );