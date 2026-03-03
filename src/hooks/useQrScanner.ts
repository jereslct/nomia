import { useState, useRef, useEffect, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export type ScanStatus = "idle" | "scanning" | "success" | "error";

interface UseQrScannerOptions {
  elementId: string;
  onSuccess?: (recordType: "entrada" | "salida", message: string) => void;
  useBarCodeDetector?: boolean;
}

const friendlyErrorMessages: Record<string, { message: string; suggestion: string }> = {
  INVALID_FORMAT: { message: "Código QR no reconocido", suggestion: "Asegurate de escanear un código QR generado por tu administrador." },
  QR_EXPIRED: { message: "El código QR expiró", suggestion: "Pedí al administrador que genere un nuevo código QR." },
  QR_NOT_FOUND: { message: "Código QR no válido", suggestion: "Este código no existe en el sistema. Pedí al administrador que genere uno nuevo." },
  INVALID_SIGNATURE: { message: "Código QR no auténtico", suggestion: "El código no pasó la verificación de seguridad. Usá solo códigos generados desde la aplicación." },
  AUTH_REQUIRED: { message: "Sesión no iniciada", suggestion: "Cerrá sesión e ingresá de nuevo." },
  VALIDATION_FAILED: { message: "No se pudo validar el código", suggestion: "Intentá de nuevo. Si el problema persiste, contactá al administrador." },
  NETWORK_ERROR: { message: "Error de conexión", suggestion: "Verificá tu conexión a internet e intentá de nuevo." },
  USER_NOT_IN_ORG: { message: "No pertenecés a esta organización", suggestion: "Contactá a tu administrador para que te agregue a la organización." },
};

function getFriendlyError(code: string, fallbackMessage: string): string {
  const friendly = friendlyErrorMessages[code.split(":")[0]];
  if (friendly) return `${friendly.message}. ${friendly.suggestion}`;
  return fallbackMessage;
}

export function useQrScanner({ elementId, onSuccess, useBarCodeDetector = false }: UseQrScannerOptions) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [recordType, setRecordType] = useState<"entrada" | "salida" | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [reentryDialogOpen, setReentryDialogOpen] = useState(false);
  const [pendingQrCode, setPendingQrCode] = useState<string | null>(null);
  const [reentryInfo, setReentryInfo] = useState<{ entry_count: number; exit_count: number } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({ title: "Cámara no disponible", description: "Tu navegador no soporta acceso a la cámara.", variant: "destructive" });
        return false;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err: any) {
      let msg = "No se pudo acceder a la cámara.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Permiso de cámara denegado. Ve a Ajustes > Safari > Cámara y permite el acceso.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "No se encontró ninguna cámara en tu dispositivo.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        msg = "La cámara está siendo usada por otra aplicación.";
      } else if (err.name === "OverconstrainedError") {
        msg = "No se pudo configurar la cámara correctamente.";
      } else if (err.name === "SecurityError") {
        msg = "Acceso a cámara bloqueado. Asegúrate de usar HTTPS.";
      }
      toast({ title: "Error de cámara", description: msg, variant: "destructive" });
      return false;
    }
  };

  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch {}
    }
  }, []);

  const setError = useCallback((message: string, code: string = "") => {
    setErrorMessage(message);
    setErrorCode(code);
    setStatus("error");
  }, []);

  const validateQrScan = useCallback(async (qrCode: string, forceReentry: boolean = false) => {
    try {
      const response = await supabase.functions.invoke("validate-qr-scan", {
        body: { qr_code: qrCode, force_reentry: forceReentry },
      });

      const responseData = response.data || (response.error as any)?.context || response.error;
      const parsed = typeof responseData === "string"
        ? (() => { try { return JSON.parse(responseData); } catch { return null; } })()
        : responseData;

      if (parsed?.code === "REENTRY_CONFIRMATION_NEEDED") {
        setPendingQrCode(qrCode);
        setReentryInfo({ entry_count: parsed.entry_count, exit_count: parsed.exit_count });
        setReentryDialogOpen(true);
        return;
      }

      if (response.error && !parsed?.success) {
        const code = `NETWORK_ERROR: ${response.error.message || response.error}`;
        setError(getFriendlyError("NETWORK_ERROR", "Error de conexión con el servidor."), code);
        toast({ title: "Error de conexión", description: "Verificá tu conexión a internet e intentá de nuevo.", variant: "destructive" });
        return;
      }

      if (!parsed?.success) {
        const errorCode = parsed?.code || "VALIDATION_FAILED";
        const friendlyMsg = getFriendlyError(errorCode, parsed?.error || "Código inválido o expirado.");
        setError(friendlyMsg, errorCode);
        toast({ title: "Error", description: friendlyMsg, variant: "destructive" });
        return;
      }

      setRecordType(parsed.record_type);
      setStatus("success");
      toast({
        title: `¡${parsed.record_type === "entrada" ? "Entrada" : "Salida"} registrada!`,
        description: parsed.message,
      });

      onSuccess?.(parsed.record_type, parsed.message);
    } catch (err: any) {
      setError("Error inesperado.", `UNEXPECTED: ${err?.message}`);
      toast({ title: "Error", description: "Error inesperado.", variant: "destructive" });
    }
  }, [user, onSuccess, toast, setError]);

  const handleScanSuccess = useCallback(async (result: string) => {
    await stopScanning();

    if (!result.startsWith("nomia:")) {
      setError(getFriendlyError("INVALID_FORMAT", "Código QR no reconocido."), "INVALID_FORMAT");
      toast({ title: "Código no reconocido", description: "Asegurate de escanear un código QR generado por tu administrador.", variant: "destructive" });
      return;
    }

    if (!user) {
      setError("Debes iniciar sesión.", "AUTH_REQUIRED");
      return;
    }

    await validateQrScan(result, false);
  }, [user, stopScanning, validateQrScan, toast, setError]);

  const startScanning = useCallback(async () => {
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
      const opts: ConstructorParameters<typeof Html5Qrcode>[1] = { verbose: false };
      if (useBarCodeDetector) {
        (opts as any).experimentalFeatures = { useBarCodeDetectorIfSupported: true };
      }
      const html5QrCode = new Html5Qrcode(elementId, opts);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText) => handleScanSuccess(decodedText),
        () => {}
      );
    } catch {
      setStatus("error");
      toast({ title: "Error de escáner", description: "No se pudo iniciar el escáner.", variant: "destructive" });
    } finally {
      setIsInitializing(false);
    }
  }, [elementId, isInitializing, useBarCodeDetector, handleScanSuccess, toast]);

  const handleConfirmReentry = useCallback(async () => {
    setReentryDialogOpen(false);
    if (pendingQrCode) {
      setStatus("scanning");
      await validateQrScan(pendingQrCode, true);
      setPendingQrCode(null);
      setReentryInfo(null);
    }
  }, [pendingQrCode, validateQrScan]);

  const handleCancelReentry = useCallback(() => {
    setReentryDialogOpen(false);
    setPendingQrCode(null);
    setReentryInfo(null);
    setStatus("idle");
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setRecordType(null);
    setErrorMessage("");
    setErrorCode("");
  }, []);

  const copyErrorToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`Error: ${errorMessage}\nCódigo: ${errorCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [errorMessage, errorCode]);

  useEffect(() => {
    return () => { stopScanning(); };
  }, [stopScanning]);

  return {
    status,
    recordType,
    isInitializing,
    errorMessage,
    errorCode,
    copied,
    reentryDialogOpen,
    reentryInfo,
    startScanning,
    stopScanning,
    reset,
    setError,
    copyErrorToClipboard,
    handleConfirmReentry,
    handleCancelReentry,
  };
}
