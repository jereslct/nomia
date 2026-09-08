CREATE SCHEMA IF NOT EXISTS app_private;
GRANT USAGE ON SCHEMA app_private TO authenticated, anon, service_role;

ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA app_private;
ALTER FUNCTION public.is_org_admin(uuid) SET SCHEMA app_private;
ALTER FUNCTION public.is_organization_owner(uuid, uuid) SET SCHEMA app_private;
ALTER FUNCTION public.get_user_organization_id(uuid) SET SCHEMA app_private;
ALTER FUNCTION public.get_user_email(uuid) SET SCHEMA app_private;
ALTER FUNCTION public.user_belongs_to_org(uuid) SET SCHEMA app_private;
ALTER FUNCTION public.users_share_organization(uuid, uuid) SET SCHEMA app_private;
ALTER FUNCTION public.get_user_role(uuid) SET SCHEMA app_private;
ALTER FUNCTION public.get_org_default_shift(uuid) SET SCHEMA app_private;

GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.is_org_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.is_organization_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.get_user_organization_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.get_user_email(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.user_belongs_to_org(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.users_share_organization(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.get_org_default_shift(uuid) TO authenticated;