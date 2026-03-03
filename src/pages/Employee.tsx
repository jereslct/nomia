import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ScanLine,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  MapPin,
  LogOut,
  History,
  Timer,
  CalendarClock,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useScheduleConfig } from "@/hooks/useScheduleConfig";
import { supabase } from "@/integrations/supabase/client";
import { useQrScanner } from "@/hooks/useQrScanner";

const Employee = () => {
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();
  const { config: scheduleConfig } = useScheduleConfig();
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<{
    isWorking: boolean;
    location: string | null;
    entryTime: string | null;
    entryTimestamp: Date | null;
    hoursWorked: number;
    minutesWorked: number;
  }>({ isWorking: false, location: null, entryTime: null, entryTimestamp: null, hoursWorked: 0, minutesWorked: 0 });
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  const scanner = useQrScanner({
    elementId: "qr-reader-employee",
    useBarCodeDetector: true,
    onSuccess: () => {
      setTimeout(() => {
        setScanDialogOpen(false);
        scanner.reset();
        fetchCurrentStatus();
      }, 3000);
    },
  });

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchCurrentStatus();
  }, [user]);

  const fetchCurrentStatus = async () => {
    if (!user) return;
    setIsLoadingStatus(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: todayRecords } = await supabase
        .from("attendance_records")
        .select(`record_type, recorded_at, locations (name)`)
        .eq("user_id", user.id)
        .gte("recorded_at", `${today}T00:00:00`)
        .order("recorded_at", { ascending: true });

      if (!todayRecords || todayRecords.length === 0) {
        setCurrentStatus({ isWorking: false, location: null, entryTime: null, entryTimestamp: null, hoursWorked: 0, minutesWorked: 0 });
        return;
      }

      const entradas = todayRecords.filter((r) => r.record_type === "entrada");
      const salidas = todayRecords.filter((r) => r.record_type === "salida");

      let completedMinutes = 0;
      const pairs = Math.min(entradas.length, salidas.length);
      for (let i = 0; i < pairs; i++) {
        const diff = new Date(salidas[i].recorded_at).getTime() - new Date(entradas[i].recorded_at).getTime();
        if (diff > 0) completedMinutes += diff / (1000 * 60);
      }

      const lastRecord = todayRecords[todayRecords.length - 1];
      const isWorking = lastRecord.record_type === "entrada";
      const lastEntryTimestamp = isWorking ? new Date(lastRecord.recorded_at) : null;

      if (isWorking && lastEntryTimestamp) {
        const liveMinutes = (Date.now() - lastEntryTimestamp.getTime()) / (1000 * 60);
        completedMinutes += liveMinutes;
      }

      setCurrentStatus({
        isWorking,
        location: isWorking ? ((lastRecord.locations as any)?.name || "Sin ubicación") : null,
        entryTime: isWorking ? lastEntryTimestamp!.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }) : null,
        entryTimestamp: lastEntryTimestamp,
        hoursWorked: Math.floor(completedMinutes / 60),
        minutesWorked: Math.round(completedMinutes % 60),
      });
    } catch (error) {
      console.error("Error fetching status:", error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (!currentStatus.isWorking || !currentStatus.entryTimestamp) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const entry = currentStatus.entryTimestamp!.getTime();
      setElapsedMinutes(Math.floor((now - entry) / (1000 * 60)));
    }, 30000);
    return () => clearInterval(interval);
  }, [currentStatus.isWorking, currentStatus.entryTimestamp]);

  const handleDialogChange = (open: boolean) => {
    setScanDialogOpen(open);
    if (!open) {
      scanner.stopScanning();
      scanner.reset();
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0] || "Usuario";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-background/80 backdrop-blur-lg border-b border-border safe-area-inset">
        <div className="px-4 h-14 flex items-center justify-between">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="w-9 h-9" aria-label="Volver">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex gap-2">
            <Link to="/history">
              <Button variant="ghost" size="icon" className="w-9 h-9" aria-label="Historial">
                <History className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="w-9 h-9" onClick={handleLogout} aria-label="Cerrar sesión">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 flex flex-col">
        <div className="mb-8">
          <p className="text-muted-foreground text-sm">Bienvenido de vuelta</p>
          <h1 className="text-2xl font-bold">Hola, {firstName} 👋</h1>
        </div>

        <Card className="glass-card mb-4">
          <CardContent className="pt-6 pb-6">
            {isLoadingStatus ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : currentStatus.isWorking ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estado actual</p>
                    <p className="font-semibold text-success">Trabajando</p>
                  </div>
                </div>
                <div className="flex gap-4 pt-2 flex-wrap">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{currentStatus.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Entrada: {currentStatus.entryTime}</span>
                  </div>
                </div>
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Timer className="w-4 h-4" />
                      <span>Horas trabajadas hoy</span>
                    </div>
                    <span className="font-mono font-semibold">
                      {currentStatus.hoursWorked}h {currentStatus.minutesWorked}m
                    </span>
                  </div>
                  {(() => {
                    const expectedMinutes = (scheduleConfig.exitHour - scheduleConfig.entryHour) * 60 + (scheduleConfig.exitMinute - scheduleConfig.entryMinute);
                    const workedMinutes = currentStatus.hoursWorked * 60 + currentStatus.minutesWorked;
                    const pct = Math.min(100, Math.round((workedMinutes / expectedMinutes) * 100));
                    const remainMinutes = Math.max(0, expectedMinutes - workedMinutes);
                    const remainH = Math.floor(remainMinutes / 60);
                    const remainM = remainMinutes % 60;
                    return (
                      <>
                        <Progress value={pct} className="h-2" />
                        <p className="text-xs text-muted-foreground text-right">
                          {remainMinutes > 0 ? `Faltan ${remainH}h ${remainM}m para completar la jornada` : "Jornada completa"}
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Clock className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado actual</p>
                  <p className="font-medium">No has marcado ingreso</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule Info Card */}
        <Card className="glass-card mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CalendarClock className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Horario esperado</p>
                <p className="text-xs text-muted-foreground">
                  {String(scheduleConfig.entryHour).padStart(2, "0")}:{String(scheduleConfig.entryMinute).padStart(2, "0")} - {String(scheduleConfig.exitHour).padStart(2, "0")}:{String(scheduleConfig.exitMinute).padStart(2, "0")}
                  {" · "}Tolerancia: {scheduleConfig.entryToleranceMinutes} min
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex-1" />

        <div className="pb-8">
          <Button variant="hero" size="xl" className="w-full h-16 text-lg gap-3 shadow-lg" onClick={() => setScanDialogOpen(true)}>
            <ScanLine className="w-6 h-6" />
            Escanear QR
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-3">
            Escanea el código QR para {currentStatus.isWorking ? "marcar salida" : "marcar entrada"}
          </p>
        </div>
      </main>

      <Dialog open={scanDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-md h-[100dvh] sm:h-auto p-0 gap-0 border-0 sm:border sm:rounded-lg">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle className="text-center">Escanear Código QR</DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex flex-col p-4 space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-foreground/5 max-w-sm mx-auto w-full">
              {scanner.status === "idle" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
                  <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center animate-pulse-glow">
                    <ScanLine className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">Presiona para activar la cámara y escanear el código QR</p>
                  <Button variant="hero" size="lg" onClick={scanner.startScanning} disabled={scanner.isInitializing} className="mt-2">
                    {scanner.isInitializing ? <><Loader2 className="w-5 h-5 animate-spin" />Iniciando...</> : <><ScanLine className="w-5 h-5" />Activar Cámara</>}
                  </Button>
                </div>
              )}
              {scanner.status === "scanning" && (
                <>
                  <div id="qr-reader-employee" className="w-full h-full" />
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-8 border-2 border-primary rounded-2xl">
                      <div className="absolute left-0 right-0 h-0.5 bg-primary animate-scan-line" />
                    </div>
                  </div>
                </>
              )}
              {scanner.status === "success" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-success/10 animate-scale-in">
                  <div className="w-24 h-24 rounded-full bg-success flex items-center justify-center animate-bounce">
                    <CheckCircle className="w-12 h-12 text-success-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-success">¡{scanner.recordType === "entrada" ? "Entrada" : "Salida"} registrada!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              )}
              {scanner.status === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-destructive/10 animate-scale-in p-6">
                  <div className="w-20 h-20 rounded-full bg-destructive flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-destructive-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-destructive">Error</p>
                    <p className="text-sm text-muted-foreground px-4">{scanner.errorMessage || "Verifica los permisos de cámara"}</p>
                  </div>
                  <Button variant="outline" onClick={scanner.reset} className="mt-2">Reintentar</Button>
                </div>
              )}
            </div>
            {scanner.status === "scanning" && (
              <Button variant="outline" size="lg" className="w-full max-w-sm mx-auto" onClick={() => { scanner.stopScanning(); scanner.reset(); }}>
                Cancelar
              </Button>
            )}
            <div className="text-center text-xs text-muted-foreground max-w-sm mx-auto">
              Apunta la cámara hacia el código QR mostrado por el administrador
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={scanner.reentryDialogOpen} onOpenChange={(open) => { if (!open) scanner.handleCancelReentry(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Volver a marcar ingreso?</DialogTitle>
            <DialogDescription>
              Ya completaste {scanner.reentryInfo?.entry_count} ingreso(s) y {scanner.reentryInfo?.exit_count} salida(s) hoy.
              ¿Deseas registrar un nuevo ingreso?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={scanner.handleCancelReentry}>Cancelar</Button>
            <Button variant="hero" onClick={scanner.handleConfirmReentry}>Sí, marcar ingreso</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employee;
