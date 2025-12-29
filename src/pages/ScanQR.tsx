import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Camera, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Html5Qrcode } from "html5-qrcode";

type ScanStatus = "idle" | "scanning" | "success" | "error";

const ScanQR = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [scanResult, setScanResult] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const startScanning = async () => {
    if (scannerRef.current || isInitializing) return;
    
    setIsInitializing(true);
    setStatus("scanning");

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // QR code scanned successfully
          handleScanSuccess(decodedText);
        },
        () => {
          // QR code scanning error (this is called frequently while scanning)
        }
      );
    } catch (err) {
      console.error("Error starting scanner:", err);
      setStatus("error");
      toast({
        title: "Error de cámara",
        description: "No se pudo acceder a la cámara. Verifica los permisos.",
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
    setScanResult(result);
    setStatus("success");

    // Validate QR code format
    if (result.startsWith("qrtime-")) {
      toast({
        title: "¡Registro exitoso!",
        description: "Tu asistencia ha sido registrada correctamente.",
      });
      
      // Navigate back after a delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } else {
      setStatus("error");
      toast({
        title: "Código inválido",
        description: "Este código QR no es válido para registrar asistencia.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

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
                    <p className="font-semibold text-success">¡Registro exitoso!</p>
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

              {(status === "error") && (
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  onClick={() => {
                    setStatus("idle");
                    setScanResult(null);
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
