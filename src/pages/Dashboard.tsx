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
  BarChart3,
  MapPin,
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
    organizations?: {
      name: string;
    } | null;
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
  const { config: scheduleConfig, setConfig: setScheduleConfig, saveConfig: saveScheduleConfig, formatted: scheduleFormatted, loading: scheduleLoading } = useScheduleConfig();

  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [activeQrCode, setActiveQrCode] = useState<string | null>(null);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState<{ daysWorked: number; totalHours: number; totalMinutes: number }>({ daysWorked: 0, totalHours: 0, totalMinutes: 0 });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && isAdmin !== undefined) {
      fetchAttendanceRecords();
      fetchMonthlyStats();
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
          locations (name, organization_id, organizations (name))
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

  const fetchMonthlyStats = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      let query = supabase
        .from("attendance_records")
        .select("user_id, record_type, recorded_at")
        .gte("recorded_at", monthStart)
        .lte("recorded_at", monthEnd)
        .order("recorded_at", { ascending: true });

      if (!isAdmin) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;
      if (error || !data) return;

      const byUserDate = new Map<string, { entradas: Date[]; salidas: Date[] }>();
      for (const r of data) {
        const dateKey = `${r.user_id}_${r.recorded_at.split("T")[0]}`;
        if (!byUserDate.has(dateKey)) byUserDate.set(dateKey, { entradas: [], salidas: [] });
        const group = byUserDate.get(dateKey)!;
        if (r.record_type === "entrada") group.entradas.push(new Date(r.recorded_at));
        else if (r.record_type === "salida") group.salidas.push(new Date(r.recorded_at));
      }

      let totalMinutesAll = 0;
      const daysWithEntry = new Set<string>();

      byUserDate.forEach((group, key) => {
        if (group.entradas.length > 0) daysWithEntry.add(key);
        const pairs = Math.min(group.entradas.length, group.salidas.length);
        for (let i = 0; i < pairs; i++) {
          const diff = group.salidas[i].getTime() - group.entradas[i].getTime();
          if (diff > 0) totalMinutesAll += diff / (1000 * 60);
        }
      });

      setMonthlyStats({
        daysWorked: daysWithEntry.size,
        totalHours: Math.floor(totalMinutesAll / 60),
        totalMinutes: Math.round(totalMinutesAll % 60),
      });
    } catch (error) {
      console.error("Error fetching monthly stats:", error);
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

  const todayEntradas = todayRecords.filter(r => r.record_type === "entrada");
  const todaySalidas = todayRecords.filter(r => r.record_type === "salida");
  const todayEntrada = todayEntradas[0]; // most recent (desc order)
  const todaySalida = todaySalidas[0];
  const entryCountToday = todayEntradas.length;
  const exitCountToday = todaySalidas.length;

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

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {/* Quick Actions - Full Width */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <Link to="/admin/locations">
                <Card className="glass-card hover-lift cursor-pointer group h-full">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MapPin className="w-7 h-7 text-success" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Ubicaciones</h3>
                      <p className="text-sm text-muted-foreground">Gestionar sedes</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </CardContent>
                </Card>
              </Link>
              <Link to="/admin">
                <Card className="glass-card hover-lift cursor-pointer group h-full">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="w-4 h-4 rounded-full bg-destructive animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Administración</h3>
                      <p className="text-sm text-muted-foreground">Monitor en vivo</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </CardContent>
                </Card>
              </Link>
              <Link to="/admin/reports">
                <Card className="glass-card hover-lift cursor-pointer group h-full">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <BarChart3 className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Reportes</h3>
                      <p className="text-sm text-muted-foreground">Estadísticas y reportes</p>
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

        {/* Info Cards Row */}
        <div className={`grid gap-6 ${isAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
          {/* Schedule / Today Status */}
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
                              setScheduleConfig({ entryHour: h ?? scheduleConfig.entryHour, entryMinute: m ?? scheduleConfig.entryMinute });
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
                              setScheduleConfig({ exitHour: h ?? scheduleConfig.exitHour, exitMinute: m ?? scheduleConfig.exitMinute });
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
                            setScheduleConfig({ entryToleranceMinutes: Number.isFinite(n) ? n : scheduleConfig.entryToleranceMinutes });
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
                            setScheduleConfig({ exitToleranceMinutes: Number.isFinite(n) ? n : scheduleConfig.exitToleranceMinutes });
                          }}
                        />
                        <p className="text-xs text-muted-foreground">Puede salir hasta {scheduleConfig.exitToleranceMinutes} min después.</p>
                      </div>
                      
                      <Button 
                        variant="hero" 
                        className="w-full mt-3"
                        onClick={async () => {
                          const success = await saveScheduleConfig(scheduleConfig);
                          if (success) {
                            setEditingSchedule(false);
                          }
                        }}
                      >
                        Guardar Horario
                      </Button>
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
                            <span className={todayEntrada ? "font-medium" : "text-muted-foreground"}>
                              Entrada{entryCountToday > 1 ? ` x${entryCountToday}` : ""}
                            </span>
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
                            <span className={todaySalida ? "font-medium" : "text-muted-foreground"}>
                              Salida{exitCountToday > 1 ? ` x${exitCountToday}` : ""}
                            </span>
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Este Mes</CardTitle>
                {isAdmin && (
                  <Link to="/admin/reports">
                    <Button variant="ghost" size="sm" className="text-xs h-7">
                      Ver reportes
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const now = new Date();
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const monthRecords = attendanceHistory.filter(
                  r => new Date(r.recorded_at) >= monthStart
                );

                // Count unique days with entries (for current user or all if admin)
                const userEntries = monthRecords.filter(r => r.record_type === "entrada");
                const uniqueDays = new Set(
                  userEntries.map(r => new Date(r.recorded_at).toISOString().split("T")[0])
                ).size;

                // Calculate total hours: pair entrada/salida per day
                let totalMinutesWorked = 0;
                let totalMinutesLate = 0;

                // Group records by date
                const byDate = new Map<string, typeof monthRecords>();
                monthRecords.forEach(r => {
                  const dateKey = new Date(r.recorded_at).toISOString().split("T")[0];
                  if (!byDate.has(dateKey)) byDate.set(dateKey, []);
                  byDate.get(dateKey)!.push(r);
                });

                byDate.forEach((dayRecs) => {
                  const entradas = dayRecs
                    .filter(r => r.record_type === "entrada")
                    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
                  const salidas = dayRecs
                    .filter(r => r.record_type === "salida")
                    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());

                  // Pair each entrada with the next salida
                  const pairs = Math.min(entradas.length, salidas.length);
                  for (let i = 0; i < pairs; i++) {
                    const entryTime = new Date(entradas[i].recorded_at).getTime();
                    const exitTime = new Date(salidas[i].recorded_at).getTime();
                    if (exitTime > entryTime) {
                      totalMinutesWorked += (exitTime - entryTime) / 60000;
                    }
                  }

                  // Calculate late minutes for each entrada
                  entradas.forEach(entrada => {
                    const recordDate = new Date(entrada.recorded_at);
                    const scheduledMinutes = scheduleConfig.entryHour * 60 + scheduleConfig.entryMinute;
                    const actualMinutes = recordDate.getHours() * 60 + recordDate.getMinutes();
                    const toleranceLimit = scheduledMinutes + scheduleConfig.entryToleranceMinutes;
                    if (actualMinutes > toleranceLimit) {
                      totalMinutesLate += actualMinutes - scheduledMinutes;
                    }
                  });
                });

                const totalHours = Math.floor(totalMinutesWorked / 60);
                const totalMins = Math.round(totalMinutesWorked % 60);
                const lateHours = Math.floor(totalMinutesLate / 60);
                const lateMins = Math.round(totalMinutesLate % 60);

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary" />
                        <span className="font-medium">Días trabajados</span>
                      </div>
                      <span className="font-mono text-lg font-semibold text-primary">{uniqueDays}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-accent" />
                        <span className="font-medium">Horas totales</span>
                      </div>
                      <span className="font-mono text-lg font-semibold text-accent">
                        {totalHours > 0 || totalMins > 0 ? `${totalHours}h ${totalMins}m` : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-3">
                        <AlertCircle className={`w-5 h-5 ${totalMinutesLate > 0 ? "text-warning" : "text-success"}`} />
                        <span className="font-medium">Horas perdidas</span>
                      </div>
                      <span className={`font-mono text-lg font-semibold ${totalMinutesLate > 0 ? "text-warning" : "text-success"}`}>
                        {totalMinutesLate > 0 ? `${lateHours}h ${lateMins}m` : "0m"}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity - Full Width */}
        <Card className="glass-card mt-6">
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

                  // Count how many entries this user has on this day
                  const recordDate = new Date(record.recorded_at).toISOString().split("T")[0];
                  const dayEntriesForUser = attendanceHistory.filter(
                    r => r.record_type === record.record_type && 
                         r.user_id === record.user_id &&
                         new Date(r.recorded_at).toISOString().split("T")[0] === recordDate
                  ).length;

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
                          {dayEntriesForUser > 1 && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">x{dayEntriesForUser}</span>
                          )}
                          {isEntryLate && (
                            <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full">Tarde</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {isAdmin && record.profiles?.full_name 
                            ? record.profiles.full_name 
                            : (record.locations?.organizations?.name || record.locations?.name || "Ubicación no disponible")}
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
      </main>
    </div>
  );
};

export default Dashboard;
