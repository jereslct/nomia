# Nomia — Guía para Administradores

Esta guía explica cómo gestionar tu organización, empleados y asistencia desde el panel de administración de **Nomia**.

---

## 1. Primer acceso y configuración

1. Registrate en la app con tu correo y contraseña.
2. Confirmá tu correo desde el enlace de verificación.
3. Iniciá sesión. Si tenés rol de administrador, verás el **Panel de Administrador** en el Dashboard.

---

## 2. Dashboard del Administrador (`/dashboard`)

Tu pantalla principal incluye:

- **Accesos rápidos**: Generar QR, Organizaciones, Ubicaciones, Administración, Reportes.
- **Turnos y Horarios**: vista rápida del turno configurado con opción de gestionar.
- **QR Activo**: previsualización del código QR vigente.
- **Estadísticas del mes**: días trabajados, horas totales y horas perdidas de toda la organización.
- **Actividad reciente**: últimos registros de asistencia de todos los empleados.

---

## 3. Gestión de Organizaciones (`/admin/users`)

### Crear una organización
1. Andá a **Organizaciones** desde el Dashboard.
2. Hacé clic en **+ Nueva Organización**.
3. Ingresá el nombre (ej: "Compulsiva Palermo").

### Ver empleados
1. Seleccioná una organización para ver sus empleados.
2. Usá el **buscador** para filtrar por nombre, email o teléfono.
3. Usá el filtro **Todos / Activos / Pendientes** para ver por estado.

### Invitar empleados
1. Seleccioná la organización.
2. Hacé clic en **Invitar**.
3. Ingresá el correo electrónico del empleado.
4. El empleado recibirá un email con instrucciones para unirse.

### Invitación masiva
1. Hacé clic en **Invitación masiva**.
2. Subí un archivo con los correos electrónicos.
3. Se enviarán las invitaciones automáticamente.

---

## 4. Gestión de Ubicaciones (`/admin/locations`)

Las ubicaciones representan las sedes o locales donde se registra asistencia.

### Crear ubicación
1. Andá a **Ubicaciones** y seleccioná la organización.
2. Hacé clic en **+ Nueva ubicación**.
3. Completá nombre y dirección.

### Gestionar ubicaciones
Cada ubicación muestra:
- **Estado**: Activa o Inactiva.
- **Registros hoy**: cantidad de fichadas del día.
- **Acciones**: Editar (✏️), Ver detalles (👁️), Eliminar (🗑️).

---

## 5. Gestión de Turnos (`/admin/shifts`)

Los turnos definen el horario laboral y se usan para calcular puntualidad.

### Crear turno
1. Andá a **Turnos** y hacé clic en **+ Nuevo Turno**.
2. Configurá:
   - **Nombre** (ej: "Horario Principal").
   - **Hora de entrada** y **hora de salida**.
   - **Tolerancia de entrada**: minutos de gracia antes de marcar como "tarde" (ej: 15 min).
   - **Tolerancia de salida**: minutos antes de la hora de salida para permitir fichar (ej: 60 min).
   - **Días activos**: seleccioná los días de la semana (L, M, X, J, V, S, D).

### Turno Principal
El turno marcado como **⭐ Principal** es el que se usa para calcular puntualidad en el panel de administración y reportes.

---

## 6. Generación de Códigos QR (`/admin/qr`)

Los códigos QR son el mecanismo central de fichaje.

### Generar un QR
1. Andá a **Generar QR** desde el Dashboard.
2. Seleccioná la **ubicación** (se usa la primera ubicación activa por defecto).
3. Elegí el **tiempo de validez** (30 segundos, 1 minuto, 5 minutos, etc.).
4. El código QR se genera automáticamente con firma criptográfica.

### Mostrar el QR a los empleados
- Mostrá la pantalla del celular/tablet a los empleados para que escaneen.
- El código se **regenera automáticamente** cuando expira.
- Podés hacer clic en **Regenerar** para crear uno nuevo manualmente.
- Usá **Copiar código** para compartirlo de otra forma si es necesario.

