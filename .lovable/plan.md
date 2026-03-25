

# Plan: Insertar datos ficticios de facturación

## Objetivo
Poblar las tablas de facturación de la organización "Compulsiva Centro" (`674c4825-14e9-47fd-84a1-f078aba8c8af`) del usuario `jere@gmail.com` con datos demo realistas.

## Datos a insertar

| Tabla | Cantidad | Detalle |
|-------|----------|---------|
| `product_categories` | 5 | Remeras, Pantalones, Camperas, Accesorios, Calzado |
| `brands` | 3 | Compulsiva, Urban Style, Street Wear |
| `suppliers` | 3 | Textiles del Sur, Confecciones Patagonia, Importadora Fashion |
| `customers` | 5 | Mix de consumidor final y responsable inscripto |
| `products` | 15 | Productos con stock, SKU, precios de costo/venta, IVA 21% |
| `invoices` | 12 | 8 emitidas + 4 recibidas, varios tipos (A/B/C/NC), estados (confirmed/draft) |
| `invoice_items` | ~12 | Ítems asociados a las facturas |
| `sales` | 13 | Ventas de marzo (10 históricas + 3 de hoy), distintos canales y medios de pago |
| `sale_items` | ~19 | Productos vendidos |
| `purchases` | 4 | Compras a proveedores con ítems |
| `purchase_items` | 7 | Ítems de compras |
| `points_of_sale` | 2 | Caja 1 y Caja 2 |
| `exchange_rates` | 1 | USD a $1.250,50 |

## Implementación

Una sola migración SQL con todos los INSERTs usando `ON CONFLICT DO NOTHING` para ser idempotente. Los datos cubren todo marzo 2026 con ventas del día actual para que el dashboard muestre métricas activas.

**Nota técnica**: La tabla `purchases` no tiene columna `status`, así que se omite ese campo.

