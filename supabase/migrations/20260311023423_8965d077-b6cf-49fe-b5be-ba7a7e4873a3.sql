
-- Fix search_path on the two new functions
ALTER FUNCTION public.get_org_subscription_apps(uuid) SET search_path = public;
ALTER FUNCTION public.user_belongs_to_org(uuid) SET search_path = public;
