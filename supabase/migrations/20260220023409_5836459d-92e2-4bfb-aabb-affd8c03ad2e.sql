-- Allow organization members to view their organization
CREATE POLICY "Members can view their organization"
ON public.organizations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organizations.id
    AND om.user_id = auth.uid()
    AND om.status = 'accepted'
  )
);