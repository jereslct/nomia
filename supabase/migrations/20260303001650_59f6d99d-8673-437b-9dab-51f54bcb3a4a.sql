-- Add DELETE policy for locations table
CREATE POLICY "Admins can delete locations"
ON public.locations FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));