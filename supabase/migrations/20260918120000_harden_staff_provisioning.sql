/*
  Final authentication hardening.

  Public Auth signups are always provisioned as patients by the trigger. Staff
  accounts are created only by the create-staff Edge Function, which uses the
  service-role key on the server.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, phone, role, status)
  VALUES (
    NEW.id,
    lower(NEW.email),
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), split_part(NEW.email, '@', 1)),
    NULLIF(NEW.raw_user_meta_data ->> 'phone', ''),
    'patient',
    'Active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "insert_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "allow_anon_profile_insert" ON public.user_profiles;
DROP POLICY IF EXISTS "anon_insert_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "profiles_insert_self_or_admin" ON public.user_profiles;

CREATE POLICY "profiles_insert_self_patient_or_admin"
  ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK ((id = auth.uid() AND role = 'patient') OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_admin" ON public.user_profiles;
CREATE POLICY "profiles_update_admin"
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
