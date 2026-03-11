-- Facturacion V2 advanced: RLS for sellers, bulk price update function

CREATE POLICY "Org members can insert sales" ON public.sales
  FOR INSERT WITH CHECK (public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can insert sale_items" ON public.sale_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_id AND public.user_belongs_to_org(s.organization_id))
  );

CREATE POLICY "Org members can insert stock_movements" ON public.stock_movements
  FOR INSERT WITH CHECK (public.user_belongs_to_org(organization_id));

CREATE POLICY "Org members can insert payments" ON public.payments
  FOR INSERT WITH CHECK (public.user_belongs_to_org(organization_id));

CREATE OR REPLACE FUNCTION public.bulk_update_prices_from_exchange_rate(
  _org_id uuid,
  _currency text,
  _new_rate numeric,
  _margin_pct numeric DEFAULT 0
)
RETURNS integer AS $$
DECLARE
  _updated integer;
BEGIN
  UPDATE public.products
  SET
    cost_exchange_rate = _new_rate,
    sell_price = ROUND(cost_price * _new_rate * (1 + _margin_pct / 100), 2),
    updated_at = now()
  WHERE organization_id = _org_id
    AND cost_currency = _currency
    AND is_active = true;
  GET DIAGNOSTICS _updated = ROW_COUNT;
  RETURN _updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;