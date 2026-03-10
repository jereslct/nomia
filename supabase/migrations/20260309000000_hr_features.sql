-- HR Features Migration: absences, employee_documents, pay_stubs, vacations, evaluations

-- Enums
DO $$ BEGIN
  CREATE TYPE public.document_category AS ENUM ('curriculum', 'arca_registration', 'signed_receipt', 'other');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.document_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.absence_type AS ENUM ('unjustified', 'justified', 'medical_certificate', 'birth_leave', 'other_leave');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.absence_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.vacation_request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.evaluation_status AS ENUM ('draft', 'completed', 'shared');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Table: absences
CREATE TABLE IF NOT EXISTS public.absences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  date date NOT NULL,
  type public.absence_type NOT NULL DEFAULT 'unjustified',
  justification text,
  certificate_url text,
  certificate_file_name text,
  status public.absence_status NOT NULL DEFAULT 'pending',
  reported_by uuid NOT NULL REFERENCES auth.users(id),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own absences"
  ON public.absences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view absences in their org"
  ON public.absences FOR SELECT
  USING (
    has_role('admin'::app_role, auth.uid())
    AND organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert absences"
  ON public.absences FOR INSERT
  WITH CHECK (
    has_role('admin'::app_role, auth.uid())
    AND organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update absences in their org"
  ON public.absences FOR UPDATE
  USING (
    has_role('admin'::app_role, auth.uid())
    AND organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own absences justification"
  ON public.absences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table: employee_documents
CREATE TABLE IF NOT EXISTS public.employee_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category public.document_category NOT NULL DEFAULT 'other',
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  description text,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  status public.document_status NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents"
  ON public.employee_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view documents in their org"
  ON public.employee_documents FOR SELECT
  USING (
    has_role('admin'::app_role, auth.uid())
    AND organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own documents"
  ON public.employee_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can insert documents for their org"
  ON public.employee_documents FOR INSERT
  WITH CHECK (
    has_role('admin'::app_role, auth.uid())
    AND organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update documents in their org"
  ON public.employee_documents FOR UPDATE
  USING (
    has_role('admin'::app_role, auth.uid())
    AND organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete documents in their org"
  ON public.employee_documents FOR DELETE
  USING (
    has_role('admin'::app_role, auth.uid())
    AND organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own documents"
  ON public.employee_documents FOR DELETE
  USING (auth.uid() = user_id);

-- Table: pay_stubs
CREATE TABLE IF NOT EXISTS public.pay_stubs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_month int NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year int NOT NULL CHECK (period_year BETWEEN 2000 AND 2100),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  downloaded_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.pay_stubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pay stubs"
  ON public.pay_stubs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view pay stubs in their org"
  ON public.pay_stubs FOR SELECT
  USING (
    has_role('admin'::app_role, auth.uid())
    AND organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert pay stubs"
  ON public.pay_stubs FOR INSERT
  WITH CHECK (
    has_role('admin'::app_role, auth.uid())
    AND organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete pay stubs in their org"
  ON public.pay_stubs FOR DELETE
  USING (
    has_role('admin'::app_role, auth.uid())
    AND organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update downloaded_at on their own pay stubs"
  ON public.pay_stubs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table: vacation_balances
CREATE TABLE IF NOT EXISTS public.vacation_balances (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  year int NOT NULL,
  total_days int NOT NULL DEFAULT 14,
  used_days int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, organization_id, year)
);

ALTER TABLE public.vacation_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vacation balances"
  ON public.vacation_balances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view vacation balances in their org"
  ON public.vacation_balances FOR SELECT
  USING (
    has_role('admin'::app_role, auth.uid())
    AND organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage vacation balances"
  ON public.vacation_balances FOR ALL
  USING (
    has_role('admin'::app_role, auth.uid())
    AND organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

-- Table: vacation_requests
CREATE TABLE IF NOT EXISTS public.vacation_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days_count int NOT NULL,
  reason text,
  status public.vacation_request_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  CHECK (end_date >= start_date)
);

ALTER TABLE public.vacation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vacation requests"
  ON public.vacation_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vacation requests"
  ON public.vacation_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending vacation requests"
  ON public.vacation_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view vacation requests in their org"
  ON public.vacation_requests FOR SELECT
  USING (
    has_role('admin'::app_role, auth.uid())
    AND organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update vacation requests in their org"
  ON public.vacation_requests FOR UPDATE
  USING (
    has_role('admin'::app_role, auth.uid())
    AND organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

-- Table: evaluation_templates
CREATE TABLE IF NOT EXISTS public.evaluation_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.evaluation_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage evaluation templates"
  ON public.evaluation_templates FOR ALL
  USING (
    has_role('admin'::app_role, auth.uid())
    AND organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

-- Table: performance_evaluations
CREATE TABLE IF NOT EXISTS public.performance_evaluations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid NOT NULL REFERENCES public.evaluation_templates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evaluator_id uuid NOT NULL REFERENCES auth.users(id),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  overall_score numeric(4,2),
  comments text,
  status public.evaluation_status NOT NULL DEFAULT 'draft',
  shared_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.performance_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shared evaluations for themselves"
  ON public.performance_evaluations FOR SELECT
  USING (auth.uid() = user_id AND status = 'shared');

CREATE POLICY "Admins can manage evaluations in their org"
  ON public.performance_evaluations FOR ALL
  USING (
    has_role('admin'::app_role, auth.uid())
    AND organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_absences_user_id ON public.absences(user_id);
CREATE INDEX IF NOT EXISTS idx_absences_org_date ON public.absences(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_employee_documents_user_id ON public.employee_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_org ON public.employee_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_pay_stubs_user_period ON public.pay_stubs(user_id, period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_pay_stubs_org ON public.pay_stubs(organization_id);
CREATE INDEX IF NOT EXISTS idx_vacation_requests_user ON public.vacation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_vacation_requests_org_status ON public.vacation_requests(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_performance_evaluations_user ON public.performance_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_evaluations_org ON public.performance_evaluations(organization_id);
