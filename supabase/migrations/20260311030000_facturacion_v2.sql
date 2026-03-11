-- Facturacion V2: new tables, ALTER existing, views, functions, triggers, RLS

-- New enums
DO $$ BEGIN
  CREATE TYPE public.tax_condition AS ENUM ('responsable_inscripto', 'monotributista', 'consumidor_final', 'exento');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending', 'partial', 'paid', 'overdue');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- 1. NEW TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  cuit text,
  tax_condition public.tax_condition NOT NULL DEFAULT 'consumidor_final',
  phone text,
  email text,
  address text,
  credit_limit numeric(12,2) NOT NULL DEFAULT 0,
  current_balance numeric(12,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL,
  payment_method public.payment_method NOT NULL DEFAULT 'efectivo',
  reference text,
  date timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.points_of_sale (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  currency text NOT NULL DEFAULT 'USD',
  rate numeric(12,4) NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  source text NOT NULL DEFAULT 'manual',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. ALTER EXISTING TABLES
-- ============================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cost_currency text NOT NULL DEFAULT 'ARS',
  ADD COLUMN IF NOT EXISTS cost_exchange_rate numeric(12,4),
  ADD COLUMN IF NOT EXISTS reorder_point integer NOT NULL DEFAULT 0;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS pos_id uuid REFERENCES public.points_of_sale(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_status public.payment_status NOT NULL DEFAULT 'paid';

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_tax_condition text;

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_brands_org ON public.brands(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_org ON public.customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_org ON public.payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_sale ON public.payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_points_of_sale_org ON public.points_of_sale(organization_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_org ON public.exchange_rates(organization_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON public.exchange_rates(date);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON public.sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_pos ON public.sales(pos_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_id);

-- ============================================================
-- 4. VIEW: calculated stock from movements
-- ============================================================

CREATE OR REPLACE VIEW public.v_product_stock AS
SELECT
  product_id,
  COALESCE(SUM(CASE
    WHEN movement_type IN ('compra', 'ajuste_positivo', 'devolucion') THEN quantity
    WHEN movement_type IN ('venta', 'ajuste_negativo') THEN -quantity
    ELSE 0
  END), 0) AS calculated_stock
FROM public.stock_movements
GROUP BY product_id;

-- ============================================================
-- 5. FUNCTION: IVA summary (debito/credito)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_iva_summary(
  _org_id uuid,
  _period_start date,
  _period_end date
)
RETURNS TABLE (
  iva_debito numeric,
  iva_credito numeric,
  iva_a_pagar numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN i.direction = 'emitida' THEN i.iva_amount ELSE 0 END), 0::numeric) AS iva_debito,
    COALESCE(SUM(CASE WHEN i.direction = 'recibida' THEN i.iva_amount ELSE 0 END), 0::numeric) AS iva_credito,
    COALESCE(SUM(CASE WHEN i.direction = 'emitida' THEN i.iva_amount ELSE 0 END), 0::numeric) -
    COALESCE(SUM(CASE WHEN i.direction = 'recibida' THEN i.iva_amount ELSE 0 END), 0::numeric) AS iva_a_pagar
  FROM public.invoices i
  WHERE i.organization_id = _org_id
    AND i.status != 'cancelled'
    AND i.date BETWEEN _period_start AND _period_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- ============================================================
-- 6. TRIGGER: auto-update products.current_stock on stock_movements
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS trigger AS $$
DECLARE
  _delta integer;
BEGIN
  IF NEW.movement_type IN ('compra', 'ajuste_positivo', 'devolucion') THEN
    _delta := NEW.quantity;
  ELSE
    _delta := -NEW.quantity;
  END IF;

  UPDATE public.products
  SET current_stock = current_stock + _delta,
      updated_at = now()
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

DROP TRIGGER IF EXISTS trg_update_product_stock ON public.stock_movements;
CREATE TRIGGER trg_update_product_stock
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_stock();

-- ============================================================
-- 7. RLS for new tables
-- ============================================================

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_of_sale ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- brands
CREATE POLICY "Org members can view brands" ON public.brands
  FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage brands" ON public.brands
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

-- customers
CREATE POLICY "Org members can view customers" ON public.customers
  FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage customers" ON public.customers
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

-- payments
CREATE POLICY "Org members can view payments" ON public.payments
  FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage payments" ON public.payments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

-- points_of_sale
CREATE POLICY "Org members can view points_of_sale" ON public.points_of_sale
  FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage points_of_sale" ON public.points_of_sale
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

-- exchange_rates
CREATE POLICY "Org members can view exchange_rates" ON public.exchange_rates
  FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage exchange_rates" ON public.exchange_rates
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));
