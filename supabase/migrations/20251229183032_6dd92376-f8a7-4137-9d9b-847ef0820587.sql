-- Allow organization owners to delete their organizations
CREATE POLICY "Owners can delete their organizations"
ON public.organizations
FOR DELETE
USING (owner_id = auth.uid());