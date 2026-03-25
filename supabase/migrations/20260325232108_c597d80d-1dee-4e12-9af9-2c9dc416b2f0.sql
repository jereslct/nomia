-- Allow admins to insert attendance records for members of their organization
-- This fixes the manual registration feature in /admin where admin registers
-- attendance for employees, but the current policy only allows user_id = auth.uid()

CREATE POLICY "Admins can insert attendance for org members"
ON public.attendance_records
FOR INSERT
TO public
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.organizations o
    JOIN public.locations l ON l.organization_id = o.id
    WHERE o.owner_id = auth.uid()
      AND l.id = attendance_records.location_id
  )
);