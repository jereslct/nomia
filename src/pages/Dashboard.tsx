import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import { isSameDay } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useScheduleConfig } from "@/hooks/useScheduleConfig";
import { supabase } from "@/integrations/supabase/client";

interface AttendanceRecord {
  id: string;
  user_id?: string;
  record_type: string;
  recorded_at: string;
  location_id: string;
  locations?: {
    name: string;
  };
  profiles?: {
    full_name: string;
  };
}

const isOnTime = (recordedAt: string, scheduleHour: number, scheduleMinute: number, tolerance: number): boolean => {
  const recordDate = new Date(recordedAt);
  const scheduleTime = scheduleHour * 60 + scheduleMinute + tolerance;
  const recordTime = recordDate.getHours() * 60 + recordDate.getMinutes();
  return recordTime <= scheduleTime;
};

const isEarlyExit = (recordedAt: string, scheduleHour: number, scheduleMinute: number): boolean => {
  const recordDate = new Date(recordedAt);
  const scheduleTime = scheduleHour * 60 + scheduleMinute;
  const recordTime = recordDate.getHours() * 60 + recordDate.getMinutes();
  return recordTime < scheduleTime;
};


const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, loading, signOut } = useAuth();
  const { config: scheduleConfig, setConfig: setScheduleConfig, formatted: scheduleFormatted } = useScheduleConfig();

  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [activeQrCode, setActiveQrCode] = useState<string | null>(null);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [editingSchedule, setEditingSchedule] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && isAdmin !== undefined) {
      fetchAttendanceRecords();
      if (isAdmin) {
        fetchActiveQrCode();
      }
    }
  }, [user, isAdmin]);

  const fetchAttendanceRecords = async () => {
    if (!user) return;

    try {
      // Admins see all records, users see only their own
      let query = supabase
        .from("attendance_records")
        .select(
          `
          id,
          user_id,
          record_type,
          recorded_at,
          location_id,
          locations (name)
        `
        )
        .order("recorded_at", { ascending: false })
        .limit(20);

      // If not admin, filter by user_id
      if (!isAdmin) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch profiles for the records
      const userIds = [...new Set((data || []).map((r) => r.user_id).filter(Boolean))] as string[];
      let profilesMap = new Map<string, { full_name: string }>();

      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);

        profiles?.forEach((p) => {
          profilesMap.set(p.user_id, { full_name: p.full_name });
        });
      }

      const recordsWithProfiles = (data || []).map((r) => ({
        ...r,
        profiles: r.user_id ? profilesMap.get(r.user_id) || null : null,
      })) as AttendanceRecord[];

      setAttendanceHistory(recordsWithProfiles);

      // Filter today's records for current user only (for Estado de Hoy)
      const now = new Date();
      const todayUserRecs = recordsWithProfiles.filter(
        (r) => r.user_id === user.id && isSameDay(new Date(r.recorded_at), now)
      );
      setTodayRecords(todayUserRecs);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoadingRecords(false);
    }
  };

  const fetchActiveQrCode = async () => {
    if (!user) return;

    try {
      // Get the most recent non-expired QR code created by this admin
      const { data: qrCode, error } = await supabase
        .from("qr_codes")
        .select("code")
        .eq("created_by", user.id)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && qrCode) {
        setActiveQrCode(qrCode.code);
      } else {
        setActiveQrCode(null);
      }
    } catch (error) {
      console.error("Error fetching active QR code:", error);
      setActiveQrCode(null);
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
              <h1 className="font-bold text-lg">Nomia</h1>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? "Panel de Administrador" : "Panel de Usuario"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/profile" className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors group">
              <div className="text-right">
                <p className="text-sm font-medium group-hover:text-primary transition-colors">{profile?.full_name || user.email}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
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
                  {isAdmin ? "Últimos registros de todos los empleados" : "Últimos registros de asistencia"}
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
                    {attendanceHistory.slice(0, 8).map((record) => {
                      const isEntryOnTime =
                        record.record_type === "entrada" &&
                        isOnTime(
                          record.recorded_at,
                          scheduleConfig.entryHour,
                          scheduleConfig.entryMinute,
                          scheduleConfig.entryToleranceMinutes
                        );
                      const isEntryLate = record.record_type === "entrada" && !isEntryOnTime;

                      return (
                        <div 
                          key={record.id} 
                          className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            record.record_type === "entrada" 
                              ? isEntryLate ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                              : "bg-destructive/10 text-destructive"
                          }`}>
                            {record.record_type === "entrada" 
                              ? isEntryLate ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />
                              : <XCircle className="w-5 h-5" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium capitalize">{record.record_type}</p>
                              {isEntryLate && (
                                <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full">Tarde</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {isAdmin && record.profiles?.full_name ? record.profiles.full_name : (record.locations?.name || "Ubicación no disponible")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium font-mono">{formatTime(record.recorded_at)}</p>
                            <p className="text-sm text-muted-foreground">{formatDate(record.recorded_at)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Today's Status / Schedule Config */}
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">
                      {isAdmin ? "Configuración de Horarios" : "Estado de Hoy"}
                    </CardTitle>
                    {isAdmin ? (
                      <CardDescription className="text-xs">
                        Tolerancia entrada: {scheduleConfig.entryToleranceMinutes} min | salida: {scheduleConfig.exitToleranceMinutes} min
                      </CardDescription>
                    ) : (
                      <CardDescription className="text-xs">
                        Horario: {scheduleFormatted.entry} - {scheduleFormatted.exit}
                      </CardDescription>
                    )}
                  </div>
                  {isAdmin && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => setEditingSchedule((v) => !v)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {editingSchedule ? "Cerrar" : "Editar"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isAdmin ? (
                  <>
                    {editingSchedule ? (
                      <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="schedule-entry">Entrada</Label>
                            <Input
                              id="schedule-entry"
                              type="time"
                              value={scheduleFormatted.entry}
                              onChange={(e) => {
                                const [h, m] = e.target.value.split(":").map(Number);
                                setScheduleConfig((prev) => ({ ...prev, entryHour: h ?? prev.entryHour, entryMinute: m ?? prev.entryMinute }));
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="schedule-exit">Salida</Label>
                            <Input
                              id="schedule-exit"
                              type="time"
                              value={scheduleFormatted.exit}
                              onChange={(e) => {
                                const [h, m] = e.target.value.split(":").map(Number);
                                setScheduleConfig((prev) => ({ ...prev, exitHour: h ?? prev.exitHour, exitMinute: m ?? prev.exitMinute }));
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="schedule-entry-tolerance">Tolerancia entrada (min)</Label>
                          <Input
                            id="schedule-entry-tolerance"
                            type="number"
                            min={0}
                            max={60}
                            value={scheduleConfig.entryToleranceMinutes}
                            onChange={(e) => {
                              const n = Number(e.target.value);
                              setScheduleConfig((prev) => ({ ...prev, entryToleranceMinutes: Number.isFinite(n) ? n : prev.entryToleranceMinutes }));
                            }}
                          />
                          <p className="text-xs text-muted-foreground">Puede llegar hasta {scheduleConfig.entryToleranceMinutes} min antes o después.</p>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="schedule-exit-tolerance">Tolerancia salida (min)</Label>
                          <Input
                            id="schedule-exit-tolerance"
                            type="number"
                            min={0}
                            max={120}
                            value={scheduleConfig.exitToleranceMinutes}
                            onChange={(e) => {
                              const n = Number(e.target.value);
                              setScheduleConfig((prev) => ({ ...prev, exitToleranceMinutes: Number.isFinite(n) ? n : prev.exitToleranceMinutes }));
                            }}
                          />
                          <p className="text-xs text-muted-foreground">Puede salir hasta {scheduleConfig.exitToleranceMinutes} min después.</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-primary" />
                            <span className="font-medium">Entrada</span>
                          </div>
                          <span className="font-mono text-lg font-semibold text-foreground">
                            {scheduleFormatted.entry}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-primary" />
                            <span className="font-medium">Salida</span>
                          </div>
                          <span className="font-mono text-lg font-semibold text-foreground">
                            {scheduleFormatted.exit}
                          </span>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>

                {(() => {
                  const entryOnTime =
                    todayEntrada &&
                    isOnTime(
                      todayEntrada.recorded_at,
                      scheduleConfig.entryHour,
                      scheduleConfig.entryMinute,
                      scheduleConfig.entryToleranceMinutes
                    );
                  const entryLate = todayEntrada && !entryOnTime;

                  return (
                    <div
                      className={`flex items-center justify-between p-3 rounded-xl ${
                        todayEntrada ? (entryLate ? "bg-warning/10" : "bg-success/10") : "bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {todayEntrada ? (
                          entryLate ? (
                            <AlertCircle className="w-5 h-5 text-warning" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-success" />
                          )
                        ) : (
                          <Clock className="w-5 h-5 text-muted-foreground" />
                        )}
                        <div>
                          <span className={todayEntrada ? "font-medium" : "text-muted-foreground"}>Entrada</span>
                          {entryLate && <p className="text-xs text-warning">Llegó tarde</p>}
                          {entryOnTime && <p className="text-xs text-success">A tiempo</p>}
                        </div>
                      </div>
                      <span
                        className={`font-mono ${
                          todayEntrada ? (entryLate ? "text-warning" : "text-success") : "text-muted-foreground"
                        }`}
                      >
                        {todayEntrada ? formatTime(todayEntrada.recorded_at) : "Pendiente"}
                      </span>
                    </div>
                  );
                })()}

                {(() => {
                  const exitEarly =
                    todaySalida &&
                    isEarlyExit(todaySalida.recorded_at, scheduleConfig.exitHour, scheduleConfig.exitMinute);

                  return (
                    <div
                      className={`flex items-center justify-between p-3 rounded-xl ${
                        todaySalida ? (exitEarly ? "bg-warning/10" : "bg-success/10") : "bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {todaySalida ? (
                          exitEarly ? (
                            <AlertCircle className="w-5 h-5 text-warning" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-success" />
                          )
                        ) : (
                          <Clock className="w-5 h-5 text-muted-foreground" />
                        )}
                        <div>
                          <span className={todaySalida ? "font-medium" : "text-muted-foreground"}>Salida</span>
                          {exitEarly && <p className="text-xs text-warning">Salió temprano</p>}
                          {todaySalida && !exitEarly && <p className="text-xs text-success">Completo</p>}
                        </div>
                      </div>
                      <span
                        className={`font-mono ${
                          todaySalida ? (exitEarly ? "text-warning" : "text-success") : "text-muted-foreground"
                        }`}
                      >
                        {todaySalida ? formatTime(todaySalida.recorded_at) : "Pendiente"}
                      </span>
                    </div>
                  );
                })()}
                  </>
                )}
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
                  {activeQrCode ? (
                    <div className="bg-card p-4 rounded-2xl shadow-inner">
                      <QRCode
                        value={activeQrCode}
                        size={160}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <QrCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No hay QR activo</p>
                      <p className="text-xs">Genera uno desde Gestionar QR</p>
                    </div>
                  )}
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
