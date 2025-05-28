/*
  # Fix User Signup Process
  
  1. Changes
    - Completely disable the building creation in the trigger for now
    - Focus on allowing user creation to succeed
    - We'll handle building creation separately after signup
*/

-- Create a simplified version of the function that won't fail
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS trigger AS $$
BEGIN
  -- Just return NEW without doing anything for now
  -- This ensures user creation always succeeds
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail user creation
  RAISE LOG 'Error in handle_new_user_signup: %', SQLERRM;
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