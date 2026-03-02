# Nomia

Sistema de control de asistencia con escaneo de códigos QR. Permite a las organizaciones registrar entradas y salidas de empleados mediante QR con firma segura, gestionar múltiples ubicaciones, definir turnos laborales y generar reportes con exportación a CSV/Excel.

## Características principales

- **Escaneo QR seguro**: códigos firmados con HMAC-SHA256 y expiración configurable (30s, 1min, 5min)
- **Modo kiosco**: pantalla completa con QR auto-regenerado para tablets/dispositivos fijos
- **Registro manual**: los administradores pueden registrar entradas/salidas manualmente
- **Multi-ubicación**: soporte para múltiples sedes por organización
- **Turnos laborales**: configuración de horarios, tolerancias de entrada/salida y días activos
- **Monitor en vivo**: visualización en tiempo real del estado de asistencia (presente, tarde, ausente, finalizado)
- **Reportes y gráficos**: estadísticas de puntualidad, horas promedio, gráficos de barras y torta
- **Exportación CSV/Excel**: resumen, detalle y reporte completo multi-hoja
- **Invitaciones por email**: incorporación de empleados vía correo electrónico (Resend)
- **Perfil con avatar**: edición de perfil con recorte circular de imagen
- **Roles**: administrador y empleado con permisos diferenciados

## Tech Stack

| Categoría | Tecnología |
|-----------|------------|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Estilos | Tailwind CSS + shadcn-ui (Radix UI) |
| Backend | Supabase (PostgreSQL, Auth, Realtime, Edge Functions) |
| Routing | React Router v6 |
| Gráficos | Recharts |
| QR | react-qr-code (generación) + html5-qrcode (escaneo) |
| Formularios | React Hook Form + Zod |
| Exportación | xlsx |
| Iconos | lucide-react |

## Requisitos previos

- [Node.js](https://nodejs.org/) >= 18 (se recomienda instalar con [nvm](https://github.com/nvm-sh/nvm))
- npm
- Proyecto en [Supabase](https://supabase.com/) con las migraciones aplicadas

## Instalación

```bash
git clone https://github.com/jereslct/nomia.git
cd nomia
npm install
```

Crear un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=tu-anon-key
VITE_SUPABASE_PROJECT_ID=tu-project-id
```

## Comandos

```bash
npm run dev        # Servidor de desarrollo en http://localhost:8080
npm run build      # Build de producción
npm run build:dev  # Build en modo desarrollo
npm run preview    # Preview del build de producción
npm run lint       # Ejecutar ESLint
```

## Estructura del proyecto

```
src/
├── pages/              # Páginas mapeadas a rutas
│   ├── Index.tsx           # Landing pública
│   ├── Auth.tsx            # Login / registro
│   ├── Dashboard.tsx       # Panel principal (adaptado por rol)
│   ├── ScanQR.tsx          # Escáner QR dedicado
│   ├── Employee.tsx        # Vista empleado con escáner
│   ├── History.tsx         # Historial de asistencia
│   ├── Profile.tsx         # Edición de perfil y avatar
│   ├── Admin.tsx           # Monitor en vivo + registro manual
│   ├── AdminQR.tsx         # Generación de QR + modo kiosco
│   ├── AdminUsers.tsx      # Organizaciones, empleados, invitaciones
│   ├── AdminReports.tsx    # Reportes, gráficos, exportación
│   ├── AdminLocations.tsx  # Gestión de ubicaciones/sedes
│   └── AdminShifts.tsx     # Gestión de turnos laborales
├── components/
│   ├── ui/                 # Componentes shadcn-ui
│   ├── ProtectedRoute.tsx  # Protección de rutas por auth/rol
│   └── NavLink.tsx         # Navegación
├── hooks/
│   ├── useAuth.tsx             # Autenticación, sesión, perfil, rol
│   ├── useScheduleConfig.ts   # Configuración de horario por defecto
│   ├── useWorkShifts.ts       # CRUD de turnos laborales
│   ├── usePendingInvitations.ts # Invitaciones pendientes en tiempo real
│   ├── use-toast.ts           # Notificaciones toast
│   └── use-mobile.tsx         # Detección de dispositivo móvil
├── integrations/supabase/
│   ├── client.ts           # Cliente Supabase singleton
│   └── types.ts            # Tipos auto-generados del schema
├── lib/
│   ├── utils.ts            # Utilidad cn() para clases
│   └── exportUtils.ts      # Funciones de exportación CSV/Excel
supabase/
├── functions/
│   ├── generate-secure-qr/   # Genera QR firmado con expiración
│   ├── validate-qr-scan/     # Valida firma, registra asistencia
│   └── send-invitation-email/ # Envía invitación por email (Resend)
└── migrations/              # Migraciones SQL del schema
```

## Rutas

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/` | Pública | Landing page |
| `/auth` | Pública | Inicio de sesión y registro |
| `/dashboard` | Autenticado | Panel principal según rol |
| `/scan` | Autenticado | Escáner QR con cámara |
| `/employee` | Autenticado | Vista de empleado |
| `/history` | Autenticado | Historial personal de asistencia |
| `/profile` | Autenticado | Perfil de usuario |
| `/admin` | Admin | Monitor en vivo de asistencia |
| `/admin/qr` | Admin | Generación de códigos QR |
| `/admin/users` | Admin | Gestión de empleados y organizaciones |
| `/admin/reports` | Admin | Reportes y exportación |
| `/admin/locations` | Admin | Gestión de ubicaciones |
| `/admin/shifts` | Admin | Gestión de turnos |

## Base de datos

Tablas principales del schema en Supabase:

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Información del usuario (nombre, email, avatar, teléfono) |
| `user_roles` | Asignación de roles (admin / user) |
| `organizations` | Organizaciones registradas |
| `organization_members` | Membresía e invitaciones (pendiente, aceptada, rechazada) |
| `locations` | Sedes/ubicaciones por organización |
| `work_shifts` | Turnos laborales con tolerancias y días activos |
| `qr_codes` | Códigos QR generados con firma y expiración |
| `attendance_records` | Registros de entrada/salida con ubicación y hora |

## QR: flujo de escaneo

1. El admin genera un QR desde `/admin/qr` invocando la edge function `generate-secure-qr`
2. El código tiene el formato `nomia:nonce|location_id|expires_at|signature`
3. El empleado escanea el QR desde `/scan` o `/employee`
4. La edge function `validate-qr-scan` verifica la firma HMAC-SHA256 y la expiración
5. Se registra automáticamente como entrada o salida según el último estado del empleado

## Licencia

Proyecto privado.
