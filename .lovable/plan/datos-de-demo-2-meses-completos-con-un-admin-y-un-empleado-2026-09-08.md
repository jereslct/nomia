# Datos de demo: 2 meses completos con un admin y un empleado

Crear una organización de prueba con un administrador y un empleado, y llenarla con dos meses de actividad realista (julio y agosto 2026) para poder recorrer toda la app con datos.

## Cuentas nuevas

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | `admin.demo@nomia.app` | `Demo1234!` |
| Empleado | `empleado.demo@nomia.app` | `Demo1234!` |

Ambas quedan confirmadas para poder entrar directamente.

## Organización y configuración base

- Organización "Nomia Demo" con el admin como dueño y el empleado como miembro aceptado.
- Una sucursal ("Casa Central") activa.
- Un turno por defecto de 09:00 a 18:00, de lunes a viernes, con 10 minutos de tolerancia de entrada.

## Asistencia de 2 meses

- Fichadas de entrada y salida para cada día hábil de los últimos dos meses (aprox. 43 días).
- Exactamente 7 días con llegada tarde (entrada entre 15 y 50 minutos después del horario), repartidos entre ambos meses; el resto en horario.
- Salidas con pequeñas variaciones naturales de minutos.

## Ausencias

- 4 faltas cargadas: una justificada, una con certificado médico (con archivo adjunto), una sin justificar y una pendiente de revisión.

## Vacaciones

- Saldo del año: 14 días totales, 5 usados.
- 3 solicitudes: una aprobada (5 días, ya tomada), una pendiente y una rechazada con nota del admin.

## Legajo y recibos (con archivos reales)

- Se generan archivos PDF de ejemplo y se suben al almacenamiento privado, para que los botones de ver/descargar funcionen de verdad:
  - Legajo: currículum, alta de ARCA y un recibo firmado (uno aprobado, uno pendiente).
  - Recibos de sueldo: dos meses cargados, uno ya descargado por el empleado.
  - Certificado médico asociado a la falta correspondiente.

## Detalles técnicos

- Usuarios creados en `auth.users` con contraseña encriptada (`crypt`), con todos los campos de token en cadena vacía para evitar el error de NULL ya conocido; el trigger `handle_new_user` genera perfil y rol, y luego se ajusta el rol del admin a `admin` (rol único).
- Inserciones vía SQL: `organizations`, `organization_members`, `locations`, `work_shifts`, `attendance_records`, `absences`, `vacation_balances`, `vacation_requests`, `employee_documents`, `pay_stubs`.
- Archivos de ejemplo generados localmente y subidos a los buckets privados `employee-documents`, `pay-stubs` y `absence-certificates`, guardando la ruta de almacenamiento (no URL pública) en cada fila, como espera `src/lib/storageFiles.ts`.
- No se modifica código de la aplicación: es todo carga de datos.
