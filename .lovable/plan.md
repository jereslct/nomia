

# Plan: Auditoría Completa de Funcionalidades de NOMIA

## Objetivo
Revisar sistemáticamente cada función de la app, identificar errores y corregirlos.

---

## Módulos a auditar (por orden de prioridad)

### BLOQUE 1 — Asistencia (core)
| # | Ruta | Función a validar | Qué revisar |
|---|------|-------------------|-------------|
| 1 | `/acceso` | Login email + Google | Flujo completo, redirección a `/panel` |
| 2 | `/acceso` | Registro de usuario | Signup, email de confirmación |
| 3 | `/recuperar-contrasena` | Reset password | Flujo completo con email |
| 4 | `/panel` | Dashboard admin | Métricas, empleados activos, gráficos |
| 5 | `/panel` | Dashboard empleado | Estado del día, estadísticas personales |
| 6 | `/escanear` | Escaneo QR | Cámara, validación, registro entrada/salida |
| 7 | `/empleado` | Vista empleado | Escaneo QR integrado, estado del día |
| 8 | `/historial` | Historial asistencia | Paginación, filtro por mes |
| 9 | `/perfil` | Edición de perfil | Nombre, teléfono, avatar |

### BLOQUE 2 — Admin Asistencia
| # | Ruta | Función a validar |
|---|------|-------------------|
| 10 | `/admin` | Panel admin principal, navegación |
| 11 | `/admin/qr` | Generación QR dinámico por ubicación |
| 12 | `/admin/usuarios` | Invitar empleados, ver pendientes/aceptados |
| 13 | `/admin/reportes` | Reportes, gráficos, exportación CSV/Excel |
| 14 | `/admin/ubicaciones` | CRUD ubicaciones |
| 15 | `/admin/turnos` | Configurar turnos y tolerancias |

### BLOQUE 3 — RRHH
| # | Ruta | Función a validar |
|---|------|-------------------|
| 16 | `/admin/ausencias` | Registrar falta (con filtro org + empleado), listar, aprobar/rechazar |
| 17 | `/ausencias` | Vista empleado: ver sus faltas, justificar |
| 18 | `/admin/legajos` | Cargar documento a empleado, listar, aprobar/rechazar, descargar |
| 19 | `/perfil/documentos` | Empleado sube documentos, los ve listados |
| 20 | `/admin/recibos` | Subir recibo PDF a empleado, listar |
| 21 | `/recibos` | Empleado descarga sus recibos |
| 22 | `/admin/vacaciones` | Configurar saldo, ver solicitudes, aprobar/rechazar |
| 23 | `/vacaciones` | Empleado solicita vacaciones, ve saldo |
| 24 | `/admin/evaluaciones` | Crear plantilla, crear evaluación, calificar, compartir |
| 25 | `/evaluaciones` | Empleado ve evaluaciones compartidas |

### BLOQUE 4 — Facturación (requiere suscripción "Gestión")
| # | Ruta | Función a validar |
|---|------|-------------------|
| 26 | `/facturacion` | Dashboard, métricas |
| 27 | `/facturacion/facturas` | CRUD facturas |
| 28 | `/facturacion/ventas` | Registrar ventas |
| 29 | `/facturacion/compras` | Registrar compras |
| 30 | `/facturacion/productos` | CRUD productos, categorías, marcas |
| 31 | `/facturacion/stock` | Movimientos de stock, alertas |
| 32 | `/facturacion/proveedores` | CRUD proveedores |
| 33 | `/facturacion/vendedores` | Objetivos de vendedores |
| 34 | `/facturacion/reportes` | Reportes de ventas |
| 35 | `/facturacion/afip` | Config AFIP |
| 36 | `/facturacion/iva` | Resumen IVA |

### BLOQUE 5 — Control Comercial (requiere suscripción "Completo")
| # | Ruta | Función a validar |
|---|------|-------------------|
| 37 | `/comercial` | Dashboard comercial |
| 38 | `/comercial/gastos` | Registrar gastos por unidad |
| 39 | `/comercial/planilla` | Planilla de gastos |
| 40 | `/comercial/sueldos` | Gestión sueldos |
| 41 | `/comercial/unidades` | Unidades de negocio |
| 42 | `/comercial/rentabilidad` | Análisis rentabilidad |
| 43 | `/comercial/equilibrio` | Punto de equilibrio |
| 44 | `/comercial/reportes` | Reportes comerciales |

---

## Método de auditoría

Para cada función:
1. **Leer el código** del componente de página y su hook asociado
2. **Verificar consultas a BD** — que usen `organization_id` correcto, joins válidos
3. **Revisar RLS** — que las políticas permitan las operaciones necesarias (especialmente `WITH CHECK` en INSERT/UPDATE)
4. **Verificar UI** — que los selects carguen datos, que los formularios envíen correctamente
5. **Buscar patrones de bugs conocidos** — falta de `WITH CHECK`, joins con foreign keys inexistentes, nombres de archivo sin sanitizar, queries sin `organization_id`

## Problemas comunes ya detectados en sesiones previas
- RLS sin `WITH CHECK` → inserts fallan silenciosamente
- Joins con foreign keys inexistentes → queries fallan y vacían el estado
- Filenames con espacios → Storage rechaza el upload
- Select de empleados vacío → query no incluye miembros de la org
- Doble loading → componente padre y hook ambos muestran loader

---

## Entregable

Por cada módulo auditado:
- Si funciona: marcado como OK
- Si tiene bug: se corrige directamente (código + migración DB si aplica)
- Se documentan los cambios realizados

## Ejecución

Dado el volumen (44 funciones), propongo ejecutar en 4-5 iteraciones:
1. Bloques 1-2 (Asistencia core + Admin asistencia)
2. Bloque 3 (RRHH completo)
3. Bloque 4 (Facturación)
4. Bloque 5 (Comercial)

Cada iteración: lectura de código → detección de bugs → correcciones.

