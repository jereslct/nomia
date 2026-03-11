-- Comercial tables: business units, expenses, salaries

-- Enums
DO $$ BEGIN
  CREATE TYPE public.expense_type AS ENUM ('fijo', 'variable');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.expense_sheet_status AS ENUM ('draft', 'approved', 'closed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Business units
CREATE TABLE IF NOT EXISTS public.business_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Expense categories (rent, utilities, taxes, etc.)
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  type public.expense_type NOT NULL DEFAULT 'fijo',
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Business expenses per unit
CREATE TABLE IF NOT EXISTS public.business_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  business_unit_id uuid NOT NULL REFERENCES public.business_units(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
  description text,
  amount numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  period_month integer NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year integer NOT NULL CHECK (period_year >= 2020),
  receipt_url text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Expense sheets (monthly consolidated)
CREATE TABLE IF NOT EXISTS public.expense_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  business_unit_id uuid REFERENCES public.business_units(id) ON DELETE CASCADE,
  period_month integer NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year integer NOT NULL CHECK (period_year >= 2020),
  total_fixed numeric NOT NULL DEFAULT 0,
  total_variable numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  status public.expense_sheet_status NOT NULL DEFAULT 'draft',
  approved_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Salary records per employee
CREATE TABLE IF NOT EXISTS public.salary_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  business_unit_id uuid REFERENCES public.business_units(id) ON DELETE SET NULL,
  period_month integer NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year integer NOT NULL CHECK (period_year >= 2020),
  base_salary numeric NOT NULL DEFAULT 0,
  extras numeric NOT NULL DEFAULT 0,
  deductions numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_business_units_org ON public.business_units(organization_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_org ON public.expense_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_business_expenses_org ON public.business_expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_business_expenses_unit ON public.business_expenses(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_business_expenses_period ON public.business_expenses(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_expense_sheets_org ON public.expense_sheets(organization_id);
CREATE INDEX IF NOT EXISTS idx_salary_records_org ON public.salary_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_salary_records_user ON public.salary_records(user_id);
CREATE INDEX IF NOT EXISTS idx_salary_records_period ON public.salary_records(period_year, period_month);

-- Enable RLS
ALTER TABLE public.business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_records ENABLE ROW LEVEL SECURITY;

-- RLS policies
-- business_units
CREATE POLICY "Org members can view business_units" ON public.business_units FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage business_units" ON public.business_units FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

-- expense_categories
CREATE POLICY "Org members can view expense_categories" ON public.expense_categories FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage expense_categories" ON public.expense_categories FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

-- business_expenses
CREATE POLICY "Org members can view business_expenses" ON public.business_expenses FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage business_expenses" ON public.business_expenses FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

-- expense_sheets
CREATE POLICY "Org members can view expense_sheets" ON public.expense_sheets FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage expense_sheets" ON public.expense_sheets FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

-- salary_records
CREATE POLICY "Users can view own salary_records" ON public.salary_records FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view org salary_records" ON public.salary_records FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage salary_records" ON public.salary_records FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));
