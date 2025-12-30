-- Fix cross-organization admin access to profiles
-- Replace the overly permissive policy with organization-scoped access

DROP POLICY IF EXISTS "Admins can view all profile fields" ON public.profiles;

-- Admins can only view profiles of users within their organization
CREATE POLICY "Admins can view org member profiles"
ON public.profiles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role) AND
  (
    -- Admin can always view their own profile
    auth.uid() = user_id
    OR
    -- Admin can view profiles of accepted members in their organization
    EXISTS (
      SELECT 1
      FROM public.organizations o
      JOIN public.organization_members om ON om.organization_id = o.id
      WHERE o.owner_id = auth.uid()
        AND om.user_id = profiles.user_id
        AND om.status = 'accepted'
    )
  )
);