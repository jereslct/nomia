DROP TRIGGER IF EXISTS trg_update_product_stock ON public.stock_movements;

DROP TABLE IF EXISTS public.sale_items CASCADE;
DROP TABLE IF EXISTS public.purchase_items CASCADE;
DROP TABLE IF EXISTS public.invoice_items CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.purchases CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.stock_movements CASCADE;
DROP TABLE IF EXISTS public.stock_alerts CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.product_categories CASCADE;
DROP TABLE IF EXISTS public.brands CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.points_of_sale CASCADE;
DROP TABLE IF EXISTS public.exchange_rates CASCADE;
DROP TABLE IF EXISTS public.afip_config CASCADE;
DROP TABLE IF EXISTS public.employee_sales_objectives CASCADE;

DROP TABLE IF EXISTS public.business_expenses CASCADE;
DROP TABLE IF EXISTS public.expense_sheets CASCADE;
DROP TABLE IF EXISTS public.expense_categories CASCADE;
DROP TABLE IF EXISTS public.salary_records CASCADE;
DROP TABLE IF EXISTS public.business_units CASCADE;

DROP TABLE IF EXISTS public.organization_subscriptions CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;

DROP FUNCTION IF EXISTS public.get_iva_summary(uuid, date, date);
DROP FUNCTION IF EXISTS public.bulk_update_prices_from_exchange_rate(uuid, text, numeric, numeric);
DROP FUNCTION IF EXISTS public.update_product_stock();
DROP FUNCTION IF EXISTS public.get_org_subscription_apps(uuid);

DROP TYPE IF EXISTS public.invoice_type;
DROP TYPE IF EXISTS public.invoice_direction;
DROP TYPE IF EXISTS public.invoice_status;
DROP TYPE IF EXISTS public.payment_method;
DROP TYPE IF EXISTS public.payment_status;
DROP TYPE IF EXISTS public.sale_channel;
DROP TYPE IF EXISTS public.stock_movement_type;
DROP TYPE IF EXISTS public.tax_condition;
DROP TYPE IF EXISTS public.objective_type;
DROP TYPE IF EXISTS public.objective_period;
DROP TYPE IF EXISTS public.expense_type;
DROP TYPE IF EXISTS public.expense_sheet_status;
DROP TYPE IF EXISTS public.subscription_status;