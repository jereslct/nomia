import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, RefreshCw, Clock, MapPin, Copy, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import QRCode from "react-qr-code";

const AdminQR = () => {
  const { toast } = useToast();
  const [qrValue, setQrValue] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [copied, setCopied] = useState(false);

  const generateNewQR = () => {
    const newValue = `qrtime-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setQrValue(newValue);
    setTimeLeft(300);
  };

  useEffect(() => {
    generateNewQR();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          generateNewQR();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrValue);
    setCopied(true);
    toast({
      title: "Copiado",
      description: "Código copiado al portapapeles",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const getTimeColor = () => {
    if (timeLeft <= 60) return "text-destructive";
    if (timeLeft <= 120) return "text-warning";
    return "text-success";
  };

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
            <h1 className="font-bold text-lg">Código QR</h1>
            <p className="text-xs text-muted-foreground">Muestra esto a los empleados</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        <div className="space-y-6">
          {/* QR Card */}
          <Card className="glass-card overflow-hidden">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">Código de Asistencia</CardTitle>
              <CardDescription>
                Los empleados deben escanear este código para registrar su asistencia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* QR Code Display */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="bg-card p-6 rounded-3xl shadow-xl animate-pulse-glow">
                    <QRCode
                      value={qrValue}
                      size={280}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      bgColor="hsl(var(--card))"
                      fgColor="hsl(var(--foreground))"
                    />
                  </div>
                  {/* Timer Badge */}
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-card shadow-lg border border-border flex items-center gap-2 ${getTimeColor()}`}>
                    <Clock className="w-4 h-4" />
                    <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
                  </div>
                </div>
              </div>

              {/* Location Info */}
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Oficina Central</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar código
                    </>
                  )}
                </Button>
                <Button 
                  variant="hero" 
                  className="flex-1"
                  onClick={generateNewQR}
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="glass-card">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-primary">12</p>
                <p className="text-sm text-muted-foreground">Escaneos hoy</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-accent">3</p>
                <p className="text-sm text-muted-foreground">Pendientes</p>
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Información</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  El código se regenera automáticamente cada 5 minutos
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  Cada escaneo registra entrada o salida según corresponda
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  Los registros se guardan en tiempo real
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminQR;
