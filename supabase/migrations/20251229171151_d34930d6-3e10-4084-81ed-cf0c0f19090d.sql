
-- Create a security definer function to check organization ownership
CREATE OR REPLACE FUNCTION public.is_organization_owner(_org_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE id = _org_id
      AND owner_id = _user_id
  )
$$;

-- Create a function to get user's organization id as owner
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.organizations
  WHERE owner_id = _user_id
  LIMIT 1
$$;

-- Drop existing problematic policies on organizations
DROP POLICY IF EXISTS "Users can view their own organizations" ON public.organizations;

-- Create new non-recursive SELECT policy for organizations
CREATE POLICY "Users can view organizations"
ON public.organizations
FOR SELECT
USING (
  owner_id = auth.uid()
);

-- Drop existing problematic policy on organization_members  
DROP POLICY IF EXISTS "Org owners can manage members" ON public.organization_members;

-- Create new policies for organization_members using security definer function
CREATE POLICY "Org owners can view members"
ON public.organization_members
FOR SELECT
USING (
  is_organization_owner(organization_id, auth.uid())
  OR user_id = auth.uid()
  OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "Org owners can insert members"
ON public.organization_members
FOR INSERT
WITH CHECK (
  is_organization_owner(organization_id, auth.uid())
);

CREATE POLICY "Org owners can update members"
ON public.organization_members
FOR UPDATE
USING (
  is_organization_owner(organization_id, auth.uid())
);

CREATE POLICY "Org owners can delete members"
ON public.organization_members
FOR DELETE
USING (
  is_organization_owner(organization_id, auth.uid())
);
