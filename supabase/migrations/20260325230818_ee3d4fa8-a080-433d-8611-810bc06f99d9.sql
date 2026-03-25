
-- Fix evaluation_templates policy: add WITH CHECK for INSERT/UPDATE
DROP POLICY IF EXISTS "Admins can manage evaluation templates" ON public.evaluation_templates;

CREATE POLICY "Admins can manage evaluation templates"
ON public.evaluation_templates
FOR ALL
TO public
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
);
