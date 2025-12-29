import { useEffect, useState } from "react";
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
  XCircle,
  Loader2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface AttendanceRecord {
  id: string;
  record_type: string;
  recorded_at: string;
  location_id: string;
  locations?: {
    name: string;
  };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, loading, signOut } = useAuth();
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [qrValue] = useState(`qrtime-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [loadingRecords, setLoadingRecords] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAttendanceRecords();
    }
  }, [user]);

  const fetchAttendanceRecords = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("attendance_records")
        .select(`
          id,
          record_type,
          recorded_at,
          location_id,
          locations (name)
        `)
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      const records = (data || []) as AttendanceRecord[];
      setAttendanceHistory(records);
      
      // Filter today's records
      const today = new Date().toISOString().split("T")[0];
      const todayRecs = records.filter(r => 
        r.recorded_at.startsWith(today)
      );
      setTodayRecords(todayRecs);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const todayEntrada = todayRecords.find(r => r.record_type === "entrada");
  const todaySalida = todayRecords.find(r => r.record_type === "salida");

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
              <p className="text-sm font-medium">{profile?.full_name || user.email}</p>
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
                          <h3 className="font-semibold">Organizaciones</h3>
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
                {loadingRecords ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : attendanceHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay registros de asistencia aún</p>
                    <p className="text-sm mt-1">Escanea un código QR para comenzar</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attendanceHistory.slice(0, 5).map((record) => (
                      <div 
                        key={record.id} 
                        className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          record.record_type === "entrada" 
                            ? "bg-success/10 text-success" 
                            : "bg-destructive/10 text-destructive"
                        }`}>
                          {record.record_type === "entrada" 
                            ? <CheckCircle className="w-5 h-5" /> 
                            : <XCircle className="w-5 h-5" />
                          }
                        </div>
                        <div className="flex-1">
                          <p className="font-medium capitalize">{record.record_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {record.locations?.name || "Ubicación no disponible"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatTime(record.recorded_at)}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(record.recorded_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                <div className={`flex items-center justify-between p-3 rounded-xl ${
                  todayEntrada ? "bg-success/10" : "bg-muted/50"
                }`}>
                  <div className="flex items-center gap-3">
                    {todayEntrada ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : (
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    )}
                    <span className={todayEntrada ? "font-medium" : "text-muted-foreground"}>
                      Entrada
                    </span>
                  </div>
                  <span className={todayEntrada ? "font-mono text-success" : "text-muted-foreground"}>
                    {todayEntrada ? formatTime(todayEntrada.recorded_at) : "Pendiente"}
                  </span>
                </div>
                <div className={`flex items-center justify-between p-3 rounded-xl ${
                  todaySalida ? "bg-destructive/10" : "bg-muted/50"
                }`}>
                  <div className="flex items-center gap-3">
                    {todaySalida ? (
                      <XCircle className="w-5 h-5 text-destructive" />
                    ) : (
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    )}
                    <span className={todaySalida ? "font-medium" : "text-muted-foreground"}>
                      Salida
                    </span>
                  </div>
                  <span className={todaySalida ? "font-mono text-destructive" : "text-muted-foreground"}>
                    {todaySalida ? formatTime(todaySalida.recorded_at) : "Pendiente"}
                  </span>
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
                  <Link to="/admin/qr" className="w-full mt-4">
                    <Button variant="outline" size="sm" className="w-full">
                      <Settings className="w-4 h-4 mr-2" />
                      Gestionar QR
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Este Mes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-xl bg-muted/50">
                    <p className="text-3xl font-bold text-primary">
                      {Math.floor(attendanceHistory.filter(r => r.record_type === "entrada").length)}
                    </p>
                    <p className="text-sm text-muted-foreground">Días trabajados</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-muted/50">
                    <p className="text-3xl font-bold text-accent">—</p>
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
