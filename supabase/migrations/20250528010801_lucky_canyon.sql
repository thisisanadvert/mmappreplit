/*
  # Fix User Signup Process
  
  1. Changes
    - Simplify the handle_new_user_signup function
    - Add better error handling
    - Fix issues with building creation during signup
    - Ensure proper role conversion
    
  2. Security
    - Maintain existing security model
    - Ensure proper access control
*/

-- Create a simplified version of the function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS trigger AS $$
DECLARE
  v_building_id uuid;
  v_role text;
  v_management_structure text;
  v_role_enum user_role;
BEGIN
  -- Skip if no role is provided
  IF NEW.raw_user_meta_data->>'role' IS NULL THEN
    RETURN NEW;
  END IF;
  
  v_role := NEW.raw_user_meta_data->>'role';
  
  -- Only create buildings for director roles
  IF v_role IN ('rtm-director', 'sof-director') THEN
    BEGIN
      -- Convert text role to enum
      IF v_role = 'rtm-director' THEN
        v_role_enum := 'rtm-director'::user_role;
        v_management_structure := 'rtm';
      ELSE
        v_role_enum := 'sof-director'::user_role;
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
        v_management_structure::management_structure
      )
      RETURNING id INTO v_building_id;
      
      -- If building creation succeeded, create the association
      IF v_building_id IS NOT NULL THEN
        -- Insert directly using SQL to bypass RLS
        INSERT INTO building_users (
          building_id,
          user_id,
          role
        ) VALUES (
          v_building_id,
          NEW.id,
          v_role_enum
        );
        
        -- Update user metadata with building ID
        UPDATE auth.users
        SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('buildingId', v_building_id)
        WHERE id = NEW.id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail user creation
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