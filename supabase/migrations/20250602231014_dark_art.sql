/*
  # Fix User Registration Process

  1. Changes:
    - Simplify user signup trigger function
    - Fix RLS policies for building creation
    - Add proper error handling
    - Ensure building associations work correctly

  2. Security:
    - Use SECURITY DEFINER for elevated permissions
    - Add proper RLS policies
    - Maintain data integrity
*/

-- Drop existing problematic policies if they exist
DROP POLICY IF EXISTS "allow_building_creation" ON buildings;
DROP POLICY IF EXISTS "building_admins_update_buildings" ON buildings;

-- Create a simplified and more reliable function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS trigger AS $$
DECLARE
  v_building_id uuid;
  v_role text;
  v_management_structure text;
BEGIN
  -- Get role from metadata
  v_role := NEW.raw_user_meta_data->>'role';
  
  -- Only proceed if role is provided
  IF v_role IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only create buildings for director roles
  IF v_role IN ('rtm-director', 'sof-director') THEN
    -- Set management structure based on role
    v_management_structure := CASE 
      WHEN v_role = 'rtm-director' THEN 'rtm'
      ELSE 'share-of-freehold'
    END;
    
    -- Create building
    INSERT INTO buildings (
      name,
      address,
      total_units,
      management_structure
    ) VALUES (
      COALESCE(NEW.raw_user_meta_data->>'buildingName', 'New Building'),
      COALESCE(NEW.raw_user_meta_data->>'buildingAddress', ''),
      COALESCE((NEW.raw_user_meta_data->>'totalUnits')::integer, 1),
      v_management_structure
    )
    RETURNING id INTO v_building_id;

    -- Create building association
    IF v_building_id IS NOT NULL THEN
      INSERT INTO building_users (
        building_id,
        user_id,
        role
      ) VALUES (
        v_building_id,
        NEW.id,
        v_role::user_role
      );

      -- Update user metadata with building ID
      UPDATE auth.users
      SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('buildingId', v_building_id)
      WHERE id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail user creation
  RAISE LOG 'Error in handle_new_user_signup: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_signup();

-- Update RLS policies for buildings table
CREATE POLICY "allow_building_creation" ON buildings
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "users_view_own_buildings" ON buildings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM building_users
      WHERE building_users.building_id = id
      AND building_users.user_id = auth.uid()
    )
  );

CREATE POLICY "directors_manage_buildings" ON buildings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM building_users
      WHERE building_users.building_id = id
      AND building_users.user_id = auth.uid()
      AND building_users.role IN ('rtm-director'::user_role, 'sof-director'::user_role)
    )
  );

-- Update RLS policies for building_users table
CREATE POLICY "allow_initial_building_user" ON building_users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_view_own_memberships" ON building_users
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "directors_manage_users" ON building_users
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM building_users bu
      WHERE bu.building_id = building_id
      AND bu.user_id = auth.uid()
      AND bu.role IN ('rtm-director'::user_role, 'sof-director'::user_role)
    )
  );