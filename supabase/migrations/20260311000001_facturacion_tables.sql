-- Facturacion tables: invoicing, sales, purchases, stock, products

-- Enums
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

-- AFIP configuration per organization
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

-- Product categories (hierarchical groups / sub-groups)
CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES public.product_categories(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Suppliers
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

-- Products catalog
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

-- Invoices (emitted and received)
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
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Invoice line items
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

-- Sales (linked to seller/employee)
CREATE TABLE IF NOT EXISTS public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  seller_id uuid REFERENCES auth.users(id),
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

-- Sale line items
CREATE TABLE IF NOT EXISTS public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  cost_price_snapshot numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0
);

-- Purchases from suppliers
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
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Purchase line items
CREATE TABLE IF NOT EXISTS public.purchase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0
);

-- Stock movements
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type public.stock_movement_type NOT NULL,
  quantity integer NOT NULL,
  reference_id uuid,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Stock alerts configuration
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

-- Employee sales objectives
CREATE TABLE IF NOT EXISTS public.employee_sales_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  objective_type public.objective_type NOT NULL DEFAULT 'ventas_monto',
  target_value numeric NOT NULL DEFAULT 0,
  period_type public.objective_period NOT NULL DEFAULT 'mensual',
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
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

-- Enable RLS on all tables
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

-- RLS policies: org members can read, admins can write
-- Helper: check if user belongs to the org
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(_org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = _org_id
      AND user_id = auth.uid()
      AND status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Macro for creating standard org-based policies
-- afip_config
CREATE POLICY "Org members can view afip_config" ON public.afip_config FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage afip_config" ON public.afip_config FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

-- product_categories
CREATE POLICY "Org members can view product_categories" ON public.product_categories FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage product_categories" ON public.product_categories FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

-- suppliers
CREATE POLICY "Org members can view suppliers" ON public.suppliers FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage suppliers" ON public.suppliers FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

-- products
CREATE POLICY "Org members can view products" ON public.products FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

-- invoices
CREATE POLICY "Org members can view invoices" ON public.invoices FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage invoices" ON public.invoices FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

-- invoice_items
CREATE POLICY "Org members can view invoice_items" ON public.invoice_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND public.user_belongs_to_org(i.organization_id))
);
CREATE POLICY "Admins can manage invoice_items" ON public.invoice_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(i.organization_id))
);

-- sales
CREATE POLICY "Org members can view sales" ON public.sales FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage sales" ON public.sales FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

-- sale_items
CREATE POLICY "Org members can view sale_items" ON public.sale_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_id AND public.user_belongs_to_org(s.organization_id))
);
CREATE POLICY "Admins can manage sale_items" ON public.sale_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_id AND public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(s.organization_id))
);

-- purchases
CREATE POLICY "Org members can view purchases" ON public.purchases FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage purchases" ON public.purchases FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

-- purchase_items
CREATE POLICY "Org members can view purchase_items" ON public.purchase_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.purchases p WHERE p.id = purchase_id AND public.user_belongs_to_org(p.organization_id))
);
CREATE POLICY "Admins can manage purchase_items" ON public.purchase_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.purchases p WHERE p.id = purchase_id AND public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(p.organization_id))
);

-- stock_movements
CREATE POLICY "Org members can view stock_movements" ON public.stock_movements FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage stock_movements" ON public.stock_movements FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

-- stock_alerts
CREATE POLICY "Org members can view stock_alerts" ON public.stock_alerts FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage stock_alerts" ON public.stock_alerts FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));

-- employee_sales_objectives
CREATE POLICY "Org members can view employee_sales_objectives" ON public.employee_sales_objectives FOR SELECT USING (public.user_belongs_to_org(organization_id));
CREATE POLICY "Admins can manage employee_sales_objectives" ON public.employee_sales_objectives FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role) AND public.user_belongs_to_org(organization_id));