### Seguridad
- Cada código QR tiene una **firma criptográfica** que impide falsificación.
- Los códigos **expiran** según el tiempo configurado.
- La validación se realiza en el backend, no en el dispositivo del empleado.

---

## 7. Panel de Administración en Vivo (`/admin`)

Monitor en tiempo real de la asistencia del día:

### Tarjetas de resumen
- **En Horario**: empleados que ficharon a tiempo.
- **Tarde**: empleados que ficharon después de la tolerancia.
- **Ausentes**: empleados que no ficharon.
- **Finalizados**: empleados que completaron entrada y salida.

### Monitor en Vivo
- Tabla con todos los empleados y su estado actual.
- Tabs para filtrar: Todos, En Horario, Tarde, Ausentes, Finalizados.
- Se actualiza en **tiempo real**.

### Registro Manual
Si un empleado no puede escanear el QR, podés registrar su asistencia manualmente desde el botón **Registro Manual**.

---

## 8. Reportes y Estadísticas (`/admin/reports`)

Análisis detallado de la asistencia de tu equipo.

### Filtros disponibles
- **Período**: Esta semana, Este mes, Mes anterior, Últimos 3 meses, Este año.
- **Organización**: Todas o una específica.
- **Empleado**: Todos o uno específico.

### Tarjetas de resumen
- **Empleados**: cantidad total con registros.
- **Puntualidad**: porcentaje global.
- **Promedio horas/día**: horas promedio trabajadas.
- **Tardanzas**: cantidad total.

### Gráficos
- **Asistencia diaria**: gráfico de barras con entradas a tiempo vs. tarde por día.
- **Puntualidad**: gráfico de tendencia del porcentaje de puntualidad.

### Tabla de reporte por empleado
Detalle por cada empleado con:
- Días trabajados.
- Entradas a tiempo.
- Entradas tarde.
- Porcentaje de puntualidad (con barra visual).
- Horas totales trabajadas.

**Funcionalidades de la tabla:**
- 🔍 **Buscar** por nombre de empleado.
- 📊 **Filtrar** por nivel de puntualidad (Alta ≥80%, Media 50-79%, Baja <50%).
- ↕️ **Ordenar** por cualquier columna (clic en el encabezado).
- 📄 **Paginación**: 10 empleados por página con navegación.

### Exportar
Hacé clic en **Exportar** para descargar los reportes en formato Excel o PDF.

---

## 9. Flujo típico del día

1. **Antes de que lleguen los empleados**: Abrí la app y generá un código QR para la ubicación correspondiente.
2. **Cuando llegan**: Mostrá el QR en tu pantalla para que lo escaneen.
3. **Durante el día**: Consultá el Monitor en Vivo para ver quién fichó y quién falta.
4. **Al cierre**: Los empleados escanean nuevamente para registrar la salida.
5. **Fin del período**: Revisá los Reportes para analizar puntualidad y horas trabajadas.

---

## Preguntas frecuentes

### ¿Puedo tener varias organizaciones?
Sí. Podés crear múltiples organizaciones y cada una tiene sus propios empleados, ubicaciones y turnos.

### ¿Qué pasa si un empleado pierde acceso?
Podés enviarle una nueva invitación desde la sección de Usuarios.

### ¿Los empleados pueden ver los reportes?
No. Los reportes y el panel de administración solo son visibles para usuarios con rol de administrador.

### ¿Cómo cambio el turno de trabajo?
Andá a **Turnos**, hacé clic en **Editar** en el turno que querés modificar y guardá los cambios. El turno marcado como Principal se usa para calcular puntualidad.

### ¿Los códigos QR se pueden reutilizar?
No. Cada código tiene un tiempo de validez y una firma única. Una vez expirado, se debe generar uno nuevo.
