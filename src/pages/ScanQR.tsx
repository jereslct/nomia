import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Camera, CheckCircle, XCircle, Loader2, Copy, Check, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQrScanner } from "@/hooks/useQrScanner";

const ScanQR = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const scanner = useQrScanner({
    elementId: "qr-reader",
    onSuccess: () => {
      setTimeout(() => navigate("/dashboard"), 3000);
    },
  });

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/dashboard"><Button variant="ghost" size="icon" aria-label="Volver"><ArrowLeft className="w-5 h-5" /></Button></Link>
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
              {scanner.status === "idle" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center">
                    <Camera className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center px-4">Presiona el botón para activar la cámara</p>
                </div>
              )}
              {scanner.status === "scanning" && (
                <>
                  <div id="qr-reader" className="w-full h-full" />
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-8 border-2 border-primary rounded-2xl">
                      <div className="absolute left-0 right-0 h-0.5 bg-primary animate-scan-line" />
                    </div>
                  </div>
                </>
              )}
              {scanner.status === "success" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-success/10 animate-scale-in">
                  <div className="w-20 h-20 rounded-full bg-success flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-success-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-success">¡{scanner.recordType === "entrada" ? "Entrada" : "Salida"} registrada!</p>
                    <p className="text-sm text-muted-foreground">Redirigiendo...</p>
                  </div>
                </div>
              )}
              {scanner.status === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-destructive/10 animate-scale-in p-4">
                  <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-destructive-foreground" />
                  </div>
                  <div className="text-center w-full">
                    <p className="font-semibold text-destructive mb-1">Error</p>
                    <p className="text-xs text-muted-foreground mb-2 px-2 line-clamp-2">{scanner.errorMessage || "Código inválido"}</p>
                    {scanner.errorCode && (
                      <div className="bg-destructive/20 rounded-lg p-2 mx-2">
                        <p className="text-[10px] text-destructive font-mono break-all mb-2">{scanner.errorCode}</p>
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={scanner.copyErrorToClipboard} aria-label="Copiar código de error">
                          {scanner.copied ? <><Check className="w-3 h-3 mr-1" />Copiado</> : <><Copy className="w-3 h-3 mr-1" />Copiar</>}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {scanner.status === "idle" && (
                <Button variant="hero" size="lg" className="w-full" onClick={scanner.startScanning} disabled={scanner.isInitializing}>
                  {scanner.isInitializing ? <><Loader2 className="w-5 h-5 animate-spin" />Iniciando...</> : <><Camera className="w-5 h-5" />Activar Cámara</>}
                </Button>
              )}
              {scanner.status === "scanning" && <Button variant="outline" size="lg" className="w-full" onClick={scanner.stopScanning}>Cancelar</Button>}
              {scanner.status === "error" && (
                <Button variant="hero" size="lg" className="w-full" onClick={scanner.reset}>
                  Intentar de nuevo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

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

export default ScanQR;
