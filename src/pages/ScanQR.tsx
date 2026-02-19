import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Camera, CheckCircle, XCircle, Loader2, Copy, Check, Shield } from "lucide-react";
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
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [errorCode, setErrorCode] = useState<string>("");
  const [copied, setCopied] = useState(false);

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
          description: "Tu navegador no soporta acceso a la cámara.",
          variant: "destructive",
        });
        return false;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err: any) {
      toast({
        title: "Error de cámara",
        description: "No se pudo acceder a la cámara.",
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
      const html5QrCode = new Html5Qrcode("qr-reader", { verbose: false });
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText) => handleScanSuccess(decodedText),
        () => {}
      );
    } catch (err) {
      setStatus("error");
      toast({ title: "Error de escáner", description: "No se pudo iniciar el escáner.", variant: "destructive" });
    } finally {
      setIsInitializing(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {}
    }
  };

  const setError = (message: string, code: string) => {
    setErrorMessage(message);
    setErrorCode(code);
    setStatus("error");
  };

  const copyErrorToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`Error: ${errorMessage}\nCódigo: ${errorCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleScanSuccess = async (result: string) => {
    await stopScanning();

    // Validate format: new secure format starts with "nomia:"
    if (!result.startsWith("nomia:")) {
      setError("Código QR no reconocido. Usa el formato seguro.", "INVALID_FORMAT");
      toast({ title: "Código inválido", description: "Formato no reconocido.", variant: "destructive" });
      return;
    }

    if (!user) {
      setError("Debes iniciar sesión.", "AUTH_REQUIRED");
      return;
    }

    try {
      // Call edge function for backend validation
      const { data, error } = await supabase.functions.invoke("validate-qr-scan", {
        body: { qr_code: result },
      });

      if (error) {
        setError("Error de conexión con el servidor.", `NETWORK_ERROR: ${error.message}`);
        toast({ title: "Error", description: "No se pudo validar el código.", variant: "destructive" });
        return;
      }

      if (!data?.success) {
        setError(data?.error || "Código inválido o expirado.", data?.code || "VALIDATION_FAILED");
        toast({ title: "Error", description: data?.error || "Validación fallida.", variant: "destructive" });
        return;
      }

      setRecordType(data.record_type);
      setStatus("success");
      toast({
        title: `¡${data.record_type === "entrada" ? "Entrada" : "Salida"} registrada!`,
        description: data.message,
      });

      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err: any) {
      setError("Error inesperado.", `UNEXPECTED: ${err?.message}`);
      toast({ title: "Error", description: "Error inesperado.", variant: "destructive" });
    }
  };

  useEffect(() => {
    return () => { stopScanning(); };
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div>
            <h1 className="font-bold text-lg">Escanear QR</h1>
            <p className="text-xs text-muted-foreground">Validación segura en backend</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-md">
        <Card className="glass-card overflow-hidden">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 text-success mb-2">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-medium">Validación Criptográfica</span>
            </div>
            <CardTitle>Escanea el código QR</CardTitle>
            <CardDescription>Apunta la cámara hacia el código QR del administrador</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-foreground/5">
              {status === "idle" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center">
                    <Camera className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center px-4">Presiona el botón para activar la cámara</p>
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
                    <p className="font-semibold text-success">¡{recordType === "entrada" ? "Entrada" : "Salida"} registrada!</p>
                    <p className="text-sm text-muted-foreground">Redirigiendo...</p>
                  </div>
                </div>
              )}
              {status === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-destructive/10 animate-scale-in p-4">
                  <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-destructive-foreground" />
                  </div>
                  <div className="text-center w-full">
                    <p className="font-semibold text-destructive mb-1">Error</p>
                    <p className="text-xs text-muted-foreground mb-2 px-2 line-clamp-2">{errorMessage || "Código inválido"}</p>
                    {errorCode && (
                      <div className="bg-destructive/20 rounded-lg p-2 mx-2">
                        <p className="text-[10px] text-destructive font-mono break-all mb-2">{errorCode}</p>
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={copyErrorToClipboard}>
                          {copied ? <><Check className="w-3 h-3 mr-1" />Copiado</> : <><Copy className="w-3 h-3 mr-1" />Copiar</>}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {status === "idle" && (
                <Button variant="hero" size="lg" className="w-full" onClick={startScanning} disabled={isInitializing}>
                  {isInitializing ? <><Loader2 className="w-5 h-5 animate-spin" />Iniciando...</> : <><Camera className="w-5 h-5" />Activar Cámara</>}
                </Button>
              )}
              {status === "scanning" && <Button variant="outline" size="lg" className="w-full" onClick={stopScanning}>Cancelar</Button>}
              {status === "error" && (
                <Button variant="hero" size="lg" className="w-full" onClick={() => { setStatus("idle"); setErrorMessage(""); setErrorCode(""); }}>
                  Intentar de nuevo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ScanQR;
