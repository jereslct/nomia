-- Fix security definer view by dropping and recreating with security_invoker
DROP VIEW IF EXISTS public.v_product_stock;
CREATE VIEW public.v_product_stock WITH (security_invoker = true) AS
SELECT
  product_id,
  COALESCE(SUM(CASE
    WHEN movement_type IN ('compra', 'ajuste_positivo', 'devolucion') THEN quantity
    WHEN movement_type IN ('venta', 'ajuste_negativo') THEN -quantity
    ELSE 0
  END), 0) AS calculated_stock
FROM public.stock_movements
GROUP BY product_id;