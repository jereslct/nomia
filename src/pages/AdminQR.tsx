import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, RefreshCw, Clock, Copy, Check, Loader2 } from "lucide-react";
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
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
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
        generateNewQR(existingLocation.id);
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
        generateNewQR(newLocation.id);
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

  const generateNewQR = async (locId?: string) => {
    const targetLocationId = locId || locationId;
    if (!targetLocationId || !user) return;

    setIsGenerating(true);

    try {
      const newCode = `nomia-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

      // Insert new QR code
      const { error } = await supabase
        .from("qr_codes")
        .insert({
          location_id: targetLocationId,
          code: newCode,
          expires_at: expiresAt,
          created_by: user.id,
        });

      if (error) throw error;

      setQrValue(newCode);
      setTimeLeft(300);
    } catch (error) {
      console.error("Error generating QR:", error);
      // Fallback to local QR generation
      const newCode = `nomia-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setQrValue(newCode);
      setTimeLeft(300);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!qrValue) return;

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
  }, [qrValue, locationId]);

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
                  onClick={() => generateNewQR()}
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
