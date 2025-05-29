/*
  # Fix User Signup Process
  
  1. Changes
    - Completely rewrite the handle_new_user_signup function
    - Add proper error handling
    - Fix issues with building creation during signup
    - Ensure the trigger never fails user creation
*/

-- Create a simplified version of the function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS trigger AS $$
DECLARE
  v_building_id uuid;
  v_role text;
BEGIN
  -- Skip if no role is provided
  IF NEW.raw_user_meta_data->>'role' IS NULL THEN
    RETURN NEW;
  END IF;
  
  v_role := NEW.raw_user_meta_data->>'role';
  
  -- Only create buildings for director roles
  IF v_role IN ('rtm-director', 'sof-director') THEN
    BEGIN
      -- Create the building
      INSERT INTO buildings (
        name,
        address,
        total_units,
        management_structure
      ) VALUES (
        COALESCE(NEW.raw_user_meta_data->>'buildingName', 'My Building'),
        COALESCE(NEW.raw_user_meta_data->>'buildingAddress', 'Address not set'),
        1,
        CASE 
          WHEN v_role = 'rtm-director' THEN 'rtm'
          ELSE 'share-of-freehold'
        END
      )
      RETURNING id INTO v_building_id;
      
      -- If building creation succeeded, create the association
      IF v_building_id IS NOT NULL THEN
        -- Insert directly using SQL to bypass RLS
        BEGIN
          INSERT INTO building_users (building_id, user_id, role)
          VALUES (v_building_id, NEW.id, v_role);
        EXCEPTION WHEN OTHERS THEN
          -- Log error but don't fail user creation
          RAISE LOG 'Error creating building_user association: %', SQLERRM;
        END;
        
        -- Update user metadata with building ID
        BEGIN
          UPDATE auth.users
          SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('buildingId', v_building_id)
          WHERE id = NEW.id;
        EXCEPTION WHEN OTHERS THEN
          -- Log error but don't fail user creation
          RAISE LOG 'Error updating user metadata: %', SQLERRM;
        END;
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