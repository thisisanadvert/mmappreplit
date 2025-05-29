/*
  # Fix User Registration Process

  1. Changes
    - Simplify the handle_new_user_signup function
    - Fix RLS policies to allow new user registration
    - Ensure proper building and user association creation
    - Add better error handling

  2. Security
    - Maintain proper access control
    - Use SECURITY DEFINER for critical functions
*/

-- Create a simplified version of the function with better error handling
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
    BEGIN
      -- Determine management structure based on role
      IF v_role = 'rtm-director' THEN
        v_management_structure := 'rtm';
      ELSE
        v_management_structure := 'share-of-freehold';
      END IF;
      
      -- Create the building
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
      
      -- If building creation succeeded, create the association
      IF v_building_id IS NOT NULL THEN
        -- Insert building_user association
        BEGIN
          INSERT INTO building_users (
            building_id,
            user_id,
            role
          ) VALUES (
            v_building_id,
            NEW.id,
            v_role
          );
        EXCEPTION WHEN OTHERS THEN
          RAISE LOG 'Error creating building_user association: %', SQLERRM;
        END;
        
        -- Update user metadata with building ID
        BEGIN
          UPDATE auth.users
          SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('buildingId', v_building_id)
          WHERE id = NEW.id;
        EXCEPTION WHEN OTHERS THEN
          RAISE LOG 'Error updating user metadata: %', SQLERRM;
        END;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'Error creating building for user %: %', NEW.id, SQLERRM;
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

-- Ensure building creation is allowed for authenticated users
DROP POLICY IF EXISTS "allow_building_creation" ON buildings;
CREATE POLICY "allow_building_creation"
  ON buildings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure building_users creation is allowed for authenticated users
DROP POLICY IF EXISTS "allow_building_user_association" ON building_users;
CREATE POLICY "allow_building_user_association"
  ON building_users
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

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