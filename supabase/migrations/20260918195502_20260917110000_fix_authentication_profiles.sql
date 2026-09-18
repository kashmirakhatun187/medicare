/*
  Fix authentication profile provisioning and profile authorization.

  Profiles are created by a SECURITY DEFINER trigger when an Auth user is
  created. This is required when email confirmation is enabled because the
  browser has no authenticated session during sign-up.
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
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, public.user_profiles.phone);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND lower(status) = 'active'
  );
$$;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_all_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "insert_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "update_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "delete_profiles" ON public.user_profiles;

CREATE POLICY "profiles_read_own_or_admin"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_insert_self_or_admin"
  ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK ((id = auth.uid() AND role = 'patient') OR public.is_admin());

CREATE POLICY "profiles_update_admin"
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "profiles_delete_admin"
  ON public.user_profiles FOR DELETE TO authenticated
  USING (public.is_admin());

-- The trigger, not an anonymous browser request, provisions profiles.
DROP POLICY IF EXISTS "allow_anon_profile_insert" ON public.user_profiles;
DROP POLICY IF EXISTS "anon_insert_profiles" ON public.user_profiles;