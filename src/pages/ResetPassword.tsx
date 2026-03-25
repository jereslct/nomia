import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Lock, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/routes";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updatePassword } = useAuth();
  const [isRecovery, setIsRecovery] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      setSuccess(true);
      toast({
        title: "¡Contraseña actualizada!",
        description: "Tu contraseña ha sido cambiada exitosamente.",
      });
      setTimeout(() => navigate(ROUTES.PANEL), 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen gradient-hero flex flex-col">
        <div className="p-4 shrink-0">
          <Link to={ROUTES.ACCESO} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio de sesión
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center px-5 py-4">
          <div className="w-full max-w-md space-y-5 animate-fade-in">
            <div className="text-center space-y-1.5">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-lg shadow-primary/25">
                <QrCode className="w-7 h-7 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">Enlace inválido</h1>
              <p className="text-muted-foreground text-sm">
                Este enlace de recuperación no es válido o ha expirado.
              </p>
            </div>
            <div className="text-center">
              <Button variant="hero" onClick={() => navigate(ROUTES.ACCESO)}>
                Ir a iniciar sesión
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center px-5">
        <div className="w-full max-w-md space-y-5 animate-fade-in text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h1 className="text-xl font-bold">¡Contraseña actualizada!</h1>
          <p className="text-muted-foreground text-sm">Redirigiendo al panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      <div className="p-4 shrink-0">
        <Link to={ROUTES.ACCESO} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio de sesión
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-4 sm:py-8">
        <div className="w-full max-w-md space-y-5 sm:space-y-8 animate-fade-in">
          <div className="text-center space-y-1.5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-lg shadow-primary/25">
              <QrCode className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">Nueva contraseña</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Ingresa tu nueva contraseña
            </p>
          </div>

          <Card className="glass-card border-border/50">
            <CardHeader className="space-y-1 pb-2 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="text-xl sm:text-2xl text-center">
                Restablecer contraseña
              </CardTitle>
              <CardDescription className="text-center text-xs sm:text-sm">
                Elige una nueva contraseña segura
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm">Nueva contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 h-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-sm">Confirmar contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 h-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    "Actualizar contraseña"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
