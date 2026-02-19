-- Make user_id nullable to allow pending invitations
ALTER TABLE public.organization_members 
ALTER COLUMN user_id DROP NOT NULL;

-- Drop problematic policies that reference auth.users
DROP POLICY IF EXISTS "Org owners can view members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can update their own membership status" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view their own membership" ON public.organization_members;

-- Recreate policies without referencing auth.users table directly
CREATE POLICY "Org owners can view members"
ON public.organization_members
FOR SELECT
USING (
  public.is_organization_owner(organization_id, auth.uid())
);

CREATE POLICY "Members can view own membership"
ON public.organization_members
FOR SELECT
USING (
  user_id = auth.uid()
);

CREATE POLICY "Pending invitees can view their invitation"
ON public.organization_members
FOR SELECT
USING (
  invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Create security definer function for checking email ownership
CREATE OR REPLACE FUNCTION public.get_user_email(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = _user_id LIMIT 1
$$;

-- Drop and recreate policies using security definer
DROP POLICY IF EXISTS "Pending invitees can view their invitation" ON public.organization_members;

CREATE POLICY "Pending invitees can view their invitation"
ON public.organization_members
FOR SELECT
USING (
  invited_email = public.get_user_email(auth.uid())
);
