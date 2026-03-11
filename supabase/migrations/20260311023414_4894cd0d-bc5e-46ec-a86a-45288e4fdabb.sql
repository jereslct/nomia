
-- =====================================================
-- MIGRATION 1: Subscriptions
-- =====================================================

-- Enum for subscription status
DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('active', 'trial', 'expired', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Subscription plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  apps_included text[] NOT NULL DEFAULT '{nomia}',
  price_monthly numeric NOT NULL DEFAULT 0,
  price_yearly numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Organization subscriptions
CREATE TABLE IF NOT EXISTS public.organization_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status public.subscription_status NOT NULL DEFAULT 'active',
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view their org subscription"
  ON public.organization_subscriptions FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.status = 'accepted'
    )
  );

CREATE POLICY "Service role manages subscriptions"
  ON public.organization_subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Org owners can also view their subscription
CREATE POLICY "Org owners can view their subscription"
  ON public.organization_subscriptions FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

INSERT INTO public.subscription_plans (name, slug, description, apps_included, price_monthly, price_yearly) VALUES
  ('Asistencia', 'asistencia', 'Control de asistencia y administración de empleados', '{nomia}', 0, 0),
  ('Gestión', 'gestion', 'Asistencia + Facturación y compra/venta', '{nomia,facturacion}', 4999, 49990),
  ('Completo', 'completo', 'Asistencia + Facturación + Control Comercial', '{nomia,facturacion,comercial}', 9999, 99990)
ON CONFLICT (slug) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_org_subscription_apps(_user_id uuid)
RETURNS text[] AS $$
DECLARE
  _apps text[];
BEGIN
  SELECT sp.apps_included INTO _apps
  FROM public.organization_subscriptions os
  JOIN public.subscription_plans sp ON sp.id = os.plan_id
  WHERE os.organization_id = (SELECT public.get_user_organization_id(_user_id))
    AND os.status IN ('active', 'trial')
    AND (os.expires_at IS NULL OR os.expires_at > now())
  LIMIT 1;

  RETURN COALESCE(_apps, '{nomia}'::text[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- MIGRATION 2: Facturacion Tables
-- =====================================================

DO $$ BEGIN
  CREATE TYPE public.invoice_type AS ENUM ('factura_a', 'factura_b', 'factura_c', 'nota_credito', 'nota_debito', 'informal');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.invoice_direction AS ENUM ('emitida', 'recibida');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('draft', 'confirmed', 'cancelled', 'afip_sent');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.sale_channel AS ENUM ('local_fisico', 'catalogo', 'online');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_method AS ENUM ('efectivo', 'tarjeta', 'transferencia', 'otro');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.stock_movement_type AS ENUM ('compra', 'venta', 'ajuste_positivo', 'ajuste_negativo', 'devolucion');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.objective_type AS ENUM ('ventas_monto', 'ventas_cantidad', 'mix_productos', 'personalizado');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.objective_period AS ENUM ('diario', 'semanal', 'mensual');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.afip_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  cuit text,
  punto_venta integer,
  certificado_url text,
  environment text NOT NULL DEFAULT 'testing' CHECK (environment IN ('produccion', 'testing')),
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES public.product_categories(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  cuit text,
  phone text,
  email text,
  address text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sku text,
  barcode text,
  category_id uuid REFERENCES public.product_categories(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  cost_price numeric NOT NULL DEFAULT 0,
  sell_price numeric NOT NULL DEFAULT 0,
  iva_rate numeric NOT NULL DEFAULT 21,
  current_stock integer NOT NULL DEFAULT 0,
  min_stock integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_type public.invoice_type NOT NULL DEFAULT 'factura_a',
  direction public.invoice_direction NOT NULL DEFAULT 'emitida',
  number text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  client_name text,
  client_cuit text,
  subtotal numeric NOT NULL DEFAULT 0,
  iva_amount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  status public.invoice_status NOT NULL DEFAULT 'draft',
  afip_cae text,
  afip_vencimiento_cae date,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  iva_rate numeric NOT NULL DEFAULT 21,
  iva_amount numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  seller_id uuid,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  sale_channel public.sale_channel NOT NULL DEFAULT 'local_fisico',
  date date NOT NULL DEFAULT CURRENT_DATE,
  subtotal numeric NOT NULL DEFAULT 0,
  iva_amount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  payment_method public.payment_method NOT NULL DEFAULT 'efectivo',
  is_formal boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  cost_price_snapshot numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  subtotal numeric NOT NULL DEFAULT 0,
  iva_amount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  is_formal boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.purchase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type public.stock_movement_type NOT NULL,
  quantity integer NOT NULL,
  reference_id uuid,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stock_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.product_categories(id) ON DELETE CASCADE,
  min_stock_override integer,
  notify_email boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employee_sales_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  objective_type public.objective_type NOT NULL DEFAULT 'ventas_monto',
  target_value numeric NOT NULL DEFAULT 0,
  period_type public.objective_period NOT NULL DEFAULT 'mensual',
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_org ON public.products(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON public.invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices(date);
CREATE INDEX IF NOT EXISTS idx_sales_org ON public.sales(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_seller ON public.sales(seller_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(date);
CREATE INDEX IF NOT EXISTS idx_purchases_org ON public.purchases(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON public.purchases(date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_org ON public.product_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_org ON public.suppliers(organization_id);

ALTER TABLE public.afip_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_sales_objectives ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.user_belongs_to_org(_org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organizations WHERE id = _org_id AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = _org_id
      AND user_id = auth.uid()
      AND status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY "Org members can view afip_config" ON public.afip_config FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage afip_config" ON public.afip_config FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can view product_categories" ON public.product_categories FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage product_categories" ON public.product_categories FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can view suppliers" ON public.suppliers FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage suppliers" ON public.suppliers FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can view products" ON public.products FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can view invoices" ON public.invoices FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage invoices" ON public.invoices FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can view invoice_items" ON public.invoice_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND public.user_belongs_to_org(i.organization_id))
);
CREATE POLICY "Admins can manage invoice_items" ON public.invoice_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(i.organization_id))
);

CREATE POLICY "Org members can view sales" ON public.sales FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage sales" ON public.sales FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can view sale_items" ON public.sale_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_id AND public.user_belongs_to_org(s.organization_id))
);
CREATE POLICY "Admins can manage sale_items" ON public.sale_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_id AND public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(s.organization_id))
);

CREATE POLICY "Org members can view purchases" ON public.purchases FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage purchases" ON public.purchases FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can view purchase_items" ON public.purchase_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.purchases p WHERE p.id = purchase_id AND public.user_belongs_to_org(p.organization_id))
);
CREATE POLICY "Admins can manage purchase_items" ON public.purchase_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.purchases p WHERE p.id = purchase_id AND public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(p.organization_id))
);

