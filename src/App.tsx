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
import NotFound from "./pages/NotFound";
import { OfflineBanner } from "./components/OfflineBanner";
import { ErrorBoundary } from "./components/ErrorBoundary";
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
          <Route path="*" element={<NotFound />} />
        </Routes>
        </main>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
