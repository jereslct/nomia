-- Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create organization_members table to link users to organizations
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  invited_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  invited_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(organization_id, invited_email)
);

-- Enable RLS
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Add organization_id to locations table
ALTER TABLE public.locations ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- RLS Policies for organizations
CREATE POLICY "Users can view their own organizations"
ON public.organizations FOR SELECT
USING (
  owner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_id = organizations.id 
    AND user_id = auth.uid() 
    AND status = 'accepted'
  )
);

CREATE POLICY "Admins can create organizations"
ON public.organizations FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND owner_id = auth.uid());

CREATE POLICY "Owners can update their organizations"
ON public.organizations FOR UPDATE
USING (owner_id = auth.uid());

-- RLS Policies for organization_members
CREATE POLICY "Org owners can manage members"
ON public.organization_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE id = organization_members.organization_id 
    AND owner_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own membership"
ON public.organization_members FOR SELECT
USING (user_id = auth.uid() OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own membership status"
ON public.organization_members FOR UPDATE
USING (invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
WITH CHECK (invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Update attendance_records policy to only allow admins to see records from their organization's locations
DROP POLICY IF EXISTS "Admins can view all attendance" ON public.attendance_records;

CREATE POLICY "Admins can view organization attendance"
ON public.attendance_records FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.locations l
    JOIN public.organizations o ON l.organization_id = o.id
    WHERE l.id = attendance_records.location_id
    AND o.owner_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();