-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admins can view organization attendance" ON public.attendance_records;

-- Create a simpler policy that allows admins to view all attendance records
CREATE POLICY "Admins can view all attendance" 
ON public.attendance_records 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));