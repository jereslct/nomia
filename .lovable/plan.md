

# Plan: Corrección de errores visuales en mobile

Analicé las capturas y el código de todas las páginas admin. Estos son los problemas detectados y las correcciones propuestas:

---

## Problemas identificados

1. **`/admin` - Header cortado arriba**: El título "Panel de Administrador" y los botones de acción (Registro Manual, Reportes, Refresh) se amontonan en mobile porque el header tiene `h-16` fijo y los botones usan `flex items-center justify-between` sin wrapping.

2. **`/admin` - Tabs del Monitor en Vivo desbordan**: Los 5 TabsTrigger ("Todos", "En Horario", "Tarde", "Ausentes", "Fin") no caben en pantalla mobile y se cortan horizontalmente.

3. **`/admin` - Tabla del Monitor en Vivo**: Las 6 columnas (Empleado, Entrada, Salida, Estado, Local, Acciones) no caben en mobile.

4. **`/admin/users` - Título "Empleados de [OrgName]" se rompe**: El CardTitle con nombre largo de organización ("Compulsiva Recoleta") ocupa demasiado espacio y los botones de acción ("Invitación masiva") quedan apretados.

5. **`/admin/users` - Tablas de empleados desbordan**: 8 columnas (Checkbox, Empleado, Email, Teléfono, Organización, Estado, Solicitud, Fecha) imposible en mobile.

6. **`/admin/locations` - Título "Ubicaciones de [OrgName]" se rompe**: Mismo problema que AdminUsers con nombres largos de organización.

7. **`/admin/locations` - Tabla desborda**: 5 columnas (Nombre, Dirección, Estado, Registros hoy, Acciones) se cortan a la derecha.

8. **`/admin/reports` - Header cortado**: Título "Reportes y Estadísticas" + botones Refresh y Exportar se comprimen.

---

## Correcciones propuestas

### 1. Headers de todas las páginas admin (`Admin.tsx`, `AdminReports.tsx`)
- Cambiar el header a `min-h-16` en vez de `h-16` fijo para que pueda crecer.
- En `/admin`: ocultar texto de botones en mobile (ya existe `hidden sm:inline` pero el header sigue apretado). Hacer los botones `size="icon"` en mobile.
- En `/admin/reports`: igual, hacer botones más compactos en mobile.

### 2. Tabs del Monitor en Vivo (`Admin.tsx`)
- Envolver los `TabsList` en un contenedor con `overflow-x-auto` y `scrollbar-hide` para scroll horizontal en mobile.
- Reducir el texto de cada tab en mobile (abreviar o quitar los counts).

### 3. Tablas que desbordan en mobile (`Admin.tsx`, `AdminUsers.tsx`, `AdminLocations.tsx`)
- Envolver cada `<Table>` en un `<div className="overflow-x-auto">` para permitir scroll horizontal.
- Ocultar columnas menos importantes en mobile con `hidden sm:table-cell` (ej: Teléfono, Fecha, Dirección, Registros hoy).

### 4. CardHeaders con títulos largos (`AdminUsers.tsx`, `AdminLocations.tsx`)
- Cambiar `flex-row` a `flex-col sm:flex-row` en los CardHeader que tienen título + botones de acción.
- Truncar nombres de organización largos con `truncate` y `max-w` en mobile.

---

## Archivos a modificar

| Archivo | Cambios |
|---|---|
| `src/pages/Admin.tsx` | Header flexible, tabs scrollables, tabla con overflow-x-auto, columnas ocultas en mobile |
| `src/pages/AdminUsers.tsx` | CardHeader responsive, tablas con overflow-x-auto, columnas ocultas en mobile |
| `src/pages/AdminLocations.tsx` | CardHeader responsive, tabla con overflow-x-auto, columnas ocultas en mobile |
| `src/pages/AdminReports.tsx` | Header flexible, botones compactos en mobile |

Aproximadamente 4 archivos con cambios focalizados en layout responsive (clases Tailwind).

