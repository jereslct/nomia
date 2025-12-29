import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Camera, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Html5Qrcode } from "html5-qrcode";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type ScanStatus = "idle" | "scanning" | "success" | "error";

const ScanQR = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [recordType, setRecordType] = useState<"entrada" | "salida" | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Cámara no disponible",
          description: "Tu navegador no soporta acceso a la cámara. Usa Safari o Chrome.",
          variant: "destructive",
        });
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err: any) {
      console.error("Camera permission error:", err);
      
      let errorMessage = "No se pudo acceder a la cámara.";
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage = "Permiso de cámara denegado. Ve a Ajustes > Safari > Cámara y permite el acceso.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "No se encontró ninguna cámara en tu dispositivo.";
      } else if (err.name === "NotReadableError") {
        errorMessage = "La cámara está siendo usada por otra aplicación.";
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
    
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      setIsInitializing(false);
      setStatus("error");
      return;
    }

    setStatus("scanning");

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const html5QrCode = new Html5Qrcode("qr-reader", {
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
        () => {}
      );
    } catch (err: any) {
      console.error("Error starting scanner:", err);
      setStatus("error");
      toast({
        title: "Error de escáner",
        description: "No se pudo iniciar el escáner. Verifica los permisos de cámara.",
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

    // Validate QR code format
    if (!result.startsWith("qrtime-")) {
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
      const { data: qrCode, error: qrError } = await supabase
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

      // Determine if this is entrada or salida based on last record
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

      // Insert attendance record
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
      
      // Navigate back after a delay
      setTimeout(() => {
        navigate("/dashboard");
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

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-bold text-lg">Escanear QR</h1>
            <p className="text-xs text-muted-foreground">Marca tu asistencia</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-md">
        <Card className="glass-card overflow-hidden">
          <CardHeader className="text-center">
            <CardTitle>Escanea el código QR</CardTitle>
            <CardDescription>
              Apunta la cámara hacia el código QR mostrado por el administrador
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Scanner Container */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-foreground/5">
              {status === "idle" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center">
                    <Camera className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center px-4">
                    Presiona el botón para activar la cámara
                  </p>
                </div>
              )}

              {status === "scanning" && (
                <>
                  <div id="qr-reader" className="w-full h-full" />
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-8 border-2 border-primary rounded-2xl">
                      <div className="absolute left-0 right-0 h-0.5 bg-primary animate-scan-line" />
                    </div>
                  </div>
                </>
              )}

              {status === "success" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-success/10 animate-scale-in">
                  <div className="w-20 h-20 rounded-full bg-success flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-success-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-success">
                      ¡{recordType === "entrada" ? "Entrada" : "Salida"} registrada!
                    </p>
                    <p className="text-sm text-muted-foreground">Redirigiendo...</p>
                  </div>
                </div>
              )}

              {status === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-destructive/10 animate-scale-in">
                  <div className="w-20 h-20 rounded-full bg-destructive flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-destructive-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-destructive">Error</p>
                    <p className="text-sm text-muted-foreground">Código inválido</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {status === "idle" && (
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  onClick={startScanning}
                  disabled={isInitializing}
                >
                  {isInitializing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Iniciando cámara...
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5" />
                      Activar Cámara
                    </>
                  )}
                </Button>
              )}

              {status === "scanning" && (
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full"
                  onClick={stopScanning}
                >
                  Cancelar
                </Button>
              )}

              {status === "error" && (
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  onClick={() => {
                    setStatus("idle");
                    setRecordType(null);
                  }}
                >
                  Intentar de nuevo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="mt-6 p-4 rounded-xl bg-muted/50">
          <h3 className="font-medium mb-2">Instrucciones:</h3>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Solicita al administrador que muestre el código QR</li>
            <li>Activa la cámara presionando el botón</li>
            <li>Apunta hacia el código QR</li>
            <li>Espera la confirmación del registro</li>
          </ol>
        </div>
      </main>
    </div>
  );
};

export default ScanQR;
