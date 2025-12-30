-- Drop the profiles_public view as it's not needed
-- Admins can query profiles table directly (has RLS)
-- Regular users only need their own profile (covered by existing policy)
DROP VIEW IF EXISTS public.profiles_public;

-- Revoke any grants on the dropped view
-- (handled automatically when view is dropped)