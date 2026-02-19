import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Html5Qrcode } from "html5-qrcode";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type ScanStatus = "idle" | "scanning" | "success" | "error";

const Employee = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading, signOut } = useAuth();
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [recordType, setRecordType] = useState<"entrada" | "salida" | null>(null);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<{
    isWorking: boolean;
    location: string | null;
    entryTime: string | null;
  }>({ isWorking: false, location: null, entryTime: null });
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCurrentStatus();
    }
  }, [user]);

  const fetchCurrentStatus = async () => {
    if (!user) return;
    setIsLoadingStatus(true);

    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: todayRecords } = await supabase
        .from("attendance_records")
        .select(`
          record_type,
          recorded_at,
          locations (name)
        `)
        .eq("user_id", user.id)
        .gte("recorded_at", `${today}T00:00:00`)
        .order("recorded_at", { ascending: false })
        .limit(1);

      const lastRecord = todayRecords?.[0];

      if (lastRecord && lastRecord.record_type === "entrada") {
        setCurrentStatus({
          isWorking: true,
          location: (lastRecord.locations as any)?.name || "Oficina",
          entryTime: new Date(lastRecord.recorded_at).toLocaleTimeString("es", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
      } else {
        setCurrentStatus({ isWorking: false, location: null, entryTime: null });
      }
    } catch (error) {
      console.error("Error fetching status:", error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      // First check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Cámara no disponible",
          description: "Tu navegador no soporta acceso a la cámara. Usa Safari o Chrome.",
          variant: "destructive",
        });
        return false;
      }

      // Request camera permission explicitly first
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      
      // Stop the stream immediately - we just needed to trigger permission
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err: any) {
      console.error("Camera permission error:", err);
      
      let errorMessage = "No se pudo acceder a la cámara.";
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage = "Permiso de cámara denegado. Ve a Ajustes > Safari > Cámara y permite el acceso.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMessage = "No se encontró ninguna cámara en tu dispositivo.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errorMessage = "La cámara está siendo usada por otra aplicación.";
      } else if (err.name === "OverconstrainedError") {
        errorMessage = "No se pudo configurar la cámara correctamente.";
      } else if (err.name === "SecurityError") {
        errorMessage = "Acceso a cámara bloqueado. Asegúrate de usar HTTPS.";
      }
      
      toast({
        title: "Error de cámara",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  const startScanning = async () => {
    if (scannerRef.current || isInitializing) return;

    setIsInitializing(true);
    
    // Request permission first
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      setIsInitializing(false);
      setStatus("error");
      return;
    }

    setStatus("scanning");

    try {
      // Small delay for iOS to properly release the camera
      await new Promise((resolve) => setTimeout(resolve, 300));

      const html5QrCode = new Html5Qrcode("qr-reader-employee", {
        verbose: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      });
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // Ignore scan errors - they happen continuously while scanning
        }
      );
    } catch (err: any) {
      console.error("Error starting scanner:", err);
      
      setStatus("error");
      
      let errorMessage = "No se pudo iniciar el escáner.";
      if (err.toString().includes("Camera access denied")) {
        errorMessage = "Permiso de cámara denegado. Permite el acceso en la configuración del navegador.";
      }
      
      toast({
        title: "Error de escáner",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  const handleScanSuccess = async (result: string) => {
    await stopScanning();

    if (!result.startsWith("nomia-")) {
      setStatus("error");
      toast({
        title: "Código inválido",
        description: "Este código QR no es válido para registrar asistencia.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      setStatus("error");
      toast({
        title: "Error",
        description: "Debes iniciar sesión para registrar asistencia.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Validate QR code exists in database and is not expired
      const { data: qrCode } = await supabase
        .from("qr_codes")
        .select("id, location_id, expires_at")
        .eq("code", result)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      // Require valid QR code - no fallback allowed
      if (!qrCode) {
        setStatus("error");
        toast({
          title: "Código QR inválido o expirado",
          description: "Este código QR no es válido o ha expirado. Solicita un nuevo código al administrador.",
          variant: "destructive",
        });
        return;
      }

      const locationId = qrCode.location_id;
      const qrCodeId = qrCode.id;

      const today = new Date().toISOString().split("T")[0];
      const { data: todayRecords } = await supabase
        .from("attendance_records")
        .select("record_type, recorded_at")
        .eq("user_id", user.id)
        .gte("recorded_at", `${today}T00:00:00`)
        .order("recorded_at", { ascending: false })
        .limit(1);

      const lastRecord = todayRecords?.[0];
      const newRecordType: "entrada" | "salida" =
        !lastRecord || lastRecord.record_type === "salida" ? "entrada" : "salida";

      const { error: insertError } = await supabase
        .from("attendance_records")
        .insert({
          user_id: user.id,
          location_id: locationId,
          qr_code_id: qrCodeId,
          record_type: newRecordType,
          recorded_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      setRecordType(newRecordType);
      setStatus("success");

      toast({
        title: `¡${newRecordType === "entrada" ? "Entrada" : "Salida"} registrada!`,
        description: `Tu ${newRecordType} ha sido registrada correctamente.`,
      });

      setTimeout(() => {
        setScanDialogOpen(false);
        setStatus("idle");
        setRecordType(null);
        fetchCurrentStatus();
      }, 2000);
    } catch (error) {
      console.error("Error recording attendance:", error);
      setStatus("error");
      toast({
        title: "Error",
        description: "No se pudo registrar la asistencia. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleDialogChange = (open: boolean) => {
    setScanDialogOpen(open);
    if (!open) {
      stopScanning();
      setStatus("idle");
      setRecordType(null);
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

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
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-lg border-b border-border safe-area-inset">
        <div className="px-4 h-14 flex items-center justify-between">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="w-9 h-9">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex gap-2">
            <Link to="/history">
              <Button variant="ghost" size="icon" className="w-9 h-9">
                <History className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="w-9 h-9" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 flex flex-col">
        {/* Greeting Section */}
        <div className="mb-8">
          <p className="text-muted-foreground text-sm">Bienvenido de vuelta</p>
          <h1 className="text-2xl font-bold">Hola, {firstName} 👋</h1>
        </div>

        {/* Status Card */}
        <Card className="glass-card mb-6">
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
                <div className="flex gap-4 pt-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{currentStatus.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Entrada: {currentStatus.entryTime}</span>
                  </div>
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

        {/* Spacer */}
        <div className="flex-1" />

        {/* FAB / Scan Button */}
        <div className="pb-8">
          <Button
            variant="hero"
            size="xl"
            className="w-full h-16 text-lg gap-3 shadow-lg"
            onClick={() => setScanDialogOpen(true)}
          >
            <ScanLine className="w-6 h-6" />
            Escanear QR
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-3">
            Escanea el código QR para {currentStatus.isWorking ? "marcar salida" : "marcar entrada"}
          </p>
        </div>
      </main>

      {/* Scan Dialog (Full Screen on Mobile) */}
      <Dialog open={scanDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-md h-[100dvh] sm:h-auto p-0 gap-0 border-0 sm:border sm:rounded-lg">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle className="text-center">Escanear Código QR</DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex flex-col p-4 space-y-4">
            {/* Scanner Container */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-foreground/5 max-w-sm mx-auto w-full">
              {status === "idle" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
                  <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center animate-pulse-glow">
                    <ScanLine className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Presiona para activar la cámara y escanear el código QR
                  </p>
                  <Button
                    variant="hero"
                    size="lg"
                    onClick={startScanning}
                    disabled={isInitializing}
                    className="mt-2"
                  >
                    {isInitializing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Iniciando...
                      </>
                    ) : (
                      <>
                        <ScanLine className="w-5 h-5" />
                        Activar Cámara
                      </>
                    )}
                  </Button>
                </div>
              )}

              {status === "scanning" && (
                <>
                  <div id="qr-reader-employee" className="w-full h-full" />
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-8 border-2 border-primary rounded-2xl">
                      <div className="absolute left-0 right-0 h-0.5 bg-primary animate-scan-line" />
                    </div>
                  </div>
                </>
              )}

              {status === "success" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-success/10 animate-scale-in">
                  <div className="w-24 h-24 rounded-full bg-success flex items-center justify-center animate-bounce">
                    <CheckCircle className="w-12 h-12 text-success-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-success">
                      ¡{recordType === "entrada" ? "Entrada" : "Salida"} registrada!
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date().toLocaleTimeString("es", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              )}

              {status === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-destructive/10 animate-scale-in p-6">
                  <div className="w-20 h-20 rounded-full bg-destructive flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-destructive-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-destructive">Error</p>
                    <p className="text-sm text-muted-foreground px-4">
                      Verifica los permisos de cámara en Ajustes → Safari → Cámara
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setStatus("idle")}
                    className="mt-2"
                  >
                    Reintentar
                  </Button>
                </div>
              )}
            </div>

            {/* Cancel Button */}
            {status === "scanning" && (
              <Button
                variant="outline"
                size="lg"
                className="w-full max-w-sm mx-auto"
                onClick={() => {
                  stopScanning();
                  setStatus("idle");
                }}
              >
                Cancelar
              </Button>
            )}

            {/* Instructions */}
            <div className="text-center text-xs text-muted-foreground max-w-sm mx-auto">
              Apunta la cámara hacia el código QR mostrado por el administrador
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employee;
