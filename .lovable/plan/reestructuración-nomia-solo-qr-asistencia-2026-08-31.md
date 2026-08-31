# Reestructuración: Nomia solo QR / Asistencia

Sacamos por completo los módulos de Facturación y Control Comercial (botones, rutas, páginas, hooks y tablas). La app queda enfocada en QR, asistencia y RRHH.

## 1. Accesos y navegación

- Eliminar el componente de botones de apps (Facturación / Comercial) que aparece en el panel y en los headers.
- Quitar la pantalla de bloqueo por plan (aparecía cuando el módulo no estaba incluido en la suscripción).
- Sacar el bloque "Fase 3 – Control Comercial" del texto de la landing si corresponde dejarlo, se mantiene como roadmap informativo.

## 2. Rutas

- Borrar todas las rutas `/facturacion/*` (panel, facturas, ventas, compras, productos, stock, proveedores, vendedores, reportes, AFIP, IVA).
- Borrar todas las rutas `/comercial/*` (panel, gastos, planilla, sueldos, unidades, rentabilidad, punto de equilibrio, reportes).
- Limpiar esas entradas del archivo central de rutas y sus imports en el router.
- Cualquier URL vieja cae en la pantalla de "no encontrado" existente.

## 3. Código

- Eliminar las carpetas de páginas `src/pages/facturacion` y `src/pages/comercial`.
- Eliminar los hooks exclusivos de esos módulos: productos, categorías, marcas, proveedores, clientes, facturas, ventas, compras, inventario, stock, pagos, puntos de venta, tipo de cambio, resumen de IVA, performance de vendedores y suscripción.
- Verificar que no queden imports rotos y que el build pase.

## 4. Base de datos

Migración que elimina las tablas de ambos módulos junto con sus enums, funciones y triggers asociados.

Facturación: productos, categorías de producto, marcas, proveedores, clientes, facturas y sus ítems, ventas y sus ítems, compras y sus ítems, movimientos de stock, alertas de stock, puntos de venta, cotizaciones, configuración AFIP, pagos y objetivos de venta.

Comercial: unidades de negocio, categorías de gastos, gastos, planillas de gastos y sueldos.

También se quitan las funciones de IVA, actualización masiva de precios y el trigger de stock, más los enums que sólo usaban esas tablas.

Las tablas de suscripciones (planes y suscripción por organización) también se eliminan, ya que sólo servían para habilitar estos dos módulos.

Esta acción borra los datos demo cargados (Indumentaria Urbana y los datos de prueba de jere@gmail.com). El código queda recuperable desde el historial de git.

## Detalles técnicos

- `src/lib/routes.ts`: quitar bloques `FACTURACION_*` y `COMERCIAL_*`.
- `src/App.tsx`: quitar imports y `<Route>` de ambos módulos, y el import de `AppGuard`.
- Borrar `src/components/AppNavButtons.tsx`, `src/components/AppGuard.tsx`, `src/hooks/useSubscription.ts`.
- Quitar usos de `<AppNavButtons />` en `src/pages/Dashboard.tsx`.
- Migración con `DROP TABLE ... CASCADE` en orden de dependencias, `DROP FUNCTION` (`get_iva_summary`, `bulk_update_prices_from_exchange_rate`, `update_product_stock`, `get_org_subscription_apps`) y `DROP TYPE` de los enums huérfanos.
- Regenerar tipos tras la migración y validar build.
