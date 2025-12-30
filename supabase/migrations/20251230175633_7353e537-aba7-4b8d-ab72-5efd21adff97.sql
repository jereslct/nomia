-- Remove the policy that exposes email/phone to all organization colleagues
DROP POLICY IF EXISTS "Users can view organization colleagues profiles" ON public.profiles;

-- Users can only view their own full profile (includes email, phone)
-- The "Users can view own profile" policy already exists, so this is sufficient
-- Admins can view all profiles via "Admins can view all profile fields" policy (already added)