
# Plan: Restaurar archivos, corregir bugs, crear datos demo y documentacion

## Resumen

Se ejecutaran 4 bloques de trabajo: restaurar el archivo faltante de GitHub, corregir bugs detectados, generar datos demo realistas para la cuenta jere@gmail.com, y crear el documento de venta.

---

## 1. Restaurar AdminReports.tsx desde GitHub

El archivo `src/pages/AdminReports.tsx` (~937 lineas) existe en el branch `main` del repositorio pero no esta en el proyecto Lovable. Se recuperara el contenido completo desde GitHub y se creara el archivo.

---

## 2. Corregir bugs y problemas detectados

### 2.1 Agregar DELETE policy en `locations`
El codigo de `AdminLocations.tsx` (linea 318) hace `.delete()` pero no hay policy RLS de DELETE para admins. Se creara:
```sql
CREATE POLICY "Admins can delete locations"
ON public.locations FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
```

### 2.2 Corregir `.limit(20)` en Dashboard.tsx
Linea 118 de `Dashboard.tsx` limita los registros a 20, lo que rompe el calculo de estadisticas mensuales. Se eliminara o aumentara significativamente el limite.

### 2.3 Renombrar "BeamInOut" a "Nomia" en edge function
En `send-invitation-email/index.ts` linea 162, el remitente dice "BeamInOut". Se cambiara a "Nomia" en el campo `from` y en el contenido del email.

### 2.4 Limpiar 23 locations duplicadas
Hay 24 locations (23 duplicadas "Oficina Central" en la org Centro). Se eliminaran las duplicadas via SQL dejando solo 1 por org.

---

## 3. Datos demo para jere@gmail.com

### Datos actuales:
- User ID: `ec52341f-efa8-4641-80ea-04c2197de2b4` (rol admin)
- 3 organizaciones: Centro, Shopping, Cordoba
- 1 miembro, 24 locations duplicadas, 13 attendance records

### Acciones:

**3.1 Limpiar datos existentes** (SQL)
- Eliminar attendance_records existentes
- Eliminar organization_members existentes (excepto owner)
- Eliminar locations duplicadas

**3.2 Crear 2 organizaciones nuevas**
- Compulsiva Recoleta
- Compulsiva Palermo

**3.3 Crear 1 location por organizacion** (5 total)
- Centro: "Local Av. Corrientes 1234"
- Shopping: "Local Piso 2 - Shopping Abasto"
- Cordoba: "Sucursal Nueva Cordoba"
- Recoleta: "Local Av. Callao 890"
- Palermo: "Local Honduras 4500"

**3.4 Crear 1 turno por organizacion** (5 total)
- Horario Principal: 09:00-18:00, L-V, tolerancia 15/60 min

**3.5 Crear 35 usuarios ficticios** (7 por tienda)
- Insertar en `profiles` con UUIDs generados
- Insertar en `user_roles` con role 'user'
- Insertar en `organization_members` con status 'accepted'
- Nombres argentinos realistas (ej: Maria Lopez, Juan Rodriguez, etc.)

**3.6 Generar ~2800 attendance records** (enero y febrero 2026)
- Usar `generate_series` en SQL para dias laborables
- ~70% llegadas a tiempo, ~20% tardanzas, ~10% ausencias
- Entradas entre 08:50-09:30, salidas entre 17:30-18:15
- Cada entrada con su salida correspondiente

---

## 4. Crear NOMIA_FEATURES.md

Documento en la raiz del proyecto describiendo:
- Que es Nomia y su propuesta de valor
- Funcionalidades principales (QR, reportes, multi-tienda, roles, turnos, etc.)
- Flujo de uso para admin y empleados
- Diferenciadores tecnicos
- Casos de uso ideales

---

## Secuencia de implementacion

1. Restaurar `AdminReports.tsx`
2. Migrations SQL: DELETE policy, limpiar datos, crear orgs/locations/shifts/usuarios/attendance
3. Corregir limit(20) en Dashboard.tsx
4. Corregir branding en send-invitation-email
5. Crear NOMIA_FEATURES.md
