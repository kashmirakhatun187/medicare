/*
# Allow self-registration for user_profiles

## Changes
- Allow anon (unauthenticated) users to INSERT into user_profiles so that
  the sign-up flow can create a profile after auth.signUp succeeds.
- Keep SELECT/UPDATE/DELETE as authenticated-only.
*/

DROP POLICY IF EXISTS "insert_profiles" ON user_profiles;
CREATE POLICY "insert_profiles" ON user_profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);