CREATE POLICY "Org members can view stock_movements" ON public.stock_movements FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage stock_movements" ON public.stock_movements FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can view stock_alerts" ON public.stock_alerts FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage stock_alerts" ON public.stock_alerts FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can view employee_sales_objectives" ON public.employee_sales_objectives FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage employee_sales_objectives" ON public.employee_sales_objectives FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

-- =====================================================
-- MIGRATION 3: Comercial Tables
-- =====================================================

DO $$ BEGIN
  CREATE TYPE public.expense_type AS ENUM ('fijo', 'variable');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.expense_sheet_status AS ENUM ('draft', 'approved', 'closed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.business_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

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
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

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
  approved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.salary_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  business_unit_id uuid REFERENCES public.business_units(id) ON DELETE SET NULL,
  period_month integer NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year integer NOT NULL CHECK (period_year >= 2020),
  base_salary numeric NOT NULL DEFAULT 0,
  extras numeric NOT NULL DEFAULT 0,
  deductions numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_units_org ON public.business_units(organization_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_org ON public.expense_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_business_expenses_org ON public.business_expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_business_expenses_unit ON public.business_expenses(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_business_expenses_period ON public.business_expenses(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_expense_sheets_org ON public.expense_sheets(organization_id);
CREATE INDEX IF NOT EXISTS idx_salary_records_org ON public.salary_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_salary_records_user ON public.salary_records(user_id);
CREATE INDEX IF NOT EXISTS idx_salary_records_period ON public.salary_records(period_year, period_month);

ALTER TABLE public.business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view business_units" ON public.business_units FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage business_units" ON public.business_units FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can view expense_categories" ON public.expense_categories FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage expense_categories" ON public.expense_categories FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can view business_expenses" ON public.business_expenses FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage business_expenses" ON public.business_expenses FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can view expense_sheets" ON public.expense_sheets FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage expense_sheets" ON public.expense_sheets FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

CREATE POLICY "Users can view own salary_records" ON public.salary_records FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view org salary_records" ON public.salary_records FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage salary_records" ON public.salary_records FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));
