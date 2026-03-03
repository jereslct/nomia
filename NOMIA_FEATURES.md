# Nomia — Sistema de Control de Asistencia con QR

## ¿Qué es Nomia?

Nomia es una plataforma web moderna de **control de asistencia laboral** que permite a empresas con múltiples sucursales gestionar la entrada y salida de sus empleados mediante **códigos QR dinámicos y seguros**. Diseñada para negocios retail, cadenas de tiendas, franquicias y cualquier organización que necesite un sistema simple pero robusto para trackear la puntualidad de su equipo.

---

## Propuesta de Valor

| Problema | Solución Nomia |
|----------|---------------|
| Planillas manuales poco confiables | Registro digital con QR, hora exacta y ubicación |
| Sin visibilidad de puntualidad | Dashboard con métricas en tiempo real |
| Múltiples sucursales difíciles de controlar | Panel centralizado multi-tienda |
| Reportes manuales en Excel | Exportación automática a CSV/Excel con un clic |
| Sistemas caros y complejos | Interfaz simple, mobile-first, sin hardware |

---

## Funcionalidades Principales

### 🔐 Códigos QR Seguros y Dinámicos
- Generación de códigos QR con **firma criptográfica** (HMAC-SHA256)
- Los QR **expiran automáticamente** (configurable: 5 min, 15 min, etc.)
- Validación server-side que previene capturas de pantalla y reutilización
- Cada escaneo registra usuario, hora exacta y ubicación

### 📊 Dashboard en Tiempo Real
- **Vista admin**: Actividad de todos los empleados en todas las sucursales
- **Vista empleado**: Estado personal del día, historial y estadísticas propias
- Indicadores de puntualidad con semáforo visual (a tiempo / tarde)
- Contador de entradas y salidas del día actual
- Estadísticas mensuales: días trabajados, horas totales

### 🏪 Gestión Multi-Tienda (Multi-Organización)
- Un administrador puede gestionar **múltiples sucursales** desde una sola cuenta
- Cada sucursal tiene su propia ubicación, empleados y configuración
- Filtrado por organización en todos los reportes
- Invitación de empleados por email con vinculación automática a la sucursal

### 👥 Gestión de Empleados
- Invitación por email con **aceptación automática** al registrarse
- Perfiles completos (nombre, email, teléfono, foto)
- Roles diferenciados: **Administrador** y **Empleado**
- Vista de estado de invitaciones (pendientes / aceptadas)

### ⏰ Turnos y Horarios Configurables
- Definición de turnos por organización (horario de entrada/salida)
- **Tolerancia configurable** para entradas (ej: 15 minutos de gracia)
- **Tolerancia de salida** para evitar falsos "salida anticipada"
- Días activos configurables (ej: lunes a viernes)
- Soporte para múltiples ciclos entrada/salida en un mismo día

### 📈 Reportes y Estadísticas Avanzadas
- **Reporte por empleado**: días trabajados, puntualidad, horas totales
- **Gráfico de barras**: asistencia diaria (a tiempo vs. tarde)
- **Gráfico circular**: distribución de puntualidad global
- Filtros por: período (semana/mes actual/mes anterior), organización, empleado
- **Exportación**: CSV, Excel individual, o reporte completo multi-hoja

### 📍 Gestión de Ubicaciones
- Creación de ubicaciones con nombre y dirección
- Activación/desactivación de ubicaciones
- Vinculación de ubicaciones a organizaciones
- Cada registro de asistencia queda asociado a una ubicación específica

### 🔔 Sistema de Notificaciones
- Alerta al admin de invitaciones pendientes
- Recordatorio al empleado si no marcó entrada pasada la hora
- Indicadores visuales en el dashboard

### 📱 Diseño Mobile-First
- Interfaz 100% responsive, optimizada para celulares
- Escaneo de QR desde la cámara del celular del empleado
- Experiencia fluida tanto en desktop como en mobile

---

## Flujos de Uso

### Para el Administrador
1. **Configuración inicial**: Crear organización(es) → Agregar ubicación → Configurar turno
2. **Invitar empleados**: Desde el panel de usuarios, enviar invitación por email
3. **Día a día**: Generar QR → Mostrarlo en la tienda → Los empleados escanean al llegar/irse
4. **Seguimiento**: Revisar dashboard → Consultar reportes → Exportar datos

### Para el Empleado
1. **Registro**: Recibe invitación por email → Se registra en Nomia
2. **Entrada**: Al llegar al trabajo, abre Nomia → Escanea el QR visible en la tienda
3. **Salida**: Al irse, vuelve a escanear el QR
4. **Consulta**: Puede ver su historial, estadísticas del mes y estado del día

---

## Diferenciadores Técnicos

- **Sin hardware especial**: Solo se necesita un celular con cámara y un monitor/tablet para mostrar el QR
- **Seguridad criptográfica**: Los QR usan firmas HMAC-SHA256 verificadas server-side, imposibles de falsificar
- **QR dinámicos con expiración**: Previene screenshots y uso fraudulento
- **Row-Level Security**: Cada usuario solo ve sus propios datos; los admins ven datos de sus organizaciones
- **Arquitectura multi-tenant**: Una cuenta admin controla múltiples tiendas de forma segura e independiente
- **PWA-ready**: La app funciona de forma optimizada en navegadores mobile, sin necesidad de instalar nada
- **Exportación profesional**: Reportes multi-hoja en Excel con resumen y detalle, listos para contabilidad

---

## Casos de Uso Ideales

| Sector | Ejemplo |
|--------|---------|
| **Retail / Moda** | Cadena de tiendas de ropa con 5-50 sucursales |
| **Gastronomía** | Franquicias de restaurants o cafeterías |
| **Servicios** | Empresas de limpieza, mantenimiento, seguridad |
| **Educación** | Institutos con múltiples sedes |
| **Salud** | Clínicas y consultorios con personal rotativo |
| **Coworking** | Espacios compartidos con registro de uso |

---

## Stack Tecnológico

- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, RLS)
- **QR**: Generación con react-qr-code, escaneo con html5-qrcode
- **Gráficos**: Recharts
- **Exportación**: xlsx (multi-sheet Excel)

---

## Resumen Ejecutivo

> **Nomia elimina las planillas de papel y los sistemas de fichaje obsoletos.** Con solo un celular y un monitor, cualquier negocio puede tener un control de asistencia profesional, seguro y con reportes automáticos. Ideal para cadenas retail y franquicias que necesitan visibilidad centralizada de todas sus sucursales.

**Contacto**: [Tu información de contacto aquí]
