
# Plan: Prueba integral de todas las funcionalidades de Nomia

Se probara cada seccion de la aplicacion navegando con el browser automatizado, verificando que las paginas cargan correctamente, muestran datos y no tienen errores en consola.

---

## Tests a ejecutar (en orden)

### 1. Landing page (`/`)
- Verificar que carga sin errores
- Verificar que hay botones/links para ir a login

### 2. Autenticacion (`/auth`)
- Verificar que la pagina de login carga
- Login con jere@gmail.com (requiere que el usuario este logueado en el preview)

### 3. Dashboard (`/dashboard`)
- Verificar que carga con datos (registros de asistencia, estadisticas)
- Verificar tarjetas de resumen (presentes, tardanzas, ausentes)
- Verificar invitaciones pendientes si las hay

### 4. Panel Admin (`/admin`)
- Verificar que carga la vista de administracion
- Verificar grafico de torta de asistencia
- Verificar tabla de empleados del dia

### 5. Admin - Gestion de Usuarios (`/admin/users`)
- Verificar que lista los empleados de las organizaciones
- Verificar filtros y busqueda

### 6. Admin - Reportes (`/admin/reports`)
- Verificar que cargan los graficos (barras, torta)
- Verificar filtros de periodo (esta semana, este mes, mes anterior)
- Verificar tabla de reporte por empleado con filtros, ordenamiento y paginacion
- Verificar exportacion (boton presente)

### 7. Admin - Ubicaciones (`/admin/locations`)
- Verificar que lista las ubicaciones por organizacion
- Verificar que se pueden ver las 5 tiendas

### 8. Admin - Turnos (`/admin/shifts`)
- Verificar que muestra los turnos configurados por organizacion

### 9. Admin - Codigos QR (`/admin/qr`)
- Verificar que la pagina de generacion de QR carga

### 10. Historial (`/history`)
- Verificar que muestra registros de asistencia del usuario logueado

### 11. Perfil (`/profile`)
- Verificar que muestra datos del perfil del usuario

### 12. Escanear QR (`/scan`)
- Verificar que la pagina del escaner carga (no se puede probar la camara)

### 13. Vista Empleado (`/employee`)
- Verificar que carga la vista de empleado

---

## Metodologia

Se navegara a cada ruta con el browser automatizado, se tomara screenshot y se revisaran console logs para detectar errores. Se reportaran todos los problemas encontrados al finalizar.

## Seccion tecnica

- Herramientas: `browser--navigate_to_sandbox`, `browser--screenshot`, `browser--read-console-logs`, `browser--observe`
- Se verificara que no haya errores de React (hooks, rendering) ni errores de red (401, 500)
- Se probaran interacciones basicas como cambio de filtros y navegacion entre tabs
