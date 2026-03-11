-- =============================================================================
-- SEED DATA: Nomia + Facturación + Comercial
-- Empresa ficticia: "Indumentaria Urbana SRL" (CUIT 30-71654321-8)
-- Rubro: tienda de ropa multimarca con local físico + venta por catálogo
-- =============================================================================

DO $$
DECLARE
  -- Users
  admin_uid   uuid := 'a0000000-0000-0000-0000-000000000001';
  seller1_uid uuid := 'a0000000-0000-0000-0000-000000000002';
  seller2_uid uuid := 'a0000000-0000-0000-0000-000000000003';
  seller3_uid uuid := 'a0000000-0000-0000-0000-000000000004';
  admin_uid2  uuid := 'a0000000-0000-0000-0000-000000000005';

  org_id  uuid := 'b0000000-0000-0000-0000-000000000001';
  loc1_id uuid := 'c0000000-0000-0000-0000-000000000001';
  loc2_id uuid := 'c0000000-0000-0000-0000-000000000002';

  -- Categories
  cat_mujer     uuid := 'd0000000-0000-0000-0000-000000000001';
  cat_remeras_m uuid := 'd0000000-0000-0000-0000-000000000002';
  cat_pantalon_m uuid := 'd0000000-0000-0000-0000-000000000003';
  cat_hombre    uuid := 'd0000000-0000-0000-0000-000000000004';
  cat_remeras_h uuid := 'd0000000-0000-0000-0000-000000000005';
  cat_pantalon_h uuid := 'd0000000-0000-0000-0000-000000000006';
  cat_accesorios uuid := 'd0000000-0000-0000-0000-000000000007';
  cat_calzado   uuid := 'd0000000-0000-0000-0000-000000000008';
  cat_abrigos   uuid := 'd0000000-0000-0000-0000-000000000009';

  -- Suppliers
  sup_topper   uuid := 'e0000000-0000-0000-0000-000000000001';
  sup_levis    uuid := 'e0000000-0000-0000-0000-000000000002';
  sup_tascani  uuid := 'e0000000-0000-0000-0000-000000000003';
  sup_kevingst uuid := 'e0000000-0000-0000-0000-000000000004';
  sup_importad uuid := 'e0000000-0000-0000-0000-000000000005';

  -- Brands
  br_topper    uuid := 'f0000000-0000-0000-0000-000000000001';
  br_levis     uuid := 'f0000000-0000-0000-0000-000000000002';
  br_tascani   uuid := 'f0000000-0000-0000-0000-000000000003';
  br_kevingst  uuid := 'f0000000-0000-0000-0000-000000000004';
  br_wrangler  uuid := 'f0000000-0000-0000-0000-000000000005';
  br_generic   uuid := 'f0000000-0000-0000-0000-000000000006';

  -- Products (20)
  p1  uuid := '10000000-0000-0000-0000-000000000001';
  p2  uuid := '10000000-0000-0000-0000-000000000002';
  p3  uuid := '10000000-0000-0000-0000-000000000003';
  p4  uuid := '10000000-0000-0000-0000-000000000004';
  p5  uuid := '10000000-0000-0000-0000-000000000005';
  p6  uuid := '10000000-0000-0000-0000-000000000006';
  p7  uuid := '10000000-0000-0000-0000-000000000007';
  p8  uuid := '10000000-0000-0000-0000-000000000008';
  p9  uuid := '10000000-0000-0000-0000-000000000009';
  p10 uuid := '10000000-0000-0000-0000-000000000010';
  p11 uuid := '10000000-0000-0000-0000-000000000011';
  p12 uuid := '10000000-0000-0000-0000-000000000012';
  p13 uuid := '10000000-0000-0000-0000-000000000013';
  p14 uuid := '10000000-0000-0000-0000-000000000014';
  p15 uuid := '10000000-0000-0000-0000-000000000015';
  p16 uuid := '10000000-0000-0000-0000-000000000016';
  p17 uuid := '10000000-0000-0000-0000-000000000017';
  p18 uuid := '10000000-0000-0000-0000-000000000018';
  p19 uuid := '10000000-0000-0000-0000-000000000019';
  p20 uuid := '10000000-0000-0000-0000-000000000020';

  -- Customers
  cust1 uuid := '20000000-0000-0000-0000-000000000001';
  cust2 uuid := '20000000-0000-0000-0000-000000000002';
  cust3 uuid := '20000000-0000-0000-0000-000000000003';
  cust4 uuid := '20000000-0000-0000-0000-000000000004';

  -- Points of sale
  pos1 uuid := '30000000-0000-0000-0000-000000000001';
  pos2 uuid := '30000000-0000-0000-0000-000000000002';

  -- Plan
  plan_completo uuid;

  -- Sales
  sale1  uuid := '40000000-0000-0000-0000-000000000001';
  sale2  uuid := '40000000-0000-0000-0000-000000000002';
  sale3  uuid := '40000000-0000-0000-0000-000000000003';
  sale4  uuid := '40000000-0000-0000-0000-000000000004';
  sale5  uuid := '40000000-0000-0000-0000-000000000005';
  sale6  uuid := '40000000-0000-0000-0000-000000000006';
  sale7  uuid := '40000000-0000-0000-0000-000000000007';
  sale8  uuid := '40000000-0000-0000-0000-000000000008';
  sale9  uuid := '40000000-0000-0000-0000-000000000009';
  sale10 uuid := '40000000-0000-0000-0000-000000000010';
  sale11 uuid := '40000000-0000-0000-0000-000000000011';
  sale12 uuid := '40000000-0000-0000-0000-000000000012';

  -- Invoices (emitidas)
  inv1  uuid := '50000000-0000-0000-0000-000000000001';
  inv2  uuid := '50000000-0000-0000-0000-000000000002';
  inv3  uuid := '50000000-0000-0000-0000-000000000003';
  inv4  uuid := '50000000-0000-0000-0000-000000000004';
  inv5  uuid := '50000000-0000-0000-0000-000000000005';
  inv6  uuid := '50000000-0000-0000-0000-000000000006';
  inv7  uuid := '50000000-0000-0000-0000-000000000007';

  -- Invoices (recibidas - compras)
  inv_p1 uuid := '50000000-0000-0000-0000-000000000011';
  inv_p2 uuid := '50000000-0000-0000-0000-000000000012';
  inv_p3 uuid := '50000000-0000-0000-0000-000000000013';
  inv_p4 uuid := '50000000-0000-0000-0000-000000000014';

  -- Purchases
  purch1 uuid := '60000000-0000-0000-0000-000000000001';
  purch2 uuid := '60000000-0000-0000-0000-000000000002';
  purch3 uuid := '60000000-0000-0000-0000-000000000003';
  purch4 uuid := '60000000-0000-0000-0000-000000000004';

  -- Work shift
  shift1 uuid := '70000000-0000-0000-0000-000000000001';
  shift2 uuid := '70000000-0000-0000-0000-000000000002';

