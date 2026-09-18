# Panel EMPLEADOS + alta manual de empleados

## Qué cambia

**1. La pantalla de gestión de equipo pasa a llamarse EMPLEADOS**
- Nueva dirección: `/admin/empleados` (la anterior `/admin/usuarios` sigue funcionando y redirige, para no romper enlaces guardados).
- Todos los títulos, botones y textos que hoy dicen "Organizaciones" o "Usuarios" pasan a decir "Empleados".
- `/admin` no cambia de función: sigue siendo el monitor de asistencia del día.

**2. Faltas, Legajos, Recibos y Vacaciones se mueven dentro del panel Empleados**
- Dentro de Empleados habrá una barra de secciones: Listado · Faltas · Legajos · Recibos · Vacaciones.
- Las cuatro pantallas actuales se conservan tal cual y se muestran dentro de ese panel; sus direcciones actuales siguen funcionando.
- Del panel de administración se quitan los cuatro botones sueltos y queda un único acceso "Empleados".

**3. Alta manual de empleados (sin depender del mail de invitación)**
Botón "Dar de alta empleado" que abre un formulario con:
- Nombre completo (obligatorio)
- Email (obligatorio)
- Contraseña temporal que define el admin (obligatoria, mínimo 8 caracteres, con opción de generar una al azar y copiarla)
- Organización (obligatoria)
- Teléfono (opcional)
- Rol: Empleado o Administrador
- Sucursal y Turno asignados (opcionales, se listan los de la organización elegida)

Al confirmar, la cuenta queda creada y activa al instante: el empleado aparece en el listado como aceptado y puede iniciar sesión con ese email y contraseña. Al final del alta se muestra un resumen con los datos para copiarlos y pasárselos a la persona.

Validaciones: email con formato correcto y no repetido en la organización, contraseña mínima, nombre no vacío.

## Detalles técnicos

- **Rutas**: agregar `ADMIN_EMPLEADOS = '/admin/empleados'` en `src/lib/routes.ts`; `/admin/usuarios` queda como redirección. Actualizar enlaces en `Dashboard.tsx`, `Admin.tsx` y donde se use `ADMIN_USUARIOS`.
- **Panel**: `src/pages/AdminUsers.tsx` se renombra a `AdminEmployees.tsx` y se envuelve en un layout con pestañas que renderizan `AdminAbsences`, `AdminLegajos`, `AdminPayStubs` y `AdminVacations` como subsecciones (extrayendo el encabezado propio de cada una para no duplicar cabeceras).
- **Alta manual**: nueva edge function `create-employee` con service role (`verify_jwt = false`, validando dentro que quien llama sea admin de la organización). Hace, en orden: `auth.admin.createUser` con `email_confirm: true`, alta en `profiles` (nombre, email, teléfono), fila en `user_roles` con el rol elegido, y fila en `organization_members` con `status: 'accepted'` y `accepted_at`.
- **Sucursal y turno**: hoy no existe relación empleado↔sucursal/turno. Migración que crea `public.employee_assignments` (`user_id`, `organization_id`, `location_id`, `shift_id`, únicos por usuario+organización) con GRANTs para `authenticated`/`service_role` y RLS: el empleado lee lo suyo, los admins de la organización leen y escriben. La edge function inserta ahí la asignación elegida.
- **Rollback**: si falla algún paso posterior a la creación del usuario, la función elimina el usuario creado para no dejar cuentas huérfanas.
