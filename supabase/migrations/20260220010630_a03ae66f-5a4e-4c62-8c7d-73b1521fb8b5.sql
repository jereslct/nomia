
DROP POLICY IF EXISTS "Admins can view org member profiles" ON public.profiles;

CREATE POLICY "Admins can view org member profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) AND (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM organizations o
      JOIN organization_members om ON om.organization_id = o.id
      WHERE o.owner_id = auth.uid() AND om.user_id = profiles.user_id AND om.status = 'accepted'
    )
    OR EXISTS (
      SELECT 1 FROM attendance_records ar
      JOIN locations l ON l.id = ar.location_id
      JOIN organizations o ON o.id = l.organization_id
      WHERE ar.user_id = profiles.user_id AND o.owner_id = auth.uid()
    )
  )
);
