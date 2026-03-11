import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ROUTES } from "@/lib/routes";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ScanQR from "./pages/ScanQR";
import AdminQR from "./pages/AdminQR";
import Admin from "./pages/Admin";
import AdminUsers from "./pages/AdminUsers";
import AdminReports from "./pages/AdminReports";
import AdminLocations from "./pages/AdminLocations";
import AdminShifts from "./pages/AdminShifts";
import AdminAbsences from "./pages/AdminAbsences";
import AdminLegajos from "./pages/AdminLegajos";
import AdminPayStubs from "./pages/AdminPayStubs";
import AdminVacations from "./pages/AdminVacations";
import AdminEvaluations from "./pages/AdminEvaluations";
import Employee from "./pages/Employee";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Absences from "./pages/Absences";
import EmployeeDocuments from "./pages/EmployeeDocuments";
import PayStubs from "./pages/PayStubs";
import Vacations from "./pages/Vacations";
import Evaluations from "./pages/Evaluations";
import FacturacionDashboard from "./pages/facturacion/FacturacionDashboard";
import Facturas from "./pages/facturacion/Facturas";
import Ventas from "./pages/facturacion/Ventas";
import Compras from "./pages/facturacion/Compras";
import Productos from "./pages/facturacion/Productos";
import Stock from "./pages/facturacion/Stock";
import Proveedores from "./pages/facturacion/Proveedores";
import Vendedores from "./pages/facturacion/Vendedores";
import ReportesVentas from "./pages/facturacion/ReportesVentas";
import AfipConfig from "./pages/facturacion/AfipConfig";
import ResumenIva from "./pages/facturacion/ResumenIva";
import ComercialDashboard from "./pages/comercial/ComercialDashboard";
import Gastos from "./pages/comercial/Gastos";
import PlanillaGastos from "./pages/comercial/PlanillaGastos";
import Sueldos from "./pages/comercial/Sueldos";
import UnidadesNegocio from "./pages/comercial/UnidadesNegocio";
import Rentabilidad from "./pages/comercial/Rentabilidad";
import PuntoEquilibrio from "./pages/comercial/PuntoEquilibrio";
import ReportesComercial from "./pages/comercial/ReportesComercial";
import NotFound from "./pages/NotFound";
import { OfflineBanner } from "./components/OfflineBanner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppGuard } from "./components/AppGuard";
const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <a href="#main-content" className="skip-to-content">
        Saltar al contenido principal
      </a>
      <OfflineBanner />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <main id="main-content">
        <Routes>
          <Route path={ROUTES.HOME} element={<Index />} />
          <Route path={ROUTES.ACCESO} element={<Auth />} />
          <Route path={ROUTES.PANEL} element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.ESCANEAR} element={
            <ProtectedRoute>
              <ScanQR />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.ADMIN} element={
            <ProtectedRoute requireAdmin>
              <Admin />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.ADMIN_QR} element={
            <ProtectedRoute requireAdmin>
              <AdminQR />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.ADMIN_USUARIOS} element={
            <ProtectedRoute requireAdmin>
              <AdminUsers />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.ADMIN_REPORTES} element={
            <ProtectedRoute requireAdmin>
              <AdminReports />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.ADMIN_UBICACIONES} element={
            <ProtectedRoute requireAdmin>
              <AdminLocations />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.ADMIN_TURNOS} element={
            <ProtectedRoute requireAdmin>
              <AdminShifts />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.ADMIN_AUSENCIAS} element={
            <ProtectedRoute requireAdmin>
              <AdminAbsences />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.ADMIN_LEGAJOS} element={
            <ProtectedRoute requireAdmin>
              <AdminLegajos />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.ADMIN_RECIBOS} element={
            <ProtectedRoute requireAdmin>
              <AdminPayStubs />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.ADMIN_VACACIONES} element={
            <ProtectedRoute requireAdmin>
              <AdminVacations />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.ADMIN_EVALUACIONES} element={
            <ProtectedRoute requireAdmin>
              <AdminEvaluations />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.EMPLEADO} element={
            <ProtectedRoute>
              <Employee />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.HISTORIAL} element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.PERFIL} element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.PERFIL_DOCUMENTOS} element={
            <ProtectedRoute>
              <EmployeeDocuments />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.AUSENCIAS} element={
            <ProtectedRoute>
              <Absences />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.RECIBOS} element={
            <ProtectedRoute>
              <PayStubs />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.VACACIONES} element={
            <ProtectedRoute>
              <Vacations />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.EVALUACIONES} element={
            <ProtectedRoute>
              <Evaluations />
            </ProtectedRoute>
          } />
          {/* Facturacion routes - admin only, subscription gated */}
          <Route path={ROUTES.FACTURACION_PANEL} element={
            <ProtectedRoute requireAdmin>
              <AppGuard requiredApp="facturacion" appName="Facturación">
                <FacturacionDashboard />
              </AppGuard>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.FACTURACION_FACTURAS} element={
            <ProtectedRoute requireAdmin>
              <AppGuard requiredApp="facturacion" appName="Facturación">
                <Facturas />
              </AppGuard>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.FACTURACION_VENTAS} element={
            <ProtectedRoute requireAdmin>
              <AppGuard requiredApp="facturacion" appName="Facturación">
                <Ventas />
              </AppGuard>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.FACTURACION_COMPRAS} element={
            <ProtectedRoute requireAdmin>
              <AppGuard requiredApp="facturacion" appName="Facturación">
                <Compras />
              </AppGuard>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.FACTURACION_PRODUCTOS} element={
            <ProtectedRoute requireAdmin>
              <AppGuard requiredApp="facturacion" appName="Facturación">
                <Productos />
              </AppGuard>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.FACTURACION_STOCK} element={
            <ProtectedRoute requireAdmin>
              <AppGuard requiredApp="facturacion" appName="Facturación">
                <Stock />
              </AppGuard>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.FACTURACION_PROVEEDORES} element={
            <ProtectedRoute requireAdmin>
              <AppGuard requiredApp="facturacion" appName="Facturación">
                <Proveedores />
              </AppGuard>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.FACTURACION_VENDEDORES} element={
            <ProtectedRoute requireAdmin>
              <AppGuard requiredApp="facturacion" appName="Facturación">
                <Vendedores />
              </AppGuard>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.FACTURACION_REPORTES} element={
            <ProtectedRoute requireAdmin>
              <AppGuard requiredApp="facturacion" appName="Facturación">
                <ReportesVentas />
              </AppGuard>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.FACTURACION_AFIP} element={
            <ProtectedRoute requireAdmin>
              <AppGuard requiredApp="facturacion" appName="Facturación">
                <AfipConfig />
              </AppGuard>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.FACTURACION_IVA} element={
            <ProtectedRoute requireAdmin>
              <AppGuard requiredApp="facturacion" appName="Facturación">
                <ResumenIva />
              </AppGuard>
            </ProtectedRoute>
          } />
          {/* Comercial routes - admin only, subscription gated */}
          <Route path={ROUTES.COMERCIAL_PANEL} element={
            <ProtectedRoute requireAdmin>
              <AppGuard requiredApp="comercial" appName="Control Comercial">
                <ComercialDashboard />
              </AppGuard>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.COMERCIAL_GASTOS} element={
            <ProtectedRoute requireAdmin>
              <AppGuard requiredApp="comercial" appName="Control Comercial">
                <Gastos />
              </AppGuard>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.COMERCIAL_PLANILLA} element={
            <ProtectedRoute requireAdmin>
              <AppGuard requiredApp="comercial" appName="Control Comercial">
                <PlanillaGastos />
              </AppGuard>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.COMERCIAL_SUELDOS} element={
            <ProtectedRoute requireAdmin>
              <AppGuard requiredApp="comercial" appName="Control Comercial">
                <Sueldos />
              </AppGuard>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.COMERCIAL_UNIDADES} element={
            <ProtectedRoute requireAdmin>
              <AppGuard requiredApp="comercial" appName="Control Comercial">
                <UnidadesNegocio />
              </AppGuard>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.COMERCIAL_RENTABILIDAD} element={
            <ProtectedRoute requireAdmin>
              <AppGuard requiredApp="comercial" appName="Control Comercial">
                <Rentabilidad />
              </AppGuard>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.COMERCIAL_EQUILIBRIO} element={
            <ProtectedRoute requireAdmin>
              <AppGuard requiredApp="comercial" appName="Control Comercial">
                <PuntoEquilibrio />
              </AppGuard>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.COMERCIAL_REPORTES} element={
            <ProtectedRoute requireAdmin>
              <AppGuard requiredApp="comercial" appName="Control Comercial">
                <ReportesComercial />
              </AppGuard>
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </main>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
