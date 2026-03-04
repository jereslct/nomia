

# Plan: Abrir modal de Registro Manual desde Dashboard

## Problema
El botón "Registro Manual" en el Dashboard navega a `/admin` con `state={{ openManualRegister: true }}`, pero `Admin.tsx` nunca lee ese state, así que el modal no se abre automáticamente.

## Solución
En `src/pages/Admin.tsx`:
1. Importar `useLocation` de `react-router-dom`
2. Leer `location.state?.openManualRegister`
3. En un `useEffect`, si ese flag es `true`, llamar a `openManualDialog()` y limpiar el state (con `navigate(location.pathname, { replace: true })`) para que no se re-abra en navegaciones futuras.

Solo se modifica `src/pages/Admin.tsx` (unas 5-6 líneas nuevas).

