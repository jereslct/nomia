-- Create a security definer function to check if two users are in the same organization
CREATE OR REPLACE FUNCTION public.users_share_organization(_viewer_id uuid, _profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Check if viewer is an org owner and profile_user is a member of their org
    SELECT 1
    FROM public.organizations o
    JOIN public.organization_members om ON om.organization_id = o.id
    WHERE o.owner_id = _viewer_id
      AND om.user_id = _profile_user_id
      AND om.status = 'accepted'
  )
  OR EXISTS (
    -- Check if both users are accepted members of the same organization
    SELECT 1
    FROM public.organization_members om1
    JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = _viewer_id
      AND om2.user_id = _profile_user_id
      AND om1.status = 'accepted'
      AND om2.status = 'accepted'
  )
  OR EXISTS (
    -- Check if profile_user is the owner of an org where viewer is a member
    SELECT 1
    FROM public.organizations o
    JOIN public.organization_members om ON om.organization_id = o.id
    WHERE o.owner_id = _profile_user_id
      AND om.user_id = _viewer_id
      AND om.status = 'accepted'
  )
$$;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create new restricted policies
-- 1. Users can always view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- 2. Users can view profiles of colleagues in the same organization
CREATE POLICY "Users can view organization colleagues profiles"
ON public.profiles
FOR SELECT
USING (public.users_share_organization(auth.uid(), user_id));