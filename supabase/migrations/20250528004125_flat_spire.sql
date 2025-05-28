/*
  # Fix Building Creation RLS Policies

  1. Changes
    - Fix circular dependency between buildings and building_users tables
    - Allow users with director roles to create buildings
    - Allow users to create their first building association
    - Maintain security while fixing RLS errors

  2. Security
    - Only directors can create buildings
    - Users can only create their first building association
    - Demo building remains accessible
*/

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "building_admins_insert_buildings" ON buildings;
DROP POLICY IF EXISTS "new_user_first_association" ON building_users;

-- Create policy for authenticated users to create buildings
CREATE POLICY "building_admins_insert_buildings"
  ON buildings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- New users with director roles can create their first building
    (
      (raw_user_meta_data ->> 'role' IN ('rtm-director', 'sof-director')) AND
      NOT EXISTS (
        SELECT 1 
        FROM building_users
        WHERE user_id = auth.uid()
      )
    )
    OR
    -- Existing directors can create additional buildings
    EXISTS (
      SELECT 1 
      FROM building_users
      WHERE user_id = auth.uid()
      AND role IN ('rtm-director', 'sof-director')
    )
  );

-- Create policy for new users to create their first building association
CREATE POLICY "new_user_first_association"
  ON building_users
  FOR INSERT
  TO public
  WITH CHECK (
    (auth.uid() = user_id) AND
    user_has_no_buildings()
  );

-- Create a function to check if a user is a building director
CREATE OR REPLACE FUNCTION is_building_director(building_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM building_users
    WHERE building_id = building_uuid
    AND user_id = auth.uid()
    AND role IN ('rtm-director', 'sof-director')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the handle_new_user_signup function to bypass RLS
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS trigger AS $$
DECLARE
  v_building_id uuid;
  v_user_metadata jsonb;
  v_role text;
  v_management_structure management_structure;
BEGIN
  -- Skip if no role is provided
  IF NEW.raw_user_meta_data->>'role' IS NULL THEN
    RETURN NEW;
  END IF;

  v_role := NEW.raw_user_meta_data->>'role';
  
  -- Only create buildings for directors
  IF v_role IN ('rtm-director', 'sof-director') THEN
    -- Determine management structure based on role
    IF v_role = 'rtm-director' THEN
      v_management_structure := 'rtm';
    ELSE
      v_management_structure := 'share-of-freehold';
    END IF;
    
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

    -- Create building_users entry with SECURITY DEFINER to bypass RLS
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
    v_user_metadata := NEW.raw_user_meta_data || jsonb_build_object('buildingId', v_building_id);
    
    UPDATE auth.users
    SET raw_user_meta_data = v_user_metadata
    WHERE id = NEW.id;
    
    -- Create onboarding steps for the user
    PERFORM create_user_onboarding_steps(
      NEW.id,
      v_building_id,
      v_role
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user_signup: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_signup();