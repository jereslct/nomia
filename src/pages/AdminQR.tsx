import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, RefreshCw, Clock, Copy, Check, Loader2, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import QRCode from "react-qr-code";

const AdminQR = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [qrValue, setQrValue] = useState("");
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds now
  const [copied, setCopied] = useState(false);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/dashboard");
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      initializeLocation();
    }
  }, [user, isAdmin]);

  const initializeLocation = async () => {
    if (!user) return;

    try {
      // Try to get existing location
      const { data: existingLocation } = await supabase
        .from("locations")
        .select("id")
        .eq("created_by", user.id)
        .maybeSingle();

      if (existingLocation) {
        setLocationId(existingLocation.id);
        generateSecureQR(existingLocation.id);
      } else {
        // Create default location for this admin
        const { data: newLocation, error } = await supabase
          .from("locations")
          .insert({
            name: "Oficina Central",
            address: "Dirección principal",
            created_by: user.id,
          })
          .select("id")
          .single();

        if (error) throw error;
        
        setLocationId(newLocation.id);
        generateSecureQR(newLocation.id);
      }
    } catch (error) {
      console.error("Error initializing location:", error);
      toast({
        title: "Error",
        description: "No se pudo inicializar la ubicación.",
        variant: "destructive",
      });
    }
  };

  const generateSecureQR = async (locId?: string) => {
    const targetLocationId = locId || locationId;
    if (!targetLocationId || !user) return;

    setIsGenerating(true);

    try {
      // Call edge function to generate signed QR
      const { data, error } = await supabase.functions.invoke("generate-secure-qr", {
        body: { location_id: targetLocationId },
      });

      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }

      if (!data?.success || !data?.qr_code) {
        throw new Error(data?.error || "Failed to generate QR");
      }

      setQrValue(data.qr_code);
      setTimeLeft(30);

      toast({
        title: "QR Generado",
        description: "Código seguro con validez de 30 segundos.",
      });
    } catch (error: any) {
      console.error("Error generating secure QR:", error);
      toast({
        title: "Error",
        description: error?.message || "No se pudo generar el código QR seguro.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!qrValue) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          generateSecureQR();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [qrValue, locationId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    return `${secs}s`;
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
    if (timeLeft <= 10) return "text-destructive";
    if (timeLeft <= 20) return "text-warning";
    return "text-success";
  };

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
            <h1 className="font-bold text-lg">Código QR Seguro</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        <div className="space-y-6">
          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-success">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-medium">Código Firmado Criptográficamente</span>
          </div>

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
                {qrValue ? (
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
                ) : (
                  <div className="w-72 h-72 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={copyToClipboard}
                  disabled={!qrValue}
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
                  onClick={() => generateSecureQR()}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Regenerar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Seguridad Reforzada</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-success mt-2" />
                  El código se regenera cada 30 segundos para máxima seguridad
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-success mt-2" />
                  Firmado digitalmente - imposible de falsificar o compartir
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-success mt-2" />
                  Validación backend estricta rechaza códigos expirados
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
