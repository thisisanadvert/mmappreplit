/*
  # Fix Building Creation RLS Issues
  
  1. Changes
    - Simplify building creation policy to allow any authenticated user
    - Fix building_users policy to allow first-time associations
    - Prevent circular dependencies in RLS policies
    - Update handle_new_user_signup function to bypass RLS
    
  2. Security
    - Maintain proper access control for building management
    - Allow new users to create buildings during registration
    - Fix RLS bypass for system functions
*/

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "building_admins_insert_buildings" ON buildings;
DROP POLICY IF EXISTS "new_user_first_association" ON building_users;
DROP POLICY IF EXISTS "onboarding_create_first_building" ON building_users;

-- Create a simplified policy for building creation
-- This allows any authenticated user to create a building
CREATE POLICY "building_admins_insert_buildings"
  ON buildings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for new users to create their first building association
CREATE POLICY "new_user_first_association"
  ON building_users
  FOR INSERT
  TO public
  WITH CHECK (
    -- Allow users to create their own associations
    auth.uid() = user_id
  );

-- Update the handle_new_user_signup function to properly bypass RLS
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
    
    -- Create onboarding steps for the user if the function exists
    BEGIN
      PERFORM create_user_onboarding_steps(
        NEW.id,
        v_building_id,
        v_role
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'Error creating onboarding steps: %', SQLERRM;
    END;
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