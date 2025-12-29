import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  QrCode, 
  Clock, 
  LogOut, 
  ScanLine, 
  History, 
  Users,
  Settings,
  ChevronRight,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";

// Mock data - will be replaced with real data from Supabase
const mockUser = {
  id: "1",
  name: "Juan Pérez",
  email: "juan@empresa.com",
  role: "admin" as "admin" | "user",
};

const mockAttendanceHistory = [
  { id: "1", type: "entrada", date: "2024-01-15", time: "08:30", location: "Oficina Central" },
  { id: "2", type: "salida", date: "2024-01-15", time: "17:45", location: "Oficina Central" },
  { id: "3", type: "entrada", date: "2024-01-14", time: "08:15", location: "Oficina Central" },
  { id: "4", type: "salida", date: "2024-01-14", time: "18:00", location: "Oficina Central" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [user] = useState(mockUser);
  const [qrValue] = useState(`qrtime-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  const handleLogout = () => {
    navigate("/");
  };

  const isAdmin = user.role === "admin";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">QRTime</h1>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? "Panel de Administrador" : "Panel de Usuario"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="grid sm:grid-cols-2 gap-4">
              {isAdmin ? (
                <>
                  <Link to="/admin/qr">
                    <Card className="glass-card hover-lift cursor-pointer group h-full">
                      <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                          <QrCode className="w-7 h-7 text-primary-foreground" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">Generar QR</h3>
                          <p className="text-sm text-muted-foreground">Mostrar código para escanear</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </CardContent>
                    </Card>
                  </Link>
                  <Link to="/admin/users">
                    <Card className="glass-card hover-lift cursor-pointer group h-full">
                      <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Users className="w-7 h-7 text-accent" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">Empleados</h3>
                          <p className="text-sm text-muted-foreground">Gestionar equipo</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </CardContent>
                    </Card>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/scan">
                    <Card className="glass-card hover-lift cursor-pointer group h-full">
                      <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform animate-pulse-glow">
                          <ScanLine className="w-7 h-7 text-primary-foreground" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">Escanear QR</h3>
                          <p className="text-sm text-muted-foreground">Marcar entrada o salida</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </CardContent>
                    </Card>
                  </Link>
                  <Link to="/history">
                    <Card className="glass-card hover-lift cursor-pointer group h-full">
                      <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <History className="w-7 h-7 text-accent" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">Historial</h3>
                          <p className="text-sm text-muted-foreground">Ver mis registros</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </CardContent>
                    </Card>
                  </Link>
                </>
              )}
            </div>

            {/* Recent Activity */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Actividad Reciente
                </CardTitle>
                <CardDescription>
                  Últimos registros de asistencia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockAttendanceHistory.map((record) => (
                    <div 
                      key={record.id} 
                      className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        record.type === "entrada" 
                          ? "bg-success/10 text-success" 
                          : "bg-destructive/10 text-destructive"
                      }`}>
                        {record.type === "entrada" 
                          ? <CheckCircle className="w-5 h-5" /> 
                          : <XCircle className="w-5 h-5" />
                        }
                      </div>
                      <div className="flex-1">
                        <p className="font-medium capitalize">{record.type}</p>
                        <p className="text-sm text-muted-foreground">{record.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{record.time}</p>
                        <p className="text-sm text-muted-foreground">{record.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Today's Status */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Estado de Hoy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-success/10">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span className="font-medium">Entrada</span>
                  </div>
                  <span className="font-mono text-success">08:30</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <span className="text-muted-foreground">Salida</span>
                  </div>
                  <span className="text-muted-foreground">Pendiente</span>
                </div>
              </CardContent>
            </Card>

            {/* Admin QR Preview */}
            {isAdmin && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">QR Activo</CardTitle>
                  <CardDescription>Código actual para escanear</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div className="bg-card p-4 rounded-2xl shadow-inner">
                    <QRCode
                      value={qrValue}
                      size={160}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    />
                  </div>
                  <Button variant="outline" size="sm" className="mt-4">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurar
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Este Mes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-xl bg-muted/50">
                    <p className="text-3xl font-bold text-primary">18</p>
                    <p className="text-sm text-muted-foreground">Días trabajados</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-muted/50">
                    <p className="text-3xl font-bold text-accent">144h</p>
                    <p className="text-sm text-muted-foreground">Horas totales</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