BEGIN

-- =====================================================
-- 1. AUTH USERS
-- =====================================================
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token)
VALUES
  (admin_uid,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'romina@urbana-indumentaria.com', crypt('Demo1234!', gen_salt('bf')),
   now(), '{"full_name": "Romina Acosta"}'::jsonb, now() - interval '120 days', now(), '', ''),
  (seller1_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'camila@urbana-indumentaria.com', crypt('Demo1234!', gen_salt('bf')),
   now(), '{"full_name": "Camila Herrera"}'::jsonb, now() - interval '100 days', now(), '', ''),
  (seller2_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'facundo@urbana-indumentaria.com', crypt('Demo1234!', gen_salt('bf')),
   now(), '{"full_name": "Facundo López"}'::jsonb, now() - interval '90 days', now(), '', ''),
  (seller3_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'valentina@urbana-indumentaria.com', crypt('Demo1234!', gen_salt('bf')),
   now(), '{"full_name": "Valentina Ruiz"}'::jsonb, now() - interval '60 days', now(), '', ''),
  (admin_uid2,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'martin@urbana-indumentaria.com', crypt('Demo1234!', gen_salt('bf')),
   now(), '{"full_name": "Martín Domínguez"}'::jsonb, now() - interval '50 days', now(), '', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
  (admin_uid,   admin_uid,   admin_uid,   jsonb_build_object('sub', admin_uid,   'email', 'romina@urbana-indumentaria.com'),   'email', now(), now(), now()),
  (seller1_uid, seller1_uid, seller1_uid, jsonb_build_object('sub', seller1_uid, 'email', 'camila@urbana-indumentaria.com'),   'email', now(), now(), now()),
  (seller2_uid, seller2_uid, seller2_uid, jsonb_build_object('sub', seller2_uid, 'email', 'facundo@urbana-indumentaria.com'),  'email', now(), now(), now()),
  (seller3_uid, seller3_uid, seller3_uid, jsonb_build_object('sub', seller3_uid, 'email', 'valentina@urbana-indumentaria.com'),'email', now(), now(), now()),
  (admin_uid2,  admin_uid2,  admin_uid2,  jsonb_build_object('sub', admin_uid2,  'email', 'martin@urbana-indumentaria.com'),   'email', now(), now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO public.profiles (user_id, full_name, email, phone_number)
VALUES
  (admin_uid,   'Romina Acosta',      'romina@urbana-indumentaria.com',   '+54 11 6100-0001'),
  (seller1_uid, 'Camila Herrera',     'camila@urbana-indumentaria.com',   '+54 11 6100-0002'),
  (seller2_uid, 'Facundo López',      'facundo@urbana-indumentaria.com',  '+54 11 6100-0003'),
  (seller3_uid, 'Valentina Ruiz',     'valentina@urbana-indumentaria.com','+54 11 6100-0004'),
  (admin_uid2,  'Martín Domínguez',   'martin@urbana-indumentaria.com',   '+54 11 6100-0005')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES
  (admin_uid,   'admin'),
  (seller1_uid, 'user'),
  (seller2_uid, 'user'),
  (seller3_uid, 'user'),
  (admin_uid2,  'admin')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. ORGANIZATION + MEMBERS + SUBSCRIPTION
-- =====================================================
INSERT INTO public.organizations (id, name, owner_id)
VALUES (org_id, 'Indumentaria Urbana SRL', admin_uid)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.organization_members (organization_id, user_id, invited_by, invited_email, status, accepted_at)
VALUES
  (org_id, admin_uid,   admin_uid, 'romina@urbana-indumentaria.com',   'accepted', now() - interval '120 days'),
  (org_id, seller1_uid, admin_uid, 'camila@urbana-indumentaria.com',   'accepted', now() - interval '98 days'),
  (org_id, seller2_uid, admin_uid, 'facundo@urbana-indumentaria.com',  'accepted', now() - interval '88 days'),
  (org_id, seller3_uid, admin_uid, 'valentina@urbana-indumentaria.com','accepted', now() - interval '58 days'),
  (org_id, admin_uid2,  admin_uid, 'martin@urbana-indumentaria.com',   'accepted', now() - interval '48 days')
ON CONFLICT DO NOTHING;

SELECT id INTO plan_completo FROM public.subscription_plans WHERE slug = 'completo' LIMIT 1;
INSERT INTO public.organization_subscriptions (organization_id, plan_id, status, starts_at, expires_at)
VALUES (org_id, plan_completo, 'active', now() - interval '30 days', now() + interval '335 days')
ON CONFLICT (organization_id) DO NOTHING;

-- =====================================================
-- 3. LOCATIONS
-- =====================================================
INSERT INTO public.locations (id, name, address, created_by, organization_id, is_active)
VALUES
  (loc1_id, 'Local Palermo',    'Honduras 4925, Palermo, CABA',       admin_uid, org_id, true),
  (loc2_id, 'Local Recoleta',   'Av. Santa Fe 1860, Recoleta, CABA',  admin_uid, org_id, true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. WORK SHIFTS
-- =====================================================
INSERT INTO public.work_shifts (id, organization_id, name, start_time, end_time, active_days, entry_grace_minutes, exit_grace_minutes, is_default)
VALUES
  (shift1, org_id, 'Turno Mañana',  '09:30', '16:30', '{1,2,3,4,5,6}', 10, 10, true),
  (shift2, org_id, 'Turno Tarde',   '14:30', '21:00', '{1,2,3,4,5,6}', 10, 10, false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 5. ATTENDANCE RECORDS (últimos 30 días)
-- =====================================================
INSERT INTO public.attendance_records (user_id, location_id, record_type, recorded_at, created_at)
SELECT
  u.uid,
  CASE WHEN u.uid IN (admin_uid, seller1_uid, seller3_uid) THEN loc1_id ELSE loc2_id END,
  rt.type,
  (d.day + rt.time_offset)::timestamptz,
  (d.day + rt.time_offset)::timestamptz
FROM
  (VALUES (admin_uid), (seller1_uid), (seller2_uid), (seller3_uid), (admin_uid2)) AS u(uid),
  generate_series(
    (current_date - interval '30 days')::date,
    (current_date - interval '1 day')::date,
    '1 day'
  ) AS d(day),
  (VALUES
    ('entry'::text, interval '9 hours 30 minutes' + (random() * interval '12 minutes')),
    ('exit'::text,  interval '16 hours 30 minutes' + (random() * interval '15 minutes'))
  ) AS rt(type, time_offset)
WHERE extract(dow from d.day) BETWEEN 1 AND 6
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. ABSENCES
-- =====================================================
INSERT INTO public.absences (user_id, organization_id, date, type, status, justification, reported_by)
VALUES
  (seller2_uid, org_id, current_date - interval '12 days', 'medical_certificate', 'approved',  'Certificado médico adjunto',       admin_uid),
  (seller3_uid, org_id, current_date - interval '7 days',  'unjustified',         'pending',    NULL,                               admin_uid),
  (seller1_uid, org_id, current_date - interval '3 days',  'justified',           'approved',  'Turno médico pre-agendado',        admin_uid),
  (admin_uid2,  org_id, current_date - interval '20 days', 'other_leave',         'approved',  'Mudanza',                          admin_uid)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. VACATION BALANCES
-- =====================================================
INSERT INTO public.vacation_balances (organization_id, user_id, year, total_days, used_days)
VALUES
  (org_id, seller1_uid, 2026, 14, 2),
  (org_id, seller2_uid, 2026, 14, 0),
  (org_id, seller3_uid, 2026, 14, 5),
  (org_id, admin_uid2,  2026, 21, 3)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 8. AFIP CONFIG
-- =====================================================
INSERT INTO public.afip_config (organization_id, cuit, punto_venta, environment, is_active)
VALUES (org_id, '30-71654321-8', 1, 'testing', true)
ON CONFLICT (organization_id) DO NOTHING;

-- =====================================================
-- 9. PRODUCT CATEGORIES
-- =====================================================
INSERT INTO public.product_categories (id, organization_id, name, parent_id, sort_order, is_active)
VALUES
  (cat_mujer,      org_id, 'Mujer',              NULL,          1, true),
  (cat_remeras_m,  org_id, 'Remeras Mujer',      cat_mujer,     1, true),
  (cat_pantalon_m, org_id, 'Pantalones Mujer',   cat_mujer,     2, true),
  (cat_hombre,     org_id, 'Hombre',             NULL,          2, true),
  (cat_remeras_h,  org_id, 'Remeras Hombre',     cat_hombre,    1, true),
  (cat_pantalon_h, org_id, 'Pantalones Hombre',  cat_hombre,    2, true),
  (cat_accesorios, org_id, 'Accesorios',         NULL,          3, true),
  (cat_calzado,    org_id, 'Calzado',            NULL,          4, true),
  (cat_abrigos,    org_id, 'Abrigos y Buzos',    NULL,          5, true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 10. SUPPLIERS
-- =====================================================
INSERT INTO public.suppliers (id, organization_id, name, cuit, phone, email, address, notes, is_active)
VALUES
  (sup_topper,   org_id, 'Topper Argentina SA',   '30-61000001-4', '011-5000-1000', 'mayorista@topper.com.ar',      'Av. Paseo Colón 1120, CABA',     'Calzado deportivo y remeras',   true),
  (sup_levis,    org_id, 'Levi Strauss Argentina', '30-61000002-2', '011-5000-2000', 'wholesale@levis.com.ar',       'Av. Del Libertador 6350, CABA',  'Jeans y denim premium',         true),
  (sup_tascani,  org_id, 'Tascani SA',             '30-61000003-0', '011-5000-3000', 'ventas@tascani.com.ar',        'Humboldt 1550, Palermo, CABA',   'Indumentaria urbana hombre',    true),
  (sup_kevingst, org_id, 'Kevingston SA',          '30-61000004-8', '011-5000-4000', 'comercial@kevingston.com',     'Av. Scalabrini Ortiz 3200, CABA','Ropa casual y polo',            true),
  (sup_importad, org_id, 'Fashion Import SRL',     '30-61000005-6', '011-5000-5000', 'contacto@fashionimport.com.ar','Once, CABA',                     'Accesorios y bijouterie importada', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 11. BRANDS
-- =====================================================
INSERT INTO public.brands (id, organization_id, name, is_active)
VALUES
  (br_topper,   org_id, 'Topper',      true),
  (br_levis,    org_id, 'Levi''s',     true),
  (br_tascani,  org_id, 'Tascani',     true),
  (br_kevingst, org_id, 'Kevingston',  true),
  (br_wrangler, org_id, 'Wrangler',    true),
  (br_generic,  org_id, 'Urbana',      true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 12. PRODUCTS (20 productos de tienda de ropa)
-- =====================================================
INSERT INTO public.products (id, organization_id, name, description, sku, barcode, category_id, supplier_id, brand_id,
  cost_price, sell_price, iva_rate, current_stock, min_stock, reorder_point, cost_currency, is_active)
VALUES
  -- Remeras Mujer
  (p1,  org_id, 'Remera Básica Algodón Mujer',     'Remera manga corta 100% algodón, talles S a XL', 'RM-BAS-001', '7790100001001', cat_remeras_m,  sup_kevingst, br_kevingst, 4500,   8990,  21, 45, 8,  15, 'ARS', true),
  (p2,  org_id, 'Remera Oversize Estampada Mujer',  'Remera oversize con estampa serigrafiada',       'RM-OVR-002', '7790100001002', cat_remeras_m,  sup_tascani,  br_tascani,  5200,  10990,  21, 30, 5,  12, 'ARS', true),
  (p3,  org_id, 'Crop Top Mujer',                   'Crop top acanalado talle único',                 'RM-CRP-003', '7790100001003', cat_remeras_m,  sup_kevingst, br_generic,  3200,   6490,  21, 25, 5,  10, 'ARS', true),

  -- Pantalones Mujer
  (p4,  org_id, 'Jean Mom Mujer',                   'Jean tiro alto mom fit, azul clásico',           'PM-MOM-001', '7790100002001', cat_pantalon_m, sup_levis,    br_levis,   12000,  24990,  21, 20, 5,  10, 'ARS', true),
  (p5,  org_id, 'Pantalón Cargo Mujer',             'Pantalón cargo wide leg con bolsillos',          'PM-CRG-002', '7790100002002', cat_pantalon_m, sup_tascani,  br_tascani,  8500,  17490,  21, 18, 5,  10, 'ARS', true),
  (p6,  org_id, 'Calza Deportiva Mujer',            'Calza larga lycra con cintura alta',             'PM-CLZ-003', '7790100002003', cat_pantalon_m, sup_topper,   br_topper,   5000,   9990,  21, 35, 8,  15, 'ARS', true),

  -- Remeras Hombre
  (p7,  org_id, 'Remera Lisa Hombre Pima',          'Remera algodón pima, talles S a XXL',            'RH-PIM-001', '7790100003001', cat_remeras_h,  sup_kevingst, br_kevingst, 5500,  11490,  21, 40, 8,  15, 'ARS', true),
  (p8,  org_id, 'Remera Polo Hombre',               'Polo piqué manga corta con escudo',              'RH-POL-002', '7790100003002', cat_remeras_h,  sup_kevingst, br_kevingst, 7000,  14990,  21, 22, 5,  12, 'ARS', true),
  (p9,  org_id, 'Musculosa Hombre',                 'Musculosa deportiva dry-fit',                    'RH-MUS-003', '7790100003003', cat_remeras_h,  sup_topper,   br_topper,   3800,   7490,  21, 28, 5,  10, 'ARS', true),

  -- Pantalones Hombre
  (p10, org_id, 'Jean Recto Hombre',                'Jean clásico corte recto, azul oscuro',          'PH-RCT-001', '7790100004001', cat_pantalon_h, sup_levis,    br_levis,   11000,  22990,  21, 25, 5,  12, 'ARS', true),
  (p11, org_id, 'Jean Slim Hombre',                 'Jean slim fit con elastano',                     'PH-SLM-002', '7790100004002', cat_pantalon_h, sup_levis,    br_wrangler,10500,  21990,  21, 15, 5,  10, 'ARS', true),
  (p12, org_id, 'Bermuda Gabardina Hombre',         'Bermuda chino corte regular',                    'PH-BRM-003', '7790100004003', cat_pantalon_h, sup_kevingst, br_kevingst, 6500,  12990,  21, 20, 5,  10, 'ARS', true),

  -- Calzado
  (p13, org_id, 'Zapatilla Urbana Topper',          'Zapatilla urbana cuero sintético',               'CZ-URB-001', '7790100005001', cat_calzado,    sup_topper,   br_topper,  15000,  32990,  21, 18, 4,   8, 'ARS', true),
  (p14, org_id, 'Zapatilla Running Topper',         'Zapatilla running con amortiguación',            'CZ-RUN-002', '7790100005002', cat_calzado,    sup_topper,   br_topper,  18000,  39990,  21, 12, 3,   6, 'ARS', true),

  -- Abrigos
  (p15, org_id, 'Buzo Hoodie Unisex',               'Buzo canguro con capucha, algodón frizado',      'AB-HOD-001', '7790100006001', cat_abrigos,    sup_tascani,  br_tascani,  8000,  16990,  21, 22, 5,  10, 'ARS', true),
  (p16, org_id, 'Campera Puffer Mujer',             'Campera inflable liviana, impermeable',           'AB-PUF-002', '7790100006002', cat_abrigos,    sup_importad, br_generic, 12000,  25990,  21, 10, 3,   6, 'ARS', true),
  (p17, org_id, 'Campera Jean Hombre',              'Campera de jean clásica, forrada',                'AB-JKT-003', '7790100006003', cat_abrigos,    sup_levis,    br_levis,   14000,  29990,  21,  8, 3,   5, 'ARS', true),

  -- Accesorios
  (p18, org_id, 'Cinturón Cuero Hombre',            'Cinturón cuero vacuno con hebilla metálica',     'AC-CIN-001', '7790100007001', cat_accesorios, sup_importad, br_generic,  3500,   7490,  21, 15, 4,   8, 'ARS', true),
  (p19, org_id, 'Gorra Trucker Urbana',             'Gorra trucker con logo bordado',                 'AC-GOR-002', '7790100007002', cat_accesorios, sup_importad, br_generic,  2000,   4990,  21,  3, 5,  10, 'ARS', true),
  (p20, org_id, 'Mochila Urbana',                   'Mochila 25L poliéster con notebook compartment', 'AC-MCH-003', '7790100007003', cat_accesorios, sup_importad, br_generic,  5500,  11990,  21,  2, 4,   8, 'ARS', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 13. CUSTOMERS
-- =====================================================
INSERT INTO public.customers (id, organization_id, name, cuit, tax_condition, phone, email, address, credit_limit, current_balance, is_active)
VALUES
  (cust1, org_id, 'Boutique Flores BA',         '30-71500001-3', 'responsable_inscripto', '+54 11 4300-1001', 'compras@boutiqueflores.com',  'Av. Rivadavia 6800, Flores, CABA', 300000, 24990,  true),
  (cust2, org_id, 'Tienda Online ModaAR',       '20-35000002-1', 'monotributista',        '+54 11 4300-1002', 'pedidos@modaar.com.ar',       'Envíos a todo el país',             150000, 0,      true),
  (cust3, org_id, 'Showroom Belgrano',           '27-28000003-9', 'monotributista',        '+54 11 4300-1003', NULL,                          'Cabildo 2100, Belgrano, CABA',      100000, 0,      true),
  (cust4, org_id, 'Consumidor Final',            NULL,            'consumidor_final',       NULL,               NULL,                          NULL,                                0,      0,      true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 14. POINTS OF SALE
-- =====================================================
INSERT INTO public.points_of_sale (id, organization_id, name, location_id, is_active)
VALUES
  (pos1, org_id, 'Caja Palermo',   loc1_id, true),
  (pos2, org_id, 'Caja Recoleta',  loc2_id, true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 15. EXCHANGE RATES (para ropa importada)
-- =====================================================
INSERT INTO public.exchange_rates (organization_id, currency, rate, date, source, created_by)
VALUES
  (org_id, 'USD', 1050.00, current_date - interval '30 days', 'manual',     admin_uid),
  (org_id, 'USD', 1085.00, current_date - interval '15 days', 'manual',     admin_uid),
  (org_id, 'USD', 1120.00, current_date - interval '1 day',   'dolar_blue', admin_uid)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 16. INVOICES EMITIDAS (ventas)
-- =====================================================
INSERT INTO public.invoices (id, organization_id, invoice_type, direction, number, date, client_name, client_cuit, subtotal, iva_amount, total, status, created_by, customer_id, client_tax_condition)
VALUES
  -- Factura A para mayorista
  (inv1, org_id, 'factura_a', 'emitida', '0001-00000001', current_date - interval '25 days', 'Boutique Flores BA',   '30-71500001-3', 74970,  15733, 90703,  'confirmed', admin_uid,   cust1, 'responsable_inscripto'),
  -- Facturas B para monotributistas
  (inv2, org_id, 'factura_b', 'emitida', '0001-00000002', current_date - interval '20 days', 'Tienda Online ModaAR', '20-35000002-1', 43970,  0,     43970,  'confirmed', seller1_uid, cust2, 'monotributista'),
  (inv3, org_id, 'factura_b', 'emitida', '0001-00000003', current_date - interval '14 days', 'Showroom Belgrano',    '27-28000003-9', 29980,  0,     29980,  'confirmed', seller2_uid, cust3, 'monotributista'),
  -- Facturas C consumidor final
  (inv4, org_id, 'factura_c', 'emitida', '0001-00000004', current_date - interval '10 days', 'Consumidor Final',      NULL,           24990,  0,     24990,  'confirmed', seller1_uid, cust4, 'consumidor_final'),
  (inv5, org_id, 'factura_c', 'emitida', '0001-00000005', current_date - interval '5 days',  'Consumidor Final',      NULL,           17480,  0,     17480,  'confirmed', seller3_uid, cust4, 'consumidor_final'),
  -- Factura A reciente
  (inv6, org_id, 'factura_a', 'emitida', '0001-00000006', current_date - interval '2 days',  'Boutique Flores BA',   '30-71500001-3', 64980,  13645, 78625,  'confirmed', admin_uid,   cust1, 'responsable_inscripto'),
  -- Factura B hoy
  (inv7, org_id, 'factura_b', 'emitida', '0001-00000007', current_date,                      'Tienda Online ModaAR', '20-35000002-1', 32990,  0,     32990,  'confirmed', seller1_uid, cust2, 'monotributista')
ON CONFLICT (id) DO NOTHING;

-- Invoice items (detalle de algunas facturas)
INSERT INTO public.invoice_items (invoice_id, product_id, description, quantity, unit_price, iva_rate, iva_amount, subtotal)
VALUES
  -- inv1: venta mayorista Boutique Flores
  (inv1, p4,  'Jean Mom Mujer',               3, 24990, 21, 15743, 74970),
  -- inv2: venta online ModaAR
  (inv2, p1,  'Remera Básica Algodón Mujer',  2,  8990, 21, 0,     17980),
  (inv2, p15, 'Buzo Hoodie Unisex',           1, 16990, 21, 0,     16990),
  (inv2, p3,  'Crop Top Mujer',               1,  6490, 21, 0,      6490),
  -- inv6: segunda venta a Boutique Flores
  (inv6, p10, 'Jean Recto Hombre',            2, 22990, 21, 9656,  45980),
  (inv6, p7,  'Remera Lisa Hombre Pima',      2, 11490, 21, 4826,  22980)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 17. INVOICES RECIBIDAS (compras a proveedores)
-- =====================================================
INSERT INTO public.invoices (id, organization_id, invoice_type, direction, number, date, client_name, client_cuit, subtotal, iva_amount, total, status, created_by)
VALUES
  (inv_p1, org_id, 'factura_a', 'recibida', 'A-0005-00045678', current_date - interval '28 days', 'Levi Strauss Argentina',  '30-61000002-2', 115000, 24150, 139150, 'confirmed', admin_uid),
  (inv_p2, org_id, 'factura_a', 'recibida', 'A-0001-00012300', current_date - interval '22 days', 'Topper Argentina SA',     '30-61000001-4',  82000, 17220,  99220, 'confirmed', admin_uid),
  (inv_p3, org_id, 'factura_a', 'recibida', 'A-0003-00078900', current_date - interval '15 days', 'Kevingston SA',           '30-61000004-8',  96500, 20265, 116765, 'confirmed', admin_uid),
  (inv_p4, org_id, 'factura_a', 'recibida', 'A-0002-00034500', current_date - interval '8 days',  'Fashion Import SRL',      '30-61000005-6',  42000,  8820,  50820, 'confirmed', admin_uid)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 18. PURCHASES
-- =====================================================
INSERT INTO public.purchases (id, organization_id, invoice_id, supplier_id, date, subtotal, iva_amount, total, is_formal, notes, created_by)
VALUES
  (purch1, org_id, inv_p1, sup_levis,    current_date - interval '28 days', 115000, 24150, 139150, true,  'Temporada otoño-invierno jeans',           admin_uid),
  (purch2, org_id, inv_p2, sup_topper,   current_date - interval '22 days',  82000, 17220,  99220, true,  'Reposición calzado + remeras deportivas',  admin_uid),
  (purch3, org_id, inv_p3, sup_kevingst, current_date - interval '15 days',  96500, 20265, 116765, true,  'Colección nueva remeras y bermudas',       admin_uid),
  (purch4, org_id, inv_p4, sup_importad, current_date - interval '8 days',   42000,  8820,  50820, true,  'Accesorios importados lote marzo',         admin_uid)
ON CONFLICT (id) DO NOTHING;

-- Purchase items
INSERT INTO public.purchase_items (purchase_id, product_id, quantity, unit_price, subtotal)
VALUES
  -- Levi's: jeans
  (purch1, p4,  10, 12000, 120000),
  (purch1, p10, 10, 11000, 110000),
  (purch1, p11,  8, 10500,  84000),
  (purch1, p17,  5, 14000,  70000),
  -- Topper: calzado y remeras
  (purch2, p13, 10, 15000, 150000),
  (purch2, p14,  8, 18000, 144000),
  (purch2, p6,  15,  5000,  75000),
  (purch2, p9,  15,  3800,  57000),
  -- Kevingston: remeras, polos, bermudas
  (purch3, p1,  25,  4500, 112500),
  (purch3, p7,  20,  5500, 110000),
  (purch3, p8,  15,  7000, 105000),
  (purch3, p12, 15,  6500,  97500),
  -- Fashion Import: accesorios
  (purch4, p18, 20, 3500,  70000),
  (purch4, p19, 25, 2000,  50000),
  (purch4, p20, 10, 5500,  55000)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 19. SALES (12 ventas variadas)
-- =====================================================
INSERT INTO public.sales (id, organization_id, invoice_id, seller_id, location_id, sale_channel, date, subtotal, iva_amount, total, payment_method, is_formal, pos_id, customer_id, payment_status)
VALUES
  -- Ventas con factura
  (sale1,  org_id, inv1,  admin_uid,   loc1_id, 'local_fisico', current_date - interval '25 days', 74970,  15733, 90703,  'transferencia', true,  pos1, cust1, 'paid'),
  (sale2,  org_id, inv2,  seller1_uid, loc1_id, 'catalogo',     current_date - interval '20 days', 43970,  0,     43970,  'transferencia', true,  pos1, cust2, 'paid'),
  (sale3,  org_id, inv3,  seller2_uid, loc2_id, 'local_fisico', current_date - interval '14 days', 29980,  0,     29980,  'tarjeta',       true,  pos2, cust3, 'paid'),
  (sale4,  org_id, inv4,  seller1_uid, loc1_id, 'local_fisico', current_date - interval '10 days', 24990,  0,     24990,  'efectivo',      true,  pos1, cust4, 'paid'),
  (sale5,  org_id, inv5,  seller3_uid, loc2_id, 'local_fisico', current_date - interval '5 days',  17480,  0,     17480,  'tarjeta',       true,  pos2, cust4, 'paid'),
  (sale6,  org_id, inv6,  admin_uid,   loc1_id, 'local_fisico', current_date - interval '2 days',  64980,  13645, 78625,  'transferencia', true,  pos1, cust1, 'pending'),
  (sale7,  org_id, inv7,  seller1_uid, loc1_id, 'online',       current_date,                      32990,  0,     32990,  'transferencia', true,  NULL, cust2, 'paid'),
  -- Ventas sin factura (informales / consumidor final)
  (sale8,  org_id, NULL,  seller2_uid, loc2_id, 'local_fisico', current_date - interval '18 days', 16990,  0,     16990,  'efectivo',      false, pos2, NULL,  'paid'),
  (sale9,  org_id, NULL,  seller3_uid, loc1_id, 'local_fisico', current_date - interval '12 days', 39990,  0,     39990,  'tarjeta',       false, pos1, NULL,  'paid'),
  (sale10, org_id, NULL,  seller1_uid, loc1_id, 'catalogo',     current_date - interval '7 days',  21980,  0,     21980,  'transferencia', false, NULL, NULL,  'paid'),
  (sale11, org_id, NULL,  seller2_uid, loc2_id, 'local_fisico', current_date - interval '3 days',  14990,  0,     14990,  'efectivo',      false, pos2, NULL,  'paid'),
  (sale12, org_id, NULL,  seller3_uid, loc1_id, 'local_fisico', current_date,                       8990,  0,      8990,  'efectivo',      false, pos1, cust4, 'paid')
ON CONFLICT (id) DO NOTHING;

-- Sale items
INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, cost_price_snapshot, subtotal)
VALUES
  -- sale1: mayorista Boutique Flores - 3 jeans mom
  (sale1, p4,  3, 24990, 12000, 74970),
  -- sale2: online ModaAR - 2 remeras + 1 buzo + 1 crop
  (sale2, p1,  2,  8990, 4500,  17980),
  (sale2, p15, 1, 16990, 8000,  16990),
  (sale2, p3,  1,  6490, 3200,   6490),
  -- sale3: Showroom Belgrano - 1 jean recto + 1 polo
  (sale3, p10, 1, 22990, 11000, 22990),
  (sale3, p8,  1, 14990, 7000,  14990),
  -- sale4: consumidor final - 1 jean mom
  (sale4, p4,  1, 24990, 12000, 24990),
  -- sale5: consumidor final - 1 calza + 1 musculosa
  (sale5, p6,  1,  9990, 5000,   9990),
  (sale5, p9,  1,  7490, 3800,   7490),
  -- sale6: Boutique Flores - 2 jeans rectos + 2 remeras pima
  (sale6, p10, 2, 22990, 11000, 45980),
  (sale6, p7,  2, 11490, 5500,  22980),
  -- sale7: online ModaAR - 1 zapatilla urbana
  (sale7, p13, 1, 32990, 15000, 32990),
  -- sale8: sin factura - 1 buzo hoodie
  (sale8, p15, 1, 16990, 8000,  16990),
  -- sale9: sin factura - 1 zapatilla running
  (sale9, p14, 1, 39990, 18000, 39990),
  -- sale10: catálogo - 2 remeras oversize + 1 bermuda
  (sale10, p2,  2, 10990, 5200,  21980),
  -- sale11: sin factura - 1 polo hombre
  (sale11, p8,  1, 14990, 7000,  14990),
  -- sale12: hoy - 1 remera básica
  (sale12, p1,  1,  8990, 4500,   8990)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 20. STOCK MOVEMENTS
-- =====================================================
-- Compras (ingresos)
INSERT INTO public.stock_movements (organization_id, product_id, movement_type, quantity, reference_id, notes, created_by, created_at)
VALUES
  (org_id, p4,  'compra', 10, purch1, 'Levi''s - jeans mom',          admin_uid, now() - interval '28 days'),
  (org_id, p10, 'compra', 10, purch1, 'Levi''s - jeans rectos',       admin_uid, now() - interval '28 days'),
  (org_id, p11, 'compra',  8, purch1, 'Levi''s - jeans slim',         admin_uid, now() - interval '28 days'),
  (org_id, p17, 'compra',  5, purch1, 'Levi''s - camperas jean',      admin_uid, now() - interval '28 days'),
  (org_id, p13, 'compra', 10, purch2, 'Topper - zapatillas urbanas',  admin_uid, now() - interval '22 days'),
  (org_id, p14, 'compra',  8, purch2, 'Topper - zapatillas running',  admin_uid, now() - interval '22 days'),
  (org_id, p6,  'compra', 15, purch2, 'Topper - calzas',              admin_uid, now() - interval '22 days'),
  (org_id, p9,  'compra', 15, purch2, 'Topper - musculosas',          admin_uid, now() - interval '22 days'),
  (org_id, p1,  'compra', 25, purch3, 'Kevingston - remeras básicas',  admin_uid, now() - interval '15 days'),
  (org_id, p7,  'compra', 20, purch3, 'Kevingston - remeras pima',     admin_uid, now() - interval '15 days'),
  (org_id, p8,  'compra', 15, purch3, 'Kevingston - polos',            admin_uid, now() - interval '15 days'),
  (org_id, p12, 'compra', 15, purch3, 'Kevingston - bermudas',         admin_uid, now() - interval '15 days'),
  (org_id, p18, 'compra', 20, purch4, 'Fashion Import - cinturones',   admin_uid, now() - interval '8 days'),
  (org_id, p19, 'compra', 25, purch4, 'Fashion Import - gorras',       admin_uid, now() - interval '8 days'),
  (org_id, p20, 'compra', 10, purch4, 'Fashion Import - mochilas',     admin_uid, now() - interval '8 days')
ON CONFLICT DO NOTHING;

-- Ventas (egresos)
INSERT INTO public.stock_movements (organization_id, product_id, movement_type, quantity, reference_id, notes, created_by, created_at)
VALUES
  (org_id, p4,  'venta', 3, sale1,  NULL, admin_uid,   now() - interval '25 days'),
  (org_id, p1,  'venta', 2, sale2,  NULL, seller1_uid, now() - interval '20 days'),
  (org_id, p15, 'venta', 1, sale2,  NULL, seller1_uid, now() - interval '20 days'),
  (org_id, p3,  'venta', 1, sale2,  NULL, seller1_uid, now() - interval '20 days'),
  (org_id, p15, 'venta', 1, sale8,  NULL, seller2_uid, now() - interval '18 days'),
  (org_id, p10, 'venta', 1, sale3,  NULL, seller2_uid, now() - interval '14 days'),
  (org_id, p8,  'venta', 1, sale3,  NULL, seller2_uid, now() - interval '14 days'),
  (org_id, p9,  'venta', 1, sale5,  NULL, seller3_uid, now() - interval '5 days'),
  (org_id, p6,  'venta', 1, sale5,  NULL, seller3_uid, now() - interval '5 days'),
  (org_id, p14, 'venta', 1, sale9,  NULL, seller3_uid, now() - interval '12 days'),
  (org_id, p4,  'venta', 1, sale4,  NULL, seller1_uid, now() - interval '10 days'),
  (org_id, p2,  'venta', 2, sale10, NULL, seller1_uid, now() - interval '7 days'),
  (org_id, p10, 'venta', 2, sale6,  NULL, admin_uid,   now() - interval '2 days'),
  (org_id, p7,  'venta', 2, sale6,  NULL, admin_uid,   now() - interval '2 days'),
  (org_id, p8,  'venta', 1, sale11, NULL, seller2_uid, now() - interval '3 days'),
  (org_id, p13, 'venta', 1, sale7,  NULL, seller1_uid, now()),
  (org_id, p1,  'venta', 1, sale12, NULL, seller3_uid, now())
ON CONFLICT DO NOTHING;

-- Ajustes
INSERT INTO public.stock_movements (organization_id, product_id, movement_type, quantity, notes, created_by, created_at)
VALUES
  (org_id, p19, 'ajuste_negativo', 2, 'Gorras con falla de estampado',      admin_uid,  now() - interval '6 days'),
  (org_id, p20, 'ajuste_negativo', 1, 'Mochila con cierre roto',            admin_uid,  now() - interval '4 days'),
  (org_id, p3,  'devolucion',      1, 'Devolución cliente - talle equivocado', seller1_uid, now() - interval '2 days')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 21. PAYMENTS
-- =====================================================
INSERT INTO public.payments (organization_id, sale_id, customer_id, amount, payment_method, reference, created_by)
VALUES
  (org_id, sale1, cust1, 90703,  'transferencia', 'TRF-CBU-2026-001',  admin_uid),
  (org_id, sale2, cust2, 43970,  'transferencia', 'MP-2026-00234',     seller1_uid),
  (org_id, sale3, cust3, 29980,  'tarjeta',       'VISA-****-4589',    seller2_uid),
  (org_id, sale4, cust4, 24990,  'efectivo',      NULL,                seller1_uid),
  (org_id, sale5, cust4, 17480,  'tarjeta',       'MASTERCARD-****-7722', seller3_uid),
  (org_id, sale7, cust2, 32990,  'transferencia', 'MP-2026-00567',     seller1_uid)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 22. EMPLOYEE SALES OBJECTIVES
-- =====================================================
INSERT INTO public.employee_sales_objectives (organization_id, user_id, objective_type, target_value, period_type, description, is_active)
VALUES
  (org_id, seller1_uid, 'ventas_monto',    200000, 'mensual', 'Facturar $200.000 por mes',            true),
  (org_id, seller2_uid, 'ventas_monto',    180000, 'mensual', 'Facturar $180.000 por mes',            true),
  (org_id, seller3_uid, 'ventas_cantidad',     25, 'mensual', 'Cerrar 25 ventas por mes',             true),
  (org_id, seller1_uid, 'mix_productos',        4, 'semanal', 'Vender de al menos 4 categorías/semana', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 23. BUSINESS UNITS + EXPENSE CATEGORIES (Comercial)
-- =====================================================
INSERT INTO public.business_units (organization_id, name, description, location_id, is_active)
VALUES
  (org_id, 'Local Palermo',   'Tienda principal Palermo Soho',  loc1_id, true),
  (org_id, 'Local Recoleta',  'Sucursal Av. Santa Fe',          loc2_id, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.expense_categories (organization_id, name, type, description, sort_order, is_active)
VALUES
  (org_id, 'Alquiler',           'fijo',     'Alquiler de locales',               1, true),
  (org_id, 'Servicios',          'fijo',     'Luz, internet, alarma',             2, true),
  (org_id, 'Sueldos',            'fijo',     'Sueldos y cargas sociales',         3, true),
  (org_id, 'Impuestos',          'fijo',     'IIBB, monotributo, ganancias',      4, true),
  (org_id, 'Packaging',          'variable', 'Bolsas, papel tissue, stickers',    5, true),
  (org_id, 'Marketing',          'variable', 'Publicidad Instagram, folletería',  6, true),
  (org_id, 'Mantenimiento local','variable', 'Limpieza, reparaciones, vidriera',  7, true)
ON CONFLICT DO NOTHING;

RAISE NOTICE '=====================================================';
RAISE NOTICE ' Seed completado: Indumentaria Urbana SRL';
RAISE NOTICE '=====================================================';
RAISE NOTICE ' Admin:     romina@urbana-indumentaria.com  / Demo1234!';
RAISE NOTICE ' Vendedora: camila@urbana-indumentaria.com  / Demo1234!';
RAISE NOTICE ' Vendedor:  facundo@urbana-indumentaria.com / Demo1234!';
RAISE NOTICE ' Vendedora: valentina@urbana-indumentaria.com / Demo1234!';
RAISE NOTICE ' Admin 2:   martin@urbana-indumentaria.com  / Demo1234!';
RAISE NOTICE '=====================================================';

END $$;
