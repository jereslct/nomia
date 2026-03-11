-- Subscriptions: plans and organization subscriptions

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

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;

-- Everyone can read plans
CREATE POLICY "Anyone can view active plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = true);

-- Admins can read their org subscription
CREATE POLICY "Admins can view their org subscription"
  ON public.organization_subscriptions FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.status = 'accepted'
    )
  );

-- Only service role can insert/update subscriptions (managed externally)
CREATE POLICY "Service role manages subscriptions"
  ON public.organization_subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Seed default plans
INSERT INTO public.subscription_plans (name, slug, description, apps_included, price_monthly, price_yearly) VALUES
  ('Asistencia', 'asistencia', 'Control de asistencia y administración de empleados', '{nomia}', 0, 0),
  ('Gestión', 'gestion', 'Asistencia + Facturación y compra/venta', '{nomia,facturacion}', 4999, 49990),
  ('Completo', 'completo', 'Asistencia + Facturación + Control Comercial', '{nomia,facturacion,comercial}', 9999, 99990)
ON CONFLICT (slug) DO NOTHING;

-- RPC to get org subscription apps
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
