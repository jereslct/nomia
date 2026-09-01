CREATE OR REPLACE FUNCTION public.get_user_email(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user_id = auth.uid() THEN (SELECT email FROM auth.users WHERE id = _user_id LIMIT 1)
    ELSE NULL
  END
$$;

REVOKE ALL ON FUNCTION public.get_user_email(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.get_user_organization_id(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE ALL ON FUNCTION public.is_organization_owner(uuid, uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.get_org_default_shift(uuid) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.users_share_organization(uuid, uuid) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.user_belongs_to_org(uuid) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION public.get_user_email(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_organization_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_organization_owner(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_org_admin(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = _org_id AND o.owner_id = auth.uid()
  ) OR (
    public.has_role(auth.uid(), 'admin')
    AND EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = _org_id
        AND m.user_id = auth.uid()
        AND m.status = 'accepted'
    )
  )
$$;

REVOKE ALL ON FUNCTION public.is_org_admin(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid) TO authenticated;

DROP POLICY IF EXISTS "Public read access for absence certificates" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload absence certificates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view employee documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload employee documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete employee documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view pay stubs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload pay stubs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete pay stubs" ON storage.objects;

CREATE POLICY "HR files: owner or org admin can read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id IN ('absence-certificates', 'employee-documents', 'pay-stubs')
  AND (
    (storage.foldername(name))[2] = auth.uid()::text
    OR public.is_org_admin(NULLIF((storage.foldername(name))[1], '')::uuid)
  )
);

CREATE POLICY "HR files: owner or org admin can upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('absence-certificates', 'employee-documents', 'pay-stubs')
  AND (
    (storage.foldername(name))[2] = auth.uid()::text
    OR public.is_org_admin(NULLIF((storage.foldername(name))[1], '')::uuid)
  )
);

CREATE POLICY "HR files: owner or org admin can update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id IN ('absence-certificates', 'employee-documents', 'pay-stubs')
  AND (
    (storage.foldername(name))[2] = auth.uid()::text
    OR public.is_org_admin(NULLIF((storage.foldername(name))[1], '')::uuid)
  )
)
WITH CHECK (
  bucket_id IN ('absence-certificates', 'employee-documents', 'pay-stubs')
  AND (
    (storage.foldername(name))[2] = auth.uid()::text
    OR public.is_org_admin(NULLIF((storage.foldername(name))[1], '')::uuid)
  )
);

CREATE POLICY "HR files: owner or org admin can delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id IN ('absence-certificates', 'employee-documents', 'pay-stubs')
  AND (
    (storage.foldername(name))[2] = auth.uid()::text
    OR public.is_org_admin(NULLIF((storage.foldername(name))[1], '')::uuid)
  )
);