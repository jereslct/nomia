-- Create work_shifts table for organization schedules
CREATE TABLE public.work_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Horario Principal',
  start_time TIME NOT NULL DEFAULT '09:00:00',
  end_time TIME NOT NULL DEFAULT '18:00:00',
  entry_grace_minutes INTEGER NOT NULL DEFAULT 15,
  exit_grace_minutes INTEGER NOT NULL DEFAULT 60,
  active_days INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5], -- Monday to Friday (0=Sunday, 1=Monday, ..., 6=Saturday)
  is_default BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_shifts ENABLE ROW LEVEL SECURITY;

-- Only one default shift per organization
CREATE UNIQUE INDEX idx_work_shifts_default_per_org 
  ON public.work_shifts (organization_id) 
  WHERE is_default = true;

-- Index for faster lookups
CREATE INDEX idx_work_shifts_organization ON public.work_shifts(organization_id);

-- RLS Policies: Org owners can manage their shifts
CREATE POLICY "Org owners can view their shifts"
  ON public.work_shifts
  FOR SELECT
  USING (is_organization_owner(organization_id, auth.uid()));

CREATE POLICY "Org owners can insert shifts"
  ON public.work_shifts
  FOR INSERT
  WITH CHECK (is_organization_owner(organization_id, auth.uid()));

CREATE POLICY "Org owners can update shifts"
  ON public.work_shifts
  FOR UPDATE
  USING (is_organization_owner(organization_id, auth.uid()));

CREATE POLICY "Org owners can delete shifts"
  ON public.work_shifts
  FOR DELETE
  USING (is_organization_owner(organization_id, auth.uid()));

-- Members can view shifts of their organization
CREATE POLICY "Members can view org shifts"
  ON public.work_shifts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = work_shifts.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'accepted'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_work_shifts_updated_at
  BEFORE UPDATE ON public.work_shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add QR signing secret column to qr_codes for HMAC validation
ALTER TABLE public.qr_codes ADD COLUMN IF NOT EXISTS signature TEXT;

-- Create function to get organization's default shift
CREATE OR REPLACE FUNCTION public.get_org_default_shift(_org_id uuid)
RETURNS TABLE (
  id uuid,
  start_time time,
  end_time time,
  entry_grace_minutes integer,
  exit_grace_minutes integer,
  active_days integer[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, start_time, end_time, entry_grace_minutes, exit_grace_minutes, active_days
  FROM public.work_shifts
  WHERE organization_id = _org_id AND is_default = true
  LIMIT 1
$$;