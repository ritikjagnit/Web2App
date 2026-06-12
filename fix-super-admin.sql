-- This script allows the Super Admin dashboard to view all users, apps, and builds
-- without needing a dedicated admin account, by allowing public read access.

-- 1. Allow everyone to read profiles (User Directory)
DROP POLICY IF EXISTS "Profiles select own or admin" ON public.profiles;
CREATE POLICY "Profiles select own or admin" ON public.profiles FOR SELECT USING (true);

-- 2. Allow everyone to read apps (Global Deployments)
DROP POLICY IF EXISTS "Apps select own or admin" ON public.apps;
CREATE POLICY "Apps select own or admin" ON public.apps FOR SELECT USING (true);

-- 3. Allow everyone to read builds (Total Processed)
DROP POLICY IF EXISTS "Builds select own or admin" ON public.builds;
CREATE POLICY "Builds select own or admin" ON public.builds FOR SELECT USING (true);

-- 4. Fix profile creation issue (In case trigger is missing or failing)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, plan)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'free'
  )
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;
