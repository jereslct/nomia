import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/scan" element={
            <ProtectedRoute>
              <ScanQR />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin>
              <Admin />
            </ProtectedRoute>
          } />
          <Route path="/admin/qr" element={
            <ProtectedRoute requireAdmin>
              <AdminQR />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requireAdmin>
              <AdminUsers />
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute requireAdmin>
            <AdminReports />
            </ProtectedRoute>
          } />
          <Route path="/admin/locations" element={
            <ProtectedRoute requireAdmin>
              <AdminLocations />
            </ProtectedRoute>
          } />
          <Route path="/admin/shifts" element={
            <ProtectedRoute requireAdmin>
              <AdminShifts />
            </ProtectedRoute>
          } />
          <Route path="/admin/absences" element={
            <ProtectedRoute requireAdmin>
              <AdminAbsences />
            </ProtectedRoute>
          } />
          <Route path="/admin/legajos" element={
            <ProtectedRoute requireAdmin>
              <AdminLegajos />
            </ProtectedRoute>
          } />
          <Route path="/admin/pay-stubs" element={
            <ProtectedRoute requireAdmin>
              <AdminPayStubs />
            </ProtectedRoute>
          } />
          <Route path="/admin/vacations" element={
            <ProtectedRoute requireAdmin>
              <AdminVacations />
            </ProtectedRoute>
          } />
          <Route path="/admin/evaluations" element={
            <ProtectedRoute requireAdmin>
              <AdminEvaluations />
            </ProtectedRoute>
          } />
          <Route path="/employee" element={
            <ProtectedRoute>
              <Employee />
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/profile/documents" element={
            <ProtectedRoute>
              <EmployeeDocuments />
            </ProtectedRoute>
          } />
          <Route path="/absences" element={
            <ProtectedRoute>
              <Absences />
            </ProtectedRoute>
          } />
          <Route path="/pay-stubs" element={
            <ProtectedRoute>
              <PayStubs />
            </ProtectedRoute>
          } />
          <Route path="/vacations" element={
            <ProtectedRoute>
              <Vacations />
            </ProtectedRoute>
          } />
          <Route path="/evaluations" element={
            <ProtectedRoute>
              <Evaluations />
            </ProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </main>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
