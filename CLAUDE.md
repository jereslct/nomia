# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nomia** is an attendance tracking system with QR code scanning capabilities. The application manages employee check-in/check-out records, supports role-based access (admin/user), and provides attendance history and reporting.

**Purpose**: Enable organizations to track employee attendance through QR code scanning with different permission levels for administrators and regular employees.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS + shadcn-ui (Radix UI primitives)
- **Backend**: Supabase (PostgreSQL database, authentication, real-time)
- **Routing**: React Router v6
- **State Management**: React hooks (useState, useEffect) + custom hooks
- **Data Fetching**: Direct Supabase client calls (TanStack Query installed but not yet used)
- **UI Components**: shadcn-ui component library (src/components/ui/)
- **Icons**: lucide-react
- **QR Codes**: react-qr-code (generation) + html5-qrcode (scanning)

## Key Directories

- **src/pages/**: Full-page components mapped to routes (Dashboard, Admin, ScanQR, etc.)
- **src/components/**: Reusable components
  - `ui/`: shadcn-ui component library (auto-generated, edit carefully)
  - `ProtectedRoute.tsx`: Route wrapper with authentication/authorization checks
- **src/hooks/**: Custom React hooks
  - `useAuth.tsx`: Authentication state and methods (sign in/up/out, profile, role)
  - `useScheduleConfig.ts`: Schedule configuration management
- **src/integrations/supabase/**: Supabase configuration
  - `client.ts`: Configured Supabase client singleton
  - `types.ts`: Auto-generated database types from Supabase schema
- **src/lib/**: Utility functions (cn() for class merging)
- **supabase/migrations/**: Database migration files
- **supabase/functions/**: Supabase Edge Functions

## Essential Commands

### Development
```bash
npm run dev        # Start dev server on http://localhost:8080
npm run build      # Production build
npm run build:dev  # Development mode build
npm run preview    # Preview production build locally
```

### Linting
```bash
npm run lint       # Run ESLint on all files
```

### Environment Setup
Required environment variables in `.env`:
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase anon/public key
- `VITE_SUPABASE_PROJECT_ID`: Supabase project identifier

## Application Structure

### Authentication Flow
1. User lands on Index page (public landing)
2. Auth page handles sign-in/sign-up (src/pages/Auth.tsx:1)
3. useAuth hook manages session state (src/hooks/useAuth.tsx:17)
4. ProtectedRoute wrapper guards authenticated routes (src/components/ProtectedRoute.tsx:11)
5. Admin routes require `requireAdmin` prop (src/App.tsx:40)

### Route Hierarchy (all routes in Spanish, centralized in src/lib/routes.ts)
- `/` - Landing page
- `/acceso` - Autenticación
- `/panel` - Panel principal (protegido)
- `/escanear` - Escáner QR (protegido)
- `/historial` - Historial de asistencia (protegido)
- `/perfil` - Perfil de usuario (protegido)
- `/perfil/documentos` - Documentos del empleado (protegido)
- `/empleado` - Vista de empleado (protegido)
- `/ausencias` - Faltas del empleado (protegido)
- `/recibos` - Recibos de sueldo (protegido)
- `/vacaciones` - Vacaciones (protegido)
- `/evaluaciones` - Evaluaciones (protegido)
- `/admin` - Panel de administración (protegido, solo admin)
- `/admin/qr` - Gestión de QR (protegido, solo admin)
- `/admin/usuarios` - Gestión de usuarios (protegido, solo admin)
- `/admin/reportes` - Reportes (protegido, solo admin)
- `/admin/ubicaciones` - Ubicaciones (protegido, solo admin)
- `/admin/turnos` - Turnos (protegido, solo admin)
- `/admin/ausencias` - Ausencias (protegido, solo admin)
- `/admin/legajos` - Legajos (protegido, solo admin)
- `/admin/recibos` - Recibos de sueldo (protegido, solo admin)
- `/admin/vacaciones` - Vacaciones (protegido, solo admin)
- `/admin/evaluaciones` - Evaluaciones (protegido, solo admin)

### Database Tables (key ones)
- `profiles`: User profile information
- `user_roles`: Role assignments (admin/user)
- `attendance_records`: Check-in/out records
- `locations`: Physical locations for attendance
- `qr_codes`: QR code data for scanning

## Additional Documentation

When working on specific aspects of the codebase, refer to these documents:

- **.claude/docs/architectural_patterns.md**: Architectural patterns, design decisions, and conventions used throughout the codebase

## Important Notes

- The @ path alias points to src/ directory (vite.config.ts:15)
- Database types in src/integrations/supabase/types.ts are auto-generated - regenerate after schema changes
- shadcn-ui components in src/components/ui/ are managed by CLI - prefer editing via shadcn CLI when possible
- TanStack Query is installed but not currently used - data fetching uses direct Supabase calls
- The app uses Spanish language for user-facing text in some areas
