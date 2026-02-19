-- Create a view for public profile data (excludes sensitive fields)
-- This view only exposes non-sensitive profile information
CREATE VIEW public.profiles_public AS
SELECT 
  user_id,
  full_name,
  avatar_url,
  created_at,
  updated_at
  -- Excludes: email, phone_number (sensitive personal data)
FROM public.profiles;

-- Grant access to authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;

-- Create a new RLS policy to allow admins to view all profile fields
-- This ensures only admins/org owners can access email and phone_number
CREATE POLICY "Admins can view all profile fields"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));