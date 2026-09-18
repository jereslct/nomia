CREATE TABLE public.employee_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  shift_id uuid REFERENCES public.work_shifts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, organization_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_assignments TO authenticated;
GRANT ALL ON public.employee_assignments TO service_role;

ALTER TABLE public.employee_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assignment"
ON public.employee_assignments FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Org admins can view assignments"
ON public.employee_assignments FOR SELECT TO authenticated
USING (app_private.is_org_admin(organization_id));

CREATE POLICY "Org admins can insert assignments"
ON public.employee_assignments FOR INSERT TO authenticated
WITH CHECK (app_private.is_org_admin(organization_id));

CREATE POLICY "Org admins can update assignments"
ON public.employee_assignments FOR UPDATE TO authenticated
USING (app_private.is_org_admin(organization_id))
WITH CHECK (app_private.is_org_admin(organization_id));

CREATE POLICY "Org admins can delete assignments"
ON public.employee_assignments FOR DELETE TO authenticated
USING (app_private.is_org_admin(organization_id));

CREATE TRIGGER set_employee_assignments_updated_at
BEFORE UPDATE ON public.employee_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();