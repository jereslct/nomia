-- 1. Locations: restrict SELECT to org members/owners
DROP POLICY IF EXISTS "All authenticated users can view locations" ON public.locations;
CREATE POLICY "Org members can view their locations"
ON public.locations FOR SELECT TO authenticated
USING (organization_id IS NOT NULL AND public.user_belongs_to_org(organization_id));

-- 2. QR codes: restrict SELECT to members of the org owning the location
DROP POLICY IF EXISTS "All authenticated users can view active QR codes" ON public.qr_codes;
CREATE POLICY "Org members can view active QR codes"
ON public.qr_codes FOR SELECT TO authenticated
USING (
  expires_at > now()
  AND EXISTS (
    SELECT 1 FROM public.locations l
    WHERE l.id = qr_codes.location_id
      AND l.organization_id IS NOT NULL
      AND public.user_belongs_to_org(l.organization_id)
  )
);

-- 3. Remove direct client (RPC) execution of SECURITY DEFINER helper functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_org_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_organization_owner(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_organization_id(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_email(uuid) FROM PUBLIC, anon, authenticated;